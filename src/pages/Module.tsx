/* ============================================================================
   ORBIT — module page
   ----------------------------------------------------------------------------
   Everything about one module, organised as the study path a learner actually
   walks: Learn (objectives, the curated resources, and the flashcards read as
   notes), Practice (exercises), then Recall (the scheduled flashcards and
   questions). The order is the pedagogy — recall comes last because it holds
   you to what the first two steps taught — and the page leads with whichever
   step is next, so a first visit never opens on a quiz.

   Lessons are being written module by module. Where they exist, the Learn
   step leads with them and the cited resources become further reading; where
   they do not yet, the Learn step says so plainly and points at the resources,
   or a beginner reads the flashcards as a test they were never taught for.

   The one other decision this page has to make well: if the module is locked,
   say so plainly and point upstream instead of letting someone grind against
   material they do not have the prerequisites for.
   ========================================================================== */
import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowRight,
  IconBook,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFlame,
  IconLink,
  IconLock,
  IconRecall,
  IconRoute,
  IconStar,
  IconTarget,
  IconTerminal,
  IconWarn,
} from '@/components/icons'
import { Bar, Button, Card, CardHead, Chip, Empty, Ring, Tile } from '@/components/ui'
import { TRACKS, lessonKey, loadLessonBody, moduleById } from '@/curriculum'
import type { Exercise, Flashcard, Lesson as LessonMeta, Module, Resource } from '@/curriculum/types'
import { markLessonRead, markRead, togglePin } from '@/engine/apply'
import { atomsOf, dueAtoms } from '@/engine/scheduler'
import { diagnoseModule } from '@/engine/diagnose'
import { getItem, type LearnerState } from '@/engine/state'
import { currentR } from '@/engine/fsrs'
import { useReadingPlace } from '@/hooks/useReadingPlace'
import { useLearner } from '@/hooks/useLearner'
import { formatDate } from '@/lib/format'
import { Markdown } from '@/lib/markdown'
import { navigate, useRoute } from '@/lib/router'
import './pages.css'

type Step = 'learn' | 'practice' | 'recall'

const STEP_ORDER: Step[] = ['learn', 'practice', 'recall']

function isStep(v: string | undefined): v is Step {
  return v === 'learn' || v === 'practice' || v === 'recall'
}

export function ModulePage({ id }: { id: string }) {
  const module = moduleById(id)

  if (!module) {
    return (
      <div className="page page--padtop">
        <Empty
          icon={<IconWarn size={30} />}
          title="No such module"
          body={`Nothing in the curriculum has the id “${id}”.`}
          action={
            <Button variant="primary" size="md" onClick={() => navigate('/learning')}>
              Browse the curriculum
            </Button>
          }
        />
      </div>
    )
  }

  // Keyed so moving between modules starts on the right step for the new one
  // rather than inheriting whichever step was open on the last.
  return <ModuleView key={module.id} module={module} />
}

/* ── Derived status for the study path ───────────────────────────────────── */

interface Status {
  atoms: number
  cards: number
  quiz: number
  seen: number
  due: number
  read: string | undefined
  exercises: number
  /** Code exercises with a saved playground buffer. */
  started: number
  lessons: number
  lessonsRead: number
  lessonMinutes: number
}

function statusOf(state: LearnerState, module: Module, now: Date): Status {
  const atoms = atomsOf(module)
  const exercises = module.exercises ?? []
  const lessons = module.lessons ?? []
  return {
    lessons: lessons.length,
    lessonsRead: lessons.filter((l) => !!state.read[lessonKey(module.id, l.id)]).length,
    lessonMinutes: lessons.reduce((a, l) => a + l.minutes, 0),
    atoms: atoms.length,
    cards: module.cards?.length ?? 0,
    quiz: module.quiz?.length ?? 0,
    seen: atoms.filter((a) => (state.items[a.id]?.memory.reps ?? 0) > 0).length,
    due: dueAtoms(state, [module], now).length,
    read: state.read[module.id],
    exercises: exercises.length,
    // The playground keys saved buffers as `ex:<exercise id>`.
    started: exercises.filter((e) => e.kind === 'code' && !!state.code[`ex:${e.id}`]).length,
  }
}

/**
 * Which step to open on. Learn until the learner says they have done it and
 * has never recalled anything; Recall whenever something is due or right after
 * marking Learn done; otherwise Practice if there is any, else back to Learn.
 */
function suggestStep(s: Status): Step {
  if (s.due > 0) return 'recall'
  if (s.seen === 0 && !s.read) return 'learn'
  if (s.seen === 0 && s.read) return 'recall'
  if (s.exercises > 0 && s.started < s.exercises) return 'practice'
  return 'learn'
}

/* ── The page proper ─────────────────────────────────────────────────────── */

function ModuleView({ module }: { module: Module }) {
  const { state, dag, mastery, setState } = useLearner()
  const route = useRoute()
  const now = useMemo(() => new Date(), [])
  const status = useMemo(() => statusOf(state, module, now), [state, module, now])
  const [step, setStep] = useState<Step>(() => {
    if (route.query.ex) return 'practice'
    if (isStep(route.query.step)) return route.query.step
    return suggestStep(status)
  })

  const findings = useMemo(() => diagnoseModule(state, dag, module, now), [state, dag, module, now])

  const track = TRACKS[module.track]
  const mast = mastery.get(module.id) ?? 0
  const blockerIds = dag.blockers(module.id, mastery)
  const locked = blockerIds.length > 0
  const pinned = state.pinned.includes(module.id)

  const startRecall = () => navigate(`/review?module=${module.id}`)
  const markStudied = () => setState((s) => markRead(s, module.id, new Date()))

  const openLesson = route.query.lesson
    ? (module.lessons ?? []).find((l) => l.id === route.query.lesson)
    : undefined
  if (openLesson) {
    return <LessonReader module={module} lesson={openLesson} />
  }

  return (
    <div className="page page--padtop">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <button
          className="btn btn--quiet btn--sm"
          onClick={() => navigate(trackPath(module.track))}
          style={{ paddingLeft: 6 }}
          type="button"
        >
          <IconChevronLeft size={14} />
          {track.title}
        </button>
        <Button variant="quiet" size="sm" onClick={() => setState((s) => togglePin(s, module.id))}>
          <IconStar size={14} />
          {pinned ? 'Pinned' : 'Pin'}
        </Button>
      </div>

      <div className="page-head" style={{ paddingTop: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker" style={{ color: track.accent }}>
            <IconRoute size={13} />
            Tier {module.tier} · {module.hours} hours
            {module.tags?.map((t) => (
              <span key={t} style={{ marginLeft: 6 }}>
                <Chip ghost>{t}</Chip>
              </span>
            ))}
          </div>
          <h1 className="h-page">{module.title}</h1>
          <p className="page-head__sub">{module.summary}</p>
        </div>
        <Ring value={mast} size={68} thickness={5} color={track.accent} />
      </div>

      {locked ? <LockedBanner dag={dag} blockerIds={blockerIds} /> : null}

      {findings.length > 0 ? (
        <Card index={0} style={{ marginBottom: 'var(--gap)' }}>
          <CardHead icon={<IconRecall size={15} />} title="What the engine sees" divided />
          {findings.slice(0, 3).map((f, i) => (
            <div className="signal" key={i}>
              <span className="signal__dot" />
              <div className="grow">
                <div className="signal__msg">{f.message}</div>
                <div className="signal__action">{f.action}</div>
              </div>
            </div>
          ))}
        </Card>
      ) : null}

      <StudyPath step={step} status={status} onChange={setStep} />

      <div className="read">
        <div className="stack">
          {step === 'learn' ? (
            <Learn
              module={module}
              status={status}
              onMark={() => {
                markStudied()
                setStep('recall')
              }}
              onMarkAndRecall={() => {
                markStudied()
                startRecall()
              }}
            />
          ) : null}
          {step === 'practice' ? <Practice module={module} highlight={route.query.ex} /> : null}
          {step === 'recall' ? <Recall module={module} status={status} onStart={startRecall} /> : null}
        </div>

        <div className="stack">
          <Card index={0}>
            <CardHead icon={<IconTarget size={15} />} title="Progress" divided />
            <div className="sect">
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <Bar
                  value={mast}
                  height={5}
                  fill={`linear-gradient(90deg, ${track.accent}55, ${track.accent})`}
                />
                <span style={{ fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(mast * 100)}%
                </span>
              </div>
              <div style={{ marginTop: 13, fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.8 }}>
                {status.lessons > 0 ? (
                  <div>
                    {status.lessonsRead} of {status.lessons} lessons read
                  </div>
                ) : null}
                <div>{status.read ? `Studied ${formatDate(status.read) ?? ''}` : 'Not yet marked as studied'}</div>
                <div>
                  {status.seen} of {status.atoms} items seen in recall
                </div>
                <div>{status.due} due for review now</div>
                <div>
                  {status.exercises} exercise{status.exercises === 1 ? '' : 's'}
                  {status.started > 0 ? ` · ${status.started} started` : ''}
                </div>
              </div>
            </div>
          </Card>

          <PrereqCard dag={dag} module={module} mastery={mastery} />
          <UnlocksCard dag={dag} module={module} />
        </div>
      </div>
    </div>
  )
}

/* ── Study path strip ────────────────────────────────────────────────────── */

function StudyPath({
  step,
  status,
  onChange,
}: {
  step: Step
  status: Status
  onChange: (s: Step) => void
}) {
  const meta: Record<Step, string> = {
    learn: status.read
      ? `Studied ${formatDate(status.read) ?? ''}`
      : status.lessons > 0
        ? `${status.lessonsRead} of ${status.lessons} lessons · ${formatMinutes(status.lessonMinutes)}`
        : `${status.cards} note${status.cards === 1 ? '' : 's'} · resources first`,
    practice:
      status.exercises === 0
        ? 'No exercises'
        : `${status.exercises} exercise${status.exercises === 1 ? '' : 's'}${
            status.started > 0 ? ` · ${status.started} started` : ''
          }`,
    recall:
      status.atoms === 0
        ? 'Nothing to recall'
        : status.due > 0
          ? `${status.due} due now`
          : status.seen === 0
            ? `${status.cards} cards · ${status.quiz} questions`
            : `${status.seen} of ${status.atoms} seen`,
  }
  const label: Record<Step, string> = { learn: 'Learn', practice: 'Practice', recall: 'Recall' }
  const done: Record<Step, boolean> = {
    learn: !!status.read,
    practice: status.exercises > 0 && status.started >= status.exercises,
    recall: status.atoms > 0 && status.seen === status.atoms && status.due === 0,
  }

  return (
    <div className="path" role="tablist" aria-label="Study path">
      {STEP_ORDER.map((s, i) => (
        <button
          key={s}
          className="path__step"
          data-on={s === step}
          data-done={done[s]}
          onClick={() => onChange(s)}
          role="tab"
          aria-selected={s === step}
          type="button"
        >
          <span className="path__num">{done[s] ? <IconCheck size={13} /> : i + 1}</span>
          <span className="path__body">
            <span className="path__label">{label[s]}</span>
            <span className="path__meta">{meta[s]}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

/* ── Learn ───────────────────────────────────────────────────────────────── */

function Learn({
  module,
  status,
  onMark,
  onMarkAndRecall,
}: {
  module: Module
  status: Status
  onMark: () => void
  onMarkAndRecall: () => void
}) {
  const { state } = useLearner()
  const cards = module.cards ?? []
  const lessons = module.lessons ?? []
  // Free first — the whole point is that this is studiable without spending.
  const resources = [...module.resources].sort((a, b) => Number(b.free) - Number(a.free))
  const startHere = resources[0]
  const hasLessons = lessons.length > 0
  const firstUnread = lessons.find((l) => !state.read[lessonKey(module.id, l.id)])

  return (
    <>
      {!status.read ? (
        <Card index={0}>
          <CardHead icon={<IconRoute size={15} />} title="How to study this module" divided />
          <div className="sect">
            <ol className="steps">
              <li>
                <span className="steps__num">1</span>
                <span>
                  <strong>Read the objectives.</strong> They are the exam: everything below exists
                  to get you to them.
                </span>
              </li>
              <li>
                <span className="steps__num">2</span>
                {hasLessons ? (
                  <span>
                    <strong>Work through the lessons, in order.</strong> They teach everything the
                    recall items test, with derivations and worked examples; the resources
                    underneath are optional depth, not required reading.
                  </span>
                ) : (
                  <span>
                    <strong>Work through the resources, in order.</strong> This module’s written
                    lessons are still on their way, so for now it links the best free material.
                    {startHere ? (
                      <>
                        {' '}
                        Start with <em>{startHere.title}</em>
                        {startHere.author ? ` (${startHere.author})` : ''}.
                      </>
                    ) : null}
                  </span>
                )}
              </li>
              <li>
                <span className="steps__num">3</span>
                <span>
                  <strong>Skim the notes,</strong> then mark the module studied and move on to
                  Recall. The notes are this module’s flashcards laid out to read; the questions
                  stay hidden until Recall, because trying them cold is what makes them stick.
                </span>
              </li>
            </ol>
          </div>
        </Card>
      ) : null}

      {hasLessons ? (
        <Card index={1}>
          <CardHead
            icon={<IconBook size={15} />}
            title={`Lessons (${lessons.length})`}
            right={
              <span className="eyebrow-dim">
                {status.lessonsRead} of {lessons.length} read · {formatMinutes(status.lessonMinutes)}
              </span>
            }
            divided
          />
          <div className="sect" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {lessons.map((l, i) => {
              const done = !!state.read[lessonKey(module.id, l.id)]
              return (
                <button
                  key={l.id}
                  className="lesson"
                  data-done={done}
                  data-next={!done && firstUnread?.id === l.id}
                  onClick={() => navigate(`/module/${module.id}?lesson=${l.id}`)}
                  type="button"
                >
                  <span className="lesson__num">{done ? <IconCheck size={13} /> : i + 1}</span>
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="lesson__title">{l.title}</span>
                    <span className="lesson__meta">
                      {l.minutes} min
                      {!done && firstUnread?.id === l.id ? ' · up next' : done ? ' · read' : ''}
                    </span>
                  </span>
                  <IconChevronRight size={14} style={{ color: 'var(--ink-5)', flex: 'none' }} />
                </button>
              )
            })}
          </div>
        </Card>
      ) : null}

      <Card index={hasLessons ? 2 : 1}>
        <CardHead icon={<IconTarget size={15} />} title="What you will be able to do" divided />
        <div className="sect">
          <ul className="objlist">
            {module.objectives.map((o, i) => (
              <li key={i}>
                <IconCheck size={14} />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card index={hasLessons ? 3 : 2}>
        <CardHead
          icon={<IconBook size={15} />}
          title={`${hasLessons ? 'Further reading' : 'Resources'} (${resources.length})`}
          right={<span className="eyebrow-dim">free first</span>}
          divided
        />
        <div className="sect">
          {resources.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>
              None cited yet. Work from the objectives and the exercises.
            </p>
          ) : (
            resources.map((r, i) => <ResourceRow key={i} resource={r} startHere={!hasLessons && i === 0} />)
          )}
        </div>
      </Card>

      <Card index={3}>
        <CardHead icon={<IconBook size={15} />} title={`Topics (${module.topics.length})`} divided />
        <div className="sect">
          <div className="taglist">
            {module.topics.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </Card>

      <Card index={4}>
        <CardHead
          icon={<IconRecall size={15} />}
          title={`Notes (${cards.length})`}
          right={<span className="eyebrow-dim">the flashcards, laid out to read</span>}
          divided
        />
        <div className="sect">
          {cards.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>
              No flashcards in this module; the resources carry it.
            </p>
          ) : (
            <div className="notes">
              {cards.map((c) => (
                <Note key={c.id} card={c} />
              ))}
            </div>
          )}
          {module.quiz?.length ? (
            <p className="track-note" style={{ marginTop: 16 }}>
              {module.quiz.length} question{module.quiz.length === 1 ? '' : 's'} are held back for
              Recall. Answer explanations appear after each attempt, not before.
            </p>
          ) : null}
        </div>
      </Card>

      <Card index={5}>
        <div className="sect" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {status.read ? (
            <>
              <Chip tone="ok">
                <IconCheck size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                Studied {formatDate(status.read) ?? ''}
              </Chip>
              <span className="grow" />
              <Button variant="primary" size="md" onClick={onMarkAndRecall} disabled={status.atoms === 0}>
                <IconRecall size={15} />
                {status.due > 0 ? `Review ${status.due} due` : status.seen === 0 ? 'Start recall' : 'Recall again'}
                <IconArrowRight size={15} />
              </Button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55 }} className="grow">
                Done with the resources and the notes? Say so, and Recall takes over the
                scheduling from here.
              </span>
              <Button variant="ghost" size="md" onClick={onMark}>
                <IconCheck size={15} />
                Mark as studied
              </Button>
              <Button variant="primary" size="md" onClick={onMarkAndRecall} disabled={status.atoms === 0}>
                <IconRecall size={15} />
                Mark as studied and start recall
                <IconArrowRight size={15} />
              </Button>
            </>
          )}
        </div>
      </Card>
    </>
  )
}

function ResourceRow({ resource: r, startHere }: { resource: Resource; startHere: boolean }) {
  return (
    <div className="rsrc">
      <span className="rsrc__kind">{r.kind}</span>
      <div className="grow">
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          {r.url ? (
            <a
              className="rsrc__title"
              href={r.url}
              target="_blank"
              rel="noreferrer noopener"
              style={{ display: 'inline-block' }}
            >
              {r.title}
            </a>
          ) : (
            <span className="rsrc__title">{r.title}</span>
          )}
          {startHere ? <Chip tone="blue">Start here</Chip> : null}
        </div>
        <div className="rsrc__by">
          {r.author ? `${r.author} · ` : ''}
          {r.free ? 'free' : 'paid'}
          {r.note ? ` · ${r.note}` : ''}
        </div>
      </div>
    </div>
  )
}

function Note({ card }: { card: Flashcard }) {
  return (
    <div className="note">
      <div className="note__front">{card.front}</div>
      <div className={`note__back${card.formula ? ' note__back--formula' : ''}`}>{card.back}</div>
    </div>
  )
}

/* ── Practice ────────────────────────────────────────────────────────────── */

function Practice({ module, highlight }: { module: Module; highlight?: string }) {
  const exercises = module.exercises ?? []
  if (exercises.length === 0) {
    return (
      <Empty
        icon={<IconTerminal size={28} />}
        title="No exercises in this module"
        body="The resources and Recall carry this one. Move on to Recall when you have studied."
      />
    )
  }
  return (
    <>
      <p className="track-note" style={{ marginTop: 0 }}>
        Exercises are where understanding meets reality. Code exercises open in the playground
        with tests; derivations and analyses are done on paper, and the solution is there to check
        against afterwards, not to read first.
      </p>
      {exercises.map((ex, i) => (
        <ExerciseCard key={ex.id} exercise={ex} index={i} highlighted={ex.id === highlight} />
      ))}
    </>
  )
}

function ExerciseCard({
  exercise,
  index,
  highlighted,
}: {
  exercise: Exercise
  index: number
  highlighted: boolean
}) {
  const { state } = useLearner()
  const [showSolution, setShowSolution] = useState(false)
  const runnable = exercise.kind === 'code' && !!exercise.lang
  const started = !!state.code[`ex:${exercise.id}`]

  return (
    <Card
      index={index}
      style={highlighted ? { borderColor: 'var(--line-blue-strong)' } : undefined}
    >
      <CardHead
        icon={<IconTerminal size={15} />}
        title={exercise.title}
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            {started ? <Chip tone="ok">started</Chip> : null}
            <Chip ghost>{exercise.kind}</Chip>
            {exercise.lang ? <Chip tone="blue">{exercise.lang}</Chip> : null}
            {exercise.hours ? <Chip ghost>{exercise.hours}h</Chip> : null}
          </div>
        }
        divided
      />
      <div className="sect">
        <Markdown>{exercise.prompt}</Markdown>

        <div style={{ display: 'flex', gap: 9, marginTop: 15, flexWrap: 'wrap' }}>
          {runnable ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/playground?ex=${encodeURIComponent(exercise.id)}`)}
            >
              <IconTerminal size={14} />
              {started ? 'Continue in playground' : 'Open in playground'}
            </Button>
          ) : null}
          {exercise.solution ? (
            <Button variant="ghost" size="sm" onClick={() => setShowSolution((s) => !s)}>
              {showSolution ? 'Hide solution' : 'Show solution'}
            </Button>
          ) : null}
        </div>

        {showSolution && exercise.solution ? (
          <div style={{ marginTop: 15 }}>
            <Markdown>{'```' + (exercise.lang ?? '') + '\n' + exercise.solution + '\n```'}</Markdown>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

/* ── Recall ──────────────────────────────────────────────────────────────── */

function Recall({ module, status, onStart }: { module: Module; status: Status; onStart: () => void }) {
  const { state } = useLearner()
  const now = new Date()
  const cards = module.cards ?? []
  const quiz = module.quiz ?? []

  const cta =
    status.atoms === 0
      ? 'Nothing to recall'
      : status.due > 0
        ? `Review ${status.due} due`
        : status.seen === 0
          ? `Start recall · ${status.atoms} items`
          : 'Recall again'

  return (
    <>
      <Card index={0}>
        <CardHead
          icon={<IconRecall size={15} />}
          title="Recall"
          right={
            status.due > 0 ? (
              <Chip tone="warn">{status.due} due</Chip>
            ) : status.seen > 0 ? (
              <Chip tone="ok">{status.seen} seen</Chip>
            ) : null
          }
          divided
        />
        <div className="sect">
          <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
            The flashcards and questions of this module, scheduled by spaced repetition. You see a
            prompt, try to answer, reveal, and grade yourself; the grade sets when it comes back.
            New items are introduced a few at a time, so a first session is short and later ones
            are mostly review.
          </p>
          {!status.read && status.seen === 0 ? (
            <p className="track-note" style={{ marginTop: 12 }}>
              <IconFlame size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 5 }} />
              You have not marked the Learn step done. Recall works best once you have been through
              the resources — it tests, it does not teach.
            </p>
          ) : null}
          <div style={{ marginTop: 15 }}>
            <Button variant="primary" size="lg" onClick={onStart} disabled={status.atoms === 0}>
              <IconRecall size={15} />
              {cta}
              <IconArrowRight size={15} />
            </Button>
          </div>
        </div>
      </Card>

      <Card index={1}>
        <CardHead icon={<IconRecall size={15} />} title={`Flashcards (${cards.length})`} divided />
        <div className="sect">
          {cards.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>None yet.</p>
          ) : (
            cards.map((c) => {
              const it = getItem(state, `${module.id}::card::${c.id}`)
              const r = it.memory.reps > 0 ? currentR(it.memory, now) : null
              return (
                <div className="rsrc" key={c.id}>
                  <span className="rsrc__kind">{r == null ? 'new' : `${Math.round(r * 100)}%`}</span>
                  <div className="grow">
                    <div className="rsrc__title">{c.front}</div>
                    <div className="rsrc__by">
                      {r == null ? 'not yet recalled' : 'chance you still know it right now'}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card index={2}>
        <CardHead icon={<IconTarget size={15} />} title={`Questions (${quiz.length})`} divided />
        <div className="sect">
          {quiz.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>None yet.</p>
          ) : (
            quiz.map((q) => {
              const it = getItem(state, `${module.id}::quiz::${q.id}`)
              const acc = it.attempts > 0 ? it.correct / it.attempts : null
              return (
                <div className="rsrc" key={q.id}>
                  <span className="rsrc__kind">{acc == null ? 'new' : `${Math.round(acc * 100)}%`}</span>
                  <div className="grow">
                    <div className="rsrc__title">{acc == null ? 'Hidden until you attempt it' : q.q}</div>
                    <div className="rsrc__by">
                      {q.bloom ?? 'recall'} · difficulty {(q.b ?? 0).toFixed(1)}
                      {acc == null ? '' : ` · ${it.attempts} attempt${it.attempts === 1 ? '' : 's'}`}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </>
  )
}

/* ── Shared panels ───────────────────────────────────────────────────────── */

function LockedBanner({ dag, blockerIds }: { dag: ReturnType<typeof useLearner>['dag']; blockerIds: string[] }) {
  return (
    <Card
      index={0}
      style={{ marginBottom: 'var(--gap)', borderColor: 'rgba(240,168,72,0.28)' }}
    >
      <div style={{ padding: '15px 17px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Tile size={34} radius={9} color="var(--warn)">
          <IconLock size={16} />
        </Tile>
        <div className="grow">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            This one is gated, and that is on purpose
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.6 }}>
            You can study it anyway, but it will be much harder than it needs to be. Get{' '}
            {blockerIds
              .slice(0, 3)
              .map((b) => dag.get(b)?.title ?? b)
              .join(', ')}{' '}
            to 70% first.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 11, flexWrap: 'wrap' }}>
            {blockerIds.slice(0, 3).map((b) => (
              <Button key={b} variant="ghost" size="sm" onClick={() => navigate(`/module/${b}`)}>
                {dag.get(b)?.title ?? b}
                <IconArrowRight size={13} />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function PrereqCard({
  dag,
  module,
  mastery,
}: {
  dag: ReturnType<typeof useLearner>['dag']
  module: Module
  mastery: Map<string, number>
}) {
  const prereqs = dag.prereqs(module.id)
  if (prereqs.length === 0) {
    return (
      <Card index={1}>
        <CardHead icon={<IconRoute size={15} />} title="Prerequisites" divided />
        <div className="sect" style={{ fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.6 }}>
          None. This is an entry point — you can start it today with no background at all.
        </div>
      </Card>
    )
  }

  return (
    <Card index={1}>
      <CardHead icon={<IconRoute size={15} />} title={`Prerequisites (${prereqs.length})`} divided />
      <div className="sect">
        {prereqs.map((p) => {
          const m = dag.get(p)
          const v = mastery.get(p) ?? 0
          const ok = v >= 0.7
          return (
            <button
              key={p}
              className="rsrc"
              onClick={() => navigate(`/module/${p}`)}
              style={{ width: '100%', textAlign: 'left' }}
              type="button"
            >
              <span className="rsrc__kind" style={{ color: ok ? 'var(--ok)' : 'var(--warn)' }}>
                {Math.round(v * 100)}%
              </span>
              <div className="grow">
                <div className="rsrc__title">{m?.title ?? p}</div>
                <div className="rsrc__by">{ok ? 'Ready' : 'Needs 70% to unlock this'}</div>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function UnlocksCard({ dag, module }: { dag: ReturnType<typeof useLearner>['dag']; module: Module }) {
  const direct = dag.childrenOf(module.id)
  const total = dag.descendants(module.id).size
  if (total === 0) return null

  return (
    <Card index={2}>
      <CardHead icon={<IconLink size={15} />} title={`Unlocks ${total}`} divided />
      <div className="sect">
        {direct.slice(0, 6).map((c) => (
          <button
            key={c}
            className="rsrc"
            onClick={() => navigate(`/module/${c}`)}
            style={{ width: '100%', textAlign: 'left' }}
            type="button"
          >
            <div className="grow">
              <div className="rsrc__title">{dag.get(c)?.title ?? c}</div>
            </div>
            <IconArrowRight size={13} style={{ color: 'var(--ink-5)' }} />
          </button>
        ))}
        {total > direct.length ? (
          <p style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 10 }}>
            …and {total - direct.length} further downstream.
          </p>
        ) : null}
      </div>
    </Card>
  )
}

/* ── Lesson reader ───────────────────────────────────────────────────────── */

function LessonReader({ module, lesson }: { module: Module; lesson: LessonMeta }) {
  const { state, setState } = useLearner()
  const lessons = module.lessons ?? []
  const index = lessons.findIndex((l) => l.id === lesson.id)
  const prev = index > 0 ? lessons[index - 1] : undefined
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined
  const done = !!state.read[lessonKey(module.id, lesson.id)]
  const [body, setBody] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setBody(null)
    setError(null)
    loadLessonBody(lesson)
      .then((b) => {
        if (alive) setBody(b)
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : String(err))
      })
    // A new lesson is a new page; the shell only resets scroll on path changes.
    // useReadingPlace restores a saved position after this, on the next frame.
    document.querySelector('.scroll')?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    return () => {
      alive = false
    }
  }, [lesson])

  useReadingPlace({
    placeKey: lessonKey(module.id, lesson.id),
    ready: body !== null,
    resume: {
      kind: 'lesson',
      path: `/module/${module.id}?lesson=${lesson.id}`,
      label: module.title,
      detail: `${lesson.title} · lesson ${index + 1} of ${lessons.length}`,
      moduleId: module.id,
      lessonId: lesson.id,
    },
  })

  const markDone = () =>
    setState((s) =>
      markLessonRead(
        s,
        module.id,
        lesson.id,
        lessons.map((l) => l.id),
        new Date(),
      ),
    )
  const go = (l: LessonMeta | undefined) =>
    navigate(l ? `/module/${module.id}?lesson=${l.id}` : `/module/${module.id}?step=learn`)

  return (
    <div className="page page--padtop reader">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <button
          className="btn btn--quiet btn--sm"
          onClick={() => navigate(`/module/${module.id}?step=learn`)}
          style={{ paddingLeft: 6 }}
          type="button"
        >
          <IconChevronLeft size={14} />
          {module.title}
        </button>
        <span className="eyebrow-dim">
          Lesson {index + 1} of {lessons.length}
        </span>
      </div>

      <div className="page-head" style={{ paddingTop: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker" style={{ color: TRACKS[module.track].accent }}>
            <IconClock size={13} />
            {lesson.minutes} min read
            {done ? (
              <span style={{ marginLeft: 6 }}>
                <Chip tone="ok">read</Chip>
              </span>
            ) : null}
          </div>
          <h1 className="h-page">{lesson.title}</h1>
        </div>
      </div>

      <Card index={0}>
        <div className="sect reader__body">
          {error ? (
            <Empty
              icon={<IconWarn size={28} />}
              title="This lesson could not be loaded"
              body={error}
              action={
                <Button variant="ghost" size="md" onClick={() => go(undefined)}>
                  Back to the module
                </Button>
              }
            />
          ) : body === null ? (
            <div className="reader__loading">Loading lesson…</div>
          ) : (
            <Markdown className="reader__md">{body}</Markdown>
          )}
        </div>
      </Card>

      <div className="reader__nav">
        <Button variant="ghost" size="md" onClick={() => go(prev)} disabled={!prev}>
          <IconChevronLeft size={15} />
          {prev ? prev.title : 'Previous'}
        </Button>
        <span className="grow" />
        {done ? (
          <Button variant="primary" size="md" onClick={() => go(next)}>
            {next ? 'Next lesson' : 'Back to the module'}
            <IconArrowRight size={15} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              markDone()
              go(next)
            }}
            disabled={body === null}
          >
            <IconCheck size={15} />
            {next ? 'Mark as read · next lesson' : 'Mark as read · back to the module'}
          </Button>
        )}
      </div>
      {next ? (
        <p className="track-note">
          Up next: {next.title} · {next.minutes} min
        </p>
      ) : (
        <p className="track-note">
          That is the last lesson. Skim the notes on the module page, then move on to Recall.
        </p>
      )}
    </div>
  )
}

function formatMinutes(m: number): string {
  if (m < 60) return `${Math.round(m)} min`
  const h = Math.floor(m / 60)
  const r = Math.round(m % 60)
  return r === 0 ? `${h} h` : `${h} h ${r} min`
}

function trackPath(track: Module['track']): string {
  return track === 'gnc' ? '/gnc' : `/${track}`
}
