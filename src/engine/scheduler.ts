/* ============================================================================
   ORBIT — the scheduler
   ----------------------------------------------------------------------------
   This is the part that decides what the learner does next, and it is the
   reason the product exists. Three rules, in priority order:

     1. Overdue review beats new material, always. Forgetting is irreversible
        on a timescale that matters; learning something new is not urgent.
     2. New material is only ever drawn from the frontier — modules whose
        prerequisites are already at threshold. Teaching the Kalman filter to
        someone shaky on matrix algebra is how you manufacture a quitter.
     3. Within the frontier, prefer whatever sits closest to ~84% predicted
        success, weighted by how much of the curriculum it unblocks.

   Everything below is derived from those three rules.
   ========================================================================== */
import type { Module } from '@/curriculum/types'
import { itemId } from '@/curriculum/types'
import { Dag, MASTERY_THRESHOLD } from './graph'
import { currentR, daysSince, isDue, type Memory } from './fsrs'
import {
  TARGET_SUCCESS,
  bktPredict,
  clamp,
  difficultyFit,
  irtItem,
  irtP,
  topicMastery,
} from './mastery'
import { dayKey, getItem, getTopic, type LearnerState } from './state'

/* ── Reviewable atoms ────────────────────────────────────────────────────── */

export interface Atom {
  id: string
  moduleId: string
  kind: 'card' | 'quiz'
  /** Author-seeded IRT difficulty. */
  b: number
  /** Number of choices, for the guessing correction. 0 for free recall. */
  choices: number
}

/** Flattens the corpus into the atoms the scheduler actually schedules. */
export function atomsOf(m: Module): Atom[] {
  const out: Atom[] = []
  for (const c of m.cards ?? []) {
    out.push({ id: itemId(m.id, 'card', c.id), moduleId: m.id, kind: 'card', b: 0, choices: 0 })
  }
  for (const q of m.quiz ?? []) {
    out.push({
      id: itemId(m.id, 'quiz', q.id),
      moduleId: m.id,
      kind: 'quiz',
      b: q.b ?? 0,
      choices: q.choices?.length ?? 0,
    })
  }
  return out
}

export function allAtoms(modules: Module[]): Atom[] {
  return modules.flatMap(atomsOf)
}

/* ── Mastery roll-up ─────────────────────────────────────────────────────── */

/**
 * Per-module mastery from everything the engine has observed.
 *
 * Kept deliberately cheap — the dashboard recomputes this for the whole corpus
 * on every state change, so it must stay linear in atom count with no
 * allocation per atom.
 */
export function moduleMastery(
  state: LearnerState,
  module: Module,
  now: Date = new Date(),
): number {
  const atoms = atomsOf(module)
  if (atoms.length === 0) {
    // Reading/project-only modules have no atoms; fall back to the BKT signal
    // so they can still be completed and still gate their descendants.
    return clamp(getTopic(state, module.id).pKnown, 0, 1)
  }

  let seen = 0
  let retention = 0
  let depth = 0
  for (const a of atoms) {
    const it = state.items[a.id]
    if (!it || it.memory.reps === 0) continue
    seen += 1
    retention += currentR(it.memory, now)
    depth += Math.min((it.memory.s ?? 0) / 60, 1)
  }

  const coverage = seen / atoms.length
  return topicMastery({
    coverage,
    retention: seen ? retention / seen : 0,
    depth: seen ? depth / seen : 0,
    pKnown: getTopic(state, module.id).pKnown,
  })
}

export function masteryMap(
  state: LearnerState,
  modules: Module[],
  now: Date = new Date(),
): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of modules) out.set(m.id, moduleMastery(state, m, now))
  return out
}

/* ── Review queue ────────────────────────────────────────────────────────── */

export interface DueAtom extends Atom {
  memory: Memory
  /** Current predicted recall probability. */
  r: number
  /** How many days past due. Negative means not yet due. */
  overdue: number
}

export function dueAtoms(
  state: LearnerState,
  modules: Module[],
  now: Date = new Date(),
): DueAtom[] {
  const suspended = new Set(state.suspended)
  const out: DueAtom[] = []

  for (const m of modules) {
    for (const a of atomsOf(m)) {
      if (suspended.has(a.id)) continue
      const it = state.items[a.id]
      if (!it || it.memory.reps === 0) continue
      if (!isDue(it.memory, now)) continue
      out.push({
        ...a,
        memory: it.memory,
        r: currentR(it.memory, now),
        overdue: (now.getTime() - new Date(it.memory.due).getTime()) / 86_400_000,
      })
    }
  }

  // Most-forgotten first: the ones closest to being lost are worth the most.
  out.sort((x, y) => x.r - y.r)
  return out
}

export function dueCount(state: LearnerState, modules: Module[], now: Date = new Date()): number {
  return dueAtoms(state, modules, now).length
}

/* ── New-material selection ──────────────────────────────────────────────── */

export interface Candidate {
  module: Module
  mastery: number
  /** Predicted probability of getting this module's items right. */
  predicted: number
  /** How many modules open up once this is mastered. */
  unlocks: number
  score: number
  reasons: string[]
}

/**
 * Ranks frontier modules.
 *
 * The weights (0.40 / 0.25 / 0.20 / 0.15) are a judgement call, not a fitted
 * result. They encode: difficulty fit matters most, staleness next, then
 * breadth of exploration, then structural leverage.
 */
export function rankFrontier(
  state: LearnerState,
  dag: Dag,
  mastery: ReadonlyMap<string, number>,
  now: Date = new Date(),
): Candidate[] {
  const frontier = dag.frontier(mastery)
  const maxUnlocks = Math.max(1, ...frontier.map((m) => dag.descendants(m.id).size))

  const out = frontier.map((m) => {
    const mast = mastery.get(m.id) ?? 0
    const topic = getTopic(state, m.id)
    const predicted = bktPredict(topic.pKnown)
    const unlocks = dag.descendants(m.id).size

    const fit = difficultyFit(predicted)
    const urgency = stalenessOf(state, m, now)
    const explore = topic.attempts === 0 ? 1 : 1 / (1 + Math.log1p(topic.attempts))
    const leverage = unlocks / maxUnlocks

    const score = 0.4 * fit + 0.25 * urgency + 0.2 * explore + 0.15 * leverage

    const reasons: string[] = []
    if (leverage > 0.5) reasons.push(`unlocks ${unlocks} modules`)
    if (urgency > 0.4) reasons.push('going stale')
    if (topic.attempts === 0) reasons.push('not started')
    if (fit > 0.85) reasons.push('right difficulty')

    return { module: m, mastery: mast, predicted, unlocks, score, reasons }
  })

  out.sort((a, b) => b.score - a.score)
  return out
}

/** 0 when everything is fresh, 1 when the module's items are nearly lost. */
function stalenessOf(state: LearnerState, m: Module, now: Date): number {
  const atoms = atomsOf(m)
  let seen = 0
  let sum = 0
  for (const a of atoms) {
    const it = state.items[a.id]
    if (!it || it.memory.reps === 0) continue
    seen += 1
    sum += currentR(it.memory, now)
  }
  if (seen === 0) return 0
  const r = sum / seen
  return clamp((0.85 - r) / 0.85, 0, 1)
}

/* ── Session assembly ────────────────────────────────────────────────────── */

export type SessionItemKind = 'review' | 'new'

export interface SessionItem {
  atom: Atom
  kind: SessionItemKind
  /** Predicted success, for the scaffolding decision. */
  predicted: number
}

export interface SessionPlan {
  items: SessionItem[]
  reviewCount: number
  newCount: number
  /** Estimated minutes, at ~9s per card and ~22s per quiz item. */
  minutes: number
}

/**
 * Builds one study session.
 *
 * Interleaving is applied across topics but never *within* a topic the learner
 * has just met: you cannot discriminate between procedures you cannot yet
 * execute. The rule of thumb encoded here is to block a brand-new module until
 * it has a few successes, then let it into the mix permanently.
 */
export function buildSession(
  state: LearnerState,
  dag: Dag,
  opts: {
    size?: number
    now?: Date
    /** Restrict to one track, e.g. when entering from the Coding page. */
    track?: string
    /** Restrict to one module. */
    moduleId?: string
  } = {},
): SessionPlan {
  const now = opts.now ?? new Date()
  const size = opts.size ?? 25
  const modules = dag
    .all()
    .filter((m) => (opts.track ? m.track === opts.track : true))
    .filter((m) => (opts.moduleId ? m.id === opts.moduleId : true))

  const mastery = masteryMap(state, dag.all(), now)
  const todayKey = dayKey(now)
  const today = state.days[todayKey]

  // ── reviews first ─────────────────────────────────────────────────────────
  const due = dueAtoms(state, modules, now)
  const reviewBudget =
    state.goals.maxReviewsPerDay > 0
      ? Math.max(0, state.goals.maxReviewsPerDay - (today?.reviews ?? 0))
      : Infinity
  const reviews = due.slice(0, Math.min(size, reviewBudget))

  const items: SessionItem[] = reviews.map((d) => ({
    atom: d,
    kind: 'review' as const,
    predicted: d.r,
  }))

  // ── then new material, if there is room and budget ────────────────────────
  const newBudget = Math.max(0, state.goals.newPerDay - (today?.newItems ?? 0))
  let room = Math.min(size - items.length, newBudget)

  if (room > 0) {
    const suspended = new Set(state.suspended)
    const ranked = rankFrontier(state, dag, mastery, now).filter((c) =>
      modules.some((m) => m.id === c.module.id),
    )

    for (const cand of ranked) {
      if (room <= 0) break
      const fresh = atomsOf(cand.module).filter((a) => {
        if (suspended.has(a.id)) return false
        const it = state.items[a.id]
        return !it || it.memory.reps === 0
      })
      // Take a contiguous run from one module rather than one atom from each:
      // initial acquisition wants blocking, not interleaving.
      const take = fresh.slice(0, Math.min(room, 8))
      for (const a of take) {
        items.push({
          atom: a,
          kind: 'new',
          predicted: irtP(state.theta, irtItem(a.b, a.choices)),
        })
      }
      room -= take.length
    }
  }

  const ordered = state.settings.interleave ? interleave(items) : items

  const minutes = ordered.reduce((a, it) => a + (it.atom.kind === 'card' ? 9 : 22), 0) / 60

  return {
    items: ordered,
    reviewCount: items.filter((i) => i.kind === 'review').length,
    newCount: items.filter((i) => i.kind === 'new').length,
    minutes: Math.round(minutes),
  }
}

/**
 * Constraint-based shuffle: never two consecutive items from the same module
 * when an alternative exists, draining the largest pool first so the mix stays
 * even to the end.
 *
 * New items are held in their original blocked order and folded in, because
 * interleaving material during first acquisition hurts rather than helps.
 */
export function interleave(items: SessionItem[]): SessionItem[] {
  const reviews = items.filter((i) => i.kind === 'review')
  const fresh = items.filter((i) => i.kind === 'new')

  const pools = new Map<string, SessionItem[]>()
  for (const it of reviews) {
    const k = it.atom.moduleId
    if (!pools.has(k)) pools.set(k, [])
    pools.get(k)!.push(it)
  }

  const out: SessionItem[] = []
  let last = ''
  while (out.length < reviews.length) {
    const avail = [...pools.entries()].filter(([, arr]) => arr.length > 0)
    if (avail.length === 0) break
    const eligible = avail.filter(([k]) => k !== last)
    const pick = (eligible.length ? eligible : avail).sort((a, b) => b[1].length - a[1].length)[0]!
    out.push(pick[1].shift()!)
    last = pick[0]
  }

  // New material goes after the reviews: retrieval first while attention is
  // freshest, acquisition second.
  return [...out, ...fresh]
}

/* ── Daily plan (the "Today's Focus" list) ───────────────────────────────── */

export interface PlanTask {
  id: string
  title: string
  /** Short label: the track name or "Review". */
  context: string
  minutes: number
  /** Where tapping it should go. */
  href: string
  done: boolean
  tone: 'review' | 'study' | 'practice' | 'habit'
}

export function dailyPlan(
  state: LearnerState,
  dag: Dag,
  now: Date = new Date(),
): PlanTask[] {
  const key = dayKey(now)
  const done = (id: string) => !!state.tasks[`${key}::${id}`]
  const mastery = masteryMap(state, dag.all(), now)
  const due = dueAtoms(state, dag.all(), now)
  const tasks: PlanTask[] = []

  if (due.length > 0) {
    const urgent = due.filter((d) => d.r < 0.8).length
    tasks.push({
      id: 'review',
      title: `Clear ${due.length} scheduled review${due.length === 1 ? '' : 's'}`,
      context: urgent > 0 ? `${urgent} at risk of being lost` : 'Retention maintenance',
      minutes: Math.max(5, Math.round((due.length * 11) / 60)),
      href: '#/review',
      done: done('review'),
      tone: 'review',
    })
  }

  const ranked = rankFrontier(state, dag, mastery, now)
  for (const cand of ranked.slice(0, 3)) {
    const m = cand.module
    tasks.push({
      id: `study-${m.id}`,
      title: cand.mastery > 0.05 ? `Continue ${m.title}` : `Start ${m.title}`,
      context: `${trackLabel(m.track)} · ${cand.reasons[0] ?? 'next in sequence'}`,
      minutes: 30,
      href: `#/module/${m.id}`,
      done: done(`study-${m.id}`),
      tone: 'study',
    })
  }

  // One practice task, drawn from the highest-ranked module that has exercises.
  const withExercise = ranked.find((c) => (c.module.exercises?.length ?? 0) > 0)
  if (withExercise) {
    const ex = withExercise.module.exercises![0]!
    tasks.push({
      id: `practice-${ex.id}`,
      title: ex.title,
      context: `Practice · ${trackLabel(withExercise.module.track)}`,
      minutes: Math.round((ex.hours ?? 0.5) * 60),
      href: `#/module/${withExercise.module.id}?ex=${ex.id}`,
      done: done(`practice-${ex.id}`),
      tone: 'practice',
    })
  }

  return tasks.slice(0, 5)
}

export function trackLabel(track: string): string {
  switch (track) {
    case 'foundations':
      return 'Foundations'
    case 'coding':
      return 'Coding'
    case 'gnc':
      return 'GNC'
    case 'career':
      return 'Career'
    default:
      return track
  }
}

/* ── Projection ──────────────────────────────────────────────────────────────
   Always presented as a range. A single confident date that slips destroys
   trust in every other number the product shows. */

export interface Projection {
  /** null when there is not enough history, or no forward progress. */
  eta: Date | null
  low: Date | null
  high: Date | null
  /** Mastery points per active day, EWMA. */
  velocity: number
  reason?: 'no_history' | 'no_progress'
}

export function projectCompletion(
  state: LearnerState,
  dag: Dag,
  target = MASTERY_THRESHOLD,
  now: Date = new Date(),
): Projection {
  const history = Object.values(state.days)
    .filter((d) => d.readiness > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (history.length < 4) {
    return { eta: null, low: null, high: null, velocity: 0, reason: 'no_history' }
  }

  // EWMA of daily readiness gain — robust to irregular study patterns.
  let v = 0
  const gains: number[] = []
  for (let i = 1; i < history.length; i++) {
    const days = Math.max(1, daysBetween(history[i - 1]!.date, history[i]!.date))
    const g = (history[i]!.readiness - history[i - 1]!.readiness) / days
    gains.push(g)
    v = i === 1 ? g : 0.2 * g + 0.8 * v
  }

  if (v <= 0) return { eta: null, low: null, high: null, velocity: v, reason: 'no_progress' }

  const mastery = masteryMap(state, dag.all(), now)
  const remaining = Math.max(0, target - dag.readiness(mastery))

  // The last tenth costs disproportionately more than the first, and review
  // load grows as the collection does. 1.35 is a blunt but honest allowance.
  const FRICTION = 1.35
  const days = (remaining / v) * FRICTION
  const sd = stddev(gains.slice(-30))

  const mk = (d: number) => {
    const out = new Date(now)
    out.setDate(out.getDate() + Math.round(clamp(d, 0, 365 * 25)))
    return out
  }

  return {
    eta: mk(days),
    low: mk((remaining / (v + sd)) * FRICTION),
    high: mk((remaining / Math.max(v - sd, v * 0.3)) * FRICTION),
    velocity: v,
  }
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
}

function stddev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)
  return Math.sqrt(v)
}

/* ── Deadline mode ───────────────────────────────────────────────────────────
   FSRS optimises for indefinite retention. When there is a date — an interview
   — the objective changes: intervals must be capped so the last review lands
   within the optimal gap before the deadline. The gap shrinks as a fraction of
   the retention interval as that interval grows. */

export function optimalGapDays(retentionIntervalDays: number): number {
  const r = retentionIntervalDays
  const pct = r <= 7 ? 0.3 : r <= 35 ? 0.22 : r <= 180 ? 0.15 : 0.08
  return Math.max(1, r * pct)
}

/** Desired retention, raised as a deadline approaches. */
export function retentionForDeadline(base: number, targetDate?: string, now: Date = new Date()): number {
  if (!targetDate) return base
  const days = (new Date(targetDate).getTime() - now.getTime()) / 86_400_000
  if (!Number.isFinite(days) || days > 120) return base
  if (days <= 0) return base
  // Ramp from `base` at 120 days out to 0.95 on the day.
  const t = 1 - days / 120
  return clamp(base + (0.95 - base) * t, base, 0.95)
}

/** Days since the module was last touched — used by the staleness diagnosis. */
export function moduleIdleDays(state: LearnerState, m: Module, now: Date = new Date()): number {
  let newest: string | null = null
  for (const a of atomsOf(m)) {
    const it = state.items[a.id]
    if (!it?.memory.last) continue
    if (!newest || it.memory.last > newest) newest = it.memory.last
  }
  return newest ? daysSince(newest, now) : Infinity
}

/** Convenience re-export so pages import one module rather than three. */
export { getItem, MASTERY_THRESHOLD, TARGET_SUCCESS }
