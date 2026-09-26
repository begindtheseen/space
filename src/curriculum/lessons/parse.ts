/* ============================================================================
   ORBIT — lesson file format
   ----------------------------------------------------------------------------
   A lesson is one markdown file under `src/curriculum/lessons/<moduleId>/`,
   named `<nn>-<slug>.md`, opening with a small header block:

     ---
     id: l01-functions
     title: Functions, domain and range
     minutes: 22
     covers:
       - functions: domain, range, composition, inverses
       - exponentials and logarithms
     ---

   `covers` lists the module's topic strings, verbatim, that the lesson
   teaches. The validator requires the union across a module's lessons to be
   exactly the module's topic list, which is how "nothing is left out" is
   enforced rather than hoped for.

   This file has no imports on purpose: the manifest script runs it under
   plain Node, and the app and the tests import it through Vite.
   ========================================================================== */

export interface LessonHeader {
  id: string
  title: string
  minutes: number
  covers: string[]
}

export interface ParsedLesson {
  header: LessonHeader
  body: string
}

export class LessonFormatError extends Error {}

const HEADER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** Removes one matching pair of outer quotes. A lone quote is left alone. */
function unquote(v: string): string {
  if (v.length >= 2) {
    const first = v[0]
    if ((first === '"' || first === "'") && v[v.length - 1] === first) return v.slice(1, -1)
  }
  return v
}

export function parseLesson(source: string, where = 'lesson'): ParsedLesson {
  const m = HEADER_RE.exec(source)
  if (!m) throw new LessonFormatError(`${where}: missing the --- header block`)
  const header: Partial<LessonHeader> & { covers: string[] } = { covers: [] }
  let inCovers = false
  for (const raw of m[1]!.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) continue
    if (inCovers && /^\s+-\s+/.test(line)) {
      // Topics routinely contain colons and commas, so quoting one is the
      // natural thing to write. Matching outer quotes are a wrapper, not part
      // of the topic, and a topic must match the module's string verbatim.
      header.covers.push(unquote(line.replace(/^\s+-\s+/, '').trim()))
      continue
    }
    inCovers = false
    const kv = /^([a-z]+):\s*(.*)$/.exec(line)
    if (!kv) throw new LessonFormatError(`${where}: cannot read header line "${line}"`)
    const [, key, value] = kv
    switch (key) {
      case 'id':
        header.id = value!.trim()
        break
      case 'title':
        header.title = unquote(value!.trim())
        break
      case 'minutes':
        header.minutes = Number(value)
        break
      case 'covers':
        inCovers = true
        if (value!.trim()) throw new LessonFormatError(`${where}: "covers" must be a list, one "- topic" per line`)
        break
      default:
        throw new LessonFormatError(`${where}: unknown header key "${key}"`)
    }
  }
  if (!header.id || !/^[a-z0-9][a-z0-9-]*$/.test(header.id)) {
    throw new LessonFormatError(`${where}: id must be lowercase letters, digits and dashes`)
  }
  if (!header.title) throw new LessonFormatError(`${where}: title is required`)
  if (!Number.isFinite(header.minutes) || header.minutes! <= 0) {
    throw new LessonFormatError(`${where}: minutes must be a positive number`)
  }
  if (header.covers.length === 0) throw new LessonFormatError(`${where}: covers must list at least one topic`)
  return {
    header: { id: header.id, title: header.title, minutes: header.minutes!, covers: header.covers },
    body: source.slice(m[0].length),
  }
}

/** Words in a body, ignoring math and code so long derivations do not inflate the count. */
export function proseWordCount(body: string): number {
  // Context notes are optional reading beside the lesson; they do not make
  // the lesson itself longer, so they are not counted towards its length.
  // (The same two patterns as src/lib/contextNotes.ts, repeated because this
  // file must import nothing.)
  const stripped = body
    .replace(/^[ \t]*:::[ \t]*context[ \t]+[a-z0-9][a-z0-9-]*[^\n]*\n[\s\S]*?^[ \t]*:::[ \t]*$/gm, ' ')
    .replace(/\[\[([^\]|\n]+)\|[a-z0-9][a-z0-9-]*\]\]/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]+\$/g, ' ')
  return stripped.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length
}
