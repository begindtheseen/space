import { describe, expect, it } from 'vitest'
import { MODULES, lessonCoverage, moduleById, searchLessonsIn, searchModules } from './index'

describe('finding a lesson by name', () => {
  it('finds a lesson whose title matches', () => {
    const hits = searchLessonsIn('intermediate axis')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]!.lesson.title.toLowerCase()).toContain('intermediate axis')
  })

  it('carries enough context to show and open the hit', () => {
    const hit = searchLessonsIn('intermediate axis')[0]!
    expect(moduleById(hit.moduleId)).toBeDefined()
    expect(hit.moduleTitle).toBeTruthy()
    expect(hit.lesson.minutes).toBeGreaterThan(0)
  })

  it('finds a lesson by the topic it teaches, not only its title', () => {
    const hits = searchLessonsIn('flat-spin')
    const byTopic = hits.find((h) => h.matchedTopic)
    expect(byTopic?.matchedTopic).toBeTruthy()
  })

  it('puts an exact title first', () => {
    // Derived from the corpus rather than hardcoded: this suite has to stay
    // true while a thousand more lessons are written, and a test that names a
    // particular lesson is a test that breaks the week someone writes another
    // one on the same subject.
    const any = searchLessonsIn('the', 40).find((h) => h.lesson.title.length > 12)!
    const hits = searchLessonsIn(any.lesson.title, 10)
    expect(hits[0]!.lesson.id).toBe(any.lesson.id)
  })

  it('ignores a query too short to mean anything', () => {
    expect(searchLessonsIn('a')).toEqual([])
    expect(searchLessonsIn(' ')).toEqual([])
  })

  it('respects the limit', () => {
    expect(searchLessonsIn('the', 5).length).toBeLessThanOrEqual(5)
  })

  it('returns nothing rather than throwing on a query that matches nothing', () => {
    expect(searchLessonsIn('zzzznotathing')).toEqual([])
  })

  it('complements module search rather than replacing it', () => {
    // A module with no lessons written yet can only ever be found by module
    // search, so the two have to coexist. Which modules those are changes by
    // the hour while the corpus is being written, so the module is found by
    // its coverage rather than by name.
    const untaught = MODULES.find((m) => (lessonCoverage(m.id)?.covered ?? 0) === 0)
    expect(untaught, 'expected at least one module with no lessons yet').toBeDefined()
    expect(searchModules(untaught!.title).map((m) => m.id)).toContain(untaught!.id)
    expect(searchLessonsIn(untaught!.title).map((h) => h.moduleId)).not.toContain(untaught!.id)
  })
})
