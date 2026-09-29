/* ============================================================================
   Learn mode — what every course is held to
   ----------------------------------------------------------------------------
   The rules a course must meet before it ships, as one function that lists
   what is wrong. Used by the draft checker (draft.test.ts), which a writer
   runs on a course file that is not in the app yet. The same rules are
   checked for the shipped courses in learn.test.ts.
   ========================================================================== */
import { noteRefs, notePicture, pictureProblem, splitNotes } from '@/lib/contextNotes'
import { givesAway } from './giveaway'
import { asLesson } from './practice'
import type { LearnTrack } from './types'

export const LEARN_NOTES_MIN = 3
export const LEARN_NOTES_MAX = 10

/** Practice problems each lesson of a degree course carries. */
export const DEGREE_PRACTICE = { min: 5, max: 8 } as const
/** Problems in a degree course's gate. */
export const DEGREE_GATE = { min: 8, max: 12 } as const

const CONTROL = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/

/** Everything wrong with a course, one line each; empty when it meets every rule. */
export function courseProblems(t: LearnTrack): string[] {
  const out: string[] = []
  const bad = (where: string, what: string) => out.push(`${where}: ${what}`)

  for (const l of t.lessons) {
    const where = `${t.id} ${l.id}`
    for (const p of [...l.practice, ...(l.gate?.problems ?? [])]) {
      if (p.task.length <= 20) bad(p.id, 'the task is too short to be exact')
      if (!p.checks.some((c) => c.kind !== 'source')) bad(p.id, 'graded on its source text alone')
      if (noteRefs(p.task).length) bad(p.id, 'context marks go in the explanation, not a problem')
      for (const part of [p.task, ...p.hints]) if (CONTROL.test(part)) bad(p.id, 'a control character (a TeX or escape lost its backslash)')
    }
    for (const p of l.practice) {
      if (!p.hints.length) bad(p.id, 'a practice problem needs at least one hint')
      if (p.checks.length < 3 && !(p.checks.length && p.checks.every((c) => c.kind === 'output'))) bad(p.id, 'at least three checks, or an output check over several cases')
      if (givesAway(asLesson(l, p))) bad(p.id, "the lesson's example gives this problem away")
    }

    if (l.gate) {
      if (l.teach.length <= 40) bad(where, 'a gate says what it covers')
      if (t.subject && (l.gate.problems.length < DEGREE_GATE.min || l.gate.problems.length > DEGREE_GATE.max)) {
        bad(where, `a degree course's gate has ${DEGREE_GATE.min}–${DEGREE_GATE.max} problems`)
      }
      continue
    }

    if (l.teach.length <= 80) bad(where, 'the explanation is too short')
    if (l.task.length <= 20) bad(where, 'the task is too short to be exact')
    if (!l.solution.trim()) bad(where, 'no solution')
    if (!l.hints.length) bad(where, 'no hint')
    if (!l.checks.some((c) => c.kind !== 'source')) bad(where, 'graded on its source text alone')
    if (givesAway(l)) bad(where, 'the example gives the answer away')
    if (t.subject && (l.practice.length < DEGREE_PRACTICE.min || l.practice.length > DEGREE_PRACTICE.max)) {
      bad(where, `a degree course's lesson has ${DEGREE_PRACTICE.min}–${DEGREE_PRACTICE.max} practice problems (it has ${l.practice.length})`)
    }

    const { body, notes } = splitNotes(l.teach)
    const refs = noteRefs(body)
    const unmatched = [...new Set(refs)].filter((id) => !notes.has(id))
    if (unmatched.length) bad(where, `marked phrases with no note: ${unmatched.join(', ')}`)
    const orphans = [...notes.keys()].filter((id) => !refs.includes(id))
    if (orphans.length) bad(where, `notes nothing points to: ${orphans.join(', ')}`)
    if (noteRefs(l.task).length) bad(where, 'marks go in the explanation, not the task')
    if (notes.size) {
      const first = l.teach.search(/^\s*:::\s*context\s/m)
      const after = l.teach.slice(first).replace(/^[ \t]*:::[ \t]*context[\s\S]*?^[ \t]*:::[ \t]*$/gm, '').trim()
      if (after) bad(where, 'notes go at the very end of the explanation')
    }
    for (const n of notes.values()) {
      const words = n.body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length
      if (words < 15 || words > 260) bad(where, `note "${n.id}" has ${words} words (15–260)`)
      const svg = notePicture(n.body)
      const pic = svg ? pictureProblem(svg) : null
      if (pic) bad(where, `note "${n.id}" picture: ${pic}`)
    }
    if (t.plainVoice && (notes.size < LEARN_NOTES_MIN || notes.size > LEARN_NOTES_MAX)) {
      bad(where, `${LEARN_NOTES_MIN}–${LEARN_NOTES_MAX} context notes (it has ${notes.size})`)
    }
    for (const part of [l.teach, l.task, ...l.hints]) if (CONTROL.test(part)) bad(where, 'a control character (a TeX or escape lost its backslash)')
  }

  if (t.subject) {
    if (!t.plainVoice) bad(t.id, 'a degree course is written in the plain voice: add "@plainvoice true"')
    // A draft part (`cs-dsa1-part3`) is joined into its course later; only the course needs the gate.
    const gates = t.lessons.filter((l) => l.gate)
    const part = /-part\d+$/.test(t.id)
    if (!part && (gates.length !== 1 || !t.lessons[t.lessons.length - 1]!.gate)) bad(t.id, 'a degree course ends in exactly one mastery gate')
    if (part && gates.length > 1) bad(t.id, 'at most one gate')
  }
  return out
}
