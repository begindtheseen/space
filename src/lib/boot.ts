/* ============================================================================
   ORBIT — the boot sequence
   ----------------------------------------------------------------------------
   The splash used to be a picture shown for a fixed 1.4 seconds while nothing
   happened, and then the app appeared and did its expensive work in front of
   her: mastery recomputed over the whole corpus on first render, KaTeX fetched
   the first time a lesson opened maths, the lesson body fetched when she
   clicked into it.

   So the work moved here. Every step below is work the app was going to do
   anyway, done while there is a picture on screen to look at instead of a
   half-drawn interface. The splash reports each step as it happens, so the
   time it takes is time it is visibly spending, and the first thing she
   touches afterwards is already warm.

   The rule this file has to keep: nothing here exists to fill time. If a step
   stops being useful it comes out, and none of them may block the boot — a
   step that fails or hangs is skipped and the app starts anyway. Losing a
   warm cache is nothing; failing to start is everything.
   ========================================================================== */
import { MODULES, dag as buildDag, lessonsFor, loadLessonBody } from '@/curriculum'
import { dueAtoms, masteryMap } from '@/engine/scheduler'
import type { LearnerState } from '@/engine/state'

export interface BootStep {
  /** Shown on the splash, in the present tense. */
  label: string
  run: (state: LearnerState) => Promise<unknown> | unknown
  /**
   * Steps marked optional are skipped without complaint when they fail. All
   * of them are, currently — that is the point — but the flag is explicit so
   * that adding a genuinely required step later is a deliberate act.
   */
  optional: true
}

/**
 * Sent through the shell's boot-status channel to say the warm-up is over.
 * Matches BOOT_DONE in desktop/main.js; a control character so it can never
 * collide with a step label.
 */
export const BOOT_DONE_SIGNAL = '\u0000boot-done'

/** No single step may hold the boot longer than this. */
export const STEP_TIMEOUT_MS = 4000

/**
 * Work worth doing before the window appears.
 *
 * Ordered by how soon she is likely to need the result: the thing she will
 * click first is warmed first, so even a boot that is cut short has done the
 * most valuable part.
 */
export function bootSteps(): BootStep[] {
  return [
    {
      label: 'Building the prerequisite graph',
      optional: true,
      // The DAG is a full pass over every module and its edges. It is cached
      // after the first build, so doing it here means the first render of any
      // page that needs it is free rather than janky.
      run: () => buildDag(),
    },
    {
      label: 'Working out where you got to',
      optional: true,
      // Mastery is a pass over every atom in the corpus, and the home page
      // renders three separate things derived from it.
      run: (state) => {
        const mastery = masteryMap(state, MODULES)
        buildDag().readiness(mastery)
        return mastery
      },
    },
    {
      label: 'Counting what is due',
      optional: true,
      run: (state) => dueAtoms(state, MODULES).length,
    },
    {
      label: 'Warming the equation renderer',
      optional: true,
      // KaTeX and its stylesheet are a few hundred kilobytes, fetched lazily
      // the first time a lesson contains maths — which is every lesson. Doing
      // it here is the difference between maths appearing and maths popping in.
      run: async () => {
        const [katex] = await Promise.all([import('katex'), import('katex/dist/katex.min.css')])
        // Render once as well as importing: the first call is where the font
        // metrics get built, and that is the part that shows.
        katex.default.renderToString('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', {
          throwOnError: false,
        })
      },
    },
    {
      label: 'Fetching the lesson you were reading',
      optional: true,
      // The single most likely next action, made instant. Skipped silently
      // when there is no resume point, which is the case on a first run.
      run: async (state) => {
        const resume = state.resume
        if (!resume?.moduleId || !resume.lessonId) return null
        const lesson = lessonsFor(resume.moduleId).find((l) => l.id === resume.lessonId)
        if (!lesson) return null
        return loadLessonBody(lesson)
      },
    },
  ]
}

export interface BootReport {
  /** Steps that finished, in order. */
  completed: string[]
  /** Steps that failed or timed out, with why. The app starts regardless. */
  skipped: { label: string; reason: string }[]
  ms: number
}

export type BootProgress = (label: string, index: number, total: number) => void

/**
 * Runs the sequence, reporting each step as it starts.
 *
 * Every step is wrapped in a timeout, because a step that hangs would
 * otherwise hold the window closed forever — a warm cache is never worth a
 * failure to start.
 */
export async function runBoot(
  state: LearnerState,
  onProgress: BootProgress = () => {},
  steps: BootStep[] = bootSteps(),
): Promise<BootReport> {
  const startedAt = Date.now()
  const completed: string[] = []
  const skipped: { label: string; reason: string }[] = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!
    onProgress(step.label, i, steps.length)
    try {
      await withTimeout(Promise.resolve(step.run(state)), STEP_TIMEOUT_MS, step.label)
      completed.push(step.label)
    } catch (err) {
      skipped.push({ label: step.label, reason: err instanceof Error ? err.message : String(err) })
    }
  }

  return { completed, skipped, ms: Date.now() - startedAt }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} took longer than ${ms} ms`)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e: unknown) => {
        clearTimeout(timer)
        reject(e instanceof Error ? e : new Error(String(e)))
      },
    )
  })
}
