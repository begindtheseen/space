/* A course that is not in the app yet, checked the way a shipped one is:

     LEARN_DRAFT=path/to/draft.txt npx vitest run src/learn/draft.test.ts

   It parses the file (a whole course, header and all), holds it to every rule in validate.ts, and runs
   every problem's solution and starter for real. Several paths, comma-separated, are checked together;
   lesson ids must not clash with the shipped courses. Without LEARN_DRAFT there is nothing to check. */
import { readFileSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { TRACKS } from './full'
import { parseTrack } from './parse'
import { cleanUp, unitCount, unsolvable } from './runLocal'
import { courseProblems } from './validate'

afterAll(cleanUp)

const paths = (process.env.LEARN_DRAFT ?? '').split(',').map((p) => p.trim()).filter(Boolean)

describe.skipIf(!paths.length)('a draft course', () => {
  const drafts = paths.map((p) => parseTrack(readFileSync(p, 'utf8'), p))

  it('meets every rule a shipped course meets', () => {
    const shipped = new Set(TRACKS.flatMap((t) => t.lessons.map((l) => l.id)))
    const clashes = drafts.flatMap((d) => d.lessons.filter((l) => shipped.has(l.id)).map((l) => `${l.id}: this id is taken by a shipped lesson`))
    expect([...clashes, ...drafts.flatMap(courseProblems)]).toEqual([])
  })

  it(`every problem can be solved, and needs solving (${unitCount(drafts)} problems)`, async () => {
    expect(await unsolvable(drafts)).toEqual([])
  }, 3_600_000)
})

it('checks nothing without LEARN_DRAFT', () => expect(true).toBe(true))
