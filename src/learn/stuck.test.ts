import { describe, expect, it } from 'vitest'
import type { LibraryLesson } from '@/lib/explain'
import { SOLUTION_AFTER, STUCK_AFTER, stuckHelp } from './stuck'
import type { CheckResult } from './types'

const lesson = (lessonId: string, title: string, body: string): LibraryLesson => ({ moduleId: 'learn', moduleTitle: 'Terminal', lessonId, title, body })

const passed = [
  lesson('term-01', 'Where am I?', 'The pwd command prints your working directory, the folder you are in right now.'),
  lesson('term-03', 'Making folders', 'The mkdir command makes a new directory. Use mkdir -p to make the parent folders too, all in one go.'),
  lesson('term-04', 'Moving files', 'The mv command moves a file into another folder, or renames it.'),
]
const results: CheckResult[] = [
  { name: 'notes.txt exists', status: 'pass' },
  { name: 'The folder docs/2024/june exists', status: 'fail', hint: 'mkdir -p makes the parent folders too.' },
]
const task = 'Make the folder docs/2024/june in one command, then move notes.txt into it.'

describe('stuck help', () => {
  it('waits until she has failed a couple of times', () => {
    expect(stuckHelp(STUCK_AFTER - 1, results, task, passed)).toBeNull()
    expect(stuckHelp(STUCK_AFTER, results, task, passed)).not.toBeNull()
  })

  it('names the first check that is still failing and seeds Explain with it', () => {
    const help = stuckHelp(STUCK_AFTER, results, task, passed)!
    expect(help.miss.name).toBe('The folder docs/2024/june exists')
    expect(help.seed.selection).toBe('The folder docs/2024/june exists')
    expect(help.seed.paragraph).toContain('mkdir -p')
    expect(help.seed.paragraph).toContain(task)
  })

  it('points back to the passed lesson that taught the failing idea', () => {
    expect(stuckHelp(STUCK_AFTER, results, task, passed)!.revisit?.lessonId).toBe('term-03')
  })

  it('has no lesson to point back to before she has passed any', () => {
    expect(stuckHelp(STUCK_AFTER, results, task, [])!.revisit).toBeNull()
  })

  it('suggests the solution only after a few more tries', () => {
    expect(stuckHelp(SOLUTION_AFTER - 1, results, task, passed)!.suggestSolution).toBe(false)
    expect(stuckHelp(SOLUTION_AFTER, results, task, passed)!.suggestSolution).toBe(true)
  })

  it('offers nothing when every check passed or there are no results yet', () => {
    const allPass = results.map((r) => ({ ...r, status: 'pass' as const }))
    expect(stuckHelp(5, allPass, task, passed)).toBeNull()
    expect(stuckHelp(5, null, task, passed)).toBeNull()
  })
})
