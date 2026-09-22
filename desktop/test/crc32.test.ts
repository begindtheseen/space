import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { crc32 } from '../crc32.js'

describe('crc32', () => {
  it('matches the standard check values', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926)
    expect(crc32(Buffer.alloc(0))).toBe(0)
    expect(crc32(Buffer.from('a'))).toBe(0xe8b7be43)
    expect(crc32(Buffer.from('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339)
  })

  it('returns an unsigned 32-bit value', () => {
    const v = crc32(Buffer.from([0xff, 0xff, 0xff, 0xff]))
    expect(v).toBe(0xffffffff)
    expect(v).toBeGreaterThanOrEqual(0)
  })

  it('is incremental', () => {
    const data = randomBytes(10_000)
    const whole = crc32(data)
    let running = 0
    for (let i = 0; i < data.length; i += 777) running = crc32(data.subarray(i, i + 777), running)
    expect(running).toBe(whole)
  })
})
