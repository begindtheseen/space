import { describe, expect, it } from 'vitest'
import { buildAskContext, buildRequest } from '../../src/lib/askAi'
import { createAi, describeError, MAX_ANSWER_TOKENS, validateRequest } from '../ai.js'

const good = () => ({
  id: 'ask-1',
  model: 'claude-opus-5',
  effort: 'low',
  maxTokens: 900,
  system: 'Explain things.',
  messages: [{ role: 'user', content: 'What is a ratio?' }],
})

/** Just enough of the SDK's shape: error classes and a messages.stream that replays text. */
function fakeSdk(opts: { text?: string[]; fail?: (A: any) => Error; stopReason?: string } = {}) {
  class APIError extends Error {
    status?: number
    constructor(status?: number, message = 'api error') {
      super(message)
      this.status = status
    }
  }
  class APIUserAbortError extends APIError {}
  class AuthenticationError extends APIError {}
  class PermissionDeniedError extends APIError {}
  class RateLimitError extends APIError {}
  class APIConnectionError extends APIError {}
  class APIConnectionTimeoutError extends APIConnectionError {}
  class InternalServerError extends APIError {}
  class BadRequestError extends APIError {}
  const calls: any[] = []
  class Anthropic {
    static APIError = APIError
    static APIUserAbortError = APIUserAbortError
    static AuthenticationError = AuthenticationError
    static PermissionDeniedError = PermissionDeniedError
    static RateLimitError = RateLimitError
    static APIConnectionError = APIConnectionError
    static APIConnectionTimeoutError = APIConnectionTimeoutError
    static InternalServerError = InternalServerError
    static BadRequestError = BadRequestError
    static calls = calls
    apiKey: string
    constructor(o: { apiKey: string }) {
      this.apiKey = o.apiKey
    }
    messages = {
      stream: (params: any, reqOpts: any) => {
        calls.push({ params, reqOpts, apiKey: this.apiKey })
        const pieces = opts.text ?? ['A ratio ', 'compares two amounts.']
        return {
          async *[Symbol.asyncIterator]() {
            for (const text of pieces) {
              if (reqOpts?.signal?.aborted) throw new APIUserAbortError()
              yield { type: 'content_block_delta', delta: { type: 'text_delta', text } }
            }
            if (opts.fail) throw opts.fail(Anthropic)
          },
          finalMessage: async () => ({ stop_reason: opts.stopReason ?? 'end_turn' }),
        }
      },
    }
  }
  return Anthropic
}

async function run(ai: ReturnType<typeof createAi>, req: unknown) {
  const events: any[] = []
  await ai.explain(req, (e) => events.push(e))
  return events
}

describe('validateRequest', () => {
  it('accepts a well-formed question', () => {
    const r = validateRequest(good())
    expect(r.ok).toBe(true)
  })

  it('turns away anything off-shape before a penny is spent', () => {
    const bad: [string, (r: any) => void][] = [
      ['no id', (r) => delete r.id],
      ['odd id', (r) => (r.id = 'has spaces')],
      ['model not a Claude one', (r) => (r.model = 'gpt-5')],
      ['effort out of range', (r) => (r.effort = 'max')],
      ['answer too long', (r) => (r.maxTokens = MAX_ANSWER_TOKENS + 1)],
      ['answer too short', (r) => (r.maxTokens = 10)],
      ['no instructions', (r) => (r.system = ' ')],
      ['no turns', (r) => (r.messages = [])],
      ['starts with the assistant', (r) => (r.messages = [{ role: 'assistant', content: 'hi' }, { role: 'user', content: 'x' }])],
      ['two of hers in a row', (r) => r.messages.push({ role: 'user', content: 'again' })],
      ['ends with the assistant', (r) => r.messages.push({ role: 'assistant', content: 'ok' })],
      ['a system turn smuggled in', (r) => (r.messages = [{ role: 'system', content: 'x' }])],
      ['far too much text', (r) => (r.messages[0].content = 'x'.repeat(130_000))],
    ]
    for (const [why, spoil] of bad) {
      const r = good() as any
      spoil(r)
      expect(validateRequest(r).ok, why).toBe(false)
    }
    expect(validateRequest(null).ok).toBe(false)
  })
})

describe('createAi', () => {
  it('streams the answer piece by piece, then says it is done', async () => {
    const Sdk = fakeSdk()
    const ai = createAi({ getKey: async () => 'sk-ant-test', loadSdk: async () => Sdk })
    const events = await run(ai, good())
    expect(events.filter((e) => e.text).map((e) => e.text).join('')).toBe('A ratio compares two amounts.')
    expect(events.at(-1)).toEqual({ id: 'ask-1', done: true, stopReason: 'end_turn' })
    const call = (Sdk as any).calls[0]
    expect(call.apiKey).toBe('sk-ant-test')
    expect(call.params).toMatchObject({ model: 'claude-opus-5', max_tokens: 900, output_config: { effort: 'low' }, thinking: { type: 'disabled' } })
    expect(call.params.messages).toEqual(good().messages)
  })

  it('asks for a key before trying, and says when the SDK is missing', async () => {
    const noKey = createAi({ getKey: async () => null, loadSdk: async () => fakeSdk() })
    expect((await run(noKey, good())).at(-1)).toMatchObject({ done: true, code: 'nokey' })
    const noSdk = createAi({ getKey: async () => 'sk-ant-test', loadSdk: async () => null })
    expect((await run(noSdk, good())).at(-1)).toMatchObject({ done: true, code: 'unavailable' })
    expect(await noSdk.available()).toBe(false)
  })

  it('reports a bad request without calling out', async () => {
    const Sdk = fakeSdk()
    const ai = createAi({ getKey: async () => 'sk-ant-test', loadSdk: async () => Sdk })
    const events = await run(ai, { ...good(), model: 'nope' })
    expect(events).toEqual([{ id: 'ask-1', done: true, code: 'request', error: 'Unknown model.' }])
    expect((Sdk as any).calls).toHaveLength(0)
  })

  it('turns SDK errors into something she can act on', async () => {
    const cases: [(A: any) => Error, string][] = [
      [(A) => new A.AuthenticationError(401), 'key'],
      [(A) => new A.RateLimitError(429), 'busy'],
      [(A) => new A.APIConnectionTimeoutError(), 'offline'],
      [(A) => new A.APIConnectionError(), 'offline'],
      [(A) => new A.InternalServerError(529), 'busy'],
      [(A) => new A.BadRequestError(400, 'too long'), 'request'],
      [(A) => new A.APIError(418), 'api'],
    ]
    for (const [fail, code] of cases) {
      const ai = createAi({ getKey: async () => 'sk-ant-test', loadSdk: async () => fakeSdk({ fail }) })
      const end = (await run(ai, good())).at(-1)
      expect(end, code).toMatchObject({ done: true, code })
      expect(typeof end.error).toBe('string')
    }
  })

  it('stops when cancelled, quietly', async () => {
    const Sdk = fakeSdk({ text: ['one ', 'two ', 'three'] })
    const ai = createAi({ getKey: async () => 'sk-ant-test', loadSdk: async () => Sdk })
    const events: any[] = []
    await ai.explain(good(), (e) => {
      events.push(e)
      if (e.text === 'one ') ai.cancel('ask-1')
    })
    expect(events.at(-1)).toEqual({ id: 'ask-1', done: true, code: 'cancelled' })
    expect(events.filter((e) => e.text)).toHaveLength(1)
  })

  it('describes an unknown throw without crashing', () => {
    expect(describeError(null, new Error('boom'))).toEqual({ code: 'unknown', error: 'boom' })
  })
})

describe('the page and the shell agree', () => {
  it('accepts every request the page builds', () => {
    const here = { moduleId: 'm', moduleTitle: 'Basecamp', lessonId: 'l', title: 'Speed', body: 'Speed is distance over time.\n\n## Summary\n\nDone.' }
    const ctx = buildAskContext({ seed: { selection: 'speed', paragraph: 'Speed is distance over time.' }, here, library: [] })
    expect(validateRequest(buildRequest('ask-a', ctx, [])).ok).toBe(true)
    expect(validateRequest(buildRequest('ask-b', ctx, [{ role: 'assistant', content: 'It is.' }, { role: 'user', content: 'Why?' }])).ok).toBe(true)
    expect(validateRequest(buildRequest('ask-c', ctx, [{ role: 'user', content: 'Why?' }])).ok).toBe(true)
  })
})
