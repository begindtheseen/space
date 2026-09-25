/* ============================================================================
   The playground, embedded
   ----------------------------------------------------------------------------
   The playground's IDE window, dropped into any page: a lesson's code example
   becomes something she can edit and run in place, a module's exercise is
   done where it is explained, a scenario's task is coded inside the scenario.
   The lesson carries on underneath; "Playground" takes the code to the full
   page when she wants more room.

   How code runs is the app's business (lib/run.ts). A page that grades —
   an exercise, a Learn step, a scenario — passes `grade`, and the embed shows
   what it returns as test cases.
   ========================================================================== */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Editor } from '@/components/Editor'
import { IconPause, IconRefresh } from '@/components/icons'
import type { Lang } from '@/curriculum/types'
import { saveCode } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import type { CheckResult } from '@/learn/types'
import { cancel, canRun, runCode, warm, type CodeRun } from '@/lib/run'
import { navigate } from '@/lib/router'
import { commandLines, newShell, pretty, run as runShell, type ShellState } from '@/lib/shell'
import type { WebLog } from '@/lib/web'
import {
  ConsoleView,
  IdeBody,
  IdePanel,
  IdeWindow,
  RunButton,
  SqlTables,
  TerminalView,
  TestCases,
  WebPreview,
  type PanelTab,
  type TermLine,
} from './index'

export const FILE_NAMES: Partial<Record<string, string>> = {
  python: 'main.py',
  javascript: 'main.js',
  typescript: 'main.ts',
  cpp: 'main.cpp',
  sql: 'query.sql',
  html: 'index.html',
  bash: '~/project',
  rust: 'main.rs',
  matlab: 'main.m',
  text: 'notes.md',
}

export interface Graded {
  run: CodeRun
  tests: CheckResult[] | null
}

export interface EmbedProps {
  lang: Lang
  /** What the editor starts with. */
  code: string
  /** Where her edits are kept (learner state `code`), so they survive a reload. */
  saveKey?: string
  file?: string
  stdin?: string
  schema?: string
  /** Runs and grades instead of a plain run: exercises, Learn steps, scenarios. */
  grade?: (code: string, stdin: string, onStatus: (s: string) => void) => Promise<Graded>
  /** Called once each time a graded run passes every test. */
  onPass?: () => void
  runLabel?: string
  minHeight?: number
  /** Above the window: what this code is for. */
  caption?: ReactNode
  /** Shown in the panel's Test cases tab before the first run. */
  testsHint?: string
  /** The full playground link; false to leave it out. */
  playground?: boolean
  /** Replaces what the Playground button does (an exercise opens as itself). */
  onOpen?: () => void
  /** Run silently ahead of her code, on one line: imports an earlier snippet made. */
  prelude?: string
  /** Offer an Input tab for standard input (Python and C++). */
  input?: boolean
  /** Rewrites her code just before it runs (console-style examples). */
  transform?: (code: string) => string
  /** Shell code as commands for the practice terminal (the default) or, false, as a script to run. */
  terminal?: boolean
  /** Mount the editor straight away: the page's main piece of work, not an example. */
  eager?: boolean
}

/** Mounts the editor only once the embed is near the screen: a long lesson can carry dozens. */
function useNear(eager = false): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [near, setNear] = useState(eager)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [near])
  return [ref, near]
}

export function PlaygroundEmbed(props: EmbedProps) {
  if (props.lang === 'bash' && props.terminal !== false) return <TerminalEmbed {...props} />
  return <CodeEmbed {...props} />
}

function CodeEmbed({
  lang,
  code: initial,
  saveKey,
  file,
  stdin: initialStdin = '',
  schema,
  grade,
  onPass,
  runLabel,
  minHeight = 140,
  caption,
  testsHint = 'Run your code to check it against the tests.',
  playground = true,
  onOpen,
  prelude,
  input = true,
  transform,
  eager = false,
}: EmbedProps) {
  const { state, setState } = useLearner()
  const [code, setCode] = useState(() => (saveKey ? (state.code[saveKey] ?? initial) : initial))
  const [stdin, setStdin] = useState(initialStdin)
  const [out, setOut] = useState<CodeRun | null>(null)
  const [tests, setTests] = useState<CheckResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [tab, setTab] = useState(grade ? 'tests' : 'console')
  const [page, setPage] = useState<string | null>(null)
  const [logs, setLogs] = useState<WebLog[]>([])
  const [ref, near] = useNear(eager)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Written this way so the file compiles in an app with no web language.
  const web = (lang as string) === 'html'
  const takesInput = input && (lang === 'python' || lang === 'cpp')
  const runs = canRun(lang) || !!grade

  useEffect(() => {
    if (near) warm(lang)
  }, [near, lang])
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  const onChange = useCallback(
    (v: string) => {
      setCode(v)
      if (!saveKey) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setState((s) => saveCode(s, saveKey, v)), 600)
    },
    [saveKey, setState],
  )

  const run = useCallback(async () => {
    if (running) return
    if (web && !grade) {
      setLogs([])
      setPage(code + (page === code ? ' ' : ''))
      setTab('preview')
      return
    }
    setRunning(true)
    setOut(null)
    setTests(null)
    try {
      if (saveKey) setState((s) => saveCode(s, saveKey, code))
      if (web) {
        setLogs([])
        setPage(code + (page === code ? ' ' : ''))
      }
      if (grade) {
        const g = await grade(code, stdin, setStatus)
        setOut(g.run)
        setTests(g.tests)
        setTab(g.tests ? 'tests' : 'console')
        if (g.tests?.length && g.tests.every((t) => t.status === 'pass')) onPass?.()
      } else {
        const shaped = transform ? transform(code) : code
        const program = prelude ? `${prelude}\n${shaped}` : shaped
        setOut(await runCode(lang, program, { stdin, ...(schema ? { schema } : {}), onStatus: setStatus }))
        setTab(lang === 'sql' ? 'results' : 'console')
      }
    } finally {
      setRunning(false)
      setStatus('')
    }
  }, [code, grade, lang, onPass, page, running, saveKey, schema, setState, stdin, web])

  const reset = () => {
    setCode(initial)
    if (saveKey) setState((s) => saveCode(s, saveKey, initial))
    setOut(null)
    setTests(null)
    if (web) setPage(null)
  }

  const open = () => {
    if (onOpen) return onOpen()
    setState((s) => saveCode(s, `scratch:${lang}`, code))
    navigate(`/playground?lang=${lang}`)
  }

  const failed = !!(out?.error || out?.stderr)
  const mark: PanelTab['mark'] = tests ? (tests.every((t) => t.status === 'pass') ? 'pass' : 'fail') : undefined
  const tabs: PanelTab[] = [
    ...(grade ? [{ id: 'tests', label: 'Test cases', ...(mark ? { mark } : {}) }] : []),
    ...(web ? [{ id: 'preview', label: 'Preview' }] : []),
    ...(lang === 'sql' ? [{ id: 'results', label: 'Results' }] : []),
    { id: 'console', label: 'Console', ...(failed ? { mark: 'fail' as const } : {}) },
    ...(takesInput ? [{ id: 'input', label: 'Input' }] : []),
  ]
  const active = tabs.some((t) => t.id === tab) ? tab : tabs[0]!.id
  const showPanel = !!(out || tests || page !== null || grade || (takesInput && initialStdin))

  return (
    <div className="embed" ref={ref}>
      {caption ? <div className="embed__caption">{caption}</div> : null}
      <IdeWindow
        lang={lang}
        file={file ?? FILE_NAMES[lang] ?? 'main'}
        right={
          <>
            {running && lang === 'python' ? (
              <button type="button" className="ide__tool" onClick={() => cancel(lang)}>
                <IconPause size={13} />
                Stop
              </button>
            ) : null}
            <button type="button" className="ide__tool" onClick={reset} title="Put the code back as it was">
              <IconRefresh size={13} />
              Reset
            </button>
            {playground ? (
              <button type="button" className="ide__tool" onClick={open} title="Open this code in the full playground">
                Playground
              </button>
            ) : null}
          </>
        }
      >
        <IdeBody run={runs ? <RunButton onClick={() => void run()} running={running} status={status} label={runLabel ?? (grade ? 'Run tests' : 'Run')} /> : undefined}>
          {near ? (
            <Editor ide value={code} onChange={onChange} lang={lang} minHeight={minHeight} onRun={() => void run()} />
          ) : (
            <pre className="embed__static" style={{ minHeight }}>
              {code}
            </pre>
          )}
        </IdeBody>
        {showPanel ? (
          <IdePanel tabs={tabs} active={active} onTab={setTab} height={web && active === 'preview' ? 1000 : 280} right={<span className="pgx-status">{out ? `${out.ms} ms` : ''}</span>}>
            {web ? (
              <div hidden={active !== 'preview'} className="lm-preview">
                {page !== null ? <WebPreview html={page} onLog={(l) => setLogs((ls) => [...ls, l])} height={260} /> : <p className="ide-empty">Run to see the page.</p>}
              </div>
            ) : null}
            {active === 'tests' ? (
              <TestCases results={tests} empty={testsHint} />
            ) : active === 'input' ? (
              <>
                <p className="ide-hint">Standard input: what the program reads, one line at a time.</p>
                <textarea className="ide-stdin" aria-label="Standard input" value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false} />
              </>
            ) : active === 'results' ? (
              out && !out.error ? <SqlTables tables={out.tables ?? []} /> : <p className="ide-empty">{out?.error ? 'The query failed — see the Console tab.' : 'Run the query to see its rows.'}</p>
            ) : active === 'console' ? (
              web && !grade ? (
                <ConsoleView empty="console.log from the page shows here.">
                  {logs.map((l, i) => (
                    <span key={i} className={l.level === 'error' ? 'ide-console__err' : undefined}>{`${l.text}\n`}</span>
                  ))}
                </ConsoleView>
              ) : out?.notRun ? (
                <ConsoleView note={out.notRun} />
              ) : (
                <ConsoleView
                  stdout={out?.stdout}
                  stderr={out?.stderr}
                  error={out?.error}
                  note={out?.result ? `→ ${out.result}` : out && !out.stdout && !out.stderr && !out.error && !out.plots.length && lang !== 'sql' ? 'Ran cleanly with no output.' : out && lang === 'sql' && !out.error ? `Ran in ${out.ms} ms.` : undefined}
                  empty="Run to see the output."
                >
                  {out?.plots.map((src, i) => <img src={src} alt={`Figure ${i + 1}`} key={i} />)}
                </ConsoleView>
              )
            ) : null}
          </IdePanel>
        ) : null}
      </IdeWindow>
    </div>
  )
}

/**
 * A lesson's shell commands, runnable in the practice terminal: Run types
 * them in order, and the terminal stays open for her to carry on.
 */
function TerminalEmbed({ code, caption, runLabel }: EmbedProps) {
  const [shell, setShell] = useState<ShellState | null>(() => (commandLines(code).length ? null : newShell()))
  const [lines, setLines] = useState<TermLine[]>([])
  const [key, setKey] = useState(0)
  const cmds = commandLines(code)

  const start = () => {
    let s = newShell()
    const shown: TermLine[] = []
    for (const cmd of cmds) {
      const prompt = `${pretty(s.cwd)} $`
      const r = runShell(s, cmd)
      s = r.state
      shown.push({ prompt, cmd, out: r.out })
    }
    setLines(shown)
    setShell(s)
    setKey((k) => k + 1)
  }

  return (
    <div className="embed">
      {caption ? <div className="embed__caption">{caption}</div> : null}
      <IdeWindow
        lang="bash"
        file="~/project"
        right={
          shell && cmds.length ? (
            <button type="button" className="ide__tool" onClick={start}>
              <IconRefresh size={13} />
              Run again
            </button>
          ) : null
        }
      >
        {shell ? (
          <TerminalView
            key={key}
            shell={shell}
            onShell={setShell}
            height={260}
            initialLines={lines}
            banner={cmds.length ? 'Practice terminal: the commands above, run in a pretend folder. Carry on typing.' : 'Practice terminal — a pretend folder that lives in this page. Type help to see the commands.'}
          />
        ) : (
          <IdeBody run={<RunButton onClick={start} running={false} label={runLabel ?? 'Run in the practice terminal'} />}>
            <pre className="embed__static embed__static--term">
              {cmds.map((c, i) => (
                <span key={i}>
                  <span className="term__prompt">$</span> {c}
                  {'\n'}
                </span>
              ))}
            </pre>
          </IdeBody>
        )}
      </IdeWindow>
    </div>
  )
}
