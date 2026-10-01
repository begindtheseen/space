/* ============================================================================
   Openings, made ahead
   ----------------------------------------------------------------------------
   Pressing play should be heard at once, on any lesson. Making speech takes
   seconds (the workers start, then the first sentence is made), so the only
   way to start at once is for the opening to be made already: the first
   dozen or so seconds of the lesson, kept on the device apart from everything
   else (natural.ts, OPENINGS_CACHE). Played from there, the reading starts
   the moment she taps, and by the time the opening has been heard the
   workers are up and the sentences after it are made.

   So while she is on a lesson, the openings of the lessons she is likely to
   open next (the rest of the module, the next module) are made in spare
   time, one at a time, on one worker, never while a lesson is being read.
   ========================================================================== */
import { prepare, toUtterances } from '@/lib/speech'
import { pauseIn } from '@/learn/reading'
import { CHARS_PER_SECOND, naturalVoiceFor, speechUnits, type NaturalVoiceInfo, type SpeechUnit } from './kokoro'
import { isPhone, naturalSupported, naturalVoice, unitChars } from './natural'

/** Remembers that she uses read-aloud, so the voice gets ready when a lesson opens. */
export const USED_KEY = 'natural-voice:used'

/** The most pieces an opening is made of. */
const MAX_OPENING_UNITS = 4

/** What the natural voice reads, for a lesson's prepared text (speech.ts `prepare().text`). The reader and the openings use this one function, so they always name the same pieces. */
export function unitsOf(text: string): SpeechUnit[] {
  return speechUnits(text, (p) => toUtterances(p, 100_000), unitChars())
}

/** What the natural voice reads, for a lesson's markdown. */
export function readingUnits(markdown: string): SpeechUnit[] {
  return unitsOf(prepare(markdown).text)
}

/**
 * The start of a lesson's markdown, enough for its opening: whole paragraphs up to about `chars`, never cut
 * inside a code block. Preparing a whole lesson for speech takes tens of milliseconds; its head, a fraction.
 */
export function headOf(markdown: string, chars: number): string {
  if (markdown.length <= chars) return markdown
  const lines = markdown.split('\n')
  let fence: string | null = null
  let size = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const mark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (mark) {
      if (!fence) fence = mark[0]!
      else if (mark[0] === fence) fence = null
    }
    size += line.length + 1
    if (size >= chars && !fence && line.trim() === '' && i > 0) return lines.slice(0, i).join('\n')
  }
  return markdown
}

/**
 * The opening of a lesson, from its markdown (see openingOf). Worked out from the lesson's head, made longer
 * only when the opening runs to its end, so the cut never falls inside the opening.
 */
export function openingFor(markdown: string, rate = 1, seconds = runwaySeconds()): SpeechUnit[] {
  for (const chars of [2500, 10_000]) {
    const head = headOf(markdown, chars)
    const units = readingUnits(head)
    const opening = openingOf(units, rate, seconds)
    if (head === markdown || opening.length < units.length) return opening
  }
  return openingOf(readingUnits(markdown), rate, seconds)
}

/**
 * Seconds of opening that cover what happens behind it: the workers starting (a couple of seconds) and the
 * piece after the opening being made. A device that makes speech slowly gets a longer one.
 */
export function runwaySeconds(rtf = naturalVoice.expectedRtf()): number {
  return Math.min(30, Math.max(12, 4 + 10 * rtf))
}

/**
 * The opening of a reading: whole pieces from the start until about `seconds` of speech, at least one, stopping
 * at the first stop written into it (learn/reading.ts), where the reading waits anyway.
 */
export function openingOf(units: readonly SpeechUnit[], rate = 1, seconds = runwaySeconds()): SpeechUnit[] {
  const out: SpeechUnit[] = []
  const pace = Math.max(0.5, rate)
  let said = 0
  for (const u of units) {
    if (pauseIn(u.text)) break
    out.push(u)
    said += (u.text.length / CHARS_PER_SECOND + u.pause) / pace
    if (said >= seconds || out.length >= MAX_OPENING_UNITS) break
  }
  return out
}

/** A lesson's reading text, fetched when its turn comes; null to pass over it. */
export type Source = () => Promise<string | null> | string | null

let generation = 0
let readerActive = false

/** The lesson reader says when it is reading: openings wait, so they never take a worker from it. */
export function setReaderActive(on: boolean): void {
  readerActive = on
}

function used(): boolean {
  try {
    return localStorage.getItem(USED_KEY) === '1'
  } catch {
    return false
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Makes the openings of these lessons ahead, in order, replacing whatever list came before. Only on a computer
 * (a phone has the memory for one worker, and it is kept for the lesson on screen), only for someone who uses
 * read-aloud, and never starting a download. Returns the cancel.
 */
export function readAhead(sources: readonly Source[], opts: { voiceName?: string; rate: number; delayMs?: number }): () => void {
  const gen = ++generation
  naturalVoice.clear('ahead')
  const voice = naturalVoiceFor(opts.voiceName)
  if (!voice || !sources.length || typeof window === 'undefined' || !naturalSupported() || isPhone() || !used()) return () => {}
  const timer = setTimeout(() => void run(gen, sources, voice, opts.rate), opts.delayMs ?? 1200)
  return () => {
    clearTimeout(timer)
    if (generation !== gen) return
    generation++
    naturalVoice.clear('ahead')
  }
}

async function run(gen: number, sources: readonly Source[], voice: NaturalVoiceInfo, rate: number): Promise<void> {
  const live = () => gen === generation
  if (naturalVoice.status === 'failed' || !(await naturalVoice.downloaded())) return
  for (const source of sources) {
    while (readerActive && live()) await sleep(1000)
    if (!live()) return
    let markdown: string | null
    try {
      markdown = await source()
    } catch {
      continue
    }
    if (!markdown || !live()) continue
    const opening = openingFor(markdown, rate)
    const missing: SpeechUnit[] = []
    for (const u of opening) if (!(await naturalVoice.has(u.text, voice, rate))) missing.push(u)
    if (!missing.length || !live()) continue
    try {
      await naturalVoice.ensure()
    } catch {
      return
    }
    if (!live()) return
    await Promise.all(
      missing.map((u) =>
        naturalVoice.synth(u.text, voice, rate, 'ahead', true).catch((e) => {
          console.debug('[Voice] Opening not made ahead:', e instanceof Error ? e.message : String(e))
        }),
      ),
    )
  }
}
