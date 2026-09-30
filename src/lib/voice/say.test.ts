import { describe, expect, it } from 'vitest'
import { piecesOf } from './say'

describe('a line in the pieces the voice makes', () => {
  const line = ['Close, but your query gives back five rows.', 'The task wants three.', 'The WHERE is missing, so every row is kept.', 'Add it back.']

  it('never cuts a sentence, so each is phrased as a whole', () => {
    const pieces = piecesOf(line)
    for (const s of line) expect(pieces.some((p) => p.includes(s))).toBe(true)
    expect(pieces.join(' ')).toBe(line.join(' '))
  })

  it('says the first sentence on its own, to start soon, and the rest together', () => {
    const pieces = piecesOf(line)
    expect(pieces[0]).toBe(line[0])
    expect(pieces.length).toBeLessThan(line.length)
  })

  it('keeps each stretch short enough for the model', () => {
    const long = Array.from({ length: 12 }, (_, i) => `This is sentence number ${i + 1} of a long hint that keeps going.`)
    expect(piecesOf(long).every((p) => p.length <= 220 || !p.includes('. '))).toBe(true)
  })
})
