import { describe, expect, it } from 'vitest'
import { MODULES, loadLessonBody } from '@/curriculum'
import { readingOf, type ReadingItem } from '@/learn/reading'
import { TRACKS } from '@/learn/full'
import { runnableFence } from '@/lib/practice'
import { headOf, openingFor, openingOf, readingUnits, runwaySeconds } from './ahead'
import type { SpeechUnit } from './kokoro'

const unit = (text: string, sentence: number, pause = 0.3): SpeechUnit => ({ text, sentence, pause })
const runnable = (info: string, code: string) => !!runnableFence(info, code)

describe('the opening made ahead', () => {
  it('covers about the runway in whole pieces, and at least one', () => {
    const fifteen = 'x'.repeat(150) // ten seconds at speed 1
    const units = [unit(fifteen, 0), unit(fifteen, 1), unit(fifteen, 2), unit(fifteen, 3)]
    expect(openingOf(units, 1, 12)).toHaveLength(2)
    expect(openingOf(units, 1, 5)).toHaveLength(1)
    // Faster speech says the same text in less time, so it takes more of it to cover the same seconds.
    expect(openingOf(units, 2, 12).length).toBeGreaterThan(openingOf(units, 1, 12).length)
  })

  it('is never more than a few pieces, however short they are', () => {
    const units = Array.from({ length: 20 }, (_, i) => unit('Hi.', i, 0))
    expect(openingOf(units, 1, 30)).toHaveLength(4)
  })

  it('ends at a stop written into the reading, where the reading waits anyway', () => {
    const units = [unit('Print says hello.', 0), unit('Orbitpause a.', 1), unit('And that is all.', 2)]
    expect(openingOf(units, 1, 30).map((u) => u.text)).toEqual(['Print says hello.'])
    expect(openingOf([unit('Orbitpause a.', 0), unit('After.', 1)], 1, 30)).toEqual([])
  })

  it('is longer on a device that makes speech slowly', () => {
    expect(runwaySeconds(0.2)).toBe(12)
    expect(runwaySeconds(1.6)).toBeGreaterThan(runwaySeconds(0.4))
    expect(runwaySeconds(10)).toBe(30)
  })
})

describe('openings named the same way the reader names them', () => {
  // The page reads the lesson with the practice still to do appended (pages/Learn.tsx useLessonReading); the
  // opening is made ahead from the lesson alone. Both must be the same pieces, or the reader would not find it.
  it('a Learn lesson opens the same whatever practice is left in it', () => {
    let checked = 0
    for (const track of TRACKS) {
      for (const l of track.lessons) {
        if (l.gate) continue
        const items: ReadingItem[] = [
          ...l.practice.map((ex) => ({ id: ex.id, text: `${ex.title}\n\n${ex.task}` })),
          ...(l.quiz ?? []).map((q) => ({ id: q.id, text: `${q.title}\n\n${q.ask}` })),
        ]
        const alone = openingFor(readingOf(l.teach, l.task, [], runnable).markdown, 2, 30)
        const withPractice = openingOf(readingUnits(readingOf(l.teach, l.task, items, runnable).markdown), 2, 30)
        expect(alone, `${track.id}/${l.id}`).toEqual(withPractice)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(100)
  }, 120_000)

  it('every module lesson opens with the same pieces from its head as from the whole of it', async () => {
    const lessons = MODULES.flatMap((m) => m.lessons ?? [])
    expect(lessons.length).toBeGreaterThan(500)
    const bodies = await Promise.all(lessons.map((l) => loadLessonBody(l)))
    const differ: string[] = []
    bodies.forEach((body, i) => {
      // The longest opening there is: the slowest device, at the fastest speed.
      const whole = openingOf(readingUnits(body), 2, 30)
      if (!whole.length || JSON.stringify(openingFor(body, 2, 30)) !== JSON.stringify(whole)) differ.push(lessons[i]!.file)
    })
    expect(differ).toEqual([])
  }, 300_000)

  it("works out a lesson's opening in a few milliseconds", async () => {
    const lessons = MODULES.flatMap((m) => m.lessons ?? []).slice(0, 200)
    const bodies = await Promise.all(lessons.map((l) => loadLessonBody(l)))
    const t0 = performance.now()
    for (const body of bodies) openingFor(body, 1)
    // A module's worth is worked out on the page while she reads: well under a frame per lesson.
    expect((performance.now() - t0) / bodies.length).toBeLessThan(6)
  }, 60_000)

  it('cuts only between paragraphs, never inside a code block', () => {
    const md = ['Intro.', '', '```', 'a', '', 'b', '```', '', 'After.', '', 'More.'].join('\n')
    expect(headOf(md, 5)).toBe('Intro.')
    expect(headOf(md, 9)).toBe(['Intro.', '', '```', 'a', '', 'b', '```'].join('\n'))
    expect(headOf('short', 100)).toBe('short')
  })
})
