/* ============================================================================
   ORBIT — context notes
   ----------------------------------------------------------------------------
   The lesson's margin notes, in the spirit of an annotated lyric sheet: a
   phrase in the text is marked, and tapping it opens a panel beside the lesson
   with what it means, where it comes from, or the picture that makes it
   click. The lesson reads straight through without them; they are there for
   the moment a word or a step stops her.

   In the lesson source:

     … a quantity with a [[direction|direction-sign]] as well as a size …

     ::: context direction-sign Why a sign is a direction
     Plain-language explanation, in the lesson's markdown. May hold a picture
     as a fenced `svg` block (drawn in dark ink on a light card).
     :::

   `[[phrase|id]]` marks the phrase; `::: context <id> <title>` holds the note.
   Notes sit together at the end of the lesson, after the Summary, so the
   lesson reads the same in any editor. They are never read aloud, and the
   marked phrase is read as the plain phrase, so adding notes to a lesson does
   not change a word of what the voice says.
   ========================================================================== */

export interface ContextNote {
  id: string
  title: string
  /** The note's own markdown: prose, math, and at most one `svg` picture. */
  body: string
}

/** A marked phrase: `[[phrase|id]]`. */
export const NOTE_REF = /\[\[([^\]|\n]+)\|([a-z0-9][a-z0-9-]*)\]\]/g

/** A note block: `::: context <id> <title>` … `:::`, which may not hold other blocks. */
const NOTE_BLOCK = /^[ \t]*:::[ \t]*context[ \t]+([a-z0-9][a-z0-9-]*)[ \t]*(.*)\r?\n([\s\S]*?)^[ \t]*:::[ \t]*$\n?/gm

/** The lesson without its note blocks, and the notes by id. */
export function splitNotes(md: string): { body: string; notes: Map<string, ContextNote> } {
  const notes = new Map<string, ContextNote>()
  const body = md.replace(NOTE_BLOCK, (_m, id: string, title: string, text: string) => {
    notes.set(id, { id, title: title.trim() || id, body: text.trim() })
    return ''
  })
  return { body: body.replace(/\n{3,}$/g, '\n'), notes }
}

/** The ids the text refers to, in order, repeats included. */
export function noteRefs(md: string): string[] {
  return [...md.matchAll(NOTE_REF)].map((m) => m[2]!)
}

/** The text with every marked phrase back to its plain words. */
export function stripNoteRefs(text: string): string {
  return text.replace(NOTE_REF, '$1')
}

/** The picture in a note, if it has one. */
export function notePicture(body: string): string | null {
  return /```svg\s*\n([\s\S]*?)```/.exec(body)?.[1]?.trim() ?? null
}

/**
 * Why a picture may not be shown, or null when it may. Pictures are drawn as
 * an image, which runs no script whatever the file says; this keeps them
 * small, self-contained and honest anyway.
 */
export function pictureProblem(svg: string): string | null {
  if (!/^<svg[\s>]/.test(svg)) return 'must start with <svg'
  if (!/<\/svg>\s*$/.test(svg)) return 'must end with </svg>'
  if (!/\bviewBox=/.test(svg)) return 'needs a viewBox, so it scales to the panel'
  if (svg.length > 16_000) return `is ${svg.length} characters; keep it under 16,000`
  if (/<script|<foreignObject|\bon[a-z]+\s*=|javascript:/i.test(svg)) return 'may not hold script, event handlers or foreignObject'
  if (/(?:xlink:)?href\s*=\s*["'](?!#)/i.test(svg)) return 'may only link inside itself (href="#…")'
  if (/<image\b/i.test(svg)) return 'may not embed other images'
  return null
}
