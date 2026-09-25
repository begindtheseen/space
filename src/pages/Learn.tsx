/* ============================================================================
   Learn mode — the guided course
   ----------------------------------------------------------------------------
   `#/learn` lists a track per language; `#/learn/<lesson id>` is one lesson:
   what to understand on the left, the playground's own editor on the right,
   and a Run & check that really runs her code and grades what it did.

   The rules it keeps:
     · Every lesson is open. The order is a recommendation, shown as "Next
       up"; nobody is locked out of the lesson they came for.
     · A pass is only ever what the checks say. Hints come one at a time;
       the solution is there when she asks for it, and using it is her call.
     · Her code is saved as she types, per lesson, and "Open in playground"
       carries it into the free scratchpad to keep playing.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from '@/components/Editor'
import {
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconChevronLeft,
  IconPlay,
  IconRefresh,
  IconTerminal,
  IconX,
} from '@/components/icons'
import { Bar, Button, Card, CardHead, Chip } from '@/components/ui'
import { markLearned, saveCode } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import { buildProgram, gradeRun } from '@/learn/grade'
import { TRACKS, findLesson, nextLesson, passedCount } from '@/learn/index'
import { editorLang, runLearn, warmUp } from '@/learn/platform'
import type { Cell, LearnGrade, LearnLesson, LearnTrack } from '@/learn/types'
import { Markdown } from '@/lib/markdown'
import { navigate } from '@/lib/router'
import './learn.css'
import './pages.css'

export function Learn({ lessonId }: { lessonId?: string }) {
  if (!lessonId) return <LearnHome />
  const found = findLesson(lessonId)
  if (!found) return <LearnHome missing={lessonId} />
  return <LessonView key={found.lesson.id} track={found.track} lesson={found.lesson} index={found.index} />
}

/* ── The course: one card per language ───────────────────────────────────── */

function LearnHome({ missing }: { missing?: string }) {
  const { state } = useLearner()
  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            <IconBulb size={13} />
            Learn mode
          </div>
          <h1 className="h-page">Learn to code</h1>
          <p className="page-head__sub">
            The basics of every language the playground runs, one lesson at a time: a short explanation, one
            task, and your own code in the editor. Run &amp; check really runs it and tells you what passed. Start
            from zero in any language — your progress is saved on this device.
          </p>
        </div>
        <Button variant="ghost" size="md" onClick={() => navigate('/playground')}>
          <IconTerminal size={13} />
          Playground
        </Button>
      </div>

      {missing ? (
        <p className="lm-missing">There is no lesson called “{missing}”. Pick one below.</p>
      ) : null}

      <div className="lm-tracks">
        {TRACKS.map((track, i) => (
          <TrackCard key={track.lang} track={track} passed={state.learn} index={i} />
        ))}
      </div>

      <p className="track-note">
        Learn mode is practice, and it counts for nothing else: passing a lesson does not change your modules, your
        readiness or your review queue. More lessons, past the basics, will follow.
      </p>
    </div>
  )
}

function TrackCard({ track, passed, index }: { track: LearnTrack; passed: Record<string, string>; index: number }) {
  const done = passedCount(track, passed)
  const total = track.lessons.length
  const next = nextLesson(track, passed)
  const label = done === 0 ? 'Start' : done === total ? 'Review' : 'Continue'
  return (
    <Card index={index} className="lm-track" data-lang={track.lang}>
      <CardHead
        icon={<IconTerminal size={15} />}
        title={track.title}
        right={<Chip tone={done === total ? 'ok' : done ? 'blue' : 'default'}>{`${done}/${total}`}</Chip>}
        divided
      />
      <div className="sect">
        <p className="lm-track__blurb">{track.blurb}</p>
        <Bar value={done / total} height={5} />
        <div className="lm-track__go">
          <Button variant="primary" size="sm" onClick={() => navigate(`/learn/${next.id}`)}>
            {label}
            <IconArrowRight size={13} />
          </Button>
          {done > 0 && done < total ? <span className="lm-track__next">Next up: {next.title}</span> : null}
        </div>
        <ol className="lm-list">
          {track.lessons.map((l, i) => (
            <li key={l.id} data-done={!!passed[l.id]} data-next={l.id === next.id && done < total}>
              <a href={`#/learn/${l.id}`}>
                <span className="lm-list__mark" aria-hidden="true">
                  {passed[l.id] ? <IconCheck size={11} /> : i + 1}
                </span>
                <span className="lm-list__title">{l.title}</span>
                {passed[l.id] ? <span className="sr-only">(passed)</span> : null}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}

/* ── One lesson ──────────────────────────────────────────────────────────── */

function LessonView({ track, lesson, index }: { track: LearnTrack; lesson: LearnLesson; index: number }) {
  const { state, setState } = useLearner()
  const key = `learn:${lesson.id}`
  const [code, setCode] = useState(() => state.code[key] ?? lesson.starter)
  const [grade, setGrade] = useState<LearnGrade | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [hints, setHints] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)

  const passedBefore = !!state.learn[lesson.id]
  const prev = track.lessons[index - 1]
  const next = track.lessons[index + 1]
  const done = passedCount(track, state.learn)

  useEffect(() => warmUp(lesson.lang), [lesson.lang])

  // Save what she types, a moment after she stops.
  const onCodeChange = useCallback(
    (value: string) => {
      setCode(value)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setState((s) => saveCode(s, key, value)), 600)
    },
    [key, setState],
  )
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    },
    [],
  )

  const run = useCallback(async () => {
    if (running) return
    setRunning(true)
    setGrade(null)
    try {
      setState((s) => saveCode(s, key, code))
      const result = await runLearn(lesson, buildProgram(lesson, code), setStatus)
      const g = gradeRun(lesson, code, result)
      setGrade(g)
      if (g.passed) setState((s) => markLearned(s, lesson.id))
      // On a phone the results are below the editor, out of sight.
      requestAnimationFrame(() => {
        const el = resultsRef.current
        if (el && el.getBoundingClientRect().top > window.innerHeight) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
      })
    } finally {
      setRunning(false)
      setStatus('')
    }
  }, [code, key, lesson, running, setState])

  const reset = () => {
    setCode(lesson.starter)
    setState((s) => saveCode(s, key, lesson.starter))
    setGrade(null)
  }

  const openInPlayground = () => {
    setState((s) => saveCode(s, `scratch:${lesson.lang}`, code))
    navigate(`/playground?lang=${lesson.lang}`)
  }

  const passCount = grade ? grade.results.filter((r) => r.status === 'pass').length : 0

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            <IconBulb size={13} />
            {track.title} · Lesson {index + 1} of {track.lessons.length}
            {passedBefore ? <Chip tone="ok">passed</Chip> : null}
          </div>
          <h1 className="h-page">{lesson.title}</h1>
        </div>
        <Button variant="ghost" size="md" onClick={() => navigate('/learn')}>
          <IconChevronLeft size={13} />
          All lessons
        </Button>
      </div>

      <div className="lm-progress" aria-label={`${done} of ${track.lessons.length} ${track.title} lessons passed`}>
        {track.lessons.map((l, i) => (
          <a
            key={l.id}
            href={`#/learn/${l.id}`}
            className="lm-progress__step"
            data-done={!!state.learn[l.id]}
            data-here={i === index}
            title={`${i + 1}. ${l.title}`}
            aria-label={`Lesson ${i + 1}: ${l.title}${state.learn[l.id] ? ' (passed)' : ''}`}
          />
        ))}
      </div>

      <div className="lm">
        {/* ── what to understand, and what to do ─────────────────────────── */}
        <div className="stack">
          <Card index={0}>
            <CardHead icon={<IconBulb size={15} />} title="Lesson" divided />
            <div className="sect">
              <Markdown>{lesson.teach}</Markdown>
            </div>
          </Card>

          <Card index={1} className="lm-task">
            <CardHead icon={<IconTerminal size={15} />} title="Your task" divided />
            <div className="sect">
              <Markdown>{lesson.task}</Markdown>
              {lesson.stdin ? (
                <div className="lm-stdin">
                  <div className="lm-stdin__label">Input the program reads</div>
                  <pre>{lesson.stdin}</pre>
                </div>
              ) : null}
              <div className="lm-help">
                {lesson.hints.slice(0, hints).map((h, i) => (
                  <div className="lm-hint" key={i}>
                    <span className="lm-hint__n">Hint {i + 1}</span>
                    <Markdown>{h}</Markdown>
                  </div>
                ))}
                <div className="lm-help__row">
                  {hints < lesson.hints.length ? (
                    <Button variant="quiet" size="sm" onClick={() => setHints((n) => n + 1)}>
                      {hints === 0 ? 'Show a hint' : 'Another hint'}
                    </Button>
                  ) : null}
                  <Button variant="quiet" size="sm" onClick={() => setShowSolution((s) => !s)}>
                    {showSolution ? 'Hide the solution' : 'Show the solution'}
                  </Button>
                </div>
                {showSolution ? (
                  <div className="lm-solution">
                    <p>One way to do it. Try typing it yourself rather than copying — that is where it sticks.</p>
                    <Markdown>{'```' + fence(lesson.lang) + '\n' + lesson.solution + '```'}</Markdown>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        {/* ── the editor and the verdict ─────────────────────────────────── */}
        <div className="stack">
          <Card index={2}>
            <div className="pg__toolbar">
              <Button variant="primary" size="sm" onClick={() => void run()} disabled={running}>
                <IconPlay size={13} />
                Run &amp; check
              </Button>
              <Button variant="quiet" size="sm" onClick={reset}>
                <IconRefresh size={13} />
                Start over
              </Button>
              <Button variant="quiet" size="sm" onClick={openInPlayground}>
                <IconTerminal size={13} />
                Open in playground
              </Button>
              <div className="pg__status">
                {running ? <span className="pg__spinner" /> : null}
                {status || (grade ? `${grade.ms} ms` : 'Ctrl+Enter to run')}
              </div>
            </div>
            <Editor
              value={code}
              onChange={onCodeChange}
              lang={editorLang(lesson.lang)}
              minHeight={320}
              onRun={() => void run()}
              placeholder="Write your code here…"
            />
          </Card>

          <div ref={resultsRef} className="stack">
            {grade?.passed ? (
              <Card index={3} className="lm-passed">
                <div className="sect lm-passed__body">
                  <div className="lm-passed__icon">
                    <IconCheck size={18} />
                  </div>
                  <div className="grow">
                    <div className="lm-passed__title">Lesson passed</div>
                    <div className="lm-passed__sub">
                      {next ? `Next: ${next.title}` : `That is the whole ${track.title} track — every basic, done.`}
                    </div>
                  </div>
                  {next ? (
                    <Button variant="primary" size="md" onClick={() => navigate(`/learn/${next.id}`)}>
                      Next lesson
                      <IconArrowRight size={13} />
                    </Button>
                  ) : (
                    <Button variant="primary" size="md" onClick={() => navigate('/learn')}>
                      All tracks
                      <IconArrowRight size={13} />
                    </Button>
                  )}
                </div>
              </Card>
            ) : null}

            {grade ? (
              <Card index={4}>
                <CardHead
                  icon={grade.passed ? <IconCheck size={15} /> : <IconX size={15} />}
                  title="Checks"
                  right={<Chip tone={grade.passed ? 'ok' : 'bad'}>{`${passCount}/${grade.results.length}`}</Chip>}
                  divided
                />
                <div className="sect">
                  <div className="tests">
                    {grade.results.map((r, i) => (
                      <div className="test" data-status={r.status} key={i}>
                        <span className="test__icon">{r.status === 'pass' ? <IconCheck size={13} /> : <IconX size={13} />}</span>
                        <div className="grow">
                          <div className="test__name">{r.name}</div>
                          {r.status === 'fail' && r.detail ? <pre className="lm-detail">{r.detail}</pre> : null}
                          {r.status === 'fail' && r.hint ? <div className="test__msg">{r.hint}</div> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : null}

            <Card index={5}>
              <CardHead icon={<IconTerminal size={15} />} title="Output" divided />
              <div className="sect">
                {grade && lesson.lang === 'sql' && !grade.error ? (
                  <SqlTables tables={grade.tables} />
                ) : (
                  <div className="console">
                    {grade?.output ? <span>{grade.output}</span> : null}
                    {grade?.stderr ? <span className="console__err">{grade.stderr}</span> : null}
                    {grade?.error ? <span className="console__err">{grade.error}</span> : null}
                    {grade && !grade.output && !grade.stderr && !grade.error ? (
                      <span className="console__meta">Ran, and printed nothing.</span>
                    ) : null}
                    {!grade ? <span className="console__meta">Press Run &amp; check to run your code.</span> : null}
                  </div>
                )}
              </div>
            </Card>
          </div>

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
        </div>
      </div>
    </div>
  )
}

function SqlTables({ tables }: { tables: { columns: string[]; rows: Cell[][] }[] }) {
  if (!tables.length) {
    return (
      <div className="console">
        <span className="console__meta">
          Ran, and returned no rows. INSERT, UPDATE, DELETE and CREATE return none — the checks look at the table
          afterwards.
        </span>
      </div>
    )
  }
  const t = tables[tables.length - 1]!
  return (
    <div className="grid">
      <div className="grid__caption">
        {tables.length > 1 ? `Your last result (of ${tables.length}) · ` : ''}
        {t.rows.length} row{t.rows.length === 1 ? '' : 's'}
      </div>
      <table>
        <thead>
          <tr>
            {t.columns.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.slice(0, 100).map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className={cell === null ? 'null' : undefined}>
                  {cell === null ? 'NULL' : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function fence(lang: LearnLesson['lang']): string {
  return lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang
}

/** The first unpassed lesson for a language, for links from elsewhere. */
export function useNextLesson(lang: string): { lesson: LearnLesson; done: number; total: number } | null {
  const { state } = useLearner()
  return useMemo(() => {
    const track = TRACKS.find((t) => t.lang === lang)
    if (!track) return null
    return { lesson: nextLesson(track, state.learn), done: passedCount(track, state.learn), total: track.lessons.length }
  }, [lang, state.learn])
}
