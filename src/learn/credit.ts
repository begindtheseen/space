/* ============================================================================
   Credit between Learn to code and the coding modules
   ----------------------------------------------------------------------------
   What she has shown once counts everywhere, so she never has to learn the
   same thing twice. Credit is only ever earned by proof, never by time spent:

     a module lesson   counts as read (and its practice becomes optional) when
                       she has mastered every Learn lesson that teaches it:
                       each lesson's task and all of its practice.
     a module test     counts as passed when she has mastered the Learn courses
                       that cover the whole module, gates included. The
                       modules after it open and the module counts as mastered.
     a Learn gate      counts as passed when she has passed the tests of the
                       modules that cover the whole course.

   Credit never flows through credit: a module test credited by courses does
   not in turn credit another course's gate. Only the real thing does.

   The map itself (credit-map.ts) says what teaches what.
   ========================================================================== */
import { CREDIT } from './credit-map'
import { findLesson, prerequisitesOf, trackFor } from './index'
import { lessonsFor } from '@/curriculum'
import { MODULE_TRACKS, moduleTest, testLocks } from './modules'
import { courseMastered, gateOf, lessonMastered, lockedBy } from './practice'
import type { LessonMeta, TrackMeta } from './types'

export interface CreditMap {
  /** `cod_py_01_basics::l06-functions` → the Learn lessons that together teach it. */
  lessons: Record<string, string[]>
  /** A module → the Learn courses that together cover all of it. */
  modules: Record<string, string[]>
  /** A Learn course → the modules whose tests together cover all of it. */
  courses: Record<string, string[]>
  /**
   * `module::lesson` → Learn lessons that teach most of it, and what the module lesson adds. When she has
   * mastered those, the lesson says what she already knows and what is new, so she reads only the new part.
   * It still counts only when its practice passes: that is the proof of the new part.
   */
  overlap?: Record<string, { learn: string[]; newHere: string }>
}

/** The Learn lessons that give a module lesson its credit, when she has mastered all of them. */
export function lessonCredit(moduleId: string, lessonId: string, passed: Record<string, string>, map: CreditMap = CREDIT): LessonMeta[] | null {
  const ids = map.lessons[`${moduleId}::${lessonId}`]
  if (!ids?.length) return null
  const lessons = ids.map((id) => findLesson(id)?.lesson)
  if (lessons.some((l) => !l || !lessonMastered(l, passed))) return null
  return lessons as LessonMeta[]
}

/** Every module lesson (`module::lesson`) that counts as read: mastered in Learn to code, or in a module whose test she passed. */
export function creditedLessonKeys(passed: Record<string, string>, map: CreditMap = CREDIT): Set<string> {
  const out = new Set<string>()
  for (const key of Object.keys(map.lessons)) {
    const [m, l] = key.split('::')
    if (m && l && lessonCredit(m, l, passed, map)) out.add(key)
  }
  // Testing out of a module is proof of all of it: every one of its lessons counts.
  for (const t of MODULE_TRACKS) {
    const test = t.module ? moduleTest(t.module) : undefined
    if (!t.module || !test || !passed[test.id]) continue
    for (const l of lessonsFor(t.module)) out.add(`${t.module}::${l.id}`)
  }
  return out
}

/** Whether a module lesson counts as read without reading it (see creditedLessonKeys). */
export function lessonCounted(moduleId: string, lessonId: string, passed: Record<string, string>, map: CreditMap = CREDIT): boolean {
  if (lessonCredit(moduleId, lessonId, passed, map)) return true
  const test = moduleTest(moduleId)
  return !!test && !!passed[test.id]
}

/** What she already knows of a module lesson from Learn to code, and what it adds, once the overlapping lessons are mastered. */
export function lessonOverlap(moduleId: string, lessonId: string, passed: Record<string, string>, map: CreditMap = CREDIT): { lessons: LessonMeta[]; newHere: string } | null {
  const o = map.overlap?.[`${moduleId}::${lessonId}`]
  if (!o?.learn.length) return null
  const lessons = o.learn.map((id) => findLesson(id)?.lesson)
  if (lessons.some((l) => !l || !lessonMastered(l, passed))) return null
  return { lessons: lessons as LessonMeta[], newHere: o.newHere }
}

/** How much of a module she already knows from Learn to code: lessons covered whole or mostly, of all its lessons. */
export function moduleReadiness(moduleId: string, passed: Record<string, string>, map: CreditMap = CREDIT): { known: number; total: number } {
  const lessons = lessonsFor(moduleId)
  const known = lessons.filter((l) => lessonCredit(moduleId, l.id, passed, map) || lessonOverlap(moduleId, l.id, passed, map)).length
  return { known, total: lessons.length }
}

/** The Learn courses that pass a module's test for her, when she has mastered all of them. */
export function moduleCredit(moduleId: string, passed: Record<string, string>, map: CreditMap = CREDIT): TrackMeta[] | null {
  const ids = map.modules[moduleId]
  if (!ids?.length) return null
  const tracks = ids.map((id) => trackFor(id))
  if (tracks.some((t) => !t || !courseMastered(t, passed))) return null
  return tracks as TrackMeta[]
}

/** Whether a module's test counts as passed: sat and passed, or earned in Learn to code. */
export function moduleTestPassed(moduleId: string, passed: Record<string, string>, map: CreditMap = CREDIT): boolean {
  const test = moduleTest(moduleId)
  return (!!test && !!passed[test.id]) || !!moduleCredit(moduleId, passed, map)
}

/** The modules whose passed tests pass a Learn course's gate for her. Only tests really sat count. */
export function courseCredit(courseId: string, passed: Record<string, string>, map: CreditMap = CREDIT): string[] | null {
  const ids = map.courses[courseId]
  if (!ids?.length) return null
  return ids.every((m) => {
    const test = moduleTest(m)
    return !!test && !!passed[test.id]
  })
    ? ids
    : null
}

/** Whether a Learn course's gate counts as passed: sat and passed, or earned in the modules. */
export function gatePassed(track: TrackMeta, passed: Record<string, string>, map: CreditMap = CREDIT): boolean {
  const gate = gateOf(track)
  return (!!gate && !!passed[gate.id]) || !!courseCredit(track.id, passed, map)
}

/** What keeps a module locked, with credit from Learn to code counted. */
export function moduleLocks(module: { prereqs: string[] }, passed: Record<string, string>, map: CreditMap = CREDIT) {
  return testLocks(module, passed, (m) => !!moduleCredit(m, passed, map))
}

/** What keeps a Learn course locked, with credit from the modules counted. */
export function courseLock(track: TrackMeta, passed: Record<string, string>, map: CreditMap = CREDIT) {
  return lockedBy(track, prerequisitesOf(track), passed, (t) => !!courseCredit(t.id, passed, map))
}
