import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  REMOTE_NOTE_IOS,
  fromCompilerExplorer,
  fromWandbox,
  inTabCppUnavailable,
  pickCeCompiler,
  pickWandboxCompiler,
  runCppRemote,
} from './cppRemote'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'

describe('C++ on devices that cannot compile it in the tab', () => {
  it('knows an iPhone or iPad, including an iPad asking for the desktop site', () => {
    expect(inTabCppUnavailable({ userAgent: IPHONE })).toBe(true)
    expect(inTabCppUnavailable({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' })).toBe(true)
    expect(inTabCppUnavailable({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 })).toBe(true)
    expect(inTabCppUnavailable({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 })).toBe(false)
    expect(inTabCppUnavailable({ userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/140 Mobile' })).toBe(false)
  })

  it('picks the newest released clang that can run programs', () => {
    expect(
      pickCeCompiler([
        { id: 'clang_trunk', semver: '(trunk)' },
        { id: 'clang1810', semver: '18.1.0', supportsExecute: true },
        { id: 'clang2010', semver: '20.1.0', supportsExecute: true },
        { id: 'clang2110', semver: '21.1.0', supportsExecute: false },
        { id: 'g142', semver: '14.2' },
      ]),
    ).toBe('clang2010')
    expect(pickWandboxCompiler([{ name: 'clang-head', language: 'C++', version: '22.0.0git' }, { name: 'clang-19.1.0', language: 'C++', version: '19.1.0' }, { name: 'clang-20.1.0', language: 'C++', version: '20.1.0' }])).toBe('clang-20.1.0')
  })

  it('reads Compiler Explorer: a compile error, a run, a crash, a timeout', () => {
    const bad = fromCompilerExplorer({ didExecute: false, buildResult: { code: 1, stderr: [{ text: "<source>:1:20: error: use of undeclared identifier 'x'" }] } })
    expect(bad.error).toMatch(/^It did not compile:\n\n<source>:1:20: error/)
    const ok = fromCompilerExplorer({ didExecute: true, code: 0, stdout: [{ text: 'hello' }, { text: 'world' }], stderr: [], buildResult: { code: 0 } })
    expect([ok.stdout, ok.error, ok.result]).toEqual(['hello\nworld\n', null, null])
    // The shape without executorRequest: the run is nested.
    expect(fromCompilerExplorer({ execResult: { didExecute: true, code: 3, stdout: [{ text: 'x' }], buildResult: { code: 0 } } }).result).toBe('exit code 3')
    expect(fromCompilerExplorer({ didExecute: true, timedOut: true, buildResult: { code: 0 } }).error).toMatch(/Still running/)
  })

  it('reads Wandbox: a compile error, a run, a crash', () => {
    expect(fromWandbox({ compiler_error: 'prog.cc:1:20: error: boom' }).error).toMatch(/^It did not compile/)
    const ok = fromWandbox({ status: '0', program_output: '42\n' })
    expect([ok.stdout, ok.error, ok.result]).toEqual(['42\n', null, null])
    expect(fromWandbox({ status: '1', program_output: '' }).result).toBe('exit code 1')
    expect(fromWandbox({ signal: 'Segmentation fault' }).error).toMatch(/crashed/)
  })
})

describe('compiling on a service', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends the code and its input to Compiler Explorer, with the same flags as in the tab, and says so', async () => {
    const calls: { url: string; body?: Record<string, unknown> }[] = []
    vi.stubGlobal('fetch', async (url: string, init?: { body?: string }) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined })
      if (url.includes('/compilers/')) return new Response(JSON.stringify([{ id: 'clang2010', semver: '20.1.0', supportsExecute: true }]))
      return new Response(JSON.stringify({ didExecute: true, code: 0, stdout: [{ text: 'sum 5' }], buildResult: { code: 0 } }))
    })
    const out = await runCppRemote('int main(){}', { stdin: '2 3', note: REMOTE_NOTE_IOS })
    expect(out.stdout).toBe('sum 5\n')
    expect(out.stderr).toContain('godbolt.org')
    const compile = calls.find((c) => c.url.endsWith('/compiler/clang2010/compile'))!
    const options = compile.body!.options as { userArguments: string; executeParameters: { stdin: string } }
    expect(options.userArguments).toContain('-std=c++20')
    expect(options.userArguments).toContain('-fno-exceptions')
    expect(options.executeParameters.stdin).toBe('2 3')
  })

  it('falls back to Wandbox when Compiler Explorer cannot be reached, and says which one ran it', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('godbolt')) throw new TypeError('Failed to fetch')
      if (url.endsWith('/list.json')) return new Response(JSON.stringify([{ name: 'clang-20.1.0', language: 'C++', version: '20.1.0' }]))
      return new Response(JSON.stringify({ status: '0', program_output: 'ok\n' }))
    })
    const out = await runCppRemote('int main(){}', { note: REMOTE_NOTE_IOS })
    expect(out.stdout).toBe('ok\n')
    expect(out.stderr).toContain('wandbox.org')
  })

  it('says plainly when no service can be reached', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch')
    })
    const out = await runCppRemote('int main(){}', { note: REMOTE_NOTE_IOS })
    expect(out.error).toMatch(/could not be reached/)
  })
})
