/* ============================================================================
   ORBIT — Ask AI
   ----------------------------------------------------------------------------
   Highlight anything in a lesson and the context panel explains it, built on
   what she has already read. Like an assistant that can only see what is on
   the phone, this one can only see what is in the app: the question it gets
   is the highlighted words, the paragraph around them, the lesson she is in,
   and a handful of passages from lessons she has read, picked because they
   share words with the highlight. Nothing else about her leaves the Mac — not
   her progress, her scores, her code or her notes.

   The shell holds the key and makes the call (desktop/ai.js); everything that
   decides what gets asked lives here, in the web bundle, so it improves with
   an ordinary update and can be tested without a network.
   ========================================================================== */
import { splitNotes, stripNoteRefs } from '@/lib/contextNotes'
import type { AiEvent, AiRequest } from '@/lib/desktop'
import { getOrbit } from '@/lib/desktop'

/** Claude Opus 5 at low effort with thinking off: quick, and still careful with maths. */
export const ASK_MODEL = 'claude-opus-5'
export const ASK_EFFORT = 'low' as const
export const ASK_MAX_TOKENS = 900

/** What she asked about, as the reader saw it. */
export interface AskSeed {
  /** The highlighted words. */
  selection: string
  /** The paragraph (or list item, or note) they sit in. */
  paragraph: string
}

/** A lesson the answer may draw on. */
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

/** A lesson the answer was built from, for the "Built on" links under it. */
export interface AskSource {
  moduleId: string
  lessonId: string
  title: string
  moduleTitle: string
}

export interface AskContext {
  system: string
  /** The first turn: the lesson, what she has learned, and the highlight. */
  question: string
  sources: AskSource[]
}

/* ── Picking what to send ────────────────────────────────────────────────── */

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
export function pickPassages(seed: AskSeed, library: LibraryLesson[], limit = 6): Passage[] {
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

/* ── The question ────────────────────────────────────────────────────────── */

export const SYSTEM_PROMPT = `You are Ask AI, the explainer built into ORBIT, a study app. The learner highlighted something in a lesson because it has not clicked yet. Your job is to make it click.

Who you are talking to: someone working up from middle-school maths towards engineering. They are smart and motivated, and they get lost when an explanation skips a step or leans on words they have not met.

How to explain:
- Answer first, in one or two plain sentences. Then, if it helps, one small worked example with real numbers, or an everyday comparison.
- Short sentences and everyday words. When a technical word is needed, say what it means the first time.
- Build on what they already know. The passages in <learned> come from lessons they have finished; when one of them helps, connect to it by the lesson's name ("It's the same idea as in *Fractions*…"). Do not assume anything that is not in those passages or in the current lesson.
- Stay inside the app. Use only the lesson and the passages you are given. If something needed is not covered there, explain it from the simplest idea that is, and say it comes up properly later. Never make up facts, lesson names or numbers from the course.
- Keep what the idea means intact. Simpler words, never a wrong idea.
- About 80–170 words. No headings, no lists longer than three items, no preamble, no "Great question", no sign-off.
- Markdown is fine. Write maths in KaTeX between single dollar signs, like $\\frac{3}{4}$.
- If the highlight is an ordinary word, say what it means in this sentence. If it is a whole passage, explain the one idea it hinges on.

For a follow-up question, answer that question in the same way, still using only what the app contains.`

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).trimEnd()}…` : s)
const attr = (s: string) => s.replace(/["<>\n]/g, ' ').trim()

/** The part of the current lesson around the highlight: the whole lesson when it is short, else a window around the paragraph. */
export function lessonWindow(lessonBody: string, paragraph: string, maxChars = 14_000): string {
  const prose = proseOf(lessonBody)
  if (prose.length <= maxChars) return prose
  const probe = paragraph.trim().slice(0, 60)
  const at = probe ? prose.indexOf(probe) : -1
  const centre = at >= 0 ? at : 0
  const start = Math.max(0, Math.min(centre - Math.floor(maxChars / 2), prose.length - maxChars))
  return `${start > 0 ? '…' : ''}${prose.slice(start, start + maxChars)}${start + maxChars < prose.length ? '…' : ''}`
}

export function buildAskContext({
  seed,
  here,
  library,
}: {
  seed: AskSeed
  /** The lesson she is reading. */
  here: LibraryLesson
  /** Lessons she has read (or tested out of), not including this one. */
  library: LibraryLesson[]
}): AskContext {
  const passages = pickPassages(
    seed,
    library.filter((l) => !(l.moduleId === here.moduleId && l.lessonId === here.lessonId)),
  )
  const learned = passages.length
    ? passages
        .map(
          (p, i) =>
            `<excerpt n="${i + 1}" lesson="${attr(p.lesson.title)}" module="${attr(p.lesson.moduleTitle)}">\n${p.text}\n</excerpt>`,
        )
        .join('\n')
    : '(Nothing yet: this is one of the first lessons they have read. Explain from the current lesson alone.)'
  const notes = [...splitNotes(here.body).notes.values()]
  const noteText = notes.length
    ? `\n<lesson_notes>\n${notes.map((n) => `- ${n.title}: ${clip(proseOf(n.body), 500)}`).join('\n')}\n</lesson_notes>`
    : ''

  const question = `<lesson module="${attr(here.moduleTitle)}" title="${attr(here.title)}">
${lessonWindow(here.body, seed.paragraph)}
</lesson>${noteText}
<learned>
${learned}
</learned>
<paragraph>
${clip(stripNoteRefs(seed.paragraph.trim()), 2000)}
</paragraph>
<highlight>
${clip(stripNoteRefs(seed.selection.trim()), 1200)}
</highlight>

Explain the highlighted part so it clicks for me.`

  const seen = new Set<string>()
  const sources: AskSource[] = []
  for (const p of passages) {
    const key = `${p.lesson.moduleId}::${p.lesson.lessonId}`
    if (seen.has(key)) continue
    seen.add(key)
    sources.push({ moduleId: p.lesson.moduleId, lessonId: p.lesson.lessonId, title: p.lesson.title, moduleTitle: p.lesson.moduleTitle })
  }
  return { system: SYSTEM_PROMPT, question, sources }
}

/** The request for the shell, with any follow-up turns after the first question. */
export function buildRequest(id: string, ctx: AskContext, turns: { role: 'user' | 'assistant'; content: string }[]): AiRequest {
  return {
    id,
    model: ASK_MODEL,
    effort: ASK_EFFORT,
    maxTokens: ASK_MAX_TOKENS,
    system: ctx.system,
    messages: alternate([{ role: 'user', content: ctx.question }, ...turns]),
  }
}

/**
 * The API wants turns that alternate, starting and ending with her. A stopped
 * answer that never said anything leaves two of her turns side by side; they
 * are joined rather than sent as a conversation it would refuse.
 */
export function alternate(turns: { role: 'user' | 'assistant'; content: string }[]): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = []
  for (const t of turns) {
    if (!t.content.trim()) continue
    const last = out[out.length - 1]
    if (last && last.role === t.role) last.content = `${last.content}\n\n${t.content}`
    else out.push({ ...t })
  }
  while (out.length && out[out.length - 1]!.role === 'assistant') out.pop()
  return out
}

/* ── Talking to the shell ────────────────────────────────────────────────── */

/** Whether this copy of the app can ask at all: the Mac app, from 1.1.3 on. */
export function askAvailable(): boolean {
  return !!getOrbit()?.ai
}

let counter = 0

/**
 * Streams one answer. `onText` gets each new piece as it arrives; the promise
 * resolves with how it ended. Call the returned cancel to stop it early.
 */
export function streamAnswer(
  build: (id: string) => AiRequest,
  onText: (text: string) => void,
): { done: Promise<AiEvent>; cancel: () => void } {
  const ai = getOrbit()?.ai
  const id = `ask-${Date.now().toString(36)}-${(counter++).toString(36)}`
  if (!ai) {
    return {
      done: Promise.resolve({ id, done: true, code: 'unavailable', error: 'Ask AI works in the ORBIT app on the Mac.' }),
      cancel: () => {},
    }
  }
  const done = new Promise<AiEvent>((resolve) => {
    let finished = false
    const finish = (e: AiEvent) => {
      if (finished) return
      finished = true
      off()
      resolve(e)
    }
    const off = ai.onEvent((e) => {
      if (!e || e.id !== id) return
      if (typeof e.text === 'string') onText(e.text)
      if (e.done) finish(e)
    })
    ai.explain(build(id))
      // The shell sends the last event before its call returns, so a call that
      // returns with nothing said was refused outright; do not wait forever.
      .then(() => setTimeout(() => finish({ id, done: true, code: 'unknown', error: 'The app did not answer.' }), 1500))
      .catch((err: unknown) => finish({ id, done: true, code: 'unknown', error: err instanceof Error ? err.message : String(err) }))
  })
  return {
    done,
    cancel: () => {
      void ai.cancel(id)
    },
  }
}
