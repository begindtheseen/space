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
import { findLesson as findCourseLesson } from '@/learn/index'
import { findModuleLesson } from '@/learn/modules'
import { courseCredit } from '@/learn/credit'
import { editorLang, runLearn, warmUp } from '@/learn/platform'
import {
  RETEST_DAYS,
  RETEST_RUNS,
  asLesson,
  choiceOrder,
  courseMastered,
  dueRetests,
  answerInSitting,
  endSitting,
  msLeft,
  nextSittingAt,
  openSitting,
  passInSitting,
  practiceDone,
  practiceTotal,
  retestProblem,
  sittingPassed,
  sittingScore,
  startSitting,
  type Retest,
} from '@/learn/practice'
import type { CheckResult, LearnExercise, LearnLesson, LearnQuestion, LearnTrack } from '@/learn/types'
import { answerMatches } from '@/learn/parse'
import { Markdown } from '@/lib/markdown'
import { navigate } from '@/lib/router'
import { TerminalChallenge } from './LearnTerminal'

/** A lesson of a course, or a module's practice set: re-tests come from both. */
const findLesson = (id: string) => findCourseLesson(id) ?? findModuleLesson(id)

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

/* ── One question ───────────────────────────────────────────────────────── */

/**
 * A question: pick the choice (or choices), or type the answer, then submit.
 * In a gate (`exam`), it is answered once and says nothing until the sitting
 * ends; in practice it says at once whether it was right, and why.
 */
export function QuestionCard({
  q,
  exam,
  result,
  reveal,
  onAnswer,
}: {
  q: LearnQuestion
  exam: boolean
  /** Its answer so far, if any. */
  result?: boolean
  /** Show the right answer and the why (practice after answering; a gate after the sitting). */
  reveal: boolean
  onAnswer: (ok: boolean) => void
}) {
  const [picked, setPicked] = useState<number[]>([])
  const [typed, setTyped] = useState('')
  // A fresh order each time the question is shown: the answer is recognised, not remembered by place.
  const [order] = useState(() => choiceOrder(q))
  const multi = (q.choices?.filter((c) => c.correct).length ?? 0) > 1
  // A gate's review after the sitting only shows: nothing can be answered there.
  const locked = exam ? reveal || result !== undefined : result === true
  const submit = () => {
    if (q.choices) {
      const right = q.choices.map((c, i) => (c.correct ? i : -1)).filter((i) => i >= 0)
      onAnswer(right.length === picked.length && right.every((i) => picked.includes(i)))
    } else onAnswer(answerMatches(q, typed))
  }
  const ready = q.choices ? picked.length > 0 : typed.trim() !== ''
  return (
    <div className="lm-q" data-result={result === undefined ? undefined : result ? 'right' : 'wrong'}>
      {/* A title can hint at the answer ("One arrow too few"): in an exam it waits for the review. */}
      <div className="lm-practice__title">{exam && !reveal ? 'Question' : q.title}</div>
      <Markdown>{q.ask}</Markdown>
      {q.choices ? (
        <div className="lm-q__choices" role={multi ? 'group' : 'radiogroup'}>
          {multi ? <div className="lm-practice__locked">More than one is right: pick every one.</div> : null}
          {order.map((i) => ({ c: q.choices![i]!, i })).map(({ c, i }) => (
            <label key={i} className="lm-q__choice" data-right={reveal && c.correct ? 'true' : undefined}>
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={q.id}
                disabled={locked}
                checked={picked.includes(i)}
                onChange={() => setPicked((p) => (multi ? (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]) : [i]))}
              />
              <span>
                <Markdown>{c.text}</Markdown>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <input
          className="lm-q__typed"
          aria-label="Your answer"
          value={typed}
          disabled={locked}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && ready && !locked) submit()
          }}
          placeholder="Type your answer"
        />
      )}
      <div className="lm-help__row">
        {!locked ? (
          <button type="button" className="ide-run" disabled={!ready} onClick={submit}>
            {exam ? 'Submit answer' : result === false ? 'Try again' : 'Check'}
          </button>
        ) : exam && !reveal ? (
          <span className="lm-practice__locked">Answered. You will see how it went when the sitting ends.</span>
        ) : null}
        {!exam && result !== undefined ? <span className="lm-q__verdict">{result ? 'Right.' : 'Not quite.'}</span> : null}
      </div>
      {reveal && (exam || result !== undefined) ? (
        <div className="lm-hint">
          {q.answers ? <span className="lm-hint__n">Answer: {q.answers[0]}</span> : null}
          <Markdown>{q.why}</Markdown>
        </div>
      ) : null}
    </div>
  )
}

/* ── Practice, under a lesson ───────────────────────────────────────────── */

/** Runs before the solution of a practice problem can be opened. */
const TRIES_BEFORE_SOLUTION = 3

type PracticeItem = { kind: 'problem'; ex: LearnExercise } | { kind: 'question'; q: LearnQuestion }

export function PracticeSection({ lesson, optional = false }: { lesson: LearnLesson; optional?: boolean }) {
  const { state, setState } = useLearner()
  const items = useMemo<PracticeItem[]>(
    () => [...lesson.practice.map((ex) => ({ kind: 'problem' as const, ex })), ...(lesson.quiz ?? []).map((q) => ({ kind: 'question' as const, q }))],
    [lesson],
  )
  const idOf = (it: PracticeItem) => (it.kind === 'problem' ? it.ex.id : it.q.id)
  const titleOf = (it: PracticeItem) => (it.kind === 'problem' ? it.ex.title : it.q.title)
  const firstOpen = items.findIndex((it) => !state.learn[idOf(it)])
  const [at, setAt] = useState(firstOpen < 0 ? 0 : firstOpen)
  const [hints, setHints] = useState(0)
  const [fails, setFails] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [solvedNow, setSolvedNow] = useState(false)
  const [answer, setAnswer] = useState<boolean | undefined>(undefined)
  const item = items[at]!
  const id = idOf(item)
  const unit = useMemo(() => (item.kind === 'problem' ? asLesson(lesson, item.ex) : null), [lesson, item])
  const done = practiceDone(lesson, state.learn)
  const total = practiceTotal(lesson)
  const solved = !!state.learn[id]

  useEffect(() => {
    setHints(0)
    setFails(0)
    setShowSolution(false)
    setSolvedNow(false)
    setAnswer(undefined)
  }, [id])

  const onGraded = useCallback((passed: boolean) => {
    if (!passed) setFails((n) => n + 1)
  }, [])
  const onPass = useCallback(() => {
    setState((s) => markPracticed(s, lesson, id))
    setSolvedNow(true)
  }, [id, lesson, setState])
  const onAnswer = (ok: boolean) => {
    setAnswer(ok)
    if (ok) onPass()
  }

  const nextOpen = items.findIndex((it, i) => i !== at && !state.learn[idOf(it)])
  const allDone = done === total
  const questions = lesson.quiz?.length ?? 0

  return (
    <section className="lm-practice" aria-label="Practice">
      <div className="lm-practice__head">
        <div>
          <div className="lm-challenge__label">Practice</div>
          <p className="lm-practice__why">
            {optional && !allDone
              ? 'Optional: you already mastered this in Learn to code. Try a problem or two if you want the module’s angle on it.'
              : allDone
              ? 'Everything here solved: this lesson is mastered. It will come back as a re-test in a few days.'
              : `Passing the lesson once shows you followed it. These ${total} ${questions && lesson.practice.length ? 'problems and questions' : questions ? 'questions' : 'problems'}, on the same idea with new data and new twists, are how it sticks.`}
          </p>
        </div>
        <span className="lm-practice__n">
          {done}/{total}
        </span>
      </div>
      <div className="lm-practice__dots" role="tablist" aria-label="Practice">
        {items.map((it, i) => (
          <button
            key={idOf(it)}
            type="button"
            role="tab"
            aria-selected={i === at}
            className="lm-practice__dot"
            data-kind={it.kind}
            data-done={!!state.learn[idOf(it)]}
            data-here={i === at}
            onClick={() => setAt(i)}
            title={`${i + 1}. ${titleOf(it)}`}
          >
            {state.learn[idOf(it)] ? <IconCheck size={11} /> : it.kind === 'question' ? '?' : i + 1}
          </button>
        ))}
      </div>

      {item.kind === 'question' ? (
        <div className="lm-challenge">
          <QuestionCard key={id} q={item.q} exam={false} result={solved ? true : answer} reveal={answer !== undefined || solved} onAnswer={onAnswer} />
        </div>
      ) : (
        <>
          <div className="lm-challenge">
            <div className="lm-practice__title">
              {at + 1}. {item.ex.title}
              {solved ? <span className="lm-passed-tag">Solved</span> : null}
            </div>
            <ProblemText unit={unit!} />
          </div>
          <div className="lm-work">
            <ProblemWork key={id} unit={unit!} saveKey={`learn:${id}`} onPass={onPass} onGraded={onGraded} />
          </div>
        </>
      )}

      {solvedNow ? (
        <div className="lm-win">
          <IconCheck size={16} />
          <span className="grow">{nextOpen >= 0 ? `Solved. Next: ${titleOf(items[nextOpen]!)}` : 'Solved — that is all the practice for this lesson.'}</span>
          {nextOpen >= 0 ? (
            <button type="button" className="ide-run" onClick={() => setAt(nextOpen)}>
              Next
              <IconArrowRight size={13} />
            </button>
          ) : null}
        </div>
      ) : null}

      {unit ? (
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
      ) : null}
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

/** A course's mastery gate in Learn to code. */
export function GateView({ track, lesson }: { track: LearnTrack; lesson: LearnLesson }) {
  const { state } = useLearner()
  const fromModules = state.learn[lesson.id] ? null : courseCredit(track.id, state.learn)
  return (
    <>
      {fromModules ? (
        <div className="lm-win lm-flow" style={{ marginTop: 18 }}>
          <IconCheck size={16} />
          <span className="grow">
            This gate counts as passed: you passed the module test{fromModules.length > 1 ? 's' : ''} that cover everything in {track.name}. The next course is
            open. You can still sit it below.
          </span>
        </div>
      ) : null}
    <GateScreen
      lesson={lesson}
      kicker="Mastery gate"
      back={{ href: `#/learn/${track.id}`, label: track.title }}
      markLang={track.lang}
      passedText={courseMastered(track, state.learn) ? `${track.name} is mastered.` : 'Gate passed, so the next course is open. This course counts as mastered once every lesson’s practice is done too.'}
      />
    </>
  )
}

/**
 * A gate: the rules, the last sitting's result and review, and the sitting
 * itself. A course's mastery gate and a module's test are both this.
 */
export function GateScreen({
  lesson,
  kicker,
  back,
  markLang,
  passedText,
}: {
  lesson: LearnLesson
  kicker: string
  back: { href: string; label: string }
  markLang: LearnLesson['lang']
  passedText: string
}) {
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
  const qById = useMemo(() => new Map(gate.questions.map((q) => [q.id, q])), [gate.questions])

  if (sitting) {
    const ids = sitting.order.filter((id) => byId.has(id))
    const qids = (sitting.qorder ?? []).filter((id) => qById.has(id))
    const all = [...ids, ...qids]
    const i = Math.min(at, all.length - 1)
    const id = all[i]!
    const isQ = i >= ids.length
    const unit = isQ ? null : asLesson(lesson, byId.get(id)!)
    const passedCount = ids.filter((x) => sitting.passed[x]).length
    const answeredCount = qids.filter((x) => sitting.answered?.[x]).length
    const left = msLeft(lesson, sitting, now)
    return (
      <div className="page page--padtop ide-wrap">
        <div className="lm-gate-bar" role="status">
          <span className="lm-gate-bar__title">{lesson.title}</span>
          {ids.length ? (
            <span>
              Problems passed {passedCount}/{ids.length} (need {gate.pass})
            </span>
          ) : null}
          {qids.length ? (
            <span>
              Questions answered {answeredCount}/{qids.length} (need {gate.questionPass} right)
            </span>
          ) : null}
          <span className="lm-gate-bar__clock" data-low={left < 5 * 60_000}>
            <IconClock size={13} /> {clock(left)}
          </span>
          <button type="button" className="lm-link" onClick={handIn}>
            Hand in
          </button>
        </div>
        <article className="lm-flow">
          <div className="lm-practice__dots" role="tablist" aria-label="Gate problems and questions">
            {all.map((pid, k) => {
              const q = k >= ids.length
              const done = q ? !!sitting.answered?.[pid] : !!sitting.passed[pid]
              return (
                <button
                  key={pid}
                  type="button"
                  role="tab"
                  aria-selected={k === i}
                  className="lm-practice__dot"
                  data-kind={q ? 'question' : 'problem'}
                  data-done={done}
                  data-here={k === i}
                  onClick={() => setAt(k)}
                  title={q ? `Question ${k - ids.length + 1}` : `Problem ${k + 1}`}
                >
                  {done ? <IconCheck size={11} /> : q ? `Q${k - ids.length + 1}` : k + 1}
                </button>
              )
            })}
          </div>
          {isQ ? (
            <section className="lm-challenge">
              <QuestionCard
                key={`${sitting.startedAt}:${id}`}
                q={qById.get(id)!}
                exam
                {...(sitting.answered?.[id] ? { result: sitting.answered[id].ok } : {})}
                reveal={false}
                onAnswer={(ok) => {
                  setState((s) => updateGate(s, lesson, (r) => answerInSitting(r!, id, ok)))
                  if (i + 1 < all.length) setAt(i + 1)
                }}
              />
            </section>
          ) : (
            <>
              <section className="lm-challenge">
                <div className="lm-practice__title">
                  Problem {i + 1}. {unit!.title}
                  {sitting.passed[id] ? <span className="lm-passed-tag">Passed</span> : null}
                </div>
                <ProblemText unit={unit!} />
              </section>
              <div className="lm-work">
                <ProblemWork
                  key={`${sitting.startedAt}:${id}`}
                  unit={unit!}
                  saveKey={`learn:${lesson.id}:${sitting.startedAt}:${id}`}
                  onPass={() => setState((s) => updateGate(s, lesson, (r) => passInSitting(r!, id)))}
                  onGraded={() => {}}
                />
              </div>
            </>
          )}
          <p className="lm-gate-rules">
            No hints, no solutions and no Explain during a sitting: this is the exam. Take the problems and questions in any order; each question is answered once.
          </p>
        </article>
      </div>
    )
  }

  const score = last ? sittingScore(last) : null
  const lastPassed = last ? sittingPassed(lesson, last) : false
  return (
    <div className="page page--padtop ide-wrap">
      <a className="lm-back" href={back.href}>
        <IconChevronLeft size={13} />
        {back.label}
      </a>
      <article className="lm-flow">
        <div className="lm-text__kicker">
          <LangMark lang={markLang} size={18} />
          {kicker}
          {passedGate ? <span className="lm-passed-tag">Passed</span> : null}
        </div>
        <h1 className="lm-text__title">{lesson.title}</h1>
        <div className="lm-teach">
          <Markdown>{lesson.teach}</Markdown>
        </div>
        <ul className="lm-gate-terms">
          {gate.problems.length ? (
            <li>
              <strong>{gate.problems.length} problems</strong> you have not seen: pass <strong>{gate.pass}</strong>.
            </li>
          ) : null}
          {gate.questions.length ? (
            <li>
              <strong>{gate.questions.length} questions</strong> on how and why it works, each answered once: get <strong>{gate.questionPass}</strong> right.
            </li>
          ) : null}
          <li>
            Both in one sitting of <strong>{gate.minutes} minutes</strong>, in a new order each time.
          </li>
          <li>No hints, no solutions, no Explain. Your notes are fair game; the answers are not.</li>
          <li>Until it is passed, what comes after stays locked. Miss the mark and the next sitting opens 12 hours later: time to go back over what tripped you up.</li>
        </ul>
        {last?.endedAt && score ? (
          <div className={lastPassed ? 'lm-win' : 'lm-gate-result'}>
            {lastPassed ? <IconCheck size={16} /> : null}
            <span className="grow">
              Last sitting:{gate.problems.length ? ` ${score.problems} of ${last.order.length} problems passed (need ${gate.pass})` : ''}
              {gate.problems.length && gate.questions.length ? ',' : ''}
              {gate.questions.length ? ` ${score.questions} of ${gate.questions.length} questions right (need ${gate.questionPass})` : ''}.{' '}
              {lastPassed ? passedText : 'Not this time. Go back over the lessons behind what you missed, then sit it again.'}
            </span>
          </div>
        ) : null}
        {last?.endedAt && gate.questions.length ? (
          <details className="lm-gate-review">
            <summary>Go over the last sitting’s questions</summary>
            {gate.questions.map((q) => (
              <QuestionCard key={q.id} q={q} exam {...(last.answered?.[q.id] ? { result: last.answered[q.id].ok } : {})} reveal onAnswer={() => {}} />
            ))}
          </details>
        ) : null}
        <div className="lm-course-go">
          {waitUntil ? (
            <span>The next sitting opens in {clock(waitUntil.getTime() - now.getTime())}.</span>
          ) : (
            <button type="button" className="ide-run" onClick={start}>
              {passedGate ? 'Sit it again' : record?.sittings.length ? 'Start another sitting' : `Start the ${kicker.toLowerCase()}`}
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
              <button
                type="button"
                className="lm-link"
                onClick={() => navigate(found.track.module ? `/module/${found.track.module}?lesson=${found.lesson.forLesson}` : `/learn/${found.lesson.id}`)}
              >
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
