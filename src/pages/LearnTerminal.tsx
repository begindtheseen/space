/* The Terminal and Git challenge: the practice shell, a Check button, and the checks as test cases.
   Shared by lessons, practice problems, gate problems and re-tests. */
import { useState } from 'react'
import { IdePanel, IdeWindow, RunButton, TerminalView, TestCases } from '@/components/ide'
import { IconRefresh } from '@/components/icons'
import { gradeRun, lessonShell } from '@/learn/grade'
import { runLearn } from '@/learn/platform'
import type { CheckResult, LearnGrade, LearnLesson } from '@/learn/types'
import type { ShellState } from '@/lib/shell'

/** A Terminal or Git challenge: the practice shell, a Check button, and the checks as test cases. */
export function TerminalChallenge({
  lesson,
  onPass,
  onGraded,
}: {
  lesson: LearnLesson
  onPass: () => void
  onGraded: (passed: boolean, results: CheckResult[]) => void
}) {
  const [shell, setShell] = useState<ShellState>(() => lessonShell(lesson))
  const [key, setKey] = useState(0)
  const [grade, setGrade] = useState<LearnGrade | null>(null)
  const [running, setRunning] = useState(false)

  const check = async () => {
    setRunning(true)
    setGrade(null)
    try {
      const result = await runLearn(lesson, '', { shell })
      const g = gradeRun(lesson, '', result)
      setGrade(g)
      onGraded(g.passed, g.results)
      if (g.passed) onPass()
    } finally {
      setRunning(false)
    }
  }
  const reset = () => {
    setShell(lessonShell(lesson))
    setKey((k) => k + 1)
    setGrade(null)
  }

  return (
    <div className="embed">
      <IdeWindow
        lang="bash"
        file="~/project"
        right={
          <button type="button" className="ide__tool" onClick={reset} title="Start this lesson over">
            <IconRefresh size={13} />
            Reset
          </button>
        }
      >
        <TerminalView key={key} shell={shell} onShell={setShell} height={300} banner="Practice terminal for this lesson. Type help to see the commands." />
        <div className="lm-termbar">
          <RunButton onClick={() => void check()} running={running} label="Check" />
        </div>
        <IdePanel tabs={[{ id: 'tests', label: 'Test cases', ...(grade ? { mark: grade.passed ? ('pass' as const) : ('fail' as const) } : {}) }]} active="tests" onTab={() => {}}>
          <TestCases results={grade?.results ?? null} empty="Do the challenge in the terminal, then press Check." />
        </IdePanel>
      </IdeWindow>
    </div>
  )
}

