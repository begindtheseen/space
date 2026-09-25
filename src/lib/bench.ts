/* ============================================================================
   ORBIT — the workbench
   ----------------------------------------------------------------------------
   Everything else in this app is aimed at a job interview. This is aimed at
   the job.

   A workbench task is a small piece of the actual work: tune a rate loop until
   it meets its margins, find the sign error that is making a frame transform
   wrong, size a landing burn, make a filter stop diverging. She writes code,
   it runs against a scenario, and the answer comes back the way it comes back
   at work — not "correct" but "gain margin 4.2 dB, you need 6".

   Two design rules keep it honest and keep it optional.

   It really runs. The scenario is simulated by real code in the same runtime
   as the playground. There is no marking scheme pattern-matching her source.
   If the controller she wrote is unstable, the simulation goes unstable and
   the numbers say so.

   It is worth nothing. Deliberately. Nothing here feeds mastery, readiness,
   the review queue or the daily plan, and the UI says so. The moment a
   side-activity starts counting, it stops being the thing you do when you
   cannot face the thing that counts — and that is exactly what it is for.

   ── The report protocol ───────────────────────────────────────────────────
   A task's harness runs after her code and prints a block the app parses:

     __ORBIT_BENCH__
     METRIC gain_margin_db 7.4 >= 6 dB
     METRIC settling_s 6.2 <= 8 s
     CHECK actuator_saturation pass
     NOTE Overshoot is 12%, which is inside spec but worth looking at.
     VERDICT pass

   METRIC is a measured number with the requirement it is judged against.
   CHECK is a yes/no engineering condition. NOTE is advice that never fails
   anything. VERDICT is the harness's own summary; the app recomputes pass
   from the metrics rather than trusting it, so a harness bug cannot award a
   pass it did not earn.
   ========================================================================== */

import type { CheckResult } from '@/learn/types'

export const BENCH_MARKER = '__ORBIT_BENCH__'

export type Comparator = '>=' | '<=' | '>' | '<' | '==' | '~='

export interface BenchMetric {
  kind: 'metric'
  name: string
  value: number
  comparator: Comparator
  target: number
  unit?: string
  pass: boolean
}

export interface BenchCheck {
  kind: 'check'
  name: string
  pass: boolean
  detail?: string
}

export interface BenchNote {
  kind: 'note'
  text: string
}

export type BenchLine = BenchMetric | BenchCheck | BenchNote

export interface BenchReport {
  /** Whatever her code printed before the report block. */
  output: string
  lines: BenchLine[]
  /** True only when every metric and check passed, and there was at least one. */
  pass: boolean
  /** Set when the harness never reported — usually because her code threw. */
  incomplete?: string
}

/** Tolerance for `~=`, as a fraction of the target. */
const APPROX_REL = 0.01

export function compare(value: number, comparator: Comparator, target: number): boolean {
  if (!Number.isFinite(value)) return false
  switch (comparator) {
    case '>=':
      return value >= target
    case '<=':
      return value <= target
    case '>':
      return value > target
    case '<':
      return value < target
    case '==':
      return value === target
    case '~=':
      // Relative unless the target is zero, where relative is meaningless.
      return target === 0
        ? Math.abs(value) <= APPROX_REL
        : Math.abs(value - target) <= Math.abs(target) * APPROX_REL
  }
}

const COMPARATORS: ReadonlySet<string> = new Set(['>=', '<=', '>', '<', '==', '~='])

/**
 * Splits her program's stdout into what she printed and what the harness
 * reported, and reads the report.
 *
 * Deliberately forgiving about junk between report lines: a stray print from
 * inside a solver should not destroy the marking. Deliberately unforgiving
 * about a missing report — that means the run did not finish, and claiming a
 * pass would be the worst possible outcome.
 */
export function parseBenchReport(stdout: string): BenchReport {
  const at = stdout.indexOf(BENCH_MARKER)
  if (at < 0) {
    return {
      output: stdout,
      lines: [],
      pass: false,
      incomplete:
        'The scenario did not finish, so nothing was measured. Check the error above — usually the code raised before the run completed.',
    }
  }

  const output = stdout.slice(0, at)
  const body = stdout.slice(at + BENCH_MARKER.length)
  const lines: BenchLine[] = []

  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('METRIC ')) {
      // METRIC <name> <value> <comparator> <target> [unit...]
      const parts = line.slice(7).trim().split(/\s+/)
      const [name, valueText, comparator, targetText, ...unit] = parts
      if (!name || !valueText || !comparator || !targetText) continue
      if (!COMPARATORS.has(comparator)) continue
      const value = Number(valueText)
      const target = Number(targetText)
      if (!Number.isFinite(target)) continue
      lines.push({
        kind: 'metric',
        name,
        value,
        comparator: comparator as Comparator,
        target,
        unit: unit.length ? unit.join(' ') : undefined,
        pass: compare(value, comparator as Comparator, target),
      })
      continue
    }

    if (line.startsWith('CHECK ')) {
      const parts = line.slice(6).trim().split(/\s+/)
      const name = parts[0]
      const verdict = parts[1]
      if (!name || !verdict) continue
      lines.push({
        kind: 'check',
        name,
        pass: verdict === 'pass',
        detail: parts.slice(2).join(' ') || undefined,
      })
      continue
    }

    if (line.startsWith('NOTE ')) {
      lines.push({ kind: 'note', text: line.slice(5).trim() })
      continue
    }
    // VERDICT is read and ignored: pass is recomputed below so that a bug in a
    // harness cannot hand out a pass the measurements do not support.
  }

  const judged = lines.filter((l): l is BenchMetric | BenchCheck => l.kind !== 'note')
  return {
    output,
    lines,
    pass: judged.length > 0 && judged.every((l) => l.pass),
    ...(judged.length === 0
      ? { incomplete: 'The scenario ran but measured nothing. That is a fault in the task, not in your code.' }
      : {}),
  }
}

/**
 * The report as test cases, the way every other run in the app shows its
 * checks: each metric with its requirement and what was measured, each check
 * with what it found. A run that never reported is one failing case saying
 * why.
 */
export function reportTests(report: BenchReport): CheckResult[] {
  if (report.incomplete) return [{ name: 'The scenario ran to the end', status: 'fail', detail: report.incomplete }]
  const unit = (m: BenchMetric) => (m.unit ? ` ${m.unit}` : '')
  return report.lines.flatMap((l): CheckResult[] => {
    const name = l.kind === 'note' ? '' : l.name.replace(/_/g, ' ')
    if (l.kind === 'metric')
      return [
        {
          name,
          status: l.pass ? 'pass' : 'fail',
          expected: `${l.comparator === '~=' ? '≈' : l.comparator} ${formatNumber(l.target)}${unit(l)}`,
          actual: `${Number.isFinite(l.value) ? formatNumber(l.value) : 'not a number'}${unit(l)}`,
        },
      ]
    if (l.kind === 'check') return [{ name, status: l.pass ? 'pass' : 'fail', ...(l.detail ? { actual: l.detail } : {}) }]
    return []
  })
}

/** Turns a metric into the sentence an engineer would say out loud. */
export function describeMetric(m: BenchMetric): string {
  const shown = Number.isFinite(m.value) ? formatNumber(m.value) : 'not a number'
  const unit = m.unit ? ` ${m.unit}` : ''
  const word =
    m.comparator === '>=' || m.comparator === '>'
      ? 'needs at least'
      : m.comparator === '<=' || m.comparator === '<'
        ? 'must stay under'
        : 'must equal'
  return `${shown}${unit} — ${word} ${formatNumber(m.target)}${unit}`
}

/** Enough digits to be useful, not so many it reads as false precision. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n)
  const abs = Math.abs(n)
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return n.toExponential(2)
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 1000) / 1000)
}

/**
 * Assembles the program that actually runs: her code, then the harness.
 *
 * The marker is printed between them so anything she printed stays hers and is
 * shown separately, rather than being mixed into the measurements.
 */
export function buildBenchProgram(code: string, harness: string, lang: 'python'): string {
  if (lang !== 'python') throw new Error(`No workbench harness for ${lang}`)
  return [
    code,
    '',
    `print(${JSON.stringify(`\n${BENCH_MARKER}`)})`,
    '',
    harness,
    '',
  ].join('\n')
}
