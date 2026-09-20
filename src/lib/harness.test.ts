/* ============================================================================
   ORBIT — Python harness, end to end
   ----------------------------------------------------------------------------
   `buildTestProgram` generates Python source by string concatenation, which is
   exactly the kind of code that looks right and emits a SyntaxError on the one
   input nobody tried. These tests run the generated program through a real
   CPython, so a broken indent or a badly escaped test name fails here rather
   than in a learner's browser.

   Skipped where python3 is unavailable — the generator's own unit tests in
   runtimes.test.ts cover the same logic without needing an interpreter.
   ========================================================================== */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildTestProgram, parseTestOutput } from '@/lib/runtimes'

const hasPython = (() => {
  try {
    execFileSync('python3', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

/* A directory of our own under the platform's temp root: a fixed path would
   collide between concurrent runs and would not exist on another machine. */
const scratch = mkdtempSync(join(tmpdir(), 'orbit-harness-'))

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true })
})

/** Runs a generated harness through a real CPython and returns its stdout. */
let seq = 0
function runPython(program: string): string {
  const f = join(scratch, `h${seq++}.py`)
  writeFileSync(f, program)
  return execFileSync('python3', [f], { encoding: 'utf8' })
}

describe.skipIf(!hasPython)('generated harness runs under real CPython', () => {
  const tests = [
    { name: 'pound-force to newtons', assert: `assert abs(convert(1.0, "lbf", "N") - 4.4482216) < 1e-6` },
    {
      name: 'cross-dimension conversion is rejected',
      assert: `try:
    convert(1.0, "lbf", "kg")
except ValueError:
    pass
else:
    raise AssertionError("converting force to mass must raise")`,
    },
    { name: 'deliberately failing case', assert: `assert 1 == 2, "one is not two"` },
  ]

  const solution = `
FACTORS = {"N": ("force", 1.0), "lbf": ("force", 4.4482216152605), "kg": ("mass", 1.0)}

def convert(value, frm, to):
    df, vf = FACTORS[frm]
    dt, vt = FACTORS[to]
    if df != dt:
        raise ValueError("dimension mismatch")
    return value * vf / vt

print("learner output line")
`

  it('compiles, runs, and reports pass/fail per test', () => {
    const out = runPython(buildTestProgram(solution, tests))
    const { userOutput, outcomes } = parseTestOutput(out, tests)

    expect(userOutput.trim()).toBe('learner output line')
    expect(outcomes.map((o) => o.status)).toEqual(['pass', 'pass', 'fail'])
    expect(outcomes[2]!.message).toContain('one is not two')
  })

  it('reports an exception in learner code as an error, not a pass', () => {
    const broken = `def convert(v, a, b):\n    raise NotImplementedError\n`
    const out = runPython(buildTestProgram(broken, tests.slice(0, 1)))
    const { outcomes } = parseTestOutput(out, tests.slice(0, 1))
    expect(outcomes[0]!.status).toBe('error')
    expect(outcomes[0]!.message).toContain('NotImplementedError')
  })

  it('escapes a test name containing quotes without breaking the program', () => {
    const nasty = [{ name: 'handles "quotes" and \\ backslashes', assert: 'assert True' }]
    const out = runPython(buildTestProgram('x = 1', nasty))
    const { outcomes } = parseTestOutput(out, nasty)
    expect(outcomes[0]!.status).toBe('pass')
  })
})
