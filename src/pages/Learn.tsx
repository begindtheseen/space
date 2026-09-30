/* ============================================================================
   Learn to code
   ----------------------------------------------------------------------------
   Three views, laid out the way a coding school lays them out:

     #/learn              roadmaps: pick a goal, see its courses in order as a
                          numbered path of course tiles ending in a certificate
     #/learn/roadmap-<id> one goal, step by step, with where to start
     #/learn/<language>   one course: what it covers and every lesson in it
     #/learn/<lesson id>  one lesson: the explanation and the challenge on the
                          left, the playground's own IDE window on the right,
                          and Run Code grading it as test cases

   The rules it keeps:
     · Every lesson is open. The order is a recommendation, shown as "Next";
       nobody is locked out of the lesson they came for.
     · A pass is only ever what the checks say. Hints come one at a time;
       the solution is there when she asks for it, and using it is her call.
     · Her code is saved as she types, per lesson, and "Open in playground"
       carries it into the free scratchpad to keep playing.
   ========================================================================== */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PlaygroundEmbed, type Graded } from '@/components/ide/Embed'
import { exampleGuideId, useLessonCode } from '@/components/ide/lessonCode'
import { ReadAloud, type ReadAloudProps } from '@/components/ReadAloud'
import { ExplainPanel } from '@/components/ExplainPanel'
import { SelectionAsk } from '@/components/SelectionAsk'
import { CertificateMark, LangMark } from '@/components/ide'
import { IconArrowRight, IconCheck, IconChevronLeft, IconClock, IconFlame } from '@/components/icons'
import { Bar, Button } from '@/components/ui'
import { markPracticed } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import { buildProgram, gradeRun } from '@/learn/grade'
import { stuckHelp } from '@/learn/stuck'
import { MASTERY, ROADMAPS, SHELVES, currentTrack, findLesson, ladderOf, langName, nextLesson, passedCount, streak, trackFor } from '@/learn/index'
import { editorLang, runLearn, warmUp } from '@/learn/platform'
import { useTrack } from '@/learn/load'
import { LEVEL_LABEL, type CatalogTrack, type CheckResult, type LearnLesson, type LearnTrack, type LessonMeta, type Roadmap, type TrackMeta } from '@/learn/types'
import { onExplainRequested } from '@/lib/ctxBus'
import type { ExplainSeed, LibraryLesson } from '@/lib/explain'
import { bringIntoView, markSolved, runWindow, showItem, whenSolved } from '@/lib/guide'
import { Markdown } from '@/lib/markdown'
import { runnableFence } from '@/lib/practice'
import { navigate, useRoute } from '@/lib/router'
import { readingOf, type ReadingItem } from '@/learn/reading'
import { TerminalChallenge } from './LearnTerminal'
import { GateView, PracticeSection, RetestBanner, RetestView, TrackLoading } from './LearnMastery'
import { courseMastered, gateOf, lessonMastered, practiceDone, practiceTotal } from '@/learn/practice'
import { courseLock } from '@/learn/credit'
import './learn.css'
import './pages.css'

export function Learn({ lessonId }: { lessonId?: string }) {
  if (!lessonId) return <LearnHome />
  if (lessonId === 'retests') return <RetestView />
  const goal = lessonId.startsWith('roadmap-') ? ALL_ROADMAPS.find((r) => `roadmap-${r.id}` === lessonId) : undefined
  if (goal) return <RoadmapView roadmap={goal} />
  const track = trackFor(lessonId)
  if (track) return <CourseView track={track} />
  const found = findLesson(lessonId)
  if (!found) return <LearnHome missing={lessonId} />
  return <Guarded key={found.lesson.id} found={found} />
}

/** A lesson or gate, unless its course is still locked behind an earlier course's gate. */
function Guarded({ found }: { found: { track: CatalogTrack; lesson: LessonMeta; index: number } }) {
  const { state } = useLearner()
  const lock = courseLock(found.track, state.learn)
  if (lock) return <LockedCourse track={found.track} lock={lock} />
  return <Opened found={found} />
}

/** The lesson or gate itself, once its course's text has loaded (the catalog knows only its outline). */
function Opened({ found }: { found: { track: CatalogTrack; lesson: LessonMeta; index: number } }) {
  const { track, error } = useTrack(found.track.id)
  const index = track ? track.lessons.findIndex((l) => l.id === found.lesson.id) : -1
  const lesson = track?.lessons[index]
  if (track && !lesson) return <LearnHome missing={found.lesson.id} />
  if (!track || !lesson) return <TrackLoading back={{ href: `#/learn/${found.track.id}`, label: found.track.title }} title={found.lesson.title} error={error} />
  if (lesson.gate) return <GateView key={lesson.id} track={track} lesson={lesson} />
  return <LessonView key={lesson.id} track={track} lesson={lesson} index={index} />
}

function Streak() {
  const { state } = useLearner()
  const n = streak(state.learn)
  if (!n) return null
  return (
    <span className="lm-streak" title="Days in a row with a lesson passed">
      <IconFlame size={14} />
      {n}-day streak
    </span>
  )
}

/* ── Roadmaps ────────────────────────────────────────────────────────────── */

/** Goals first, then one beginner-to-expert roadmap per language. */
const ALL_ROADMAPS: Roadmap[] = [...ROADMAPS, ...MASTERY]

function LearnHome({ missing }: { missing?: string }) {
  const { state } = useLearner()
  const route = useRoute()
  const goal = ALL_ROADMAPS.find((r) => r.id === route.query.goal) ?? ROADMAPS[0]!
  const pill = (r: Roadmap, label = r.title) => (
    <button
      key={r.id}
      type="button"
      role="tab"
      aria-selected={r.id === goal.id}
      data-active={r.id === goal.id}
      className="rm-goals__pill"
      onClick={() => navigate(`/learn?goal=${r.id}`, { replace: true })}
    >
      {r.id.startsWith('master-') ? <LangMark lang={r.id.slice(7)} size={16} /> : null}
      {label}
    </button>
  )

  return (
    <div className="page page--padtop ide-wrap lm-home">
      <header className="rm-hero">
        <div className="page-head__kicker">
          Learn to code <Streak />
        </div>
        <h1 className="rm-hero__title">Choose where you want to end up. Each roadmap lines up the courses that get you there, one step at a time.</h1>
      </header>

      <RetestBanner />

      {!Object.keys(state.read).length ? (
        <a className="lm-brief" href="#/briefing">
          <strong>Where does this code go?</strong> See how it flies a rocket, and how to start the curriculum: the
          mission briefing, about five minutes.
          <IconArrowRight size={14} />
        </a>
      ) : null}

      {missing ? <p className="lm-missing">There is no lesson called “{missing}”. Pick a course below.</p> : null}

      <div className="rm-goals" role="tablist" aria-label="Roadmap">
        <span className="rm-goals__label">Reach a goal</span>
        <div className="rm-goals__row">{ROADMAPS.map((r) => pill(r))}</div>
        {MASTERY.length ? (
          <>
            <span className="rm-goals__label">Or master one language, beginner to expert</span>
            <div className="rm-goals__row">{MASTERY.map((r) => pill(r))}</div>
          </>
        ) : null}
      </div>

      <section className="rm">
        <header className="rm__head">
          <span className="rm__goal">{goal.title}</span>
          <button type="button" className="rm__see" onClick={() => navigate(`/learn/roadmap-${goal.id}`)}>
            View every step
          </button>
        </header>
        <RoadmapPath roadmap={goal} passed={state.learn} />
      </section>

      <h2 className="lm-h2">Browse every course</h2>
      {SHELVES.map((shelf) => (
        <section key={shelf.key} className="lm-lang" aria-label={shelf.name}>
          <h3 className="lm-lang__name">
            <LangMark lang={shelf.lang} size={20} />
            {shelf.name}
            <span className="lm-lang__count">
              {shelf.tracks.length} course{shelf.tracks.length === 1 ? '' : 's'} · {shelf.tracks.reduce((n, t) => n + t.lessons.length, 0)} lessons
            </span>
          </h3>
          <div className="lm-courses">
            {shelf.tracks.map((t) => {
              const done = passedCount(t, state.learn)
              return (
                <a key={t.id} className="lm-course" href={`#/learn/${t.id}`}>
                  <span className="lm-course__icon">
                    <LangMark lang={t.lang} size={30} />
                  </span>
                  <span className="lm-course__text">
                    <span className="lm-course__level" data-level={t.level}>
                      {t.subject ? t.title : LEVEL_LABEL[t.level]}
                    </span>
                    <span className="lm-course__title">{t.name}</span>
                    <span className="lm-course__meta">
                      {done === t.lessons.length ? 'Complete' : `${done} of ${t.lessons.length} lessons`}
                    </span>
                    <Bar value={done / t.lessons.length} height={4} />
                  </span>
                </a>
              )
            })}
          </div>
        </section>
      ))}

      <p className="track-note">
        Learn to code is practice, and it counts for nothing else: passing a lesson does not change your modules, your
        readiness or your review queue.
      </p>
    </div>
  )
}

/** How many steps fit on a row of the path, from the width it has. */
function useColumns(ref: React.RefObject<HTMLElement | null>): number {
  const [cols, setCols] = useState(3)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      setCols(w >= 900 ? 5 : w >= 620 ? 4 : 3)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return cols
}

/** Where she is on a roadmap: each course's progress, and the step she is on. */
function progressOn(roadmap: Roadmap, passed: Record<string, string>) {
  const tracks = roadmap.steps.map((l) => trackFor(l)).filter((t): t is CatalogTrack => !!t)
  const done = tracks.map((t) => passedCount(t, passed) === t.lessons.length)
  const current = done.indexOf(false)
  return { tracks, done, current, allDone: current < 0 }
}

/**
 * The goal's courses as a path of numbered course tiles, snaking left to
 * right, around the end of the row, and back, ending at the certificate.
 * Steps she has finished, and the one she is on, are lit.
 */
function RoadmapPath({ roadmap, passed }: { roadmap: Roadmap; passed: Record<string, string> }) {
  const { tracks, done, current, allDone } = progressOn(roadmap, passed)
  const path = useRef<HTMLDivElement | null>(null)
  const cols = useColumns(path)

  const count = tracks.length + 1
  const place = (k: number) => {
    const row = Math.floor(k / cols)
    const c = k % cols
    return { row, col: row % 2 ? cols - 1 - c : c }
  }
  const linkOf = (k: number): 'right' | 'left' | 'turn-right' | 'turn-left' | undefined => {
    if (k >= count - 1) return undefined
    const a = place(k)
    const b = place(k + 1)
    if (b.row !== a.row) return a.col === cols - 1 ? 'turn-right' : 'turn-left'
    return b.col > a.col ? 'right' : 'left'
  }

  return (
    <div className="rm__path" ref={path} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {tracks.map((t, k) => {
        const n = passedCount(t, passed)
        const lit = done[k] || k === current
        const { row, col } = place(k)
        return (
          <div key={t.id} className="rm-step" style={{ gridRow: row + 1, gridColumn: col + 1 }}>
            <a
              href={`#/learn/${t.lang}`}
              className="rm-tile"
              data-lit={lit}
              data-state={done[k] ? 'done' : k === current ? 'current' : 'todo'}
              aria-label={`Step ${k + 1}: ${t.name}, ${n} of ${t.lessons.length} lessons passed`}
              title={`${t.name} · ${n}/${t.lessons.length} lessons`}
            >
              <LangMark lang={t.lang} size={34} />
              <span className="rm-tile__n" aria-hidden="true">
                {k + 1}
              </span>
            </a>
            <span className="rm-step__label">{t.name}</span>
            {linkOf(k) ? <span className="rm-link" data-dir={linkOf(k)} data-lit={done[k]} aria-hidden="true" /> : null}
          </div>
        )
      })}
      {(() => {
        const { row, col } = place(tracks.length)
        return (
          <div className="rm-step" style={{ gridRow: row + 1, gridColumn: col + 1 }}>
            <span
              className="rm-tile rm-tile--end"
              data-lit={allDone}
              role="img"
              aria-label={allDone ? `${roadmap.title}: every course complete` : `Finish line: complete every course on the ${roadmap.title} roadmap`}
            >
              <CertificateMark size={32} />
            </span>
            {allDone ? <span className="rm-step__label">Goal reached</span> : null}
          </div>
        )
      })()}
    </div>
  )
}

/* ── One roadmap, step by step ───────────────────────────────────────────── */

function RoadmapView({ roadmap }: { roadmap: Roadmap }) {
  const { state } = useLearner()
  const { tracks, done, current, allDone } = progressOn(roadmap, state.learn)
  const finished = done.filter(Boolean).length
  const go = (t: TrackMeta) => navigate(`/learn/${nextLesson(t, state.learn).id}`)
  return (
    <div className="page page--padtop ide-wrap">
      <a className="lm-back" href={`#/learn?goal=${roadmap.id}`}>
        <IconChevronLeft size={13} />
        Roadmaps
      </a>
      <div className="rmv-head">
        <div className="page-head__kicker">
          Roadmap · {tracks.length} courses <Streak />
        </div>
        <h1 className="h-page">{roadmap.title}</h1>
        <p className="page-head__sub">{roadmap.blurb}</p>
        <div className="lm-course-go">
          <Bar value={finished / tracks.length} height={6} />
          <span className="lm-course-go__n">
            {finished}/{tracks.length}
          </span>
          <button type="button" className="ide-run" onClick={() => go(tracks[allDone ? 0 : current]!)}>
            {allDone ? 'Review' : finished === 0 && passedCount(tracks[0]!, state.learn) === 0 ? 'Start step 1' : `Continue step ${current + 1}`}
            <IconArrowRight size={13} />
          </button>
        </div>
      </div>
      <ol className="rmv">
        {tracks.map((t, k) => {
          const n = passedCount(t, state.learn)
          return (
            <li key={t.id} className="rmv-step" data-state={done[k] ? 'done' : k === current ? 'current' : 'todo'}>
              <span className="rm-tile rmv-step__tile" data-lit={done[k] || k === current}>
                <LangMark lang={t.lang} size={30} />
                <span className="rm-tile__n" aria-hidden="true">
                  {k + 1}
                </span>
              </span>
              <div className="rmv-step__body">
                <a className="rmv-step__name" href={`#/learn/${t.lang}`}>
                  {t.name}
                </a>
                <p className="rmv-step__blurb">{t.blurb}</p>
                <div className="rmv-step__row">
                  <Bar value={n / t.lessons.length} height={4} />
                  <span className="rmv-step__n">
                    {n}/{t.lessons.length} lessons
                  </span>
                  <button type="button" className="rmv-step__go" onClick={() => go(t)}>
                    {n === 0 ? 'Start' : n === t.lessons.length ? 'Review' : 'Continue'}
                    <IconArrowRight size={12} />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
        <li className="rmv-step" data-state={allDone ? 'done' : 'todo'}>
          <span className="rm-tile rm-tile--end rmv-step__tile" data-lit={allDone}>
            <CertificateMark size={28} />
          </span>
          <div className="rmv-step__body">
            <span className="rmv-step__name">{allDone ? 'Goal reached' : 'Finish line'}</span>
            <p className="rmv-step__blurb">
              {allDone
                ? `Every course on the ${roadmap.title} roadmap, complete. The basics are yours; more lessons past them will follow.`
                : 'Complete every course above to reach it.'}
            </p>
          </div>
        </li>
      </ol>
    </div>
  )
}

/* ── One course ──────────────────────────────────────────────────────────── */

/** Shown instead of a locked course's lessons: which gate opens it, and the way there. */
function LockedCourse({ track, lock }: { track: TrackMeta; lock: { track: TrackMeta; gate: LessonMeta } }) {
  return (
    <div className="page page--padtop ide-wrap">
      <a className="lm-back" href={`#/learn/${track.id}`}>
        <IconChevronLeft size={13} />
        {track.title}
      </a>
      <div className="lm-locked" role="status">
        <div className="lm-text__kicker">
          <LangMark lang={track.lang} size={18} />
          Locked
        </div>
        <h1>Pass the {lock.track.name} gate first</h1>
        <p className="lm-practice__why">
          {track.name} builds on everything in {lock.track.name}. Its mastery gate is where you show you have it: problems you have not seen and questions on how and why it works, in one sitting. Pass it and this course opens. You can sit it whenever you feel ready, even if you finished that course before gates existed: nothing you already did has to be redone.
        </p>
        <div className="lm-help__row">
          <button type="button" className="ide-run" onClick={() => navigate(`/learn/${lock.gate.id}`)}>
            Go to the gate
            <IconArrowRight size={13} />
          </button>
          <a className="lm-link" href={`#/learn/${lock.track.id}`}>
            Back to {lock.track.title}
          </a>
        </div>
      </div>
    </div>
  )
}

function CourseView({ track }: { track: TrackMeta }) {
  const { state } = useLearner()
  const lock = courseLock(track, state.learn)
  const done = passedCount(track, state.learn)
  const total = track.lessons.length
  const next = nextLesson(track, state.learn)
  return (
    <div className="page page--padtop ide-wrap">
      <a className="lm-back" href="#/learn">
        <IconChevronLeft size={13} />
        Roadmaps
      </a>
      <div className="lm-course-head">
        <span className="rm-tile" style={{ ['--tile' as string]: '72px' }}>
          <LangMark lang={track.lang} size={40} />
        </span>
        <div style={{ minWidth: 0 }} className="grow">
          <div className="page-head__kicker">
            {track.subject ? track.subject : LEVEL_LABEL[track.level]} · {total} lessons
            {gateOf(track) ? (courseMastered(track, state.learn) ? ' · Mastered' : ' · ends in a mastery gate') : ''} <Streak />
          </div>
          <h1 className="h-page">{track.name}</h1>
          <p className="page-head__sub">{track.blurb}</p>
        </div>
      </div>
      {ladderOf(track).length > 1 ? (
        <nav className="lm-ladder" aria-label={`${track.subject ?? langName(track.lang)} courses`}>
          {ladderOf(track).map((t, i) => (
            <a
              key={t.id}
              href={`#/learn/${t.id}`}
              className="lm-ladder__step"
              data-here={t.id === track.id}
              data-done={passedCount(t, state.learn) === t.lessons.length}
              data-locked={!!courseLock(t, state.learn)}
            >
              <span className="lm-ladder__n">{i + 1}</span>
              {t.subject ? t.title : LEVEL_LABEL[t.level]}
            </a>
          ))}
        </nav>
      ) : null}
      {lock ? (
        <div className="lm-gate-result" role="status">
          <span className="grow">
            Locked until you pass the <strong>{lock.track.name}</strong> mastery gate.
          </span>
          <button type="button" className="ide-run" onClick={() => navigate(`/learn/${lock.gate.id}`)}>
            Go to the gate
            <IconArrowRight size={13} />
          </button>
        </div>
      ) : null}
      <div className="lm-course-go">
        <Bar value={done / total} height={6} />
        <span className="lm-course-go__n">
          {done}/{total}
        </span>
        <button type="button" className="ide-run" onClick={() => navigate(`/learn/${next.id}`)}>
          {done === 0 ? 'Start course' : done === total ? 'Review' : 'Continue'}
          <IconArrowRight size={13} />
        </button>
        <FocusLink lessonId={next.id} />
      </div>
      <ol className="lm-outline">
        {track.lessons.map((l, i) => {
          const ok = !!state.learn[l.id]
          const here = l.id === next.id && done < total
          return (
            <li key={l.id} data-done={ok} data-next={here}>
              <a href={`#/learn/${l.id}`}>
                <span className="lm-outline__n" aria-hidden="true">
                  {ok ? <IconCheck size={13} /> : i + 1}
                </span>
                <span className="lm-outline__title">{l.gate ? `Mastery gate: ${l.title}` : l.title}</span>
                {l.gate ? (
                  ok ? <span className="lm-outline__tag">Passed</span> : <span className="lm-outline__tag">{l.gate.problems.length} unseen problems · {l.gate.minutes} min</span>
                ) : ok && practiceTotal(l) ? (
                  <span className="lm-outline__tag">{lessonMastered(l, state.learn) ? 'Mastered' : `Practice ${practiceDone(l, state.learn)}/${practiceTotal(l)}`}</span>
                ) : ok ? (
                  <span className="lm-outline__tag">Passed</span>
                ) : here ? (
                  <span className="lm-outline__tag lm-outline__tag--next">Next</span>
                ) : null}
              </a>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ── One lesson ──────────────────────────────────────────────────────────── */

function LessonView({ track, lesson, index }: { track: LearnTrack; lesson: LearnLesson; index: number }) {
  const { state, setState } = useLearner()
  const terminal = lesson.lang === 'bash' || lesson.lang === 'git'
  const [passedNow, setPassedNow] = useState(false)
  const [hints, setHints] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  // Runs that did not pass, and the latest check results, for the "Stuck?" help.
  const [fails, setFails] = useState(0)
  const [lastResults, setLastResults] = useState<CheckResult[] | null>(null)
  const winRef = useRef<HTMLDivElement | null>(null)
  const teachCode = useLessonCode(`learn:${lesson.id}:example`, lesson.teach, lesson.schema)
  const textRef = useRef<HTMLElement | null>(null)
  const [asking, setAsking] = useState<ExplainSeed | null>(null)
  const closeAsk = useCallback(() => setAsking(null), [])
  // Explain reads this lesson, and the lessons of this course she has passed.
  const here = useMemo<LibraryLesson>(
    () => ({ moduleId: 'learn', moduleTitle: track.name, lessonId: lesson.id, title: lesson.title, body: `${lesson.teach}\n\n${lesson.task}` }),
    [track.name, lesson],
  )
  const passedHere = useMemo<LibraryLesson[]>(
    () =>
      track.lessons
        .filter((l) => l.id !== lesson.id && state.learn[l.id])
        .map((l) => ({ moduleId: 'learn', moduleTitle: track.name, lessonId: l.id, title: l.title, body: `${l.teach}\n\n${l.task}` })),
    // Only which lessons are passed matters, not her code in them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track, lesson.id, Object.keys(state.learn).join(',')],
  )
  useEffect(() => setAsking(null), [lesson.id])
  // A note's "where else this comes up" arrives here.
  useEffect(() => onExplainRequested(setAsking), [])

  const passedBefore = !!state.learn[lesson.id]
  const stuck = useMemo(() => stuckHelp(fails, lastResults, lesson.task, passedHere), [fails, lastResults, lesson.task, passedHere])
  const prev = track.lessons[index - 1]
  const next = track.lessons[index + 1]
  // At the end of a course, the way on is the next course in the language.
  const ladder = ladderOf(track)
  const nextCourse = next ? undefined : ladder[ladder.findIndex((t) => t.id === track.id) + 1]

  useEffect(() => warmUp(lesson.lang), [lesson.lang])

  const onPassed = useCallback(() => {
    setState((s) => markPracticed(s, lesson, lesson.id))
    setPassedNow(true)
    markSolved(lesson.id)
    requestAnimationFrame(() => winRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }, [lesson, setState])

  const pauses = useLessonReading(lesson, terminal)

  const onGraded = useCallback((passed: boolean, results: CheckResult[]) => {
    setLastResults(results)
    if (!passed) setFails((n) => n + 1)
  }, [])

  /** Runs her code with the lesson's checks and shows every check as a test case. */
  const grade = useCallback(
    async (code: string, _stdin: string, onStatus: (s: string) => void): Promise<Graded> => {
      const result = await runLearn(lesson, buildProgram(lesson, code), { onStatus })
      const g = gradeRun(lesson, code, result)
      onGraded(g.passed, g.results)
      return {
        run: { stdout: g.output, stderr: g.stderr, error: g.error, plots: [], result: null, tables: g.tables, ms: g.ms },
        tests: g.results,
      }
    },
    [lesson, onGraded],
  )

  return (
    <div className="page page--padtop ide-wrap">
      <div className="lm-top">
        <a className="lm-back" href={`#/learn/${track.id}`}>
          <IconChevronLeft size={13} />
          {track.title}
        </a>
        <div className="lm-dots" aria-label={`Lesson ${index + 1} of ${track.lessons.length}`}>
          {track.lessons.map((l, i) => (
            <a
              key={l.id}
              href={`#/learn/${l.id}`}
              className="lm-dots__dot"
              data-done={!!state.learn[l.id]}
              data-here={i === index}
              title={`${i + 1}. ${l.title}`}
              aria-label={`Lesson ${i + 1}: ${l.title}${state.learn[l.id] ? ' (passed)' : ''}`}
            />
          ))}
        </div>
        <FocusLink lessonId={lesson.id} />
        <Streak />
      </div>

      <article className="lm-flow" ref={textRef}>
        <div className="lm-text__kicker">
          <LangMark lang={track.lang} size={18} />
          Lesson {index + 1} of {track.lessons.length}
          {lessonMastered(lesson, state.learn) && practiceTotal(lesson) ? (
            <span className="lm-passed-tag">Mastered</span>
          ) : passedBefore ? (
            <span className="lm-passed-tag">Passed</span>
          ) : null}
        </div>
        <h1 className="lm-text__title">{lesson.title}</h1>
        <ReadAloud {...pauses} />

        {/* The explanation, with its examples runnable where they stand. */}
        <div className="lm-teach">
          <Markdown renderCode={teachCode} notes>
            {lesson.teach}
          </Markdown>
        </div>

        {/* Then her turn, in the same place. */}
        <section className="lm-challenge">
          <div className="lm-challenge__label">Your turn</div>
          <Markdown>{lesson.task}</Markdown>
          {lesson.stdin ? (
            <div className="lm-stdin">
              <div className="lm-stdin__label">Input the program reads</div>
              <pre>{lesson.stdin}</pre>
            </div>
          ) : null}
          {terminal ? <p className="lm-challenge__how">Type the commands into the terminal below, then press Check.</p> : null}
        </section>

        <div className="lm-work">
        {terminal ? (
          <TerminalChallenge lesson={lesson} onPass={onPassed} onGraded={onGraded} />
        ) : (
          <PlaygroundEmbed
            lang={editorLang(lesson.lang)}
            code={lesson.starter}
            saveKey={`learn:${lesson.id}`}
            grade={grade}
            onPass={onPassed}
            runLabel="Run Code"
            input={false}
            minHeight={260}
            testsHint="Press Run Code to run your code against the tests."
            eager
          />
        )}
        </div>

        <div ref={winRef}>
          {passedNow ? (
            <div className="lm-win">
              <IconCheck size={16} />
              <span className="grow">
                {practiceTotal(lesson) && !lessonMastered(lesson, state.learn)
                  ? `Lesson passed. Now the practice below: ${practiceTotal(lesson)} more on the same idea, and the lesson is mastered.`
                  : next
                  ? `Lesson passed. Next: ${next.title}`
                  : nextCourse
                    ? `That is the whole ${track.name} course. Next: ${nextCourse.name}.`
                    : `Lesson passed — that is the whole ${track.name} course.`}
              </span>
              <button
                type="button"
                className="ide-run"
                onClick={() => navigate(next ? `/learn/${next.id}` : nextCourse ? `/learn/${nextCourse.lessons[0]!.id}` : `/learn/${track.id}`)}
              >
                {next ? 'Continue' : nextCourse ? 'Start the next course' : 'Back to the course'}
                <IconArrowRight size={13} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="lm-help">
          {stuck && !passedNow ? (
            <div className="lm-stuck" role="status">
              <div className="lm-stuck__title">Stuck? That is normal here.</div>
              <p>
                The check that is not passing yet: <strong>{stuck.miss.name}</strong>
                {stuck.miss.hint ? <> — {stuck.miss.hint}</> : null}
              </p>
              <div className="lm-help__row">
                <button type="button" className="lm-link" onClick={() => setAsking(stuck.seed)}>
                  Explain what this check needs
                </button>
                {stuck.revisit ? (
                  <a className="lm-link" href={`#/learn/${stuck.revisit.lessonId}`}>
                    Look back at “{stuck.revisit.title}”
                  </a>
                ) : null}
                {hints < lesson.hints.length ? (
                  <button type="button" className="lm-link" onClick={() => setHints((n) => n + 1)}>
                    Show the next hint
                  </button>
                ) : null}
              </div>
              {stuck.suggestSolution && !showSolution ? (
                <p className="lm-stuck__solution">
                  Still not passing after {fails} tries? Open the solution, read it line by line, then close it and type it
                  yourself.{' '}
                  <button type="button" className="lm-link" onClick={() => setShowSolution(true)}>
                    Show the solution
                  </button>
                </p>
              ) : null}
            </div>
          ) : null}
          {lesson.hints.slice(0, hints).map((h, i) => (
            <div className="lm-hint" key={i}>
              <span className="lm-hint__n">Hint {i + 1}</span>
              <Markdown>{h}</Markdown>
            </div>
          ))}
          <div className="lm-help__row">
            {hints < lesson.hints.length ? (
              <button type="button" className="lm-link" onClick={() => setHints((n) => n + 1)}>
                {hints === 0 ? 'Show a hint' : 'Another hint'}
              </button>
            ) : null}
            <button type="button" className="lm-link" onClick={() => setShowSolution((v) => !v)}>
              {showSolution ? 'Hide the solution' : 'Show the solution'}
            </button>
          </div>
          {showSolution ? (
            <div className="lm-solution">
              <p>One way to do it. Try typing it yourself rather than copying — that is where it sticks.</p>
              <Markdown>{'```' + fence(lesson.lang) + '\n' + lesson.solution + '```'}</Markdown>
            </div>
          ) : null}
        </div>

        {(passedBefore || passedNow) && practiceTotal(lesson) ? <PracticeSection lesson={lesson} /> : null}

        <div className="lm-nav">
          {prev ? (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/learn/${prev.id}`)}>
              <IconChevronLeft size={13} />
              {prev.title}
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/learn/${next.id}`)}>
              {next.title}
              <IconArrowRight size={13} />
            </Button>
          ) : null}
        </div>
      </article>
      <SelectionAsk container={textRef} onAsk={setAsking} />
      {asking ? <ExplainPanel seed={asking} here={here} extra={passedHere} lang={lesson.lang} onClose={closeAsk} /> : null}
    </div>
  )
}

/**
 * Read aloud, the whole lesson as one reading (learn/reading.ts): each example
 * is run where it stands and the reading goes on; the task and every practice
 * problem or question hold the reading until she has passed it.
 */
function useLessonReading(lesson: LearnLesson, terminal: boolean): Pick<ReadAloudProps, 'markdown' | 'contentSelector' | 'pauses'> {
  const { state } = useLearner()
  const learned = useRef(state.learn)
  learned.current = state.learn
  // The practice still to do when the lesson opened. Fixed for the visit: the
  // reading must not change under the voice as items are passed.
  const [items] = useState<ReadingItem[]>(() => [
    ...lesson.practice.filter((ex) => !state.learn[ex.id]).map((ex) => ({ id: ex.id, text: `${ex.title}\n\n${ex.task}` })),
    ...(lesson.quiz ?? [])
      .filter((q) => !state.learn[q.id])
      .map((q) => ({ id: q.id, text: `${q.title}\n\n${q.ask}${q.choices ? `\n\n${q.choices.map((c) => `- ${c.text}`).join('\n')}` : ''}` })),
  ])
  const reading = useMemo(() => readingOf(lesson.teach, lesson.task, items, (info, code) => !!runnableFence(info, code)), [lesson, items])

  const run = useCallback(
    async (id: string, signal: AbortSignal) => {
      const stop = reading.stops[id]
      if (!stop) return
      if (stop.kind === 'example') {
        await runWindow(exampleGuideId(stop.code), signal)
        // A breath to look at what it printed before the voice goes on.
        await new Promise((r) => setTimeout(r, 700))
        return
      }
      if (stop.kind === 'task') {
        if (learned.current[lesson.id]) return
        bringIntoView(document.querySelector('.lm-work'))
        return whenSolved(lesson.id, signal)
      }
      if (stop.kind === 'show') {
        // The practice appears once the task is passed; give it a moment to be there.
        for (let i = 0; i < 40 && !document.querySelector('.lm-practice') && !signal.aborted; i++) await new Promise((r) => setTimeout(r, 50))
        showItem(stop.id)
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        bringIntoView(document.querySelector('.lm-practice'))
        return
      }
      if (learned.current[stop.id]) return
      return whenSolved(stop.id, signal)
    },
    [reading, lesson.id],
  )

  const label = useCallback(
    (id: string) => {
      const stop = reading.stops[id]
      if (stop?.kind === 'example') return 'Running the example…'
      if (stop?.kind === 'task') return terminal ? 'Your turn: type the commands and press Check. Reading goes on when they pass.' : 'Your turn: press Run Code when your code is ready. Reading goes on when it passes.'
      if (stop?.kind === 'item') return 'Practice: reading goes on when this one passes.'
      return 'Next…'
    },
    [reading, terminal],
  )

  const pauses = useMemo(() => ({ run, label }), [run, label])
  return { markdown: reading.markdown, contentSelector: '.lm-flow', pauses }
}

function fence(lang: LearnLesson['lang']): string {
  return lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang
}

/** The first unpassed lesson for a language, for links from elsewhere. */
export function useNextLesson(lang: string): { lesson: LessonMeta; done: number; total: number } | null {
  const { state } = useLearner()
  return useMemo(() => {
    const track = currentTrack(lang, state.learn)
    if (!track) return null
    return { lesson: nextLesson(track, state.learn), done: passedCount(track, state.learn), total: track.lessons.length }
  }, [lang, state.learn])
}

/**
 * Learn to code has its own focus block: this opens the Focus page on the
 * coding side, pointed at this lesson. Hidden while a block is already running,
 * since the strip at the bottom is then the way back to it.
 */
function FocusLink({ lessonId }: { lessonId: string }) {
  const { state } = useLearner()
  if (state.focus) return null
  return (
    <a className="lm-focus" href={`#/focus?on=code&lesson=${encodeURIComponent(lessonId)}`} title="Start a focus block on this lesson">
      <IconClock size={13} />
      Focus
    </a>
  )
}
