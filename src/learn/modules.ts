/* ============================================================================
   ORBIT modules — practice sets and module tests
   ----------------------------------------------------------------------------
   One file per coding module in modules/, in the Learn file format (see
   parse.ts and PRACTICE.md):

     @track python
     @course mod-cod_py_01_basics
     @module cod_py_01_basics
     @title Python basics: practice and test

     === py01-l01 | Practice: Hello, Python
     --- for l01-hello-python              (the module lesson it belongs to)
     +++ practice | …                      (problems, graded like Learn's)
     +++ question | …                      (questions, where code cannot run here)

     === py01-test | Python basics: module test
     --- teach / --- gate / +++ problem / +++ question

   A practice set shows under its lesson in the reader. The test is the
   module's last step, and a module that builds on this one stays locked until
   it is passed.
   ========================================================================== */
import { parseTrack } from './parse'
import { gateOf } from './practice'
import type { LearnLesson, LearnTrack } from './types'

const FILES = import.meta.glob('./modules/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const MODULE_TRACKS: LearnTrack[] = Object.entries(FILES)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, text]) => parseTrack(text, path.split('/').pop()!))

const BY_MODULE = new Map(MODULE_TRACKS.map((t) => [t.module ?? '', t]))

export function moduleFile(moduleId: string): LearnTrack | undefined {
  return BY_MODULE.get(moduleId)
}

/** A module's test, if it has one. */
export function moduleTest(moduleId: string): LearnLesson | undefined {
  const t = BY_MODULE.get(moduleId)
  return t ? gateOf(t) : undefined
}

/** The practice set under one lesson of a module. */
export function practiceFor(moduleId: string, lessonId: string): LearnLesson | undefined {
  return BY_MODULE.get(moduleId)?.lessons.find((l) => l.forLesson === lessonId)
}

/** A practice set or test by its own id (re-tests and links find them this way). */
export function findModuleLesson(id: string): { track: LearnTrack; lesson: LearnLesson; index: number } | undefined {
  for (const track of MODULE_TRACKS) {
    const index = track.lessons.findIndex((l) => l.id === id)
    if (index >= 0) return { track, lesson: track.lessons[index]!, index }
  }
  return undefined
}

/** The prerequisite modules whose test has not been passed yet: what keeps a module locked. */
export function testLocks(
  module: { prereqs: string[] },
  passed: Record<string, string>,
  credited: (moduleId: string) => boolean = () => false,
): { moduleId: string; test: LearnLesson }[] {
  return module.prereqs.flatMap((moduleId) => {
    const test = moduleTest(moduleId)
    return test && !passed[test.id] && !credited(moduleId) ? [{ moduleId, test }] : []
  })
}
