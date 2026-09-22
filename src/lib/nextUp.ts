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

  /*
   * The frontier is ranked by what she should learn next. What she can
   * actually read next is a smaller set, because most of the curriculum is
   * still being written.
   *
   * Sending her to the top-ranked module regardless would mean the one button
   * the whole focus design rests on can open a page with nothing on it. A
   * block that begins by finding nothing to do is worse than no block, so the
   * pick walks down the ranking to the best module that has a lesson she has
   * not read. Only if nothing at all is readable does it fall back to the top
   * of the ranking, and then the module page's own notice explains why the
   * page is thin.
   */
  const mastery = masteryMap(state, modules, now)
  const ranked = rankFrontier(state, dag, mastery, now)

  const unread = (moduleId: string) =>
    lessonsFor(moduleId).find((l) => !state.read[lessonKey(moduleId, l.id)])

  const readable = ranked.find((c) => unread(c.module.id))
  const top = readable ?? ranked.find((c) => lessonsFor(c.module.id).length > 0) ?? ranked[0]

  if (top) {
    inp.module = {
      id: top.module.id,
      title: top.module.title,
      started: top.mastery > 0.05 || !!state.read[top.module.id],
    }
    const next = unread(top.module.id)
    if (next) inp.lesson = { id: next.id, title: next.title, minutes: next.minutes }
  }

  return inp
}

export function nextUp(state: LearnerState, dag: Dag, now: Date = new Date()): FocusPick {
  return pickFocus(focusInputs(state, dag, now))
}
