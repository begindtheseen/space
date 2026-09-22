import { describe, expect, it } from 'vitest'
import { dag as buildDag, lessonsFor, moduleById } from '@/curriculum'
import { markLessonRead } from '@/engine/apply'
import { lessonKey } from '@/curriculum'
import { newLearnerState, type LearnerState } from '@/engine/state'
import { focusInputs, nextUp } from './nextUp'

const dag = buildDag()
const now = new Date('2026-03-02T10:00:00.000Z')

describe('what the app offers to start', () => {
  it('never points at a module with nothing to read', () => {
    // Most of the curriculum is unwritten, so the highest-ranked module is
    // often one with no lessons. Offering it would open an empty page.
    const inp = focusInputs(newLearnerState(now), dag, now)
    expect(inp.module, 'expected a module to be offered').toBeDefined()
    expect(lessonsFor(inp.module!.id).length).toBeGreaterThan(0)
  })

  it('names the specific lesson it will open', () => {
    const inp = focusInputs(newLearnerState(now), dag, now)
    expect(inp.lesson).toBeDefined()
    const ids = lessonsFor(inp.module!.id).map((l) => l.id)
    expect(ids).toContain(inp.lesson!.id)
  })

  it('opens an in-app route that resolves to a real lesson', () => {
    const pick = nextUp(newLearnerState(now), dag, now)
    expect(pick.href.startsWith('/')).toBe(true)
    expect(pick.href.startsWith('//')).toBe(false)
    const m = /^\/module\/([^?]+)\?lesson=(.+)$/.exec(pick.href)
    if (m) {
      expect(moduleById(m[1]!), `${m[1]} is not a module`).toBeDefined()
      expect(lessonsFor(m[1]!).map((l) => l.id)).toContain(m[2])
    }
  })

  it('never offers a lesson she has already read', () => {
    /*
     * The picker walks down the ranking to the best module with something
     * unread in it, so reading out the top module does not end the offer —
     * it moves it to the next module that still has pages. That is the
     * intended behaviour and it becomes the normal case as the corpus fills
     * in. What must never happen, at any point along that walk, is being
     * offered a lesson that is already read or that does not exist.
     */
    let state: LearnerState = newLearnerState(now)
    const first = focusInputs(state, dag, now).module!.id
    const ids = lessonsFor(first).map((l) => l.id)
    for (const id of ids) state = markLessonRead(state, first, id, ids, now)

    const after = focusInputs(state, dag, now)
    if (after.lesson) {
      const mod = after.module!.id
      expect(
        lessonsFor(mod).map((l) => l.id),
        `offered a lesson that is not in ${mod}`,
      ).toContain(after.lesson.id)
      expect(
        state.read[lessonKey(mod, after.lesson.id)],
        'offered a lesson that is already read',
      ).toBeFalsy()
    }
  })

  it('stops naming a lesson once every lesson in the corpus is read', () => {
    /*
     * The exhaustion case the picker exists to survive. Reading everything
     * does not unlock anything — the graph turns on demonstrated mastery, not
     * on pages turned — so the offer stays on a module and must stop
     * promising a lesson, because there is not one left anywhere. Promising a
     * lesson that does not exist is the failure this whole picker guards
     * against, and it is the one the module page cannot paper over.
     */
    let state: LearnerState = newLearnerState(now)
    for (const mod of dag.all()) {
      const ids = lessonsFor(mod.id).map((l) => l.id)
      for (const id of ids) state = markLessonRead(state, mod.id, id, ids, now)
    }

    const after = focusInputs(state, dag, now)
    expect(after.lesson, 'must not offer a lesson when none is unread').toBeUndefined()

    const pick = nextUp(state, dag, now)
    expect(pick.kind).toBe('continue-module')
    expect(pick.href).not.toContain('?lesson=')
    expect(pick.href).toMatch(/^\/module\/[^?]+$/)
  })

  it('still offers something when the whole corpus has been read', () => {
    // Simulated by marking every lesson of every module read.
    let state: LearnerState = newLearnerState(now)
    for (const m of dag.all()) {
      const ids = lessonsFor(m.id).map((l) => l.id)
      for (const id of ids) state = markLessonRead(state, m.id, id, ids, now)
    }
    const pick = nextUp(state, dag, now)
    expect(pick.href.startsWith('/')).toBe(true)
    expect(pick.title).toBeTruthy()
  })

  it('picks up a half-read lesson before starting anything new', () => {
    const state = newLearnerState(now)
    const mod = focusInputs(state, dag, now).module!.id
    const lesson = lessonsFor(mod)[0]!
    const withPlace: LearnerState = {
      ...state,
      place: { [lessonKey(mod, lesson.id)]: 0.55 },
      resume: {
        kind: 'lesson',
        path: `/module/${mod}?lesson=${lesson.id}`,
        label: 'x',
        moduleId: mod,
        lessonId: lesson.id,
        at: now.toISOString(),
      },
    }
    const pick = nextUp(withPlace, dag, now)
    expect(pick.kind).toBe('resume-lesson')
    expect(pick.why).toContain('55%')
  })
})
