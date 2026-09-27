/* ============================================================================
   ORBIT — every context note, as one index
   ----------------------------------------------------------------------------
   Explain (src/lib/explain.ts) answers a highlight from the notes already
   written into the lessons, so it needs all of them at once without loading
   every lesson body (the lessons are megabytes; the notes are a fraction).
   The `virtual:context-notes` module in vite.config.ts runs this over every
   lesson file at build time and ships the result as its own lazily loaded
   chunk, fetched the first time she presses Explain.

   Like parse.ts, this file has no imports: vite.config.ts loads it in Node.
   ========================================================================== */

export interface IndexedNote {
  /** Module id (the lesson's folder). */
  m: string
  /** Lesson id, from the lesson's header. */
  l: string
  id: string
  title: string
  /** The note's markdown, picture included. */
  body: string
  /** Every phrase in the lesson marked with this note, as written there. */
  phrases: string[]
  /** Learn to code notes only: the lesson's and the course's titles, for the link under the note. */
  lt?: string
  ct?: string
}

const HEADER_ID = /^---\r?\n[\s\S]*?^id:[ \t]*(.+?)[ \t]*$[\s\S]*?\r?\n---/m
const NOTE_REF = /\[\[([^\]|\n]+)\|([a-z0-9][a-z0-9-]*)\]\]/g
const NOTE_BLOCK = /^[ \t]*:::[ \t]*context[ \t]+([a-z0-9][a-z0-9-]*)[ \t]*(.*)\r?\n([\s\S]*?)^[ \t]*:::[ \t]*$\n?/gm

/** The notes in one lesson file, with the phrases that open them. */
export function notesOf(moduleId: string, source: string): IndexedNote[] {
  const lessonId = HEADER_ID.exec(source)?.[1]?.replace(/^["']|["']$/g, '')
  if (!lessonId) return []
  const phrases = new Map<string, string[]>()
  for (const m of source.matchAll(NOTE_REF)) {
    const list = phrases.get(m[2]!) ?? []
    if (!list.includes(m[1]!)) list.push(m[1]!)
    phrases.set(m[2]!, list)
  }
  const out: IndexedNote[] = []
  for (const m of source.matchAll(NOTE_BLOCK)) {
    const id = m[1]!
    out.push({ m: moduleId, l: lessonId, id, title: (m[2] ?? '').trim() || id, body: (m[3] ?? '').trim(), phrases: phrases.get(id) ?? [] })
  }
  return out
}

/**
 * The notes in a Learn to code track file (src/learn/tracks/*.txt), one entry
 * per note, filed under `m: 'learn'` and the lesson's id, which is unique
 * across every track and is all a link to it needs.
 */
export function learnNotesOf(source: string): IndexedNote[] {
  const out: IndexedNote[] = []
  const course = /^@title[ \t]+(.+)$/m.exec(source)?.[1]?.trim() ?? ''
  const parts = source.split(/^=== /m).slice(1)
  for (const part of parts) {
    const head = /^(\S+)\s*\|\s*(.+)$/m.exec(part)
    const id = head?.[1]
    if (!id) continue
    const phrases = new Map<string, string[]>()
    for (const m of part.matchAll(NOTE_REF)) {
      const list = phrases.get(m[2]!) ?? []
      if (!list.includes(m[1]!)) list.push(m[1]!)
      phrases.set(m[2]!, list)
    }
    for (const m of part.matchAll(NOTE_BLOCK)) {
      out.push({
        m: 'learn',
        l: id,
        id: m[1]!,
        title: (m[2] ?? '').trim() || m[1]!,
        body: (m[3] ?? '').trim(),
        phrases: phrases.get(m[1]!) ?? [],
        lt: head[2]!.trim(),
        ct: course,
      })
    }
  }
  return out
}
