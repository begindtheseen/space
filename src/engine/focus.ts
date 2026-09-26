/* ============================================================================
   ORBIT — the focus engine
   ----------------------------------------------------------------------------
   This file exists because of one fact about the person the app is for: she
   has tried online school before and it did not work. Not because the material
   was too hard — because nothing about it made starting easy or stopping
   honest. That is a design problem, and this is the part of the app that
   answers it.

   Four things go wrong with self-paced study, and each one has a countermeasure
   here:

   1. Choosing is the expensive part. Seventeen modules, a review queue and a
      playground is a menu, and a menu at the end of a tired day is a reason to
      close the laptop. `pickFocus` removes the menu: one action, chosen for
      her, with the reason stated. She can override it, but she never has to.

   2. Open-ended work has no visible end. "Study linear algebra" is a task with
      no edge, so the mind treats it as infinite and refuses to begin. A block
      has an edge she can see before she starts — fifteen minutes, and then it
      is genuinely over. The short default is not a suggestion that she do
      little; it is the smallest promise that is still worth keeping, and most
      blocks run past it because starting was the only hard part.

   3. Interruptions become exits. A thought arrives — an email, a bill, a thing
      to look up — and answering it ends the session. `park` gives the thought
      somewhere to go in two seconds, so it stops being a reason to leave.

   4. Stopping feels like failure. A block that ends is a block that was
      completed, and the app says so. Nothing here ever reports a shortfall.

   Everything in this file is pure: it takes values and a clock and returns new
   values. The clock is always a parameter so the behaviour can be tested at a
   specific moment rather than whenever the suite happens to run.

   Nothing here imports the learner state at runtime — only its types, which
   are erased. State imports this file to coerce what comes off disk, so a
   value import in the other direction would close a cycle, and a cycle between
   these two modules would decide at load order whether `newLearnerState` sees
   a defined `coerceParked`. Counting blocks per day therefore lives in
   state.ts, next to the day records it reads.
   ========================================================================== */
import type { LiveSession } from './resume'

/**
 * Block lengths offered, in minutes.
 *
 * Fifteen first and by default. The literature on this is about the
 * commitment being small enough that refusing it feels sillier than doing it;
 * the standard twenty-five-minute pomodoro is already past that line for
 * someone who is avoiding the work.
 */
export const BLOCK_MINUTES = [15, 25, 45] as const
export type BlockMinutes = (typeof BLOCK_MINUTES)[number]
export const DEFAULT_BLOCK: BlockMinutes = 15

/** What a block is for. Drives the copy and the destination, nothing else. */
export type FocusKind =
  | 'resume-lesson'
  | 'resume-session'
  | 'review'
  | 'start-lesson'
  | 'continue-module'
  | 'bench'

export interface FocusPick {
  kind: FocusKind
  /** Imperative and specific: what she is about to do. */
  title: string
  /** One sentence of honest reasoning. Never flattery, never pressure. */
  why: string
  /** In-app route the block opens. */
  href: string
  moduleId?: string
}

/**
 * The facts `pickFocus` needs, gathered separately so the choice itself can be
 * tested without a curriculum, a DAG or a database behind it.
 */
export interface FocusInputs {
  /** Reviews scheduled and not yet done. */
  dueCount: number
  /** A lesson she stopped in the middle of. */
  unfinished?: { moduleId: string; lessonId: string; title: string; fraction: number }
  /** A practice or exam run that was still open when the app closed. */
  live?: LiveSession
  /** The next module to work in, and whether she has started it. */
  module?: { id: string; title: string; started: boolean }
  /** The next lesson she has not read in that module. */
  lesson?: { id: string; title: string; minutes: number }
}

/**
 * Below this, "carry on where you left off" is a lie — she read two paragraphs
 * and the honest offer is to start the lesson again.
 */
export const RESUME_FLOOR = 0.08
/** Above this she is at the end of the lesson; finishing it is a small win. */
export const RESUME_CEILING = 0.97

/**
 * Picks the single next thing.
 *
 * The order is not arbitrary. Unfinished work comes first because abandoning
 * something half-done is the habit this app is trying to break, and because
 * the cost of re-entry is lowest where the context is still warm. Reviews come
 * before new material because a lapsed card is work already paid for and about
 * to be lost. New material comes last, when nothing is owed.
 */
export function pickFocus(inp: FocusInputs): FocusPick {
  const live = inp.live
  if (live && live.queue.length > 0) {
    const left = live.queue.length
    return {
      kind: 'resume-session',
      title: `Finish the ${label(live.kind)} you were in`,
      why: `${left} question${left === 1 ? '' : 's'} left, with your answer still in the box.`,
      href: live.moduleId ? `/module/${live.moduleId}` : '/review',
      moduleId: live.moduleId,
    }
  }

  const u = inp.unfinished
  if (u && u.fraction >= RESUME_FLOOR && u.fraction <= RESUME_CEILING) {
    return {
      kind: 'resume-lesson',
      title: `Finish reading ${u.title}`,
      why: `You are ${Math.round(u.fraction * 100)}% through it. Picking it up costs less than starting something new.`,
      href: `/module/${u.moduleId}?lesson=${u.lessonId}`,
      moduleId: u.moduleId,
    }
  }

  if (inp.dueCount > 0) {
    return {
      kind: 'review',
      title: `Clear ${inp.dueCount} review${inp.dueCount === 1 ? '' : 's'}`,
      why: 'These are things you already learned once. A few minutes now keeps them.',
      href: '/review',
    }
  }

  if (inp.module && inp.lesson) {
    return {
      kind: 'start-lesson',
      title: inp.lesson.title,
      why: `${inp.lesson.minutes} minutes of reading in ${inp.module.title}, and it is the next thing in order.`,
      href: `/module/${inp.module.id}?lesson=${inp.lesson.id}`,
      moduleId: inp.module.id,
    }
  }

  if (inp.module) {
    return {
      kind: 'continue-module',
      title: `${inp.module.started ? 'Continue' : 'Start'} ${inp.module.title}`,
      why: inp.module.started
        ? 'You have work open here already.'
        : 'Nothing is due and this is next in sequence.',
      href: `/module/${inp.module.id}`,
      moduleId: inp.module.id,
    }
  }

  // Nothing owed and nothing queued. The workbench is the honest answer: it is
  // real practice and it counts toward nothing, which is exactly what it is
  // for on a day when the main path is not going to happen.
  return {
    kind: 'bench',
    title: 'Take a workbench task',
    why: 'Nothing is scheduled. This is the practice that counts toward nothing.',
    href: '/bench',
  }
}

function label(kind: LiveSession['kind']): string {
  return kind === 'exam' ? 'exam' : kind === 'recall' ? 'recall session' : 'practice run'
}

/* ── A running block ──────────────────────────────────────────────────────── */

export interface FocusRun {
  /** ISO time the block was started or last resumed. */
  startedAt: string
  minutes: number
  pick: FocusPick
  /** Milliseconds banked before the most recent pause. */
  bankedMs: number
  /** ISO time it was paused. Absent while it is running. */
  pausedAt?: string
}

export function startRun(pick: FocusPick, minutes: number, now: Date = new Date()): FocusRun {
  return {
    startedAt: now.toISOString(),
    minutes: clampMinutes(minutes),
    pick,
    bankedMs: 0,
  }
}

/** Block lengths are clamped rather than rejected: a bad number must not stop a block. */
export function clampMinutes(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_BLOCK
  return Math.min(180, Math.max(1, Math.round(n)))
}

export function elapsedMs(run: FocusRun, now: Date = new Date()): number {
  if (run.pausedAt) return Math.max(0, run.bankedMs)
  const started = Date.parse(run.startedAt)
  if (!Number.isFinite(started)) return Math.max(0, run.bankedMs)
  // A clock that has gone backwards (a timezone change, a laptop waking with a
  // corrected time) must never read as negative progress.
  return Math.max(0, run.bankedMs + Math.max(0, now.getTime() - started))
}

export function remainingMs(run: FocusRun, now: Date = new Date()): number {
  return Math.max(0, run.minutes * 60_000 - elapsedMs(run, now))
}

export function isComplete(run: FocusRun, now: Date = new Date()): boolean {
  return remainingMs(run, now) === 0
}

export function pauseRun(run: FocusRun, now: Date = new Date()): FocusRun {
  if (run.pausedAt) return run
  return { ...run, bankedMs: elapsedMs(run, now), pausedAt: now.toISOString() }
}

export function resumeRun(run: FocusRun, now: Date = new Date()): FocusRun {
  if (!run.pausedAt) return run
  const { pausedAt: _dropped, ...rest } = run
  return { ...rest, startedAt: now.toISOString() }
}

/* ── Staying in the block ─────────────────────────────────────────────────────
   A running block holds her where it sent her. The easiest way out of a
   block was always a click: a sidebar link, the search box, the back button,
   and the block kept counting down on a page she had left. So while a block
   is running the app will not take her anywhere else; to leave, she pauses it
   or ends it — both one tap, both in plain words on the strip.

   Pausing is rationed, because a pause that is always one tap away turns into
   the same exit with an extra step: after a block starts or resumes, Pause
   waits until five minutes of it have run. Ending is never rationed. A block
   she cannot stop is a block she stops starting, and an ended block is still
   credited with every minute it ran. */

/** Focused time a block must run, after it starts or resumes, before it can be paused. */
export const PAUSE_COOLDOWN_MS = 5 * 60_000

/** Whether the block is holding her in place: running, not paused, not finished. */
export function isLocked(run: FocusRun | undefined, now: Date = new Date()): run is FocusRun {
  return !!run && !run.pausedAt && !isComplete(run, now)
}

/** Milliseconds until the block may be paused; zero when it may be now. */
export function pauseAvailableIn(run: FocusRun, now: Date = new Date()): number {
  if (run.pausedAt) return 0
  const since = Date.parse(run.startedAt)
  if (!Number.isFinite(since)) return 0
  // startedAt is reset on every resume, so this is time run since the last one.
  const ran = Math.max(0, now.getTime() - since)
  return Math.max(0, Math.min(PAUSE_COOLDOWN_MS - ran, remainingMs(run, now)))
}

export function canPause(run: FocusRun, now: Date = new Date()): boolean {
  return !run.pausedAt && !isComplete(run, now) && pauseAvailableIn(run, now) === 0
}

/**
 * Where a running block lets her be: the page it opened and anything under
 * it. A block on a module may move between that module's lessons (finishing
 * one early and reading the next is the block working), not out of it.
 */
export function lockAllows(run: FocusRun, path: string): boolean {
  const trim = (p: string) => p.replace(/\/+$/, '') || '/'
  const home = trim(run.pick.href.split('?')[0]!.split('#')[0]!)
  const here = trim(path)
  if (home === '/') return here === '/'
  return here === home || here.startsWith(`${home}/`)
}

/**
 * Whole minutes actually spent, for the day log.
 *
 * Floored, not rounded: a block is only ever credited with time that was
 * really spent, so the weekly total can be trusted.
 */
export function minutesSpent(run: FocusRun, now: Date = new Date()): number {
  return Math.floor(elapsedMs(run, now) / 60_000)
}

/* ── Parked thoughts ──────────────────────────────────────────────────────── */

export interface ParkedNote {
  /** ISO time, and the note's identity — two notes cannot share a millisecond. */
  at: string
  text: string
}

/** Long enough for a real thought, short enough that it is not a second task. */
export const PARK_MAX_CHARS = 280
/** Older parked notes are dropped; a list she will never read is clutter. */
export const PARK_LIMIT = 50

export function parkNote(notes: ParkedNote[], text: string, now: Date = new Date()): ParkedNote[] {
  const trimmed = text.trim().slice(0, PARK_MAX_CHARS)
  if (!trimmed) return notes
  let at = now.toISOString()
  // Two notes in the same millisecond would collide on their own id, and the
  // id is how one gets removed. Nudge rather than drop.
  while (notes.some((n) => n.at === at)) at = new Date(Date.parse(at) + 1).toISOString()
  return [{ at, text: trimmed }, ...notes].slice(0, PARK_LIMIT)
}

export function unparkNote(notes: ParkedNote[], at: string): ParkedNote[] {
  return notes.filter((n) => n.at !== at)
}

export function coerceParked(raw: unknown): ParkedNote[] {
  if (!Array.isArray(raw)) return []
  const out: ParkedNote[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    if (typeof rec.at !== 'string' || typeof rec.text !== 'string') continue
    if (!rec.text.trim()) continue
    out.push({ at: rec.at, text: rec.text.slice(0, PARK_MAX_CHARS) })
  }
  return out.slice(0, PARK_LIMIT)
}

export function coerceRun(raw: unknown): FocusRun | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const rec = raw as Record<string, unknown>
  if (typeof rec.startedAt !== 'string' || !Number.isFinite(Date.parse(rec.startedAt))) return undefined
  const pick = rec.pick
  if (!pick || typeof pick !== 'object') return undefined
  const p = pick as Record<string, unknown>
  if (typeof p.title !== 'string' || typeof p.href !== 'string' || typeof p.kind !== 'string') {
    return undefined
  }
  // The href is followed on restore, so it is held to the same rule as a
  // resume point: an in-app path only, never somewhere else.
  if (!p.href.startsWith('/') || p.href.startsWith('//')) return undefined
  return {
    startedAt: rec.startedAt,
    minutes: clampMinutes(typeof rec.minutes === 'number' ? rec.minutes : DEFAULT_BLOCK),
    bankedMs: typeof rec.bankedMs === 'number' && rec.bankedMs >= 0 ? rec.bankedMs : 0,
    pausedAt: typeof rec.pausedAt === 'string' ? rec.pausedAt : undefined,
    pick: {
      kind: p.kind as FocusKind,
      title: p.title,
      why: typeof p.why === 'string' ? p.why : '',
      href: p.href,
      moduleId: typeof p.moduleId === 'string' ? p.moduleId : undefined,
    },
  }
}

/* ── Counting blocks ──────────────────────────────────────────────────────── */

/**
 * How a finished block is described back to her.
 *
 * Deliberately never comparative and never a shortfall. The first block of a
 * day is the one that was hard to start, and it is named as the achievement it
 * is; later ones are counted without commentary.
 */
export function blockSummary(blocksTodayCount: number, minutes: number): string {
  // A block shorter than a minute floors to zero, and "0 minutes done" is the
  // exact sentence this function exists to prevent. The block still happened,
  // so it is still reported — without the number that makes it read as a
  // failure.
  if (minutes < 1) {
    return blocksTodayCount <= 1
      ? 'Block done. That was the hard part.'
      : `Block done. ${blocksTodayCount} today.`
  }
  const time = `${minutes} minute${minutes === 1 ? '' : 's'}`
  if (blocksTodayCount <= 1) return `${time} done. That was the hard part.`
  return `${time} today, across ${blocksTodayCount} blocks.`
}
