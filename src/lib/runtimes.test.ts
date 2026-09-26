/* ============================================================================
   ORBIT — runtime helpers
   ----------------------------------------------------------------------------
   The pure parts of the playground: output comparison, the Python test harness
   it generates, and the parser that reads the harness's results back.

   The harness is string-built Python running learner-supplied code, so the
   escaping cases below are not academic — a test name containing a quote would
   otherwise produce a syntax error and report as a mysterious failure.
   ========================================================================== */
import { describe, expect, it } from 'vitest'
import { LANGS, buildTestProgram, capabilityOf, checkOutput, parseTestOutput } from './runtimes'

describe('checkOutput', () => {
  it('accepts an exact match', () => {
    expect(checkOutput('hello', 'hello').pass).toBe(true)
  })

  it('ignores trailing whitespace and line endings', () => {
    expect(checkOutput('a  \r\nb\t\n\n\n', 'a\nb').pass).toBe(true)
  })

  it('does not ignore leading whitespace — indentation is often the answer', () => {
    expect(checkOutput('  a', 'a').pass).toBe(false)
  })

  it('names the first differing line', () => {
    const r = checkOutput('one\nTWO\nthree', 'one\ntwo\nthree')
    expect(r.pass).toBe(false)
    expect(r.detail).toContain('line 2')
    expect(r.detail).toContain('two')
    expect(r.detail).toContain('TWO')
  })

  it('reports a missing line rather than silently passing a prefix', () => {
    const r = checkOutput('one', 'one\ntwo')
    expect(r.pass).toBe(false)
    expect(r.detail).toContain('line 2')
  })

  it('treats two empty outputs as matching', () => {
    expect(checkOutput('', '').pass).toBe(true)
    expect(checkOutput('\n\n', '').pass).toBe(true)
  })
})

describe('buildTestProgram', () => {
  const tests = [
    { name: 'returns the right value', assert: 'assert f(2) == 4' },
    { name: 'handles zero', assert: 'assert f(0) == 0\nassert f(-0) == 0' },
  ]

  it('keeps the learner code first so the assertions can see it', () => {
    const program = buildTestProgram('def f(x):\n    return x * 2', tests)
    expect(program.indexOf('def f(x)')).toBeLessThan(program.indexOf('__ORBIT_TESTS__'))
  })

  it('indents multi-line assertions into their try block', () => {
    const program = buildTestProgram('x = 1', tests)
    expect(program).toContain('    assert f(0) == 0\n    assert f(-0) == 0')
  })

  it('escapes quotes and backslashes in test names', () => {
    const program = buildTestProgram('x = 1', [
      { name: 'handles "quoted" \\ paths', assert: 'assert True' },
    ])
    expect(program).toContain('\\"quoted\\"')
    expect(program).toContain('\\\\ paths')
    // The name must never break out of its string literal.
    expect(program).not.toContain('PASS 0: handles "quoted"')
  })

  it('separates the marker so learner output can be split off cleanly', () => {
    const program = buildTestProgram('print("hi")', tests)
    expect(program).toContain('print("__ORBIT_TESTS__")')
  })
})

describe('parseTestOutput', () => {
  const tests = [{ name: 'a' }, { name: 'b' }, { name: 'c' }]

  it('splits the learner output from the harness results', () => {
    const stdout = 'user printed this\n__ORBIT_TESTS__\nPASS 0: a\nFAIL 1: b — 2 != 3\nPASS 2: c\n'
    const { userOutput, outcomes } = parseTestOutput(stdout, tests)
    expect(userOutput.trim()).toBe('user printed this')
    expect(outcomes.map((o) => o.status)).toEqual(['pass', 'fail', 'pass'])
    expect(outcomes[1]!.message).toBe('2 != 3')
  })

  it('reports exceptions distinctly from assertion failures', () => {
    const stdout = '__ORBIT_TESTS__\nERROR 0: a — NameError: name f is not defined\n'
    const { outcomes } = parseTestOutput(stdout, tests)
    expect(outcomes[0]!.status).toBe('error')
    expect(outcomes[0]!.message).toContain('NameError')
  })

  it('leaves tests that produced no line marked as errors, not passes', () => {
    // A crash before the harness runs must never read as success.
    const { outcomes } = parseTestOutput('boom\n', tests)
    expect(outcomes.every((o) => o.status === 'error')).toBe(true)
  })

  it('ignores harness lines that index a test that does not exist', () => {
    const stdout = '__ORBIT_TESTS__\nPASS 0: a\nPASS 9: ghost\n'
    const { outcomes } = parseTestOutput(stdout, tests)
    expect(outcomes).toHaveLength(3)
    expect(outcomes[0]!.status).toBe('pass')
  })

  it('treats the whole stream as user output when the marker never appeared', () => {
    const { userOutput } = parseTestOutput('just output\n', tests)
    expect(userOutput).toBe('just output\n')
  })
})

describe('language modes', () => {
  it('claims real execution for Python, SQL and C++ — C++ compiles in the browser when nothing else can', () => {
    const executing = Object.values(LANGS)
      .filter((l) => l.mode === 'execute')
      .map((l) => l.id)
      .sort()
    expect(executing).toEqual(['cpp', 'python', 'sql'])
  })

  it('gives every language an honest note about what happens when you hit run', () => {
    for (const l of Object.values(LANGS)) {
      expect(l.note.length, `${l.id} needs a note`).toBeGreaterThan(20)
    }
  })
})

describe('capabilityOf', () => {
  const clang = {
    cpp: { lang: 'cpp', label: 'C++', available: true, bin: 'clang++', version: 'clang 18.1.3' },
  }
  const noClang = {
    cpp: { lang: 'cpp', label: 'C++', available: false, install: 'Run `xcode-select --install`.' },
  }

  it('leaves Python and SQL executing regardless of the shell', () => {
    expect(capabilityOf('python', null, false).mode).toBe('execute')
    expect(capabilityOf('sql', null, false).mode).toBe('execute')
  })

  it('executes C++ for real when a compiler is installed', () => {
    const cap = capabilityOf('cpp', clang, true, true)
    expect(cap.mode).toBe('execute')
    expect(cap.toolchain).toBe('clang 18.1.3')
    expect(cap.missing).toBeUndefined()
    expect(cap.note).toContain('Runs for real')
  })

  it('compiles C++ in the browser when the Mac has no compiler, and says which is being used', () => {
    const cap = capabilityOf('cpp', noClang, true, true)
    expect(cap.mode).toBe('execute')
    expect(cap.missing).toBeUndefined()
    expect(cap.note).toContain('clang++')
    // It must not claim the Mac's own compiler ran it.
    expect(cap.note).not.toContain('on this machine')
  })

  it('compiles C++ in the browser when there is no shell at all', () => {
    const cap = capabilityOf('cpp', null, false)
    expect(cap.mode).toBe('execute')
    expect(cap.note).toContain('throw and try do not compile')
    expect(cap.missing).toBeUndefined()
  })

  it('does not claim anything is missing before detection has answered', () => {
    expect(capabilityOf('cpp', null, true, true).missing).toBeUndefined()
    const rust = capabilityOf('rust', null, true, true)
    expect(rust.missing).toBeUndefined()
    expect(rust.note).toContain('Checking')
  })

  it('blames the old app, not the missing desktop, inside an old app', () => {
    // A bundle updates itself and the app around it does not, so a shell from
    // before the runner existed shows a current curriculum it cannot compile.
    // Telling her to go get the desktop app while she is looking at it is the
    // one answer that leaves her with nowhere to go. (C++ no longer needs the
    // shell at all; Rust still does.)
    const cap = capabilityOf('rust', null, true, false)
    expect(cap.mode).toBe('check')
    expect(cap.note).toContain('older than the lessons')
    expect(cap.note).not.toContain('Checking')
    expect(cap.missing?.install).toContain('Settings')
    expect(capabilityOf('cpp', null, true, false).mode).toBe('execute')
  })

  it('never credits the Mac\'s compiler when the shell cannot reach it', () => {
    // Even handed a full set of toolchains: without the bridge, none of them
    // are reachable. C++ still runs, in the browser — and says so.
    const cpp = capabilityOf('cpp', clang, true, false)
    expect(cpp.toolchain).toBeUndefined()
    expect(cpp.note).not.toContain('clang 18.1.3')
    for (const lang of ['rust', 'matlab', 'bash'] as const) {
      // Even handed a full set of toolchains: without the bridge, none of them
      // are reachable, and a green "runs for real" would be a lie.
      const cap = capabilityOf(lang, clang, true, false)
      expect(cap.mode, lang).not.toBe('execute')
      expect(cap.note, lang).not.toContain('Runs for real')
    }
  })

  it('leaves languages with nothing to execute alone', () => {
    expect(capabilityOf('simulink', clang, true, true).mode).toBe('reference')
    expect(capabilityOf('text', clang, true, true).mode).toBe('reference')
  })
})
