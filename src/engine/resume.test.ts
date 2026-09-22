import { describe, expect, it } from 'vitest'
import {
  coerceLive,
  coerceMedia,
  coercePlace,
  coerceResume,
  isMediaComplete,
  MAX_QUEUE,
} from './resume'
import { migrateState, newLearnerState } from './state'

describe('coerceResume', () => {
  const good = {
    kind: 'lesson',
    path: '/module/t0_m01?lesson=l03',
    label: 'Algebra & Precalculus',
    detail: 'Lesson 3 of 9',
    moduleId: 't0_m01',
    lessonId: 'l03',
    progress: 0.42,
    at: '2026-09-22T04:00:00.000Z',
  }

  it('keeps a well-formed point', () => {
    expect(coerceResume(good)).toEqual(good)
  })

  it('rejects anything without a route, a label or a time', () => {
    for (const key of ['path', 'label', 'at']) {
      expect(coerceResume({ ...good, [key]: undefined })).toBeUndefined()
    }
  })

  it('refuses a path that leaves the app', () => {
    // A resume point is followed on launch, so an off-site path here would be
    // an open redirect triggered by a restored file.
    expect(coerceResume({ ...good, path: 'https://example.com/' })).toBeUndefined()
    // Protocol-relative too: `//host` is an absolute URL, not an in-app route.
    expect(coerceResume({ ...good, path: '//example.com/' })).toBeUndefined()
  })

  it('falls back to the module kind when the kind is unknown', () => {
    expect(coerceResume({ ...good, kind: 'wat' })?.kind).toBe('module')
  })

  it('clamps progress and drops a non-numeric one', () => {
    expect(coerceResume({ ...good, progress: 4 })?.progress).toBe(1)
    expect(coerceResume({ ...good, progress: -1 })?.progress).toBe(0)
    expect(coerceResume({ ...good, progress: 'half' })?.progress).toBeUndefined()
  })

  it('returns nothing for junk', () => {
    expect(coerceResume(null)).toBeUndefined()
    expect(coerceResume('resume')).toBeUndefined()
    expect(coerceResume(42)).toBeUndefined()
  })
})

describe('coerceLive', () => {
  const good = {
    id: 's1',
    kind: 'recall',
    moduleId: 't0_m01',
    startedAt: '2026-09-22T03:00:00.000Z',
    updatedAt: '2026-09-22T04:00:00.000Z',
    queue: ['a', 'b', 'c'],
    done: ['z'],
    correct: 1,
    draft: { itemId: 'a', value: 'v = at', revealed: false, confidence: 0.6 },
  }

  it('keeps a session that still has questions left', () => {
    expect(coerceLive(good)).toEqual(good)
  })

  it('treats an empty queue as finished, not resumable', () => {
    expect(coerceLive({ ...good, queue: [] })).toBeUndefined()
  })

  it('rejects an unknown session kind', () => {
    expect(coerceLive({ ...good, kind: 'exam' })).toBeDefined()
    expect(coerceLive({ ...good, kind: 'browsing' })).toBeUndefined()
  })

  it('keeps the half-typed answer, which is the point of storing it at all', () => {
    const live = coerceLive(good)
    expect(live?.draft?.value).toBe('v = at')
    expect(live?.draft?.revealed).toBe(false)
  })

  it('drops a draft with no item to attach it to', () => {
    expect(coerceLive({ ...good, draft: { value: 'orphan' } })?.draft).toBeUndefined()
  })

  it('caps a hostile queue length', () => {
    const huge = Array.from({ length: MAX_QUEUE + 500 }, (_, i) => `i${i}`)
    expect(coerceLive({ ...good, queue: huge })?.queue).toHaveLength(MAX_QUEUE)
  })

  it('never reports more correct than were answered', () => {
    expect(coerceLive({ ...good, correct: 99 })?.correct).toBe(good.done.length)
  })
})

describe('coerceMedia', () => {
  it('keeps a position', () => {
    const m = coerceMedia({ seconds: 615, duration: 1200, at: '2026-09-22T04:00:00.000Z' })
    expect(m?.seconds).toBe(615)
    expect(m?.duration).toBe(1200)
  })

  it('needs a position to be worth storing', () => {
    expect(coerceMedia({ duration: 1200 })).toBeNull()
    expect(coerceMedia(null)).toBeNull()
  })

  it('counts a video watched past the threshold as done', () => {
    expect(isMediaComplete({ seconds: 1190, duration: 1200, at: 'x' })).toBe(true)
    expect(isMediaComplete({ seconds: 600, duration: 1200, at: 'x' })).toBe(false)
    // No duration means no way to judge, so it is only done if it says so.
    expect(isMediaComplete({ seconds: 600, at: 'x' })).toBe(false)
    expect(isMediaComplete({ seconds: 1, completed: true, at: 'x' })).toBe(true)
  })
})

describe('coercePlace', () => {
  it('keeps clamped fractions and drops the rest', () => {
    expect(coercePlace({ 'm::l': 0.5, bad: 'x', high: 2, low: -1 })).toEqual({
      'm::l': 0.5,
      high: 1,
      low: 0,
    })
  })

  it('survives junk', () => {
    expect(coercePlace(null)).toEqual({})
    expect(coercePlace('nope')).toEqual({})
  })
})

describe('state round-trip', () => {
  it('carries place-keeping through a save and load', () => {
    const s = newLearnerState()
    s.resume = {
      kind: 'lesson',
      path: '/module/t0_m01?lesson=l03',
      label: 'Algebra & Precalculus',
      at: '2026-09-22T04:00:00.000Z',
    }
    s.live = {
      id: 's1',
      kind: 'practice',
      startedAt: '2026-09-22T03:00:00.000Z',
      updatedAt: '2026-09-22T04:00:00.000Z',
      queue: ['a'],
      done: [],
      correct: 0,
      draft: { itemId: 'a', value: 'half typed', revealed: false },
    }
    s.media = { v1: { seconds: 90, duration: 600, at: '2026-09-22T04:00:00.000Z' } }
    s.place = { 't0_m01::l03': 0.6 }

    const back = migrateState(JSON.parse(JSON.stringify(s)))
    expect(back.resume).toEqual(s.resume)
    expect(back.live?.draft?.value).toBe('half typed')
    expect(back.media.v1?.seconds).toBe(90)
    expect(back.place['t0_m01::l03']).toBe(0.6)
  })

  it('starts empty and drops a corrupt slice without losing the rest', () => {
    const fresh = newLearnerState()
    expect(fresh.resume).toBeUndefined()
    expect(fresh.media).toEqual({})

    const back = migrateState({
      ...newLearnerState(),
      resume: 'corrupt',
      live: { id: 'x' },
      media: 'corrupt',
      place: 12,
      theta: 0.5,
    })
    expect(back.resume).toBeUndefined()
    expect(back.live).toBeUndefined()
    expect(back.media).toEqual({})
    expect(back.place).toEqual({})
    // The rest of the state is untouched by a bad slice.
    expect(back.theta).toBe(0.5)
  })
})
