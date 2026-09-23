import { describe, expect, it } from 'vitest'
import { search } from './Search'

const index = [
  { label: 'Reading speed', where: 'Settings', href: '/settings' },
  { label: 'Speed of sound', where: 'Aerodynamics', href: '/module/x' },
  { label: 'Playground', where: 'Page', href: '/playground' },
]

describe('search', () => {
  it('needs two letters before it guesses', () => {
    expect(search('', index)).toEqual([])
    expect(search('s', index)).toEqual([])
  })

  it('matches anywhere in the name, ignoring case', () => {
    expect(search('SOUND', index).map((h) => h.label)).toEqual(['Speed of sound'])
  })

  it('puts a name that starts with the query first', () => {
    // "speed" is inside "Reading speed" and at the front of "Speed of sound".
    expect(search('speed', index).map((h) => h.label)).toEqual(['Speed of sound', 'Reading speed'])
  })

  it('says nothing rather than something wrong', () => {
    expect(search('zzzz', index)).toEqual([])
  })

  it('keeps to the limit', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ label: `Lesson ${i}`, where: 'm', href: '/' }))
    expect(search('lesson', many, 5)).toHaveLength(5)
  })
})
