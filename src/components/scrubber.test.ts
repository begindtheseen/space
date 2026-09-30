import { describe, expect, it } from 'vitest'
import { clock, sentenceTimes } from './Scrubber'

describe('the scrubber', () => {
  it('times each sentence by its length and the speed, and a stop in the lesson takes none', () => {
    const t = sentenceTimes(['a'.repeat(145), '', 'b'.repeat(290)], 1)
    expect(t).toHaveLength(4)
    expect(t[1]).toBeCloseTo(10.35, 2)
    expect(t[2]).toBe(t[1])
    expect(t[3]).toBeCloseTo(10.35 + 20.35, 2)
    expect(sentenceTimes(['a'.repeat(145)], 2)[1]).toBeCloseTo(10.35 / 2, 2)
  })

  it('writes times as m:ss', () => {
    expect(clock(0)).toBe('0:00')
    expect(clock(61.4)).toBe('1:01')
    expect(clock(-3)).toBe('0:00')
  })
})
