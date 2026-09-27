/* ============================================================================
   Learn mode — does the explanation give the answer away?
   ----------------------------------------------------------------------------
   An example should show the idea on different names, values and data from
   the task, and show the pieces rather than the finished answer, so the task
   still asks her to think. This finds the lessons where it does not:

     - every line of the solution appears, word for word, in an example; or
     - the solution is two lines or more and every line has the same shape as
       an example line (same code with only the names and values swapped), so
       the task is filling in a template.

   A Terminal example's prompt (`~/project $ `) is ignored.
   ========================================================================== */
import type { LearnLesson } from './types'

const KEYWORDS = new Set(
  (
    'if else elif for while in def return print class import from as with try except finally and or not is none true false ' +
    'lambda yield break continue pass let const var function new int double float char void auto std cout cin endl include ' +
    'using namespace struct public private select where group by order join on insert into values update set delete create ' +
    'table having limit null count sum avg min max distinct left inner echo cd ls mkdir mv cp rm cat grep git'
  ).split(' '),
)

const unprompt = (line: string) => line.replace(/^\s*(~[^$\n]*\$|\$)\s*/, '')
const words = (line: string) => unprompt(line).trim().replace(/\s+/g, ' ')

/** The line with every name, string and number replaced, so only its form is left. */
function shape(line: string): string {
  return unprompt(line)
    .replace(/"[^"]*"|'[^']*'/g, 'S')
    .replace(/\b\d+(\.\d+)?\b/g, 'N')
    .replace(/[A-Za-z_]\w*/g, (w) => (KEYWORDS.has(w.toLowerCase()) ? w : 'I'))
    .replace(/\s+/g, '')
}

/** Comments, braces and one-word lines say nothing about the answer. */
function meaningful(line: string): boolean {
  const s = unprompt(line).trim()
  return s.length >= 6 && !/^(#|\/\/|--|\/\*|\*|[{})\]])/.test(s) && s !== 'else:' && s !== 'try:'
}

function exampleLines(teach: string): string[] {
  const code = [...teach.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]!).join('\n')
  return code.split('\n').filter(meaningful)
}

export type Giveaway = 'word-for-word' | 'same-shape' | null

export function givesAway(lesson: Pick<LearnLesson, 'teach' | 'solution'>): Giveaway {
  const solution = lesson.solution.split('\n').filter(meaningful)
  if (!solution.length) return null
  const shown = exampleLines(lesson.teach)
  const shownWords = new Set(shown.map(words))
  if (solution.every((l) => shownWords.has(words(l)))) return 'word-for-word'
  const shownShapes = new Set(shown.map(shape))
  if (solution.length >= 2 && solution.every((l) => shownShapes.has(shape(l)))) return 'same-shape'
  return null
}
