/* ============================================================================
   ORBIT — Ask AI, in the context panel
   ----------------------------------------------------------------------------
   Opens where a context note opens, with the answer streaming in as it is
   written: the first words land within a second or two, which is the whole
   point — a question that takes ten seconds to answer has already broken the
   reading. Under the answer, the lessons it was built on, and a box for a
   follow-up. The question is put together in src/lib/askAi.ts; the call is
   made by the Mac app, which holds the key.
   ========================================================================== */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconArrowRight, IconSpark, IconX } from '@/components/icons'
import { Button } from '@/components/ui'
import { useLearner } from '@/hooks/useLearner'
import { buildAskContext, buildRequest, streamAnswer, type AskContext, type AskSeed, type LibraryLesson } from '@/lib/askAi'
import { libraryKeys, loadLibrary } from '@/lib/askLibrary'
import { claimCtx, holdCtxOpen, onCtxClaimed } from '@/lib/ctxBus'
import { Markdown } from '@/lib/markdown'
import { navigate } from '@/lib/router'
import './context-panel.css'

type Turn = { role: 'user' | 'assistant'; content: string }
type Phase = 'gathering' | 'streaming' | 'done' | 'error'

/** What to ask again after a failure: everything up to her last turn, without a half-written answer. */
export function retryHistory(turns: Turn[]): Turn[] {
  const kept = turns.filter((t) => t.content)
  while (kept.length && kept[kept.length - 1]!.role === 'assistant') kept.pop()
  return kept
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s)

/** Plain-language wording for how an answer ended badly, and whether Settings can fix it. */
function failure(code: string | undefined, error: string | undefined): { text: string; settings: boolean } {
  if (code === 'nokey') return { text: 'Ask AI needs an Anthropic API key before it can answer. It takes a minute to add one.', settings: true }
  if (code === 'key') return { text: error ?? 'The API key was turned down.', settings: true }
  return { text: error ?? 'Something went wrong. Try again in a moment.', settings: false }
}

export function AskPanel({ seed, here, onClose }: { seed: AskSeed; here: LibraryLesson; onClose: () => void }) {
  const { state } = useLearner()
  const [phase, setPhase] = useState<Phase>('gathering')
  const [turns, setTurns] = useState<Turn[]>([])
  const [ctx, setCtx] = useState<AskContext | null>(null)
  const [problem, setProblem] = useState<{ text: string; settings: boolean } | null>(null)
  const [draft, setDraft] = useState('')
  const cancelRef = useRef<() => void>(() => {})
  const ref = useRef<HTMLElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  // Read once per question: finishing a lesson mid-answer should not restart it.
  const stateRef = useRef(state)
  stateRef.current = state

  useLayoutEffect(() => {
    claimCtx('ai')
    return holdCtxOpen()
  }, [])
  useEffect(() => onCtxClaimed('ai', onClose), [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /** Streams the next answer onto `history` (which ends with her turn, or is empty for the first question). */
  const ask = useCallback((context: AskContext, history: Turn[]) => {
    cancelRef.current()
    setProblem(null)
    setPhase('streaming')
    setTurns([...history, { role: 'assistant', content: '' }])
    const { done, cancel } = streamAnswer(
      (id) => buildRequest(id, context, history),
      (text) =>
        setTurns((t) => {
          const last = t[t.length - 1]
          return last?.role === 'assistant' ? [...t.slice(0, -1), { role: 'assistant', content: last.content + text }] : t
        }),
    )
    cancelRef.current = cancel
    void done.then((end) => {
      if (end.code === 'cancelled') {
        setPhase('done')
        return
      }
      if (end.error) {
        setProblem(failure(end.code, end.error))
        setPhase('error')
        // Drop an empty answer bubble so the error is the last thing she sees.
        setTurns((t) => (t[t.length - 1]?.role === 'assistant' && !t[t.length - 1]!.content ? t.slice(0, -1) : t))
        return
      }
      if (end.stopReason === 'refusal') {
        setProblem({ text: 'Ask AI would not answer that one. Try highlighting a different part.', settings: false })
      }
      setPhase('done')
    })
  }, [])

  // A new highlight starts over: gather what she has read, then ask.
  useEffect(() => {
    let alive = true
    setPhase('gathering')
    setTurns([])
    setCtx(null)
    setProblem(null)
    ref.current?.scrollTo({ top: 0 })
    ref.current?.focus({ preventScroll: true })
    const keys = libraryKeys(stateRef.current, { moduleId: here.moduleId, lessonId: here.lessonId })
    void loadLibrary(keys).then((library) => {
      if (!alive) return
      const context = buildAskContext({ seed, here, library })
      setCtx(context)
      ask(context, [])
    })
    return () => {
      alive = false
      cancelRef.current()
    }
  }, [seed, here, ask])

  useEffect(() => {
    if (phase === 'streaming') endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [turns, phase])

  const sendFollowUp = () => {
    const q = draft.trim()
    if (!q || !ctx || phase === 'streaming' || phase === 'gathering') return
    setDraft('')
    ask(ctx, [...turns.filter((t) => t.content), { role: 'user', content: q }])
  }

  const busy = phase === 'streaming' || phase === 'gathering'

  return createPortal(
    <aside className="ctx-panel ask" role="dialog" aria-modal="false" aria-labelledby="ask-title" tabIndex={-1} ref={ref}>
      <div className="ctx-panel__head">
        <div style={{ minWidth: 0 }}>
          <div className="ctx-panel__kicker">
            <IconSpark size={12} /> Ask AI
          </div>
          <h2 className="ctx-panel__title ask__title" id="ask-title">
            “{clip(seed.selection.replace(/\s+/g, ' ').trim(), 90)}”
          </h2>
        </div>
        <button type="button" className="ctx-panel__close" onClick={onClose} aria-label="Close Ask AI">
          <IconX size={15} />
        </button>
      </div>

      <div className="ask__thread" aria-live="polite" aria-busy={busy}>
        {phase === 'gathering' ? <p className="ask__status">Looking through what you have already learned…</p> : null}
        {turns.map((t, i) =>
          t.role === 'user' ? (
            <p key={i} className="ask__q">
              {t.content}
            </p>
          ) : t.content ? (
            <Markdown key={i} className="ctx-panel__body ask__a">
              {t.content}
            </Markdown>
          ) : phase === 'streaming' && i === turns.length - 1 ? (
            <p key={i} className="ask__status">
              Thinking it through…
            </p>
          ) : null,
        )}
        {phase === 'streaming' ? <span className="ask__caret" aria-hidden="true" /> : null}
        <div ref={endRef} />
      </div>

      {problem ? (
        <div className="ask__problem" role="alert">
          <p>{problem.text}</p>
          {problem.settings ? (
            <Button variant="primary" size="sm" onClick={() => navigate('/settings')}>
              Open Settings <IconArrowRight size={13} />
            </Button>
          ) : ctx ? (
            <Button variant="ghost" size="sm" onClick={() => ask(ctx, retryHistory(turns))}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {ctx?.sources.length && phase !== 'gathering' ? (
        <div className="ask__sources">
          <div className="ask__sources-label">Built on what you read in</div>
          <ul>
            {ctx.sources.map((s) => (
              <li key={`${s.moduleId}::${s.lessonId}`}>
                <a href={`#/module/${s.moduleId}?lesson=${s.lessonId}`}>{s.title}</a>
                <span> · {s.moduleTitle.split(':')[0]}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        className="ask__follow"
        onSubmit={(e) => {
          e.preventDefault()
          sendFollowUp()
        }}
      >
        <input
          className="ask__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={busy ? 'Answering…' : 'Ask a follow-up…'}
          aria-label="Ask a follow-up question"
          maxLength={600}
          disabled={!ctx}
        />
        {phase === 'streaming' ? (
          <Button variant="ghost" size="sm" type="button" onClick={() => cancelRef.current()}>
            Stop
          </Button>
        ) : (
          <Button variant="primary" size="sm" type="submit" disabled={!draft.trim() || busy}>
            Ask
          </Button>
        )}
      </form>
      <p className="ask__fine">
        Answers come from Claude and can be wrong. Only this lesson and passages from lessons you have read were sent.
      </p>
    </aside>,
    document.body,
  )
}
