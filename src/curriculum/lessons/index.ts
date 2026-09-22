/* ============================================================================
   ORBIT — lesson loader
   ----------------------------------------------------------------------------
   Lesson bodies are the largest thing in the corpus by far, so they are not
   part of the curriculum chunk. Vite turns every markdown file here into its
   own lazily fetched asset; the manifest carries the metadata the module page
   needs up front, and a body is fetched the first time someone opens it.
   ========================================================================== */
import { LESSON_MANIFEST } from './manifest'
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
