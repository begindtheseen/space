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

  const posting = (id: string) => ({
    id,
    title: 'Technician, Temporary',
    location: 'Hawthorne, CA',
    url: 'https://example.invalid/x',
  })

  it('notices a posting she has not seen, and ranks it first', () => {
    // A review can be done tomorrow; a temporary posting may be gone.
    const s = base()
    const notes = notesFor(s, 'ready', [posting('a'), posting('b')] as never)
    expect(notes[0]?.id).toBe('jobs')
    expect(notes[0]?.title).toContain('2 new temporary openings')
  })

  it('stays quiet about postings already seen', () => {
    const s = base()
    s.jobsSeen = { a: '2026-01-01T00:00:00.000Z' }
    const notes = notesFor(s, undefined, [posting('a')] as never)
    expect(notes.some((n) => n.id === 'jobs')).toBe(false)
  })

  it('every note links somewhere', () => {
    for (const n of notesFor(base(), 'available')) {
      expect(n.href, n.id).toMatch(/^\//)
      expect(n.title.length, n.id).toBeGreaterThan(0)
    }
  })

  it('says nothing while an update is found or on its way, since it downloads itself', () => {
    for (const status of ['available', 'downloading', 'checking'] as const) {
      expect(notesFor(base(), { status }).some((n) => n.id === 'update' || n.id === 'shell')).toBe(false)
    }
  })

  const on = (update: Parameters<typeof notesFor>[1]) => notesFor(base(), update, [], new Date(), true)

  it('says nothing while an update is on its way on the desktop either', () => {
    for (const status of ['available', 'downloading', 'checking'] as const) {
      expect(on({ status }).some((n) => n.id === 'update' || n.id === 'shell')).toBe(false)
    }
    expect(on({ status: 'shell-required', shellUpdate: { status: 'downloading', version: '2.0.0' } }).some((n) => n.id === 'shell')).toBe(false)
  })

  it('asks for a restart only when the update will not open by itself next launch', () => {
    const staged = on({ status: 'ready', staged: true }).find((n) => n.id === 'update')
    expect(staged?.title).toBe('ORBIT has updated')
    expect(staged?.urgent).toBeFalsy()
    const waiting = on({ status: 'ready' }).find((n) => n.id === 'update')
    expect(waiting?.title).toBe('Restart to finish updating')
    expect(waiting?.urgent).toBe(true)
  })

  it('tells her a downloaded app goes in on quit when the shell does that', () => {
    const auto = on({ status: 'shell-required', autoUpdate: true, shellUpdate: { status: 'ready', version: '2.0.0' } }).find((n) => n.id === 'shell')
    expect(auto?.detail).toMatch(/when you quit/)
    expect(auto?.urgent).toBeFalsy()
    const manual = on({ status: 'shell-required', shellUpdate: { status: 'manual', version: '2.0.0' } }).find((n) => n.id === 'shell')
    expect(manual?.title).toBe('A newer ORBIT app is available')
    expect(manual?.urgent).toBe(true)
  })
})
