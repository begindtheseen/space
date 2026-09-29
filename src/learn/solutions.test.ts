/* Every graded problem in every course, run for real: the reference solution must pass every check, and
   the starter must not (the problem asks for work). Lessons, practice problems and gate problems alike.
   How each language runs is in runLocal.ts. A problem that passes here passes in the app. */
import { afterAll, describe, expect, it } from 'vitest'
import { TRACKS } from './index'
import { cleanUp, unitCount, unsolvable } from './runLocal'

afterAll(cleanUp)

describe('every problem can be solved, and needs solving', () => {
  // LEARN_ONLY=python-intermediate,sql checks just those courses: what a writer runs while working on one.
  const only = process.env.LEARN_ONLY?.split(',').map((s) => s.trim()).filter(Boolean)
  const tracks = TRACKS.filter((t) => !only || only.includes(t.id))

  it(`the reference solution passes every check and the starter does not (${unitCount(tracks)} problems)`, async () => {
    expect(await unsolvable(tracks)).toEqual([])
  }, 3_600_000)
})
