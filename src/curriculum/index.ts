/* ============================================================================
   ORBIT — curriculum index
   ----------------------------------------------------------------------------
   Assembles the corpus from its authored parts and exposes the lookups the
   rest of the app needs. The DAG is built once, lazily, and shared — it is
   pure derived data over a frozen corpus, so there is nothing to invalidate.
   ========================================================================== */
import { Dag } from '@/engine/graph'
import { CODING } from './coding'
import { GNC_ADVANCED } from './gnc-advanced'
import { GNC_CORE } from './gnc-core'
import { GNC_FOUNDATIONS } from './gnc-foundations'
import { lessonsFor, searchLessons } from './lessons'
import { CAREER } from './tracks-aux'
import type { Module, TrackId } from './types'

// Lessons are authored as files and attached here from the generated manifest,
// so the module sources stay about structure and the prose stays in prose.
export const MODULES: Module[] = [
  ...GNC_FOUNDATIONS,
  ...GNC_CORE,
  ...GNC_ADVANCED,
  ...CODING,
  ...CAREER,
].map((m) => {
  const lessons = lessonsFor(m.id)
  return lessons.length > 0 ? { ...m, lessons } : m
})

let cachedDag: Dag | null = null

export function dag(): Dag {
  if (!cachedDag) cachedDag = new Dag(MODULES)
  return cachedDag
}

const byId = new Map(MODULES.map((m) => [m.id, m]))

export function moduleById(id: string): Module | undefined {
  return byId.get(id)
}

export function modulesInTrack(track: TrackId): Module[] {
  return dag()
    .all()
    .filter((m) => m.track === track)
}

/** Modules grouped by tier, in study order, for the track pages. */
export function tiersInTrack(track: TrackId): { tier: number; modules: Module[] }[] {
  const out = new Map<number, Module[]>()
  for (const m of modulesInTrack(track)) {
    if (!out.has(m.tier)) out.set(m.tier, [])
    out.get(m.tier)!.push(m)
  }
  return [...out.entries()].sort((a, b) => a[0] - b[0]).map(([tier, modules]) => ({ tier, modules }))
}

export interface CorpusStats {
  modules: number
  cards: number
  quiz: number
  exercises: number
  lessons: number
  hours: number
  resources: number
}

export function corpusStats(modules: Module[] = MODULES): CorpusStats {
  const stats: CorpusStats = {
    modules: modules.length,
    cards: 0,
    quiz: 0,
    exercises: 0,
    lessons: 0,
    hours: 0,
    resources: 0,
  }
  for (const m of modules) {
    stats.cards += m.cards?.length ?? 0
    stats.quiz += m.quiz?.length ?? 0
    stats.exercises += m.exercises?.length ?? 0
    stats.lessons += m.lessons?.length ?? 0
    stats.resources += m.resources?.length ?? 0
    stats.hours += m.hours
  }
  return stats
}

/**
 * Substring search across titles, summaries and topics. Small enough corpus
 * that a linear scan is instant and a real index would be premature.
 */
export function searchModules(query: string, limit = 20): Module[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const scored: { m: Module; score: number }[] = []
  for (const m of MODULES) {
    let score = 0
    if (m.title.toLowerCase().includes(q)) score += 10
    if (m.summary.toLowerCase().includes(q)) score += 4
    for (const t of m.topics) if (t.toLowerCase().includes(q)) score += 2
    for (const tag of m.tags ?? []) if (tag.toLowerCase().includes(q)) score += 3
    if (score > 0) scored.push({ m, score })
  }

  scored.sort((a, b) => b.score - a.score || a.m.tier - b.m.tier)
  return scored.slice(0, limit).map((s) => s.m)
}

export { TRACKS, TRACK_ORDER, trackDef } from './tracks'
export { lessonCoverage, lessonKey, loadLessonBody, lessonsFor } from './lessons'
export type { LessonHit } from './lessons'

/**
 * Lesson search, with the module titles supplied from here so the lesson
 * loader keeps knowing nothing about the module list.
 */
export function searchLessonsIn(query: string, limit = 24) {
  return searchLessons(query, (id) => moduleById(id)?.title, limit)
}
export type { LessonCoverage } from './lessons'
export type { LessonMeta } from './lessons'
export type { Module, TrackDef, TrackId } from './types'
