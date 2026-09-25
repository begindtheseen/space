/* ============================================================================
   ORBIT — the workbench
   ----------------------------------------------------------------------------
   A list of small jobs, and a room to do one in. The whole page is built
   around a single claim it has to keep: none of this counts. That is said out
   loud at the top, it is true in the engine (nothing written here reaches
   mastery, readiness or the review queue), and it is why the page is allowed
   to be the easy thing to open on a day when the curriculum is not.

   The result is the point. It never says "correct". It says what was
   measured and what the requirement was, the way a margin report does —
   shown as the playground's test cases, a passing number in the same
   typeface as a failing one. Each scenario is done in the playground's own
   window, embedded in the page, like every other piece of code in ORBIT.
   ========================================================================== */
import { useCallback, useEffect, useState } from 'react'
import { PlaygroundEmbed, type Graded } from '@/components/ide/Embed'
import { useLessonCode } from '@/components/ide/lessonCode'
import { IconCheck, IconChevronLeft, IconWarn } from '@/components/icons'
import { Button, Card, Chip } from '@/components/ui'
import { BENCH_AREAS, BENCH_TASKS, benchTaskById, type BenchTask } from '@/curriculum/bench'
import { markBenchSolved } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import { buildBenchProgram, formatNumber, parseBenchReport, reportTests, type BenchReport } from '@/lib/bench'
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

/**
 * One scenario, read top to bottom the way the day goes: the job arrives,
 * what done means, then the code — written and run right here in the
 * playground's window, with the margin report as its test cases — and on to
 * the next job.
 */
function Workbench({ task }: { task: BenchTask }) {
  const { state, setState, setResume } = useLearner()
  const [report, setReport] = useState<BenchReport | null>(null)
  const [showHint, setShowHint] = useState(false)
  const specCode = useLessonCode(`bench:${task.id}:spec`, task.spec)
  const solvedAt = state.bench[task.id]
  const at = BENCH_TASKS.findIndex((t) => t.id === task.id)
  const next = BENCH_TASKS[at + 1]

  useEffect(() => {
    setReport(null)
    setShowHint(false)
  }, [task.id])

  useEffect(() => {
    setResume({
      kind: 'playground',
      path: `/bench?task=${task.id}`,
      label: task.title,
      detail: `Workbench · ${BENCH_AREAS[task.area].label}`,
      at: new Date().toISOString(),
    })
  }, [task.id, task.title, task.area, setResume])

  /** Runs her code inside the scenario and reads the harness's report back as test cases. */
  const grade = useCallback(
    async (code: string, _stdin: string, onStatus: (s: string) => void): Promise<Graded> => {
      const out = await python.run(buildBenchProgram(code, task.harness, task.lang), { onStatus })
      const parsed = parseBenchReport(out.stdout)
      setReport(parsed)
      return { run: { ...out, stdout: parsed.output }, tests: reportTests(parsed) }
    },
    [task],
  )

  const failing = (report?.lines ?? []).filter((l) => l.kind !== 'note' && !l.pass).length
  const notes = report?.lines.filter((l): l is Extract<typeof l, { kind: 'note' }> => l.kind === 'note') ?? []

  return (
    <div className="page page--padtop ide-wrap">
      <div className="bench-top">
        <button className="btn btn--quiet btn--sm" onClick={() => navigate('/bench')} type="button">
          <IconChevronLeft size={14} />
          Workbench
        </button>
        <span className="eyebrow-dim">
          Scenario {at + 1} of {BENCH_TASKS.length} · {BENCH_AREAS[task.area].label} · {task.difficulty} · about {task.minutes} min
        </span>
      </div>

      <article className="bench-flow">
        <h1 className="page-head__title">{task.title}</h1>
        {solvedAt ? (
          <span className="bench-card__solved">
            <IconCheck size={12} /> passing
          </span>
        ) : null}

        <section className="bench-ticket" aria-label="How the job arrives">
          <div className="bench-ticket__from">How it arrives</div>
          <p>{task.brief}</p>
        </section>

        <h2 className="bench-h2">What done looks like</h2>
        <Markdown className="bench-spec" renderCode={specCode}>
          {task.spec}
        </Markdown>

        <h2 className="bench-h2">Your code</h2>
        <PlaygroundEmbed
          lang="python"
          code={task.starter}
          saveKey={`bench:${task.id}`}
          grade={grade}
          onPass={() => setState((s) => markBenchSolved(s, task.id))}
          runLabel="Run the scenario"
          input={false}
          minHeight={360}
          testsHint="Run the scenario: every requirement it measures shows here, with what your code achieved."
          eager
        />

        {report ? (
          <section className="bench-verdict-box" data-pass={report.pass}>
            <p className={report.pass ? 'bench-verdict bench-verdict--pass' : 'bench-verdict'}>
              {report.incomplete ? (
                <>
                  <IconWarn size={13} /> {report.incomplete}
                </>
              ) : report.pass ? (
                'Every requirement met. This is the margin report you would send back.'
              ) : (
                `${failing} requirement${failing === 1 ? '' : 's'} not met yet — the test cases above say by how much.`
              )}
            </p>
            {notes.length ? (
              <div className="bench-notes">
                {notes.map((n, i) => (
                  <p key={i}>{n.text}</p>
                ))}
              </div>
            ) : null}
            {report.pass && next ? (
              <Button variant="primary" size="md" onClick={() => navigate(`/bench?task=${next.id}`)}>
                Next job: {next.title}
              </Button>
            ) : null}
          </section>
        ) : null}

        <div className="bench-actions">
          <button className="btn btn--quiet btn--sm" onClick={() => setShowHint((v) => !v)} type="button">
            {showHint ? 'Hide hint' : 'Hint'}
          </button>
          {next ? (
            <button className="btn btn--quiet btn--sm" onClick={() => navigate(`/bench?task=${next.id}`)} type="button">
              Skip to the next job
            </button>
          ) : null}
        </div>
        {showHint ? <div className="bench-hint">{task.hint}</div> : null}
      </article>
    </div>
  )
}

export { formatNumber }
