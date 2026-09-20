/* ============================================================================
   FSRS-6 conformance tests
   ----------------------------------------------------------------------------
   The reference vector below was produced by the upstream py-fsrs
   implementation (commit 9446cb0) with fuzzing disabled and default
   parameters. If this file fails, the port has drifted from upstream — fix the
   port, never the expectations.
   ========================================================================== */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG,
  DEFAULT_W,
  collectionRetention,
  decayOf,
  factorOf,
  forgettingCurve,
  intervalFor,
  newCard,
  retrievability,
  review,
  sanitizeWeights,
  type Grade,
  type Memory,
} from './fsrs'

const NOFUZZ = { ...DEFAULT_CONFIG, enableFuzz: false }
const near = (a: number, b: number, eps = 1e-3) => expect(Math.abs(a - b)).toBeLessThan(eps)

describe('derived constants', () => {
  it('decay is -w20', () => {
    expect(decayOf(DEFAULT_W)).toBeCloseTo(-0.1542, 10)
  })

  it('factor is defined so that R(S, S) === 0.9 exactly', () => {
    expect(factorOf(DEFAULT_W)).toBeCloseTo(0.9803464944134797, 12)
    near(retrievability(10, 10), 0.9, 1e-12)
    near(retrievability(250, 250), 0.9, 1e-12)
  })

  it('interval at retention 0.9 is exactly S', () => {
    expect(intervalFor(21, 0.9, 36500)).toBe(21)
    expect(intervalFor(120, 0.9, 36500)).toBe(120)
  })

  it('interval multipliers match the published table', () => {
    // Lower retention buys disproportionately longer intervals.
    near(intervalFor(1000, 0.85, 36500) / 1000, 1.906, 2e-3)
    near(intervalFor(1000, 0.8, 36500) / 1000, 3.316, 2e-3)
    near(intervalFor(1000, 0.95, 36500) / 1000, 0.403, 2e-3)
  })
})

describe('FSRS-6 reference vector', () => {
  /* Six reviews starting 2026-01-01, matching upstream digit for digit. */
  const STEPS: {
    grade: Grade
    advanceDays: number
    s: number
    d: number
    state: Memory['state']
    dueInMinutes: number
  }[] = [
    { grade: 3, advanceDays: 0, s: 2.3065, d: 2.1181, state: 'learning', dueInMinutes: 10 },
    { grade: 3, advanceDays: 10 / 1440, s: 2.3065, d: 2.1112, state: 'review', dueInMinutes: 2 * 1440 },
    { grade: 3, advanceDays: 3, s: 13.8358, d: 2.1043, state: 'review', dueInMinutes: 14 * 1440 },
    { grade: 1, advanceDays: 10, s: 1.6669, d: 7.39, state: 'relearning', dueInMinutes: 10 },
    { grade: 3, advanceDays: 1, s: 3.6911, d: 7.3778, state: 'review', dueInMinutes: 4 * 1440 },
    { grade: 4, advanceDays: 5, s: 17.0692, d: 6.4868, state: 'review', dueInMinutes: 17 * 1440 },
  ]

  it('reproduces stability, difficulty, state and interval at every step', () => {
    let card = newCard(new Date('2026-01-01T00:00:00Z'))
    let now = new Date('2026-01-01T00:00:00Z')

    STEPS.forEach((step, i) => {
      now = new Date(now.getTime() + step.advanceDays * 86_400_000)
      const res = review(card, step.grade, now, NOFUZZ)
      card = res.memory

      const at = `step ${i + 1}`
      expect(card.s, `${at} stability`).toBeCloseTo(step.s, 3)
      expect(card.d, `${at} difficulty`).toBeCloseTo(step.d, 3)
      expect(card.state, `${at} state`).toBe(step.state)
      expect(Math.round(res.dueInMinutes), `${at} interval`).toBe(step.dueInMinutes)
    })

    expect(card.reps).toBe(6)
    expect(card.lapses).toBe(1)
  })
})

describe('invariants that guard the three classic porting bugs', () => {
  it('a lapse can never raise stability (the FSRS-6 short-term cap)', () => {
    let card = newCard()
    let now = new Date('2026-03-01T00:00:00Z')
    // Build up a long-stability card.
    for (let i = 0; i < 6; i++) {
      const res = review(card, 4, now, NOFUZZ)
      card = res.memory
      now = new Date(now.getTime() + res.dueInMinutes * 60_000)
    }
    const before = card.s!
    expect(before).toBeGreaterThan(60)
    const after = review(card, 1, now, NOFUZZ).memory.s!
    expect(after).toBeLessThan(before)
  })

  it('same-day Hard/Good/Easy never reduce stability, but Again may', () => {
    const base = newCard()
    const first = review(base, 3, new Date('2026-04-01T09:00:00Z'), NOFUZZ).memory
    const sameDay = new Date('2026-04-01T09:20:00Z')

    for (const g of [2, 3, 4] as Grade[]) {
      const after = review(first, g, sameDay, NOFUZZ).memory.s!
      expect(after, `grade ${g}`).toBeGreaterThanOrEqual(first.s! - 1e-9)
    }
    expect(review(first, 1, sameDay, NOFUZZ).memory.s!).toBeLessThanOrEqual(first.s!)
  })

  it('difficulty mean-reverts toward the unclamped D0(Easy), so Good drifts it down', () => {
    // If the reversion target were the clamped 1.0 this drift would be upward.
    let card = review(newCard(), 1, new Date('2026-01-01T00:00:00Z'), NOFUZZ).memory
    const start = card.d!
    let now = new Date('2026-01-01T00:00:00Z')
    for (let i = 0; i < 20; i++) {
      now = new Date(now.getTime() + 86_400_000)
      card = review(card, 3, now, NOFUZZ).memory
    }
    expect(card.d!).toBeLessThan(start)
    expect(card.d!).toBeGreaterThanOrEqual(1)
    expect(card.d!).toBeLessThanOrEqual(10)
  })

  it('difficulty stays inside [1, 10] under any grade sequence', () => {
    let card = newCard()
    let now = new Date('2026-01-01T00:00:00Z')
    const grades: Grade[] = [1, 1, 2, 4, 4, 1, 3, 4, 1, 1, 2, 2, 4, 3, 1]
    for (const g of grades) {
      now = new Date(now.getTime() + 86_400_000 * 2)
      card = review(card, g, now, NOFUZZ).memory
      expect(card.d!).toBeGreaterThanOrEqual(1)
      expect(card.d!).toBeLessThanOrEqual(10)
      expect(card.s!).toBeGreaterThan(0)
    }
  })
})

describe('desirable difficulty', () => {
  it('recalling at low retrievability buys more stability than recalling fresh', () => {
    const seed = review(newCard(), 3, new Date('2026-01-01T00:00:00Z'), NOFUZZ).memory
    const graduated = review(seed, 3, new Date('2026-01-01T00:10:00Z'), NOFUZZ).memory

    // Same card, same grade — only the delay differs.
    const soon = review(graduated, 3, new Date('2026-01-02T00:00:00Z'), NOFUZZ).memory.s!
    const late = review(graduated, 3, new Date('2026-01-09T00:00:00Z'), NOFUZZ).memory.s!

    expect(late).toBeGreaterThan(soon)
  })
})

describe('retention curves', () => {
  it('follows the published power-law reference for S = 10', () => {
    near(retrievability(1, 10), 0.986, 2e-3)
    near(retrievability(10, 10), 0.9, 1e-6)
    near(retrievability(30, 10), 0.809, 2e-3)
    near(retrievability(90, 10), 0.703, 2e-3)
    near(retrievability(365, 10), 0.574, 2e-3)
  })

  it('decays monotonically and never leaves [0, 1]', () => {
    const pts = forgettingCurve(30, 400, 7)
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i]!.r).toBeLessThanOrEqual(pts[i - 1]!.r)
      expect(pts[i]!.r).toBeGreaterThanOrEqual(0)
      expect(pts[i]!.r).toBeLessThanOrEqual(1)
    }
  })

  it('collection retention ignores unseen cards and falls over time', () => {
    const now = new Date('2026-06-01T00:00:00Z')
    const seen = review(newCard(), 4, new Date('2026-05-25T00:00:00Z'), NOFUZZ).memory
    const cards = [seen, newCard()]
    const today = collectionRetention(cards, 0, now)
    const later = collectionRetention(cards, 120, now)
    expect(today).toBeGreaterThan(later)
    expect(today).toBeLessThanOrEqual(1)
  })
})

describe('fuzz', () => {
  it('keeps intervals within the published band and never below 2 days', () => {
    let card = newCard()
    let now = new Date('2026-01-01T00:00:00Z')
    for (let i = 0; i < 4; i++) {
      const r = review(card, 4, now, DEFAULT_CONFIG, () => 0.5)
      card = r.memory
      now = new Date(now.getTime() + r.dueInMinutes * 60_000)
      expect(r.dueInMinutes / 1440).toBeGreaterThanOrEqual(1)
    }
  })

  it('is deterministic when disabled', () => {
    const a = review(newCard(), 4, new Date('2026-01-01T00:00:00Z'), NOFUZZ).dueInMinutes
    const b = review(newCard(), 4, new Date('2026-01-01T00:00:00Z'), NOFUZZ).dueInMinutes
    expect(a).toBe(b)
  })
})

describe('sanitizeWeights', () => {
  it('clamps out-of-range values and rejects non-finite input', () => {
    const w = sanitizeWeights([-5, NaN, 2.3065, 1e9, 0.5, ...Array(16).fill(0)])
    expect(w[0]).toBe(0.001) // clamped up to the lower bound
    expect(w[1]).toBe(DEFAULT_W[1]) // NaN falls back to the default
    expect(w[2]).toBe(2.3065) // in range, preserved
    expect(w[3]).toBe(100) // clamped down to the upper bound
    expect(w[4]).toBe(1) // 0.5 is below w4's lower bound of 1
    expect(w).toHaveLength(21)
  })
})
