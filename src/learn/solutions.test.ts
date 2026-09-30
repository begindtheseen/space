/* Every graded problem in every course, run for real: the reference solution must pass every check, and
   the starter must not (the problem asks for work). Lessons, practice problems and gate problems alike.
   How each language runs is in runLocal.ts. A problem that passes here passes in the app. */
import { afterAll, describe, expect, it } from 'vitest'
import { MODULE_TRACKS, TRACKS } from './full'
import { cleanUp, shardOf, unitCount, unsolvable } from './runLocal'

afterAll(cleanUp)

describe('every problem can be solved, and needs solving', () => {
  // LEARN_ONLY=python-intermediate,sql checks just those courses: what a writer runs while working on one.
  // LEARN_SHARD=2/3 checks every third problem, from the second: CI splits the run across machines.
  const only = process.env.LEARN_ONLY?.split(',').map((s) => s.trim()).filter(Boolean)
  const all = [...TRACKS, ...MODULE_TRACKS]
  const tracks = all.filter((t) => !only || only.includes(t.id))

  // A LEARN_ONLY with a typo must fail, not pass with nothing run.
  it('LEARN_ONLY names only courses and module files that exist', () => {
    const ids = new Set(all.map((t) => t.id))
    expect((only ?? []).filter((id) => !ids.has(id)), 'no such course or module file (a module file is "mod-<module id>")').toEqual([])
  })

  it('LEARN_SHARD splits the problems so that each is checked exactly once', () => {
    const items = Array.from({ length: 10 }, (_, i) => i)
    const parts = [1, 2, 3].map((k) => shardOf(`${k}/3`)(items))
    expect(parts.flat().sort((a, b) => a - b)).toEqual(items)
    expect(parts.map((p) => p.length)).toEqual([4, 3, 3])
    expect(() => shardOf('4/3')).toThrow()
  })

  it(`the reference solution passes every check and the starter does not (${unitCount(tracks)} problems)`, async () => {
    expect(await unsolvable(tracks)).toEqual([])
  }, 3_600_000)
})
