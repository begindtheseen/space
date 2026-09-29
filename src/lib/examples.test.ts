/* ============================================================================
   Every code block a lesson offers to run actually runs
   ----------------------------------------------------------------------------
   A block with a Run button that cannot compile only teaches that Run is
   broken. Each runnable C++ block must pass `g++ -fsyntax-only`, and each
   runnable Python block must parse, unless its fence says `error` (the lesson
   runs it to show that error). A piece of a program is fenced `fragment` and
   gets no Run button. REPL transcripts (`>>>`) are converted before they run,
   so they are left to the transcript tests. Skipped where g++ or python3 is
   missing.
   ========================================================================== */
import { execFileSync, spawnSync } from 'node:child_process'
import { appendFileSync, globSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fenceFlags, runnableFence } from './practice'

const has = (cmd: string) => spawnSync(cmd, ['--version']).status === 0

interface Block {
  file: string
  lang: 'cpp' | 'python'
  code: string
}

function runnableBlocks(): Block[] {
  const files = [...globSync('src/curriculum/lessons/**/*.md'), ...globSync('src/learn/tracks/*.txt')]
  const out: Block[] = []
  for (const file of files) {
    for (const m of readFileSync(file, 'utf8').matchAll(/```([^\n]*)\n([\s\S]*?)```/g)) {
      const [info, code] = [m[1]!.trim(), m[2]!]
      const lang = runnableFence(info, code)
      if ((lang !== 'cpp' && lang !== 'python') || fenceFlags(info).includes('error')) continue
      if (lang === 'python' && /^>>>/m.test(code)) continue
      out.push({ file, lang, code })
    }
  }
  return out
}

describe('runnable lesson code', () => {
  const blocks = runnableBlocks()
  const dir = mkdtempSync(join(tmpdir(), 'orbit-examples-'))
  const name = (b: Block, i: number) => join(dir, `${i}.${b.lang === 'cpp' ? 'cpp' : 'py'}`)
  blocks.forEach((b, i) => writeFileSync(name(b, i), b.code))
  // EXAMPLES_OUT=path writes every failing block in full, for fixing them in bulk.
  const where = (path: string) => {
    const b = blocks[Number(path.replace(/.*\/(\d+)\.\w+$/, '$1'))]!
    if (process.env.EXAMPLES_OUT) appendFileSync(process.env.EXAMPLES_OUT, `=== ${b.file} [${b.lang}]\n${b.code}\n`)
    return `${b.file}: ${b.code.trim().split('\n')[0]}`
  }

  it.skipIf(!has('g++'))('every runnable C++ block compiles', () => {
    const cpp = blocks.map((b, i) => (b.lang === 'cpp' ? name(b, i) : '')).filter(Boolean)
    const failed = execFileSync(
      'bash',
      ['-c', 'printf "%s\\n" "$@" | xargs -P "$(nproc)" -I{} sh -c \'g++ -std=c++20 -fsyntax-only -w "{}" 2>/dev/null || echo "{}"\'', '_', ...cpp],
      { encoding: 'utf8', maxBuffer: 1 << 24 },
    )
      .split('\n')
      .filter(Boolean)
    expect(failed.map(where), 'fence it `cpp fragment` (no Run), `cpp error` (shows an error on purpose), or fix it').toEqual([])
  }, 600_000)

  it.skipIf(!has('python3'))('every runnable Python block parses', () => {
    const py = blocks.map((b, i) => (b.lang === 'python' ? name(b, i) : '')).filter(Boolean)
    // compile() also catches `return`, `yield` and `break` outside where they belong; top-level
    // await is allowed because the in-app Python runs code that way.
    const script =
      'import sys, ast\nfor p in sys.argv[1:]:\n    try: compile(open(p).read(), p, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)\n    except SyntaxError: print(p)'
    const failed = execFileSync('python3', ['-c', script, ...py], { encoding: 'utf8', maxBuffer: 1 << 24 })
      .split('\n')
      .filter(Boolean)
    expect(failed.map(where), 'fence it `python fragment` (no Run), `python error` (shows an error on purpose), or fix it').toEqual([])
  })
})
