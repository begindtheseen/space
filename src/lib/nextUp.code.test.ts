import { describe, expect, it } from 'vitest'
import { codePick } from './nextUp'
import { newLearnerState as initialState } from '@/engine/state'
import { TRACKS, tracksFor } from '@/learn'

describe('codePick', () => {
  it('starts at the very first lesson when she has not begun', () => {
    const pick = codePick(initialState())!
    expect(pick.kind).toBe('learn-code')
    expect(pick.href).toBe(`/learn/${TRACKS[0]!.lessons[0]!.id}`)
  })

  it('carries on in the language she worked in last, at the next lesson', () => {
    const py = tracksFor('python')[0]!
    const s = initialState()
    s.learn = { [py.lessons[0]!.id]: '2026-09-01T10:00:00Z', [py.lessons[1]!.id]: '2026-09-02T10:00:00Z' }
    const pick = codePick(s)!
    expect(pick.href).toBe(`/learn/${py.lessons[2]!.id}`)
    // Every lesson of every Python course is part of the block.
    for (const t of tracksFor('python')) for (const l of t.lessons) expect(pick.also).toContain(`/learn/${l.id}`)
    expect(pick.also).not.toContain(`/learn/${tracksFor('cpp')[0]!.lessons[0]!.id}`)
  })

  it('points at the lesson she asked for', () => {
    const js = tracksFor('cpp')[0]!
    expect(codePick(initialState(), js.lessons[3]!.id)!.href).toBe(`/learn/${js.lessons[3]!.id}`)
  })
})
