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
  const ids: number[] = []
  for (const ch of phonemes) {
    const id = VOCAB[ch]
    if (id !== undefined) ids.push(id)
  }
  return [0, ...ids.slice(0, MAX_TOKENS - 2), 0]
}

/** Which of a voice's 510 style vectors fits an input: one per phoneme count. */
export function styleRow(tokenCount: number, rows: number): number {
  return Math.min(Math.max(tokenCount - 2 - 1, 0), rows - 1)
}

/**
 * Splits text for synthesis at natural boundaries so no piece is too long
 * for one input, and so the first sound comes quickly: the model's time grows
 * with the length of what it says.
 */
export function synthesisPieces(text: string, maxChars = 200): string[] {
  if (text.length <= maxChars) return [text]
  const out: string[] = []
  let rest = text
  while (rest.length > maxChars) {
    const window = rest.slice(0, maxChars)
    const cut = Math.max(window.lastIndexOf('; '), window.lastIndexOf(', '), window.lastIndexOf(': '), window.lastIndexOf(' — '))
    const at = cut > maxChars * 0.3 ? cut + 1 : window.lastIndexOf(' ')
    if (at <= 0) break
    out.push(rest.slice(0, at).trim())
    rest = rest.slice(at).trim()
  }
  if (rest) out.push(rest)
  return out
}

/**
 * The first pieces of a reading, made shorter: the first sound waits on the
 * whole first piece, so it is kept to a clause, and the next is kept short
 * while the other workers start. After that the pieces are full length, and
 * there is always one being made while another plays.
 */
export function rampPieces<T extends { text: string; last: boolean }>(plan: T[], caps = [48, 110]): T[] {
  const out: T[] = []
  for (const piece of plan) {
    const cap = caps[out.length]
    if (cap === undefined || piece.text.length <= cap) {
      out.push(piece)
      continue
    }
    const parts = synthesisPieces(piece.text, cap)
    parts.forEach((text, j) => out.push({ ...piece, text, last: piece.last && j === parts.length - 1 }))
  }
  return out
}
