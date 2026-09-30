/* ============================================================================
   ORBIT — the tutor, listening to runs
   ----------------------------------------------------------------------------
   The lesson page and its practice call this after every graded run. A run
   that fails is handed to the tutor with everything about that problem so
   far: how many times it has failed, what was said each time, what the last
   failed run looked like. A run that passes clears all of that and puts the
   tutor away, without a word.

   Never used in a course's exam or a spaced re-test: those are tests, and a
   voice helping would make them something else.
   ========================================================================== */
import { useCallback } from 'react'
import { tutorDismiss, tutorSpeak } from '@/components/Tutor'
import { DEFAULT_SETTINGS } from '@/engine/state'
import { useLearner } from '@/hooks/useLearner'
import { tutorLine, type TutorMemory } from '@/learn/tutor'
import type { LearnGrade, LearnLesson } from '@/learn/types'

/** A graded run, as the lesson page has it. */
export interface HeardRun {
  code: string
  /** The program that ran, when her code was wrapped by the checker. */
  program?: string
  grade: LearnGrade
}

const memory = new Map<string, { attempts: number; said: string[]; before: TutorMemory | null }>()

/** Forgets a problem's history (a test, or a fresh start). */
export function forgetTutor(id: string): void {
  memory.delete(id)
}

export function useTutor(): (id: string, unit: LearnLesson, run: HeardRun) => void {
  const { state } = useLearner()
  const on = state.settings.spokenHints !== false
  const full = state.settings.displayName.trim()
  const name = full && full !== DEFAULT_SETTINGS.displayName ? full.split(/\s+/)[0] : undefined

  return useCallback(
    (id, unit, run) => {
      if (run.grade.passed) {
        memory.delete(id)
        tutorDismiss()
        return
      }
      if (!on) return
      const m = memory.get(id) ?? { attempts: 0, said: [], before: null }
      m.attempts += 1
      const line = tutorLine({
        lang: unit.lang,
        task: unit.task,
        hints: unit.hints,
        solution: unit.solution,
        starter: unit.starter,
        code: run.code,
        program: run.program,
        run: run.grade,
        checks: unit.checks,
        attempt: m.attempts,
        said: m.said,
        before: m.before,
        name,
      })
      if (!line) return
      m.said.push(line.text)
      m.before = line.memory
      memory.set(id, m)
      tutorSpeak(line.text)
    },
    [on, name],
  )
}
