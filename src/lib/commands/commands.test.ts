/* Every command the Terminal and Git courses have her type is in the
   reference Explain draws on, and every entry is complete. */
import { readFileSync, globSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COMMANDS, commandByName, matchCommand } from './index'

/** Syntax a solution line can start with that is not a command of its own. */
const SYNTAX = new Set(['do', 'done', 'then', 'fi', 'else', 'elif', 'esac', 'in', '{', '}', '(', ')'])

/** The commands a course's solutions and prompt lines run: `git commit`, not `git`, where there is a subcommand. */
function taughtCommands(): Map<string, string> {
  const found = new Map<string, string>()
  for (const file of globSync('src/learn/tracks/{bash,git}*.txt')) {
    const text = readFileSync(file, 'utf8')
    const lines: string[] = []
    for (const m of text.matchAll(/--- solution\n([\s\S]*?)(?=\n--- |\n=== |$)/g)) lines.push(...m[1]!.split('\n'))
    for (const m of text.matchAll(/^\s*~[\w/.-]*\s*\$ (.+)$/gm)) lines.push(m[1]!)
    const defined = new Set([...text.matchAll(/^\s*([a-z_][\w-]*)\s*\(\)\s*\{/gm)].map((m) => m[1]!))
    for (const line of lines) {
      if (/^\s*#/.test(line)) continue
      for (const seg of line.split(/\|\||&&|\||;|\$\(|`/)) {
        const words = seg.trim().replace(/^(?:sudo|!)\s+/, '').split(/\s+/)
        let w = words[0] ?? ''
        if (!/^[a-z[][\w.+-]*$/.test(w) || /=/.test(w) || SYNTAX.has(w) || defined.has(w)) continue
        // A script run by name (`hi.sh`) and `name = value` (the classic spacing mistake a lesson shows on purpose) are not commands.
        if ((w.includes('.') && !commandByName(w)) || words[1] === '=') continue
        if (w === 'git' && /^[a-z][a-z-]*$/.test(words[1] ?? '')) w = `git ${words[1]}`
        if (!found.has(w)) found.set(w, file.replace(/^.*\//, ''))
      }
    }
  }
  return found
}

describe('the command reference', () => {
  it('covers every command the Terminal and Git courses have her run', () => {
    const missing = [...taughtCommands()].filter(([name]) => !commandByName(name)).map(([n, f]) => `${n} (${f})`)
    expect(missing, 'add these to src/lib/commands').toEqual([])
  })

  it('has one entry per command, each complete', () => {
    const names = COMMANDS.flatMap((c) => [c.name, ...(c.aliases ?? [])])
    expect(names.filter((n, i) => names.indexOf(n) !== i), 'names listed twice').toEqual([])
    for (const c of COMMANDS) {
      expect(c.official.trim().length, `${c.name}: official`).toBeGreaterThan(5)
      expect(c.source.trim().length, `${c.name}: source`).toBeGreaterThan(3)
      expect(c.when.trim().length, `${c.name}: when`).toBeGreaterThan(20)
      expect(c.example.says.trim().length, `${c.name}: example`).toBeGreaterThan(10)
      const starts = [c.name, ...(c.aliases ?? [])].some((n) => c.example.command.replace(/^sudo /, '').startsWith(n))
      expect(starts || /[|;&(]|\bif\b|\bfor\b|\bwhile\b/.test(c.example.command), `${c.name}: example uses it: ${c.example.command}`).toBe(true)
      for (const n of c.seeAlso ?? []) expect(commandByName(n), `${c.name}: see also ${n}`).toBeTruthy()
    }
  })
})

describe('finding the command in a highlight', () => {
  it('finds the longest command and the flags used', () => {
    const cp = matchCommand('cp -r notes backup', true)
    expect(cp?.ref.name).toBe('cp')
    expect(cp?.flags.map(([f]) => f)).toContain('-r')
    expect(matchCommand('git commit -m "first"', true)?.ref.name).toBe('git commit')
    expect(matchCommand('~/project $ ls', true)?.ref.name).toBe('ls')
  })

  it('reads English words in a sentence as words', () => {
    expect(matchCommand('sort the list', false)).toBeNull()
    expect(matchCommand('find', false)).toBeNull()
    expect(matchCommand('sort', true)?.ref.name).toBe('sort')
    expect(matchCommand('mkdir', false)?.ref.name).toBe('mkdir')
    expect(matchCommand('git status', false)?.ref.name).toBe('git status')
  })
})
