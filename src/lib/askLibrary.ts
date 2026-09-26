/* ============================================================================
   ORBIT — what Ask AI may draw on
   ----------------------------------------------------------------------------
   The lessons she has marked read, the ones the placement test says she
   already knows, and the lessons before this one in the module she is in
   (read or not, they come first for a reason). Bodies load the same lazy way
   the reader loads them and stay cached, so asking twice costs nothing.
   ========================================================================== */
import { lessonsFor, loadLessonBody, moduleById } from '@/curriculum'
import { PLACEMENT_SKILLS } from '@/curriculum/placement'
import { testedOutKeys } from '@/engine/placement'
import type { LearnerState } from '@/engine/state'
import type { LibraryLesson } from '@/lib/askAi'

/** The most lessons one question will read through; the most recently read win. */
const MAX_LESSONS = 160

export function libraryKeys(state: LearnerState, here: { moduleId: string; lessonId: string }): string[] {
  const keys = new Map<string, number>()
  for (const [key, at] of Object.entries(state.read)) keys.set(key, Date.parse(at) || 0)
  for (const key of testedOutKeys(PLACEMENT_SKILLS, state.placement)) if (!keys.has(key)) keys.set(key, 0)
  const own = lessonsFor(here.moduleId)
  const at = own.findIndex((l) => l.id === here.lessonId)
  for (const l of own.slice(0, Math.max(0, at))) {
    const key = `${here.moduleId}::${l.id}`
    if (!keys.has(key)) keys.set(key, 1)
  }
  keys.delete(`${here.moduleId}::${here.lessonId}`)
  return [...keys.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_LESSONS)
    .map(([k]) => k)
}

export async function loadLibrary(keys: string[]): Promise<LibraryLesson[]> {
  const out = await Promise.all(
    keys.map(async (key) => {
      const [moduleId, lessonId] = key.split('::')
      const mod = moduleId ? moduleById(moduleId) : undefined
      const meta = mod && lessonsFor(mod.id).find((l) => l.id === lessonId)
      if (!mod || !meta) return null
      try {
        const body = await loadLessonBody(meta)
        return { moduleId: mod.id, moduleTitle: mod.title, lessonId: meta.id, title: meta.title, body }
      } catch {
        return null
      }
    }),
  )
  return out.filter((l): l is LibraryLesson => l !== null)
}
