import { describe, expect, it } from 'vitest'
import { newLearnerState } from '@/engine/state'
import { notesFor } from './Notifications'

const base = () => newLearnerState()

describe('notesFor', () => {
  it('says nothing when nothing is waiting', () => {
    expect(notesFor(base(), undefined)).toEqual([])
  })

  const resume = (progress: number) => ({
    kind: 'lesson' as const,
    path: '/module/t0_m01?lesson=l03',
    label: 'Two-Body Problem',
    detail: 'Lesson 3 of 9 · 60% through',
    progress,
    at: '2026-01-01T00:00:00.000Z',
  })

  it('does not nag about a lesson barely opened', () => {
    // Opened and closed at the top is not started; a notice for it is noise.
    const s = base()
    s.resume = resume(0.01)
    expect(notesFor(s, undefined).some((n) => n.id === 'resume')).toBe(false)
  })

  it('links back to the exact place, not the top of the module', () => {
    const s = base()
    s.resume = resume(0.6)
    const note = notesFor(s, undefined).find((n) => n.id === 'resume')
    expect(note?.href).toBe('/module/t0_m01?lesson=l03')
    expect(note?.detail).toBe('Lesson 3 of 9 · 60% through')
  })

  it('puts reviews first, because they are the thing that decays', () => {
    const s = base()
    const notes = notesFor(s, 'ready')
    const ids = notes.map((n) => n.id)
    if (ids.includes('due')) expect(ids[0]).toBe('due')
  })

  it('every note links somewhere', () => {
    for (const n of notesFor(base(), 'available')) {
      expect(n.href, n.id).toMatch(/^\//)
      expect(n.title.length, n.id).toBeGreaterThan(0)
    }
  })
})
