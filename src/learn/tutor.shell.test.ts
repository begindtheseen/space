import { appendFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TRACKS } from './full'
import { gradeRun } from './grade'
import { gradedUnits } from './practice'
import { tutorLine } from './tutor'
import { mistakesFor, typed } from './tutorMistakes'
import type { LearnLesson } from './types'

function say(unit: LearnLesson, lines: string[], attempt = 1) {
  const s = typed(unit, lines)
  const g = gradeRun(unit, '', { stdout: '', stderr: '', error: null, shell: s, ms: 0 })
  return tutorLine({ lang: unit.lang, task: unit.task, hints: unit.hints, solution: unit.solution, starter: unit.starter, code: s.history.join('\n'), run: g, checks: unit.checks, attempt, said: [] })
}

const lesson = (starter: string, solution: string, facts: string[]): LearnLesson => ({
  id: 'test',
  lang: 'bash',
  title: 'Test',
  teach: '',
  task: 'Do the thing.',
  starter,
  solution,
  hints: [],
  checks: [{ kind: 'shell', name: 'It is done', facts }],
  practice: [],
})

describe('the terminal tutor names the mistake that was made', () => {
  it('a misspelt command, and the one she meant', () => {
    const u = lesson('', 'pwd', ['ran pwd'])
    expect(say(u, ['pdw'])!.text).toMatch(/no command called `pdw`\. You meant `pwd`: two letters are swapped/)
    expect(say(u, ['PWD'])!.text).toMatch(/all small letters: it's `pwd`, not `PWD`/)
  })

  it('a file name misspelt when it was made, found when it is used', () => {
    const u = lesson('touch server.log', 'grep ERROR server.log > errors.txt\nwc -l errors.txt', ['file errors.txt', 'ran wc -l errors.txt'])
    const t = say(u, ['grep ERROR server.log > erorrs.txt', 'wc -l errors.txt'])!
    expect(t.text).toMatch(/made it as `erorrs\.txt`: two letters are swapped/)
    expect(t.text).toMatch(/mv erorrs\.txt errors\.txt/)
  })

  it('capital letters in a name', () => {
    const u = lesson('', 'mkdir logs\ncd logs', ['cwd logs'])
    expect(say(u, ['mkdir Logs', 'cd logs'])!.text).toMatch(/made it as `Logs`: the capital letters are different/)
  })

  it('commands in the wrong order', () => {
    const u = lesson('', 'mkdir -p reports\necho "3 passed" > reports/summary.txt', ['file reports/summary.txt == 3 passed'])
    expect(say(u, ['echo "3 passed" > reports/summary.txt', 'mkdir -p reports'])!.text).toMatch(/before the folder `reports` existed/)
    const g = lesson('git init\ntouch notes.txt', 'git add notes.txt\ngit commit -m "Add notes"', ['git . commits == 1'])
    expect(say(g, ['git commit -m "Add notes"', 'git add notes.txt'])!.text).toMatch(/never happened: you ran `git commit` before adding/)
  })

  it('a file made while standing in the wrong folder', () => {
    const u = lesson('mkdir src docs', 'touch docs/notes.txt', ['file docs/notes.txt'])
    const t = say(u, ['cd src', 'touch notes.txt'])!
    expect(t.memory.kind).toBe('place')
    expect(t.text).toMatch(/it's in `~\/project\/src`, and the task wants it in `~\/project\/docs`/)
    expect(t.text).toMatch(/while you were in `~\/project\/src`/)
  })

  it('the text written into the wrong file', () => {
    const u = lesson('touch motto.txt checklist.txt', 'echo "Ad astra" > motto.txt', ['file motto.txt == Ad astra'])
    expect(say(u, ['echo "Ad astra" > checklist.txt'])!.text).toMatch(/went into `checklist\.txt`, not into `motto\.txt`/)
  })

  it('> where >> was needed', () => {
    const u = lesson('', 'echo "buy fuel" > todo.txt\necho "check engines" >> todo.txt', ['file todo.txt == buy fuel\\ncheck engines'])
    expect(say(u, ['echo "buy fuel" > todo.txt', 'echo "check engines" > todo.txt'])!.text).toMatch(/one arrow empties `todo\.txt` before it writes\. So the line that was already in it, “buy fuel”, was wiped out\. Two arrows, `>>`, add to the end/s)
  })

  it('printed on the screen instead of into the file', () => {
    const u = lesson('touch status.txt', 'echo "GO" > status.txt', ['file status.txt == GO'])
    expect(say(u, ['echo "GO"'])!.text).toMatch(/printed the text on the screen, but it didn't go into `status\.txt`/)
  })

  it('a slash at the start of a folder name', () => {
    const u = lesson('mkdir hangar', 'cd hangar', ['cwd hangar'])
    expect(say(u, ['cd /hangar'])!.text).toMatch(/slash at the very start/)
  })

  it('already inside the folder a path starts with', () => {
    const u = lesson('mkdir chapters\ntouch chapters/intro.txt', 'cat chapters/intro.txt', ['ran cat chapters/intro.txt', 'status 0'])
    expect(say(u, ['cd chapters', 'cat chapters/intro.txt'])!.text).toMatch(/already inside `chapters`/)
  })

  it('copied where it should have moved', () => {
    const u = lesson('touch draft.md\nmkdir drafts', 'mv draft.md drafts/', ['file drafts/draft.md', 'missing draft.md'])
    expect(say(u, ['cp draft.md drafts/'])!.text).toMatch(/`cp` makes a copy and leaves the original/)
  })

  it('Git: outside the repository, and a misspelt branch', () => {
    const u = lesson('mkdir station\ncd station\ngit init\ncd ..', 'cd station\ngit status', ['cwd station'])
    expect(say(u, ['git status'])!.text).toMatch(/outside the repository/)
    const b = lesson('git init\ntouch a.txt\ngit add a.txt\ngit commit -m "one"', 'git switch -c feature', ['git . branch feature'])
    expect(say(b, ['git switch -c featuer'])!.text).toMatch(/[Yy]ou made a branch called `featuer`, and the task wants `feature`/)
  })

  it('Git: the fixed version of a conflict written into a near name', () => {
    const u = TRACKS.flatMap((t) => t.lessons.flatMap(gradedUnits)).find((x) => x.id === 'git3-04')!
    const t = say(u, ['git rebase main', 'git status', 'echo "Hello, space!" > greteing.txt', 'git add greeting.txt', 'git rebase --continue'])!
    expect(t.text).toMatch(/fixed version went into `greteing\.txt`, not `greeting\.txt`/)
  })
})

describe('across every Terminal and Git lesson', () => {
  // Every lesson and practice problem, with each realistic mistake made in its solution and run on the
  // practice shell: the share of runs where the tutor calls it what it is. Every kind of mistake is named
  // every time, and this keeps it that way.
  const FLOOR: Record<string, number> = {
    'typo-command': 1, 'case-command': 1, 'typo-name': 1, 'case-name': 1, swap: 1, 'wrong-folder': 1,
    'wrong-file': 1, overwrite: 1, 'no-add': 1, 'cp-not-mv': 1, 'leading-slash': 1, 'typo-branch': 1, 'drop-last': 1,
  }

  it('names the mistake that was made, nearly every time', () => {
    const units = TRACKS.filter((t) => t.lang === 'bash' || t.lang === 'git').flatMap((t) => t.lessons.flatMap(gradedUnits))
    const stats = new Map<string, { n: number; ok: number }>()
    const misses: string[] = []
    for (const u of units)
      for (const m of mistakesFor(u)) {
        const s = typed(u, m.lines)
        const g = gradeRun(u, '', { stdout: '', stderr: '', error: null, shell: s, ms: 0 })
        if (g.passed) continue
        const t = tutorLine({ lang: u.lang, task: u.task, hints: u.hints, solution: u.solution, starter: u.starter, code: s.history.join('\n'), run: g, checks: u.checks, attempt: 1, said: [] })
        const st = stats.get(m.name) ?? { n: 0, ok: 0 }
        st.n++
        if (t && m.expect.includes(t.memory.kind) && (!m.mention || t.text.includes(m.mention))) st.ok++
        else misses.push(`[${m.name}] ${u.id} kind=${t?.memory.kind}\n  typed: ${m.lines.join(' ⏎ ')}\n  said: ${t?.text ?? '(nothing)'}`)
        stats.set(m.name, st)
      }
    // TUTOR_REPORT=file writes every kind's score and every miss there.
    if (process.env.TUTOR_REPORT)
      appendFileSync(process.env.TUTOR_REPORT, `${[...stats].sort().map(([k, s]) => `${k.padEnd(14)} ${String(s.n).padStart(5)}  ${((100 * s.ok) / s.n).toFixed(1)}%`).join('\n')}\n\n${misses.join('\n')}\n`)
    const below = Object.entries(FLOOR)
      .filter(([k, floor]) => (stats.get(k)?.n ?? 0) > 0 && stats.get(k)!.ok / stats.get(k)!.n < floor)
      .map(([k, floor]) => `${k}: ${((100 * stats.get(k)!.ok) / stats.get(k)!.n).toFixed(1)}% (floor ${floor * 100}%)`)
    expect(below).toEqual([])
    expect([...stats.values()].reduce((n, s) => n + s.n, 0)).toBeGreaterThan(4000)
  }, 300_000)
})
