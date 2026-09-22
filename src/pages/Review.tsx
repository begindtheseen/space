/* ============================================================================
   ORBIT — review session
   ----------------------------------------------------------------------------
   The retrieval loop. Three design commitments, each with a reason:

     · The prompt is always shown before the answer, with no way to peek. The
       testing effect depends on the attempt, not the exposure — a card you
       read is worth far less than a card you tried and failed.
     · Confidence is captured *before* the reveal. Asked afterwards it is
       contaminated by knowing the answer, and the calibration chart that comes
       out of it is the most behaviour-changing thing this app can show.
     · Each grade button shows the interval it will actually produce, computed
       by running the scheduler without committing. No hidden consequences.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  IconArrowRight,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconFlame,
  IconRecall,
} from '@/components/icons'
import { Bar, Button, Card, Empty, Ring, Stat } from '@/components/ui'
import { MODULES, moduleById } from '@/curriculum'
import type { Flashcard, Module, QuizItem } from '@/curriculum/types'
import { parseItemId } from '@/curriculum/types'
import { fsrsConfigFor } from '@/engine/apply'
import { review as previewReview, type Grade } from '@/engine/fsrs'
import { buildSession, type SessionItem } from '@/engine/scheduler'
import { getItem } from '@/engine/state'
import { useLearner } from '@/hooks/useLearner'
import { Markdown } from '@/lib/markdown'
import { navigate, useRoute } from '@/lib/router'
import './pages.css'

type Phase = 'prompt' | 'revealed'

interface Tally {
  seen: number
  again: number
  hard: number
  good: number
  easy: number
  startedAt: number
}

export function Review() {
  const { state, dag, grade } = useLearner()
  const route = useRoute()

  // The queue is built once on mount and then worked through. Rebuilding it on
  // every state change would reshuffle the deck under the learner's hands.
  const [queue, setQueue] = useState<SessionItem[] | null>(null)
  const [cursor, setCursor] = useState(0)
  const [phase, setPhase] = useState<Phase>('prompt')
  const [choice, setChoice] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [tally, setTally] = useState<Tally>({
    seen: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    startedAt: Date.now(),
  })
  const shownAt = useRef(Date.now())

  useEffect(() => {
    const plan = buildSession(state, dag, {
      size: 30,
      track: route.query.track,
      moduleId: route.query.module,
    })
    setQueue(plan.items)
    // Built once per session. `state` is deliberately excluded from the deps:
    // grading changes it on every card, and rebuilding here would reshuffle
    // the deck under the learner's hands mid-session. The provider guarantees
    // state is hydrated before this component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dag, route.query.track, route.query.module])

  const current = queue?.[cursor]
  const resolved = useMemo(() => (current ? resolveItem(current) : null), [current])

  const onGrade = useCallback(
    (g: Grade) => {
      if (!current) return
      grade({
        itemId: current.atom.id,
        grade: g,
        choices: resolved?.kind === 'quiz' ? resolved.item.choices?.length ?? 0 : 0,
        confidence: confidence ?? undefined,
        ms: Date.now() - shownAt.current,
      })
      setTally((t) => ({
        ...t,
        seen: t.seen + 1,
        again: t.again + (g === 1 ? 1 : 0),
        hard: t.hard + (g === 2 ? 1 : 0),
        good: t.good + (g === 3 ? 1 : 0),
        easy: t.easy + (g === 4 ? 1 : 0),
      }))
      setCursor((c) => c + 1)
      setPhase('prompt')
      setChoice(null)
      setConfidence(null)
      shownAt.current = Date.now()
    },
    [current, resolved, grade, confidence],
  )

  const reveal = useCallback(() => setPhase('revealed'), [])

  /* ── keyboard ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!current) return
      if (phase === 'prompt') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          reveal()
        }
        return
      }
      if (e.key >= '1' && e.key <= '4') {
        e.preventDefault()
        onGrade(Number(e.key) as Grade)
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onGrade(3)
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [phase, current, reveal, onGrade])

  /* ── states ────────────────────────────────────────────────────────────── */

  if (!queue) {
    return <div className="review" />
  }

  if (queue.length === 0) {
    return (
      <div className="review">
        <Empty
          icon={<IconCheck size={32} />}
          title="Nothing due right now"
          body="Your scheduled reviews are clear. Start a new module and the planner will space it for you automatically — coming back early buys almost nothing."
          action={
            route.query.module ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/module/${route.query.module}?step=recall`)}
              >
                Back to the module
                <IconArrowRight size={15} />
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={() => navigate('/learning')}>
                Browse modules
                <IconArrowRight size={15} />
              </Button>
            )
          }
        />
      </div>
    )
  }

  if (cursor >= queue.length) {
    return <SessionSummary tally={tally} total={queue.length} moduleId={route.query.module} />
  }

  if (!current || !resolved) {
    return <div className="review" />
  }

  const progress = cursor / queue.length
  const cfg = fsrsConfigFor(state)
  const memory = getItem(state, current.atom.id).memory

  return (
    <div className="review">
      <div className="review__bar">
        <Button
          variant="quiet"
          size="icon"
          onClick={() => navigate(route.query.module ? `/module/${route.query.module}?step=recall` : '/')}
          aria-label="Leave session"
        >
          <IconChevronLeft size={17} />
        </Button>
        <Bar value={progress} height={4} />
        <span className="review__count">
          {cursor + 1} / {queue.length}
        </span>
      </div>

      <div className="rcard">
        <div className="rcard__kicker">
          {current.kind === 'review' ? <IconRecall size={12} /> : <IconFlame size={12} />}
          {current.kind === 'review' ? 'Review' : 'New'}
          <span style={{ color: 'var(--ink-5)' }}>·</span>
          <span style={{ letterSpacing: '0.04em', textTransform: 'none', fontWeight: 500 }}>
            {resolved.module.title}
          </span>
        </div>

        {resolved.kind === 'card' ? (
          <CardFace
            card={resolved.item}
            phase={phase}
            formula={!!resolved.item.formula}
          />
        ) : (
          <QuizFace
            item={resolved.item}
            phase={phase}
            choice={choice}
            onChoose={(i) => {
              setChoice(i)
              setPhase('revealed')
            }}
          />
        )}

        {phase === 'prompt' && state.settings.askConfidence && resolved.kind === 'card' ? (
          <ConfidencePicker value={confidence} onChange={setConfidence} />
        ) : null}

        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          {phase === 'prompt' ? (
            resolved.kind === 'card' ? (
              <Button variant="block" size="lg" onClick={reveal}>
                Show answer
                <span style={{ color: 'var(--ink-5)', fontSize: 11, marginLeft: 4 }}>space</span>
              </Button>
            ) : null
          ) : (
            <div className="grades">
              {GRADES.map((g) => {
                const next = previewReview(memory, g.value, new Date(), cfg, () => 0.5)
                return (
                  <button
                    key={g.value}
                    className={`grade grade--${g.key}`}
                    onClick={() => onGrade(g.value)}
                    type="button"
                  >
                    <span className="grade__key">{g.value}</span>
                    <span className="grade__label">{g.label}</span>
                    <span className="grade__when">{formatDue(next.dueInMinutes)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <p className="track-note" style={{ marginTop: 20 }}>
        Grades set the next interval. “Good” on something you nearly forgot is worth far more than
        “Easy” on something you just saw — the scheduler is built around exactly that.
      </p>
    </div>
  )
}

/* ── Faces ───────────────────────────────────────────────────────────────── */

function CardFace({
  card,
  phase,
  formula,
}: {
  card: Flashcard
  phase: Phase
  formula: boolean
}) {
  return (
    <>
      <div className="rcard__prompt">{card.front}</div>
      {phase === 'revealed' ? (
        <div className={`rcard__answer${formula ? ' rcard__answer--formula' : ''}`}>
          {card.back}
          {card.hint ? <div className="rcard__hint">{card.hint}</div> : null}
        </div>
      ) : null}
    </>
  )
}

function QuizFace({
  item,
  phase,
  choice,
  onChoose,
}: {
  item: QuizItem
  phase: Phase
  choice: number | null
  onChoose: (i: number) => void
}) {
  const answerIndex = typeof item.answer === 'number' ? item.answer : -1

  return (
    <>
      <div className="rcard__prompt">{item.q}</div>

      {item.choices?.length ? (
        <div className="choices">
          {item.choices.map((c, i) => {
            const state =
              phase !== 'revealed'
                ? undefined
                : i === answerIndex
                  ? 'correct'
                  : i === choice
                    ? 'wrong'
                    : undefined
            return (
              <button
                key={i}
                className="choice"
                data-state={state}
                disabled={phase === 'revealed'}
                onClick={() => onChoose(i)}
                type="button"
              >
                <span className="choice__key">{String.fromCharCode(65 + i)}</span>
                <span>{c}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rcard__hint" style={{ marginTop: 18 }}>
          Say the answer out loud before revealing — production beats recognition.
        </div>
      )}

      {phase === 'revealed' ? (
        <div className="rcard__answer">
          {answerIndex < 0 ? <strong>{String(item.answer)}</strong> : null}
          <Markdown>{item.explain}</Markdown>
        </div>
      ) : null}
    </>
  )
}

/* ── Confidence ──────────────────────────────────────────────────────────── */

const CONFIDENCE_STEPS = [0.1, 0.3, 0.5, 0.7, 0.9]

function ConfidencePicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="conf">
      <div className="conf__label">
        <span>Before you look — will you get this right?</span>
        <span style={{ color: 'var(--ink-5)' }}>optional</span>
      </div>
      <div className="conf__btns">
        {CONFIDENCE_STEPS.map((c) => (
          <button
            key={c}
            className="conf__btn"
            data-on={value === c}
            onClick={() => onChange(c)}
            type="button"
          >
            {Math.round(c * 100)}%
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Summary ─────────────────────────────────────────────────────────────── */

function SessionSummary({ tally, total, moduleId }: { tally: Tally; total: number; moduleId?: string }) {
  const module = moduleId ? moduleById(moduleId) : undefined
  const minutes = Math.max(1, Math.round((Date.now() - tally.startedAt) / 60000))
  const recalled = tally.hard + tally.good + tally.easy
  const accuracy = tally.seen > 0 ? recalled / tally.seen : 0

  return (
    <div className="review">
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <Ring value={accuracy} size={92} thickness={6} />
        <h1 className="h-page" style={{ marginTop: 18 }}>
          Session complete
        </h1>
        <p className="page-head__sub" style={{ margin: '8px auto 0' }}>
          {tally.seen} of {total} items in {minutes} minute{minutes === 1 ? '' : 's'}.{' '}
          {accuracy >= 0.95
            ? 'That is above the productive band — the scheduler will stretch these intervals out.'
            : accuracy >= 0.8
              ? 'That is right in the band where learning is fastest.'
              : 'Below the band — the next session will lean on easier items and more scaffolding.'}
        </p>
      </div>

      <div className="summary">
        <Card pad>
          <Stat value={tally.again} label="Again" deltaTone="bad" />
        </Card>
        <Card pad>
          <Stat value={tally.hard} label="Hard" />
        </Card>
        <Card pad>
          <Stat value={tally.good} label="Good" />
        </Card>
        <Card pad>
          <Stat value={tally.easy} label="Easy" />
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="primary" size="lg" onClick={() => location.reload()}>
          <IconRecall size={15} />
          Another round
        </Button>
        {module ? (
          <Button variant="ghost" size="lg" onClick={() => navigate(`/module/${module.id}?step=recall`)}>
            Back to {module.title}
          </Button>
        ) : null}
        <Button variant="ghost" size="lg" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      </div>

      <p className="track-note">
        <IconClock size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 5 }} />
        Come back when the scheduler says so. Reviewing early feels productive and buys almost
        nothing — the gain from a retrieval is largest when you had nearly forgotten.
      </p>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const GRADES: { value: Grade; label: string; key: string }[] = [
  { value: 1, label: 'Again', key: 'again' },
  { value: 2, label: 'Hard', key: 'hard' },
  { value: 3, label: 'Good', key: 'good' },
  { value: 4, label: 'Easy', key: 'easy' },
]

type Resolved =
  | { kind: 'card'; item: Flashcard; module: Module }
  | { kind: 'quiz'; item: QuizItem; module: Module }

function resolveItem(si: SessionItem): Resolved | null {
  const parsed = parseItemId(si.atom.id)
  if (!parsed) return null
  const module = moduleById(parsed.moduleId) ?? MODULES.find((m) => m.id === parsed.moduleId)
  if (!module) return null

  if (parsed.kind === 'card') {
    const item = module.cards?.find((c) => c.id === parsed.localId)
    return item ? { kind: 'card', item, module } : null
  }
  const item = module.quiz?.find((q) => q.id === parsed.localId)
  return item ? { kind: 'quiz', item, module } : null
}

function formatDue(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = minutes / 60
  if (hours < 24) return `${Math.round(hours)}h`
  const days = hours / 24
  if (days < 30) return `${Math.round(days)}d`
  const months = days / 30.44
  if (months < 18) return `${Math.round(months)}mo`
  return `${(days / 365.25).toFixed(1)}y`
}
