import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, formatRelativeTime } from '@/lib/format'

describe('formatBytes', () => {
  it('shows whole bytes and one decimal above that', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(6_123_456)).toBe('5.8 MB')
    expect(formatBytes(2.5 * 1024 ** 3)).toBe('2.5 GB')
  })

  it('clamps to gigabytes rather than inventing a unit', () => {
    expect(formatBytes(3 * 1024 ** 4)).toBe('3072.0 GB')
  })

  it('treats nothing, negatives and non-numbers as zero', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-5)).toBe('0 B')
    expect(formatBytes(Number.NaN)).toBe('0 B')
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B')
  })
})

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-09-22T12:00:00Z')
  const ago = (ms: number) => new Date(now - ms).toISOString()

  it('rounds to the nearest natural unit', () => {
    expect(formatRelativeTime(ago(0), now)).toBe('just now')
    expect(formatRelativeTime(ago(30_000), now)).toBe('just now')
    expect(formatRelativeTime(ago(60_000), now)).toBe('a minute ago')
    expect(formatRelativeTime(ago(5 * 60_000), now)).toBe('5 minutes ago')
    expect(formatRelativeTime(ago(60 * 60_000), now)).toBe('an hour ago')
    expect(formatRelativeTime(ago(5 * 3_600_000), now)).toBe('5 hours ago')
    expect(formatRelativeTime(ago(24 * 3_600_000), now)).toBe('yesterday')
    expect(formatRelativeTime(ago(3 * 86_400_000), now)).toBe('3 days ago')
  })

  it('treats a stamp ahead of the local clock as now', () => {
    expect(formatRelativeTime(ago(-60_000), now)).toBe('just now')
  })

  it('falls back to a calendar date beyond a month', () => {
    const text = formatRelativeTime(ago(40 * 86_400_000), now)
    expect(text).not.toBeNull()
    expect(text).toContain('2026')
    expect(text).not.toContain('ago')
  })

  it('returns null for anything that is not a timestamp', () => {
    expect(formatRelativeTime('', now)).toBeNull()
    expect(formatRelativeTime('not a date', now)).toBeNull()
  })
})

describe('formatDate', () => {
  it('renders a parseable stamp and rejects the rest', () => {
    expect(formatDate('2026-09-22T00:00:00Z')).toContain('2026')
    expect(formatDate('nope')).toBeNull()
  })
})
