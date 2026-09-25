/* ============================================================================
   Learn to code
   ----------------------------------------------------------------------------
   Three views, laid out the way a coding school lays them out:

     #/learn              roadmaps: pick a goal, see its courses in order as a
                          numbered path of course tiles, start with step one
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
import { Editor } from '@/components/Editor'
import {
  ConsoleView,
  IdeBody,
  IdePanel,
  IdeWindow,
  LangMark,
  RunButton,
  SqlTables,
  TerminalView,
  TestCases,
  WebPreview,
  type PanelTab,
} from '@/components/ide'
import { IconArrowRight, IconCheck, IconChevronLeft, IconFlame, IconRefresh, IconStar, IconTerminal } from '@/components/icons'
import { Bar, Button } from '@/components/ui'
import { markLearned, saveCode } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import { buildProgram, gradeRun, lessonShell } from '@/learn/grade'
import { ROADMAPS, TRACKS, findLesson, nextLesson, passedCount, streak, trackFor } from '@/learn/index'
import { editorLang, runLearn, warmUp } from '@/learn/platform'
import type { LearnGrade, LearnLesson, LearnTrack, Roadmap } from '@/learn/types'
import type { ShellState } from '@/lib/shell'
import type { WebLog } from '@/lib/web'
import { Markdown } from '@/lib/markdown'
import { navigate, useRoute } from '@/lib/router'
import './learn.css'
import './pages.css'

export function Learn({ lessonId }: { lessonId?: string }) {
  if (!lessonId) return <LearnHome />
  const track = trackFor(lessonId)
  if (track) return <CourseView track={track} />
  const found = findLesson(lessonId)
  if (!found) return <LearnHome missing={lessonId} />
  return <LessonView key={found.lesson.id} track={found.track} lesson={found.lesson} index={found.index} />
}

const FILE: Record<string, string> = {
  javascript: 'main.js',
  typescript: 'main.ts',
  python: 'main.py',
  cpp: 'main.cpp',
  sql: 'query.sql',
  html: 'index.html',
  bash: '~/project',
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

function LearnHome({ missing }: { missing?: string }) {
  const { state } = useLearner()
  const route = useRoute()
  const goal = ROADMAPS.find((r) => r.id === route.query.goal) ?? ROADMAPS[0]!

  return (
    <div className="page page--padtop ide-wrap lm-home">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            Learn to code <Streak />
          </div>
          <h1 className="h-page">Roadmaps</h1>
          <p className="page-head__sub">
            Courses in the order a mentor would teach them. Pick a goal and start with step one — every lesson has you
            write real code in the playground, and checks it.
          </p>
        </div>
        <Button variant="ghost" size="md" onClick={() => navigate('/playground')}>
          <IconTerminal size={13} />
          Playground
        </Button>
      </div>

      {missing ? <p className="lm-missing">There is no lesson called “{missing}”. Pick a course below.</p> : null}

      <div className="ide-modes" role="tablist" aria-label="Goal">
        {ROADMAPS.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={r.id === goal.id}
            data-active={r.id === goal.id}
            className="ide-modes__pill"
            onClick={() => navigate(`/learn?goal=${r.id}`, { replace: true })}
          >
            {r.title}
          </button>
        ))}
      </div>

      <RoadmapWindow roadmap={goal} passed={state.learn} />

      <h2 className="lm-h2">Every course</h2>
      <div className="lm-courses">
        {TRACKS.map((t) => {
          const done = passedCount(t, state.learn)
          return (
            <a key={t.lang} className="lm-course" href={`#/learn/${t.lang}`}>
              <LangMark lang={t.lang} size={40} />
              <span className="lm-course__text">
                <span className="lm-course__title">{t.title}</span>
                <span className="lm-course__meta">
                  {done === t.lessons.length ? 'Complete' : `${done} of ${t.lessons.length} lessons`}
                </span>
                <Bar value={done / t.lessons.length} height={4} />
              </span>
            </a>
          )
        })}
      </div>

      <p className="track-note">
        Learn to code is practice, and it counts for nothing else: passing a lesson does not change your modules, your
        readiness or your review queue. More lessons, past the basics, will follow.
      </p>
    </div>
  )
}

/** How many tiles fit on a row of the path, from the width it has. */
function useColumns(ref: React.RefObject<HTMLElement | null>): number {
  const [cols, setCols] = useState(4)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      setCols(w >= 760 ? 4 : w >= 520 ? 3 : 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return cols
}

function RoadmapWindow({ roadmap, passed }: { roadmap: Roadmap; passed: Record<string, string> }) {
  const tracks = roadmap.steps.map((l) => trackFor(l)).filter((t): t is LearnTrack => !!t)
  const current = tracks.findIndex((t) => passedCount(t, passed) < t.lessons.length)
  const allDone = current < 0
  const path = useRef<HTMLDivElement | null>(null)
  const cols = useColumns(path)

  // The path snakes: left to right, then right to left, then back.
  const count = tracks.length + 1
  const place = (k: number) => {
    const row = Math.floor(k / cols)
    const c = k % cols
    return { row, col: row % 2 ? cols - 1 - c : c }
  }
  const linkOf = (k: number): 'right' | 'left' | 'down' | undefined => {
    if (k >= count - 1) return undefined
    const a = place(k)
    const b = place(k + 1)
    return b.row !== a.row ? 'down' : b.col > a.col ? 'right' : 'left'
  }

  const go = () => {
    const t = tracks[allDone ? 0 : current]!
    navigate(`/learn/${nextLesson(t, passed).id}`)
  }

  return (
    <section className="ide rm">
      <header className="ide__head">
        <div className="ide__file rm__goal">{roadmap.title}</div>
        <div className="ide__right">
          <button type="button" className="ide-run rm__go" onClick={go}>
            {allDone ? 'Review' : current === 0 && passedCount(tracks[0]!, passed) === 0 ? 'Start step 1' : `Continue step ${current + 1}`}
            <IconArrowRight size={13} />
          </button>
        </div>
      </header>
      <p className="rm__blurb">{roadmap.blurb}</p>
      <div className="rm__path" ref={path} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {tracks.map((t, k) => {
          const done = passedCount(t, passed)
          const total = t.lessons.length
          const { row, col } = place(k)
          return (
            <a
              key={t.lang}
              href={`#/learn/${t.lang}`}
              className="rm-tile"
              data-link={linkOf(k)}
              data-state={done === total ? 'done' : k === current ? 'current' : 'todo'}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
              aria-label={`Step ${k + 1}: ${t.title}, ${done} of ${total} lessons passed`}
            >
              <span className="rm-tile__n">{done === total ? <IconCheck size={12} /> : k + 1}</span>
              <LangMark lang={t.lang} size={52} />
              <span className="rm-tile__title">{t.title}</span>
              <span className="rm-tile__meta">{done === total ? 'Complete' : done ? `${done}/${total} lessons` : `${total} lessons`}</span>
              <span className="rm-tile__bar" style={{ ['--p' as string]: `${(done / total) * 100}%` }} />
            </a>
          )
        })}
        {(() => {
          const { row, col } = place(tracks.length)
          return (
            <div className="rm-tile rm-tile--end" data-state={allDone ? 'done' : 'todo'} style={{ gridRow: row + 1, gridColumn: col + 1 }}>
              <span className="rm-tile__trophy">
                <IconStar size={26} />
              </span>
              <span className="rm-tile__title">{allDone ? 'Goal reached' : 'Finish line'}</span>
              <span className="rm-tile__meta">{allDone ? `${roadmap.title} basics, done` : 'Pass every course above'}</span>
            </div>
          )
        })()}
      </div>
    </section>
  )
}

/* ── One course ──────────────────────────────────────────────────────────── */

function CourseView({ track }: { track: LearnTrack }) {
  const { state } = useLearner()
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
        <LangMark lang={track.lang} size={64} />
        <div style={{ minWidth: 0 }} className="grow">
          <div className="page-head__kicker">
            Course · {total} lessons <Streak />
          </div>
          <h1 className="h-page">{track.title}</h1>
          <p className="page-head__sub">{track.blurb}</p>
        </div>
      </div>
      <div className="lm-course-go">
        <Bar value={done / total} height={6} />
        <span className="lm-course-go__n">
          {done}/{total}
        </span>
        <button type="button" className="ide-run" onClick={() => navigate(`/learn/${next.id}`)}>
          {done === 0 ? 'Start course' : done === total ? 'Review' : 'Continue'}
          <IconArrowRight size={13} />
        </button>
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
                <span className="lm-outline__title">{l.title}</span>
                {ok ? <span className="lm-outline__tag">Passed</span> : here ? <span className="lm-outline__tag lm-outline__tag--next">Next</span> : null}
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
  const key = `learn:${lesson.id}`
  const terminal = lesson.lang === 'bash'
  const web = lesson.lang === 'html'
  const [code, setCode] = useState(() => (terminal ? '' : (state.code[key] ?? lesson.starter)))
  const [shell, setShell] = useState<ShellState>(() => lessonShell(lesson))
  const [termKey, setTermKey] = useState(0)
  const [grade, setGrade] = useState<LearnGrade | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [hints, setHints] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [tab, setTab] = useState(web ? 'preview' : 'tests')
  const [page, setPage] = useState(() => (web ? (state.code[key] ?? lesson.starter) : ''))
  const [logs, setLogs] = useState<WebLog[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ideRef = useRef<HTMLDivElement | null>(null)

  const passedBefore = !!state.learn[lesson.id]
  const prev = track.lessons[index - 1]
  const next = track.lessons[index + 1]

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
      if (!terminal) setState((s) => saveCode(s, key, code))
      if (web) {
        setLogs([])
        setPage(code + (page === code ? ' ' : ''))
      }
      const result = await runLearn(lesson, buildProgram(lesson, code), { onStatus: setStatus, shell })
      const g = gradeRun(lesson, code, result)
      setGrade(g)
      setTab('tests')
      if (g.passed) setState((s) => markLearned(s, lesson.id))
      // On a phone the panel is below the lesson text, out of sight.
      requestAnimationFrame(() => {
        const el = ideRef.current
        if (el && el.getBoundingClientRect().bottom > window.innerHeight) el.scrollIntoView({ block: 'end', behavior: 'smooth' })
      })
    } finally {
      setRunning(false)
      setStatus('')
    }
  }, [code, key, lesson, page, running, setState, shell, terminal, web])

  const reset = () => {
    setGrade(null)
    if (terminal) {
      setShell(lessonShell(lesson))
      setTermKey((k) => k + 1)
      return
    }
    setCode(lesson.starter)
    setState((s) => saveCode(s, key, lesson.starter))
    if (web) setPage(lesson.starter)
  }

  const openInPlayground = () => {
    if (!terminal) setState((s) => saveCode(s, `scratch:${lesson.lang}`, code))
    navigate(`/playground?lang=${lesson.lang}`)
  }

  const mark: PanelTab['mark'] = grade ? (grade.passed ? 'pass' : 'fail') : undefined
  const errored = !!(grade?.error || grade?.stderr)
  const tabs: PanelTab[] = [
    { id: 'tests', label: 'Test cases', mark },
    ...(web ? [{ id: 'preview', label: 'Preview' }] : []),
    ...(lesson.lang === 'sql' ? [{ id: 'results', label: 'Results' }] : []),
    ...(!terminal ? [{ id: 'console', label: 'Console', ...(errored ? { mark: 'fail' as const } : {}) }] : []),
  ]
  const active = tabs.some((t) => t.id === tab) ? tab : 'tests'
  const runButton = <RunButton onClick={() => void run()} running={running} status={status} label={terminal ? 'Check' : 'Run Code'} />

  return (
    <div className="page page--padtop ide-wrap">
      <div className="lm-top">
        <a className="lm-back" href={`#/learn/${track.lang}`}>
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
        <Streak />
      </div>

      <div className="lm">
        {/* ── what to understand, and what to do ─────────────────────────── */}
        <article className="lm-text">
          <div className="lm-text__kicker">
            <LangMark lang={track.lang} size={18} />
            Lesson {index + 1} of {track.lessons.length}
            {passedBefore ? <span className="lm-passed-tag">Passed</span> : null}
          </div>
          <h1 className="lm-text__title">{lesson.title}</h1>
          <div className="lm-teach">
            <Markdown>{lesson.teach}</Markdown>
          </div>

          <section className="lm-challenge">
            <div className="lm-challenge__label">Challenge</div>
            <Markdown>{lesson.task}</Markdown>
            {lesson.stdin ? (
              <div className="lm-stdin">
                <div className="lm-stdin__label">Input the program reads</div>
                <pre>{lesson.stdin}</pre>
              </div>
            ) : null}
            {terminal ? <p className="lm-challenge__how">Type the commands into the terminal, then press Check.</p> : null}
          </section>

          <div className="lm-help">
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
              <button type="button" className="lm-link" onClick={() => setShowSolution((s) => !s)}>
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
        </article>

        {/* ── the IDE ─────────────────────────────────────────────────────── */}
        <div className="lm-ide" ref={ideRef}>
          <IdeWindow
            lang={lesson.lang}
            file={FILE[lesson.lang] ?? 'main'}
            right={
              <>
                <button type="button" className="ide__tool" onClick={reset} title="Start this lesson over">
                  <IconRefresh size={13} />
                  Reset
                </button>
                <button type="button" className="ide__tool" onClick={openInPlayground}>
                  Playground
                </button>
              </>
            }
          >
            {terminal ? (
              <>
                <TerminalView
                  key={termKey}
                  shell={shell}
                  onShell={setShell}
                  height={340}
                  banner="Practice terminal for this lesson. Type help to see the commands."
                />
                <div className="lm-termbar">{runButton}</div>
              </>
            ) : (
              <IdeBody run={runButton}>
                <Editor ide value={code} onChange={onCodeChange} lang={editorLang(lesson.lang)} minHeight={320} onRun={() => void run()} placeholder="Write your code here…" />
              </IdeBody>
            )}
            <IdePanel tabs={tabs} active={active} onTab={setTab} height={web && active === 'preview' ? 1000 : 300}>
              {web ? (
                <div hidden={active !== 'preview'} className="lm-preview">
                  <WebPreview html={page} onLog={(l) => setLogs((ls) => [...ls, l])} height={300} />
                </div>
              ) : null}
              {active === 'tests' ? (
                <>
                  {grade?.passed ? (
                    <div className="lm-win">
                      <IconCheck size={16} />
                      <span className="grow">{next ? 'Lesson passed! On to the next one.' : `Lesson passed — that is the whole ${track.title} course.`}</span>
                      <button type="button" className="ide-run" onClick={() => navigate(next ? `/learn/${next.id}` : `/learn/${track.lang}`)}>
                        {next ? 'Next lesson' : 'Course'}
                        <IconArrowRight size={13} />
                      </button>
                    </div>
                  ) : null}
                  <TestCases results={grade?.results ?? null} empty={terminal ? 'Do the challenge in the terminal, then press Check.' : 'Press Run Code to run your code against the tests.'} />
                </>
              ) : active === 'results' ? (
                grade && !grade.error ? (
                  <SqlTables tables={grade.tables} lastOnly />
                ) : (
                  <p className="ide-empty">{grade?.error ? 'The query failed — see the Console tab.' : 'Run your query to see the rows it returns.'}</p>
                )
              ) : active === 'console' ? (
                web ? (
                  <ConsoleView empty="console.log from your page shows here.">
                    {logs.map((l, i) => (
                      <span key={i} className={l.level === 'error' ? 'ide-console__err' : undefined}>{`${l.text}\n`}</span>
                    ))}
                  </ConsoleView>
                ) : (
                  <ConsoleView
                    stdout={grade?.output}
                    stderr={grade?.stderr}
                    error={grade?.error}
                    note={grade && !grade.output && !grade.stderr && !grade.error ? (lesson.lang === 'sql' ? 'Ran. See the Results tab.' : 'Ran, and printed nothing.') : undefined}
                    empty="Press Run Code to see what your code prints."
                  />
                )
              ) : null}
            </IdePanel>
          </IdeWindow>

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
