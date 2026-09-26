/* ============================================================================
   ORBIT — Explain
   ----------------------------------------------------------------------------
   Highlight anything in a lesson and press Explain: the context panel shows
   what the app already says about it, built on what she has read. It is not a
   chatbot and it makes no network call. The answer is assembled on the Mac,
   in a blink, from three things the course already contains:

     - context notes: the plain-words explanations written into every lesson,
       found by the phrase she highlighted, preferring the lesson she is in
       and the ones she has read (curriculum/lessons/notesIndex.ts);
     - flashcards whose front matches, for a one-line definition;
     - passages from lessons she has read that use the same words, so she can
       see where she met it before and go back.

   When none of those know the words, it says so and points at the lessons
   that teach them, rather than guessing.
   ========================================================================== */
import type { IndexedNote } from '@/curriculum/lessons/notesIndex'
import { splitNotes, stripNoteRefs } from '@/lib/contextNotes'

export interface ExplainSeed {
  /** The highlighted words. */
  selection: string
  /** The paragraph (or list item, or note) they sit in. */
  paragraph: string
}

/** A lesson Explain may quote from. */
export interface LibraryLesson {
  moduleId: string
  moduleTitle: string
  lessonId: string
  title: string
  body: string
}

export interface Passage {
  lesson: LibraryLesson
  text: string
  score: number
}

/* ── Matching words ──────────────────────────────────────────────────────── */

const STOP = new Set(
  (
    'a an and are as at be been but by can do does for from has have how i if in into is it its of on or so ' +
    'than that the their them then there these they this to was we what when where which while who why will ' +
    'with you your our not no yes just also more most much very each one two same other such only own out up ' +
    'about over after before because could would should may might must here all any some like get got make ' +
    'made says say said way use used using see seen let lets'
  ).split(' '),
)

/** Words worth matching on: lower-cased, stemmed a little, stopwords and one-letter noise dropped. */
export function terms(text: string): string[] {
  const out: string[] = []
  for (const raw of text.toLowerCase().match(/[a-z][a-z0-9']*|\d+(?:\.\d+)?/g) ?? []) {
    const w = raw.replace(/'s$|'/g, '')
    if (w.length < 2 || STOP.has(w)) continue
    // Plurals only: cutting -ing and -ed off English words does more harm than good.
    out.push(w.length > 3 ? w.replace(/ies$/, 'y').replace(/([^s])s$/, '$1') : w)
  }
  return out
}

/**
 * Plain prose from a lesson's markdown: notes' marks unwrapped and their
 * blocks, code, pictures and exercise fences left out, so a passage reads like
 * the lesson and not like its source file.
 */
export function proseOf(md: string): string {
  const { body } = splitNotes(md)
  return stripNoteRefs(body)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^:::.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** A lesson cut into passages of a few paragraphs, each under its section heading. */
export function passagesOf(lesson: LibraryLesson, maxChars = 900): string[] {
  const out: string[] = []
  let heading = ''
  let buf = ''
  const flush = () => {
    const text = buf.trim()
    if (text.length > 80) out.push(heading ? `${heading}\n${text}` : text)
    buf = ''
  }
  for (const para of proseOf(lesson.body).split(/\n\s*\n/)) {
    const p = para.trim()
    if (!p) continue
    if (/^#{1,4}\s/.test(p)) {
      flush()
      heading = p.replace(/^#+\s*/, '## ')
      continue
    }
    if (buf && buf.length + p.length > maxChars) flush()
    buf += (buf ? '\n\n' : '') + (p.length > maxChars ? `${p.slice(0, maxChars)}…` : p)
  }
  flush()
  return out
}

/**
 * The passages from lessons she has read that share the most with what she
 * asked about, scored the way a search engine would (rare shared words count
 * for more), with at most two from any one lesson so one long lesson cannot
 * crowd out the rest.
 */
export function pickPassages(seed: ExplainSeed, library: LibraryLesson[], limit = 6): Passage[] {
  const all: { lesson: LibraryLesson; text: string; words: Set<string>; len: number; counts: Map<string, number> }[] = []
  for (const lesson of library) {
    for (const text of passagesOf(lesson)) {
      const ws = terms(`${lesson.title} ${text}`)
      const counts = new Map<string, number>()
      for (const w of ws) counts.set(w, (counts.get(w) ?? 0) + 1)
      all.push({ lesson, text, words: new Set(ws), len: ws.length, counts })
    }
  }
  if (!all.length) return []
  const df = new Map<string, number>()
  for (const p of all) for (const w of p.words) df.set(w, (df.get(w) ?? 0) + 1)

  // The highlight itself matters most; the paragraph around it adds context.
  const want = new Map<string, number>()
  for (const w of terms(seed.paragraph)) want.set(w, Math.max(want.get(w) ?? 0, 1))
  for (const w of terms(seed.selection)) want.set(w, 3)
  if (!want.size) return []

  const n = all.length
  const avg = all.reduce((s, p) => s + p.len, 0) / n
  // A lesson that keeps coming back to the words is about them; one that
  // mentions them once in passing is not. That lifts each of its passages.
  const lessonHits = new Map<LibraryLesson, number>()
  for (const p of all) {
    let hits = 0
    for (const w of want.keys()) hits += p.counts.get(w) ?? 0
    lessonHits.set(p.lesson, (lessonHits.get(p.lesson) ?? 0) + hits)
  }
  const scored: Passage[] = []
  for (const p of all) {
    let score = 0
    for (const [w, weight] of want) {
      const tf = p.counts.get(w) ?? 0
      if (!tf) continue
      const idf = Math.log(1 + (n - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5))
      // BM25: repeats count for less each time, long passages are evened out.
      score += weight * idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (p.len / avg))))
    }
    if (score > 0) scored.push({ lesson: p.lesson, text: p.text, score: score * (1 + 0.25 * Math.log1p(lessonHits.get(p.lesson) ?? 0)) })
  }
  scored.sort((a, b) => b.score - a.score)
  const perLesson = new Map<string, number>()
  const out: Passage[] = []
  for (const p of scored) {
    const key = `${p.lesson.moduleId}::${p.lesson.lessonId}`
    if ((perLesson.get(key) ?? 0) >= 2) continue
    perLesson.set(key, (perLesson.get(key) ?? 0) + 1)
    out.push(p)
    if (out.length >= limit) break
  }
  return out
}

/* ── Notes ───────────────────────────────────────────────────────────────── */

export interface RankedNote {
  note: IndexedNote
  score: number
  /** Where the note sits relative to her: the lesson she is in, one she has read, one before it she skipped, or one still ahead. */
  where: 'here' | 'read' | 'earlier' | 'ahead'
}

const key = (m: string, l: string) => `${m}::${l}`
const norm = (s: string) => terms(stripNoteRefs(s)).join(' ')

/**
 * The notes that explain the highlighted words, best first. A note whose
 * marked phrase or title is the highlight wins outright; after that, notes
 * whose phrases and titles share its words, with the note's own text counting
 * for less. Notes from the lesson she is in, then from lessons she has read,
 * come ahead of ones she has not reached, and two notes saying the same thing
 * under the same title collapse to one.
 */
export function rankNotes(
  seed: ExplainSeed,
  notes: IndexedNote[],
  me: { here: { moduleId: string; lessonId: string }; read: ReadonlySet<string>; earlier?: ReadonlySet<string> },
  limit = 4,
): RankedNote[] {
  const sel = norm(seed.selection)
  const selTerms = new Set(sel.split(' ').filter(Boolean))
  if (!selTerms.size) return []
  const df = new Map<string, number>()
  for (const n of notes) for (const w of new Set(terms(`${n.title} ${n.phrases.join(' ')}`))) df.set(w, (df.get(w) ?? 0) + 1)
  const idf = (w: string) => Math.log(1 + notes.length / (1 + (df.get(w) ?? 0)))

  const scored: RankedNote[] = []
  for (const note of notes) {
    const labels = [...note.phrases, note.title].map(norm).filter(Boolean)
    let score = 0
    if (labels.includes(sel)) score += 100
    else if (labels.some((l) => (` ${l} `).includes(` ${sel} `) || (` ${sel} `).includes(` ${l} `))) score += 40
    const labelTerms = new Set(labels.join(' ').split(' '))
    let hits = 0
    for (const w of selTerms) {
      if (labelTerms.has(w)) {
        score += 6 * idf(w)
        hits++
      }
    }
    // Every word she highlighted should be in the note's name for it to be about them.
    if (score < 40 && hits < Math.min(selTerms.size, 2)) continue
    if (score <= 0) continue
    const bodyTerms = new Set(terms(note.body))
    for (const w of selTerms) if (bodyTerms.has(w)) score += idf(w)
    const k = key(note.m, note.l)
    const where = k === key(me.here.moduleId, me.here.lessonId) ? 'here' : me.read.has(k) ? 'read' : me.earlier?.has(k) ? 'earlier' : 'ahead'
    score *= where === 'here' ? 1.6 : where === 'ahead' ? 1 : 1.35
    scored.push({ note, score, where })
  }
  scored.sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const out: RankedNote[] = []
  for (const r of scored) {
    const t = norm(r.note.title)
    if (seen.has(t)) continue
    seen.add(t)
    out.push(r)
    if (out.length >= limit) break
  }
  return out
}

/* ── Flashcards ──────────────────────────────────────────────────────────── */

export interface CardHit {
  moduleId: string
  front: string
  back: string
}

/** Flashcards whose front names the highlighted words, most exact first. */
export function matchCards(seed: ExplainSeed, cards: CardHit[], limit = 2): CardHit[] {
  const sel = norm(seed.selection)
  const selTerms = sel.split(' ').filter(Boolean)
  if (!selTerms.length) return []
  const scored: { card: CardHit; score: number }[] = []
  for (const card of cards) {
    const front = norm(card.front)
    if (!front) continue
    const fTerms = new Set(front.split(' '))
    const shared = selTerms.filter((w) => fTerms.has(w)).length
    if (shared < selTerms.length) continue
    // A short front that is mostly the highlight is a definition of it.
    const score = (front === sel ? 10 : 0) + shared / fTerms.size
    if (score >= 0.5) scored.push({ card, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.card)
}

/* ── Passages ────────────────────────────────────────────────────────────── */

/** A few sentences of a passage around the first of the highlighted words, for a quote. */
export function snippet(text: string, seed: ExplainSeed, max = 320): string {
  const flat = text.replace(/^## .*\n/, '').replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const words = terms(seed.selection)
  const lower = flat.toLowerCase()
  let at = -1
  for (const w of words) {
    at = lower.indexOf(w.slice(0, Math.max(3, w.length - 1)))
    if (at >= 0) break
  }
  const start = Math.max(0, Math.min((at < 0 ? 0 : at) - Math.floor(max / 3), flat.length - max))
  const from = start > 0 ? flat.indexOf(' ', start) + 1 : 0
  return `${from > 0 ? '…' : ''}${flat.slice(from, from + max).trimEnd()}${from + max < flat.length ? '…' : ''}`
}
