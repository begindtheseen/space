import { describe, expect, it } from 'vitest'
import { tutorOpeners } from '@/learn/tutor'
import { piecesOf } from './say'

describe('a line in pieces that start sooner', () => {
  it('cuts a long sentence at its commas and colons, never into scraps', () => {
    const line = 'Close, but your query gives back five rows, and the task wants three: the WHERE is missing, so every row is kept.'
    const pieces = piecesOf([line], 'af_heart', 1)
    expect(pieces.length).toBeGreaterThan(1)
    expect(pieces.map((p) => p.text).join(' ')).toBe(line)
    expect(pieces.every((p) => p.text.length >= 20)).toBe(true)
    // A short breath between pieces of a sentence; a longer one after it.
    expect(pieces.slice(0, -1).every((p) => p.pause < 0.1)).toBe(true)
    expect(pieces.at(-1)!.pause).toBeGreaterThan(0.1)
  })

  it('leaves a short sentence whole', () => {
    expect(piecesOf(['Almost: line 3 is missing its colon.'], 'af_heart', 1)).toHaveLength(1)
  })
})

describe('the tutor’s first words, made ahead', () => {
  it('lists every opener, and each with her name the way the tutor says it', () => {
    const plain = tutorOpeners()
    expect(plain).toContain('Close, but')
    expect(plain).toContain('Not quite yet:')
    const named = tutorOpeners('Maya')
    expect(named).toContain('Close, Maya, but')
    expect(named).toContain('Almost, Maya:')
    expect(named.length).toBe(plain.length * 2)
  })
})
