/* ============================================================================
   ORBIT — code playground
   ----------------------------------------------------------------------------
   Three modes along the top, the way a coding site lays them out:

     Code      Python, C++, Rust, MATLAB and shell scripts, picked from the
               file pill
     SQL       SQLite, on a seeded telemetry table, results as a table
     Terminal  the practice shell: files, folders and git, in the page

   Opens standalone, or on a specific exercise via `#/playground?ex=<id>`, in
   which case it loads the starter code, the tests and the reference solution
   and shows them as test cases. `?lang=<lang>` opens a language directly.

   The note under the window always states which of the three run modes
   applies. A learner who thinks their C++ compiled when it was actually
   string-compared has been misled by the product, and a green tick that means
   nothing is worse than no tick at all.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from '@/components/Editor'
import { IconArrowRight, IconBulb, IconPause, IconRefresh } from '@/components/icons'
import {
  ConsoleView,
  IdeBody,
  IdePanel,
  IdeWindow,
  ModeTabs,
  RunButton,
  SqlTables,
  TerminalView,
  TestCases,
  type Mode,
  type PanelTab,
} from '@/components/ide'
import { Button } from '@/components/ui'
import { MODULES } from '@/curriculum'
import type { Exercise, Lang, Module } from '@/curriculum/types'
import { saveCode } from '@/engine/apply'
import type { CheckResult } from '@/learn/types'
import {
  LANGS,
  buildTestProgram,
  capabilityOf,
  detectToolchains,
  parseTestOutput,
  python,
  runAgainstSolution,
  runNative,
  runSql,
  type RunOutput,
  type SqlResult,
} from '@/lib/runtimes'
import type { ToolchainInfo } from '@/lib/desktop'
import { newShell, type ShellState } from '@/lib/shell'
import { Markdown } from '@/lib/markdown'
import { useLearner } from '@/hooks/useLearner'
import { navigate, useRoute } from '@/lib/router'
import { SCRATCH, SQL_SCHEMA } from '@/lib/scratch'
import { useNextLesson } from '@/pages/Learn'
import './pages.css'

/** The languages Code mode's file pill offers. */
const CODE_LANGS: Lang[] = ['python', 'cpp', 'rust', 'matlab', 'bash']

const FILES: Partial<Record<Lang, string>> = {
  python: 'main.py',
  cpp: 'main.cpp',
  rust: 'main.rs',
  matlab: 'main.m',
  bash: 'script.sh',
  sql: 'query.sql',
  simulink: 'model.slx',
  text: 'notes.md',
}

/** ORBIT's playground has no web mode: nothing in its curriculum is a web page. */
const MODES: Mode[] = ['code', 'sql', 'terminal']

export function Playground() {
  const route = useRoute()
  const { state, setState } = useLearner()

  const exerciseRef = useMemo(() => findExercise(route.query.ex), [route.query.ex])
  const exercise = exerciseRef?.exercise
  const asked = route.query.lang
  // `?lang=bash` is the practice terminal, the way Learn to code links to it;
  // shell scripts are one pick away in Code mode.
  const [mode, setMode] = useState<Mode>(exercise ? (exercise.lang === 'sql' ? 'sql' : 'code') : asked === 'sql' ? 'sql' : asked === 'bash' ? 'terminal' : 'code')
  const [codeLang, setCodeLang] = useState<Lang>(
    exercise?.lang && exercise.lang !== 'sql' ? exercise.lang : CODE_LANGS.includes(asked as Lang) && asked !== 'bash' ? (asked as Lang) : 'python',
  )
  const lang: Lang = mode === 'sql' ? 'sql' : mode === 'terminal' ? 'bash' : codeLang
  const info = LANGS[lang]
  const learn = useNextLesson(lang)

  const bufferKey = exercise ? `ex:${exercise.id}` : `scratch:${lang}`
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [out, setOut] = useState<RunOutput | null>(null)
  const [sqlOut, setSqlOut] = useState<SqlResult | null>(null)
  const [tests, setTests] = useState<CheckResult[] | null>(null)
  const [stdin, setStdin] = useState<Record<string, string>>({})
  const [tab, setTab] = useState('console')
  const [toolchains, setToolchains] = useState<Record<string, ToolchainInfo> | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [shell, setShell] = useState<ShellState>(() => newShell())
  const [termKey, setTermKey] = useState(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // What this language can do at this moment, on this machine.
  const capability = useMemo(() => capabilityOf(lang, toolchains), [lang, toolchains])
  const executes = capability.mode === 'execute'
  const graded = !!exercise && ((exercise.tests?.length ?? 0) > 0 || (executes && lang !== 'python' && lang !== 'sql' && !!exercise.solution))
  const takesInput = lang === 'cpp' || lang === 'python'

  /* ── load the buffer for whatever is selected ──────────────────────────── */
  useEffect(() => {
    if (mode === 'terminal') return
    const saved = state.code[bufferKey]
    setCode(saved ?? exercise?.starter ?? SCRATCH[lang] ?? '')
    setOut(null)
    setSqlOut(null)
    setTests(null)
    setTab(graded ? 'tests' : mode === 'sql' ? 'results' : 'console')
    // Deliberately not re-running on every keystroke-driven state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bufferKey, mode])

  /* Python's runtime is ~7MB over the wire; start it downloading as soon as
     the language is picked rather than at the moment someone hits Run. */
  useEffect(() => {
    if (lang === 'python' && !python.isBooted) python.preload(setStatus)
  }, [lang])

  /* What the machine can compile. Asked once on open; `Check again` re-probes
     after she installs something without needing a restart. */
  useEffect(() => {
    let alive = true
    void detectToolchains().then((t) => {
      if (alive) setToolchains(t)
    })
    return () => {
      alive = false
    }
  }, [])

  const refreshToolchains = useCallback(async () => {
    setToolchains(await detectToolchains(true))
  }, [])

  const onCodeChange = useCallback(
    (next: string) => {
      setCode(next)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setState((s) => saveCode(s, bufferKey, next)), 700)
    },
    [bufferKey, setState],
  )

  const run = useCallback(async () => {
    if (running) return
    setRunning(true)
    setOut(null)
    setSqlOut(null)
    setTests(null)
    const input = stdin[lang] ?? ''
    try {
      if (lang === 'python') {
        const pyTests = exercise?.tests ?? []
        const program = pyTests.length ? buildTestProgram(code, pyTests) : code
        const lines = input ? input.replace(/\n$/, '').split('\n') : undefined
        const result = await python.run(program, { onStatus: setStatus, ...(lines ? { stdin: lines } : {}) })
        if (pyTests.length) {
          const parsed = parseTestOutput(result.stdout, pyTests)
          setOut({ ...result, stdout: parsed.userOutput })
          setTests(parsed.outcomes.map((o) => ({ name: o.name, status: o.status === 'pass' ? 'pass' : 'fail', ...(o.message ? { detail: o.message } : {}) })))
        } else setOut(result)
      } else if (lang === 'sql') {
        // An exercise whose buffer builds its own tables gets an empty database.
        const schema = exercise?.starter?.includes('CREATE TABLE') ? undefined : SQL_SCHEMA
        setSqlOut(await runSql(code, schema))
      } else if (executes) {
        // Everything else compiles and runs on this machine's toolchain (C++
        // also in the browser). With a reference solution, running it is a
        // real grade: both programs execute and their output is compared.
        if (exercise?.solution) {
          const g = await runAgainstSolution(lang, code, exercise.solution, lang === 'cpp' ? input : undefined)
          setOut(g.yours)
          setTests([
            {
              name: 'Matches the reference solution',
              status: g.pass ? 'pass' : 'fail',
              input: input.trim() || '(no input)',
              ...(g.reference ? { expected: g.reference.stdout.trimEnd() } : {}),
              actual: g.yours.error ? g.yours.error : g.yours.stdout.trimEnd(),
              ...(g.pass ? {} : { detail: g.detail }),
            },
          ])
        } else setOut(await runNative(lang, code, lang === 'cpp' ? input : undefined, setStatus))
      } else {
        // Nothing to run it on: say so, rather than showing an empty console
        // that looks like a program which printed nothing.
        setOut({ stdout: '', stderr: '', plots: [], result: null, error: null, ms: 0 })
      }
      setTab(graded ? 'tests' : lang === 'sql' ? 'results' : 'console')
    } finally {
      setRunning(false)
      setStatus('')
    }
  }, [code, executes, exercise, graded, lang, running, stdin])

  const reset = () => {
    if (mode === 'terminal') {
      setShell(newShell())
      setTermKey((k) => k + 1)
      return
    }
    const starter = exercise?.starter ?? SCRATCH[lang] ?? ''
    setCode(starter)
    setState((s) => saveCode(s, bufferKey, starter))
    setOut(null)
    setSqlOut(null)
    setTests(null)
  }

  const chooseMode = (m: Mode) => {
    if (exercise) navigate('/playground')
    setMode(m)
  }

  const testMark: PanelTab['mark'] = tests ? (tests.every((t) => t.status === 'pass') ? 'pass' : 'fail') : undefined
  const failed = !!(out?.error || sqlOut?.error)
  const tabs: PanelTab[] =
    mode === 'sql'
      ? [
          ...(graded ? [{ id: 'tests', label: 'Test cases', mark: testMark }] : []),
          { id: 'results', label: 'Results' },
          { id: 'console', label: 'Console', ...(failed ? { mark: 'fail' as const } : {}) },
          ...(!exercise ? [{ id: 'schema', label: 'Tables' }] : []),
        ]
      : [
          ...(graded ? [{ id: 'tests', label: 'Test cases', mark: testMark }] : []),
          { id: 'console', label: 'Console', ...(failed ? { mark: 'fail' as const } : {}) },
          ...(takesInput ? [{ id: 'input', label: 'Input' }] : []),
        ]

  const runButton = (
    <RunButton onClick={() => void run()} running={running} status={status} label={!executes ? 'Check' : graded ? 'Run tests' : 'Run Code'} />
  )
  const choices = CODE_LANGS.map((l) => ({ value: l, label: `${FILES[l]} · ${LANGS[l].label}` }))

  return (
    <div className="page page--padtop ide-wrap pgx">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">{exercise ? exerciseRef!.module.title : 'Playground'}</div>
          <h1 className="h-page">{exercise ? exercise.title : 'Code playground'}</h1>
          <p className="page-head__sub">
            {exercise
              ? 'Your work is saved to this device as you type.'
              : 'Write code and run it right here. Python, SQL and C++ execute in your browser with nothing sent anywhere; Rust, MATLAB and shell scripts run on the Mac’s own tools in the desktop app.'}
          </p>
        </div>
        {exercise ? (
          <Button variant="ghost" size="md" onClick={() => navigate(`/module/${exerciseRef!.module.id}`)}>
            Back to module
          </Button>
        ) : null}
      </div>

      <ModeTabs value={mode} onChange={chooseMode} modes={MODES} />

      {!exercise && learn ? (
        <a className="pgx-learn" href={`#/learn/${learn.lesson.id}`}>
          <IconBulb size={15} />
          <span className="grow">
            {learn.done === 0
              ? `New to ${mode === 'terminal' ? 'the terminal' : info.label}? Learn the basics lesson by lesson, right here.`
              : learn.done === learn.total
                ? `All ${learn.total} ${mode === 'terminal' ? 'Terminal' : info.label} lessons passed.`
                : `${learn.done} of ${learn.total} ${mode === 'terminal' ? 'Terminal' : info.label} lessons passed · Next: ${learn.lesson.title}`}
          </span>
          <span className="pgx-learn__go">
            {learn.done === 0 ? 'Start learning' : learn.done === learn.total ? 'Review' : 'Continue'}
            <IconArrowRight size={13} />
          </span>
        </a>
      ) : null}

      {exercise ? (
        <div className="pgx-brief">
          <Markdown>{exercise.prompt}</Markdown>
        </div>
      ) : null}

      {mode === 'terminal' ? (
        <IdeWindow
          lang="bash"
          file="~/project"
          right={
            <button type="button" className="ide__tool" onClick={reset}>
              <IconRefresh size={13} />
              Reset
            </button>
          }
        >
          <TerminalView key={termKey} shell={shell} onShell={setShell} height={460} />
        </IdeWindow>
      ) : (
        <IdeWindow
          lang={lang}
          file={FILES[lang] ?? 'main'}
          {...(mode === 'code' && !exercise ? { choices, onChoose: (v: string) => setCodeLang(v as Lang) } : {})}
          right={
            <>
              {running && lang === 'python' ? (
                <button type="button" className="ide__tool" onClick={() => python.cancel()}>
                  <IconPause size={13} />
                  Stop
                </button>
              ) : null}
              {exercise?.solution ? (
                <button type="button" className="ide__tool" onClick={() => setShowSolution((s) => !s)}>
                  {showSolution ? 'Hide solution' : 'Solution'}
                </button>
              ) : null}
              <button type="button" className="ide__tool" onClick={reset}>
                <IconRefresh size={13} />
                Reset
              </button>
            </>
          }
        >
          <IdeBody run={runButton}>
            <Editor ide value={code} onChange={onCodeChange} lang={lang} minHeight={380} onRun={() => void run()} placeholder={`Write ${info.label} here…`} />
          </IdeBody>
          <IdePanel
            tabs={tabs}
            active={tabs.some((t) => t.id === tab) ? tab : tabs[0]!.id}
            onTab={setTab}
            right={<span className="pgx-status">{status || (out ? `${out.ms} ms` : sqlOut ? `${sqlOut.ms} ms` : 'Ctrl+Enter runs')}</span>}
          >
            {tab === 'tests' && graded ? (
              <TestCases results={tests} empty="Run your code to check it against the tests." />
            ) : tab === 'input' && takesInput ? (
              <>
                <p className="ide-hint">Standard input: what the program reads{lang === 'python' ? ' with input()' : ' from std::cin'}, one line at a time.</p>
                <textarea
                  className="ide-stdin"
                  aria-label="Standard input"
                  value={stdin[lang] ?? ''}
                  onChange={(e) => setStdin((m) => ({ ...m, [lang]: e.target.value }))}
                  spellCheck={false}
                />
              </>
            ) : tab === 'results' && mode === 'sql' ? (
              sqlOut && !sqlOut.error ? (
                <SqlTables tables={sqlOut.tables} />
              ) : (
                <p className="ide-empty">{sqlOut?.error ? 'The query failed — see the Console tab.' : 'Run your query to see the rows it returns.'}</p>
              )
            ) : tab === 'schema' && mode === 'sql' ? (
              <>
                <p className="ide-hint">Each run starts from a fresh in-memory database with this table.</p>
                <pre className="tcase__value">{SQL_SCHEMA.trim()}</pre>
              </>
            ) : mode === 'sql' ? (
              <ConsoleView error={sqlOut?.error} note={sqlOut && !sqlOut.error ? `Ran in ${sqlOut.ms} ms.` : undefined} empty="Errors from your SQL show here." />
            ) : out && !executes ? (
              <ConsoleView note={`Not executed. ${capability.note}`} />
            ) : (
              <ConsoleView
                stdout={out?.stdout}
                stderr={out?.stderr}
                error={out?.error}
                note={out?.result ? `→ ${out.result}` : out && !out.stdout && !out.stderr && !out.error && !out.plots.length ? 'Ran cleanly with no output.' : undefined}
              >
                {out?.plots.map((src, i) => <img src={src} alt={`Figure ${i + 1}`} key={i} />)}
              </ConsoleView>
            )}
          </IdePanel>
        </IdeWindow>
      )}

      <p className="pgx-note">{capability.note}</p>

      {/* One missing compiler is the difference between a real test run and a
          string comparison, so the fix is offered here rather than left for
          her to go and find. */}
      {mode === 'code' && capability.missing ? (
        <div className="pg__install">
          <p>
            <strong>{capability.missing.label} is not installed.</strong> {capability.missing.install}
          </p>
          <button className="btn btn--quiet btn--sm" onClick={() => void refreshToolchains()} type="button">
            Check again
          </button>
        </div>
      ) : null}

      {showSolution && exercise?.solution ? (
        <div className="pgx-brief">
          <Markdown>{'**Reference solution**\n\n```' + (exercise.lang ?? '') + '\n' + exercise.solution + '\n```'}</Markdown>
        </div>
      ) : null}

      <p className="track-note">
        Python, SQL and C++ run inside this browser tab: nothing you write is uploaded, which also means the Python
        runtime (about 7 MB) and the C++ compiler (about 105 MB) come to you the first time, and your browser then keeps
        them. The Terminal is a practice one that lives in the page; real shell scripts run in Code mode on the Mac.
      </p>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function findExercise(id?: string): { exercise: Exercise; module: Module } | null {
  if (!id) return null
  for (const m of MODULES) {
    const ex = m.exercises?.find((e) => e.id === id)
    if (ex) return { exercise: ex, module: m }
  }
  return null
}
