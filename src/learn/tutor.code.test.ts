/* The code tutor, measured on real runs: problems from every Python, SQL and C++ course, each with a
   realistic mistake made in its solution (tutorMistakes.ts), run for real (runLocal.ts: CPython, clang,
   sql.js) and graded. For each kind of mistake, the share of failed runs where the tutor calls it what it
   is and names the thing that is wrong. A floor for each, a little under what it does now, so it can only
   get better. A sample of the problems, to keep the unit tests quick: the whole curriculum is the same
   test with CODE_TUTOR_EVERY=1. */
import { appendFileSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { TRACKS } from './full'
import { buildProgram, gradeRun } from './grade'
import { gradedUnits } from './practice'
import { cleanUp, pool, run } from './runLocal'
import { tutorLine } from './tutor'
import { codeMistakesFor } from './tutorMistakes'
import type { LearnLang } from './types'

afterAll(cleanUp)

const FLOOR: Record<string, number> = {
  'py-colon': 0.97, 'py-indent': 0.97, 'py-eq': 0.9, 'py-div': 0.8, 'py-fstring': 0.8, 'py-name': 0.82, 'py-print-case': 0.7,
  'py-return-in-if': 0.9, 'py-return-in-loop': 0.9, 'py-return-print': 0.9,
  'sql-column': 0.95, 'sql-columns': 0.8, 'sql-desc': 0.85, 'sql-group': 0.9, 'sql-join-on': 0.9, 'sql-null': 0.85, 'sql-quotes': 0.85,
  'sql-table': 0.95, 'sql-where': 0.9,
  'cpp-assign-if': 0.9, 'cpp-bound': 0.9, 'cpp-name': 0.8, 'cpp-semicolon': 0.95,
}

async function measure(lang: LearnLang, every: number) {
  const step = Number(process.env.CODE_TUTOR_EVERY ?? every)
  const units = TRACKS.filter((t) => t.lang === lang).flatMap((t) => t.lessons.flatMap(gradedUnits)).filter((_, i) => i % step === 0)
  const jobs = units.flatMap((u) => codeMistakesFor(u).map((m) => ({ u, m })))
  const stats = new Map<string, { n: number; ok: number }>()
  const misses: string[] = []
  await pool(jobs, 4, async ({ u, m }) => {
    const r = await run(u, m.code)
    const g = gradeRun(u, m.code, r)
    if (g.passed) return
    const t = tutorLine({ lang: u.lang, task: u.task, hints: u.hints, solution: u.solution, starter: u.starter, code: m.code, program: buildProgram(u, m.code), run: g, checks: u.checks, schema: u.schema, attempt: 1, said: [] })
    const st = stats.get(m.name) ?? { n: 0, ok: 0 }
    st.n++
    if (t && m.expect.includes(t.memory.kind) && (!m.mention || m.mention.test(t.text))) st.ok++
    else misses.push(`[${m.name}] ${u.id}: ${t?.text ?? '(nothing said)'}`)
    stats.set(m.name, st)
  })
  const below = [...stats]
    .filter(([k, s]) => s.ok / s.n < (FLOOR[k] ?? 0))
    .map(([k, s]) => `${k}: ${((100 * s.ok) / s.n).toFixed(1)}% of ${s.n} (floor ${(FLOOR[k] ?? 0) * 100}%)`)
  return { below, runs: [...stats.values()].reduce((n, s) => n + s.n, 0), stats, misses }
}

describe('the code tutor names the mistake that was made, on real runs', () => {
  for (const [lang, every, least] of [['python', 24, 300], ['sql', 2, 700], ['cpp', 48, 25]] as const)
    it(`${lang}`, async () => {
      const r = await measure(lang, every)
      if (process.env.CODE_TUTOR_REPORT)
        appendFileSync(process.env.CODE_TUTOR_REPORT, `== ${lang}\n` + [...r.stats].sort().map(([k, s]) => `${k.padEnd(20)} ${String(s.n).padStart(4)}  ${((100 * s.ok) / s.n).toFixed(0)}%`).join('\n') + `\n${r.misses.join('\n')}\n`)
      expect(r.below).toEqual([])
      expect(r.runs).toBeGreaterThan(least)
    }, 600_000)
})
