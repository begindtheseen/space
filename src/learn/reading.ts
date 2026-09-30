/* ============================================================================
   A Learn lesson as one reading, with stops at its code windows
   ----------------------------------------------------------------------------
   Read aloud, a lesson goes: the explanation, with each runnable example run
   where it stands; "Your turn" and the task, then a wait until she passes it;
   then each practice problem or question, read and waited on in turn.

   The player reads one piece of markdown, so the stops are written into it as
   sentences of their own ("Orbitpause c."), which the text preparation leaves
   whole and the player never speaks: reaching one, it does what the stop says
   and goes on. Code blocks that are not runnable stay as they were, and are
   announced the way they always have been.
   ========================================================================== */

/** The sentence that marks a stop. Letters only, so the text preparation leaves it exactly as written. */
const PAUSE = /^\s*Orbitpause ([a-z]+)\.?\s*$/

/** The stop in a sentence, or null. */
export function pauseIn(sentence: string): string | null {
  return PAUSE.exec(sentence)?.[1] ?? null
}

/** A stop's id: a, b, … z, ba, bb, …, letters only for the reason above. */
export function pauseId(n: number): string {
  let s = ''
  do {
    s = String.fromCharCode(97 + (n % 26)) + s
    n = Math.floor(n / 26)
  } while (n > 0)
  return s
}

export type Stop =
  /** A runnable example: run it, then read on. `code` is exactly what the page's code window shows. */
  | { kind: 'example'; info: string; code: string }
  /** The lesson's task: wait until it passes. */
  | { kind: 'task'; id: string }
  /** Bring up a practice item, so what is read next is on screen. */
  | { kind: 'show'; id: string }
  /** A practice problem or question: wait until it is passed. */
  | { kind: 'item'; id: string }

export interface ReadingItem {
  id: string
  /** What the item says, as markdown: a problem's title and task, a question's title, ask and choices. */
  text: string
}

export interface Reading {
  markdown: string
  stops: Record<string, Stop>
}

/**
 * The lesson as one reading. `runnable` says which code blocks the page turns
 * into code windows (lib/practice.ts runnableFence), so the stops land exactly
 * where the windows are. The blocks are found the way lib/markdown.tsx finds
 * them: a line starting with ``` opens one and the next such line closes it.
 */
export function readingOf(
  teach: string,
  task: string,
  items: readonly ReadingItem[],
  runnable: (info: string, code: string) => boolean,
): Reading {
  const stops: Record<string, Stop> = {}
  let n = 0
  const pause = (stop: Stop): string => {
    const id = pauseId(n++)
    stops[id] = stop
    return `\n\nOrbitpause ${id}.\n\n`
  }

  const lines = teach.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  // A context note (lib/contextNotes.ts) opens beside the text on a tap and is never read aloud,
  // so a code window inside one is not a stop.
  let inNote = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (/^[ \t]*:::[ \t]*context[ \t]+[a-z0-9]/.test(line)) inNote = true
    else if (inNote && /^[ \t]*:::[ \t]*$/.test(line)) inNote = false
    if (inNote || !line.trim().startsWith('```')) {
      out.push(line)
      continue
    }
    const info = line.trim().slice(3).trim()
    const body: string[] = []
    let j = i + 1
    while (j < lines.length && !lines[j]!.trim().startsWith('```')) body.push(lines[j++]!)
    const code = body.join('\n')
    if (runnable(info, code)) out.push(pause({ kind: 'example', info, code }))
    else out.push(...lines.slice(i, j + 1))
    i = j
  }

  let md = `${out.join('\n')}\n\nYour turn.\n\n${task}${pause({ kind: 'task', id: '' })}`
  for (const item of items) md += `${pause({ kind: 'show', id: item.id })}${item.text}${pause({ kind: 'item', id: item.id })}`
  return { markdown: md, stops }
}
