/* ============================================================================
   ORBIT — code playground
   ----------------------------------------------------------------------------
   Opens standalone, or on a specific exercise via `#/playground?ex=<id>`, in
   which case it loads the starter code, the tests and the reference solution.

   The header always states which of the three run modes applies. A learner who
   thinks their C++ compiled when it was actually string-compared has been
   misled by the product, and a green tick that means nothing is worse than no
   tick at all.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Editor } from '@/components/Editor'
import {
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconPause,
  IconPlay,
  IconRefresh,
  IconTerminal,
  IconWarn,
  IconX,
} from '@/components/icons'
import { Button, Card, CardHead, Chip, Segmented } from '@/components/ui'
import { MODULES } from '@/curriculum'
import type { Exercise, Lang, Module } from '@/curriculum/types'
import { saveCode } from '@/engine/apply'
import {
  LANGS,
  buildTestProgram,
  capabilityOf,
  detectToolchains,
  runAgainstSolution,
  runNative,
  parseTestOutput,
  python,
  runSql,
  type Capability,
  type RunOutput,
  type SqlResult,
  type TestOutcome,
} from '@/lib/runtimes'
import type { ToolchainInfo } from '@/lib/desktop'
import { Markdown } from '@/lib/markdown'
import { useLearner } from '@/hooks/useLearner'
import { navigate, useRoute } from '@/lib/router'
import { useNextLesson } from '@/pages/Learn'
import './pages.css'

const SCRATCH: Record<string, string> = {
  python: `# Two-body propagation, Euler-Cromer.
# A rough integrator on purpose — watch the energy drift.
import numpy as np
import matplotlib.pyplot as plt

MU = 398600.4418          # km^3/s^2, Earth
r = np.array([7000.0, 0.0])
v = np.array([0.0, 7.546])
dt, steps = 10.0, 3000

track = np.zeros((steps, 2))
for i in range(steps):
    a = -MU * r / np.linalg.norm(r) ** 3
    v = v + a * dt
    r = r + v * dt
    track[i] = r

plt.figure(figsize=(4.2, 4.2))
plt.plot(track[:, 0], track[:, 1], lw=1)
plt.gca().add_patch(plt.Circle((0, 0), 6378, color="#1b4a78"))
plt.axis("equal"); plt.grid(alpha=.15)
plt.title("LEO, 3000 steps")
plt.show()

print("final radius:", round(float(np.linalg.norm(r)), 1), "km")
`,
  sql: `-- Telemetry is where SQL earns its place in aerospace work.
SELECT
  channel,
  COUNT(*)                AS samples,
  ROUND(AVG(value), 2)    AS mean,
  ROUND(MAX(value), 2)    AS peak
FROM telemetry
GROUP BY channel
HAVING COUNT(*) > 2
ORDER BY peak DESC;
`,
  cpp: `#include <cstdio>

int main() {
    std::printf("Hello from a C++ exercise\\n");
    return 0;
}
`,
  rust: `fn main() {
    println!("Hello from a Rust exercise");
}
`,
  matlab: `% MATLAB cannot execute here — the NumPy equivalent is one tab away.
mu = 398600.4418;
r  = [7000; 0; 0];
v  = [0; 7.546; 0];
h  = cross(r, v);
disp(norm(h))
`,
  bash: `#!/usr/bin/env bash
set -euo pipefail
echo "Hello from a shell exercise"
`,
  simulink: '',
  text: '',
}

/** Seed data for the standalone SQL scratchpad. */
const SQL_SCHEMA = `
CREATE TABLE telemetry (t REAL, channel TEXT, value REAL);
INSERT INTO telemetry VALUES
  (0.0,'chamber_pressure',  98.2), (0.1,'chamber_pressure',  99.4),
  (0.2,'chamber_pressure', 101.7), (0.3,'chamber_pressure', 100.9),
  (0.0,'gimbal_angle',       0.4), (0.1,'gimbal_angle',      -1.2),
  (0.2,'gimbal_angle',       2.8), (0.3,'gimbal_angle',       1.1),
  (0.0,'accel_axial',       12.4), (0.1,'accel_axial',       19.8),
  (0.2,'accel_axial',       24.1), (0.3,'accel_axial',       31.6),
  (0.0,'tank_level',        99.9), (0.1,'tank_level',        92.3);
`

const RUNNABLE: Lang[] = ['python', 'sql', 'cpp', 'rust', 'matlab', 'bash']

export function Playground() {
  const route = useRoute()
  const { state, setState } = useLearner()

  const exerciseRef = useMemo(() => findExercise(route.query.ex), [route.query.ex])
  const [lang, setLang] = useState<Lang>(
    exerciseRef?.exercise.lang ?? (RUNNABLE.includes(route.query.lang as Lang) ? (route.query.lang as Lang) : 'python'),
  )
  const learn = useNextLesson(lang)
  const [stdin, setStdin] = useState('')
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [pyOut, setPyOut] = useState<RunOutput | null>(null)
  const [sqlOut, setSqlOut] = useState<SqlResult | null>(null)
  const [outcomes, setOutcomes] = useState<TestOutcome[] | null>(null)
  const [toolchains, setToolchains] = useState<Record<string, ToolchainInfo> | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const exercise = exerciseRef?.exercise
  const info = LANGS[lang]
  const bufferKey = exercise ? `ex:${exercise.id}` : `scratch:${lang}`

  /* ── load the buffer for whatever is selected ──────────────────────────── */
  useEffect(() => {
    const saved = state.code[bufferKey]
    if (saved != null) {
      setCode(saved)
      return
    }
    setCode(exercise?.starter ?? SCRATCH[lang] ?? '')
    // Deliberately not re-running on every keystroke-driven state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bufferKey])

  /* Python's runtime is ~7MB over the wire; start it downloading as soon as
     the page opens rather than at the moment someone hits Run. */
  useEffect(() => {
    if (lang === 'python' && !python.isBooted) python.preload(setStatus)
  }, [lang])

  /* What the machine can compile. Asked once on open; `refresh` re-probes
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

  // What this language can do at this moment, on this machine.
  const capability = useMemo(() => capabilityOf(lang, toolchains), [lang, toolchains])

  const onCodeChange = useCallback(
    (next: string) => {
      setCode(next)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        setState((s) => saveCode(s, bufferKey, next))
      }, 700)
    },
    [bufferKey, setState],
  )

  const run = useCallback(async () => {
    setRunning(true)
    setPyOut(null)
    setSqlOut(null)
    setOutcomes(null)

    try {
      if (lang === 'python') {
        const tests = exercise?.tests ?? []
        const program = tests.length ? buildTestProgram(code, tests) : code
        const out = await python.run(program, { onStatus: setStatus })

        if (tests.length) {
          const parsed = parseTestOutput(out.stdout, tests)
          setPyOut({ ...out, stdout: parsed.userOutput })
          setOutcomes(parsed.outcomes)
        } else {
          setPyOut(out)
        }
        return
      }

      if (lang === 'sql') {
        const schema = exercise?.starter?.includes('CREATE TABLE')
          ? undefined // the learner's own buffer already builds its tables
          : SQL_SCHEMA
        setSqlOut(await runSql(code, schema))
        return
      }

      // Everything else compiles and runs through the shell when the machine
      // has the toolchain for it. When it does not, this stays a comparison
      // against the expected output and the toolbar says so plainly.
      if (capability.mode === 'execute') {
        // With a reference solution to compare against, running it is a real
        // grade: both programs actually execute and their output is compared.
        if (exercise?.solution) {
          const graded = await runAgainstSolution(lang, code, exercise.solution)
          setPyOut(graded.yours)
          setOutcomes([
            {
              name: 'Matches the reference solution',
              status: graded.pass ? 'pass' : 'fail',
              message: graded.detail,
            },
          ])
          return
        }
        setPyOut(await runNative(lang, code, lang === 'cpp' ? stdin : undefined, setStatus))
        return
      }

      setPyOut({
        stdout: '',
        stderr: '',
        plots: [],
        result: null,
        error: null,
        ms: 0,
      })
    } finally {
      setRunning(false)
      setStatus('')
    }
  }, [lang, code, exercise, capability.mode, stdin])

  const reset = () => {
    const starter = exercise?.starter ?? SCRATCH[lang] ?? ''
    setCode(starter)
    setState((s) => saveCode(s, bufferKey, starter))
    setPyOut(null)
    setSqlOut(null)
    setOutcomes(null)
  }

  const passed = outcomes?.every((o) => o.status === 'pass') ?? false

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            <IconTerminal size={13} />
            {exercise ? exerciseRef!.module.title : 'Scratchpad'}
          </div>
          <h1 className="h-page">{exercise ? exercise.title : 'Code playground'}</h1>
          <p className="page-head__sub">
            {exercise
              ? 'Your work is saved to this device as you type.'
              : 'A place to try things. Python, SQL and C++ execute for real, in your browser, with nothing sent anywhere.'}
          </p>
        </div>
        {exercise ? (
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate(`/module/${exerciseRef!.module.id}`)}
          >
            Back to module
          </Button>
        ) : null}
      </div>

      {!exercise ? (
        <div style={{ marginBottom: 'var(--gap)' }}>
          <Segmented
            value={lang}
            options={RUNNABLE.map((l) => ({ value: l, label: LANGS[l].label }))}
            onChange={(l) => {
              setLang(l)
              setPyOut(null)
              setSqlOut(null)
              setOutcomes(null)
            }}
          />
        </div>
      ) : null}

      {!exercise && learn ? (
        <div className="pg-learn">
          <IconBulb size={16} />
          <span className="grow">
            <strong>Learn mode</strong> —{' '}
            {learn.done === 0
              ? `new to ${info.label}? Go through the basics lesson by lesson, in this editor, with every step checked.`
              : learn.done === learn.total
                ? `you have passed all ${learn.total} ${info.label} lessons.`
                : `${learn.done} of ${learn.total} ${info.label} lessons passed. Next: ${learn.lesson.title}.`}
          </span>
          <Button variant="primary" size="sm" onClick={() => navigate(`/learn/${learn.lesson.id}`)}>
            {learn.done === 0 ? 'Start the basics' : learn.done === learn.total ? 'Review' : 'Continue'}
            <IconArrowRight size={13} />
          </Button>
        </div>
      ) : null}

      {exercise ? (
        <Card index={0} style={{ marginBottom: 'var(--gap)' }}>
          <CardHead
            icon={<IconTerminal size={15} />}
            title="Brief"
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip tone="blue">{info.label}</Chip>
                <Chip ghost>{capability.mode}</Chip>
              </div>
            }
            divided
          />
          <div className="sect">
            <Markdown>{exercise.prompt}</Markdown>
          </div>
        </Card>
      ) : null}

      <div className="pg">
        {/* ── editor ────────────────────────────────────────────────────── */}
        <Card index={1}>
          <div className="pg__toolbar">
            <Button variant="primary" size="sm" onClick={() => void run()} disabled={running}>
              <IconPlay size={13} />
              {capability.mode === 'execute' ? 'Run' : 'Check'}
            </Button>
            {running && lang === 'python' ? (
              <Button variant="ghost" size="sm" onClick={() => python.cancel()}>
                <IconPause size={13} />
                Stop
              </Button>
            ) : null}
            <Button variant="quiet" size="sm" onClick={reset}>
              <IconRefresh size={13} />
              Reset
            </Button>
            {exercise?.solution ? (
              <Button variant="quiet" size="sm" onClick={() => setShowSolution((s) => !s)}>
                {showSolution ? 'Hide solution' : 'Solution'}
              </Button>
            ) : null}

            <div className="pg__status">
              {running ? <span className="pg__spinner" /> : null}
              {status || (pyOut ? `${pyOut.ms} ms` : sqlOut ? `${sqlOut.ms} ms` : 'Ctrl+Enter to run')}
            </div>
          </div>

          <Editor
            value={code}
            onChange={onCodeChange}
            lang={lang}
            minHeight={400}
            onRun={() => void run()}
            placeholder={`Write ${info.label} here…`}
          />

          <div className="pg__note">
            {capability.mode === 'execute' ? <IconCheck size={11} style={inlineIcon} /> : <IconWarn size={11} style={inlineIcon} />}
            {capability.note}
          </div>

          {lang === 'cpp' && !exercise ? (
            <div className="pg__stdin">
              <label htmlFor="pgStdin">Input — standard input for the program</label>
              <textarea
                id="pgStdin"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                spellCheck={false}
                rows={4}
                placeholder="Anything typed here is what std::cin reads."
              />
            </div>
          ) : null}

          {/* One missing compiler is the difference between a real test run
              and a string comparison, so the fix is offered here rather than
              left for her to go and find. */}
          {capability.missing ? (
            <div className="pg__install">
              <p>
                <strong>{capability.missing.label} is not installed.</strong> {capability.missing.install}
              </p>
              <button className="btn btn--quiet btn--sm" onClick={() => void refreshToolchains()} type="button">
                Check again
              </button>
            </div>
          ) : null}
        </Card>

        {/* ── output ────────────────────────────────────────────────────── */}
        <div className="stack">
          {outcomes ? (
            <Card index={2}>
              <CardHead
                icon={passed ? <IconCheck size={15} /> : <IconX size={15} />}
                title={passed ? 'All tests passed' : 'Tests'}
                right={
                  <Chip tone={passed ? 'ok' : 'bad'}>
                    {outcomes.filter((o) => o.status === 'pass').length}/{outcomes.length}
                  </Chip>
                }
                divided
              />
              <div className="sect">
                <div className="tests">
                  {outcomes.map((o, i) => (
                    <div className="test" data-status={o.status} key={i}>
                      <span className="test__icon">
                        {o.status === 'pass' ? <IconCheck size={13} /> : <IconX size={13} />}
                      </span>
                      <div className="grow">
                        <div className="test__name">{o.name}</div>
                        {o.message ? <div className="test__msg">{o.message}</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}

          {sqlOut ? <SqlOutput result={sqlOut} /> : null}
          {pyOut ? <PythonOutput out={pyOut} capability={capability} /> : null}

          {showSolution && exercise?.solution ? (
            <Card index={4}>
              <CardHead icon={<IconCheck size={15} />} title="Reference solution" divided />
              <div className="sect">
                <Markdown>
                  {'```' + (exercise.lang ?? '') + '\n' + exercise.solution + '\n```'}
                </Markdown>
              </div>
            </Card>
          ) : null}

          {!pyOut && !sqlOut && !outcomes ? (
            <Card index={3}>
              <CardHead icon={<IconTerminal size={15} />} title="Output" divided />
              <div className="sect">
                <div className="console" />
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <p className="track-note">
        Everything here runs inside this browser tab. Nothing you write is uploaded, and nothing
        leaves the device — which also means the Python runtime is a one-time ~7 MB download that
        your browser then caches.
      </p>
    </div>
  )
}

/* ── Output panels ───────────────────────────────────────────────────────── */

function PythonOutput({ out, capability }: { out: RunOutput; capability: Capability }) {
  if (capability.mode !== 'execute') {
    return (
      <Card index={3}>
        <CardHead icon={<IconWarn size={15} />} title="Not executed" divided />
        <div className="sect" style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
          {/* The reason has to be the real one. This panel used to say the language
              "does not run in a browser" whatever the actual cause was, which is the
              wrong sentence inside the desktop app: it made a compiler she has not
              installed yet look like a limitation of ORBIT, and hid the one line that
              says which compiler and how to get it. */}
          {capability.note}
          {capability.missing ? (
            <div style={{ marginTop: 10 }}>
              <strong>{capability.missing.label} is not installed.</strong>{' '}
              {capability.missing.install} Use the refresh button above once it is, so ORBIT looks
              again without a restart.
            </div>
          ) : null}
        </div>
      </Card>
    )
  }

  return (
    <Card index={3}>
      <CardHead
        icon={<IconTerminal size={15} />}
        title="Output"
        right={<span className="eyebrow-dim">{out.ms} ms</span>}
        divided
      />
      <div className="sect">
        <div className="console">
          {out.stdout ? <span>{out.stdout}</span> : null}
          {out.stderr ? <span className="console__err">{out.stderr}</span> : null}
          {out.error ? <span className="console__err">{out.error}</span> : null}
          {out.result ? <span className="console__meta">{`→ ${out.result}\n`}</span> : null}
          {!out.stdout && !out.stderr && !out.error && !out.result && out.plots.length === 0 ? (
            <span className="console__meta">Ran cleanly with no output.</span>
          ) : null}
        </div>

        {out.plots.map((src, i) => (
          <img className="console__plot" src={src} alt={`Figure ${i + 1}`} key={i} />
        ))}
      </div>
    </Card>
  )
}

function SqlOutput({ result }: { result: SqlResult }) {
  return (
    <Card index={3}>
      <CardHead
        icon={<IconTerminal size={15} />}
        title="Result"
        right={<span className="eyebrow-dim">{result.ms} ms</span>}
        divided
      />
      <div className="sect">
        {result.error ? (
          <div className="console">
            <span className="console__err">{result.error}</span>
          </div>
        ) : result.tables.length === 0 ? (
          <div className="console">
            <span className="console__meta">
              Statement ran and returned no rows. INSERT, UPDATE and CREATE produce no result set —
              run a SELECT to see the effect.
            </span>
          </div>
        ) : (
          result.tables.map((t, ti) => (
            <div className="grid" key={ti} style={{ marginBottom: ti < result.tables.length - 1 ? 12 : 0 }}>
              <div className="grid__caption">
                {t.rows.length} row{t.rows.length === 1 ? '' : 's'} · {t.columns.length} column
                {t.columns.length === 1 ? '' : 's'}
              </div>
              <table>
                <thead>
                  <tr>
                    {t.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.slice(0, 200).map((row, ri) => (
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
          ))
        )}
      </div>
    </Card>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const inlineIcon: CSSProperties = {
  display: 'inline',
  verticalAlign: '-1px',
  marginRight: 6,
}

function findExercise(id?: string): { exercise: Exercise; module: Module } | null {
  if (!id) return null
  for (const m of MODULES) {
    const ex = m.exercises?.find((e) => e.id === id)
    if (ex) return { exercise: ex, module: m }
  }
  return null
}
