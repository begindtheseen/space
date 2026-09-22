/* ============================================================================
   ORBIT — resume points, live sessions and media progress
   ----------------------------------------------------------------------------
   The problem this solves: someone an hour into a module, three questions from
   the end of a session, with half a derivation typed into a scratch pad, and
   then the laptop dies. Everything the engine had already graded was safe —
   it is written after every answer — but the *place* was not. Losing the place
   is what makes a person not come back.

   So the place is state too. Three slices:

     resume   one pointer to where she was, app-wide, for "pick up where you
              left off". Rewritten constantly; tiny.
     live     an in-flight session: the remaining queue, the index, the answer
              currently being typed and whether it had been revealed. Restoring
              this puts her back on the same card with the same text in the box.
     media    playback position per video, so a 40-minute lecture resumes at
              minute 31 rather than at the beginning.

   All three are coerced on read like everything else in state: a corrupt or
   hostile value must degrade to "no resume point", never to a crash on boot.
   ========================================================================== */

/** The kinds of place worth returning to. */
export type ResumeKind = 'lesson' | 'practice' | 'recall' | 'playground' | 'video' | 'module'

export interface ResumePoint {
  kind: ResumeKind
  /** Hash route that reopens this exact place, e.g. `/module/t0_m01?lesson=l03`. */
  path: string
  /** Shown on the resume card: "Two-Body Problem". */
  label: string
  /** Second line: "Lesson 3 of 9 · 60% through". */
  detail?: string
  moduleId?: string
  lessonId?: string
  /** 0–1 position within the thing, when it is the kind of thing with a position. */
  progress?: number
  /** ISO timestamp of the last update. */
  at: string
}

/** An in-flight run of questions — practice, recall or an exam. */
export interface LiveSession {
  id: string
  kind: 'practice' | 'recall' | 'exam'
  moduleId?: string
  startedAt: string
  updatedAt: string
  /** Item ids still to be asked, in order. */
  queue: string[]
  /** Item ids already graded this run. */
  done: string[]
  correct: number
  /** The answer in the box right now, so a crash mid-question loses nothing. */
  draft?: {
    itemId: string
    /** Typed text, selected option id, or serialised working. */
    value: string
    /** Whether the answer had already been revealed when the lights went out. */
    revealed: boolean
    /** Stated confidence, if it had been given. */
    confidence?: number
  }
}

export interface MediaProgress {
  /** Playback position in seconds. */
  seconds: number
  /** Total duration in seconds, when known. */
  duration?: number
  /** Set once watched far enough to count as done. */
  completed?: boolean
  at: string
}

/** A video is counted as watched at 92% — credits and outros are not learning. */
export const VIDEO_DONE_FRACTION = 0.92

export function isMediaComplete(p: MediaProgress): boolean {
  if (p.completed) return true
  if (!p.duration || p.duration <= 0) return false
  return p.seconds / p.duration >= VIDEO_DONE_FRACTION
}

/* ── Coercion ────────────────────────────────────────────────────────────── */

const KINDS: ReadonlySet<string> = new Set<ResumeKind>([
  'lesson',
  'practice',
  'recall',
  'playground',
  'video',
  'module',
])

const SESSION_KINDS: ReadonlySet<string> = new Set(['practice', 'recall', 'exam'])

/** Queues are capped so a malformed import cannot make the app allocate forever. */
export const MAX_QUEUE = 500
const MAX_DRAFT_CHARS = 20000

function s(v: unknown, max = 400): string | undefined {
  return typeof v === 'string' ? v.slice(0, max) : undefined
}

function n(v: unknown, lo: number, hi: number): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : undefined
}

function ids(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, MAX_QUEUE)
}

export function coerceResume(v: unknown): ResumePoint | undefined {
  if (!v || typeof v !== 'object') return undefined
  const r = v as Partial<ResumePoint>
  const path = s(r.path, 600)
  const label = s(r.label, 200)
  const at = s(r.at, 40)
  if (!path || !label || !at) return undefined
  // Only in-app routes: a resume point is followed automatically on launch, so
  // it must never become an open redirect. `//host` is protocol-relative and
  // would leave the app, so a single leading slash is required.
  if (!path.startsWith('/') || path.startsWith('//')) return undefined
  return {
    kind: KINDS.has(r.kind as string) ? (r.kind as ResumeKind) : 'module',
    path,
    label,
    detail: s(r.detail, 200),
    moduleId: s(r.moduleId, 120),
    lessonId: s(r.lessonId, 120),
    progress: n(r.progress, 0, 1),
    at,
  }
}

export function coerceLive(v: unknown): LiveSession | undefined {
  if (!v || typeof v !== 'object') return undefined
  const l = v as Partial<LiveSession>
  const id = s(l.id, 80)
  const startedAt = s(l.startedAt, 40)
  const updatedAt = s(l.updatedAt, 40)
  if (!id || !startedAt || !updatedAt) return undefined
  if (!SESSION_KINDS.has(l.kind as string)) return undefined

  const queue = ids(l.queue)
  const done = ids(l.done)
  // A session with nothing left to ask is finished, not resumable.
  if (queue.length === 0) return undefined

  const out: LiveSession = {
    id,
    kind: l.kind as LiveSession['kind'],
    moduleId: s(l.moduleId, 120),
    startedAt,
    updatedAt,
    queue,
    done,
    correct: Math.round(n(l.correct, 0, done.length) ?? 0),
  }

  const d = l.draft
  if (d && typeof d === 'object') {
    const itemId = s((d as Record<string, unknown>).itemId, 200)
    if (itemId) {
      out.draft = {
        itemId,
        value: s((d as Record<string, unknown>).value, MAX_DRAFT_CHARS) ?? '',
        revealed: (d as Record<string, unknown>).revealed === true,
        confidence: n((d as Record<string, unknown>).confidence, 0, 1),
      }
    }
  }
  return out
}

export function coerceMedia(v: unknown): MediaProgress | null {
  if (!v || typeof v !== 'object') return null
  const m = v as Partial<MediaProgress>
  const seconds = n(m.seconds, 0, 60 * 60 * 24)
  if (seconds === undefined) return null
  return {
    seconds,
    duration: n(m.duration, 0, 60 * 60 * 24),
    ...(m.completed === true ? { completed: true } : {}),
    at: s(m.at, 40) ?? new Date().toISOString(),
  }
}

/** Positions within a lesson, 0–1. Keyed `moduleId::lessonId`. */
export function coercePlace(v: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!v || typeof v !== 'object') return out
  for (const [k, val] of Object.entries(v)) {
    const p = n(val, 0, 1)
    if (p !== undefined && k.length <= 260) out[k] = p
  }
  return out
}
