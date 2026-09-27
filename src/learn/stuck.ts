/* ============================================================================
   ORBIT — "Stuck?" help for Learn to code
   ----------------------------------------------------------------------------
   After a couple of runs that do not pass, the lesson offers more than the
   next hint: which check is still failing, an Explain of what that check is
   about, the earlier lesson in this course that taught it, and, after a few
   more tries, a nudge to read the solution and then type it herself.
   Everything here is worked out from the course itself: no network.
   ========================================================================== */
import { pickPassages, type LibraryLesson } from '@/lib/explain'
import type { CheckResult } from './types'

/** Failed runs before the help appears, and before it suggests the solution. */
export const STUCK_AFTER = 2
export const SOLUTION_AFTER = 4

export interface StuckHelp {
  /** The first check that did not pass. */
  miss: CheckResult
  /** What to hand Explain: the check, with the task around it. */
  seed: { selection: string; paragraph: string }
  /** The passed lesson in this course that talks most about the failing check. */
  revisit: LibraryLesson | null
  /** She has tried enough times that reading the solution is the kind thing to suggest. */
  suggestSolution: boolean
}

/**
 * What to offer after `fails` runs that did not pass, given the latest check
 * results. Null until she has failed STUCK_AFTER times, or when nothing failed.
 */
export function stuckHelp(fails: number, results: CheckResult[] | null, task: string, passed: LibraryLesson[]): StuckHelp | null {
  if (fails < STUCK_AFTER || !results) return null
  const miss = results.find((r) => r.status === 'fail')
  if (!miss) return null
  const about = [miss.name, miss.hint, miss.detail].filter(Boolean).join('. ')
  const seed = { selection: miss.name, paragraph: `${about}\n\n${task}` }
  const [best] = pickPassages({ selection: about, paragraph: task }, passed, 1)
  return { miss, seed, revisit: best?.lesson ?? null, suggestSolution: fails >= SOLUTION_AFTER }
}
