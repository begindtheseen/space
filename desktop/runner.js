// Running her code, for real, in the languages a browser cannot run.
//
// Python and SQL already execute in the renderer through WebAssembly. C, C++,
// Rust, shell and Octave have no browser story worth shipping — the smallest
// serious C++ toolchain in WebAssembly is tens of megabytes, and there is no
// Rust compiler that runs in a browser at all. What the desktop shell does
// have is the machine underneath it, which usually already carries a compiler.
//
// So: detect what is installed, use it, and say plainly what is missing rather
// than pretending a string comparison is a test run. A red "clang++ not found,
// here is the one command that installs it" is worth more than a green tick
// that means nothing.
//
// This executes code she wrote, on her own machine, at her request — the same
// thing any editor does when you press run. The limits below are there to stop
// an infinite loop or a runaway allocation from taking the app down with it,
// not to contain an attacker who already has her keyboard:
//
//   - a scratch directory per run, removed afterwards
//   - a wall-clock timeout, after which the whole process group is killed
//   - capped output, so `while(1) printf` cannot exhaust memory
//   - no shell interpolation: arguments are passed as arrays, never as a
//     string a filename could break out of
import { execFile, spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Wall clock for one compile or one run. */
const COMPILE_TIMEOUT_MS = 30_000
const RUN_TIMEOUT_MS = 10_000
/** Past this much stdout+stderr the program is not teaching her anything. */
const MAX_OUTPUT_BYTES = 256 * 1024
const MAX_SOURCE_BYTES = 1024 * 1024

/**
 * What each language needs, and how to build and run it.
 *
 * `probe` is the cheapest command that proves the tool is really there.
 * `install` is what to tell her when it is not — macOS first, since that is
 * what she is on.
 */
const TOOLCHAINS = {
  cpp: {
    label: 'C++',
    source: 'main.cpp',
    candidates: ['clang++', 'g++'],
    probeArgs: ['--version'],
    compile: (bin, src, exe) => [bin, ['-std=c++20', '-O1', '-o', exe, src]],
    run: (exe) => [exe, []],
    install: 'Install Apple’s command line tools: run `xcode-select --install` in Terminal.',
  },
  c: {
    label: 'C',
    source: 'main.c',
    candidates: ['clang', 'gcc'],
    probeArgs: ['--version'],
    compile: (bin, src, exe) => [bin, ['-std=c17', '-O1', '-o', exe, src]],
    run: (exe) => [exe, []],
    install: 'Install Apple’s command line tools: run `xcode-select --install` in Terminal.',
  },
  rust: {
    label: 'Rust',
    source: 'main.rs',
    candidates: ['rustc'],
    probeArgs: ['--version'],
    compile: (bin, src, exe) => [bin, ['-O', '-o', exe, src]],
    run: (exe) => [exe, []],
    install: 'Install Rust from https://rustup.rs — one command, no admin rights needed.',
  },
  bash: {
    label: 'Shell',
    source: 'script.sh',
    candidates: ['bash', 'sh'],
    probeArgs: ['--version'],
    run: (_exe, bin, src) => [bin, [src]],
    install: 'Every Mac ships with bash, so this one should never be missing.',
  },
  matlab: {
    label: 'MATLAB / Octave',
    source: 'script.m',
    // MATLAB itself is licensed per seat; Octave runs the same language and is free.
    candidates: ['octave-cli', 'octave'],
    probeArgs: ['--version'],
    run: (_exe, bin, src) => [bin, ['--quiet', '--no-gui', src]],
    install: 'Install GNU Octave (`brew install octave`) to run MATLAB code locally.',
  },
  node: {
    label: 'JavaScript',
    source: 'main.mjs',
    candidates: ['node'],
    probeArgs: ['--version'],
    run: (_exe, bin, src) => [bin, [src]],
    install: 'Install Node.js from https://nodejs.org.',
  },
}

export const RUNNABLE_LANGS = Object.keys(TOOLCHAINS)

/* ── Detection ───────────────────────────────────────────────────────────── */

const detectCache = new Map()

function probe(bin, args) {
  return new Promise((resolve) => {
    execFile(bin, args, { timeout: 5000, windowsHide: true }, (err, stdout, stderr) => {
      if (err && !stdout && !stderr) {
        resolve(null)
        return
      }
      const line = String(stdout || stderr).split('\n')[0]?.trim() ?? ''
      resolve({ bin, version: line.slice(0, 200) })
    })
  })
}

/**
 * Which compiler each language will actually use, and its version.
 * @param {boolean} refresh ignore the cache — used after she installs something
 */
export async function detectToolchains(refresh = false) {
  const out = {}
  for (const [lang, spec] of Object.entries(TOOLCHAINS)) {
    if (!refresh && detectCache.has(lang)) {
      out[lang] = detectCache.get(lang)
      continue
    }
    let found = null
    for (const candidate of spec.candidates) {
      // eslint-disable-next-line no-await-in-loop -- first hit wins; probing the
      // rest would be wasted work and slows the Settings page down.
      found = await probe(candidate, spec.probeArgs)
      if (found) break
    }
    const entry = found
      ? { lang, label: spec.label, available: true, bin: found.bin, version: found.version }
      : { lang, label: spec.label, available: false, install: spec.install }
    detectCache.set(lang, entry)
    out[lang] = entry
  }
  return out
}

/* ── Execution ───────────────────────────────────────────────────────────── */

function runProcess(bin, args, { cwd, stdin, timeoutMs }) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(bin, args, {
        cwd,
        // A new process group, so killing it takes the whole tree — a compiler
        // that spawns a linker, a script that spawns a subshell.
        detached: process.platform !== 'win32',
        windowsHide: true,
        env: { ...process.env, TERM: 'dumb', NO_COLOR: '1' },
      })
    } catch (err) {
      resolve({ code: null, stdout: '', stderr: String(err?.message ?? err), timedOut: false })
      return
    }

    let stdout = ''
    let stderr = ''
    let truncated = false
    let done = false
    let timedOut = false

    const append = (which, chunk) => {
      const text = chunk.toString('utf8')
      const current = which === 'out' ? stdout : stderr
      if (current.length + text.length > MAX_OUTPUT_BYTES) {
        truncated = true
        const room = Math.max(0, MAX_OUTPUT_BYTES - current.length)
        if (which === 'out') stdout += text.slice(0, room)
        else stderr += text.slice(0, room)
        kill()
        return
      }
      if (which === 'out') stdout += text
      else stderr += text
    }

    const kill = () => {
      try {
        if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL')
        else child.kill('SIGKILL')
      } catch {
        /* already gone */
      }
    }

    const timer = setTimeout(() => {
      if (done) return
      timedOut = true
      kill()
    }, timeoutMs)

    child.stdout?.on('data', (c) => append('out', c))
    child.stderr?.on('data', (c) => append('err', c))
    child.on('error', (err) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve({ code: null, stdout, stderr: stderr + String(err?.message ?? err), timedOut, truncated })
    })
    child.on('close', (code) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve({ code, stdout, stderr, timedOut, truncated })
    })

    if (stdin) {
      child.stdin?.on('error', () => {
        /* the program may not read stdin at all */
      })
      child.stdin?.end(stdin)
    } else {
      child.stdin?.end()
    }
  })
}

/**
 * Compiler diagnostics name the file they compiled, which is a scratch path
 * like /tmp/orbit-run-cfs9Vj/main.cpp. Showing her that is noise at best and
 * alarming at worst, so the directory is replaced by the friendly file name
 * the editor already shows.
 */
function scrubPaths(text, dir, sourceName) {
  if (!text) return text
  return text.split(path.join(dir, sourceName)).join(sourceName).split(dir + path.sep).join('')
}

/**
 * Compiles if the language needs it, then runs, in a scratch directory that is
 * removed afterwards.
 *
 * @param {{lang: string, source: string, stdin?: string}} request
 * @returns {Promise<{ok: boolean, stage: string, stdout: string, stderr: string,
 *   exitCode: number|null, timedOut: boolean, truncated: boolean, ms: number,
 *   toolchain?: string, reason?: string, install?: string}>}
 */
export async function runCode(request, log = () => {}) {
  const started = Date.now()
  const fail = (stage, reason, extra = {}) => ({
    ok: false,
    stage,
    reason,
    stdout: '',
    stderr: '',
    exitCode: null,
    timedOut: false,
    truncated: false,
    ms: Date.now() - started,
    ...extra,
  })

  if (!request || typeof request !== 'object') return fail('request', 'No request was sent.')
  const { lang, source, stdin } = request
  const spec = TOOLCHAINS[lang]
  if (!spec) return fail('request', `ORBIT cannot run ${String(lang)} on this machine.`)
  if (typeof source !== 'string' || source.length === 0) return fail('request', 'There is no code to run.')
  if (source.length > MAX_SOURCE_BYTES) return fail('request', 'That file is too large to run.')
  if (stdin !== undefined && (typeof stdin !== 'string' || stdin.length > MAX_SOURCE_BYTES)) {
    return fail('request', 'That input is too large.')
  }

  const detected = await detectToolchains()
  const tool = detected[lang]
  if (!tool?.available) {
    return fail('toolchain', `${spec.label} is not installed on this Mac yet.`, { install: spec.install })
  }

  let dir
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-run-'))
  } catch (err) {
    return fail('setup', `Could not create a scratch directory: ${err?.message ?? err}`)
  }

  try {
    const srcPath = path.join(dir, spec.source)
    fs.writeFileSync(srcPath, source, 'utf8')
    const exePath = path.join(dir, 'program')

    if (spec.compile) {
      const [bin, args] = spec.compile(tool.bin, srcPath, exePath)
      const compiled = await runProcess(bin, args, { cwd: dir, timeoutMs: COMPILE_TIMEOUT_MS })
      if (compiled.timedOut) {
        return fail('compile', 'The compiler took too long and was stopped.', { toolchain: tool.version })
      }
      if (compiled.code !== 0) {
        return {
          ok: false,
          stage: 'compile',
          reason: 'It did not compile.',
          stdout: scrubPaths(compiled.stdout, dir, spec.source),
          // Compiler diagnostics are the most useful thing on the screen when
          // this happens, so they are passed through whole — only the scratch
          // directory is taken out of them.
          stderr: scrubPaths(compiled.stderr, dir, spec.source),
          exitCode: compiled.code,
          timedOut: false,
          truncated: !!compiled.truncated,
          ms: Date.now() - started,
          toolchain: tool.version,
        }
      }
    }

    const [runBin, runArgs] = spec.compile
      ? spec.run(exePath)
      : spec.run(exePath, tool.bin, srcPath)
    const ran = await runProcess(runBin, runArgs, { cwd: dir, stdin, timeoutMs: RUN_TIMEOUT_MS })

    return {
      ok: ran.code === 0 && !ran.timedOut,
      stage: 'run',
      reason: ran.timedOut
        ? `It was still running after ${RUN_TIMEOUT_MS / 1000} seconds and was stopped. An infinite loop is the usual cause.`
        : undefined,
      stdout: scrubPaths(ran.stdout, dir, spec.source),
      stderr: scrubPaths(ran.stderr, dir, spec.source),
      exitCode: ran.code,
      timedOut: ran.timedOut,
      truncated: !!ran.truncated,
      ms: Date.now() - started,
      toolchain: tool.version,
    }
  } catch (err) {
    log('run failed:', err?.message ?? err)
    return fail('run', String(err?.message ?? err))
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      /* the OS will clear its own temp directory */
    }
  }
}
