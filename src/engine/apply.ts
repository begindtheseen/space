/* ============================================================================
   ORBIT — recording an attempt
   ----------------------------------------------------------------------------
   One entry point, `applyAttempt`, which is the only place learner state is
   allowed to change in response to study. Everything it touches moves
   together, in one immutable update, so a partial write can never leave the
   FSRS memory and the BKT posterior disagreeing about what just happened.

   Five things happen per attempt:
     1. FSRS reschedules the item
     2. Elo nudges the learner's ability and the item's difficulty
     3. BKT updates the module's mastery posterior
     4. the attempt is appended to the rolling log
     5. the day's counters tick
   ========================================================================== */
import type { Module } from '@/curriculum/types'
import { parseItemId } from '@/curriculum/types'
import { DEFAULT_CONFIG, review, type FsrsConfig, type Grade } from './fsrs'
import { bktParams, bktUpdate, eloUpdate } from './mastery'
import { retentionForDeadline } from './scheduler'
import {
  ATTEMPT_LOG_LIMIT,
  dayKey,
  getItem,
  getTopic,
  type Attempt,
  type LearnerState,
} from './state'

export interface AttemptInput {
  itemId: string
  grade: Grade
  /** Number of choices offered, for the Elo guessing correction. */
  choices?: number
  /** Stated confidence before the reveal, 0–1. */
  confidence?: number
  /** Milliseconds spent. */
  ms?: number
}

export interface AttemptOutcome {
  state: LearnerState
  /** Minutes until this item is due again. */
  dueInMinutes: number
  /** Retrievability measured at the moment of the attempt. */
  reviewedAtR: number | null
  /** True when this attempt pushed the module over the mastery threshold. */
  moduleCompleted: boolean
}

/** Anything at Hard or better counts as a successful retrieval. */
export const isCorrect = (g: Grade): boolean => g >= 2

export function fsrsConfigFor(state: LearnerState, now: Date = new Date()): FsrsConfig {
  return {
    ...DEFAULT_CONFIG,
    w: state.settings.weights ?? DEFAULT_CONFIG.w,
    desiredRetention: retentionForDeadline(
      state.settings.desiredRetention,
      state.goals.targetDate,
      now,
    ),
    enableFuzz: state.settings.fuzz,
  }
}

export function applyAttempt(
  state: LearnerState,
  input: AttemptInput,
  module: Module | undefined,
  now: Date = new Date(),
  masteryAfter?: (s: LearnerState) => number,
): AttemptOutcome {
  const parsed = parseItemId(input.itemId)
  const moduleId = module?.id ?? parsed?.moduleId ?? ''
  const correct = isCorrect(input.grade)

  // ── 1. FSRS ──────────────────────────────────────────────────────────────
  const seedB = seedDifficultyFor(module, input.itemId)
  const prev = getItem(state, input.itemId, seedB)
  const cfg = fsrsConfigFor(state, now)
  const res = review(prev.memory, input.grade, now, cfg)

  // ── 2. Elo ───────────────────────────────────────────────────────────────
  const elo = eloUpdate(
    state.theta,
    prev.difficulty,
    correct,
    state.thetaN,
    prev.n,
    input.choices ?? 0,
  )

  // ── 3. BKT ───────────────────────────────────────────────────────────────
  const topic = getTopic(state, moduleId)
  // Guess rate follows the item format: a 4-choice question is right 25% of the
  // time from nothing, a free-recall card essentially never is.
  const params = bktParams({
    pGuess: input.choices && input.choices > 1 ? 1 / input.choices : 0.05,
  })
  const pKnown = bktUpdate(topic.pKnown, correct, params)

  const wasComplete = !!topic.completedAt

  // ── 4 & 5. log and counters ──────────────────────────────────────────────
  const attempt: Attempt = {
    at: now.toISOString(),
    itemId: input.itemId,
    moduleId,
    correct,
    ...(input.confidence != null ? { confidence: input.confidence } : {}),
    ...(res.reviewedAtR != null ? { r: res.reviewedAtR } : {}),
    ...(input.ms != null ? { ms: input.ms } : {}),
  }

  const key = dayKey(now)
  const prevDay = state.days[key] ?? {
    date: key,
    reviews: 0,
    correct: 0,
    newItems: 0,
    minutes: 0,
    readiness: 0,
  }
  const wasNew = prev.memory.reps === 0

  const next: LearnerState = {
    ...state,
    updatedAt: now.toISOString(),
    theta: elo.theta,
    thetaN: state.thetaN + 1,
    items: {
      ...state.items,
      [input.itemId]: {
        memory: res.memory,
        difficulty: elo.difficulty,
        attempts: prev.attempts + 1,
        correct: prev.correct + (correct ? 1 : 0),
        n: prev.n + 1,
      },
    },
    topics: {
      ...state.topics,
      [moduleId]: {
        ...topic,
        pKnown,
        attempts: topic.attempts + 1,
        correct: topic.correct + (correct ? 1 : 0),
        startedAt: topic.startedAt ?? now.toISOString(),
        minutes: topic.minutes + (input.ms ?? 0) / 60000,
      },
    },
    attempts: [...state.attempts, attempt].slice(-ATTEMPT_LOG_LIMIT),
    days: {
      ...state.days,
      [key]: {
        ...prevDay,
        reviews: prevDay.reviews + 1,
        correct: prevDay.correct + (correct ? 1 : 0),
        newItems: prevDay.newItems + (wasNew ? 1 : 0),
        minutes: prevDay.minutes + (input.ms ?? 0) / 60000,
      },
    },
  }

  // Readiness is recomputed by the caller (it needs the DAG, which this module
  // deliberately does not import) and stamped onto the day for the trend chart.
  let moduleCompleted = false
  if (masteryAfter) {
    const m = masteryAfter(next)
    next.days[key] = { ...next.days[key]!, readiness: m }
    if (!wasComplete && m >= 0.9 && moduleId) {
      next.topics[moduleId] = { ...next.topics[moduleId]!, completedAt: now.toISOString() }
      moduleCompleted = true
    }
  }

  return {
    state: next,
    dueInMinutes: res.dueInMinutes,
    reviewedAtR: res.reviewedAtR,
    moduleCompleted,
  }
}

function seedDifficultyFor(module: Module | undefined, id: string): number {
  if (!module) return 0
  const parsed = parseItemId(id)
  if (!parsed || parsed.kind !== 'quiz') return 0
  return module.quiz?.find((q) => q.id === parsed.localId)?.b ?? 0
}

/* ── Non-study state transitions ─────────────────────────────────────────── */

export function toggleTask(state: LearnerState, taskId: string, now: Date = new Date()): LearnerState {
  const key = `${dayKey(now)}::${taskId}`
  const tasks = { ...state.tasks }
  if (tasks[key]) delete tasks[key]
  else tasks[key] = true
  return { ...state, tasks, updatedAt: now.toISOString() }
}

export function toggleSuspend(state: LearnerState, itemId: string): LearnerState {
  const has = state.suspended.includes(itemId)
  return {
    ...state,
    suspended: has ? state.suspended.filter((i) => i !== itemId) : [...state.suspended, itemId],
    updatedAt: new Date().toISOString(),
  }
}

export function togglePin(state: LearnerState, moduleId: string): LearnerState {
  const has = state.pinned.includes(moduleId)
  return {
    ...state,
    pinned: has ? state.pinned.filter((i) => i !== moduleId) : [...state.pinned, moduleId],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Marks a module's Learn step as worked through. Idempotent: the first time
 * stands, so the module page can show when the material was first studied.
 */
export function markRead(state: LearnerState, moduleId: string, now: Date = new Date()): LearnerState {
  if (state.read[moduleId]) return state
  return {
    ...state,
    read: { ...state.read, [moduleId]: now.toISOString() },
    updatedAt: now.toISOString(),
  }
}

/** Records that the first-run welcome has been read or dismissed. */
export function setOnboarded(state: LearnerState, now: Date = new Date()): LearnerState {
  if (state.settings.onboarded) return state
  return {
    ...state,
    settings: { ...state.settings, onboarded: true },
    updatedAt: now.toISOString(),
  }
}

export function saveCode(state: LearnerState, exerciseId: string, code: string): LearnerState {
  return {
    ...state,
    code: { ...state.code, [exerciseId]: code },
    updatedAt: new Date().toISOString(),
  }
}

/** Records elapsed study time that did not come from a graded attempt. */
export function logMinutes(state: LearnerState, minutes: number, now: Date = new Date()): LearnerState {
  if (minutes <= 0) return state
  const key = dayKey(now)
  const prev = state.days[key] ?? {
    date: key,
    reviews: 0,
    correct: 0,
    newItems: 0,
    minutes: 0,
    readiness: 0,
  }
  return {
    ...state,
    days: { ...state.days, [key]: { ...prev, minutes: prev.minutes + minutes } },
    updatedAt: now.toISOString(),
  }
}
