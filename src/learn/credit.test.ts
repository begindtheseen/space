/* The credit map (credit-map.ts) and the rules that use it (credit.ts). Every id in the map must be real,
   and credit must be earned only by proof: every mapped Learn lesson mastered, every mapped course
   mastered, every mapped module test really passed, and credit never flowing through credit. */
import { describe, expect, it } from 'vitest'
import { MODULES, lessonsFor } from '@/curriculum'
import { courseCredit, courseLock, creditedLessonKeys, gatePassed, lessonCredit, moduleCredit, moduleTestPassed, type CreditMap } from './credit'
import { CREDIT } from './credit-map'
import { TRACKS, findLesson, trackFor } from './index'
import { moduleTest } from './modules'
import { gateOf } from './practice'
import type { LearnLesson, LearnTrack } from './types'

const WHEN = '2026-01-01T00:00:00.000Z'

/** Everything a lesson needs to count as mastered: its task, each practice problem and each question. */
function master(lesson: LearnLesson, passed: Record<string, string> = {}): Record<string, string> {
  if (lesson.gate) return { ...passed, [lesson.id]: WHEN }
  const out = { ...passed }
  if (!lesson.forLesson) out[lesson.id] = WHEN
  for (const p of lesson.practice) out[p.id] = WHEN
  for (const q of lesson.quiz ?? []) out[q.id] = WHEN
  return out
}

/** Every lesson of a course mastered and its gate passed. */
function masterCourse(track: LearnTrack, passed: Record<string, string> = {}): Record<string, string> {
  return track.lessons.reduce((acc, l) => master(l, acc), passed)
}

function lesson(id: string): LearnLesson {
  const found = findLesson(id)
  if (!found) throw new Error(`no Learn lesson ${id}`)
  return found.lesson
}

function course(id: string): LearnTrack {
  const t = TRACKS.find((x) => x.id === id)
  if (!t) throw new Error(`no Learn course ${id}`)
  return t
}

describe('the credit map', () => {
  const moduleIds = new Set(MODULES.map((m) => m.id))

  it('every module lesson key names a real lesson of a real module', () => {
    const bad: string[] = []
    for (const key of Object.keys(CREDIT.lessons)) {
      const [m, l, ...rest] = key.split('::')
      if (!m || !l || rest.length) bad.push(`${key}: not "<module>::<lesson>"`)
      else if (!moduleIds.has(m)) bad.push(`${key}: ${m} is not a module`)
      else if (!lessonsFor(m).some((x) => x.id === l)) bad.push(`${key}: ${l} is not a lesson of ${m}`)
    }
    expect(bad).toEqual([])
  })

  it('every mapped Learn lesson exists, and no entry is empty or repeats a lesson', () => {
    const bad: string[] = []
    for (const [key, ids] of Object.entries(CREDIT.lessons)) {
      if (!ids.length) bad.push(`${key}: no Learn lessons`)
      if (new Set(ids).size !== ids.length) bad.push(`${key}: a Learn lesson listed twice`)
      for (const id of ids) if (!findLesson(id)) bad.push(`${key}: ${id} is not a Learn lesson`)
    }
    expect(bad).toEqual([])
  })

  it('every overlap key names a real module lesson, lists real Learn lessons, and says what is new', () => {
    const bad: string[] = []
    for (const [key, { learn, newHere }] of Object.entries(CREDIT.overlap ?? {})) {
      const [m, l, ...rest] = key.split('::')
      if (!m || !l || rest.length) bad.push(`${key}: not "<module>::<lesson>"`)
      else if (!moduleIds.has(m)) bad.push(`${key}: ${m} is not a module`)
      else if (!lessonsFor(m).some((x) => x.id === l)) bad.push(`${key}: ${l} is not a lesson of ${m}`)
      if (key in CREDIT.lessons) bad.push(`${key}: already fully credited, so no overlap entry`)
      if (!learn.length) bad.push(`${key}: no Learn lessons`)
      if (new Set(learn).size !== learn.length) bad.push(`${key}: a Learn lesson listed twice`)
      for (const id of learn) {
        const found = findLesson(id)
        if (!found) bad.push(`${key}: ${id} is not a Learn lesson`)
        else if (found.lesson.gate) bad.push(`${key}: ${id} is a gate, not a lesson`)
      }
      if (!newHere.trim()) bad.push(`${key}: newHere is empty`)
    }
    expect(bad).toEqual([])
  })

  it('every course id names a real Learn course, exactly', () => {
    const bad: string[] = []
    const ids = [...Object.values(CREDIT.modules).flat(), ...Object.keys(CREDIT.courses)]
    for (const id of ids) if (trackFor(id)?.id !== id) bad.push(`${id} is not a Learn course id`)
    for (const [m, courses] of Object.entries(CREDIT.modules)) if (!courses.length) bad.push(`${m}: no courses`)
    expect(bad).toEqual([])
  })

  it('every module id names a real module', () => {
    const bad: string[] = []
    const ids = [...Object.keys(CREDIT.modules), ...Object.values(CREDIT.courses).flat()]
    for (const id of ids) if (!moduleIds.has(id)) bad.push(`${id} is not a module`)
    for (const [c, mods] of Object.entries(CREDIT.courses)) if (!mods.length) bad.push(`${c}: no modules`)
    expect(bad).toEqual([])
  })

  it('gives nothing to a learner who has done nothing', () => {
    expect(creditedLessonKeys({})).toEqual(new Set())
    for (const m of Object.keys(CREDIT.modules)) expect(moduleCredit(m, {})).toBeNull()
    for (const c of Object.keys(CREDIT.courses)) expect(courseCredit(c, {})).toBeNull()
  })
})

describe('credit rules, on a small made-up map', () => {
  const PY = 'cod_py_01_basics'
  const test = moduleTest(PY)!
  const MAP: CreditMap = {
    lessons: { [`${PY}::l06-functions`]: ['py-08', 'py-08b'] },
    modules: { [PY]: ['python', 'python-intermediate'] },
    courses: { python: [PY], 'python-advanced': [PY] },
  }

  it('the module used here has a real test', () => {
    expect(test).toBeDefined()
    expect(lessonsFor(PY).some((l) => l.id === 'l06-functions')).toBe(true)
  })

  it('credits a module lesson only when every mapped Learn lesson is mastered', () => {
    const one = master(lesson('py-08'))
    expect(lessonCredit(PY, 'l06-functions', one, MAP)).toBeNull()

    const both = master(lesson('py-08b'), one)
    expect(lessonCredit(PY, 'l06-functions', both, MAP)?.map((l) => l.id)).toEqual(['py-08', 'py-08b'])
    expect(creditedLessonKeys(both, MAP)).toEqual(new Set([`${PY}::l06-functions`]))

    // The task alone is not mastery: a single practice problem left undone withholds the credit.
    const withPractice = lesson('py-08b').practice.length ? lesson('py-08b') : lesson('py-08')
    const missing = { ...both }
    delete missing[withPractice.practice[0]!.id]
    expect(lessonCredit(PY, 'l06-functions', missing, MAP)).toBeNull()

    // A lesson the map does not name earns nothing.
    expect(lessonCredit(PY, 'l07-scope-legb-and-closures', both, MAP)).toBeNull()
  })

  it('credits a module test only when every mapped course is mastered, gate included', () => {
    const basics = masterCourse(course('python'))
    expect(moduleCredit(PY, basics, MAP)).toBeNull()
    expect(moduleTestPassed(PY, basics, MAP)).toBe(false)

    const inter = course('python-intermediate')
    const both = masterCourse(inter, basics)
    expect(moduleCredit(PY, both, MAP)?.map((t) => t.id)).toEqual(['python', 'python-intermediate'])
    expect(moduleTestPassed(PY, both, MAP)).toBe(true)

    const gate = inter.lessons.find((l) => l.gate)
    if (gate) {
      const noGate = { ...both }
      delete noGate[gate.id]
      expect(moduleCredit(PY, noGate, MAP)).toBeNull()
    }
  })

  it('credits a Learn gate only on a real pass of the module test', () => {
    const python = course('python')
    expect(courseCredit('python', {}, MAP)).toBeNull()
    expect(gatePassed(python, {}, MAP)).toBe(false)

    const sat = { [test.id]: WHEN }
    expect(courseCredit('python', sat, MAP)).toEqual([PY])
    expect(gatePassed(python, sat, MAP)).toBe(true)
  })

  it('never lets credit flow through credit', () => {
    // Mastering the two courses credits the module test ...
    const both = masterCourse(course('python-intermediate'), masterCourse(course('python')))
    expect(moduleTestPassed(PY, both, MAP)).toBe(true)
    expect(both[test.id]).toBeUndefined()
    // ... but that credited test does not in turn pass another course's gate.
    expect(courseCredit('python-advanced', both, MAP)).toBeNull()
    expect(gatePassed(course('python-advanced'), both, MAP)).toBe(false)
    // Only sitting the test does.
    expect(courseCredit('python-advanced', { ...both, [test.id]: WHEN }, MAP)).toEqual([PY])
  })
})

describe('course locks follow @requires', () => {
  it('a degree course opens once the gate of every course it requires is passed, and not before', () => {
    const dsa2 = trackFor('cs-dsa2')!
    expect(dsa2.requires?.length).toBeGreaterThan(0)
    let passed: Record<string, string> = {}
    for (const id of dsa2.requires!) {
      expect(courseLock(dsa2, passed)?.track.id).toBe(id)
      passed = { ...passed, [gateOf(trackFor(id)!)!.id]: WHEN }
    }
    expect(courseLock(dsa2, passed)).toBeUndefined()
  })
})
