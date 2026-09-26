import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseLesson } from '@/curriculum/lessons/parse'
import { LESSON_MANIFEST } from '@/curriculum/lessons/manifest'
import { notesOf, type IndexedNote } from '@/curriculum/lessons/notesIndex'
import { matchCards, passagesOf, pickPassages, proseOf, rankNotes, snippet, terms, type LibraryLesson } from './explain'

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

const allNotes: IndexedNote[] = fs
  .readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => fs.readdirSync(path.join(dir, d.name)).filter((f) => f.endsWith('.md')).flatMap((f) => notesOf(d.name, fs.readFileSync(path.join(dir, d.name, f), 'utf8'))))

describe('the notes index', () => {
  it('finds every note in the course, with its lesson and the phrases that open it', () => {
    expect(allNotes.length).toBeGreaterThan(300)
    for (const n of allNotes) {
      expect(LESSON_MANIFEST[n.m]?.some((l) => l.id === n.l), `${n.m}/${n.l}`).toBe(true)
      expect(n.body.length, n.id).toBeGreaterThan(20)
    }
    expect(allNotes.filter((n) => n.phrases.length).length / allNotes.length).toBeGreaterThan(0.95)
  })

  it('reads one lesson the way the app does', () => {
    const md = '---\nid: l01-x\ntitle: X\nminutes: 1\ncovers:\n  - x\n---\n\nA [[ratio|r]] and a [[Ratio|r]].\n\n## Summary\n\nDone.\n\n::: context r What a ratio is\nTwo amounts side by side.\n:::\n'
    expect(notesOf('mod', md)).toEqual([{ m: 'mod', l: 'l01-x', id: 'r', title: 'What a ratio is', body: 'Two amounts side by side.', phrases: ['ratio', 'Ratio'] }])
  })
})

describe('explaining a highlight from the notes', () => {
  const here = { moduleId: 't0_m00_basecamp', lessonId: 'l12-speed-rates-and-averages' }
  const none = new Set<string>()

  it('puts the note named for the highlighted words first', () => {
    const top = allNotes.find((n) => n.phrases.length && n.m === 't0_m00_basecamp')!
    const ranked = rankNotes({ selection: top.phrases[0]!, paragraph: '' }, allNotes, { here, read: none })
    expect(ranked[0]!.note.title.toLowerCase()).toBe(top.title.toLowerCase())
  })

  it('prefers the lesson she is in, then lessons she has read', () => {
    const phrase = 'denominator'
    const withIt = allNotes.filter((n) => n.phrases.some((p) => terms(p).includes('denominator')))
    if (withIt.length < 2) return
    const target = withIt[withIt.length - 1]!
    const ranked = rankNotes({ selection: phrase, paragraph: '' }, allNotes, { here: { moduleId: target.m, lessonId: target.l }, read: none })
    expect(ranked[0]!.where).toBe('here')
  })

  it('says nothing rather than something unrelated', () => {
    expect(rankNotes({ selection: 'zzqx blorp', paragraph: '' }, allNotes, { here, read: none })).toEqual([])
    expect(rankNotes({ selection: 'the', paragraph: '' }, allNotes, { here, read: none })).toEqual([])
  })

  it('drops a second note with the same title', () => {
    const notes: IndexedNote[] = [
      { m: 'a', l: 'l1', id: 'x', title: 'What a ratio is', body: 'One.', phrases: ['ratio'] },
      { m: 'b', l: 'l2', id: 'x', title: 'What a ratio is', body: 'Two.', phrases: ['ratio'] },
    ]
    expect(rankNotes({ selection: 'ratio', paragraph: '' }, notes, { here, read: none })).toHaveLength(1)
  })

  it('finds a flashcard that defines the words, and not one that merely mentions one of them', () => {
    const cards = [
      { moduleId: 'm', front: 'What is a ratio?', back: 'Two amounts compared.' },
      { moduleId: 'm', front: 'Ratio test for series convergence and the limit comparison test', back: '…' },
      { moduleId: 'm', front: 'Speed', back: 'Distance per time.' },
    ]
    expect(matchCards({ selection: 'ratio', paragraph: '' }, cards).map((c) => c.back)).toEqual(['Two amounts compared.'])
    expect(matchCards({ selection: 'speed', paragraph: '' }, cards)[0]!.back).toBe('Distance per time.')
  })

  it('quotes a passage around the highlighted words', () => {
    const text = `${'Filler words here. '.repeat(40)}The hypotenuse is the longest side. ${'More filler. '.repeat(40)}`
    const q = snippet(text, { selection: 'hypotenuse', paragraph: '' })
    expect(q).toContain('hypotenuse')
    expect(q.length).toBeLessThan(340)
  })
})
