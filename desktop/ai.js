// Ask AI — the main-process half of "Explain this" in the context panel.
//
// The page builds the question: the words she highlighted, the paragraph
// around them, and short excerpts from lessons she has already read
// (src/lib/askAi.ts). This file only holds the key and makes the call, so the
// key never enters the page, and it checks every request before it spends
// anything: a known shape, a sensible size, a capped answer length.
//
// The SDK is bundled into desktop/vendor/ by scripts/vendor-sdk.mjs (run by
// `npm run build:bundle`), because the shell ships without node_modules. A
// shell run without that step still starts; Ask AI then reports itself
// unavailable instead of taking the app down with it.

export const AI_MODEL_RE = /^claude-[a-z0-9][a-z0-9.-]{1,60}$/
const EFFORTS = new Set(['low', 'medium', 'high'])
const ROLES = new Set(['user', 'assistant'])
export const MAX_REQUEST_CHARS = 120_000
export const MAX_ANSWER_TOKENS = 2048
const MAX_TURNS = 16
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/

/**
 * @typedef {{ id: string, model: string, effort: 'low' | 'medium' | 'high', maxTokens: number,
 *   system: string, messages: { role: 'user' | 'assistant', content: string }[] }} AiRequest
 * @typedef {{ id: string, text?: string, done?: boolean, stopReason?: string | null, error?: string, code?: string }} AiEvent
 */

/**
 * @param {unknown} raw
 * @returns {{ ok: true, value: AiRequest } | { ok: false, error: string }}
 */
export function validateRequest(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Empty request.' }
  const r = /** @type {Record<string, unknown>} */ (raw)
  if (typeof r.id !== 'string' || !ID_RE.test(r.id)) return { ok: false, error: 'Bad request id.' }
  if (typeof r.model !== 'string' || !AI_MODEL_RE.test(r.model)) return { ok: false, error: 'Unknown model.' }
  const effort = r.effort === undefined ? 'low' : r.effort
  if (typeof effort !== 'string' || !EFFORTS.has(effort)) return { ok: false, error: 'Unknown effort.' }
  const maxTokens = r.maxTokens === undefined ? 1024 : r.maxTokens
  if (typeof maxTokens !== 'number' || !Number.isInteger(maxTokens) || maxTokens < 64 || maxTokens > MAX_ANSWER_TOKENS) {
    return { ok: false, error: 'Answer length out of range.' }
  }
  if (typeof r.system !== 'string' || !r.system.trim()) return { ok: false, error: 'Missing instructions.' }
  if (!Array.isArray(r.messages) || r.messages.length === 0 || r.messages.length > MAX_TURNS) {
    return { ok: false, error: 'Bad conversation.' }
  }
  let size = r.system.length
  const messages = []
  for (const [i, m] of r.messages.entries()) {
    if (!m || typeof m !== 'object' || !ROLES.has(m.role) || typeof m.content !== 'string' || !m.content.trim()) {
      return { ok: false, error: 'Bad conversation.' }
    }
    // Turns alternate and start and end with her, which is what the API requires.
    if ((i % 2 === 0) !== (m.role === 'user')) return { ok: false, error: 'Bad conversation.' }
    size += m.content.length
    messages.push({ role: m.role, content: m.content })
  }
  if (messages[messages.length - 1].role !== 'user') return { ok: false, error: 'Bad conversation.' }
  if (size > MAX_REQUEST_CHARS) return { ok: false, error: 'That question carries too much text.' }
  return { ok: true, value: { id: r.id, model: r.model, effort, maxTokens, system: r.system, messages } }
}

/** The bundled SDK's default export, or null when this shell was run without it. */
async function loadBundledSdk() {
  try {
    const mod = await import('./vendor/anthropic-sdk.mjs')
    return mod.default ?? null
  } catch {
    return null
  }
}

/**
 * A sentence she can act on, from whichever SDK error it was. Typed checks, in
 * order from most to least specific, never the message text.
 * @returns {{ error: string, code: string } | null} null for a cancel
 */
export function describeError(Anthropic, err) {
  if (Anthropic && err instanceof Anthropic.APIUserAbortError) return null
  if (Anthropic && err instanceof Anthropic.AuthenticationError) {
    return { code: 'key', error: 'Anthropic turned the key down. Check it in Settings → Ask AI.' }
  }
  if (Anthropic && err instanceof Anthropic.PermissionDeniedError) {
    return { code: 'key', error: 'This key is not allowed to use that model. Check the key in Settings → Ask AI.' }
  }
  if (Anthropic && err instanceof Anthropic.RateLimitError) {
    return { code: 'busy', error: 'Too many questions in a short time. Wait a minute and ask again.' }
  }
  if (Anthropic && err instanceof Anthropic.APIConnectionTimeoutError) {
    return { code: 'offline', error: 'Anthropic took too long to answer. Try again in a moment.' }
  }
  if (Anthropic && err instanceof Anthropic.APIConnectionError) {
    return { code: 'offline', error: 'Could not reach Anthropic. Is the Mac online?' }
  }
  if (Anthropic && err instanceof Anthropic.InternalServerError) {
    return { code: 'busy', error: 'Anthropic is busy right now. Try again in a moment.' }
  }
  if (Anthropic && err instanceof Anthropic.BadRequestError) {
    return { code: 'request', error: `Anthropic could not take that question: ${err.message}` }
  }
  if (Anthropic && err instanceof Anthropic.APIError) {
    return { code: 'api', error: `Anthropic answered with an error (${err.status ?? 'no status'}).` }
  }
  return { code: 'unknown', error: err instanceof Error && err.message ? err.message : 'Something went wrong.' }
}

/**
 * @param {{
 *   getKey: () => Promise<string | null>,
 *   loadSdk?: () => Promise<any>,
 *   log?: (...a: unknown[]) => void,
 * }} opts
 */
export function createAi({ getKey, loadSdk = loadBundledSdk, log = () => {} }) {
  /** @type {Map<string, AbortController>} */
  const running = new Map()
  let sdk

  return {
    async available() {
      sdk ??= await loadSdk()
      return !!sdk
    },

    /**
     * Streams one answer. Resolves when it is finished, failed or cancelled;
     * every outcome is reported through `emit`, never thrown.
     * @param {unknown} raw
     * @param {(event: AiEvent) => void} emit
     */
    async explain(raw, emit) {
      const checked = validateRequest(raw)
      const id = raw && typeof raw === 'object' && typeof raw.id === 'string' && ID_RE.test(raw.id) ? raw.id : 'invalid'
      if (!checked.ok) return emit({ id, done: true, code: 'request', error: checked.error })
      const req = checked.value

      sdk ??= await loadSdk()
      const Anthropic = sdk
      if (!Anthropic) return emit({ id, done: true, code: 'unavailable', error: 'Ask AI is not part of this copy of the app.' })
      const key = await getKey()
      if (!key) return emit({ id, done: true, code: 'nokey', error: 'Add an Anthropic API key in Settings → Ask AI first.' })

      running.get(id)?.abort()
      const controller = new AbortController()
      running.set(id, controller)
      try {
        const client = new Anthropic({ apiKey: key, maxRetries: 1, timeout: 60_000 })
        const stream = client.messages.stream(
          {
            model: req.model,
            max_tokens: req.maxTokens,
            system: req.system,
            messages: req.messages,
            // Speed over depth: a short explanation of something she has just
            // read does not need a long think first.
            thinking: { type: 'disabled' },
            output_config: { effort: req.effort },
          },
          { signal: controller.signal },
        )
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') emit({ id, text: event.delta.text })
        }
        const final = await stream.finalMessage()
        emit({ id, done: true, stopReason: final.stop_reason ?? null })
      } catch (err) {
        const described = describeError(Anthropic, err)
        if (!described) return emit({ id, done: true, code: 'cancelled' })
        log('ask-ai failed:', described.code, err instanceof Error ? err.message : String(err))
        emit({ id, done: true, ...described })
      } finally {
        if (running.get(id) === controller) running.delete(id)
      }
    },

    /** @param {unknown} id */
    cancel(id) {
      if (typeof id !== 'string') return
      running.get(id)?.abort()
      running.delete(id)
    },

    cancelAll() {
      for (const c of running.values()) c.abort()
      running.clear()
    },
  }
}
