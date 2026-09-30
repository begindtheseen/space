/* The code tutor, measured on real runs: problems from every Python, SQL and C++ course, each with a
   realistic mistake made in its solution (tutorMistakes.ts), run for real (runLocal.ts: CPython, clang,
   sql.js) and graded. Every failed run must have the tutor call it what it is and name the thing that is
   wrong, for every kind of mistake. A sample of the problems, to keep the unit tests quick: the whole
   curriculum is the same test with CODE_TUTOR_EVERY=1, and CODE_TUTOR_REPORT=file lists what it said. */
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
  const below = [...stats].filter(([, s]) => s.ok < s.n).map(([k, s]) => `${k}: ${s.n - s.ok} of ${s.n} missed`)
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
