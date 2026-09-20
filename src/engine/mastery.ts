/* ============================================================================
   ORBIT — mastery estimation
   ----------------------------------------------------------------------------
   Three models, because they answer three different questions and no single
   one answers all of them:

     BKT  "can they do it?"      — a latent skill bit per topic, updated by
                                   Bayes on each attempt. Has no concept of
                                   time, so it never decays.
     FSRS "do they still have it?" — see fsrs.ts. Has no concept of a skill
                                   being composed of sub-skills.
     Elo  "how hard is this item?" — self-calibrating item difficulty from
                                   real attempt data, so authored `b` values
                                   only have to be roughly right.

   `topicMastery` blends them. The `coverage` multiplier is deliberate and is
   the most important line in this file: scoring 100% on 3 of 40 items is not
   mastery of the topic, and an additive blend would let it look like one.
   ========================================================================== */

/* ── Bayesian Knowledge Tracing ──────────────────────────────────────────── */

export interface BktParams {
  /** Prior probability the skill is already known. */
  pInit: number
  /** Probability of learning the skill on any one opportunity. */
  pTransit: number
  /** Probability of answering wrong despite knowing it. Must stay < 0.5. */
  pSlip: number
  /** Probability of answering right without knowing it. Must stay < 0.5. */
  pGuess: number
}

/**
 * Defaults chosen mid-range in the published bands. The `< 0.5` constraints on
 * slip and guess are not cosmetic: without them a fitter finds degenerate
 * parameter sets in which answering *correctly* lowers estimated mastery.
 */
export const DEFAULT_BKT: BktParams = {
  pInit: 0.25,
  pTransit: 0.15,
  pSlip: 0.1,
  pGuess: 0.2,
}

export function bktParams(partial: Partial<BktParams> = {}): BktParams {
  const p = { ...DEFAULT_BKT, ...partial }
  return {
    pInit: clamp(p.pInit, 0.01, 0.99),
    pTransit: clamp(p.pTransit, 0.01, 0.6),
    pSlip: clamp(p.pSlip, 0.01, 0.49),
    pGuess: clamp(p.pGuess, 0.01, 0.49),
  }
}

/** Posterior P(known) after one graded attempt, including the learning step. */
export function bktUpdate(pL: number, correct: boolean, p: BktParams = DEFAULT_BKT): number {
  const prior = clamp(pL, 0, 1)
  const num = correct ? prior * (1 - p.pSlip) : prior * p.pSlip
  const den = correct
    ? prior * (1 - p.pSlip) + (1 - prior) * p.pGuess
    : prior * p.pSlip + (1 - prior) * (1 - p.pGuess)
  const post = den === 0 ? prior : num / den
  return clamp(post + (1 - post) * p.pTransit, 0, 1)
}

/** Predicted probability of a correct answer given current mastery. */
export function bktPredict(pL: number, p: BktParams = DEFAULT_BKT): number {
  return pL * (1 - p.pSlip) + (1 - pL) * p.pGuess
}

/* ── Item Response Theory ────────────────────────────────────────────────── */

export interface IrtItem {
  /** Discrimination. 1.0 is typical; higher means a sharper cut. */
  a: number
  /** Difficulty on the logit scale. */
  b: number
  /** Pseudo-guessing floor. For k-choice multiple choice, 1/k. */
  c: number
}

export function irtItem(b: number, choices?: number): IrtItem {
  return { a: 1, b, c: choices && choices > 1 ? 1 / choices : 0 }
}

export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))

/** 3PL probability of a correct response. With c = 0 this reduces to 2PL. */
export function irtP(theta: number, item: IrtItem): number {
  return item.c + (1 - item.c) * sigmoid(item.a * (theta - item.b))
}

/**
 * Fisher information — how much an item tells you about ability.
 *
 * Note this is for *measurement*, e.g. a placement test. It peaks near a 50%
 * success rate, which is exactly the wrong target for practice (see
 * `TARGET_SUCCESS` below). Use information to place someone, then stop.
 */
export function irtInformation(theta: number, item: IrtItem): number {
  const p = clamp(irtP(theta, item), 1e-6, 1 - 1e-6)
  if (item.c === 0) return item.a * item.a * p * (1 - p)
  return item.a * item.a * ((1 - p) / p) * Math.pow((p - item.c) / (1 - item.c), 2)
}

/* ── Online ability estimation (EAP over a fixed grid) ───────────────────────
   Expected a posteriori rather than maximum likelihood, because MLE diverges
   on all-correct or all-wrong response patterns — which is exactly what a new
   learner produces in their first session. 61 grid nodes is plenty and costs
   microseconds. */

const THETA_GRID: number[] = Array.from({ length: 61 }, (_, i) => -4 + i * (8 / 60))

export interface Ability {
  theta: number
  /** Standard error. Below ~0.3 the estimate is trustworthy. */
  se: number
  /** Log-posterior over THETA_GRID, carried between updates. */
  logPost: number[]
}

export function newAbility(priorMean = 0, priorSd = 1): Ability {
  const logPost = THETA_GRID.map((t) => -0.5 * Math.pow((t - priorMean) / priorSd, 2))
  return summarise(logPost)
}

export function abilityUpdate(ability: Ability, item: IrtItem, correct: boolean): Ability {
  const logPost = ability.logPost.slice()
  for (let i = 0; i < THETA_GRID.length; i++) {
    const p = clamp(irtP(THETA_GRID[i]!, item), 1e-6, 1 - 1e-6)
    logPost[i] = logPost[i]! + Math.log(correct ? p : 1 - p)
  }
  return summarise(logPost)
}

function summarise(logPost: number[]): Ability {
  const max = Math.max(...logPost)
  const w = logPost.map((v) => Math.exp(v - max))
  const z = w.reduce((a, b) => a + b, 0) || 1
  let mean = 0
  for (let i = 0; i < THETA_GRID.length; i++) mean += THETA_GRID[i]! * (w[i]! / z)
  let varr = 0
  for (let i = 0; i < THETA_GRID.length; i++) varr += Math.pow(THETA_GRID[i]! - mean, 2) * (w[i]! / z)
  return { theta: mean, se: Math.sqrt(varr), logPost }
}

/* ── Elo calibration ─────────────────────────────────────────────────────────
   A one-line online approximation of Rasch. It needs no batch job, it
   self-calibrates item difficulty from traffic, and it cold-starts gracefully
   — which makes it the right first choice over full IRT calibration.

   Note the scale: this is raw logits (θ − d), NOT chess's 400-point scale.

   `K(n) = a / (1 + b·n)` is an uncertainty function rather than a constant:
   early estimates move fast, settled ones barely move. */

export function eloK(n: number, a = 1, b = 0.05): number {
  return a / (1 + b * n)
}

export interface EloUpdate {
  theta: number
  difficulty: number
  /** Predicted success probability before the attempt — used for calibration. */
  expected: number
}

export function eloUpdate(
  theta: number,
  difficulty: number,
  correct: boolean,
  nUser: number,
  nItem: number,
  choices = 0,
): EloUpdate {
  const base = sigmoid(theta - difficulty)
  // Multiple choice has a floor: a blind guess is right 1/k of the time, and
  // not correcting for it inflates estimated ability on every MCQ.
  const g = choices > 1 ? 1 / choices : 0
  const expected = g + (1 - g) * base
  const err = (correct ? 1 : 0) - expected
  return {
    theta: theta + eloK(nUser) * err,
    difficulty: difficulty - eloK(nItem) * err,
    expected,
  }
}

/* ── Target difficulty ───────────────────────────────────────────────────────
   The optimal error rate for learning is Φ(−1) ≈ 0.1587, i.e. ~84% success.
   That is where "85% rule" comes from.

   Scope note worth keeping honest: the result is derived for gradient-based
   perceptual learning, so treat it as a well-motivated default for choosing
   *new material*, not a universal law. For *review scheduling* the better
   calibrated knob is FSRS's desired retention at 0.90. It is fine — correct,
   even — that the two numbers differ: they govern different mechanisms. */

export const TARGET_SUCCESS = 0.8413

/** Difficulty at which a learner of ability θ succeeds ~84% of the time. */
export function targetDifficulty(theta: number, a = 1): number {
  return theta - 1.6709 / a
}

/** How well an item's predicted success matches the target band. 1 is perfect. */
export function difficultyFit(predictedSuccess: number): number {
  return Math.max(0, 1 - Math.abs(predictedSuccess - TARGET_SUCCESS) / TARGET_SUCCESS)
}

/** An item is worth practising when success sits inside the productive band. */
export function inZoneOfProximalDevelopment(predictedSuccess: number): boolean {
  return predictedSuccess >= 0.6 && predictedSuccess <= 0.92
}

/* ── Scaffolding ─────────────────────────────────────────────────────────────
   The worked-example effect says novices learn more from studying a complete
   solution than from solving. The expertise-reversal effect says that advantage
   inverts as skill grows. Together they mean guidance must be a function of
   measured mastery — which is the whole reason this engine measures it. */

export type Scaffold = 'worked' | 'completion' | 'faded' | 'independent'

export function scaffoldFor(mastery: number): Scaffold {
  if (mastery < 0.3) return 'worked'
  if (mastery < 0.55) return 'completion'
  if (mastery < 0.8) return 'faded'
  return 'independent'
}

/**
 * Which solution steps to blank out, backward-faded (last step first), which
 * is the empirically preferred direction.
 */
export function stepsToBlank(totalSteps: number, mastery: number): number[] {
  const frac = clamp((mastery - 0.3) / 0.5, 0, 1)
  const n = Math.round(frac * totalSteps)
  const out: number[] = []
  for (let i = totalSteps - n; i < totalSteps; i++) out.push(i)
  return out
}

/* ── Calibration ─────────────────────────────────────────────────────────────
   Confidence is collected *before* the answer is revealed. Immediate judgments
   of learning are systematically overconfident because fluency gets read as
   future retrievability — that illusion is the single biggest reason learners
   choose rereading over testing. Showing them their own reliability curve is
   the most behaviour-changing chart this product can draw. */

export interface CalibrationPoint {
  confidence: number
  correct: boolean
}

/** Brier score. 0 is perfect, 0.25 is chance. Lower is better. */
export function brierScore(points: CalibrationPoint[]): number {
  if (points.length === 0) return 0
  let s = 0
  for (const p of points) s += Math.pow(p.confidence - (p.correct ? 1 : 0), 2)
  return s / points.length
}

/** Signed bias: positive is overconfident, negative underconfident. */
export function calibrationBias(points: CalibrationPoint[]): number {
  if (points.length === 0) return 0
  const meanConf = points.reduce((a, p) => a + p.confidence, 0) / points.length
  const meanAcc = points.reduce((a, p) => a + (p.correct ? 1 : 0), 0) / points.length
  return meanConf - meanAcc
}

/** Reliability diagram buckets: stated confidence vs observed accuracy. */
export function reliabilityCurve(
  points: CalibrationPoint[],
  bins = 5,
): { bin: number; confidence: number; accuracy: number; n: number }[] {
  const buckets = Array.from({ length: bins }, () => ({ conf: 0, acc: 0, n: 0 }))
  for (const p of points) {
    const i = Math.min(bins - 1, Math.floor(clamp(p.confidence, 0, 0.999) * bins))
    const b = buckets[i]!
    b.conf += p.confidence
    b.acc += p.correct ? 1 : 0
    b.n += 1
  }
  return buckets.map((b, i) => ({
    bin: (i + 0.5) / bins,
    confidence: b.n ? b.conf / b.n : 0,
    accuracy: b.n ? b.acc / b.n : 0,
    n: b.n,
  }))
}

/* ── Topic-level roll-up ─────────────────────────────────────────────────── */

export interface TopicEvidence {
  /** Mean current retrievability over items that have been seen. */
  retention: number
  /** BKT posterior for the topic's skill. */
  pKnown: number
  /** Fraction of the topic's items that have ever been attempted. */
  coverage: number
  /** Mean durability: stability normalised against a 60-day horizon. */
  depth: number
}

/**
 * Blends the independent signals into one 0–1 mastery figure.
 *
 * Multiplying by coverage is what keeps the number honest — see the file
 * header. The 0.35/0.35/0.30 split weights "can I do it" and "do I still have
 * it" equally, with durability as a smaller third voice.
 */
export function topicMastery(e: TopicEvidence): number {
  const blend = 0.35 * clamp(e.retention, 0, 1) + 0.35 * clamp(e.pKnown, 0, 1) + 0.3 * clamp(e.depth, 0, 1)
  return clamp(clamp(e.coverage, 0, 1) * blend, 0, 1)
}

export function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return n < lo ? lo : n > hi ? hi : n
}
