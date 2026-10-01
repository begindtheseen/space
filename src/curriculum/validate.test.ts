/* ============================================================================
   ORBIT — curriculum integrity
   ----------------------------------------------------------------------------
   The curriculum is data, and data authored by hand drifts. These tests are the
   contract that keeps the engine's assumptions true:

     · the prerequisite graph is a DAG — a cycle would make the frontier
       computation silently wrong and gate modules forever
     · every prerequisite resolves — a dangling id makes a module permanently
       unreachable with no visible error
     · every id is unique — the scheduler keys memory state off item ids, so a
       collision silently merges two people's worth of review history

   None of these are style checks. Each one corresponds to a specific way the
   product breaks for a learner.
   ========================================================================== */
import { describe, expect, it } from 'vitest'
import { MODULES, corpusStats, dag, modulesInTrack, searchModules } from './index'
import { findGraphProblems, topoSort } from '@/engine/graph'
import { itemId, parseItemId } from './types'

describe('graph integrity', () => {
  const problems = findGraphProblems(MODULES)

  it('has no prerequisite cycles', () => {
    expect(
      problems.cycles.map((c) => c.join(' → ')),
      'a cycle makes those modules permanently ungated and unreachable',
    ).toEqual([])
  })

  it('has no dangling prerequisite references', () => {
    expect(
      problems.dangling.map((d) => `${d.module} requires missing ${d.missing}`),
    ).toEqual([])
  })

  it('has no duplicate module ids', () => {
    expect(problems.duplicates).toEqual([])
  })

  it('topologically sorts every module', () => {
    expect(topoSort(MODULES)).toHaveLength(MODULES.length)
  })

  it('places every prerequisite before its dependants in study order', () => {
    const order = dag().ids()
    const position = new Map(order.map((id, i) => [id, i]))
    for (const m of MODULES) {
      for (const p of m.prereqs) {
        if (!position.has(p)) continue
        expect(position.get(p)!, `${p} must come before ${m.id}`).toBeLessThan(position.get(m.id)!)
      }
    }
  })

  it('has at least one entry point per track', () => {
    /* Not "a module with no prerequisites at all" — that was only ever true
       while every ladder started from nothing. GNC Preparation deliberately
       stands on Foundations, and pretending otherwise would mean lying about
       the dependency graph to satisfy a test. What has to hold is that a track
       can be entered from outside it: at least one module whose prerequisites
       all sit in other tracks, so opening the track shows you somewhere to
       start rather than a wall of locked cards. */
    for (const track of ['foundations', 'coding', 'gnc', 'career'] as const) {
      const mods = modulesInTrack(track)
      if (mods.length === 0) continue
      const inTrack = new Set(mods.map((m) => m.id))
      const entries = mods.filter((m) => !m.prereqs.some((p) => inTrack.has(p)))
      expect(entries.length, `${track} cannot be entered from outside itself`).toBeGreaterThan(0)
    }
  })

  it('starts the corpus somewhere a complete beginner can stand', () => {
    const roots = MODULES.filter((m) => m.prereqs.length === 0)
    expect(roots.length, 'the corpus has no module with no prerequisites').toBeGreaterThan(0)
    for (const r of roots) {
      expect(r.tier, `${r.id} is a root, so it must be tier 0`).toBe(0)
    }
  })
})

describe('module shape', () => {
  it('gives every module the required fields', () => {
    for (const m of MODULES) {
      expect(m.id, 'module id').toMatch(/^[a-z0-9_]+$/)
      expect(m.title.length, `${m.id} title`).toBeGreaterThan(2)
      expect(m.summary.length, `${m.id} summary`).toBeGreaterThan(10)
      expect(m.hours, `${m.id} hours`).toBeGreaterThan(0)
      expect(m.topics.length, `${m.id} topics`).toBeGreaterThan(0)
      expect(m.objectives.length, `${m.id} objectives`).toBeGreaterThan(0)
      expect(m.tier, `${m.id} tier`).toBeGreaterThanOrEqual(0)
    }
  })

  it('keeps ids unique inside each module', () => {
    for (const m of MODULES) {
      const check = (label: string, ids: string[]) => {
        expect(new Set(ids).size, `${m.id} has duplicate ${label} ids`).toBe(ids.length)
      }
      check('card', (m.cards ?? []).map((c) => c.id))
      check('quiz', (m.quiz ?? []).map((q) => q.id))
      check('exercise', (m.exercises ?? []).map((e) => e.id))
      check('lesson', (m.lessons ?? []).map((l) => l.id))
    }
  })

  it('points every multiple-choice answer at a real option', () => {
    for (const m of MODULES) {
      for (const q of m.quiz ?? []) {
        if (!q.choices) continue
        expect(q.choices.length, `${m.id}/${q.id} needs at least two options`).toBeGreaterThan(1)
        expect(typeof q.answer, `${m.id}/${q.id} answer must index its choices`).toBe('number')
        const idx = q.answer as number
        expect(idx, `${m.id}/${q.id} answer out of range`).toBeGreaterThanOrEqual(0)
        expect(idx, `${m.id}/${q.id} answer out of range`).toBeLessThan(q.choices.length)
        expect(q.explain.length, `${m.id}/${q.id} needs an explanation`).toBeGreaterThan(10)
      }
    }
  })

  it('keeps seed difficulties on the usable part of the logit scale', () => {
    for (const m of MODULES) {
      for (const q of m.quiz ?? []) {
        if (q.b == null) continue
        expect(q.b, `${m.id}/${q.id} difficulty`).toBeGreaterThanOrEqual(-4)
        expect(q.b, `${m.id}/${q.id} difficulty`).toBeLessThanOrEqual(4)
      }
    }
  })

  it('gives every flashcard both sides', () => {
    for (const m of MODULES) {
      for (const c of m.cards ?? []) {
        expect(c.front.trim().length, `${m.id}/${c.id} front`).toBeGreaterThan(3)
        expect(c.back.trim().length, `${m.id}/${c.id} back`).toBeGreaterThan(1)
      }
    }
  })

  it('uses only http(s) resource links', () => {
    for (const m of MODULES) {
      for (const r of m.resources) {
        if (!r.url) continue
        expect(r.url, `${m.id} → ${r.title}`).toMatch(/^https?:\/\//)
      }
    }
  })

  it('gives runnable exercises a language and starter code', () => {
    for (const m of MODULES) {
      for (const e of m.exercises ?? []) {
        if (e.kind !== 'code') continue
        expect(e.lang, `${m.id}/${e.id} is a code exercise with no language`).toBeTruthy()
        expect(e.starter ?? '', `${m.id}/${e.id} needs starter code`).not.toBe('')
      }
    }
  })
})

describe('item ids', () => {
  it('round-trips through parse', () => {
    for (const m of MODULES.slice(0, 40)) {
      for (const c of (m.cards ?? []).slice(0, 3)) {
        const id = itemId(m.id, 'card', c.id)
        const parsed = parseItemId(id)
        expect(parsed).toEqual({ moduleId: m.id, kind: 'card', localId: c.id })
      }
    }
  })

  it('rejects malformed ids rather than guessing', () => {
    expect(parseItemId('nope')).toBeNull()
    expect(parseItemId('a::bogus::c')).toBeNull()
    expect(parseItemId('a::card')).toBeNull()
  })

  it('produces globally unique item ids across the whole corpus', () => {
    const seen = new Set<string>()
    for (const m of MODULES) {
      for (const c of m.cards ?? []) {
        const id = itemId(m.id, 'card', c.id)
        expect(seen.has(id), `duplicate item id ${id}`).toBe(false)
        seen.add(id)
      }
      for (const q of m.quiz ?? []) {
        const id = itemId(m.id, 'quiz', q.id)
        expect(seen.has(id), `duplicate item id ${id}`).toBe(false)
        seen.add(id)
      }
    }
  })
})

describe('corpus scale', () => {
  it('actually ships a curriculum', () => {
    const s = corpusStats()
    expect(s.modules).toBeGreaterThan(40)
    expect(s.cards).toBeGreaterThan(200)
    expect(s.quiz).toBeGreaterThan(150)
    expect(s.hours).toBeGreaterThan(500)
  })

  it('covers all four tracks', () => {
    for (const track of ['foundations', 'coding', 'gnc', 'career'] as const) {
      expect(modulesInTrack(track).length, `${track} is empty`).toBeGreaterThan(0)
    }
  })
})

describe('search', () => {
  it('ignores queries too short to be meaningful', () => {
    expect(searchModules('a')).toEqual([])
    expect(searchModules(' ')).toEqual([])
  })

  it('finds modules by title and topic', () => {
    const hits = searchModules('kalman')
    expect(hits.length).toBeGreaterThan(0)
  })
})

describe('readiness roll-up', () => {
  it('is 0 with no mastery and 1 with everything mastered', () => {
    const g = dag()
    const none = new Map<string, number>()
    expect(g.readiness(none)).toBeCloseTo(0, 6)

    const all = new Map(MODULES.map((m) => [m.id, 1]))
    expect(g.readiness(all)).toBeCloseTo(1, 6)
  })

  it('discounts a module whose prerequisites are weak', () => {
    const g = dag()
    const withPrereqs = MODULES.find((m) => g.prereqs(m.id).length > 0)
    if (!withPrereqs) return

    const strong = new Map(MODULES.map((m) => [m.id, 1]))
    const weak = new Map(strong)
    for (const p of g.prereqs(withPrereqs.id)) weak.set(p, 0.2)

    const effStrong = g.effectiveMastery(strong).get(withPrereqs.id)!
    const effWeak = g.effectiveMastery(weak).get(withPrereqs.id)!
    expect(effWeak).toBeLessThan(effStrong)
    // Soft gate, not a hard one: partial knowledge stays partly counted.
    expect(effWeak).toBeGreaterThan(0)
  })

  it('weights a module by how much depends on it', () => {
    const g = dag()
    const ids = g.ids()
    const weights = ids.map((id) => ({ id, w: g.weight(id), d: g.descendants(id).size }))
    const heavy = weights.reduce((a, b) => (b.w > a.w ? b : a))
    const light = weights.reduce((a, b) => (b.w < a.w ? b : a))
    expect(heavy.d).toBeGreaterThanOrEqual(light.d)
  })
})
