import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TRACKS } from '@/learn/full'
import { prepare } from './speech'

/** Names of maths commands, none of them an English word: heard aloud, one means a command was not read. */
const COMMANDS = [
  'mathbb', 'mathrm', 'mathbf', 'mathcal', 'mathtt', 'mathfrak', 'leftarrow', 'rightarrow', 'Longrightarrow', 'longrightarrow',
  'Leftrightarrow', 'otimes', 'oplus', 'odot', 'bigl', 'bigr', 'Bigl', 'Bigr', 'lceil', 'rceil', 'lfloor', 'rfloor', 'langle',
  'rangle', 'varepsilon', 'varnothing', 'varphi', 'vartheta', 'succeq', 'preceq', 'underbrace', 'overbrace', 'widetilde', 'widehat',
  'xrightarrow', 'iint', 'iiint', 'oiint', 'binom', 'bmod', 'mapsto', 'subseteq', 'dddot', 'lesssim', 'gtrsim', 'emptyset', 'tfrac',
  'dfrac', 'cdot', 'ldots', 'cdots', 'infty', 'nabla', 'boldsymbol', 'operatorname', 'displaystyle', 'textstyle',
]

describe('what every lesson sounds like', () => {
  it('never says the name of a maths command', () => {
    const texts: [string, string][] = []
    for (const t of TRACKS) for (const l of t.lessons) texts.push([l.id, `${l.teach}\n\n${l.task}\n\n${l.hints.join('\n\n')}`])
    const root = 'src/curriculum/lessons'
    for (const dir of readdirSync(root, { withFileTypes: true }))
      if (dir.isDirectory())
        for (const f of readdirSync(join(root, dir.name)))
          if (f.endsWith('.md')) texts.push([`${dir.name}/${f}`, readFileSync(join(root, dir.name, f), 'utf8').replace(/^---[\s\S]*?---\n/, '')])
    const heard = new RegExp(`(?<![\\w-])(${COMMANDS.join('|')})(?![\\w-])`)
    const leaks = texts.flatMap(([id, md]) =>
      [...prepare(md).text.matchAll(new RegExp(heard.source, 'g'))]
        // A lesson may say the name itself ("the triangle is called nabla") or use it as code (`stats.binom`).
        .filter((m) => !new RegExp(`(?<!\\\\)\\b${m[1]}\\b`).test(md))
        .map((m) => `${id}: ${m[1]}`),
    )
    expect(leaks).toEqual([])
  }, 300_000)
})
