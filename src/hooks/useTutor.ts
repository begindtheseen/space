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

   While a page that uses it is open, the voice is kept loaded, so an answer
   starts soon after a run fails instead of waiting for the voice to wake.
   ========================================================================== */
import { useCallback, useEffect } from 'react'
import { tutorDismiss, tutorSpeak } from '@/components/Tutor'
import { DEFAULT_SETTINGS } from '@/engine/state'
import { useLearner } from '@/hooks/useLearner'
import { tutorLine, type TutorMemory } from '@/learn/tutor'
import { warmVoice } from '@/lib/voice/say'
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
  const voiceName = state.settings.voiceName

  // While a problem is open, the voice stays loaded: when a run fails, the answer starts soon, not after the
  // voice has woken up.
  useEffect(() => {
    if (!on) return
    const idle = (window as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 300))
    let release: (() => void) | null = null
    let gone = false
    idle(() => {
      if (!gone) release = warmVoice({ voiceName })
    })
    return () => {
      gone = true
      release?.()
    }
  }, [on, voiceName])

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
        schema: unit.schema,
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
