/* ============================================================================
   The natural voice — turning text into what the model reads
   ----------------------------------------------------------------------------
   Kokoro (Kokoro-82M, Apache-2.0) is a neural text-to-speech model: it reads
   phonemes, not letters, and speaks them in the voice of a style vector. This
   file is everything between a sentence of lesson text and the numbers the
   model takes, kept free of the runtime so it can be tested on its own:

     text → normalised text → phonemes (espeak, in the worker) → token ids

   The normalisation and the phoneme clean-up follow kokoro-js (Apache-2.0),
   the reference implementation for the web; the vocabulary is the model's own.
   ========================================================================== */

/** The model's phoneme vocabulary. Id 0 is the pad that opens and closes every input. */
export const VOCAB: Readonly<Record<string, number>> = {
  ";": 1,
  ":": 2,
  ",": 3,
  ".": 4,
  "!": 5,
  "?": 6,
  "—": 9,
  "…": 10,
  "\"": 11,
  "(": 12,
  ")": 13,
  "“": 14,
  "”": 15,
  " ": 16,
  "̃": 17,
  "ʣ": 18,
  "ʥ": 19,
  "ʦ": 20,
  "ʨ": 21,
  "ᵝ": 22,
  "ꭧ": 23,
  "A": 24,
  "I": 25,
  "O": 31,
  "Q": 33,
  "S": 35,
  "T": 36,
  "W": 39,
  "Y": 41,
  "ᵊ": 42,
  "a": 43,
  "b": 44,
  "c": 45,
  "d": 46,
  "e": 47,
  "f": 48,
  "h": 50,
  "i": 51,
  "j": 52,
  "k": 53,
  "l": 54,
  "m": 55,
  "n": 56,
  "o": 57,
  "p": 58,
  "q": 59,
  "r": 60,
  "s": 61,
  "t": 62,
  "u": 63,
  "v": 64,
  "w": 65,
  "x": 66,
  "y": 67,
  "z": 68,
  "ɑ": 69,
  "ɐ": 70,
  "ɒ": 71,
  "æ": 72,
  "β": 75,
  "ɔ": 76,
  "ɕ": 77,
  "ç": 78,
  "ɖ": 80,
  "ð": 81,
  "ʤ": 82,
  "ə": 83,
  "ɚ": 85,
  "ɛ": 86,
  "ɜ": 87,
  "ɟ": 90,
  "ɡ": 92,
  "ɥ": 99,
  "ɨ": 101,
  "ɪ": 102,
  "ʝ": 103,
  "ɯ": 110,
  "ɰ": 111,
  "ŋ": 112,
  "ɳ": 113,
  "ɲ": 114,
  "ɴ": 115,
  "ø": 116,
  "ɸ": 118,
  "θ": 119,
  "œ": 120,
  "ɹ": 123,
  "ɾ": 125,
  "ɻ": 126,
  "ʁ": 128,
  "ɽ": 129,
  "ʂ": 130,
  "ʃ": 131,
  "ʈ": 132,
  "ʧ": 133,
  "ʊ": 135,
  "ʋ": 136,
  "ʌ": 138,
  "ɣ": 139,
  "ɤ": 140,
  "χ": 142,
  "ʎ": 143,
  "ʒ": 147,
  "ʔ": 148,
  "ˈ": 156,
  "ˌ": 157,
  "ː": 158,
  "ʰ": 162,
  "ʲ": 164,
  "↓": 169,
  "→": 171,
  "↗": 172,
  "↘": 173,
  "ᵻ": 177
}

/** The model speaks 24 kHz mono. */
export const SAMPLE_RATE = 24000

/** Tokens the model accepts in one input, the two pads included. */
export const MAX_TOKENS = 512

export interface NaturalVoiceInfo {
  id: string
  name: string
  /** What the picker says about it. */
  describe: string
  /** espeak's language for its phonemes: American or British English. */
  lang: 'en-us' | 'en'
}

/**
 * The voices this app ships, best first. Kokoro has more, but these are the
 * ones its authors grade highest for English; the rest sound noticeably less
 * natural, which is the whole point of this voice.
 */
export const NATURAL_VOICES: readonly NaturalVoiceInfo[] = [
  { id: 'af_heart', name: 'Heart', describe: 'American, warm', lang: 'en-us' },
  { id: 'af_bella', name: 'Bella', describe: 'American, bright', lang: 'en-us' },
  { id: 'af_nicole', name: 'Nicole', describe: 'American, soft', lang: 'en-us' },
  { id: 'bf_emma', name: 'Emma', describe: 'British', lang: 'en' },
  { id: 'am_michael', name: 'Michael', describe: 'American, male', lang: 'en-us' },
  { id: 'bm_george', name: 'George', describe: 'British, male', lang: 'en' },
]

export const DEFAULT_NATURAL_VOICE = 'af_heart'

/** How a natural voice is stored in the voice setting, so it cannot collide with a device voice's name. */
export const NATURAL_PREFIX = 'natural:'

export function naturalVoiceFor(setting: string | undefined): NaturalVoiceInfo | null {
  if (setting === undefined || setting === '') return NATURAL_VOICES[0]!
  if (!setting.startsWith(NATURAL_PREFIX)) return null
  const id = setting.slice(NATURAL_PREFIX.length)
  return NATURAL_VOICES.find((v) => v.id === id) ?? NATURAL_VOICES[0]!
}

/* ── Normalisation: what a reader says for what is written ─────────────── */

function speakYearOrTime(s: string): string {
  if (s.includes('.')) return s
  if (s.includes(':')) {
    const [h, m] = s.split(':').map(Number) as [number, number]
    if (m === 0) return `${h} o'clock`
    return m < 10 ? `${h} oh ${m}` : `${h} ${m}`
  }
  const year = parseInt(s.slice(0, 4), 10)
  if (year < 1100 || year % 1000 < 10) return s
  const left = s.slice(0, 2)
  const right = parseInt(s.slice(2, 4), 10)
  const plural = s.endsWith('s') ? 's' : ''
  if (year % 1000 >= 100 && year % 1000 <= 999) {
    if (right === 0) return `${left} hundred${plural}`
    if (right < 10) return `${left} oh ${right}${plural}`
  }
  return `${left} ${right}${plural}`
}

function speakMoney(s: string): string {
  const unit = s[0] === '$' ? 'dollar' : 'pound'
  const amount = s.slice(1)
  if (Number.isNaN(Number(amount))) return `${amount} ${unit}s`
  if (!amount.includes('.')) return `${amount} ${unit}${amount === '1' ? '' : 's'}`
  const [whole, frac = ''] = amount.split('.') as [string, string]
  const cents = parseInt(frac.padEnd(2, '0'), 10)
  const small = s[0] === '$' ? (cents === 1 ? 'cent' : 'cents') : cents === 1 ? 'penny' : 'pence'
  return `${whole} ${unit}${whole === '1' ? '' : 's'} and ${cents} ${small}`
}

function speakDecimal(s: string): string {
  const [whole, frac = ''] = s.split('.') as [string, string]
  return `${whole} point ${frac.split('').join(' ')}`
}

/** Rewrites what the phonemiser would misread: quotes, titles, years, times, money, decimals, ranges. */
export function normalizeText(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/«/g, '“')
    .replace(/»/g, '”')
    .replace(/[“”]/g, '"')
    .replace(/\(/g, '«')
    .replace(/\)/g, '»')
    .replace(/[^\S \n]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\bD[Rr]\.(?= [A-Z])/g, 'Doctor')
    .replace(/\b(?:Mr\.|MR\.(?= [A-Z]))/g, 'Mister')
    .replace(/\b(?:Ms\.|MS\.(?= [A-Z]))/g, 'Miss')
    .replace(/\b(?:Mrs\.|MRS\.(?= [A-Z]))/g, 'Mrs')
    .replace(/\betc\.(?! [A-Z])/gi, 'etc')
    .replace(/\b(y)eah?\b/gi, "$1e'a")
    .replace(/\d*\.\d+|\b\d{4}s?\b|(?<!:)\b(?:[1-9]|1[0-2]):[0-5]\d\b(?!:)/g, speakYearOrTime)
    .replace(/(?<=\d),(?=\d)/g, '')
    .replace(/[$£]\d+(?:\.\d+)?(?: hundred| thousand| (?:[bm]|tr)illion)*\b|[$£]\d+\.\d\d?\b/gi, speakMoney)
    .replace(/\d*\.\d+/g, speakDecimal)
    .replace(/(?<=\d)-(?=\d)/g, ' to ')
    .replace(/(?<=\d)S/g, ' S')
    .replace(/(?<=[BCDFGHJ-NP-TV-Z])'?s\b/g, "'S")
    .replace(/(?<=X')S\b/g, 's')
    .replace(/(?:[A-Za-z]\.){2,} [a-z]/g, (m) => m.replace(/\./g, '-'))
    .replace(/(?<=[A-Z])\.(?=[A-Z])/gi, '-')
    .trim()
}

/* ── Punctuation survives phonemisation ─────────────────────────────────── */

const PUNCTUATION = ';:,.!?¡¿—…"«»“”(){}[]'
const PUNCTUATION_RUN = new RegExp(`(\\s*[${PUNCTUATION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+\\s*)+`, 'g')

/**
 * Splits text into the words espeak should phonemise and the punctuation
 * between them, which is kept as it is. espeak drops punctuation; the model
 * needs it, because it is where the pauses and the rise and fall of a
 * sentence come from. Without it every sentence is one flat run of words.
 */
export function splitPunctuation(text: string): { punct: boolean; text: string }[] {
  const out: { punct: boolean; text: string }[] = []
  let last = 0
  for (const m of text.matchAll(PUNCTUATION_RUN)) {
    const at = m.index ?? 0
    if (last < at) out.push({ punct: false, text: text.slice(last, at) })
    if (m[0].length > 0) out.push({ punct: true, text: m[0] })
    last = at + m[0].length
  }
  if (last < text.length) out.push({ punct: false, text: text.slice(last) })
  return out
}

/** Maps espeak's phonemes onto the set the model was trained on. */
export function cleanPhonemes(phonemes: string, lang: 'en-us' | 'en'): string {
  let s = phonemes
    .replace(/kəkˈoːɹoʊ/g, 'kˈoʊkəɹoʊ')
    .replace(/kəkˈɔːɹəʊ/g, 'kˈəʊkəɹəʊ')
    .replace(/ʲ/g, 'j')
    .replace(/r/g, 'ɹ')
    .replace(/x/g, 'k')
    .replace(/ɬ/g, 'l')
    .replace(/(?<=[a-zɹː])(?=hˈʌndɹɪd)/g, ' ')
    .replace(/ z(?=[;:,.!?¡¿—…"«»“” ]|$)/g, 'z')
  if (lang === 'en-us') s = s.replace(/(?<=nˈaɪn)ti(?!ː)/g, 'di')
  return s.trim()
}

/** Phonemes → the model's token ids, pads included, cut to what one input holds. */
export function tokenize(phonemes: string): number[] {
  return tokenizeMapped(phonemes).ids
}

/**
 * Tokenize, remembering where each token came from: `chars[i]` is the index
 * (in UTF-16 units) of token i's character in `phonemes`, or -1 for the pad
 * tokens at either end. Word timing uses it to tie durations back to words.
 */
export function tokenizeMapped(phonemes: string): { ids: number[]; chars: number[] } {
  const ids = [0]
  const chars = [-1]
  let at = 0
  for (const ch of phonemes) {
    const id = VOCAB[ch]
    if (id !== undefined && ids.length < MAX_TOKENS - 1) {
      ids.push(id)
      chars.push(at)
    }
    at += ch.length
  }
  ids.push(0)
  chars.push(-1)
  return { ids, chars }
}

/** Which of a voice's 510 style vectors fits an input: one per phoneme count. */
export function styleRow(tokenCount: number, rows: number): number {
  return Math.min(Math.max(tokenCount - 2 - 1, 0), rows - 1)
}

/* ── What is read, and the pauses between ─────────────────────────────── */

/**
 * Longest text given to the model at once. The model takes up to 510
 * phonemes, but the memory it needs grows with the length of what it says,
 * and never shrinks back: about 200 MB more for a short sentence and 700 MB
 * for one of 400 phonemes, per worker, on top of the 450 MB the worker takes
 * to start. A phone that runs out stalls or loses the worker mid-lesson, so
 * a phone is given shorter pieces (see natural.ts, `unitChars`).
 */
export const MAX_UNIT_CHARS = 280

export interface SpeechUnit {
  text: string
  /** The sentence this belongs to, for the counter and for skipping. */
  sentence: number
  /** Seconds of silence after it: a breath between sentences, a longer one between paragraphs. */
  pause: number
}

/** A reader's pause after a sentence, by how it ends. */
export function sentencePause(sentence: string, endsParagraph: boolean): number {
  if (endsParagraph) return 0.55
  if (/[?!]["”')]*$/.test(sentence)) return 0.3
  if (/:["”')]*$/.test(sentence)) return 0.32
  return 0.24
}

/** The pause where a sentence too long for one input had to be joined. */
function joinPause(piece: string): number {
  return /[;:—]$/.test(piece) ? 0.16 : /,$/.test(piece) ? 0.1 : 0.04
}

/**
 * Cuts a sentence that is too long for the model into the fewest pieces, at
 * its clause boundaries, each as long as it can be. A sentence that fits is
 * never cut: every cut is a join the listener could hear.
 */
export function splitLong(sentence: string, max = MAX_UNIT_CHARS): string[] {
  const out: string[] = []
  let rest = sentence
  while (rest.length > max) {
    const window = rest.slice(0, max)
    let at = -1
    for (const mark of ['; ', ': ', ' — ', ', ']) {
      const i = window.lastIndexOf(mark)
      if (i > max * 0.35) {
        at = mark === ' — ' ? i + 2 : i + 1
        break
      }
    }
    if (at < 0) at = window.lastIndexOf(' ')
    if (at <= 0) break
    out.push(rest.slice(0, at).trim())
    rest = rest.slice(at).trim()
  }
  if (rest) out.push(rest)
  return out
}

/**
 * A lesson's prepared text (lib/speech.ts, `prepare().text`) as what the
 * natural voice reads: whole sentences, each with the pause a reader would
 * take after it. Unlike the device voice's utterances, a sentence is never
 * broken at a comma to save time — the pauses a model puts at a cut are the
 * stammer this is built to avoid. Only a sentence longer than `maxChars` is
 * cut, at its clauses, with the short pause a reader takes there.
 */
export function speechUnits(text: string, splitSentences: (paragraph: string) => string[], maxChars = MAX_UNIT_CHARS): SpeechUnit[] {
  const out: SpeechUnit[] = []
  let sentence = 0
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  paragraphs.forEach((para) => {
    const sentences = splitSentences(para)
    sentences.forEach((s, j) => {
      const pieces = splitLong(s, maxChars)
      pieces.forEach((piece, k) => {
        const lastPiece = k === pieces.length - 1
        out.push({ text: piece, sentence, pause: lastPiece ? sentencePause(s, j === sentences.length - 1) : joinPause(piece) })
      })
      sentence++
    })
  })
  return out
}

/**
 * The first thing read, split once at a clause near its middle so the voice
 * can start sooner: the two halves are made side by side, and the second is
 * ready before the first has finished playing. Only for a long first
 * sentence, and only where there are two workers to make the halves at once.
 */
export function fastStart(units: SpeechUnit[], minChars = 150): SpeechUnit[] {
  const first = units[0]
  if (!first || first.text.length < minChars) return units
  const t = first.text
  let best = -1
  for (const mark of ['; ', ': ', ' — ', ', ']) {
    let i = t.indexOf(mark)
    while (i >= 0) {
      const at = mark === ' — ' ? i + 2 : i + 1
      if (at >= t.length * 0.35 && at <= t.length * 0.6 && (best < 0 || Math.abs(at - t.length * 0.45) < Math.abs(best - t.length * 0.45))) best = at
      i = t.indexOf(mark, i + 1)
    }
    if (best >= 0) break
  }
  if (best < 0) return units
  const a = t.slice(0, best).trim()
  const b = t.slice(best).trim()
  return [{ ...first, text: a, pause: joinPause(a) }, { ...first, text: b }, ...units.slice(1)]
}

/**
 * The model starts and ends every clip with about a third and half a second
 * of silence. Played back to back, that is a gap after every piece; so it is
 * trimmed to a few milliseconds, faded so there is no click, and the pause
 * after each piece is then exactly the one chosen above.
 */
export function trimSilence(pcm: Float32Array, rate = SAMPLE_RATE): Float32Array {
  const { from, to } = trimBounds(pcm, rate)
  if (from === 0 && to === pcm.length) return pcm
  const out = pcm.slice(from, to)
  const fade = Math.min(Math.round(rate * 0.008), Math.floor(out.length / 4))
  for (let i = 0; i < fade; i++) {
    const g = i / fade
    out[i]! *= g
    out[out.length - 1 - i]! *= g
  }
  return out
}

/**
 * Where trimSilence cuts: the sample range kept. Word times are measured from
 * the start of the untrimmed clip, so they move back by `from`.
 */
export function trimBounds(pcm: Float32Array, rate = SAMPLE_RATE): { from: number; to: number } {
  const win = Math.max(1, Math.round(rate * 0.005))
  const n = Math.floor(pcm.length / win)
  if (n < 4) return { from: 0, to: pcm.length }
  const levels = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let j = i * win; j < (i + 1) * win; j++) s += pcm[j]! * pcm[j]!
    levels[i] = Math.sqrt(s / win)
  }
  const sorted = Array.from(levels).sort((a, b) => a - b)
  const loud = sorted[Math.floor(n * 0.95)]!
  const floor = Math.max(0.003, loud * 0.04)
  let first = 0
  while (first < n && levels[first]! < floor) first++
  let last = n - 1
  while (last > first && levels[last]! < floor) last--
  if (first >= last) return { from: 0, to: pcm.length }
  const margin = Math.round(rate * 0.025)
  return { from: Math.max(0, first * win - margin), to: Math.min(pcm.length, (last + 1) * win + margin) }
}

/** Roughly how fast the voice speaks at speed 1, in characters a second, for planning ahead. */
export const CHARS_PER_SECOND = 15

/**
 * When to start playing so the reading never runs dry — the way a video
 * player waits to buffer rather than stall. The first sentence has just been
 * made: how long that took, per second of speech, is how fast the workers are.
 * The next sentences are simulated through the same workers, in order, and
 * the start is put off just enough that each is ready before its turn. On a
 * fast device that is no wait at all; on a slow one it is a moment before the
 * first word, instead of silences in the middle of the lesson.
 *
 * Times are in seconds from when the first sentences were asked for. `ready`
 * marks sentences already made (from the cache), which cost nothing.
 */
export function safeStart(o: {
  firstReadyAt: number
  durations: number[]
  pauses: number[]
  ready: boolean[]
  workers: number
  /** Seconds of work per second of speech, if known better than the first sentence shows. */
  rtf?: number
  horizon?: number
  /**
   * The most extra waiting worth doing, in seconds past the first sentence.
   * A device that cannot make speech as fast as it is spoken will fall behind
   * whatever is done; past this, it is better to start and let the shortfall
   * fall as longer pauses between sentences than to keep her waiting.
   */
  maxExtra?: number
}): number {
  const first = Math.max(0.3, o.durations[0] ?? 0.3)
  const measured = o.ready[0] ? 0 : o.firstReadyAt / first
  const rtf = Math.max(measured, o.rtf ?? 0)
  const free: number[] = new Array(Math.max(1, o.workers)).fill(0)
  free[0] = o.firstReadyAt
  let need = o.firstReadyAt
  let offset = 0
  const n = Math.min(o.durations.length, o.horizon ?? 8)
  for (let k = 1; k < n; k++) {
    offset += (o.durations[k - 1] ?? 0) + (o.pauses[k - 1] ?? 0)
    if (o.ready[k]) continue
    let w = 0
    for (let i = 1; i < free.length; i++) if (free[i]! < free[w]!) w = i
    const finish = free[w]! + rtf * (o.durations[k] ?? 0) * 1.15
    free[w] = finish
    need = Math.max(need, finish - offset)
  }
  return Math.min(need, o.firstReadyAt + (o.maxExtra ?? 10))
}

/* ── Word timing ───────────────────────────────────────────────────────────────
   The reader highlights each word as it is spoken. The model says how long
   every token lasts (see onnxEdit.ts, exposeDurations), so the only question
   is which tokens belong to which word of the text — and the sentence is
   phonemized as a whole, where words merge ("of the" → ʌvðə) and numbers
   expand ("2024" → four words), so the answer is not a simple count.

   It is found by phonemizing each word again on its own and aligning the two
   phoneme strings letter by letter (stress marks and spaces aside), the way
   two spellings of the same thing are lined up: every letter of the sentence
   then knows its word, and every token its letter. */

/** A word of a piece of text, as character offsets into it. */
export interface WordSpan {
  start: number
  end: number
}

const WORD_RE = /[\p{L}\p{N}]+(?:['’.\-][\p{L}\p{N}]+)*/gu

/** The words of a piece of text: runs of letters and digits, keeping inner apostrophes, points and hyphens. */
export function textWords(text: string): WordSpan[] {
  const out: WordSpan[] = []
  for (const m of text.matchAll(WORD_RE)) out.push({ start: m.index!, end: m.index! + m[0].length })
  return out
}

const IGNORED = new Set(['ˈ', 'ˌ', ' ', '\n', '\t', ...PUNCTUATION])

/**
 * The word each character of a sentence's phonemes belongs to (-1 for spaces,
 * punctuation and anything that matched no word), given the same words
 * phonemized one at a time.
 */
export function alignPhonemes(sentence: string, words: readonly string[]): Int32Array {
  const b: string[] = []
  const bw: number[] = []
  words.forEach((w, k) => {
    for (const ch of w) if (!IGNORED.has(ch)) {
      b.push(ch)
      bw.push(k)
    }
  })
  const a: string[] = []
  const ai: number[] = []
  let at = 0
  for (const ch of sentence) {
    if (!IGNORED.has(ch)) {
      a.push(ch)
      ai.push(at)
    }
    at += ch.length
  }
  const out = new Int32Array(sentence.length).fill(-1)
  if (!a.length || !b.length) return out

  // Edit distance with a full table, then a walk back to pair the letters.
  const n = a.length
  const m = b.length
  const w = m + 1
  const d = new Uint16Array((n + 1) * w)
  for (let i = 0; i <= n; i++) d[i * w] = i
  for (let j = 0; j <= m; j++) d[j] = j
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = d[(i - 1) * w + j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
      const del = d[(i - 1) * w + j]! + 1
      const ins = d[i * w + j - 1]! + 1
      d[i * w + j] = Math.min(sub, del, ins)
    }
  }
  const letterWord = new Int32Array(n).fill(-1)
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    const here = d[i * w + j]!
    if (here === d[(i - 1) * w + j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      letterWord[i - 1] = bw[j - 1]!
      i--
      j--
    } else if (here === d[(i - 1) * w + j]! + 1) i--
    else j--
  }
  // A sentence letter left unpaired sits between words it can only belong to one of: the previous one.
  for (let k = 0; k < n; k++) if (letterWord[k] === -1) letterWord[k] = k > 0 ? letterWord[k - 1]! : -1
  for (let k = n - 1; k >= 0; k--) if (letterWord[k] === -1 && k + 1 < n) letterWord[k] = letterWord[k + 1]!
  for (let k = 0; k < n; k++) out[ai[k]!] = letterWord[k]!
  // A stress mark belongs to the letter after it.
  let next = -1
  for (let c = sentence.length - 1; c >= 0; c--) {
    const ch = sentence[c]!
    if (ch === 'ˈ' || ch === 'ˌ') out[c] = next
    else if (out[c] !== -1) next = out[c]!
    else if (ch === ' ') next = -1
  }
  return out
}

/**
 * Start and end of every word, in seconds from the start of the clip the
 * model returned: `[start0, end0, start1, end1, …]`, NaN for a word no token
 * was tied to. `chars` is from tokenizeMapped, `durations` the model's second
 * output (one per token, in 600-sample frames).
 */
export function wordTimes(
  chars: readonly number[],
  charWord: Int32Array,
  durations: ArrayLike<number | bigint>,
  wordCount: number,
  rate = SAMPLE_RATE,
): Float64Array {
  const out = new Float64Array(wordCount * 2).fill(NaN)
  let t = 0
  const n = Math.min(chars.length, durations.length)
  for (let k = 0; k < n; k++) {
    const len = Number(durations[k]) * 600
    const c = chars[k]!
    const word = c >= 0 ? charWord[c] ?? -1 : -1
    if (word >= 0 && word < wordCount) {
      if (Number.isNaN(out[word * 2]!)) out[word * 2] = t / rate
      out[word * 2 + 1] = (t + len) / rate
    }
    t += len
  }
  // Words out of order (an alignment slip) would make the highlight jump back: keep them monotonic.
  let last = 0
  for (let k = 0; k < wordCount; k++) {
    const s = out[k * 2]!
    if (Number.isNaN(s)) continue
    if (s < last) out[k * 2] = last
    if (out[k * 2 + 1]! < out[k * 2]!) out[k * 2 + 1] = out[k * 2]!
    last = out[k * 2]!
  }
  return out
}

/* ── Text to phonemes, shared by the voice worker and the lesson recorder ── */

export type Phonemize = (text: string, lang: string) => Promise<string[]>

/** Text → phonemes, keeping the punctuation the model needs for its pauses and pitch. */
export async function phonemesFor(text: string, lang: 'en-us' | 'en', phonemize: Phonemize): Promise<string> {
  const parts = await Promise.all(
    splitPunctuation(normalizeText(text)).map(async (p) => (p.punct ? p.text : (await phonemize(p.text, lang)).join(' '))),
  )
  return cleanPhonemes(parts.join(''), lang)
}

/** The words of `text`, and which of them each character of its phonemes belongs to. */
export async function alignWords(
  text: string,
  phonemes: string,
  lang: 'en-us' | 'en',
  phonemize: Phonemize,
): Promise<{ words: WordSpan[]; charWord: Int32Array }> {
  const words = textWords(text)
  const each = await Promise.all(
    words.map(async (w) => cleanPhonemes((await phonemize(normalizeText(text.slice(w.start, w.end)), lang)).join(' '), lang)),
  )
  return { words, charWord: alignPhonemes(phonemes, each) }
}

/** A short stable key for a piece of text: names a lesson's recording and a sentence's cached audio. */
export function textKey(text: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193)
    h2 = Math.imul(h2 ^ c, 0x5bd1e995)
  }
  return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}${text.length.toString(36)}`
}
