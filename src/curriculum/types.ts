/* ============================================================================
   ORBIT — curriculum schema
   ----------------------------------------------------------------------------
   The curriculum is data, not code. Everything the learning engine does —
   sequencing, gating, scheduling, diagnosis — is derived from these structures,
   so the schema is the contract between "what we teach" and "how we teach it".

   Two rules the validator enforces (see `curriculum/validate.ts`):
     · `prereqs` must reference real module ids and must form a DAG
     · every id in the whole corpus must be unique
   ========================================================================== */

import type { LessonMeta } from './lessons/types'

/** The four pillars shown on the dashboard. */
export type TrackId = 'foundations' | 'coding' | 'gnc' | 'career'

/** Languages the playground knows how to run or check. */
export type Lang =
  | 'python'
  | 'sql'
  | 'cpp'
  | 'rust'
  | 'matlab'
  | 'simulink'
  | 'bash'
  | 'text'

export type ResourceKind = 'book' | 'course' | 'video' | 'paper' | 'docs' | 'tool' | 'site'

export interface Resource {
  title: string
  author?: string
  kind: ResourceKind
  url?: string
  /** Whether it costs money. Shown as a badge; free resources sort first. */
  free: boolean
  note?: string
}

export interface TestCase {
  /** Human-readable name shown in the runner. */
  name: string
  /** Code appended to the learner's submission; should raise on failure. */
  assert: string
  /** Hidden tests run but do not reveal their body before a pass. */
  hidden?: boolean
}

export type ExerciseKind = 'code' | 'derivation' | 'build' | 'analysis' | 'reading'

export interface Exercise {
  id: string
  title: string
  /** Markdown. What the learner has to do and how success is judged. */
  prompt: string
  kind: ExerciseKind
  lang?: Lang
  starter?: string
  solution?: string
  tests?: TestCase[]
  /** Rough time cost, in hours. Used by the planner. */
  hours?: number
}

export type Bloom = 'recall' | 'understand' | 'apply' | 'analyze'

export interface QuizItem {
  id: string
  q: string
  /** Multiple choice. Omit for a free-recall prompt graded by self-report. */
  choices?: string[]
  /** Index into `choices`, or the expected free-text answer. */
  answer: number | string
  explain: string
  /**
   * Seed difficulty on the IRT logit scale, roughly −3 (trivial) to +3 (brutal).
   * The Elo calibrator moves this as real attempts accumulate; the authored
   * value only has to be a sane starting point.
   */
  b?: number
  bloom?: Bloom
}

export interface Flashcard {
  id: string
  front: string
  back: string
  hint?: string
  /** Set for cards that state a formula — rendered in mono. */
  formula?: boolean
}

/**
 * Written lessons live as markdown files under `curriculum/lessons/<moduleId>/`
 * and are attached to modules from the generated manifest; only metadata is
 * carried here and bodies load on demand. See `lessons/parse.ts` for the file
 * format and `lessons/STYLE.md` for how they are written.
 */
export type { LessonMeta as Lesson } from './lessons/types'

export interface Module {
  id: string
  track: TrackId
  /** Depth in the dependency ladder. Tier 0 assumes nothing at all. */
  tier: number
  title: string
  /** One or two sentences; shown on the module card. */
  summary: string
  /** Module ids that must be at `PREREQ_THRESHOLD` mastery before this opens. */
  prereqs: string[]
  /** Estimated study hours for a true beginner. */
  hours: number
  topics: string[]
  objectives: string[]
  resources: Resource[]
  lessons?: LessonMeta[]
  exercises?: Exercise[]
  cards?: Flashcard[]
  quiz?: QuizItem[]
  /** Free-form labels: 'interview', 'spacex-core', 'math', … */
  tags?: string[]
  /**
   * Author-supplied importance multiplier for readiness weighting. 1 is normal;
   * raise it for modules that SpaceX interviews actually hammer.
   */
  importance?: number
}

/** A named track as presented on the dashboard. */
export interface TrackDef {
  id: TrackId
  title: string
  /** The one-paragraph pitch on the home card. */
  blurb: string
  /** The five bullet lines on the home card. */
  highlights: string[]
  accent: string
}

/* ── Derived shapes used across the app ──────────────────────────────────── */

export interface ModuleStats {
  cards: number
  quiz: number
  exercises: number
  lessons: number
  hours: number
}

export function moduleStats(m: Module): ModuleStats {
  return {
    cards: m.cards?.length ?? 0,
    quiz: m.quiz?.length ?? 0,
    exercises: m.exercises?.length ?? 0,
    lessons: m.lessons?.length ?? 0,
    hours: m.hours,
  }
}

/**
 * Every reviewable atom in the corpus gets a stable item id of the form
 * `<moduleId>::<kind>::<localId>`. The scheduler stores memory state against
 * these, so the format must never change without a migration.
 */
export type ItemKind = 'card' | 'quiz'

export function itemId(moduleId: string, kind: ItemKind, localId: string): string {
  return `${moduleId}::${kind}::${localId}`
}

export function parseItemId(id: string): { moduleId: string; kind: ItemKind; localId: string } | null {
  const parts = id.split('::')
  if (parts.length !== 3) return null
  const [moduleId, kind, localId] = parts
  if (kind !== 'card' && kind !== 'quiz') return null
  return { moduleId: moduleId!, kind, localId: localId! }
}
