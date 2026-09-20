/* ============================================================================
   ORBIT — FSRS-6 spaced repetition scheduler
   ----------------------------------------------------------------------------
   A direct port of the FSRS-6 reference implementation (open-spaced-repetition
   /py-fsrs). The equations are reproduced here rather than pulled from a
   package so the whole memory model is auditable in one file and the app keeps
   zero runtime dependencies.

   The model tracks three quantities per item:
     S  stability      — days until retrievability decays to 0.9
     D  difficulty     — 1..10, how much work each review buys
     R  retrievability — probability of recall right now, a power-law function
                         of elapsed time over stability

   The load-bearing idea, and the reason this beats SM-2: the stability gained
   from a successful review is *inversely* related to retrievability at the
   moment of recall (the `e^(w10·(1−R)) − 1` term in `recallStability`). That is
   Bjork's desirable-difficulty principle written as algebra — recalling
   something you almost forgot is worth far more than drilling something fresh.

   Three details are easy to get wrong and are called out at their sites:
     · difficulty mean-reverts toward the UNCLAMPED D₀(Easy) = −4.7716
     · same-day stability gain is floored at 1.0 for Hard/Good/Easy only
     · post-lapse stability takes min(longTerm, shortTermCap)
   ========================================================================== */

/** 1 Again · 2 Hard · 3 Good · 4 Easy. */
export type Grade = 1 | 2 | 3 | 4

export const GRADE = { Again: 1, Hard: 2, Good: 3, Easy: 4 } as const

export type CardState = 'new' | 'learning' | 'review' | 'relearning'

export interface Memory {
  /** Stability in days. `null` until the first review. */
  s: number | null
  /** Difficulty, 1–10. `null` until the first review. */
  d: number | null
  state: CardState
  /** Index into the learning/relearning step ladder. */
  step: number
  /** ISO timestamp of the last review, or null. */
  last: string | null
  /** ISO timestamp the card next becomes due. */
  due: string
  reps: number
  lapses: number
}

export interface FsrsConfig {
  w: readonly number[]
  desiredRetention: number
  /** Minutes. */
  learningSteps: number[]
  /** Minutes. */
  relearningSteps: number[]
  maximumInterval: number
  enableFuzz: boolean
}

/* ── Parameters ──────────────────────────────────────────────────────────────
   The FSRS-6 defaults, fitted across ~20k Anki collections. Personalising
   these needs ~1000+ reviews to beat them, so the app ships the defaults and
   only offers a fit once a learner has that much history. */
export const DEFAULT_W = [
  0.212, 1.2931, 2.3065, 8.2956, // w0–w3   initial stability, one per grade
  6.4133, 0.8334, //                w4, w5  initial difficulty
  3.0194, 0.001, //                 w6, w7  difficulty delta, mean-reversion weight
  1.8722, 0.1666, 0.796, //         w8–w10  stability after recall
  1.4835, 0.0614, 0.2629, 1.6483, //w11–w14 stability after a lapse
  0.6014, 1.8729, //                w15,w16 hard penalty, easy bonus
  0.5425, 0.0912, 0.0658, //        w17–w19 same-day stability
  0.1542, //                        w20     decay
] as const

/** Per-parameter clamps used when fitting; also guards hand-edited configs. */
export const W_BOUNDS: readonly (readonly [number, number])[] = [
  [0.001, 100], [0.001, 100], [0.001, 100], [0.001, 100],
  [1, 10], [0.001, 4], [0.001, 4], [0.001, 0.75],
  [0, 4.5], [0, 0.8], [0.001, 3.5], [0.001, 5],
  [0.001, 0.25], [0.001, 0.9], [0, 4], [0, 1],
  [1, 6], [0, 2], [0, 2], [0, 0.8], [0, 0.8],
]

export const STABILITY_MIN = 0.001
const MIN_D = 1
const MAX_D = 10

export const DEFAULT_CONFIG: FsrsConfig = {
  w: DEFAULT_W,
  desiredRetention: 0.9,
  learningSteps: [1, 10],
  relearningSteps: [10],
  maximumInterval: 36500,
  enableFuzz: true,
}

/** `decay` and `factor` are derived from w20; factor is defined so R(S,S)=0.9. */
export function decayOf(w: readonly number[]): number {
  return -(w[20] ?? DEFAULT_W[20])
}

export function factorOf(w: readonly number[]): number {
  return Math.pow(0.9, 1 / decayOf(w)) - 1
}

const clampD = (d: number) => Math.min(Math.max(d, MIN_D), MAX_D)

/* ── Core equations ──────────────────────────────────────────────────────── */

/**
 * Retrievability: the probability of recalling the item after `elapsedDays`.
 *
 *   R(t, S) = (1 + FACTOR · t / S) ^ DECAY
 *
 * This is a power law (the Wickelgren form), not an exponential. That matters:
 * empirically forgetting has a much longer tail than exponential decay
 * predicts, which is why a well-stabilised item stays usable for months.
 */
export function retrievability(elapsedDays: number, s: number, w: readonly number[] = DEFAULT_W): number {
  if (s <= 0) return 0
  const t = Math.max(0, elapsedDays)
  return Math.pow(1 + factorOf(w) * (t / s), decayOf(w))
}

/**
 * Days until retrievability falls to `desiredRetention`.
 *
 * Sensitivity is extreme and worth knowing before exposing a slider: at
 * retention 0.9 the interval is exactly S; at 0.8 it is 3.3·S; at 0.7, 9.3·S.
 */
export function intervalFor(
  s: number,
  desiredRetention: number,
  maximumInterval: number,
  w: readonly number[] = DEFAULT_W,
): number {
  const ivl = (s / factorOf(w)) * (Math.pow(desiredRetention, 1 / decayOf(w)) - 1)
  return Math.min(Math.max(Math.round(ivl), 1), maximumInterval)
}

function initialStability(g: Grade, w: readonly number[]): number {
  return Math.max(w[g - 1] ?? DEFAULT_W[g - 1], STABILITY_MIN)
}

/** D₀ before clamping. The raw value is needed for mean reversion — see below. */
function initialDifficultyRaw(g: Grade, w: readonly number[]): number {
  return (w[4] ?? 0) - Math.exp((w[5] ?? 0) * (g - 1)) + 1
}

function initialDifficulty(g: Grade, w: readonly number[]): number {
  return clampD(initialDifficultyRaw(g, w))
}

/**
 * Difficulty after a grade.
 *
 * Two subtleties that most third-party ports get wrong:
 *
 *  1. The mean-reversion target is the *unclamped* D₀(Easy) ≈ −4.7716, not the
 *     clamped 1.0. Using the clamped value silently drifts long-run difficulty.
 *  2. The `(10 − D)·ΔD / 9` term is linear damping, added in FSRS-5: difficulty
 *     moves less the closer it gets to 10, which is what actually prevents the
 *     runaway "ease hell" that SM-2's multiplicative factor suffers from.
 */
function nextDifficulty(d: number, g: Grade, w: readonly number[]): number {
  const deltaD = -((w[6] ?? 0) * (g - 3))
  const damped = d + ((10 - d) * deltaD) / 9
  const target = initialDifficultyRaw(4, w)
  return clampD((w[7] ?? 0) * target + (1 - (w[7] ?? 0)) * damped)
}

/** Stability after a successful review one or more days after the last. */
function recallStability(d: number, s: number, r: number, g: Grade, w: readonly number[]): number {
  const hardPenalty = g === 2 ? (w[15] ?? 1) : 1
  const easyBonus = g === 4 ? (w[16] ?? 1) : 1
  return (
    s *
    (1 +
      Math.exp(w[8] ?? 0) *
        (11 - d) *
        Math.pow(s, -(w[9] ?? 0)) *
        (Math.exp((1 - r) * (w[10] ?? 0)) - 1) *
        hardPenalty *
        easyBonus)
  )
}

/**
 * Stability after a lapse.
 *
 * The `min` against the short-term cap is an FSRS-6 addition and is
 * load-bearing: without it, a lapse on a long-stability card can compute a
 * *higher* stability than before the lapse.
 */
function forgetStability(d: number, s: number, r: number, w: readonly number[]): number {
  const longTerm =
    (w[11] ?? 0) *
    Math.pow(d, -(w[12] ?? 0)) *
    (Math.pow(s + 1, w[13] ?? 0) - 1) *
    Math.exp((1 - r) * (w[14] ?? 0))
  const shortTermCap = s / Math.exp((w[17] ?? 0) * (w[18] ?? 0))
  return Math.min(longTerm, shortTermCap)
}

/** Stability for a review that happens the same day as the previous one. */
function shortTermStability(s: number, g: Grade, w: readonly number[]): number {
  let inc = Math.exp((w[17] ?? 0) * (g - 3 + (w[18] ?? 0))) * Math.pow(s, -(w[19] ?? 0))
  // Hard/Good/Easy must never *reduce* stability within a day; Again may.
  if (g >= 2) inc = Math.max(inc, 1)
  return Math.max(s * inc, STABILITY_MIN)
}

/* ── Scheduling ──────────────────────────────────────────────────────────── */

const FUZZ_RANGES = [
  { start: 2.5, end: 7, factor: 0.15 },
  { start: 7, end: 20, factor: 0.1 },
  { start: 20, end: Infinity, factor: 0.05 },
] as const

/**
 * Jitters an interval so that cards learned on the same day do not all come
 * due on the same day forever. Without this a heavy study session builds a
 * permanent spike in the review queue months out.
 */
function applyFuzz(ivl: number, maximumInterval: number, rand: () => number): number {
  if (ivl < 2.5) return ivl
  let delta = 1
  for (const r of FUZZ_RANGES) {
    delta += r.factor * Math.max(Math.min(ivl, r.end) - r.start, 0)
  }
  let lo = Math.max(2, Math.round(ivl - delta))
  const hi = Math.min(Math.round(ivl + delta), maximumInterval)
  lo = Math.min(lo, hi)
  return Math.min(Math.round(rand() * (hi - lo + 1) + lo), maximumInterval)
}

export interface ReviewResult {
  memory: Memory
  /** Minutes until the card is due again — useful for "see you in 10m" copy. */
  dueInMinutes: number
  /** Retrievability measured at the moment of this review (null on first rep). */
  reviewedAtR: number | null
}

export function newCard(due: Date = new Date()): Memory {
  return {
    s: null,
    d: null,
    state: 'new',
    step: 0,
    last: null,
    due: due.toISOString(),
    reps: 0,
    lapses: 0,
  }
}

/**
 * Applies a grade to a card and returns its next memory state.
 *
 * `rand` is injectable so tests can disable fuzz determinism.
 */
export function review(
  card: Memory,
  grade: Grade,
  now: Date = new Date(),
  cfg: FsrsConfig = DEFAULT_CONFIG,
  rand: () => number = Math.random,
): ReviewResult {
  const w = cfg.w
  const lastAt = card.last ? new Date(card.last).getTime() : null
  const elapsedDays = lastAt == null ? null : Math.max(0, (now.getTime() - lastAt) / 86_400_000)

  const r = card.s != null && elapsedDays != null ? retrievability(elapsedDays, card.s, w) : null

  // ── memory update ────────────────────────────────────────────────────────
  let s: number
  let d: number
  if (card.s == null || card.d == null) {
    s = initialStability(grade, w)
    d = initialDifficulty(grade, w)
  } else {
    d = nextDifficulty(card.d, grade, w)
    if (elapsedDays != null && elapsedDays < 1) {
      s = shortTermStability(card.s, grade, w)
    } else {
      const rr = r ?? 0.9
      s =
        grade === 1
          ? forgetStability(card.d, card.s, rr, w)
          : recallStability(card.d, card.s, rr, grade, w)
    }
    s = Math.max(s, STABILITY_MIN)
  }

  // ── state machine ────────────────────────────────────────────────────────
  const learning = cfg.learningSteps
  const relearning = cfg.relearningSteps
  let state = card.state
  let step = card.step
  let lapses = card.lapses
  let dueInMinutes: number

  const graduate = () => {
    state = 'review'
    step = 0
    const days = cfg.enableFuzz
      ? applyFuzz(intervalFor(s, cfg.desiredRetention, cfg.maximumInterval, w), cfg.maximumInterval, rand)
      : intervalFor(s, cfg.desiredRetention, cfg.maximumInterval, w)
    dueInMinutes = days * 1440
  }

  const ladder = (steps: number[], nextState: 'learning' | 'relearning') => {
    if (steps.length === 0) {
      graduate()
      return
    }
    state = nextState
    switch (grade) {
      case 1:
        step = 0
        dueInMinutes = steps[0]!
        break
      case 2:
        // Hard repeats the current step. On the first step it lands between
        // this step and the next, so "hard" is not a hard reset.
        if (step === 0) {
          dueInMinutes = steps.length === 1 ? steps[0]! * 1.5 : (steps[0]! + (steps[1] ?? steps[0]!)) / 2
        } else {
          dueInMinutes = steps[step] ?? steps[steps.length - 1]!
        }
        break
      case 3:
        if (step + 1 >= steps.length) {
          graduate()
        } else {
          step += 1
          dueInMinutes = steps[step]!
        }
        break
      case 4:
        graduate()
        break
    }
  }

  dueInMinutes = 0
  if (card.state === 'new') {
    step = 0
    if (learning.length === 0 || grade === 4) {
      graduate()
    } else if (grade === 1) {
      state = 'learning'
      dueInMinutes = learning[0]!
    } else if (grade === 2) {
      state = 'learning'
      dueInMinutes = learning.length === 1 ? learning[0]! * 1.5 : (learning[0]! + learning[1]!) / 2
    } else {
      state = 'learning'
      if (learning.length === 1) graduate()
      else {
        step = 1
        dueInMinutes = learning[1]!
      }
    }
  } else if (card.state === 'learning') {
    ladder(learning, 'learning')
  } else if (card.state === 'relearning') {
    ladder(relearning, 'relearning')
  } else {
    // review
    if (grade === 1) {
      lapses += 1
      if (relearning.length === 0) {
        graduate()
      } else {
        state = 'relearning'
        step = 0
        dueInMinutes = relearning[0]!
      }
    } else {
      graduate()
    }
  }

  const due = new Date(now.getTime() + dueInMinutes * 60_000)

  return {
    memory: {
      s,
      d,
      state,
      step,
      last: now.toISOString(),
      due: due.toISOString(),
      reps: card.reps + 1,
      lapses,
    },
    dueInMinutes,
    reviewedAtR: r,
  }
}

/* ── Read-only helpers used across the app ───────────────────────────────── */

export function daysSince(iso: string | null, now: Date = new Date()): number {
  if (!iso) return 0
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 86_400_000)
}

/** Current predicted recall probability for a card. New cards return 0. */
export function currentR(card: Memory, now: Date = new Date(), w: readonly number[] = DEFAULT_W): number {
  if (card.s == null || !card.last) return 0
  return retrievability(daysSince(card.last, now), card.s, w)
}

export function isDue(card: Memory, now: Date = new Date()): boolean {
  return new Date(card.due).getTime() <= now.getTime()
}

/**
 * Predicted retention curve for one card, for the forgetting-curve chart.
 * Returns `days + 1` samples starting at today.
 */
export function forgettingCurve(
  s: number,
  days = 180,
  step = 1,
  w: readonly number[] = DEFAULT_W,
): { t: number; r: number }[] {
  const out: { t: number; r: number }[] = []
  for (let t = 0; t <= days; t += step) out.push({ t, r: retrievability(t, s, w) })
  return out
}

/**
 * What fraction of a collection will still be recallable `t` days from now if
 * nothing is reviewed between now and then. This is the honest version of
 * "your knowledge decays" and is what the Progress page charts.
 */
export function collectionRetention(cards: Memory[], t: number, now: Date = new Date()): number {
  const seen = cards.filter((c) => c.s != null && c.last)
  if (seen.length === 0) return 0
  let sum = 0
  for (const c of seen) sum += retrievability(daysSince(c.last, now) + t, c.s!)
  return sum / seen.length
}

/** Validates and clamps a parameter vector, e.g. after import. */
export function sanitizeWeights(w: readonly number[]): number[] {
  const out = [...DEFAULT_W] as number[]
  for (let i = 0; i < out.length; i++) {
    const v = w[i]
    if (typeof v !== 'number' || !Number.isFinite(v)) continue
    const [lo, hi] = W_BOUNDS[i] ?? [-Infinity, Infinity]
    out[i] = Math.min(Math.max(v, lo), hi)
  }
  return out
}
