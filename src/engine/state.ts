/* ============================================================================
   ORBIT — learner state
   ----------------------------------------------------------------------------
   Everything the engine knows about one person. This is the shape that is
   persisted to IndexedDB and the shape that export/import round-trips, so it
   is versioned and every field is optional-safe on read.
   ========================================================================== */
import type { Memory } from './fsrs'
import { newCard } from './fsrs'
import {
  coerceLive,
  coerceMedia,
  coercePlace,
  coerceResume,
  type LiveSession,
  type MediaProgress,
  type ResumePoint,
} from './resume'

export const STATE_VERSION = 1

export interface ItemState {
  /** FSRS memory for this reviewable atom. */
  memory: Memory
  /** Elo-calibrated difficulty on the logit scale, seeded from the author's `b`. */
  difficulty: number
  attempts: number
  correct: number
  /** Number of Elo updates this item has received — drives its K factor. */
  n: number
}

export interface TopicState {
  /** BKT posterior that the skill is known. */
  pKnown: number
  attempts: number
  correct: number
  /** ISO timestamp of first contact. */
  startedAt?: string
  /** ISO timestamp the module first crossed the mastery threshold. */
  completedAt?: string
  /** Minutes of recorded study time. */
  minutes: number
}

export interface Attempt {
  /** ISO timestamp. */
  at: string
  itemId: string
  moduleId: string
  correct: boolean
  /** Stated confidence before the reveal, 0–1. Omitted when not asked. */
  confidence?: number
  /** Retrievability at the moment of the attempt — for the calibration chart. */
  r?: number
  /** Milliseconds spent on the item. */
  ms?: number
}

export interface DaySnapshot {
  /** yyyy-mm-dd, local time. */
  date: string
  reviews: number
  correct: number
  newItems: number
  minutes: number
  /** Overall readiness at the end of that day, for the trend chart. */
  readiness: number
}

export interface Goals {
  /**
   * Weekly rather than daily on purpose: a daily target fails on the first
   * busy day and converts a good week into a felt failure, while a weekly one
   * absorbs the variance and keeps the sense of competence intact.
   */
  weeklyMinutes: number
  /** Cap on new items introduced per day. Review load grows; this contains it. */
  newPerDay: number
  /** Cap on total reviews per day. 0 disables the cap. */
  maxReviewsPerDay: number
  /** Optional deadline the planner tightens intervals toward. */
  targetDate?: string
  /** Implementation intention — cue, time, place. Habit research, not decoration. */
  cue?: string
  time?: string
  place?: string
}

export interface Settings {
  displayName: string
  /** FSRS desired retention. Clamped to [0.8, 0.95] in the UI. */
  desiredRetention: number
  /** Ask for a confidence rating before revealing answers. */
  askConfidence: boolean
  /** Mix topics within a session rather than blocking them. */
  interleave: boolean
  /** Fuzz review intervals to avoid pile-ups. */
  fuzz: boolean
  reduceMotion: boolean
  /** Personalised FSRS weights, once enough history exists to fit them. */
  weights?: number[]
  /** Set once the first-run welcome has been read or dismissed. */
  onboarded?: boolean
}

export interface LearnerState {
  version: number
  createdAt: string
  updatedAt: string
  /** Global ability estimate on the logit scale. */
  theta: number
  /** Number of Elo updates θ has received — drives its K factor. */
  thetaN: number
  items: Record<string, ItemState>
  topics: Record<string, TopicState>
  /** Rolling log, newest last. Trimmed to ATTEMPT_LOG_LIMIT. */
  attempts: Attempt[]
  days: Record<string, DaySnapshot>
  /** Completion flags for generated daily tasks, keyed `yyyy-mm-dd::taskId`. */
  tasks: Record<string, boolean>
  /** Saved playground buffers, keyed by exercise id. */
  code: Record<string, string>
  /** Items the learner has suspended (usually leeches awaiting a rewrite). */
  suspended: string[]
  /** Bookmarked module ids. */
  pinned: string[]
  /**
   * Module ids whose Learn step the learner has marked as worked through, with
   * the ISO time they did so. Purely a progress marker for the module page's
   * study path; nothing in the scheduler reads it.
   */
  read: Record<string, string>
  goals: Goals
  settings: Settings
  /**
   * Where she was when the app last closed — for any reason, including the
   * power going out. Read by the "pick up where you left off" card.
   */
  resume?: ResumePoint
  /**
   * A session that was still running. Restoring it puts her back on the same
   * question with the same text still in the box.
   */
  live?: LiveSession
  /** Playback position per video, keyed by video id. */
  media: Record<string, MediaProgress>
  /** Position within a lesson, 0-1, keyed `moduleId::lessonId`. */
  place: Record<string, number>
  /**
   * Workbench tasks she has got passing, task id to ISO time.
   *
   * Kept apart from `topics` and `items` on purpose. Nothing here reaches
   * mastery, readiness, the review queue or the daily plan: the workbench is
   * the thing she can do when she cannot face the thing that counts, and it
   * stops being that the moment it starts counting.
   */
  bench: Record<string, string>
  /**
   * Hawthorne temporary postings she has already been shown, id to the ISO
   * time it was first noticed.
   *
   * Kept so that "new since you last looked" survives a restart. Ids rather
   * than titles: SpaceX reposts the same title regularly and a reposted
   * requisition is a genuinely new chance to apply.
   */
  jobsSeen: Record<string, string>
  /** ISO time of the last successful check of the job board. */
  jobsCheckedAt?: string
}

export const ATTEMPT_LOG_LIMIT = 4000

export const DEFAULT_GOALS: Goals = {
  weeklyMinutes: 600,
  newPerDay: 12,
  maxReviewsPerDay: 180,
}

export const DEFAULT_SETTINGS: Settings = {
  displayName: 'Future Engineer',
  desiredRetention: 0.9,
  askConfidence: true,
  interleave: true,
  fuzz: true,
  reduceMotion: false,
}

export function newLearnerState(now: Date = new Date()): LearnerState {
  const iso = now.toISOString()
  return {
    version: STATE_VERSION,
    createdAt: iso,
    updatedAt: iso,
    theta: 0,
    thetaN: 0,
    items: {},
    topics: {},
    attempts: [],
    days: {},
    tasks: {},
    code: {},
    suspended: [],
    pinned: [],
    read: {},
    goals: { ...DEFAULT_GOALS },
    settings: { ...DEFAULT_SETTINGS },
    media: {},
    place: {},
    bench: {},
    jobsSeen: {},
  }
}

/**
 * Coerces anything that came off disk or out of an import file into a valid
 * state. Import is the one place untrusted data enters the engine, so every
 * field is checked rather than trusted.
 */
export function migrateState(raw: unknown, now: Date = new Date()): LearnerState {
  const base = newLearnerState(now)
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<LearnerState>

  const out: LearnerState = {
    ...base,
    createdAt: str(r.createdAt) ?? base.createdAt,
    updatedAt: str(r.updatedAt) ?? base.updatedAt,
    theta: num(r.theta, 0, -6, 6),
    thetaN: Math.max(0, Math.round(num(r.thetaN, 0, 0, 1e9))),
    items: {},
    topics: {},
    attempts: Array.isArray(r.attempts) ? r.attempts.filter(isAttempt).slice(-ATTEMPT_LOG_LIMIT) : [],
    days: {},
    tasks: isRecordOf(r.tasks, 'boolean') ? { ...r.tasks } : {},
    code: isRecordOf(r.code, 'string') ? { ...r.code } : {},
    suspended: Array.isArray(r.suspended) ? r.suspended.filter((s) => typeof s === 'string') : [],
    pinned: Array.isArray(r.pinned) ? r.pinned.filter((s) => typeof s === 'string') : [],
    read: isRecordOf(r.read, 'string') ? { ...r.read } : {},
    goals: { ...base.goals, ...pickGoals(r.goals) },
    settings: { ...base.settings, ...pickSettings(r.settings) },
    media: {},
    place: coercePlace(r.place),
    bench: isRecordOf(r.bench, 'string') ? { ...r.bench } : {},
    jobsSeen: isRecordOf(r.jobsSeen, 'string') ? { ...r.jobsSeen } : {},
    version: STATE_VERSION,
  }

  const jobsCheckedAt = str(r.jobsCheckedAt)
  if (jobsCheckedAt) out.jobsCheckedAt = jobsCheckedAt

  const resume = coerceResume(r.resume)
  if (resume) out.resume = resume
  const live = coerceLive(r.live)
  if (live) out.live = live
  if (r.media && typeof r.media === 'object') {
    for (const [k, v] of Object.entries(r.media)) {
      const m = coerceMedia(v)
      if (m) out.media[k] = m
    }
  }

  if (r.items && typeof r.items === 'object') {
    for (const [k, v] of Object.entries(r.items)) {
      const item = coerceItem(v)
      if (item) out.items[k] = item
    }
  }
  if (r.topics && typeof r.topics === 'object') {
    for (const [k, v] of Object.entries(r.topics)) {
      const t = coerceTopic(v)
      if (t) out.topics[k] = t
    }
  }
  if (r.days && typeof r.days === 'object') {
    for (const [k, v] of Object.entries(r.days)) {
      const d = coerceDay(v, k)
      if (d) out.days[k] = d
    }
  }

  return out
}

/* ── Accessors ───────────────────────────────────────────────────────────── */

export function getItem(state: LearnerState, id: string, seedDifficulty = 0): ItemState {
  const hit = state.items[id]
  if (hit) return hit
  return { memory: newCard(), difficulty: seedDifficulty, attempts: 0, correct: 0, n: 0 }
}

export function getTopic(state: LearnerState, id: string): TopicState {
  return state.topics[id] ?? { pKnown: 0, attempts: 0, correct: 0, minutes: 0 }
}

/** yyyy-mm-dd in the viewer's local timezone. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dayKeysBack(n: number, from: Date = new Date()): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from)
    d.setDate(d.getDate() - i)
    out.push(dayKey(d))
  }
  return out
}

/**
 * Consecutive days with any recorded activity, counting back from today.
 *
 * A day missed today does not break the streak until tomorrow — the streak is
 * information about consistency, not a countdown designed to create anxiety
 * before midnight.
 */
export function streak(state: LearnerState, now: Date = new Date()): number {
  let n = 0
  const d = new Date(now)
  // Today not being done yet is not a break.
  if (!hasActivity(state, dayKey(d))) d.setDate(d.getDate() - 1)
  for (;;) {
    if (!hasActivity(state, dayKey(d))) break
    n += 1
    d.setDate(d.getDate() - 1)
  }
  return n
}

function hasActivity(state: LearnerState, key: string): boolean {
  const d = state.days[key]
  return !!d && (d.reviews > 0 || d.newItems > 0 || d.minutes > 0)
}

export function minutesThisWeek(state: LearnerState, now: Date = new Date()): number {
  // Week starts Monday.
  const start = new Date(now)
  const dow = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - dow)
  let total = 0
  for (let i = 0; i <= dow; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    total += state.days[dayKey(d)]?.minutes ?? 0
  }
  return total
}

/* ── Coercion helpers ────────────────────────────────────────────────────── */

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function num(v: unknown, dflt: number, lo = -Infinity, hi = Infinity): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return dflt
  return Math.min(Math.max(v, lo), hi)
}

function bool(v: unknown, dflt: boolean): boolean {
  return typeof v === 'boolean' ? v : dflt
}

function isRecordOf(v: unknown, t: 'string' | 'boolean'): v is Record<string, never> {
  if (!v || typeof v !== 'object') return false
  return Object.values(v).every((x) => typeof x === t)
}

function isAttempt(v: unknown): v is Attempt {
  if (!v || typeof v !== 'object') return false
  const a = v as Attempt
  return typeof a.at === 'string' && typeof a.itemId === 'string' && typeof a.correct === 'boolean'
}

function coerceItem(v: unknown): ItemState | null {
  if (!v || typeof v !== 'object') return null
  const i = v as Partial<ItemState>
  const m = i.memory
  if (!m || typeof m !== 'object') return null
  const mm = m as Partial<Memory>
  return {
    memory: {
      s: typeof mm.s === 'number' && Number.isFinite(mm.s) ? mm.s : null,
      d: typeof mm.d === 'number' && Number.isFinite(mm.d) ? Math.min(10, Math.max(1, mm.d)) : null,
      state:
        mm.state === 'learning' || mm.state === 'review' || mm.state === 'relearning'
          ? mm.state
          : 'new',
      step: Math.max(0, Math.round(num(mm.step, 0, 0, 20))),
      last: str(mm.last) ?? null,
      due: str(mm.due) ?? new Date().toISOString(),
      reps: Math.max(0, Math.round(num(mm.reps, 0, 0, 1e6))),
      lapses: Math.max(0, Math.round(num(mm.lapses, 0, 0, 1e6))),
    },
    difficulty: num(i.difficulty, 0, -6, 6),
    attempts: Math.max(0, Math.round(num(i.attempts, 0, 0, 1e6))),
    correct: Math.max(0, Math.round(num(i.correct, 0, 0, 1e6))),
    n: Math.max(0, Math.round(num(i.n, 0, 0, 1e6))),
  }
}

function coerceTopic(v: unknown): TopicState | null {
  if (!v || typeof v !== 'object') return null
  const t = v as Partial<TopicState>
  return {
    pKnown: num(t.pKnown, 0, 0, 1),
    attempts: Math.max(0, Math.round(num(t.attempts, 0, 0, 1e6))),
    correct: Math.max(0, Math.round(num(t.correct, 0, 0, 1e6))),
    startedAt: str(t.startedAt),
    completedAt: str(t.completedAt),
    minutes: Math.max(0, num(t.minutes, 0, 0, 1e7)),
  }
}

function coerceDay(v: unknown, key: string): DaySnapshot | null {
  if (!v || typeof v !== 'object') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const d = v as Partial<DaySnapshot>
  return {
    date: key,
    reviews: Math.max(0, Math.round(num(d.reviews, 0, 0, 1e6))),
    correct: Math.max(0, Math.round(num(d.correct, 0, 0, 1e6))),
    newItems: Math.max(0, Math.round(num(d.newItems, 0, 0, 1e6))),
    minutes: Math.max(0, num(d.minutes, 0, 0, 1440)),
    readiness: num(d.readiness, 0, 0, 1),
  }
}

function pickGoals(v: unknown): Partial<Goals> {
  if (!v || typeof v !== 'object') return {}
  const g = v as Partial<Goals>
  return {
    weeklyMinutes: num(g.weeklyMinutes, DEFAULT_GOALS.weeklyMinutes, 0, 10080),
    newPerDay: Math.round(num(g.newPerDay, DEFAULT_GOALS.newPerDay, 0, 200)),
    maxReviewsPerDay: Math.round(num(g.maxReviewsPerDay, DEFAULT_GOALS.maxReviewsPerDay, 0, 2000)),
    targetDate: str(g.targetDate),
    cue: str(g.cue),
    time: str(g.time),
    place: str(g.place),
  }
}

function pickSettings(v: unknown): Partial<Settings> {
  if (!v || typeof v !== 'object') return {}
  const s = v as Partial<Settings>
  return {
    displayName: str(s.displayName)?.slice(0, 60) || DEFAULT_SETTINGS.displayName,
    desiredRetention: num(s.desiredRetention, 0.9, 0.8, 0.95),
    askConfidence: bool(s.askConfidence, DEFAULT_SETTINGS.askConfidence),
    interleave: bool(s.interleave, DEFAULT_SETTINGS.interleave),
    fuzz: bool(s.fuzz, DEFAULT_SETTINGS.fuzz),
    reduceMotion: bool(s.reduceMotion, DEFAULT_SETTINGS.reduceMotion),
    weights: Array.isArray(s.weights) && s.weights.every((x) => typeof x === 'number') ? s.weights : undefined,
    // Only ever true: spreading an explicit `undefined` over the defaults
    // would still produce a key, and the flag is absent until it is set.
    ...(s.onboarded === true ? { onboarded: true } : {}),
  }
}
