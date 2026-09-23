import { describe, expect, it } from 'vitest'
import { search } from './Search'

const index = [
  { label: 'Reading speed', where: 'Settings', href: '/settings', tone: 'var(--warn)' },
  { label: 'Speed of sound', where: 'Aerodynamics', href: '/module/x', tone: 'var(--d-gnc)' },
  { label: 'Playground', where: 'Page', href: '/playground', tone: 'var(--cyan)' },
]

describe('search', () => {
  it('needs two letters before it guesses', () => {
    expect(search('', index)).toEqual([])
    expect(search('s', index)).toEqual([])
  })

  it('matches anywhere in the name, ignoring case', () => {
    expect(search('SOUND', index).map((h) => h.label)).toEqual(['Speed of sound'])
  })

  it('carries the track colour through to the result', () => {
    // A lesson is tinted with its track's accent, so the thing she is scanning
    // for is findable by hue before she has finished reading the line.
    expect(search('sound', index)[0]?.tone).toBe('var(--d-gnc)')
  })

  it('puts a name that starts with the query first', () => {
    // "speed" is inside "Reading speed" and at the front of "Speed of sound".
    expect(search('speed', index).map((h) => h.label)).toEqual(['Speed of sound', 'Reading speed'])
  })

  it('says nothing rather than something wrong', () => {
    expect(search('zzzz', index)).toEqual([])
  })

  it('keeps to the limit', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      label: `Lesson ${i}`,
      where: 'm',
      href: '/',
      tone: 'var(--cyan)',
    }))
    expect(search('lesson', many, 5)).toHaveLength(5)
  })
})
