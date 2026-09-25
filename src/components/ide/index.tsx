/* ============================================================================
   The playground's IDE pieces
   ----------------------------------------------------------------------------
   One look for every place code is written — the playground's four modes and
   every Learn lesson: mode pills along the top, a charcoal window with the
   file's name in a pill, a floating Run Code button, and a panel under the
   editor with tabs (Test cases, Console, Input, Results, Preview).

   Nothing here knows how code runs; the pages hand these components what
   happened. The terminal and the web preview are the exception, because the
   thing they show is the thing that runs: the practice shell (lib/shell) and
   a sandboxed frame (lib/web).
   ========================================================================== */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { IconCheck, IconChevronDown, IconCode, IconDatabase, IconGrid, IconPlay, IconTerminal, IconX } from '@/components/icons'
import type { CheckResult } from '@/learn/types'
import { pretty, run as runShell, type ShellState } from '@/lib/shell'
import { buildPage, newChannel, type WebLog } from '@/lib/web'
import './ide.css'

/* ── Mode pills ──────────────────────────────────────────────────────────── */

export type Mode = 'code' | 'sql' | 'web' | 'terminal'

const MODE_META: Record<Mode, { label: string; icon: ReactNode }> = {
  code: { label: 'Code', icon: <IconCode size={15} /> },
  sql: { label: 'SQL', icon: <IconDatabase size={15} /> },
  web: { label: 'Web', icon: <IconGrid size={15} /> },
  terminal: { label: 'Terminal', icon: <IconTerminal size={15} /> },
}

export function ModeTabs({ value, onChange, modes = ['code', 'sql', 'web', 'terminal'] }: { value: Mode; onChange: (m: Mode) => void; modes?: Mode[] }) {
  return (
    <div className="ide-modes" role="tablist" aria-label="Playground mode">
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={m === value}
          className="ide-modes__pill"
          data-active={m === value}
          onClick={() => onChange(m)}
        >
          {MODE_META[m].icon}
          {MODE_META[m].label}
        </button>
      ))}
    </div>
  )
}

/* ── Language marks ──────────────────────────────────────────────────────── */

const MARKS: Record<string, { bg: string; fg: string; text: string }> = {
  javascript: { bg: '#f7df1e', fg: '#1b1b1b', text: 'JS' },
  typescript: { bg: '#3178c6', fg: '#ffffff', text: 'TS' },
  python: { bg: '#3572a5', fg: '#ffd43b', text: 'Py' },
  sql: { bg: '#0f8a8a', fg: '#ffffff', text: 'SQL' },
  cpp: { bg: '#00599c', fg: '#ffffff', text: 'C++' },
  html: { bg: '#e44d26', fg: '#ffffff', text: '</>' },
  bash: { bg: '#2b2d31', fg: '#4ade80', text: '>_' },
  rust: { bg: '#b7410e', fg: '#ffffff', text: 'Rs' },
  matlab: { bg: '#e16737', fg: '#ffffff', text: 'M' },
  simulink: { bg: '#e16737', fg: '#ffffff', text: 'Sim' },
  text: { bg: '#3a3d44', fg: '#e5e7eb', text: 'Aa' },
}

/** A small coloured tile naming a language, the way course icons do. */
export function LangMark({ lang, size = 22 }: { lang: string; size?: number }) {
  const m = MARKS[lang] ?? { bg: '#3a3d44', fg: '#e5e7eb', text: '{}' }
  const fs = m.text.length > 2 ? size * 0.34 : size * 0.44
  return (
    <svg className="lang-mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <rect width={size} height={size} rx={size * 0.24} fill={m.bg} />
      {lang === 'bash' ? <rect x={0.5} y={0.5} width={size - 1} height={size - 1} rx={size * 0.24} fill="none" stroke="#4b4f57" /> : null}
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={m.fg}
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontWeight={800}
        fontSize={fs}
      >
        {m.text}
      </text>
    </svg>
  )
}

/* ── The window ──────────────────────────────────────────────────────────── */

export interface FileChoice {
  value: string
  label: string
}

/**
 * The charcoal window code is written in. The header's left pill names the
 * file; given `choices`, it is also the language picker.
 */
export function IdeWindow({
  lang,
  file,
  choices,
  onChoose,
  right,
  children,
  className,
}: {
  lang: string
  file: string
  choices?: FileChoice[]
  onChoose?: (value: string) => void
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`ide${className ? ` ${className}` : ''}`}>
      <header className="ide__head">
        <div className="ide__file">
          <LangMark lang={lang} size={18} />
          {choices && onChoose ? (
            <label className="ide__pick">
              <span className="sr-only">Language</span>
              <select value={lang} onChange={(e) => onChoose(e.target.value)} aria-label="Language">
                {choices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="ide__pick-face" aria-hidden="true">
                {file}
                <IconChevronDown size={12} />
              </span>
            </label>
          ) : (
            <span className="ide__name">{file}</span>
          )}
        </div>
        <div className="ide__right">{right}</div>
      </header>
      {children}
    </section>
  )
}

/** Where the editor sits, with the Run Code button floating over its corner. */
export function IdeBody({ children, run }: { children: ReactNode; run?: ReactNode }) {
  return (
    <div className="ide__body">
      {children}
      {run ? <div className="ide__run">{run}</div> : null}
    </div>
  )
}

export function RunButton({ onClick, running, label = 'Run Code', status }: { onClick: () => void; running: boolean; label?: string; status?: string }) {
  return (
    <button type="button" className="ide-run" onClick={onClick} disabled={running} data-running={running}>
      {running ? <span className="ide-run__spin" aria-hidden="true" /> : <IconPlay size={13} />}
      <span>{running ? status || 'Running…' : label}</span>
    </button>
  )
}

/* ── The panel under the editor ──────────────────────────────────────────── */

export interface PanelTab {
  id: string
  label: string
  /** A pass/fail mark after the label. */
  mark?: 'pass' | 'fail'
}

export function IdePanel({
  tabs,
  active,
  onTab,
  children,
  right,
  height = 240,
}: {
  tabs: PanelTab[]
  active: string
  onTab: (id: string) => void
  children: ReactNode
  right?: ReactNode
  height?: number
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="ide-panel" data-open={open}>
      <div className="ide-panel__tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            data-active={t.id === active}
            className="ide-panel__tab"
            onClick={() => {
              onTab(t.id)
              setOpen(true)
            }}
          >
            {t.label}
            {t.mark === 'pass' ? <IconCheck size={12} className="ide-ok" /> : t.mark === 'fail' ? <span className="ide-bad" aria-label="failed">!</span> : null}
          </button>
        ))}
        <span className="grow" />
        {right}
        <button type="button" className="ide-panel__fold" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse panel' : 'Expand panel'} aria-expanded={open}>
          <IconChevronDown size={14} />
        </button>
      </div>
      {open ? (
        <div className="ide-panel__body" style={{ maxHeight: height }}>
          {children}
        </div>
      ) : null}
    </div>
  )
}

/* ── Test cases ──────────────────────────────────────────────────────────── */

/** Every check as a judge shows it: Test #n, then input, expected and what she got. */
export function TestCases({ results, empty }: { results: CheckResult[] | null; empty: string }) {
  const firstFail = results ? Math.max(0, results.findIndex((r) => r.status === 'fail')) : 0
  const [pick, setPick] = useState(firstFail)
  useEffect(() => setPick(firstFail), [results, firstFail])
  if (!results) return <p className="ide-empty">{empty}</p>
  const r = results[Math.min(pick, results.length - 1)]
  const passed = results.filter((x) => x.status === 'pass').length
  return (
    <div className="tcases">
      <div className="tcases__sum" data-all={passed === results.length}>
        {passed === results.length ? <IconCheck size={14} /> : <IconX size={14} />}
        {passed === results.length ? `All ${results.length} tests passed` : `${passed} of ${results.length} tests passed`}
      </div>
      <div className="tcases__tabs" role="tablist" aria-label="Test cases">
        {results.map((x, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === pick}
            data-active={i === pick}
            data-status={x.status}
            className="tcases__tab"
            onClick={() => setPick(i)}
          >
            {x.status === 'pass' ? <IconCheck size={11} /> : <IconX size={11} />}
            Test #{i + 1}
          </button>
        ))}
      </div>
      {r ? (
        <div className="tcase" data-status={r.status}>
          <div className="tcase__name">{r.name}</div>
          {r.input ? <Field label="Input" value={r.input} /> : null}
          {r.expected != null ? <Field label="Expected" value={r.expected} /> : null}
          {r.actual != null ? <Field label="Your output" value={r.actual || '(nothing)'} tone={r.status} /> : null}
          {r.status === 'fail' && r.detail ? <p className="tcase__detail">{r.detail}</p> : null}
          {r.status === 'fail' && r.hint ? <p className="tcase__hint">{r.hint}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, value, tone }: { label: string; value: string; tone?: 'pass' | 'fail' }) {
  return (
    <div className="tcase__field">
      <div className="tcase__label">{label}</div>
      <pre className="tcase__value" data-tone={tone}>
        {value}
      </pre>
    </div>
  )
}

/* ── Console ─────────────────────────────────────────────────────────────── */

export function ConsoleView({
  stdout,
  stderr,
  error,
  note,
  empty = 'Run your code to see its output here.',
  children,
}: {
  stdout?: string
  stderr?: string
  error?: string | null
  /** A dim line after the output (the value of the last expression, a timing). */
  note?: string
  empty?: string
  children?: ReactNode
}) {
  const nothing = !stdout && !stderr && !error && !note && !children
  return (
    <div className="ide-console">
      {stdout ? <span>{stdout}</span> : null}
      {stderr ? <span className="ide-console__err">{stderr}</span> : null}
      {error ? <span className="ide-console__err">{error}</span> : null}
      {note ? <span className="ide-console__meta">{note}</span> : null}
      {children}
      {nothing ? <span className="ide-console__meta">{empty}</span> : null}
    </div>
  )
}

/* ── SQL results ─────────────────────────────────────────────────────────── */

export function SqlTables({ tables, lastOnly = false }: { tables: { columns: string[]; rows: unknown[][] }[]; lastOnly?: boolean }) {
  if (!tables.length) {
    return (
      <p className="ide-empty">
        Ran, and returned no rows. INSERT, UPDATE, DELETE and CREATE return none — run a SELECT to see what changed.
      </p>
    )
  }
  const shown = lastOnly ? tables.slice(-1) : tables
  return (
    <div className="ide-tables">
      {shown.map((t, ti) => (
        <div className="ide-table" key={ti}>
          <div className="ide-table__cap">
            {lastOnly && tables.length > 1 ? `Your last result (of ${tables.length}) · ` : ''}
            {t.rows.length} row{t.rows.length === 1 ? '' : 's'}
          </div>
          <div className="ide-table__scroll">
            <table>
              <thead>
                <tr>
                  {t.columns.map((c, i) => (
                    <th key={i}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.slice(0, 200).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className={cell === null ? 'null' : undefined}>
                        {cell === null ? 'NULL' : cell instanceof Uint8Array ? `(${cell.length} bytes)` : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Terminal ────────────────────────────────────────────────────────────── */

interface Line {
  prompt: string
  cmd: string
  out: string
}

/**
 * The practice terminal: type a command, press Enter (or the ↵ button on a
 * phone). Up and Down walk back through what she typed. The shell itself is
 * owned by the page, so Learn-mode checks read exactly what she did.
 */
export function TerminalView({
  shell,
  onShell,
  banner = 'Practice terminal — nothing here touches your real files. Type help to see the commands.',
  height = 380,
  autoFocus = false,
}: {
  shell: ShellState
  onShell: (next: ShellState) => void
  banner?: string
  height?: number
  autoFocus?: boolean
}) {
  const [lines, setLines] = useState<Line[]>([])
  const [text, setText] = useState('')
  const [back, setBack] = useState(-1)
  const input = useRef<HTMLInputElement | null>(null)
  const screen = useRef<HTMLDivElement | null>(null)
  const prompt = `${pretty(shell.cwd)} $`

  useEffect(() => {
    const el = screen.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const submit = () => {
    const cmd = text
    setText('')
    setBack(-1)
    if (!cmd.trim()) {
      setLines((ls) => [...ls, { prompt, cmd: '', out: '' }])
      return
    }
    const r = runShell(shell, cmd)
    if (r.clear) setLines([])
    else setLines((ls) => [...ls, { prompt, cmd, out: r.out }])
    onShell(r.state)
    input.current?.focus()
  }

  const walk = (dir: 1 | -1) => {
    const h = shell.history
    if (!h.length) return
    const next = back === -1 ? (dir === -1 ? h.length - 1 : -1) : back + dir
    if (next < 0 || next >= h.length) {
      setBack(-1)
      setText('')
      return
    }
    setBack(next)
    setText(h[next]!)
  }

  return (
    <div className="term" style={{ height }} onClick={() => input.current?.focus()}>
      <div className="term__screen" ref={screen}>
        {banner ? <div className="term__banner">{banner}</div> : null}
        {lines.map((l, i) => (
          <div className="term__entry" key={i}>
            <div>
              <span className="term__prompt">{l.prompt}</span> <span className="term__cmd">{l.cmd}</span>
            </div>
            {l.out ? <pre className="term__out">{l.out}</pre> : null}
          </div>
        ))}
        <form
          className="term__line"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <label className="term__prompt" htmlFor="termInput">
            {prompt}
          </label>
          <input
            id="termInput"
            ref={input}
            className="term__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                walk(-1)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                walk(1)
              }
            }}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus={autoFocus}
            aria-label="Command"
            enterKeyHint="send"
          />
          <button type="submit" className="term__enter" aria-label="Run command">
            ↵
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Web preview ─────────────────────────────────────────────────────────── */

/**
 * Renders her page in a sandboxed frame. Each new `html` is a fresh render
 * with its own channel, so a stale frame's logs never reach a new console.
 */
export function WebPreview({ html, onLog, height = 380, title = 'Preview' }: { html: string; onLog?: (log: WebLog) => void; height?: number; title?: string }) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const onLogRef = useRef(onLog)
  onLogRef.current = onLog
  const channel = useMemo(() => newChannel(), [html]) // eslint-disable-line react-hooks/exhaustive-deps
  const doc = useMemo(() => buildPage(html, channel), [html, channel])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const m = e.data as { channel?: string; type?: string; level?: WebLog['level']; text?: string }
      if (!m || m.channel !== channel || e.source !== frame.current?.contentWindow) return
      if (m.type === 'console') onLogRef.current?.({ level: m.level ?? 'log', text: m.text ?? '' })
    }
    addEventListener('message', onMessage)
    return () => removeEventListener('message', onMessage)
  }, [channel])

  return <iframe ref={frame} className="web-preview" title={title} sandbox="allow-scripts allow-modals" srcDoc={doc} style={{ height }} />
}
