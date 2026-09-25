import { describe, expect, it } from 'vitest'
import { BENCH_TASKS, benchTaskById } from '@/curriculum/bench'
import {
  BENCH_MARKER,
  buildBenchProgram,
  compare,
  describeMetric,
  formatNumber,
  parseBenchReport,
  reportTests,
} from './bench'

const report = (body: string) => `some of her own output\n${BENCH_MARKER}\n${body}`

describe('compare', () => {
  it('handles each comparator', () => {
    expect(compare(7, '>=', 6)).toBe(true)
    expect(compare(5.9, '>=', 6)).toBe(false)
    expect(compare(2, '<=', 2.5)).toBe(true)
    expect(compare(3, '<', 3)).toBe(false)
    expect(compare(4, '>', 3)).toBe(true)
    expect(compare(1, '==', 1)).toBe(true)
  })

  it('treats ~= as a relative tolerance, and absolute at zero', () => {
    expect(compare(100.5, '~=', 100)).toBe(true)
    expect(compare(102, '~=', 100)).toBe(false)
    expect(compare(0.005, '~=', 0)).toBe(true)
    expect(compare(0.5, '~=', 0)).toBe(false)
  })

  it('never passes a non-finite measurement', () => {
    // A diverged simulation reports NaN, and that must never read as a pass.
    expect(compare(Number.NaN, '<=', 10)).toBe(false)
    expect(compare(Number.POSITIVE_INFINITY, '>=', 6)).toBe(false)
  })
})

describe('parseBenchReport', () => {
  it('splits her output from the measurements', () => {
    const r = parseBenchReport(report('METRIC settling 1.2 <= 2.5 s'))
    expect(r.output.trim()).toBe('some of her own output')
    expect(r.lines).toHaveLength(1)
  })

  it('passes only when every metric and check passes', () => {
    expect(parseBenchReport(report('METRIC a 1 <= 2\nMETRIC b 5 >= 3')).pass).toBe(true)
    expect(parseBenchReport(report('METRIC a 1 <= 2\nMETRIC b 1 >= 3')).pass).toBe(false)
    expect(parseBenchReport(report('METRIC a 1 <= 2\nCHECK stable fail')).pass).toBe(false)
  })

  it('ignores the harness VERDICT and recomputes from the measurements', () => {
    // A harness bug must not be able to hand out a pass nothing supports.
    const r = parseBenchReport(report('METRIC a 9 <= 2\nVERDICT pass'))
    expect(r.pass).toBe(false)
  })

  it('refuses to pass when the harness never reported', () => {
    const r = parseBenchReport('Traceback (most recent call last): ZeroDivisionError')
    expect(r.pass).toBe(false)
    expect(r.incomplete).toBeTruthy()
  })

  it('refuses to pass when the report measured nothing', () => {
    const r = parseBenchReport(report('NOTE just a note'))
    expect(r.pass).toBe(false)
    expect(r.incomplete).toBeTruthy()
  })

  it('keeps units and notes, and survives junk between lines', () => {
    const r = parseBenchReport(
      report('METRIC gain_margin 7.4 >= 6 dB\nstray print from a solver\nNOTE Overshoot is 12%.'),
    )
    const metric = r.lines.find((l) => l.kind === 'metric')
    expect(metric).toMatchObject({ name: 'gain_margin', value: 7.4, unit: 'dB', pass: true })
    expect(r.lines.some((l) => l.kind === 'note')).toBe(true)
  })

  it('drops a malformed metric rather than guessing at it', () => {
    const r = parseBenchReport(report('METRIC broken\nMETRIC b 1 ?? 2\nMETRIC ok 1 <= 2'))
    expect(r.lines.filter((l) => l.kind === 'metric')).toHaveLength(1)
  })

  it('reads a NaN measurement as a failure, not as a pass', () => {
    const r = parseBenchReport(report('METRIC rms nan <= 12 m'))
    expect(r.pass).toBe(false)
  })
})

describe('formatNumber', () => {
  it('keeps numbers readable without false precision', () => {
    expect(formatNumber(7)).toBe('7')
    expect(formatNumber(7.43219)).toBe('7.432')
    expect(formatNumber(1.1e-9)).toBe('1.10e-9')
    expect(formatNumber(2.5e8)).toBe('2.50e+8')
  })
})

describe('describeMetric', () => {
  it('reads like an engineer saying it out loud', () => {
    const r = parseBenchReport(report('METRIC gain_margin 7.4 >= 6 dB'))
    const m = r.lines.find((l) => l.kind === 'metric')!
    expect(describeMetric(m)).toBe('7.4 dB — needs at least 6 dB')
  })
})

describe('buildBenchProgram', () => {
  it('puts the marker between her code and the harness', () => {
    const program = buildBenchProgram('x = 1', 'print("METRIC a 1 <= 2")', 'python')
    expect(program.indexOf('x = 1')).toBeLessThan(program.indexOf(BENCH_MARKER))
    expect(program.indexOf(BENCH_MARKER)).toBeLessThan(program.indexOf('METRIC a 1 <= 2'))
  })
})

describe('the task set', () => {
  it('has unique ids and a hint, spec and harness each', () => {
    const ids = BENCH_TASKS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of BENCH_TASKS) {
      expect(t.starter.trim().length, `${t.id} starter`).toBeGreaterThan(0)
      expect(t.harness.trim().length, `${t.id} harness`).toBeGreaterThan(0)
      expect(t.hint.trim().length, `${t.id} hint`).toBeGreaterThan(0)
      expect(t.spec.trim().length, `${t.id} spec`).toBeGreaterThan(0)
      expect(benchTaskById(t.id)).toBe(t)
    }
  })

  it('has a harness that actually measures something', () => {
    // Cheap guard against a task shipping with a harness that can never fail.
    for (const t of BENCH_TASKS) {
      expect(t.harness, `${t.id} prints no METRIC or CHECK`).toMatch(/METRIC |CHECK /)
    }
  })
})

describe('reportTests', () => {
  it('shows each metric as a test case: requirement against what was measured', () => {
    const r = parseBenchReport('hi\n__ORBIT_BENCH__\nMETRIC gain_margin 7.4 >= 6 dB\nMETRIC overshoot 31.2 <= 20 %\nCHECK stable pass\nCHECK sign fail flipped in the body frame\nNOTE fine\n')
    expect(reportTests(r)).toEqual([
      { name: 'gain margin', status: 'pass', expected: '>= 6 dB', actual: '7.4 dB' },
      { name: 'overshoot', status: 'fail', expected: '<= 20 %', actual: '31.2 %' },
      { name: 'stable', status: 'pass' },
      { name: 'sign', status: 'fail', actual: 'flipped in the body frame' },
    ])
  })

  it('turns a run that never reported into one failing case that says why', () => {
    const t = reportTests(parseBenchReport('Traceback …'))
    expect(t).toHaveLength(1)
    expect(t[0]).toMatchObject({ status: 'fail' })
    expect(t[0]!.detail).toBeTruthy()
  })
})
