/* ============================================================================
   Learn mode — practice, gates and re-tests
   ----------------------------------------------------------------------------
   A lesson's main task shows she can do the thing once, with the explanation
   open above it. Mastery needs more than that:

     practice   5–8 more problems on the same idea, with new data and new
                twists, straight after the lesson.
     gate       at the end of a course, problems she has never seen, in one
                timed sitting, with no hints and no solutions. Passing it is
                what makes the course mastered rather than finished.
     re-tests   a passed lesson comes back days, then weeks, then months
                later as one of its practice problems, without hints. A miss
                sends it back to the start of the ladder.

   Everything here is plain functions over the learner state; the page draws
   them and the grader runs a problem exactly as it runs a lesson.
   ========================================================================== */
import type { LearnExercise, LearnLesson, LearnTrack } from './types'

/** A practice or gate problem as a lesson of its own, so the runner and the grader need nothing new. */
export function asLesson(lesson: LearnLesson, ex: LearnExercise): LearnLesson {
  const { schema: _schema, stdin: _stdin, gate: _gate, ...rest } = lesson
  const schema = ex.schema ?? lesson.schema
  return {
    ...rest,
    id: ex.id,
    title: ex.title,
    task: ex.task,
    starter: ex.starter,
    solution: ex.solution,
    hints: ex.hints,
    checks: ex.checks,
    ...(ex.stdin ? { stdin: ex.stdin } : {}),
    ...(schema ? { schema } : {}),
    practice: [],
  }
}

/** Every graded thing a lesson holds: its own task, then its practice problems (or a gate's problems). */
export function gradedUnits(lesson: LearnLesson): LearnLesson[] {
  if (lesson.gate) return lesson.gate.problems.map((p) => asLesson(lesson, p))
  return [lesson, ...lesson.practice.map((p) => asLesson(lesson, p))]
}

/** A lesson is mastered when its task and every practice problem have passed; a gate, when it has. */
export function lessonMastered(lesson: LearnLesson, passed: Record<string, string>): boolean {
  if (!passed[lesson.id]) return false
  return lesson.practice.every((p) => !!passed[p.id])
}

export function practiceDone(lesson: LearnLesson, passed: Record<string, string>): number {
  return lesson.practice.filter((p) => passed[p.id]).length
}

/** The course's mastery gate, if it has one (the last lesson, by convention). */
export function gateOf(track: LearnTrack): LearnLesson | undefined {
  return track.lessons.find((l) => l.gate)
}

/** A course is mastered when every lesson is mastered and its gate is passed. */
export function courseMastered(track: LearnTrack, passed: Record<string, string>): boolean {
  return track.lessons.every((l) => (l.gate ? !!passed[l.id] : lessonMastered(l, passed)))
}

/* ── The gate ───────────────────────────────────────────────────────────── */

export interface GateSitting {
  /** ISO time the sitting began. */
  startedAt: string
  /** Problem ids, in the order this sitting shows them. */
  order: string[]
  /** Problems passed in this sitting, with when. */
  passed: Record<string, string>
  /** Set when she hands it in or the time runs out. */
  endedAt?: string
}

export interface GateRecord {
  sittings: GateSitting[]
}

/** How long after a failed sitting the next one can start: long enough to go back and study. */
export const GATE_COOLDOWN_MS = 12 * 60 * 60 * 1000

/** A stable shuffle, so a sitting's order survives a reload but differs from the last sitting's. */
export function shuffled<T>(items: T[], seed: number): T[] {
  const out = items.slice()
  let s = (seed >>> 0) || 1
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function startSitting(gate: LearnLesson, record: GateRecord | undefined, now: Date = new Date()): GateRecord {
  const problems = gate.gate?.problems ?? []
  const seed = now.getTime() ^ ((record?.sittings.length ?? 0) * 2654435761)
  const sitting: GateSitting = { startedAt: now.toISOString(), order: shuffled(problems.map((p) => p.id), seed), passed: {} }
  return { sittings: [...(record?.sittings ?? []), sitting] }
}

/** The sitting still running, if any: started, not handed in, and inside its time. */
export function openSitting(gate: LearnLesson, record: GateRecord | undefined, now: Date = new Date()): GateSitting | undefined {
  const last = record?.sittings[record.sittings.length - 1]
  if (!last || last.endedAt || !gate.gate) return undefined
  return now.getTime() < Date.parse(last.startedAt) + gate.gate.minutes * 60_000 ? last : undefined
}

export function msLeft(gate: LearnLesson, sitting: GateSitting, now: Date = new Date()): number {
  return Math.max(0, Date.parse(sitting.startedAt) + (gate.gate?.minutes ?? 0) * 60_000 - now.getTime())
}

/** Records one problem passed in the running sitting. */
export function passInSitting(record: GateRecord, problemId: string, now: Date = new Date()): GateRecord {
  const sittings = record.sittings.slice()
  const last = sittings[sittings.length - 1]
  if (!last || last.endedAt || last.passed[problemId]) return record
  sittings[sittings.length - 1] = { ...last, passed: { ...last.passed, [problemId]: now.toISOString() } }
  return { sittings }
}

export function endSitting(record: GateRecord, now: Date = new Date()): GateRecord {
  const sittings = record.sittings.slice()
  const last = sittings[sittings.length - 1]
  if (!last || last.endedAt) return record
  sittings[sittings.length - 1] = { ...last, endedAt: now.toISOString() }
  return { sittings }
}

/** Whether a sitting reached the pass mark. Problems passed after the time ran out do not count. */
export function sittingPassed(gate: LearnLesson, sitting: GateSitting): boolean {
  if (!gate.gate) return false
  const end = Date.parse(sitting.startedAt) + gate.gate.minutes * 60_000
  const inTime = Object.values(sitting.passed).filter((at) => Date.parse(at) <= end).length
  return inTime >= gate.gate.pass
}

/** When she may start another sitting (null: now). */
export function nextSittingAt(gate: LearnLesson, record: GateRecord | undefined, now: Date = new Date()): Date | null {
  const last = record?.sittings[record.sittings.length - 1]
  if (!last || !gate.gate) return null
  if (openSitting(gate, record, now)) return null
  const ended = last.endedAt ? Date.parse(last.endedAt) : Date.parse(last.startedAt) + gate.gate.minutes * 60_000
  const at = ended + GATE_COOLDOWN_MS
  return at > now.getTime() ? new Date(at) : null
}

/* ── Re-tests ───────────────────────────────────────────────────────────── */

/** Days between re-tests of a mastered lesson: the ladder a miss sends it back to the bottom of. */
export const RETEST_DAYS = [2, 7, 21, 60, 150] as const

export interface Retest {
  /** Rung of RETEST_DAYS it is waiting on. */
  step: number
  /** ISO time it comes due. */
  due: string
  /** Missed the last time, and not yet passed again. */
  rusty?: boolean
}

const DAY = 24 * 60 * 60 * 1000

export function scheduleFirst(now: Date = new Date()): Retest {
  return { step: 0, due: new Date(now.getTime() + RETEST_DAYS[0] * DAY).toISOString() }
}

/** After a re-test: a pass climbs one rung (staying at the top once there), a miss starts again at the bottom. */
export function afterRetest(r: Retest, passed: boolean, now: Date = new Date()): Retest {
  if (!passed) return { step: 0, due: new Date(now.getTime() + RETEST_DAYS[0] * DAY).toISOString(), rusty: true }
  const step = Math.min(r.step + 1, RETEST_DAYS.length - 1)
  return { step, due: new Date(now.getTime() + RETEST_DAYS[step]! * DAY).toISOString() }
}

/** Which of a lesson's practice problems a re-test asks this time: a different one each rung. */
export function retestProblem(lesson: LearnLesson, r: Retest, round: number): LearnExercise | undefined {
  if (!lesson.practice.length) return undefined
  return lesson.practice[(r.step + round) % lesson.practice.length]
}

/** The lessons due for a re-test now, most overdue first. */
export function dueRetests(retests: Record<string, Retest>, now: Date = new Date()): string[] {
  return Object.entries(retests)
    .filter(([, r]) => Date.parse(r.due) <= now.getTime())
    .sort((a, b) => Date.parse(a[1].due) - Date.parse(b[1].due))
    .map(([id]) => id)
}

/** A re-test counts as passed when it passed within three runs with no hint opened. */
export const RETEST_RUNS = 3

/* ── Off disk ───────────────────────────────────────────────────────────── */

const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

/** Gate records as stored, with anything malformed dropped rather than trusted. */
export function coerceGates(raw: unknown): Record<string, GateRecord> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, GateRecord> = {}
  for (const [id, rec] of Object.entries(raw as Record<string, unknown>)) {
    const list = (rec as { sittings?: unknown })?.sittings
    if (!Array.isArray(list)) continue
    const sittings: GateSitting[] = []
    for (const s of list as Record<string, unknown>[]) {
      if (!s || !isIso(s.startedAt) || !Array.isArray(s.order) || !s.order.every((o) => typeof o === 'string')) continue
      const passed = s.passed && typeof s.passed === 'object' ? Object.fromEntries(Object.entries(s.passed as Record<string, unknown>).filter(([, v]) => isIso(v))) : {}
      sittings.push({ startedAt: s.startedAt, order: s.order as string[], passed: passed as Record<string, string>, ...(isIso(s.endedAt) ? { endedAt: s.endedAt } : {}) })
    }
    out[id] = { sittings: sittings.slice(-50) }
  }
  return out
}

export function coerceRetests(raw: unknown): Record<string, Retest> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, Retest> = {}
  for (const [id, r] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!r || !isIso(r.due) || typeof r.step !== 'number' || !Number.isInteger(r.step)) continue
    out[id] = { step: Math.max(0, Math.min(RETEST_DAYS.length - 1, r.step)), due: r.due, ...(r.rusty === true ? { rusty: true } : {}) }
  }
  return out
}
