/* The coding modules' practice sets and tests (src/learn/modules/*.txt), held to their rules: each file
   belongs to a real module, each practice set to one of its lessons, and each file ends in the module's
   test. Whether every problem can be solved is checked with the courses, in solutions.test.ts. */
import { describe, expect, it } from 'vitest'
import { MODULES, lessonsFor } from '@/curriculum'
import { MODULE_TRACKS, moduleTest, testLocks } from './modules'
import { courseProblems } from './validate'

describe('module practice and tests', () => {
  it('each file belongs to a coding module, each practice set to one of its lessons, and each ends in a test', () => {
    const bad: string[] = []
    const ids = new Set<string>()
    for (const t of MODULE_TRACKS) {
      const mod = MODULES.find((m) => m.id === t.module)
      if (!mod) {
        bad.push(`${t.id}: "@module ${t.module}" is not a module`)
        continue
      }
      if (!mod.id.startsWith('cod_')) bad.push(`${t.id}: module files are for the coding modules`)
      const lessons = new Set(lessonsFor(mod.id).map((l) => l.id))
      const seen = new Set<string>()
      for (const l of t.lessons) {
        if (ids.has(l.id)) bad.push(`${l.id}: id used twice`)
        ids.add(l.id)
        if (l.gate) continue
        if (!l.forLesson) bad.push(`${l.id}: a module file holds practice sets ("--- for <lesson id>") and one test`)
        else if (!lessons.has(l.forLesson)) bad.push(`${l.id}: ${l.forLesson} is not a lesson of ${mod.id}`)
        else if (seen.has(l.forLesson)) bad.push(`${l.id}: a second practice set for ${l.forLesson}`)
        if (l.forLesson) seen.add(l.forLesson)
      }
      if (!t.lessons[t.lessons.length - 1]?.gate || t.lessons.filter((l) => l.gate).length !== 1) bad.push(`${t.id}: ends in exactly one module test`)
      bad.push(...courseProblems(t))
    }
    expect(bad).toEqual([])
  })

  it('a module stays locked until the test of each prerequisite that has one is passed', () => {
    const withTest = MODULE_TRACKS.map((t) => t.module!).find((id) => moduleTest(id) && MODULES.some((m) => m.prereqs.includes(id)))
    if (!withTest) return
    const child = MODULES.find((m) => m.prereqs.includes(withTest))!
    const test = moduleTest(withTest)!
    expect(testLocks(child, {}).map((l) => l.moduleId)).toContain(withTest)
    expect(testLocks(child, { [test.id]: new Date().toISOString() }).map((l) => l.moduleId)).not.toContain(withTest)
  })
})
