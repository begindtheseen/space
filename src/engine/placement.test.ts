import { describe, expect, it } from 'vitest'
import { lessonsFor, moduleById } from '@/curriculum'
import { PLACEMENT_QUESTIONS, PLACEMENT_SKILLS } from '@/curriculum/placement'
import { focusInputs } from '@/lib/nextUp'
import { dag } from '@/curriculum'
import { newLearnerState, migrateState } from './state'
import { coercePlacement, planFor, score, shouldOfferStop, testedOutKeys, type PlacementAnswers } from './placement'

const allRight = (): PlacementAnswers => Object.fromEntries(PLACEMENT_QUESTIONS.map((q) => [q.id, q.answer]))

describe('the placement question bank', () => {
  it('asks two questions of every skill, and nothing about skills it does not know', () => {
    for (const s of PLACEMENT_SKILLS) expect(PLACEMENT_QUESTIONS.filter((q) => q.skill === s.id), s.id).toHaveLength(2)
    const ids = new Set(PLACEMENT_SKILLS.map((s) => s.id))
    for (const q of PLACEMENT_QUESTIONS) expect(ids.has(q.skill), q.id).toBe(true)
    expect(new Set(PLACEMENT_QUESTIONS.map((q) => q.id)).size).toBe(PLACEMENT_QUESTIONS.length)
  })

  it('has four distinct choices per question, and an answer that is one of them', () => {
    for (const q of PLACEMENT_QUESTIONS) {
      expect(q.choices, q.id).toHaveLength(4)
      expect(new Set(q.choices).size, `${q.id} repeats a choice`).toBe(4)
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0)
      expect(q.answer, q.id).toBeLessThan(q.choices.length)
      expect(q.explain.length, q.id).toBeGreaterThan(20)
    }
  })

  it('points every skill at a real lesson, in course order', () => {
    for (const s of PLACEMENT_SKILLS) {
      expect(moduleById(s.moduleId), s.id).toBeDefined()
      expect(lessonsFor(s.moduleId).map((l) => l.id), `${s.id} → ${s.lessonId}`).toContain(s.lessonId)
    }
  })
})

describe('scoring and the plan', () => {
  it('reads two right as strong, one as shaky, none or "I don\'t know" as a gap', () => {
    const a = allRight()
    a.dec1 = (PLACEMENT_QUESTIONS.find((q) => q.id === 'dec1')!.answer + 1) % 4
    a.fac1 = null
    a.fac2 = null
    delete a.logs
    const levels = score(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, a)
    expect(levels['place-value']).toBe('strong')
    expect(levels.decimals).toBe('shaky')
    expect(levels.factors).toBe('gap')
  })

  it('plans the shaky and missing skills in course order, and marks the rest tested out', () => {
    const a = allRight()
    a.gr1 = null
    a.gr2 = null
    a.lg1 = null
    const levels = score(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, a)
    const plan = planFor(PLACEMENT_SKILLS, levels)
    expect(plan.todo.map((s) => s.id)).toEqual(['graphs', 'logs'])
    expect(plan.testedOut).toHaveLength(PLACEMENT_SKILLS.length - 2)
  })

  it('treats every skill after "stop here" as still to learn', () => {
    const a: PlacementAnswers = { pv1: 0, pv2: 0 }
    const plan = planFor(PLACEMENT_SKILLS, score(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, a))
    expect(plan.testedOut.map((s) => s.id)).toEqual(['place-value'])
    expect(plan.todo[0]!.id).toBe('decimals')
  })

  it('offers to stop after three skills in a row with nothing right, and not before', () => {
    const a: PlacementAnswers = { pv1: 0, pv2: 0, dec1: null, dec2: null, fac1: null, fac2: null }
    expect(shouldOfferStop(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, a)).toBe(false)
    a['frb1'] = null
    expect(shouldOfferStop(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, a)).toBe(false)
    a['frb2'] = null
    expect(shouldOfferStop(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, a)).toBe(true)
  })
})

describe('placement in the rest of the app', () => {
  const taken = (answers: PlacementAnswers) => ({
    version: 1,
    takenAt: '2026-09-26T12:00:00Z',
    answers,
    levels: score(PLACEMENT_SKILLS, PLACEMENT_QUESTIONS, answers),
  })

  it('survives being saved and loaded, and drops nonsense', () => {
    const s = newLearnerState()
    s.placement = taken(allRight())
    const back = migrateState(JSON.parse(JSON.stringify(s)))
    expect(back.placement?.levels.decimals).toBe('strong')
    expect(coercePlacement({ takenAt: 'yesterday' })).toBeUndefined()
    expect(coercePlacement({ takenAt: '2026-01-01T00:00:00Z', levels: { a: 'excellent', b: 'gap' } })?.levels).toEqual({ b: 'gap' })
  })

  it('sends Next up to the first lesson the plan says she needs', () => {
    const a = allRight()
    a.av1 = null
    a.av2 = null
    const s = newLearnerState()
    s.placement = taken(a)
    const inp = focusInputs(s, dag())
    expect(inp.module?.id).toBe('t0_m00_basecamp')
    expect(inp.lesson?.id).toBe('l09-perimeter-area-and-volume')
  })

  it('skips tested-out lessons once the plan is done', () => {
    const s = newLearnerState()
    s.placement = taken(allRight())
    const out = testedOutKeys(PLACEMENT_SKILLS, s.placement)
    expect(out.has('t0_m00_basecamp::l01-place-value-and-estimating')).toBe(true)
    const inp = focusInputs(s, dag())
    expect(inp.lesson ? out.has(`${inp.module!.id}::${inp.lesson.id}`) : false).toBe(false)
  })
})
