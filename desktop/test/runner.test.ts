import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { childEnv, detectToolchains, probe, refreshSearchPath, runCode, whichAll } from '../runner.js'

/* A scratch directory of fake tools, so the tests can describe a machine
   rather than depend on whatever happens to be installed on this one. */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-runner-test-'))
const made: string[] = []

function tool(name: string, body: string): string {
  const file = path.join(tmp, name)
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`, 'utf8')
  fs.chmodSync(file, 0o755)
  made.push(file)
  return file
}

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
  refreshSearchPath()
})

describe('probe', () => {
  it('rejects a tool that prints a diagnostic and exits non-zero', async () => {
    // This is exactly the Xcode command line tools stub. /usr/bin/clang++
    // exists on every Mac; without the tools installed it writes this line to
    // stderr and exits 1. Treating "it printed something" as proof of a
    // compiler made the app promise C++ worked, then fail every build.
    const stub = tool(
      'stub-clang++',
      'echo "xcode-select: note: No developer tools were found, requesting install." >&2\nexit 1',
    )
    expect(await probe(stub, ['--version'], await childEnv())).toBeNull()
  })

  it('accepts a tool that exits cleanly, and reads its version', async () => {
    const good = tool('stub-good', 'echo "Fake compiler 4.2.0"\nexit 0')
    expect(await probe(good, ['--version'], await childEnv())).toEqual({
      bin: good,
      version: 'Fake compiler 4.2.0',
    })
  })

  it('reads a version printed to stderr, which is where several compilers put it', async () => {
    const noisy = tool('stub-stderr', 'echo "Fake compiler 4.2.0" >&2\nexit 0')
    expect((await probe(noisy, ['--version'], await childEnv()))?.version).toBe('Fake compiler 4.2.0')
  })

  it('rejects a tool that hangs', async () => {
    const hang = tool('stub-hang', 'sleep 30')
    expect(await probe(hang, ['--version'], await childEnv())).toBeNull()
  }, 20_000)
})

describe('whichAll', () => {
  it('returns every match in search order, not just the first', async () => {
    const first = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-a-'))
    const second = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-b-'))
    for (const dir of [first, second]) {
      const f = path.join(dir, 'orbit-fake-tool')
      fs.writeFileSync(f, '#!/bin/sh\nexit 0\n', 'utf8')
      fs.chmodSync(f, 0o755)
    }
    const savedPath = process.env.PATH
    const savedShell = process.env.SHELL
    // SHELL is pointed at nothing so the login-shell lookup contributes no
    // directories and the assertion is about what this test set up.
    process.env.SHELL = '/nonexistent-shell'
    process.env.PATH = [first, second].join(path.delimiter)
    refreshSearchPath()
    try {
      expect(await whichAll('orbit-fake-tool')).toEqual([
        path.join(first, 'orbit-fake-tool'),
        path.join(second, 'orbit-fake-tool'),
      ])
    } finally {
      process.env.PATH = savedPath
      if (savedShell === undefined) delete process.env.SHELL
      else process.env.SHELL = savedShell
      refreshSearchPath()
      fs.rmSync(first, { recursive: true, force: true })
      fs.rmSync(second, { recursive: true, force: true })
    }
  })

  it('finds nothing for a name that is not installed', async () => {
    expect(await whichAll('orbit-definitely-not-a-real-binary')).toEqual([])
  })

  it('takes an absolute path as given, and checks it is executable', async () => {
    const exe = tool('stub-abs', 'exit 0')
    const plain = path.join(tmp, 'not-executable')
    fs.writeFileSync(plain, 'hello', 'utf8')
    expect(await whichAll(exe)).toEqual([exe])
    expect(await whichAll(plain)).toEqual([])
    expect(await whichAll(tmp)).toEqual([]) // a directory is not a tool
  })
})

describe('detectToolchains', () => {
  it('finds a toolchain that is not on PATH at all', async () => {
    // The whole point. A Mac app launched from the Dock gets
    // /usr/bin:/bin:/usr/sbin:/sbin from launchd, so rustup and Homebrew are
    // invisible. Shell is the language every machine can run, so it is the
    // one that can be asserted on anywhere.
    const savedPath = process.env.PATH
    process.env.PATH = '/nonexistent-a:/nonexistent-b'
    refreshSearchPath()
    try {
      const found = await detectToolchains(true)
      expect(found.bash.available, 'bash should be found outside PATH').toBe(true)
      expect(path.isAbsolute(String(found.bash.bin))).toBe(true)
    } finally {
      process.env.PATH = savedPath
      refreshSearchPath()
      await detectToolchains(true)
    }
  }, 20_000)

  it('describes a missing toolchain with a way to install it', async () => {
    const found = await detectToolchains(true)
    for (const entry of Object.values(found)) {
      if (entry.available) expect(entry.version, entry.lang).toEqual(expect.any(String))
      else expect(entry.install, entry.lang).toEqual(expect.any(String))
    }
  }, 20_000)
})

describe('runCode', () => {
  it('runs a shell script and gives back what it printed', async () => {
    const res = await runCode({ lang: 'bash', source: 'echo hello from the shell' })
    expect(res.ok).toBe(true)
    expect(res.stage).toBe('run')
    expect(res.exitCode).toBe(0)
    expect(res.stdout.trim()).toBe('hello from the shell')
  }, 30_000)

  it('gives the program the built path, not the stripped one it inherited', async () => {
    // A tool in ~/.local/bin is invisible to a Dock-launched Mac app. Finding
    // the interpreter and then running it with the inherited PATH would leave
    // her script unable to see its own tools, so the child gets the same path
    // the detection searched.
    const binDir = path.join(os.homedir(), '.local', 'bin')
    const marker = path.join(binDir, 'orbit-path-probe')
    fs.mkdirSync(binDir, { recursive: true })
    fs.writeFileSync(marker, '#!/bin/sh\necho reachable\n', 'utf8')
    fs.chmodSync(marker, 0o755)
    const savedPath = process.env.PATH
    try {
      process.env.PATH = '/usr/bin:/bin'
      refreshSearchPath()
      const res = await runCode({ lang: 'bash', source: 'orbit-path-probe' })
      expect(res.stdout.trim()).toBe('reachable')
    } finally {
      process.env.PATH = savedPath
      refreshSearchPath()
      fs.rmSync(marker, { force: true })
    }
  }, 30_000)

  it('reports a script that fails rather than calling it a pass', async () => {
    const res = await runCode({ lang: 'bash', source: 'echo oops >&2\nexit 3' })
    expect(res.ok).toBe(false)
    expect(res.exitCode).toBe(3)
    expect(res.stderr.trim()).toBe('oops')
  }, 30_000)

  it('refuses a language it cannot run, and says so', async () => {
    const res = await runCode({ lang: 'simulink', source: 'anything' })
    expect(res.ok).toBe(false)
    expect(res.stage).toBe('request')
    expect(res.reason).toMatch(/cannot run/i)
  })

  it('refuses an empty or oversized program', async () => {
    expect((await runCode({ lang: 'bash', source: '' })).reason).toMatch(/no code/i)
    expect((await runCode({ lang: 'bash', source: 'x'.repeat(1024 * 1024 + 1) })).reason).toMatch(/too large/i)
  })

  it('leaves no scratch directory behind', async () => {
    const before = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('orbit-run-')).length
    await runCode({ lang: 'bash', source: 'echo done' })
    const after = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('orbit-run-')).length
    expect(after).toBe(before)
  }, 30_000)
})
