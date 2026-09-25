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

/* ── Course logos ────────────────────────────────────────────────────────── */

/** The shape of each language's usual mark, drawn on a 32-unit grid. */
function logo(lang: string): ReactNode {
  const mono = "'JetBrains Mono', ui-monospace, monospace"
  switch (lang) {
    case 'python':
      return (
        <>
          <path d="M15.9 2C9.8 2 10.2 4.6 10.2 4.6v2.8h5.8v.8H7.9S4 7.8 4 13.9s3.4 5.9 3.4 5.9h2v-2.8s-.1-3.4 3.4-3.4h5.8s3.2.1 3.2-3.1V5.3S22.3 2 15.9 2zm-3.2 1.9a1 1 0 110 2.1 1 1 0 010-2.1z" fill="#3776ab" />
          <path d="M16.1 30c6.1 0 5.7-2.6 5.7-2.6v-2.8H16v-.8h8.1S28 24.2 28 18.1s-3.4-5.9-3.4-5.9h-2V15s.1 3.4-3.4 3.4h-5.8s-3.2-.1-3.2 3.1v5.2S9.7 30 16.1 30zm3.2-1.9a1 1 0 110-2.1 1 1 0 010 2.1z" fill="#ffd43b" />
        </>
      )
    case 'javascript':
      return (
        <>
          <rect x="4" y="4" width="24" height="24" rx="3" fill="#f7df1e" />
          <text x="25.5" y="25" textAnchor="end" fontFamily={mono} fontWeight={800} fontSize="11" fill="#1b1b1b">JS</text>
        </>
      )
    case 'typescript':
      return (
        <>
          <rect x="4" y="4" width="24" height="24" rx="3" fill="#3178c6" />
          <text x="25.5" y="25" textAnchor="end" fontFamily={mono} fontWeight={800} fontSize="11" fill="#ffffff">TS</text>
        </>
      )
    case 'html':
      return (
        <>
          <path d="M6 3l1.9 21.6L16 27l8.1-2.4L26 3H6z" fill="#e44d26" />
          <path d="M16 5v20l6.5-1.9L24 5h-8z" fill="#f16529" />
          <path d="M11 8h10l-.3 2.6h-7l.3 3h6.4l-.6 6.3L16 21l-3.8-1.1-.3-2.8h2.5l.1 1.1 1.5.4 1.5-.4.2-2.2h-6L11 8z" fill="#ffffff" />
        </>
      )
    case 'sql':
      return (
        <>
          <path d="M6 8v16c0 2.2 4.5 4 10 4s10-1.8 10-4V8" fill="#2b88c8" />
          <ellipse cx="16" cy="8" rx="10" ry="4" fill="#6cc4f0" />
          <path d="M6 14c0 2.2 4.5 4 10 4s10-1.8 10-4M6 19.5c0 2.2 4.5 4 10 4s10-1.8 10-4" fill="none" stroke="#6cc4f0" strokeWidth="1.4" />
        </>
      )
    case 'cpp':
      return (
        <>
          <path d="M16 2.5l11.7 6.75v13.5L16 29.5 4.3 22.75V9.25z" fill="#00599c" />
          <path d="M16 2.5l11.7 6.75L16 16z" fill="#659ad2" />
          <text x="16" y="20" textAnchor="middle" fontFamily={mono} fontWeight={800} fontSize="9" fill="#ffffff">C++</text>
        </>
      )
    case 'bash':
      return (
        <>
          <rect x="3" y="5" width="26" height="22" rx="3.5" fill="#1b1d21" stroke="#4b4f57" />
          <circle cx="7.5" cy="9" r="1.2" fill="#f87171" />
          <circle cx="11" cy="9" r="1.2" fill="#fbbf24" />
          <circle cx="14.5" cy="9" r="1.2" fill="#4ade80" />
          <path d="M8 15l4 3-4 3" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 22h8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
        </>
      )
    case 'git':
      return (
        <>
          <rect x="7" y="7" width="18" height="18" rx="3" transform="rotate(45 16 16)" fill="#f05133" />
          <path d="M13 10.5v11M13 13.5l5 4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="13" cy="10.5" r="1.9" fill="#ffffff" />
          <circle cx="13" cy="21.5" r="1.9" fill="#ffffff" />
          <circle cx="19" cy="18.2" r="1.9" fill="#ffffff" />
        </>
      )
    case 'rust':
      return (
        <>
          <circle cx="16" cy="16" r="12" fill="#b7410e" />
          <text x="16" y="21" textAnchor="middle" fontFamily={mono} fontWeight={800} fontSize="13" fill="#ffffff">R</text>
        </>
      )
    case 'matlab':
    case 'simulink':
      return (
        <>
          <path d="M3 21l8-5 5-11 6 14 7 3-8 1-4 5-6-7z" fill="#e16737" />
          <path d="M16 5l6 14-6 2-5-5z" fill="#f59e5b" />
        </>
      )
    default:
      return (
        <>
          <rect x="7" y="4" width="18" height="24" rx="2.5" fill="#e5e7eb" />
          <path d="M11 11h10M11 15h10M11 19h6" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )
  }
}

/** A language's mark, the way course icons show it. */
export function LangMark({ lang, size = 22 }: { lang: string; size?: number }) {
  return (
    <svg className="lang-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {logo(lang)}
    </svg>
  )
}

/** The finish line: a certificate with its ribbon. */
export function CertificateMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="lang-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="24" height="17" rx="2.5" />
      <path d="M9 12h9M9 16.5h6" />
      <circle cx="23" cy="19.5" r="3.4" fill="currentColor" stroke="none" />
      <path d="M21 22.5l-1 5 3-1.6 3 1.6-1-5" />
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
