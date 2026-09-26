/* ============================================================================
   Grading a module exercise, wherever it is done
   ----------------------------------------------------------------------------
   The same grading the playground's exercise mode does, for the playground
   embedded on the module page: Python against its tests, whole programs in
   the other languages against the reference solution's real output. Every
   result comes back as test cases.
   ========================================================================== */
import type { Graded } from '@/components/ide/Embed'
import type { Exercise } from '@/curriculum/types'
import type { CheckResult } from '@/learn/types'
import { runCode } from '@/lib/run'
import { buildTestProgram, capabilityOf, detectToolchains, parseTestOutput, python, runAgainstSolution } from '@/lib/runtimes'
import { SQL_SCHEMA } from '@/lib/scratch'

/** Whether an exercise has something to grade against, rather than just run. */
export function isGraded(ex: Exercise): boolean {
  if (ex.lang === 'python') return (ex.tests?.length ?? 0) > 0
  return ex.lang !== 'sql' && !!ex.solution
}

/** The schema an SQL exercise runs on: its own, when its starter builds tables. */
export function exerciseSchema(ex: Exercise): string | undefined {
  return ex.starter?.includes('CREATE TABLE') ? undefined : SQL_SCHEMA
}

export async function gradeExercise(ex: Exercise, code: string, stdin: string, onStatus: (s: string) => void): Promise<Graded> {
  const lang = ex.lang!
  if (lang === 'python' && ex.tests?.length) {
    const lines = stdin ? stdin.replace(/\n$/, '').split('\n') : undefined
    const out = await python.run(buildTestProgram(code, ex.tests), { onStatus, ...(lines ? { stdin: lines } : {}) })
    const parsed = parseTestOutput(out.stdout, ex.tests)
    const tests: CheckResult[] = parsed.outcomes.map((o, i) => ({
      name: o.name,
      status: o.status === 'pass' ? 'pass' : 'fail',
      ...(ex.tests![i] && !ex.tests![i]!.hidden ? { input: ex.tests![i]!.assert, expected: 'true' } : {}),
      ...(o.message ? { actual: o.message } : {}),
    }))
    return { run: { ...out, stdout: parsed.userOutput }, tests }
  }
  if (ex.solution && lang !== 'python' && lang !== 'sql' && capabilityOf(lang, await detectToolchains()).mode === 'execute') {
    const g = await runAgainstSolution(lang, code, ex.solution, stdin || undefined)
    return {
      run: g.yours,
      tests: [
        {
          name: 'Matches the reference solution',
          status: g.pass ? 'pass' : 'fail',
          input: stdin.trim() || '(no input)',
          ...(g.reference ? { expected: g.reference.stdout.trimEnd() } : {}),
          actual: g.yours.error ?? g.yours.stdout.trimEnd(),
          ...(g.pass ? {} : { detail: g.detail }),
        },
      ],
    }
  }
  const schema = lang === 'sql' ? exerciseSchema(ex) : undefined
  return { run: await runCode(lang, code, { stdin, onStatus, ...(schema ? { schema } : {}) }), tests: null }
}
