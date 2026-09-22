/* ============================================================================
   ORBIT — turning the app's state into one next action
   ----------------------------------------------------------------------------
   The choice itself lives in src/engine/focus.ts, deliberately knowing nothing
   about the curriculum so it can be tested against plain values. This file is
   the wiring: it reads the corpus, the graph and the learner's record, and
   hands that engine the five facts it needs.
   ========================================================================== */
import { lessonKey, lessonsFor, moduleById } from '@/curriculum'
import { pickFocus, type FocusInputs, type FocusPick } from '@/engine/focus'
import { dueAtoms, masteryMap, rankFrontier } from '@/engine/scheduler'
import type { LearnerState } from '@/engine/state'
import type { Dag } from '@/engine/graph'

export function focusInputs(state: LearnerState, dag: Dag, now: Date = new Date()): FocusInputs {
  const modules = dag.all()
  const inp: FocusInputs = { dueCount: dueAtoms(state, modules, now).length }

  if (state.live) inp.live = state.live

  // Where she actually stopped reading, which is not the same as the last
  // lesson she opened: a lesson opened and closed at the top is not started.
  const resume = state.resume
  if (resume?.moduleId && resume.lessonId) {
    const mod = moduleById(resume.moduleId)
    const lesson = lessonsFor(resume.moduleId).find((l) => l.id === resume.lessonId)
    const fraction = state.place[lessonKey(resume.moduleId, resume.lessonId)] ?? 0
    const alreadyRead = !!state.read[lessonKey(resume.moduleId, resume.lessonId)]
    if (mod && lesson && !alreadyRead) {
      inp.unfinished = {
        moduleId: mod.id,
        lessonId: lesson.id,
        title: lesson.title,
        fraction,
      }
    }
  }

  const mastery = masteryMap(state, modules, now)
  const top = rankFrontier(state, dag, mastery, now)[0]
  if (top) {
    inp.module = {
      id: top.module.id,
      title: top.module.title,
      started: top.mastery > 0.05 || !!state.read[top.module.id],
    }
    const next = lessonsFor(top.module.id).find((l) => !state.read[lessonKey(top.module.id, l.id)])
    if (next) inp.lesson = { id: next.id, title: next.title, minutes: next.minutes }
  }

  return inp
}

export function nextUp(state: LearnerState, dag: Dag, now: Date = new Date()): FocusPick {
  return pickFocus(focusInputs(state, dag, now))
}
