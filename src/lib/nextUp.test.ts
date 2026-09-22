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

  it('stops naming a lesson once they have all been read', () => {
    /*
     * Reading every lesson in a module does not open the next one — the graph
     * unlocks on demonstrated mastery, not on pages turned — so the offer
     * correctly stays on the same module. What must change is that it no
     * longer promises a lesson, because there is not one left. Promising a
     * lesson that does not exist is the failure this whole picker guards
     * against; the module page it opens instead is where practice lives.
     */
    let state: LearnerState = newLearnerState(now)
    const first = focusInputs(state, dag, now).module!.id
    const ids = lessonsFor(first).map((l) => l.id)
    for (const id of ids) state = markLessonRead(state, first, id, ids, now)

    const after = focusInputs(state, dag, now)
    expect(after.lesson, 'must not offer a lesson that is already read').toBeUndefined()

    const pick = nextUp(state, dag, now)
    expect(pick.kind).toBe('continue-module')
    expect(pick.href).toBe(`/module/${first}`)
    expect(pick.href).not.toContain('?lesson=')
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
