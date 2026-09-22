/* ============================================================================
   ORBIT — the workbench
   ----------------------------------------------------------------------------
   A list of small jobs, and a room to do one in. The whole page is built
   around a single claim it has to keep: none of this counts. That is said out
   loud at the top, it is true in the engine (nothing written here reaches
   mastery, readiness or the review queue), and it is why the page is allowed
   to be the easy thing to open on a day when the curriculum is not.

   The result panel is the point. It never says "correct". It says what was
   measured and what the requirement was, the way a margin report does, and it
   shows a passing number in the same typeface as a failing one.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from '@/components/Editor'
import { IconCheck, IconChevronLeft, IconPlay, IconWarn } from '@/components/icons'
import { Button, Card, CardHead, Chip } from '@/components/ui'
import { BENCH_AREAS, BENCH_TASKS, benchTaskById, type BenchTask } from '@/curriculum/bench'
import { markBenchSolved, saveCode } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import {
  buildBenchProgram,
  describeMetric,
  formatNumber,
  parseBenchReport,
  type BenchReport,
} from '@/lib/bench'
import { Markdown } from '@/lib/markdown'
import { navigate, useRoute } from '@/lib/router'
import { python } from '@/lib/runtimes'
import './bench.css'

export function Bench() {
  const route = useRoute()
  const taskId = route.query.task
  const task = taskId ? benchTaskById(taskId) : undefined
  return task ? <Workbench task={task} /> : <TaskList />
}

/* ── the list ────────────────────────────────────────────────────────────── */

function TaskList() {
  const { state } = useLearner()
  const solvedCount = BENCH_TASKS.filter((t) => state.bench[t.id]).length

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div>
          <div className="page-head__kicker">Workbench</div>
          <h1 className="page-head__title">A day on the job</h1>
          <p className="page-head__sub">
            Small pieces of the actual work, each one framed the way it would arrive: something is
            wrong, here is the scenario, the numbers decide. There is no single right answer and no
            marking scheme reading your source — your code runs against the scenario and you get a
            margin report back.
          </p>
        </div>
      </div>

      <div className="bench-note">
        <strong>None of this counts for anything.</strong> Nothing here feeds your mastery,
        readiness, review queue or daily plan. It is the thing to open on a day when the curriculum
        feels like homework. {solvedCount > 0 ? `You have ${solvedCount} passing so far.` : null}
      </div>

      <div className="bench-grid">
        {BENCH_TASKS.map((t, i) => {
          const solved = state.bench[t.id]
          return (
            <Card key={t.id} index={i}>
              <button className="bench-card" onClick={() => navigate(`/bench?task=${t.id}`)} type="button">
                <div className="bench-card__top">
                  <Chip ghost>{BENCH_AREAS[t.area].label}</Chip>
                  <span className="bench-card__meta">
                    {t.difficulty} · {t.minutes} min
                  </span>
                </div>
                <h2 className="bench-card__title">{t.title}</h2>
                <p className="bench-card__brief">{t.brief}</p>
                {solved ? (
                  <span className="bench-card__solved">
                    <IconCheck size={12} /> passing
                  </span>
                ) : null}
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/* ── one task ────────────────────────────────────────────────────────────── */

function Workbench({ task }: { task: BenchTask }) {
  const { state, setState, setResume } = useLearner()
  const bufferKey = `bench:${task.id}`
  const [code, setCode] = useState(() => state.code[bufferKey] ?? task.starter)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [report, setReport] = useState<BenchReport | null>(null)
  const [stderr, setStderr] = useState('')
  const [showHint, setShowHint] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const solvedAt = state.bench[task.id]

  useEffect(() => {
    setCode(state.code[bufferKey] ?? task.starter)
    setReport(null)
    setStderr('')
    setShowHint(false)
    // Reading the buffer once per task is deliberate: it changes on every
    // keystroke and depending on it here would fight the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bufferKey])

  // The runtime is several megabytes; start it as soon as the room opens.
  useEffect(() => {
    if (!python.isBooted) python.preload(setStatus)
  }, [])

  useEffect(() => {
    setResume({
      kind: 'playground',
      path: `/bench?task=${task.id}`,
      label: task.title,
      detail: `Workbench · ${BENCH_AREAS[task.area].label}`,
      at: new Date().toISOString(),
    })
  }, [task.id, task.title, task.area, setResume])

  const onCodeChange = useCallback(
    (next: string) => {
      setCode(next)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setState((s) => saveCode(s, bufferKey, next)), 600)
    },
    [bufferKey, setState],
  )

  const run = useCallback(async () => {
    setRunning(true)
    setReport(null)
    setStderr('')
    try {
      const program = buildBenchProgram(code, task.harness, task.lang)
      const out = await python.run(program, { onStatus: setStatus })
      const parsed = parseBenchReport(out.stdout)
      setReport(parsed)
      setStderr(out.error ? `${out.error}\n${out.stderr}` : out.stderr)
      if (parsed.pass) setState((s) => markBenchSolved(s, task.id))
    } finally {
      setRunning(false)
      setStatus('')
    }
  }, [code, task, setState])

  const reset = () => {
    setCode(task.starter)
    setState((s) => saveCode(s, bufferKey, task.starter))
    setReport(null)
  }

  return (
    <div className="page page--padtop">
      <div className="bench-top">
        <button className="btn btn--quiet btn--sm" onClick={() => navigate('/bench')} type="button">
          <IconChevronLeft size={14} />
          Workbench
        </button>
        <span className="eyebrow-dim">
          {BENCH_AREAS[task.area].label} · {task.difficulty} · about {task.minutes} min
        </span>
      </div>

      <div className="page-head" style={{ paddingTop: 10 }}>
        <div>
          <h1 className="page-head__title">{task.title}</h1>
          <p className="page-head__sub">{task.brief}</p>
        </div>
      </div>

      <div className="bench-split">
        <div className="stack">
          <Card index={0}>
            <CardHead title="What done looks like" divided />
            <div className="sect">
              <Markdown className="bench-spec">{task.spec}</Markdown>
            </div>
          </Card>

          <Card index={1}>
            <CardHead title="Your code" divided />
            <Editor
              value={code}
              onChange={onCodeChange}
              lang="python"
              minHeight={420}
              onRun={() => void run()}
            />
            <div className="bench-actions">
              <Button onClick={() => void run()} disabled={running} variant="primary">
                <IconPlay size={13} />
                {running ? 'Running the scenario…' : 'Run the scenario'}
              </Button>
              <button className="btn btn--quiet btn--sm" onClick={reset} type="button">
                Reset
              </button>
              <button
                className="btn btn--quiet btn--sm"
                onClick={() => setShowHint((v) => !v)}
                type="button"
              >
                {showHint ? 'Hide hint' : 'Hint'}
              </button>
              {status ? <span className="bench-status">{status}</span> : null}
            </div>
            {showHint ? <div className="bench-hint">{task.hint}</div> : null}
          </Card>
        </div>

        <div className="stack">
          <Card index={2}>
            <CardHead
              title="Margin report"
              divided
              right={
                solvedAt ? (
                  <Chip ghost>
                    <IconCheck size={11} /> passed
                  </Chip>
                ) : null
              }
            />
            <div className="sect">
              {report ? <Report report={report} /> : <p className="bench-empty">Run the scenario to see what it measures.</p>}
              {stderr ? <pre className="bench-stderr">{stderr}</pre> : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Report({ report }: { report: BenchReport }) {
  const metrics = report.lines.filter((l) => l.kind === 'metric')
  const checks = report.lines.filter((l) => l.kind === 'check')
  const notes = report.lines.filter((l) => l.kind === 'note')
  const failing = useMemo(
    () => [...metrics, ...checks].filter((l) => !l.pass).length,
    [metrics, checks],
  )

  return (
    <>
      {report.incomplete ? (
        <p className="bench-incomplete">
          <IconWarn size={13} /> {report.incomplete}
        </p>
      ) : (
        <p className={report.pass ? 'bench-verdict bench-verdict--pass' : 'bench-verdict'}>
          {report.pass
            ? 'Every requirement met.'
            : `${failing} requirement${failing === 1 ? '' : 's'} not met yet.`}
        </p>
      )}

      {metrics.length ? (
        <table className="bench-table">
          <tbody>
            {metrics.map((m) => (
              <tr key={m.name} className={m.pass ? '' : 'is-fail'}>
                <td className="bench-table__name">{m.name.replace(/_/g, ' ')}</td>
                <td className="bench-table__value">{describeMetric(m)}</td>
                <td className="bench-table__mark">{m.pass ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {checks.length ? (
        <ul className="bench-checks">
          {checks.map((c) => (
            <li key={c.name} className={c.pass ? '' : 'is-fail'}>
              {c.pass ? '✓' : '✗'} {c.name.replace(/_/g, ' ')}
              {c.detail ? ` — ${c.detail}` : ''}
            </li>
          ))}
        </ul>
      ) : null}

      {notes.length ? (
        <div className="bench-notes">
          {notes.map((n, i) => (
            <p key={i}>{n.text}</p>
          ))}
        </div>
      ) : null}

      {report.output.trim() ? (
        <>
          <div className="bench-outlabel">What your code printed</div>
          <pre className="bench-out">{report.output.trimEnd()}</pre>
        </>
      ) : null}
    </>
  )
}

export { formatNumber }
