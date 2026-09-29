/* ============================================================================
   Learn to code — practice, mastery gates and re-tests
   ----------------------------------------------------------------------------
   What turns "I got the lesson's task to pass" into "I can do this":

     PracticeSection  under a passed lesson: its practice problems, one at a
                      time, each graded like the lesson. The solution opens
                      only after three honest tries.
     GateView         a course's mastery gate: unseen problems, one sitting,
                      a clock, no hints, no solutions, no Explain. The pass
                      mark is the only way a course counts as mastered.
     RetestView       #/learn/retests: mastered lessons coming back days and
                      weeks later, one practice problem each, without help.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlaygroundEmbed, type Graded } from '@/components/ide/Embed'
import { LangMark } from '@/components/ide'
import { IconArrowRight, IconCheck, IconChevronLeft, IconClock } from '@/components/icons'
import { markPracticed, recordRetest, updateGate } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import { buildProgram, gradeRun } from '@/learn/grade'
import { findLesson } from '@/learn/index'
import { editorLang, runLearn, warmUp } from '@/learn/platform'
import {
  RETEST_DAYS,
  RETEST_RUNS,
  asLesson,
  courseMastered,
  dueRetests,
  endSitting,
  msLeft,
  nextSittingAt,
  openSitting,
  passInSitting,
  practiceDone,
  retestProblem,
  sittingPassed,
  startSitting,
  type Retest,
} from '@/learn/practice'
import type { CheckResult, LearnLesson, LearnTrack } from '@/learn/types'
import { Markdown } from '@/lib/markdown'
import { navigate } from '@/lib/router'
import { TerminalChallenge } from './LearnTerminal'

/* ── One graded problem ─────────────────────────────────────────────────── */

function useGrader(unit: LearnLesson, onGraded: (passed: boolean, results: CheckResult[]) => void) {
  return useCallback(
    async (code: string, _stdin: string, onStatus: (s: string) => void): Promise<Graded> => {
      const result = await runLearn(unit, buildProgram(unit, code), { onStatus })
      const g = gradeRun(unit, code, result)
      onGraded(g.passed, g.results)
      return {
        run: { stdout: g.output, stderr: g.stderr, error: g.error, plots: [], result: null, tables: g.tables, ms: g.ms },
        tests: g.results,
      }
    },
    [unit, onGraded],
  )
}

function ProblemWork({
  unit,
  saveKey,
  onPass,
  onGraded,
}: {
  unit: LearnLesson
  saveKey?: string
  onPass: () => void
  onGraded: (passed: boolean, results: CheckResult[]) => void
}) {
  const grade = useGrader(unit, onGraded)
  useEffect(() => warmUp(unit.lang), [unit.lang])
  if (unit.lang === 'bash' || unit.lang === 'git') return <TerminalChallenge lesson={unit} onPass={onPass} onGraded={onGraded} />
  return (
    <PlaygroundEmbed
      lang={editorLang(unit.lang)}
      code={unit.starter}
      {...(saveKey ? { saveKey } : {})}
      grade={grade}
      onPass={onPass}
      runLabel="Run Code"
      input={false}
      minHeight={240}
      testsHint="Press Run Code to run your code against the tests."
      eager
    />
  )
}

function ProblemText({ unit }: { unit: LearnLesson }) {
  return (
    <>
      <Markdown>{unit.task}</Markdown>
      {unit.stdin ? (
        <div className="lm-stdin">
          <div className="lm-stdin__label">Input the program reads</div>
          <pre>{unit.stdin}</pre>
        </div>
      ) : null}
      {unit.lang === 'bash' || unit.lang === 'git' ? <p className="lm-challenge__how">Type the commands into the terminal below, then press Check.</p> : null}
    </>
  )
}

function fence(lang: LearnLesson['lang']): string {
  return lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang
}

/* ── Practice, under a lesson ───────────────────────────────────────────── */

/** Runs before the solution of a practice problem can be opened. */
const TRIES_BEFORE_SOLUTION = 3

export function PracticeSection({ lesson }: { lesson: LearnLesson }) {
  const { state, setState } = useLearner()
  const problems = lesson.practice
  const firstOpen = problems.findIndex((p) => !state.learn[p.id])
  const [at, setAt] = useState(firstOpen < 0 ? 0 : firstOpen)
  const [hints, setHints] = useState(0)
  const [fails, setFails] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [solvedNow, setSolvedNow] = useState(false)
  const ex = problems[at]!
  const unit = useMemo(() => asLesson(lesson, ex), [lesson, ex])
  const done = practiceDone(lesson, state.learn)
  const solved = !!state.learn[ex.id]

  useEffect(() => {
    setHints(0)
    setFails(0)
    setShowSolution(false)
    setSolvedNow(false)
  }, [ex.id])

  const onGraded = useCallback((passed: boolean) => {
    if (!passed) setFails((n) => n + 1)
  }, [])
  const onPass = useCallback(() => {
    setState((s) => markPracticed(s, lesson, ex.id))
    setSolvedNow(true)
  }, [ex.id, lesson, setState])

  const nextOpen = problems.findIndex((p, i) => i !== at && !state.learn[p.id] && p.id !== ex.id)
  const allDone = done === problems.length

  return (
    <section className="lm-practice" aria-label="Practice">
      <div className="lm-practice__head">
        <div>
          <div className="lm-challenge__label">Practice</div>
          <p className="lm-practice__why">
            {allDone
              ? 'Every practice problem solved: this lesson is mastered. It will come back as a re-test in a few days.'
              : `Passing the lesson once shows you followed it. These ${problems.length} problems, on the same idea with new data and new twists, are how it sticks.`}
          </p>
        </div>
        <span className="lm-practice__n">
          {done}/{problems.length}
        </span>
      </div>
      <div className="lm-practice__dots" role="tablist" aria-label="Practice problems">
        {problems.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === at}
            className="lm-practice__dot"
            data-done={!!state.learn[p.id]}
            data-here={i === at}
            onClick={() => setAt(i)}
            title={`${i + 1}. ${p.title}`}
          >
            {state.learn[p.id] ? <IconCheck size={11} /> : i + 1}
          </button>
        ))}
      </div>

      <div className="lm-challenge">
        <div className="lm-practice__title">
          {at + 1}. {ex.title}
          {solved ? <span className="lm-passed-tag">Solved</span> : null}
        </div>
        <ProblemText unit={unit} />
      </div>
      <div className="lm-work">
        <ProblemWork key={ex.id} unit={unit} saveKey={`learn:${ex.id}`} onPass={onPass} onGraded={onGraded} />
      </div>

      {solvedNow ? (
        <div className="lm-win">
          <IconCheck size={16} />
          <span className="grow">{nextOpen >= 0 ? `Solved. Next: ${problems[nextOpen]!.title}` : 'Solved — that is every practice problem for this lesson.'}</span>
          {nextOpen >= 0 ? (
            <button type="button" className="ide-run" onClick={() => setAt(nextOpen)}>
              Next problem
              <IconArrowRight size={13} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="lm-help">
        {unit.hints.slice(0, hints).map((h, i) => (
          <div className="lm-hint" key={i}>
            <span className="lm-hint__n">Hint {i + 1}</span>
            <Markdown>{h}</Markdown>
          </div>
        ))}
        <div className="lm-help__row">
          {hints < unit.hints.length ? (
            <button type="button" className="lm-link" onClick={() => setHints((n) => n + 1)}>
              {hints === 0 ? 'Show a hint' : 'Another hint'}
            </button>
          ) : null}
          {solved || fails >= TRIES_BEFORE_SOLUTION ? (
            <button type="button" className="lm-link" onClick={() => setShowSolution((v) => !v)}>
              {showSolution ? 'Hide the solution' : 'Show the solution'}
            </button>
          ) : (
            <span className="lm-practice__locked">The solution opens after {TRIES_BEFORE_SOLUTION} runs that do not pass.</span>
          )}
        </div>
        {showSolution ? (
          <div className="lm-solution">
            <p>One way to do it. Close it, then write it yourself from memory.</p>
            <Markdown>{'```' + fence(unit.lang) + '\n' + unit.solution + '```'}</Markdown>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/* ── The mastery gate ───────────────────────────────────────────────────── */

function useNow(everyMs: number): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), everyMs)
    return () => clearInterval(t)
  }, [everyMs])
  return now
}

function clock(ms: number): string {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

export function GateView({ track, lesson }: { track: LearnTrack; lesson: LearnLesson }) {
  const { state, setState } = useLearner()
  const now = useNow(1000)
  const gate = lesson.gate!
  const record = state.learnGates[lesson.id]
  const sitting = openSitting(lesson, record, now)
  const last = record?.sittings[record.sittings.length - 1]
  const passedGate = !!state.learn[lesson.id]
  const waitUntil = passedGate ? null : nextSittingAt(lesson, record, now)
  const [at, setAt] = useState(0)

  // Time up: the sitting ends on its own, and what was passed in time is what counts.
  useEffect(() => {
    if (last && !last.endedAt && !sitting) setState((s) => updateGate(s, lesson, (r) => endSitting(r!)))
  }, [last, sitting, lesson, setState])

  const start = () => {
    setAt(0)
    setState((s) => updateGate(s, lesson, (r) => startSitting(lesson, r)))
  }
  const handIn = () => setState((s) => updateGate(s, lesson, (r) => endSitting(r!)))

  const byId = useMemo(() => new Map(gate.problems.map((p) => [p.id, p])), [gate.problems])

  if (sitting) {
    const ids = sitting.order.filter((id) => byId.has(id))
    const id = ids[Math.min(at, ids.length - 1)]!
    const unit = asLesson(lesson, byId.get(id)!)
    const passedCount = ids.filter((i) => sitting.passed[i]).length
    const left = msLeft(lesson, sitting, now)
    return (
      <div className="page page--padtop ide-wrap">
        <div className="lm-gate-bar" role="status">
          <span className="lm-gate-bar__title">{lesson.title}</span>
          <span>
            Passed {passedCount} of {ids.length} · pass mark {gate.pass}
          </span>
          <span className="lm-gate-bar__clock" data-low={left < 5 * 60_000}>
            <IconClock size={13} /> {clock(left)}
          </span>
          <button type="button" className="lm-link" onClick={handIn}>
            Hand in
          </button>
        </div>
        <article className="lm-flow">
          <div className="lm-practice__dots" role="tablist" aria-label="Gate problems">
            {ids.map((pid, i) => (
              <button
                key={pid}
                type="button"
                role="tab"
                aria-selected={pid === id}
                className="lm-practice__dot"
                data-done={!!sitting.passed[pid]}
                data-here={pid === id}
                onClick={() => setAt(i)}
              >
                {sitting.passed[pid] ? <IconCheck size={11} /> : i + 1}
              </button>
            ))}
          </div>
          <section className="lm-challenge">
            <div className="lm-practice__title">
              Problem {Math.min(at, ids.length - 1) + 1}. {unit.title}
              {sitting.passed[id] ? <span className="lm-passed-tag">Passed</span> : null}
            </div>
            <ProblemText unit={unit} />
          </section>
          <div className="lm-work">
            <ProblemWork
              key={`${sitting.startedAt}:${id}`}
              unit={unit}
              saveKey={`learn:${lesson.id}:${sitting.startedAt}:${id}`}
              onPass={() => setState((s) => updateGate(s, lesson, (r) => passInSitting(r!, id)))}
              onGraded={() => {}}
            />
          </div>
          <p className="lm-gate-rules">No hints, no solutions and no Explain during a sitting: this is the exam. Problems can be done in any order.</p>
        </article>
      </div>
    )
  }

  const lastScore = last ? Object.keys(last.passed).length : 0
  return (
    <div className="page page--padtop ide-wrap">
      <a className="lm-back" href={`#/learn/${track.id}`}>
        <IconChevronLeft size={13} />
        {track.title}
      </a>
      <article className="lm-flow">
        <div className="lm-text__kicker">
          <LangMark lang={track.lang} size={18} />
          Mastery gate
          {passedGate ? <span className="lm-passed-tag">Passed</span> : null}
        </div>
        <h1 className="lm-text__title">{lesson.title}</h1>
        <div className="lm-teach">
          <Markdown>{lesson.teach}</Markdown>
        </div>
        <ul className="lm-gate-terms">
          <li>
            <strong>{gate.problems.length} problems</strong> you have not seen, in a new order each sitting.
          </li>
          <li>
            Pass <strong>{gate.pass}</strong> of them within <strong>{gate.minutes} minutes</strong>, in one sitting.
          </li>
          <li>No hints, no solutions, no Explain. Your notes from the course are fair game; the answers are not.</li>
          <li>Miss the pass mark and the next sitting opens 12 hours later: time to go back over what tripped you up.</li>
        </ul>
        {last?.endedAt ? (
          <div className={sittingPassed(lesson, last) ? 'lm-win' : 'lm-gate-result'}>
            {sittingPassed(lesson, last) ? <IconCheck size={16} /> : null}
            <span className="grow">
              Last sitting: {lastScore} of {last.order.length} passed (pass mark {gate.pass}).{' '}
              {!sittingPassed(lesson, last)
                ? 'Not this time. The practice problems of the lessons you found hard are the way back in.'
                : courseMastered(track, state.learn)
                  ? `${track.name} is mastered.`
                  : 'Gate passed. The course counts as mastered once every lesson’s practice is done too.'}
            </span>
          </div>
        ) : null}
        <div className="lm-course-go">
          {waitUntil ? (
            <span>The next sitting opens in {clock(waitUntil.getTime() - now.getTime())}.</span>
          ) : (
            <button type="button" className="ide-run" onClick={start}>
              {passedGate ? 'Sit it again' : record?.sittings.length ? 'Start another sitting' : 'Start the gate'}
              <IconArrowRight size={13} />
            </button>
          )}
        </div>
      </article>
    </div>
  )
}

/* ── Re-tests ───────────────────────────────────────────────────────────── */

export function RetestBanner() {
  const { state } = useLearner()
  const due = dueRetests(state.learnRetests).filter((id) => findLesson(id))
  if (!due.length) return null
  return (
    <a className="lm-retest-banner" href="#/learn/retests">
      <IconClock size={15} />
      <span className="grow">
        {due.length === 1 ? '1 lesson is due for a re-test.' : `${due.length} lessons are due for a re-test.`} One problem each, from memory.
      </span>
      <IconArrowRight size={13} />
    </a>
  )
}

export function RetestView() {
  const { state, setState } = useLearner()
  const due = dueRetests(state.learnRetests).filter((id) => findLesson(id))
  const [runs, setRuns] = useState(0)
  const [outcome, setOutcome] = useState<'pass' | 'miss' | null>(null)
  // The re-test on screen stays put once answered, though answering it reschedules it.
  const [pin, setPin] = useState<{ id: string; r: Retest } | null>(null)
  const head = due[0]
  useEffect(() => {
    if (!pin && head) setPin({ id: head, r: state.learnRetests[head]! })
  }, [pin, head, state.learnRetests])
  const lessonId = pin?.id
  const found = lessonId ? findLesson(lessonId) : undefined
  const r = pin?.r
  const ex = found && r ? retestProblem(found.lesson, r, Math.floor(Date.parse(r.due) / 86_400_000)) : undefined
  const unit = useMemo(() => (found && ex ? asLesson(found.lesson, ex) : null), [found, ex])

  const onGraded = useCallback(
    (passed: boolean) => {
      if (outcome || !lessonId) return
      const n = runs + 1
      setRuns(n)
      if (!passed && n >= RETEST_RUNS) {
        setOutcome('miss')
        setState((s) => recordRetest(s, lessonId, false))
      }
    },
    [outcome, lessonId, runs, setState],
  )
  const onPass = useCallback(() => {
    if (outcome || !lessonId) return
    setOutcome('pass')
    setState((s) => recordRetest(s, lessonId, true))
  }, [outcome, lessonId, setState])
  const next = () => {
    setRuns(0)
    setOutcome(null)
    setPin(null)
  }

  if (!found || !unit || !r) {
    return (
      <div className="page page--padtop ide-wrap">
        <a className="lm-back" href="#/learn">
          <IconChevronLeft size={13} />
          Learn to code
        </a>
        <h1 className="h-page">No re-tests due</h1>
        <p className="page-head__sub">Mastered lessons come back here after {RETEST_DAYS.slice(0, 3).join(', ')} days and longer. Nothing is waiting right now.</p>
      </div>
    )
  }

  return (
    <div className="page page--padtop ide-wrap">
      <a className="lm-back" href="#/learn">
        <IconChevronLeft size={13} />
        Learn to code
      </a>
      <article className="lm-flow">
        <div className="lm-text__kicker">
          <LangMark lang={found.track.lang} size={18} />
          Re-test · {found.track.title}
          {r.rusty ? <span className="lm-outline__tag">Missed last time</span> : null}
        </div>
        <h1 className="lm-text__title">{found.lesson.title}</h1>
        <p className="lm-practice__why">
          From memory: no hints and no solution. Pass within {RETEST_RUNS} runs and it comes back in {RETEST_DAYS[Math.min(r.step + 1, RETEST_DAYS.length - 1)]} days; miss it and it
          comes back in {RETEST_DAYS[0]}.
        </p>
        <section className="lm-challenge">
          <div className="lm-practice__title">{unit.title}</div>
          <ProblemText unit={unit} />
        </section>
        <div className="lm-work">
          <ProblemWork key={`${lessonId}:${r.due}`} unit={unit} onPass={onPass} onGraded={onGraded} />
        </div>
        {outcome ? (
          <div className={outcome === 'pass' ? 'lm-win' : 'lm-gate-result'}>
            {outcome === 'pass' ? <IconCheck size={16} /> : null}
            <span className="grow">
              {outcome === 'pass' ? 'Still there. On to the next one.' : `Not this time: it comes back in ${RETEST_DAYS[0]} days. Go back over the lesson before then.`}
            </span>
            {outcome === 'miss' ? (
              <button type="button" className="lm-link" onClick={() => navigate(`/learn/${found.lesson.id}`)}>
                Open the lesson
              </button>
            ) : null}
            <button type="button" className="ide-run" onClick={next}>
              {due.some((id) => id !== lessonId) ? 'Next re-test' : 'Done'}
              <IconArrowRight size={13} />
            </button>
          </div>
        ) : (
          <div className="lm-help__row">
            <span className="lm-practice__locked">
              Run {runs} of {RETEST_RUNS}
            </span>
            <button
              type="button"
              className="lm-link"
              onClick={() => {
                setOutcome('miss')
                setState((s) => recordRetest(s, lessonId!, false))
              }}
            >
              I do not remember this one
            </button>
          </div>
        )}
      </article>
    </div>
  )
}
