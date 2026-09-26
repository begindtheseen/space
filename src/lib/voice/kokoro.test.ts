import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MAX_TOKENS,
  MAX_UNIT_CHARS,
  NATURAL_VOICES,
  VOCAB,
  cleanPhonemes,
  naturalVoiceFor,
  normalizeText,
  splitPunctuation,
  styleRow,
  fastStart,
  safeStart,
  sentencePause,
  speechUnits,
  splitLong,
  trimSilence,
  tokenize,
} from './kokoro'
import { poolSize, unitChars } from './natural'

describe('the natural voice: text to tokens', () => {
  it('says what is written the way a reader would', () => {
    const s = normalizeText('Dr. Smith paid $5.50 at 10:30 in 1999, for pages 3-7 (roughly).')
    expect(s).toContain('Doctor Smith')
    expect(s).toContain('5 dollars and 50 cents')
    expect(s).toContain('10 30')
    expect(s).toContain('19 99')
    expect(s).toContain('3 to 7')
    expect(s).toContain('«roughly»')
  })

  it('keeps punctuation apart from the words, because that is where the pauses come from', () => {
    const parts = splitPunctuation('First, the loss; then — finally — the step.')
    expect(parts.filter((p) => p.punct).map((p) => p.text.trim())).toEqual([',', ';', '—', '—', '.'])
    expect(parts.filter((p) => !p.punct).map((p) => p.text)).toEqual(['First', 'the loss', 'then', 'finally', 'the step'])
  })

  it('maps espeak phonemes onto the model’s set', () => {
    expect(cleanPhonemes('rɛd x', 'en-us')).toBe('ɹɛd k')
    expect(cleanPhonemes('nˈaɪnti', 'en-us')).toBe('nˈaɪndi')
    expect(cleanPhonemes('nˈaɪnti', 'en')).toBe('nˈaɪnti')
  })

  it('turns phonemes into token ids between two pads, dropping what the model does not know', () => {
    const ids = tokenize('hə lˈoʊ!§')
    expect(ids[0]).toBe(0)
    expect(ids.at(-1)).toBe(0)
    expect(ids.slice(1, -1)).toEqual([...'hə lˈoʊ!'].map((c) => VOCAB[c]))
    expect(tokenize('a'.repeat(2000))).toHaveLength(MAX_TOKENS)
  })

  it('picks the style vector for the input’s length, within the voice file', () => {
    expect(styleRow(2, 510)).toBe(0)
    expect(styleRow(12, 510)).toBe(9)
    expect(styleRow(9999, 510)).toBe(509)
  })

  it('reads whole sentences: a sentence that fits is never cut at a comma, semicolon, colon or dash', () => {
    const para = 'First, write the loss; then compute its gradient — and only then take a step: carefully. Then do it again.'
    const units = speechUnits(`${para}\n\n- A list item, with a comma.\n\nThe end.`, (p) => p.split(/(?<=[.!?])\s+/))
    expect(units.map((u) => u.text)).toEqual([
      'First, write the loss; then compute its gradient — and only then take a step: carefully.',
      'Then do it again.',
      '- A list item, with a comma.',
      'The end.',
    ])
    expect(units.map((u) => u.sentence)).toEqual([0, 1, 2, 3])
    // A breath between sentences, a longer one between paragraphs.
    expect(units[0]!.pause).toBeCloseTo(0.24)
    expect(units[1]!.pause).toBeCloseTo(0.55)
  })

  it('cuts only a sentence too long for the model, into the fewest pieces, at clause boundaries', () => {
    const clause = 'the network adjusts every weight a little in the direction that lowers the loss'
    const long = `When training starts, ${clause}, and ${clause}; after that, ${clause}, and ${clause}, until ${clause}.`
    expect(long.length).toBeGreaterThan(MAX_UNIT_CHARS)
    const pieces = splitLong(long)
    expect(pieces.join(' ')).toBe(long)
    expect(pieces.length).toBe(Math.ceil(long.length / MAX_UNIT_CHARS))
    for (const p of pieces) expect(p.length).toBeLessThanOrEqual(MAX_UNIT_CHARS)
    expect(pieces[0]).toMatch(/[;,]$/)
    expect(splitLong('Short and whole, with a comma.')).toEqual(['Short and whole, with a comma.'])
  })

  it('gives a phone shorter pieces, still cut only at clauses, with a reader\'s pause at each', () => {
    const clause = 'the network adjusts every weight a little in the direction that lowers the loss'
    const long = `When training starts, ${clause}, and ${clause}; after that, ${clause}.`
    const units = speechUnits(long, (p) => [p], 150)
    expect(units.map((u) => u.text).join(' ')).toBe(long)
    for (const u of units) expect(u.text.length).toBeLessThanOrEqual(150)
    for (const u of units.slice(0, -1)) {
      expect(u.text).toMatch(/[;,]$/)
      expect(u.pause).toBeGreaterThanOrEqual(0.1)
      expect(u.pause).toBeLessThan(0.2)
    }
    expect(new Set(units.map((u) => u.sentence))).toEqual(new Set([0]))
    expect(unitChars({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })).toBe(150)
    expect(unitChars({ userAgent: 'Mozilla/5.0 (Macintosh)' })).toBe(MAX_UNIT_CHARS)
  })

  it('pauses like a reader: after a question, a statement, a lead-in', () => {
    expect(sentencePause('Is it?', false)).toBeGreaterThan(sentencePause('It is.', false))
    expect(sentencePause('Here is how:', false)).toBeGreaterThan(sentencePause('It is.', false))
    expect(sentencePause('It is.', true)).toBeGreaterThan(sentencePause('Is it?', false))
  })

  it('may split only the first long sentence, near its middle, so reading starts sooner', () => {
    const first = 'A model reads the whole sentence before it speaks a word of it, so the first sound waits on all of it, and a long opening sentence takes a noticeable while to begin.'
    const units = fastStart([{ text: first, sentence: 0, pause: 0.24 }, { text: 'Next.', sentence: 1, pause: 0.24 }])
    expect(units).toHaveLength(3)
    expect(`${units[0]!.text} ${units[1]!.text}`).toBe(first)
    expect(units[0]!.text.length / first.length).toBeGreaterThan(0.3)
    expect(units[0]!.text.length / first.length).toBeLessThan(0.62)
    expect(units[0]!.sentence).toBe(0)
    expect(units[1]!.pause).toBeCloseTo(0.24)
    expect(fastStart([{ text: 'Short.', sentence: 0, pause: 0.24 }])).toHaveLength(1)
  })

  it('trims the silence the model puts at both ends of a clip, and fades so there is no click', () => {
    const rate = 24000
    const pcm = new Float32Array(rate * 2)
    // 0.4 s of silence, 1 s of sound, 0.6 s of silence: as the model makes it.
    for (let i = Math.round(rate * 0.4); i < Math.round(rate * 1.4); i++) pcm[i] = 0.3 * Math.sin(i / 7)
    const out = trimSilence(pcm, rate)
    expect(out.length / rate).toBeGreaterThan(1)
    expect(out.length / rate).toBeLessThan(1.08)
    expect(Math.abs(out[0]!)).toBeLessThan(1e-3)
    expect(Math.abs(out[out.length - 1]!)).toBeLessThan(1e-3)
  })
})

describe('the natural voice: never running dry', () => {
  it('on a fast device starts as soon as the first sentence is made', () => {
    const need = safeStart({ firstReadyAt: 1, durations: [5, 8, 6, 7], pauses: [0.24, 0.24, 0.24, 0.24], ready: [false, false, false, false], workers: 1 })
    expect(need).toBeCloseTo(1, 5)
  })

  it('on a slow one waits at the start instead of stopping mid-lesson: a short sentence, then a long one', () => {
    // As measured on a slow CPU: 5.5 s of speech took 13.75 s to make; the next is 10.8 s long.
    const o = { firstReadyAt: 13.75, durations: [5.5, 10.8, 8.6], pauses: [0.24, 0.24, 0.24], ready: [false, false, false], workers: 2 }
    const need = safeStart({ ...o, maxExtra: 60 })
    expect(need).toBeGreaterThan(o.firstReadyAt)
    // Starting then, the second sentence is ready by the time the first has been spoken.
    const secondReady = 2.5 * 10.8 * 1.15
    expect(need + 5.5 + 0.24).toBeGreaterThanOrEqual(secondReady - 1e-9)
    // But never more than ten seconds' extra wait by default.
    expect(safeStart(o)).toBeCloseTo(o.firstReadyAt + 10, 5)
  })

  it('waits at most ten seconds more: a device that cannot keep up still starts', () => {
    const hopeless = { firstReadyAt: 20, durations: [5, 10, 10, 10, 10, 10, 10, 10], pauses: new Array(8).fill(0.24), ready: new Array(8).fill(false), workers: 1 }
    expect(safeStart(hopeless)).toBeCloseTo(30, 5)
  })

  it('counts sentences already made as costing nothing', () => {
    const slow = { firstReadyAt: 13.75, durations: [5.5, 10.8, 8.6], pauses: [0.24, 0.24, 0.24], workers: 2 }
    expect(safeStart({ ...slow, ready: [false, true, true] })).toBeCloseTo(13.75, 5)
    // All made: no work, no wait.
    expect(safeStart({ ...slow, firstReadyAt: 0, ready: [true, true, true] })).toBe(0)
  })
})

describe('the natural voice: voices and devices', () => {
  it('reads the voice setting: blank is the natural default, a device voice is not natural', () => {
    expect(naturalVoiceFor(undefined)?.id).toBe('af_heart')
    expect(naturalVoiceFor('')?.id).toBe('af_heart')
    expect(naturalVoiceFor('natural:bf_emma')?.id).toBe('bf_emma')
    expect(naturalVoiceFor('natural:gone')?.id).toBe('af_heart')
    expect(naturalVoiceFor('Samantha')).toBeNull()
  })

  it('ships every voice it offers, each 510 styles of 256 numbers', () => {
    for (const v of NATURAL_VOICES) {
      const file = join(__dirname, '../../../public/voices', `${v.id}.bin`)
      expect(statSync(file).size, v.id).toBe(510 * 256 * 4)
      const styles = new Float32Array(readFileSync(file).buffer.slice(0))
      expect(styles.every(Number.isFinite), v.id).toBe(true)
    }
  })

  it('runs fewer synthesis workers where memory is short', () => {
    expect(poolSize({ hardwareConcurrency: 2 })).toBe(1)
    // An iPhone or iPad: one worker. Two ran it out of memory mid-lesson.
    expect(poolSize({ hardwareConcurrency: 8, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })).toBe(1)
    expect(poolSize({ hardwareConcurrency: 8, userAgent: 'Mozilla/5.0 (Macintosh)', maxTouchPoints: 5 })).toBe(1)
    expect(poolSize({ hardwareConcurrency: 8, deviceMemory: 4, userAgent: 'Mozilla/5.0 (Linux; Android 15) Mobile' })).toBe(1)
    expect(poolSize({ hardwareConcurrency: 8, deviceMemory: 8, userAgent: 'Mozilla/5.0 (Linux; Android 15) Mobile' })).toBe(2)
    expect(poolSize({ hardwareConcurrency: 4, userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toBe(2)
    expect(poolSize({ hardwareConcurrency: 8, deviceMemory: 4, userAgent: 'Mozilla/5.0 (Windows NT 10.0)' })).toBe(2)
    expect(poolSize({ hardwareConcurrency: 12, deviceMemory: 16, userAgent: 'Mozilla/5.0 (Macintosh)' })).toBe(3)
  })
})

// The same sentences through kokoro-onnx, the reference Python implementation
// (its tokenizer, its espeak): the token ids the model must be given. This
// app's text pipeline has to produce exactly these, or the voice mispronounces.
// It needs the phonemiser the worker downloads, which is installed with the
// browser suite's packages at the repository root.
const PHONEMIZER = join(__dirname, '../../../../node_modules/phonemizer/dist/phonemizer.js')
describe.skipIf(!existsSync(PHONEMIZER))('the natural voice: agrees with the reference implementation', () => {
  const REFERENCE = [
    { text: "A neural network is a stack of simple functions, and training it means nudging millions of numbers until its answers get better.", ids: [70, 16, 56, 156, 135, 123, 123, 83, 54, 16, 56, 156, 86, 62, 65, 87, 158, 53, 16, 102, 68, 16, 70, 16, 61, 62, 156, 72, 53, 16, 138, 64, 16, 61, 156, 102, 55, 58, 83, 54, 16, 48, 156, 138, 112, 53, 131, 83, 56, 68, 3, 16, 72, 56, 46, 16, 62, 123, 156, 47, 102, 56, 102, 112, 16, 102, 62, 16, 55, 156, 51, 158, 56, 68, 16, 56, 156, 138, 46, 147, 102, 112, 16, 55, 156, 102, 54, 51, 83, 56, 68, 16, 138, 64, 16, 56, 156, 138, 55, 44, 85, 68, 16, 138, 56, 62, 156, 102, 54, 16, 102, 62, 61, 16, 156, 72, 56, 61, 85, 68, 16, 92, 86, 62, 16, 44, 156, 86, 125, 85, 4] },
    { text: "First, write the loss; then compute its gradient — and only then take a step.", ids: [48, 156, 87, 158, 61, 62, 3, 16, 123, 156, 43, 102, 62, 16, 81, 83, 16, 54, 156, 76, 61, 1, 16, 81, 156, 86, 56, 16, 53, 83, 55, 58, 52, 156, 63, 158, 62, 16, 102, 62, 61, 16, 92, 123, 156, 47, 102, 46, 51, 83, 56, 62, 16, 9, 16, 72, 56, 46, 16, 156, 57, 135, 56, 54, 51, 16, 81, 156, 86, 56, 16, 62, 156, 47, 102, 53, 16, 70, 16, 61, 62, 156, 86, 58, 4] },
    { text: "Don't forget: the function returns None when the list is empty!", ids: [46, 156, 57, 135, 56, 62, 16, 48, 85, 92, 156, 86, 62, 2, 16, 81, 83, 16, 48, 156, 138, 112, 53, 131, 83, 56, 16, 123, 177, 62, 156, 87, 158, 56, 68, 16, 56, 156, 138, 56, 16, 65, 86, 56, 16, 81, 83, 16, 54, 156, 102, 61, 62, 16, 102, 68, 16, 156, 86, 55, 58, 62, 51, 5] },
    { text: "What does 'strict mode' really change?", ids: [65, 157, 138, 62, 16, 46, 156, 138, 68, 16, 61, 62, 123, 156, 102, 53, 62, 16, 55, 156, 57, 135, 46, 16, 123, 156, 51, 83, 54, 51, 16, 62, 131, 156, 47, 102, 56, 46, 147, 6] },
  ]
  it('gives the model exactly the reference token ids', async () => {
    const { phonemize } = (await import(/* @vite-ignore */ PHONEMIZER)) as { phonemize: (t: string, l: string) => Promise<string[]> }
    for (const { text, ids } of REFERENCE) {
      const parts = await Promise.all(splitPunctuation(normalizeText(text)).map(async (p) => (p.punct ? p.text : (await phonemize(p.text, 'en-us')).join(' '))))
      expect(tokenize(cleanPhonemes(parts.join(''), 'en-us')).slice(1, -1), text).toEqual(ids)
    }
  }, 60_000)
})

// The model rewrite for the GPU, on the real model when a copy is at hand
// (VOICE_MODEL), as the browser suite uses. Its sound is checked there and in
// the voice's development notes; here, that it finds and rewrites every one.
describe.skipIf(!process.env.VOICE_MODEL || !existsSync(process.env.VOICE_MODEL ?? ''))('the natural voice: the model, made fit for the GPU', () => {
  it('rewrites all 87 integer convolutions, and leaves nothing to rewrite twice', async () => {
    const { convIntegerToConv } = await import('./onnxEdit')
    const model = new Uint8Array(readFileSync(process.env.VOICE_MODEL!))
    const { bytes, report } = convIntegerToConv(model)
    expect(report.convs).toBe(87)
    expect(bytes.length).toBeLessThan(model.length)
    expect(() => convIntegerToConv(bytes)).toThrow(/No integer convolutions/)
  }, 60_000)
})
