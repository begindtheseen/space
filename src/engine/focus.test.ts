import { describe, expect, it } from 'vitest'
import { endFocus, park, pauseFocus, resumeFocus, startFocus, unpark } from './apply'
import {
  blockSummary,
  clampMinutes,
  coerceParked,
  coerceRun,
  elapsedMs,
  isComplete,
  minutesSpent,
  parkNote,
  pauseRun,
  pickFocus,
  remainingMs,
  resumeRun,
  startRun,
  unparkNote,
  PARK_LIMIT,
  PARK_MAX_CHARS,
  PAUSE_COOLDOWN_MS,
  canPause,
  isLocked,
  lockAllows,
  pauseAvailableIn,
  type FocusInputs,
  type FocusPick,
} from './focus'
import { blocksToday, newLearnerState, streak } from './state'

const at = (iso: string) => new Date(iso)
const T0 = at('2026-03-02T10:00:00.000Z')

const pick: FocusPick = { kind: 'review', title: 'Clear 3 reviews', why: 'because', href: '/review' }

describe('pickFocus', () => {
  it('offers an open session before anything else', () => {
    const inp: FocusInputs = {
      dueCount: 40,
      unfinished: { moduleId: 'm', lessonId: 'l', title: 'Vectors', fraction: 0.5 },
      live: {
        id: 's',
        kind: 'exam',
        moduleId: 't0_m01_algebra_precalc',
        startedAt: T0.toISOString(),
        updatedAt: T0.toISOString(),
        queue: ['a', 'b'],
        done: [],
        correct: 0,
      },
    }
    const p = pickFocus(inp)
    expect(p.kind).toBe('resume-session')
    expect(p.why).toContain('2 questions left')
    expect(p.href).toBe('/module/t0_m01_algebra_precalc')
  })

  it('ignores a session with nothing left in it', () => {
    const p = pickFocus({
      dueCount: 2,
      live: {
        id: 's',
        kind: 'practice',
        startedAt: T0.toISOString(),
        updatedAt: T0.toISOString(),
        queue: [],
        done: ['a'],
        correct: 1,
      },
    })
    expect(p.kind).toBe('review')
  })

  it('finishes a half-read lesson before starting new work', () => {
    const p = pickFocus({
      dueCount: 9,
      unfinished: { moduleId: 'mod', lessonId: 'les', title: 'Dot products', fraction: 0.62 },
    })
    expect(p.kind).toBe('resume-lesson')
    expect(p.title).toContain('Dot products')
    expect(p.why).toContain('62%')
    expect(p.href).toBe('/module/mod?lesson=les')
  })

  it('does not call two paragraphs a lesson in progress', () => {
    const p = pickFocus({
      dueCount: 9,
      unfinished: { moduleId: 'mod', lessonId: 'les', title: 'Dot products', fraction: 0.01 },
    })
    expect(p.kind).toBe('review')
  })

  it('does not offer to resume a lesson she has all but finished', () => {
    const p = pickFocus({
      dueCount: 4,
      unfinished: { moduleId: 'mod', lessonId: 'les', title: 'Dot products', fraction: 0.995 },
    })
    expect(p.kind).toBe('review')
  })

  it('prefers due reviews over unread lessons', () => {
    const p = pickFocus({
      dueCount: 1,
      module: { id: 'mod', title: 'ODEs', started: true },
      lesson: { id: 'les', title: 'Separable equations', minutes: 20 },
    })
    expect(p.kind).toBe('review')
    expect(p.title).toBe('Clear 1 review')
  })

  it('opens the next lesson when nothing is owed', () => {
    const p = pickFocus({
      dueCount: 0,
      module: { id: 'mod', title: 'ODEs', started: true },
      lesson: { id: 'les', title: 'Separable equations', minutes: 20 },
    })
    expect(p.kind).toBe('start-lesson')
    expect(p.href).toBe('/module/mod?lesson=les')
    expect(p.why).toContain('20 minutes')
  })

  it('falls back to the module when its lessons are all read', () => {
    const p = pickFocus({ dueCount: 0, module: { id: 'mod', title: 'ODEs', started: false } })
    expect(p.kind).toBe('continue-module')
    expect(p.title).toBe('Start ODEs')
  })

  it('always returns something to do', () => {
    const p = pickFocus({ dueCount: 0 })
    expect(p.kind).toBe('bench')
    expect(p.href).toBe('/bench')
  })

  it('never points outside the app', () => {
    const inputs: FocusInputs[] = [
      { dueCount: 3 },
      { dueCount: 0 },
      { dueCount: 0, module: { id: 'm', title: 'T', started: true } },
      { dueCount: 0, unfinished: { moduleId: 'm', lessonId: 'l', title: 'T', fraction: 0.5 } },
    ]
    for (const inp of inputs) {
      const href = pickFocus(inp).href
      expect(href.startsWith('/')).toBe(true)
      expect(href.startsWith('//')).toBe(false)
    }
  })
})

describe('a running block', () => {
  it('counts down from the block length', () => {
    const run = startRun(pick, 15, T0)
    expect(remainingMs(run, T0)).toBe(15 * 60_000)
    expect(remainingMs(run, at('2026-03-02T10:05:00.000Z'))).toBe(10 * 60_000)
    expect(isComplete(run, at('2026-03-02T10:05:00.000Z'))).toBe(false)
  })

  it('is complete at the end and never goes negative', () => {
    const run = startRun(pick, 15, T0)
    const late = at('2026-03-02T11:00:00.000Z')
    expect(isComplete(run, late)).toBe(true)
    expect(remainingMs(run, late)).toBe(0)
  })

  it('holds still while paused', () => {
    const run = startRun(pick, 25, T0)
    const paused = pauseRun(run, at('2026-03-02T10:04:00.000Z'))
    expect(elapsedMs(paused, at('2026-03-02T10:30:00.000Z'))).toBe(4 * 60_000)
    const resumed = resumeRun(paused, at('2026-03-02T11:00:00.000Z'))
    expect(resumed.pausedAt).toBeUndefined()
    expect(elapsedMs(resumed, at('2026-03-02T11:01:00.000Z'))).toBe(5 * 60_000)
  })

  it('treats a double pause or a stray resume as a no-op', () => {
    const run = startRun(pick, 15, T0)
    const p1 = pauseRun(run, at('2026-03-02T10:02:00.000Z'))
    expect(pauseRun(p1, at('2026-03-02T10:09:00.000Z'))).toBe(p1)
    expect(resumeRun(run, T0)).toBe(run)
  })

  it('survives a clock that jumps backwards', () => {
    // A laptop waking with a corrected time must not read as negative work.
    const run = startRun(pick, 15, T0)
    expect(elapsedMs(run, at('2026-03-02T09:00:00.000Z'))).toBe(0)
    expect(remainingMs(run, at('2026-03-02T09:00:00.000Z'))).toBe(15 * 60_000)
  })

  it('credits only whole minutes actually spent', () => {
    const run = startRun(pick, 15, T0)
    expect(minutesSpent(run, at('2026-03-02T10:12:59.000Z'))).toBe(12)
  })

  it('clamps a nonsense block length rather than refusing to start', () => {
    expect(clampMinutes(Number.NaN)).toBe(15)
    expect(clampMinutes(0)).toBe(1)
    expect(clampMinutes(99999)).toBe(180)
    expect(clampMinutes(24.6)).toBe(25)
  })
})

describe('parking a thought', () => {
  it('keeps the newest first and trims whitespace', () => {
    let notes = parkNote([], '  call the dentist  ', T0)
    notes = parkNote(notes, 'look up quaternions', at('2026-03-02T10:01:00.000Z'))
    expect(notes.map((n) => n.text)).toEqual(['look up quaternions', 'call the dentist'])
  })

  it('ignores an empty note', () => {
    const notes = parkNote([], '   ', T0)
    expect(notes).toEqual([])
  })

  it('gives two notes in the same millisecond distinct ids', () => {
    let notes = parkNote([], 'one', T0)
    notes = parkNote(notes, 'two', T0)
    expect(new Set(notes.map((n) => n.at)).size).toBe(2)
    // And removing one leaves the other.
    const left = unparkNote(notes, notes[0]!.at)
    expect(left).toHaveLength(1)
  })

  it('caps the list and the note length', () => {
    let notes: ReturnType<typeof parkNote> = []
    for (let i = 0; i < PARK_LIMIT + 10; i++) {
      notes = parkNote(notes, `note ${i}`, at(`2026-03-02T10:00:${String(i % 60).padStart(2, '0')}.${String(i).padStart(3, '0')}Z`))
    }
    expect(notes).toHaveLength(PARK_LIMIT)
    const long = parkNote([], 'x'.repeat(PARK_MAX_CHARS + 50), T0)
    expect(long[0]!.text).toHaveLength(PARK_MAX_CHARS)
  })
})

describe('coercion from disk', () => {
  it('drops a run whose destination leaves the app', () => {
    const base = { startedAt: T0.toISOString(), minutes: 15, bankedMs: 0 }
    expect(coerceRun({ ...base, pick: { ...pick, href: 'https://example.com' } })).toBeUndefined()
    // Protocol-relative is the one that looks in-app and is not.
    expect(coerceRun({ ...base, pick: { ...pick, href: '//example.com' } })).toBeUndefined()
    expect(coerceRun({ ...base, pick })).toBeTruthy()
  })

  it('refuses rubbish and repairs what it can', () => {
    expect(coerceRun(null)).toBeUndefined()
    expect(coerceRun({ startedAt: 'not a date', pick })).toBeUndefined()
    const fixed = coerceRun({ startedAt: T0.toISOString(), minutes: -4, bankedMs: -1, pick })
    expect(fixed?.minutes).toBe(1)
    expect(fixed?.bankedMs).toBe(0)
  })

  it('keeps only well-formed parked notes', () => {
    expect(coerceParked('nope')).toEqual([])
    expect(coerceParked([{ at: 'x', text: 'ok' }, { at: 'y' }, { at: 'z', text: '  ' }])).toEqual([
      { at: 'x', text: 'ok' },
    ])
  })
})

describe('recording a block', () => {
  it('banks the time and the count, and survives a reload mid-block', () => {
    const s0 = startFocus(newLearnerState(T0), pick, 15, T0)
    expect(s0.focus).toBeTruthy()
    const s1 = endFocus(s0, at('2026-03-02T10:15:00.000Z'))
    expect(s1.focus).toBeUndefined()
    const day = Object.values(s1.days)[0]!
    expect(day.minutes).toBe(15)
    expect(day.blocks).toBe(1)
  })

  it('credits a block that was stopped early', () => {
    const s0 = startFocus(newLearnerState(T0), pick, 25, T0)
    const s1 = endFocus(s0, at('2026-03-02T10:09:00.000Z'))
    const day = Object.values(s1.days)[0]!
    expect(day.minutes).toBe(9)
    expect(day.blocks).toBe(1)
  })

  it('counts a finished block as showing up, even under a minute', () => {
    const s0 = startFocus(newLearnerState(T0), pick, 15, T0)
    const s1 = endFocus(s0, at('2026-03-02T10:00:30.000Z'))
    expect(Object.values(s1.days)[0]!.minutes).toBe(0)
    expect(streak(s1, at('2026-03-02T22:00:00.000Z'))).toBe(1)
  })

  it('parks and unparks through the state', () => {
    const s1 = park(newLearnerState(T0), 'renew the registration', T0)
    expect(s1.parked).toHaveLength(1)
    const s2 = unpark(s1, s1.parked[0]!.at)
    expect(s2.parked).toEqual([])
    // Unparking something that is not there changes nothing.
    expect(unpark(s2, 'missing')).toBe(s2)
  })
})

describe('what she is told afterwards', () => {
  it('never reports a shortfall', () => {
    expect(blockSummary(1, 15)).toBe('15 minutes done. That was the hard part.')
    expect(blockSummary(3, 25)).toBe('25 minutes today, across 3 blocks.')
    expect(blockSummary(1, 1)).toContain('1 minute done')
  })

  it('never says zero minutes', () => {
    // A block ended after forty seconds is still a block that happened. This
    // was found by walking the real flow in a browser, where a short block
    // reported "0 minutes done. That was the hard part."
    expect(blockSummary(1, 0)).toBe('Block done. That was the hard part.')
    expect(blockSummary(4, 0)).toBe('Block done. 4 today.')
    for (const blocks of [0, 1, 2, 9]) {
      for (const minutes of [0, 1, 7, 240]) {
        expect(blockSummary(blocks, minutes)).not.toMatch(/\b0 minutes?\b/)
      }
    }
  })
})

describe('the module boundary', () => {
  it('imports nothing from state at runtime', () => {
    // state.ts calls coerceParked and coerceRun while building a fresh state.
    // A value import back the other way would close a cycle, and which of the
    // two modules finished evaluating first would then decide whether
    // newLearnerState sees a function or undefined. Types are erased and are
    // fine; anything else is not.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs')
    const src = fs.readFileSync(new URL('./focus.ts', import.meta.url), 'utf8')
    const imports = src.match(/^import .*from '\.\/state'/gm) ?? []
    for (const line of imports) expect(line.startsWith('import type ')).toBe(true)
  })

  it('counts the day\'s blocks off the day record', () => {
    const s0 = startFocus(newLearnerState(T0), pick, 15, T0)
    expect(blocksToday(s0, T0)).toBe(0)
    expect(blocksToday(endFocus(s0, at('2026-03-02T10:15:00.000Z')), T0)).toBe(1)
  })
})

describe('staying in the block', () => {
  const lesson: FocusPick = { kind: 'start-lesson', title: 'Vectors', why: 'next', href: '/module/m1?lesson=l2', moduleId: 'm1' }
  const min = (n: number) => new Date(T0.getTime() + n * 60_000)

  it('holds her while it runs, and lets go when it is paused or finished', () => {
    const run = startRun(lesson, 15, T0)
    expect(isLocked(run, min(1))).toBe(true)
    expect(isLocked(pauseRun(run, min(6)), min(7))).toBe(false)
    expect(isLocked(run, min(15))).toBe(false)
    expect(isLocked(undefined, T0)).toBe(false)
  })

  it('keeps her on the module it opened, between its lessons, and nowhere else', () => {
    const run = startRun(lesson, 15, T0)
    expect(lockAllows(run, '/module/m1')).toBe(true)
    expect(lockAllows(run, '/module/m1/')).toBe(true)
    expect(lockAllows(run, '/module/m2')).toBe(false)
    expect(lockAllows(run, '/module/m10')).toBe(false)
    expect(lockAllows(run, '/')).toBe(false)
    expect(lockAllows(run, '/settings')).toBe(false)
    const review = startRun(pick, 15, T0)
    expect(lockAllows(review, '/review')).toBe(true)
    expect(lockAllows(review, '/review/session')).toBe(true)
    expect(lockAllows(review, '/reviews')).toBe(false)
  })

  it('can be paused only once five minutes of it have run, from the start and from each resume', () => {
    const run = startRun(lesson, 25, T0)
    expect(PAUSE_COOLDOWN_MS).toBe(5 * 60_000)
    expect(canPause(run, min(1))).toBe(false)
    expect(pauseAvailableIn(run, min(1))).toBe(4 * 60_000)
    expect(canPause(run, min(5))).toBe(true)
    const paused = pauseRun(run, min(6))
    expect(pauseAvailableIn(paused, min(6))).toBe(0)
    const resumed = resumeRun(paused, min(20))
    // Resumed at minute 20: the next pause waits for five more minutes of focus.
    expect(canPause(resumed, min(21))).toBe(false)
    expect(pauseAvailableIn(resumed, min(22))).toBe(3 * 60_000)
    expect(canPause(resumed, min(25))).toBe(true)
  })

  it('never makes her wait past the end of the block', () => {
    const short = startRun(lesson, 3, T0)
    expect(pauseAvailableIn(short, min(1))).toBe(2 * 60_000)
    expect(canPause(short, min(3))).toBe(false)
  })

  it('refuses a pause before its time through the state, but always lets her end the block', () => {
    let s = startFocus(newLearnerState(T0), lesson, 25, T0)
    s = pauseFocus(s, min(2))
    expect(s.focus?.pausedAt).toBeUndefined()
    s = pauseFocus(s, min(5))
    expect(s.focus?.pausedAt).toBe(min(5).toISOString())
    s = resumeFocus(s, min(8))
    expect(pauseFocus(s, min(9)).focus?.pausedAt).toBeUndefined()
    const ended = endFocus(s, min(9))
    expect(ended.focus).toBeUndefined()
    expect(blocksToday(ended, min(9))).toBe(1)
  })
})
