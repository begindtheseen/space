import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseLesson } from '@/curriculum/lessons/parse'
import { LESSON_MANIFEST } from '@/curriculum/lessons/manifest'
import { alternate, buildAskContext, buildRequest, lessonWindow, passagesOf, pickPassages, proseOf, terms, type LibraryLesson } from './askAi'

const dir = path.resolve(__dirname, '../curriculum/lessons')
function lesson(moduleId: string, lessonId: string, moduleTitle = moduleId): LibraryLesson {
  const meta = LESSON_MANIFEST[moduleId]!.find((l) => l.id === lessonId)!
  const body = parseLesson(fs.readFileSync(path.join(dir, meta.file), 'utf8'), meta.file).body
  return { moduleId, moduleTitle, lessonId, title: meta.title, body }
}
const basecamp = (LESSON_MANIFEST.t0_m00_basecamp ?? []).map((l) => lesson('t0_m00_basecamp', l.id, 'Basecamp'))

describe('what gets matched on', () => {
  it('keeps the meaningful words and drops the glue', () => {
    expect(terms('The ratios of the sides are equal')).toEqual(['ratio', 'side', 'equal'])
    expect(terms("It's a 3.5 metre run")).toContain('3.5')
  })

  it('reads a lesson as prose: no note blocks, no marks, no code', () => {
    const md = 'A [[ratio|r]] compares.\n\n```python\nprint(1)\n```\n\n## Summary\n\nDone.\n\n::: context r Ratio\nTwo amounts side by side.\n:::\n'
    const prose = proseOf(md)
    expect(prose).toContain('A ratio compares.')
    expect(prose).not.toContain('print(1)')
    expect(prose).not.toContain('Two amounts side by side')
    expect(prose).not.toContain('[[')
  })

  it('cuts real lessons into passages under their headings', () => {
    expect(basecamp.length).toBeGreaterThan(8)
    for (const l of basecamp) {
      const ps = passagesOf(l)
      expect(ps.length, l.lessonId).toBeGreaterThan(2)
      for (const p of ps) expect(p.length, l.lessonId).toBeLessThan(1100)
    }
  })
})

describe('picking passages from what she has read', () => {
  it('finds the lesson that taught the idea she highlighted', () => {
    const picks = pickPassages({ selection: 'denominator', paragraph: 'Add the numerators when the denominators match.' }, basecamp)
    expect(picks.length).toBeGreaterThan(0)
    expect(picks[0]!.lesson.lessonId).toMatch(/fraction/)
  })

  it('finds Pythagoras for a right-triangle question', () => {
    const picks = pickPassages({ selection: 'hypotenuse', paragraph: 'The hypotenuse is the longest side of a right triangle.' }, basecamp)
    expect(picks[0]!.lesson.lessonId).toMatch(/pythagoras/)
  })

  it('takes no more than two passages from any one lesson', () => {
    const picks = pickPassages({ selection: 'fraction numerator denominator', paragraph: 'fractions' }, basecamp, 8)
    const per = new Map<string, number>()
    for (const p of picks) per.set(p.lesson.lessonId, (per.get(p.lesson.lessonId) ?? 0) + 1)
    for (const n of per.values()) expect(n).toBeLessThanOrEqual(2)
  })

  it('sends nothing rather than noise when nothing matches', () => {
    expect(pickPassages({ selection: 'zzqx', paragraph: 'qqzx' }, basecamp)).toEqual([])
    expect(pickPassages({ selection: 'ratio', paragraph: '' }, [])).toEqual([])
  })
})

describe('the question', () => {
  const here = basecamp.find((l) => /speed/.test(l.lessonId))!
  const library = basecamp.filter((l) => l !== here)
  const seed = { selection: 'average speed', paragraph: 'Average speed is the total distance divided by the total time.' }

  it('carries the lesson, the passages, the paragraph and the highlight, and names its sources', () => {
    const ctx = buildAskContext({ seed, here, library })
    expect(ctx.question).toContain('<highlight>\naverage speed\n</highlight>')
    expect(ctx.question).toContain(`title="${here.title}"`)
    expect(ctx.question).toContain('<learned>')
    expect(ctx.sources.length).toBeGreaterThan(0)
    for (const s of ctx.sources) expect(library.some((l) => l.lessonId === s.lessonId)).toBe(true)
    expect(ctx.system).toMatch(/only the lesson and the passages/i)
  })

  it('never offers the current lesson as something already learned', () => {
    const ctx = buildAskContext({ seed, here, library: [...library, here] })
    expect(ctx.sources.some((s) => s.lessonId === here.lessonId)).toBe(false)
  })

  it('says so when she has read nothing yet', () => {
    const ctx = buildAskContext({ seed, here, library: [] })
    expect(ctx.question).toMatch(/one of the first lessons/)
    expect(ctx.sources).toEqual([])
  })

  it('keeps a long lesson to a window around the highlight', () => {
    const long = `${'Filler sentence here. '.repeat(1500)}\n\nThe special paragraph.\n\n${'More filler. '.repeat(1500)}`
    const win = lessonWindow(long, 'The special paragraph.', 4000)
    expect(win.length).toBeLessThan(4100)
    expect(win).toContain('The special paragraph.')
  })

  it('builds follow-ups onto the first question, and joins her turns after a stopped answer', () => {
    const ctx = buildAskContext({ seed, here, library })
    const after = buildRequest('ask-b', ctx, [
      { role: 'assistant', content: 'It is distance over time.' },
      { role: 'user', content: 'Why divide?' },
    ])
    expect(after.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])
    const stopped = buildRequest('ask-c', ctx, [{ role: 'user', content: 'Why divide?' }])
    expect(stopped.messages).toHaveLength(1)
    expect(stopped.messages[0]!.content).toMatch(/Why divide\?$/)
  })

  it('alternates turns and never ends on an answer', () => {
    expect(
      alternate([
        { role: 'user', content: 'a' },
        { role: 'user', content: 'b' },
        { role: 'assistant', content: '' },
        { role: 'assistant', content: 'c' },
      ]),
    ).toEqual([{ role: 'user', content: 'a\n\nb' }])
  })
})
