/* ============================================================================
   ORBIT — engine behaviour
   ----------------------------------------------------------------------------
   These test the decisions, not the arithmetic: that overdue reviews really do
   beat new material, that a module cannot enter the frontier before its
   prerequisites, that mastery cannot be faked with a handful of items, and
   that untrusted state coming off disk cannot poison the engine.
   ========================================================================== */
import { describe, expect, it } from 'vitest'
import type { Module } from '@/curriculum/types'
import { applyAttempt, isCorrect, logMinutes, markRead, setOnboarded, toggleSuspend, toggleTask } from './apply'
import { LEECH_LAPSES, diagnoseModule } from './diagnose'
import { Dag, MASTERY_THRESHOLD, PREREQ_THRESHOLD, findGraphProblems } from './graph'
import {
  TARGET_SUCCESS,
  abilityUpdate,
  bktPredict,
  bktUpdate,
  brierScore,
  calibrationBias,
  difficultyFit,
  eloK,
  eloUpdate,
  irtItem,
  irtP,
  newAbility,
  reliabilityCurve,
  scaffoldFor,
  stepsToBlank,
  topicMastery,
} from './mastery'
import { atomsOf, buildSession, dueAtoms, interleave, masteryMap, optimalGapDays, rankFrontier, retentionForDeadline } from './scheduler'
import { dayKey, migrateState, newLearnerState, streak, type LearnerState } from './state'

/* ── Fixtures ────────────────────────────────────────────────────────────── */

function mod(id: string, prereqs: string[] = [], cards = 4): Module {
  return {
    id,
    track: 'gnc',
    tier: 0,
    title: `Module ${id}`,
    summary: 'A test module used by the engine suite.',
    prereqs,
    hours: 10,
    topics: ['t'],
    objectives: ['o'],
    resources: [],
    cards: Array.from({ length: cards }, (_, i) => ({
      id: `c${i}`,
      front: `front ${i}`,
      back: `back ${i}`,
    })),
  }
}

const FIXTURE = [
  mod('root'),
  mod('mid', ['root']),
  mod('leaf', ['mid']),
  mod('side', ['root']),
]

function studyAll(state: LearnerState, dag: Dag, moduleId: string, grade: 1 | 2 | 3 | 4, now: Date) {
  const m = dag.get(moduleId)!
  let s = state
  for (const a of atomsOf(m)) {
    s = applyAttempt(s, { itemId: a.id, grade }, m, now).state
  }
  return s
}

/* ── Graph ───────────────────────────────────────────────────────────────── */

describe('prerequisite graph', () => {
  const dag = new Dag(FIXTURE)

  it('reports descendants transitively', () => {
    expect([...dag.descendants('root')].sort()).toEqual(['leaf', 'mid', 'side'])
    expect([...dag.descendants('leaf')]).toEqual([])
  })

  it('reports ancestors transitively', () => {
    expect([...dag.ancestors('leaf')].sort()).toEqual(['mid', 'root'])
  })

  it('opens only the root when nothing is mastered', () => {
    const none = new Map<string, number>()
    expect(dag.frontier(none).map((m) => m.id)).toEqual(['root'])
  })

  it('opens the next layer once a prerequisite passes threshold', () => {
    const m = new Map([['root', PREREQ_THRESHOLD]])
    expect(dag.frontier(m).map((m2) => m2.id).sort()).toEqual(['mid', 'root', 'side'])
  })

  it('does not open a layer on a prerequisite just below threshold', () => {
    const m = new Map([['root', PREREQ_THRESHOLD - 0.01]])
    expect(dag.frontier(m).map((m2) => m2.id)).toEqual(['root'])
  })

  it('drops mastered modules out of the frontier', () => {
    const m = new Map([['root', 1]])
    expect(dag.frontier(m).map((x) => x.id)).not.toContain('root')
  })

  it('names the blockers in the way', () => {
    expect(dag.blockers('leaf', new Map())).toEqual(['mid'])
  })

  it('builds a study path that includes every unmet ancestor, in order', () => {
    const path = dag.pathTo('leaf', new Map()).map((m) => m.id)
    expect(path).toEqual(['root', 'mid', 'leaf'])
  })

  it('omits already-mastered modules from a path', () => {
    const path = dag.pathTo('leaf', new Map([['root', 1]])).map((m) => m.id)
    expect(path).toEqual(['mid', 'leaf'])
  })

  it('weights a foundational module above a leaf', () => {
    expect(dag.weight('root')).toBeGreaterThan(dag.weight('leaf'))
  })

  it('detects a cycle rather than looping forever', () => {
    const cyclic = [mod('a', ['b']), mod('b', ['a'])]
    const problems = findGraphProblems(cyclic)
    expect(problems.cycles.length).toBeGreaterThan(0)
  })

  it('reports dangling prerequisites', () => {
    const problems = findGraphProblems([mod('a', ['ghost'])])
    expect(problems.dangling).toEqual([{ module: 'a', missing: 'ghost' }])
  })
})

/* ── Mastery ─────────────────────────────────────────────────────────────── */

describe('BKT', () => {
  it('rises on a correct answer and falls on a wrong one', () => {
    const up = bktUpdate(0.5, true)
    const down = bktUpdate(0.5, false)
    expect(up).toBeGreaterThan(0.5)
    expect(down).toBeLessThan(0.5)
  })

  it('never leaves [0, 1] over a long noisy sequence', () => {
    let p = 0.2
    for (let i = 0; i < 200; i++) {
      p = bktUpdate(p, i % 3 !== 0)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('converges upward under sustained success', () => {
    let p = 0.2
    for (let i = 0; i < 30; i++) p = bktUpdate(p, true)
    expect(p).toBeGreaterThan(0.95)
  })

  it('predicts between the guess rate and 1 − slip', () => {
    expect(bktPredict(0)).toBeCloseTo(0.2, 6) // pure guessing
    expect(bktPredict(1)).toBeCloseTo(0.9, 6) // 1 − slip
  })
})

describe('IRT and Elo', () => {
  it('gives a 50% chance when ability equals difficulty (no guessing)', () => {
    expect(irtP(0, { a: 1, b: 0, c: 0 })).toBeCloseTo(0.5, 6)
  })

  it('floors probability at the guessing rate', () => {
    const item = irtItem(3, 4) // very hard, four choices
    expect(irtP(-4, item)).toBeGreaterThanOrEqual(0.25)
  })

  it('moves ability up on success and item difficulty down', () => {
    const r = eloUpdate(0, 0, true, 0, 0)
    expect(r.theta).toBeGreaterThan(0)
    expect(r.difficulty).toBeLessThan(0)
  })

  it('shrinks step size as evidence accumulates', () => {
    expect(eloK(0)).toBeGreaterThan(eloK(50))
    expect(eloK(50)).toBeGreaterThan(eloK(500))
  })

  it('corrects for guessing on multiple choice', () => {
    const plain = eloUpdate(0, 0, true, 0, 0, 0)
    const mcq = eloUpdate(0, 0, true, 0, 0, 4)
    // A correct 4-choice answer is weaker evidence, so θ moves less.
    expect(mcq.theta).toBeLessThan(plain.theta)
  })

  it('estimates ability with EAP and tightens the error bar', () => {
    let a = newAbility()
    const start = a.se
    for (let i = 0; i < 20; i++) a = abilityUpdate(a, irtItem(0), i % 4 !== 0)
    expect(a.se).toBeLessThan(start)
    expect(a.theta).toBeGreaterThan(0)
  })

  it('does not diverge on an all-correct pattern the way MLE would', () => {
    let a = newAbility()
    for (let i = 0; i < 30; i++) a = abilityUpdate(a, irtItem(0), true)
    expect(Number.isFinite(a.theta)).toBe(true)
    expect(a.theta).toBeLessThan(4)
  })
})

describe('difficulty targeting', () => {
  it('peaks exactly at the 85% band', () => {
    expect(difficultyFit(TARGET_SUCCESS)).toBeCloseTo(1, 6)
    expect(difficultyFit(0.5)).toBeLessThan(difficultyFit(0.8))
    expect(difficultyFit(1)).toBeLessThan(difficultyFit(0.86))
  })

  it('fades scaffolding as mastery grows', () => {
    expect(scaffoldFor(0.1)).toBe('worked')
    expect(scaffoldFor(0.4)).toBe('completion')
    expect(scaffoldFor(0.7)).toBe('faded')
    expect(scaffoldFor(0.95)).toBe('independent')
  })

  it('blanks steps backward, last first', () => {
    expect(stepsToBlank(5, 0.3)).toEqual([])
    const mid = stepsToBlank(5, 0.55)
    expect(mid[mid.length - 1]).toBe(4)
    expect(stepsToBlank(5, 0.8)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('mastery roll-up', () => {
  it('refuses to call partial coverage mastery', () => {
    // Perfect on everything seen, but only a tenth of the topic attempted.
    const thin = topicMastery({ coverage: 0.1, retention: 1, pKnown: 1, depth: 1 })
    expect(thin).toBeCloseTo(0.1, 6)
    expect(thin).toBeLessThan(MASTERY_THRESHOLD)
  })

  it('reaches 1 only on full coverage with everything strong', () => {
    expect(topicMastery({ coverage: 1, retention: 1, pKnown: 1, depth: 1 })).toBeCloseTo(1, 6)
  })
})

describe('calibration', () => {
  const perfect = [
    { confidence: 0.9, correct: true },
    { confidence: 0.9, correct: true },
    { confidence: 0.1, correct: false },
    { confidence: 0.1, correct: false },
  ]

  it('scores a well-calibrated learner near zero Brier', () => {
    expect(brierScore(perfect)).toBeLessThan(0.02)
    expect(Math.abs(calibrationBias(perfect))).toBeLessThan(0.02)
  })

  it('reports a positive bias for overconfidence', () => {
    const over = [
      { confidence: 0.9, correct: false },
      { confidence: 0.9, correct: false },
      { confidence: 0.9, correct: true },
    ]
    expect(calibrationBias(over)).toBeGreaterThan(0.2)
  })

  it('buckets a reliability curve without losing anyone', () => {
    const curve = reliabilityCurve(perfect, 5)
    expect(curve.reduce((a, b) => a + b.n, 0)).toBe(perfect.length)
  })
})

/* ── Scheduling ──────────────────────────────────────────────────────────── */

describe('session assembly', () => {
  const dag = new Dag(FIXTURE)
  const now = new Date('2026-05-01T09:00:00Z')

  it('starts a new learner on the root module only', () => {
    const state = newLearnerState(now)
    const plan = buildSession(state, dag, { now, size: 20 })
    expect(plan.reviewCount).toBe(0)
    expect(plan.newCount).toBeGreaterThan(0)
    const modules = new Set(plan.items.map((i) => i.atom.moduleId))
    expect([...modules]).toEqual(['root'])
  })

  it('puts overdue reviews ahead of new material', () => {
    let state = newLearnerState(now)
    state = studyAll(state, dag, 'root', 3, now)

    // Come back a month later: everything studied is now overdue.
    const later = new Date('2026-06-15T09:00:00Z')
    const plan = buildSession(state, dag, { now: later, size: 20 })

    expect(plan.reviewCount).toBeGreaterThan(0)
    const firstNew = plan.items.findIndex((i) => i.kind === 'new')
    const lastReview = plan.items.map((i) => i.kind).lastIndexOf('review')
    if (firstNew >= 0) expect(lastReview).toBeLessThan(firstNew)
  })

  it('respects the daily cap on new items', () => {
    const state = { ...newLearnerState(now), goals: { ...newLearnerState(now).goals, newPerDay: 2 } }
    const plan = buildSession(state, dag, { now, size: 30 })
    expect(plan.newCount).toBeLessThanOrEqual(2)
  })

  it('never schedules a suspended item', () => {
    let state = newLearnerState(now)
    state = studyAll(state, dag, 'root', 3, now)
    const target = atomsOf(dag.get('root')!)[0]!.id
    state = toggleSuspend(state, target)

    const later = new Date('2026-07-01T09:00:00Z')
    const due = dueAtoms(state, dag.all(), later)
    expect(due.map((d) => d.id)).not.toContain(target)
  })

  it('sorts the review queue most-forgotten first', () => {
    let state = newLearnerState(now)
    state = studyAll(state, dag, 'root', 3, now)
    const later = new Date('2026-08-01T09:00:00Z')
    const due = dueAtoms(state, dag.all(), later)
    for (let i = 1; i < due.length; i++) {
      expect(due[i]!.r).toBeGreaterThanOrEqual(due[i - 1]!.r)
    }
  })
})

describe('interleaving', () => {
  it('avoids consecutive items from the same module where it can', () => {
    const items = [
      ...Array.from({ length: 4 }, (_, i) => rev('a', i)),
      ...Array.from({ length: 4 }, (_, i) => rev('b', i)),
    ]
    const out = interleave(items)
    let runs = 0
    for (let i = 1; i < out.length; i++) {
      if (out[i]!.atom.moduleId === out[i - 1]!.atom.moduleId) runs++
    }
    expect(runs).toBe(0)
  })

  it('keeps new material blocked and after the reviews', () => {
    const items = [rev('a', 0), rev('b', 0), fresh('c', 0), fresh('c', 1)]
    const out = interleave(items)
    expect(out.slice(-2).every((i) => i.kind === 'new')).toBe(true)
  })

  it('preserves every item', () => {
    const items = [rev('a', 0), rev('a', 1), rev('b', 0), fresh('c', 0)]
    expect(interleave(items)).toHaveLength(items.length)
  })

  function rev(m: string, i: number) {
    return {
      atom: { id: `${m}::card::c${i}`, moduleId: m, kind: 'card' as const, b: 0, choices: 0 },
      kind: 'review' as const,
      predicted: 0.8,
    }
  }
  function fresh(m: string, i: number) {
    return { ...rev(m, i), kind: 'new' as const }
  }
})

describe('frontier ranking', () => {
  it('prefers the module that unblocks more of the tree', () => {
    const dag = new Dag(FIXTURE)
    const now = new Date('2026-05-01T09:00:00Z')
    const state = newLearnerState(now)
    const mastery = new Map([['root', 1]])
    const ranked = rankFrontier(state, dag, mastery, now)
    const ids = ranked.map((r) => r.module.id)
    // 'mid' gates 'leaf'; 'side' gates nothing.
    expect(ids.indexOf('mid')).toBeLessThan(ids.indexOf('side'))
  })
})

describe('deadline mode', () => {
  it('leaves retention alone when there is no target date', () => {
    expect(retentionForDeadline(0.9)).toBe(0.9)
  })

  it('leaves retention alone when the date is far away', () => {
    const far = new Date(Date.now() + 300 * 86_400_000).toISOString()
    expect(retentionForDeadline(0.9, far)).toBe(0.9)
  })

  it('raises retention as the date approaches', () => {
    const soon = new Date(Date.now() + 7 * 86_400_000).toISOString()
    const mid = new Date(Date.now() + 60 * 86_400_000).toISOString()
    expect(retentionForDeadline(0.9, soon)).toBeGreaterThan(retentionForDeadline(0.9, mid))
    expect(retentionForDeadline(0.9, soon)).toBeLessThanOrEqual(0.95)
  })

  it('shrinks the optimal gap as a fraction of a longer horizon', () => {
    expect(optimalGapDays(7) / 7).toBeGreaterThan(optimalGapDays(365) / 365)
  })
})

/* ── Applying attempts ───────────────────────────────────────────────────── */

describe('applyAttempt', () => {
  const dag = new Dag(FIXTURE)
  const now = new Date('2026-05-01T09:00:00Z')
  const root = dag.get('root')!
  const atom = atomsOf(root)[0]!

  it('treats Hard and above as a successful retrieval', () => {
    expect(isCorrect(1)).toBe(false)
    expect(isCorrect(2)).toBe(true)
    expect(isCorrect(3)).toBe(true)
    expect(isCorrect(4)).toBe(true)
  })

  it('moves FSRS, Elo, BKT, the log and the day counters together', () => {
    const before = newLearnerState(now)
    const { state } = applyAttempt(before, { itemId: atom.id, grade: 3, ms: 4200 }, root, now)

    expect(state.items[atom.id]!.memory.reps).toBe(1)
    expect(state.items[atom.id]!.n).toBe(1)
    expect(state.theta).not.toBe(before.theta)
    expect(state.topics.root!.pKnown).toBeGreaterThan(0)
    expect(state.topics.root!.startedAt).toBeTruthy()
    expect(state.attempts).toHaveLength(1)
    expect(state.days[dayKey(now)]!.reviews).toBe(1)
    expect(state.days[dayKey(now)]!.newItems).toBe(1)
  })

  it('does not mutate the state it was given', () => {
    const before = newLearnerState(now)
    applyAttempt(before, { itemId: atom.id, grade: 3 }, root, now)
    expect(before.attempts).toHaveLength(0)
    expect(before.items[atom.id]).toBeUndefined()
  })

  it('counts a second attempt on the same item as a review, not a new item', () => {
    let s = newLearnerState(now)
    s = applyAttempt(s, { itemId: atom.id, grade: 3 }, root, now).state
    s = applyAttempt(s, { itemId: atom.id, grade: 3 }, root, new Date(now.getTime() + 6e5)).state
    expect(s.days[dayKey(now)]!.newItems).toBe(1)
    expect(s.days[dayKey(now)]!.reviews).toBe(2)
  })

  it('stamps readiness onto the day when a roll-up is supplied', () => {
    const s = applyAttempt(
      newLearnerState(now),
      { itemId: atom.id, grade: 4 },
      root,
      now,
      (next) => dag.readiness(masteryMap(next, dag.all(), now)),
    ).state
    expect(s.days[dayKey(now)]!.readiness).toBeGreaterThan(0)
  })

  it('records confidence for the calibration chart', () => {
    const s = applyAttempt(
      newLearnerState(now),
      { itemId: atom.id, grade: 3, confidence: 0.7 },
      root,
      now,
    ).state
    expect(s.attempts[0]!.confidence).toBe(0.7)
  })
})

/* ── Diagnosis ───────────────────────────────────────────────────────────── */

describe('diagnosis', () => {
  const dag = new Dag(FIXTURE)
  const now = new Date('2026-05-01T09:00:00Z')

  it('blames the prerequisite, not the module, when upstream is weak', () => {
    let s = newLearnerState(now)
    // Fail repeatedly on 'mid' while 'root' was never studied.
    const mid = dag.get('mid')!
    for (let i = 0; i < 10; i++) {
      for (const a of atomsOf(mid)) {
        s = applyAttempt(s, { itemId: a.id, grade: 1 }, mid, now).state
      }
    }
    const findings = diagnoseModule(s, dag, mid, now)
    expect(findings.some((f) => f.kind === 'prereq_gap')).toBe(true)
  })

  it('only counts a lapse once a card has actually graduated', () => {
    // Failing a card that never left the learning steps is not a lapse — it
    // never entered review, so there was nothing to forget.
    let s = newLearnerState(now)
    const root = dag.get('root')!
    const a = atomsOf(root)[0]!
    for (let i = 0; i < 12; i++) {
      s = applyAttempt(s, { itemId: a.id, grade: 1 }, root, now).state
    }
    expect(s.items[a.id]!.memory.lapses).toBe(0)
    expect(s.items[a.id]!.memory.state).toBe('learning')
  })

  it('flags a leech once a graduated card keeps lapsing', () => {
    let s = newLearnerState(now)
    const root = dag.get('root')!
    const a = atomsOf(root)[0]!
    let t = now

    // Easy graduates the card straight to review; Again then lapses it, and
    // Easy brings it back so the next Again can lapse it again.
    for (let i = 0; i < 10; i++) {
      s = applyAttempt(s, { itemId: a.id, grade: 4 }, root, t).state
      t = new Date(t.getTime() + 86_400_000)
      s = applyAttempt(s, { itemId: a.id, grade: 1 }, root, t).state
      t = new Date(t.getTime() + 86_400_000)
    }

    expect(s.items[a.id]!.memory.lapses).toBeGreaterThanOrEqual(LEECH_LAPSES)
    const findings = diagnoseModule(s, dag, root, t)
    expect(findings.some((f) => f.kind === 'leech')).toBe(true)
  })

  it('puts a prerequisite gap above the struggling it causes', () => {
    let s = newLearnerState(now)
    const mid = dag.get('mid')!
    for (let i = 0; i < 10; i++) {
      for (const a of atomsOf(mid)) {
        s = applyAttempt(s, { itemId: a.id, grade: 1 }, mid, now).state
      }
    }
    const findings = diagnoseModule(s, dag, mid, now)
    // Both fire; the cause must be reported before the symptom.
    expect(findings.map((f) => f.kind)).toContain('struggling')
    expect(findings[0]!.kind).toBe('prereq_gap')
  })

  it('says nothing about a module that is going fine', () => {
    let s = newLearnerState(now)
    s = studyAll(s, dag, 'root', 4, now)
    const findings = diagnoseModule(s, dag, dag.get('root')!, now)
    expect(findings).toEqual([])
  })
})

/* ── State ───────────────────────────────────────────────────────────────── */

describe('state', () => {
  it('counts a streak back from today without punishing an unfinished today', () => {
    const now = new Date('2026-05-10T20:00:00Z')
    const s = newLearnerState(now)
    for (const d of ['2026-05-07', '2026-05-08', '2026-05-09']) {
      s.days[d] = { date: d, reviews: 5, correct: 4, newItems: 0, minutes: 10, readiness: 0.1 }
    }
    expect(streak(s, now)).toBe(3)
  })

  it('breaks a streak on a genuinely missed day', () => {
    const now = new Date('2026-05-10T20:00:00Z')
    const s = newLearnerState(now)
    for (const d of ['2026-05-06', '2026-05-08', '2026-05-09']) {
      s.days[d] = { date: d, reviews: 5, correct: 4, newItems: 0, minutes: 10, readiness: 0.1 }
    }
    expect(streak(s, now)).toBe(2)
  })

  it('toggles daily tasks per day, not globally', () => {
    const now = new Date('2026-05-10T20:00:00Z')
    let s = toggleTask(newLearnerState(now), 'review', now)
    expect(s.tasks[`${dayKey(now)}::review`]).toBe(true)
    s = toggleTask(s, 'review', now)
    expect(s.tasks[`${dayKey(now)}::review`]).toBeUndefined()
  })

  it('accumulates logged minutes', () => {
    const now = new Date('2026-05-10T20:00:00Z')
    let s = logMinutes(newLearnerState(now), 12, now)
    s = logMinutes(s, 8, now)
    expect(s.days[dayKey(now)]!.minutes).toBe(20)
  })
})

describe('migrateState — the untrusted boundary', () => {
  it('returns a clean state for garbage input', () => {
    for (const junk of [null, undefined, 42, 'nope', [], { nonsense: true }]) {
      const s = migrateState(junk)
      expect(s.version).toBe(1)
      expect(s.items).toEqual({})
      expect(s.settings.desiredRetention).toBe(0.9)
    }
  })

  it('clamps hostile numeric values into range', () => {
    const s = migrateState({
      theta: 1e9,
      settings: { desiredRetention: 99, displayName: 'x'.repeat(500) },
      goals: { newPerDay: -5, weeklyMinutes: 1e9 },
      items: {
        'a::card::c0': {
          memory: { s: -1, d: 500, state: 'bogus', step: -9, due: 'x', reps: -3, lapses: 1e12 },
          difficulty: 1e9,
        },
      },
    })
    expect(s.theta).toBeLessThanOrEqual(6)
    expect(s.settings.desiredRetention).toBeLessThanOrEqual(0.95)
    expect(s.settings.displayName.length).toBeLessThanOrEqual(60)
    expect(s.goals.newPerDay).toBeGreaterThanOrEqual(0)
    expect(s.goals.weeklyMinutes).toBeLessThanOrEqual(10080)

    const item = s.items['a::card::c0']!
    expect(item.memory.d).toBeLessThanOrEqual(10)
    expect(item.memory.state).toBe('new')
    expect(item.memory.step).toBeGreaterThanOrEqual(0)
    expect(item.memory.reps).toBeGreaterThanOrEqual(0)
    expect(item.difficulty).toBeLessThanOrEqual(6)
  })

  it('drops malformed day keys rather than trusting them', () => {
    const s = migrateState({
      days: {
        'not-a-date': { reviews: 5 },
        '2026-05-01': { reviews: 5, correct: 3, newItems: 1, minutes: 12, readiness: 0.3 },
      },
    })
    expect(Object.keys(s.days)).toEqual(['2026-05-01'])
  })

  it('preserves a well-formed round trip', () => {
    const now = new Date('2026-05-01T09:00:00Z')
    const dag = new Dag(FIXTURE)
    const root = dag.get('root')!
    const original = applyAttempt(
      newLearnerState(now),
      { itemId: atomsOf(root)[0]!.id, grade: 3, confidence: 0.6 },
      root,
      now,
    ).state

    const restored = migrateState(JSON.parse(JSON.stringify(original)))
    expect(Object.keys(restored.items)).toEqual(Object.keys(original.items))
    expect(restored.attempts).toHaveLength(1)
    expect(restored.theta).toBeCloseTo(original.theta, 10)
  })

  it('trims an oversized attempt log', () => {
    const attempts = Array.from({ length: 9000 }, (_, i) => ({
      at: new Date(2026, 0, 1, 0, i).toISOString(),
      itemId: 'a::card::c0',
      moduleId: 'a',
      correct: true,
    }))
    expect(migrateState({ attempts }).attempts.length).toBeLessThanOrEqual(4000)
  })
})

describe('study-path markers', () => {
  const now = new Date('2026-09-22T10:00:00Z')

  it('records the first time a module is marked studied and keeps it', () => {
    let s = newLearnerState(now)
    expect(s.read).toEqual({})
    s = markRead(s, 'root', now)
    expect(s.read.root).toBe(now.toISOString())
    const later = markRead(s, 'root', new Date(now.getTime() + 86_400_000))
    expect(later).toBe(s)
    expect(later.read.root).toBe(now.toISOString())
  })

  it('does not mutate the state it was given', () => {
    const before = newLearnerState(now)
    markRead(before, 'root', now)
    expect(before.read).toEqual({})
  })

  it('sets the onboarding flag once', () => {
    const s = setOnboarded(newLearnerState(now), now)
    expect(s.settings.onboarded).toBe(true)
    expect(setOnboarded(s, now)).toBe(s)
  })

  it('round-trips both markers through migration and drops malformed ones', () => {
    const s = setOnboarded(markRead(newLearnerState(now), 'root', now), now)
    const back = migrateState(JSON.parse(JSON.stringify(s)), now)
    expect(back.read).toEqual({ root: now.toISOString() })
    expect(back.settings.onboarded).toBe(true)

    const dirty = migrateState({ read: { root: 42 }, settings: { onboarded: 'yes' } }, now)
    expect(dirty.read).toEqual({})
    expect(dirty.settings.onboarded).toBeUndefined()

    const legacy = migrateState({ version: 1, items: {}, pinned: ['x'] }, now)
    expect(legacy.read).toEqual({})
    expect(legacy.pinned).toEqual(['x'])
  })
})
