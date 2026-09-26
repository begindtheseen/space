import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MAX_TOKENS,
  NATURAL_VOICES,
  VOCAB,
  cleanPhonemes,
  naturalVoiceFor,
  normalizeText,
  splitPunctuation,
  styleRow,
  rampPieces,
  synthesisPieces,
  tokenize,
} from './kokoro'
import { poolSize } from './natural'

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

  it('splits a long sentence at its commas so the first sound comes quickly', () => {
    const long = 'When the model trains, every weight moves a little, in the direction that lowers the loss, and after thousands of steps, the network has learned something it was never told directly.'
    const pieces = synthesisPieces(long, 80)
    expect(pieces.join(' ')).toBe(long)
    for (const p of pieces) expect(p.length).toBeLessThanOrEqual(80)
    expect(pieces[0]).toMatch(/,$/)
    expect(synthesisPieces('Short.', 80)).toEqual(['Short.'])
  })

  it('starts a reading with short pieces, so the first sound comes quickly', () => {
    const text = 'The first sentence of a lesson is often long, with a clause, another clause, and a third one, before it ends.'
    const plan = rampPieces([{ text, last: true, utt: 0 }, { text, last: true, utt: 1 }])
    expect(plan[0]!.text.length).toBeLessThanOrEqual(48)
    expect(plan.filter((p) => p.utt === 0).map((p) => p.text).join(' ')).toBe(text)
    expect(plan.filter((p) => p.utt === 0 && p.last)).toHaveLength(1)
    expect(plan.filter((p) => p.utt === 0).at(-1)!.last).toBe(true)
    expect(plan.filter((p) => p.utt === 1).map((p) => p.text).join(' ')).toBe(text)
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
    expect(poolSize({ hardwareConcurrency: 8, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })).toBe(2)
    expect(poolSize({ hardwareConcurrency: 8, userAgent: 'Mozilla/5.0 (Macintosh)', maxTouchPoints: 5 })).toBe(2)
    expect(poolSize({ hardwareConcurrency: 8, deviceMemory: 8, userAgent: 'Mozilla/5.0 (Linux; Android 15) Mobile' })).toBe(3)
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
