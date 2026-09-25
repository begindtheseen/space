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
import {
  minutesSpent,
  parkNote,
  pauseRun,
  resumeRun,
  startRun,
  unparkNote,
  type FocusPick,
} from './focus'
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

/**
 * Marks one lesson as read, keyed `<moduleId>::<lessonId>`. When that was the
 * last unread lesson of the module, the module itself is marked studied too.
 */
export function markLessonRead(
  state: LearnerState,
  moduleId: string,
  lessonId: string,
  allLessonIds: readonly string[],
  now: Date = new Date(),
): LearnerState {
  const key = `${moduleId}::${lessonId}`
  if (state.read[key]) return state
  const read = { ...state.read, [key]: now.toISOString() }
  const every = allLessonIds.length > 0 && allLessonIds.every((id) => !!read[`${moduleId}::${id}`])
  if (every && !read[moduleId]) read[moduleId] = now.toISOString()
  return { ...state, read, updatedAt: now.toISOString() }
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

/**
 * Learn mode: records that a lesson passed. The first pass is the one kept —
 * passing it again later does not move the date.
 */
export function markLearned(state: LearnerState, lessonId: string, now: Date = new Date()): LearnerState {
  if (state.learn[lessonId]) return state
  return {
    ...state,
    learn: { ...state.learn, [lessonId]: now.toISOString() },
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

/**
 * Records that a workbench task is passing.
 *
 * Note what this does not touch: no topic posterior, no item schedule, no
 * attempt log, no day snapshot. The workbench is deliberately outside the
 * engine — see the note on `LearnerState.bench`. It only ever records the
 * first time a task passed, so re-running a solved task cannot reset it.
 */
export function markBenchSolved(
  state: LearnerState,
  taskId: string,
  now: Date = new Date(),
): LearnerState {
  if (state.bench[taskId]) return state
  return { ...state, bench: { ...state.bench, [taskId]: now.toISOString() } }
}

/**
 * Records that these postings have been shown, and when the board was checked.
 *
 * Called after she has actually seen the list, not when it is fetched: the
 * point of the record is "has she been told", and marking on fetch would let a
 * posting go unseen because the app happened to refresh in the background.
 */
export function markJobsSeen(
  state: LearnerState,
  ids: string[],
  now: Date = new Date(),
): LearnerState {
  const iso = now.toISOString()
  const fresh = ids.filter((id) => !state.jobsSeen[id])
  if (fresh.length === 0 && state.jobsCheckedAt === iso) return state
  const jobsSeen = { ...state.jobsSeen }
  for (const id of fresh) jobsSeen[id] = iso
  return { ...state, jobsSeen, jobsCheckedAt: iso }
}

/* ── Focus blocks ─────────────────────────────────────────────────────────────
   The block is persisted the moment it starts, not when it ends. A block that
   only exists in a React ref is a block the power cut can erase, and erasing
   it would mean she did the work and the app forgot. */

export function startFocus(
  state: LearnerState,
  pick: FocusPick,
  minutes: number,
  now: Date = new Date(),
): LearnerState {
  return { ...state, focus: startRun(pick, minutes, now), updatedAt: now.toISOString() }
}

export function pauseFocus(state: LearnerState, now: Date = new Date()): LearnerState {
  if (!state.focus) return state
  return { ...state, focus: pauseRun(state.focus, now), updatedAt: now.toISOString() }
}

export function resumeFocus(state: LearnerState, now: Date = new Date()): LearnerState {
  if (!state.focus) return state
  return { ...state, focus: resumeRun(state.focus, now), updatedAt: now.toISOString() }
}

/**
 * Ends the running block and banks what it was worth.
 *
 * Every block that is ended is credited, including one stopped early. The
 * alternative — crediting only blocks that ran the full length — would mean
 * that stopping at twelve minutes records the same as never starting, and the
 * lesson she would learn from that is to not start.
 */
export function endFocus(state: LearnerState, now: Date = new Date()): LearnerState {
  const run = state.focus
  if (!run) return state
  const key = dayKey(now)
  const prev = state.days[key] ?? {
    date: key,
    reviews: 0,
    correct: 0,
    newItems: 0,
    minutes: 0,
    readiness: 0,
  }
  const { focus: _ended, ...rest } = state
  return {
    ...rest,
    days: {
      ...state.days,
      [key]: {
        ...prev,
        minutes: prev.minutes + minutesSpent(run, now),
        blocks: (prev.blocks ?? 0) + 1,
      },
    },
    updatedAt: now.toISOString(),
  }
}

/** Drops a block without crediting it. For a mis-start, not for giving up. */
export function discardFocus(state: LearnerState, now: Date = new Date()): LearnerState {
  if (!state.focus) return state
  const { focus: _dropped, ...rest } = state
  return { ...rest, updatedAt: now.toISOString() }
}

export function park(state: LearnerState, text: string, now: Date = new Date()): LearnerState {
  const parked = parkNote(state.parked, text, now)
  if (parked === state.parked) return state
  return { ...state, parked, updatedAt: now.toISOString() }
}

export function unpark(state: LearnerState, at: string, now: Date = new Date()): LearnerState {
  const parked = unparkNote(state.parked, at)
  if (parked.length === state.parked.length) return state
  return { ...state, parked, updatedAt: now.toISOString() }
}
