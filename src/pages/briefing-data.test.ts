import { describe, expect, it } from 'vitest'
import { MODULES } from '@/curriculum'
import { lessonsFor } from '@/curriculum'
import { BASECAMP_ID, BRIDGES, PACES, bridges, missionStages } from './briefing-data'

describe('the mission briefing', () => {
  it('starts the route at Basecamp and ends at the capstone', () => {
    const stages = missionStages()
    expect(stages[0]!.modules.map((m) => m.id)).toEqual([BASECAMP_ID])
    expect(stages.at(-1)!.modules.map((m) => m.id)).toContain('t7_m48_capstone')
  })

  it('puts every Foundations and GNC module on the route exactly once', () => {
    const onRoute = missionStages().flatMap((s) => s.modules.map((m) => m.id))
    const expected = MODULES.filter((m) => m.track === 'foundations' || m.track === 'gnc').map((m) => m.id)
    expect(onRoute.sort()).toEqual(expected.sort())
  })

  it('links every coding skill to a module that exists', () => {
    expect(bridges()).toHaveLength(BRIDGES.length)
  })

  it('opens Basecamp on a lesson that exists', () => {
    expect(lessonsFor(BASECAMP_ID).length).toBeGreaterThan(0)
  })

  it('offers paces from gentle to full, lightest first', () => {
    const minutes = PACES.map((p) => p.minutes)
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b))
  })
})
