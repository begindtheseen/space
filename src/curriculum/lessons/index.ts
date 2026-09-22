/* ============================================================================
   ORBIT — lesson loader
   ----------------------------------------------------------------------------
   Lesson bodies are the largest thing in the corpus by far, so they are not
   part of the curriculum chunk. Vite turns every markdown file here into its
   own lazily fetched asset; the manifest carries the metadata the module page
   needs up front, and a body is fetched the first time someone opens it.
   ========================================================================== */
import { LESSON_COVERAGE, LESSON_MANIFEST, type LessonCoverage } from './manifest'
import { parseLesson } from './parse'
import type { LessonMeta } from './types'

export type { LessonMeta } from './types'

const files = import.meta.glob('./*/*.md', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>

export function lessonsFor(moduleId: string): LessonMeta[] {
  return LESSON_MANIFEST[moduleId] ?? []
}

export type { LessonCoverage } from './manifest'

/**
 * How much of a module its written lessons actually teach, or null for a
 * module that has none yet.
 *
 * Generated from the files, so it cannot drift from them. The module page
 * reads it to say plainly that a module is still being written rather than
 * presenting a partly-taught module as the finished article.
 */
export function lessonCoverage(moduleId: string): LessonCoverage | null {
  return LESSON_COVERAGE[moduleId] ?? null
}

export function lessonKey(moduleId: string, lessonId: string): string {
  return `${moduleId}::${lessonId}`
}

const bodies = new Map<string, Promise<string>>()

/** Resolves to the lesson's markdown body (header removed). Cached per file. */
export function loadLessonBody(meta: LessonMeta): Promise<string> {
  const hit = bodies.get(meta.file)
  if (hit) return hit
  const loader = files[`./${meta.file}`]
  if (!loader) return Promise.reject(new Error(`Lesson file not bundled: ${meta.file}`))
  const p = loader().then((src) => parseLesson(src, meta.file).body)
  bodies.set(meta.file, p)
  return p
}

/** A lesson found by search, with enough context to show and open it. */
export interface LessonHit {
  moduleId: string
  moduleTitle: string
  lesson: LessonMeta
  /** The module topic that matched, when it was a topic rather than the title. */
  matchedTopic?: string
}

/**
 * Finds individual lessons by title or by the topic they teach.
 *
 * Module search alone stops being enough once a module has a dozen lessons in
 * it. Someone who half-remembers a thing about the intermediate axis should
 * land on the lesson that explains it, not on a module page with twelve
 * entries to read through — the second of those is the kind of small friction
 * that ends a study session.
 *
 * Only titles and topic strings are searched, both of which are already in
 * the manifest, so this costs nothing at runtime. Lesson bodies are loaded
 * lazily and searching them would mean fetching the entire corpus.
 */
export function searchLessons(
  query: string,
  titleOf: (moduleId: string) => string | undefined,
  limit = 24,
): LessonHit[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const scored: { hit: LessonHit; score: number }[] = []
  for (const [moduleId, lessons] of Object.entries(LESSON_MANIFEST)) {
    const moduleTitle = titleOf(moduleId)
    if (!moduleTitle) continue
    for (const lesson of lessons) {
      let score = 0
      let matchedTopic: string | undefined
      const title = lesson.title.toLowerCase()
      if (title === q) score += 20
      else if (title.includes(q)) score += 10
      for (const c of lesson.covers) {
        if (c.toLowerCase().includes(q)) {
          score += 5
          matchedTopic ??= c
        }
      }
      if (score > 0) scored.push({ hit: { moduleId, moduleTitle, lesson, matchedTopic }, score })
    }
  }

  scored.sort((a, b) => b.score - a.score || a.hit.lesson.id.localeCompare(b.hit.lesson.id))
  return scored.slice(0, limit).map((s) => s.hit)
}
