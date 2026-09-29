import { describe, expect, it } from 'vitest'
import { markPracticed, recordRetest, updateGate } from '@/engine/apply'
import { migrateState, newLearnerState } from '@/engine/state'
import { LessonFormatError, answerMatches, parseTrack } from './parse'
import {
  choiceOrder,
  GATE_COOLDOWN_MS,
  RETEST_DAYS,
  answerInSitting,
  asLesson,
  courseMastered,
  dueRetests,
  endSitting,
  gradedUnits,
  lessonMastered,
  nextSittingAt,
  openSitting,
  passInSitting,
  shuffled,
  sittingPassed,
  startSitting,
} from './practice'
import type { LearnQuestion } from './types'

const problem = (tag: string, n: number) => `+++ ${tag} | Problem ${n}
--- task
Print ${n}.
--- solution
print(${n})
--- hint
Use print.
--- check output | prints ${n}
${n}
`

const SRC = `@track python
@title Python
=== t-01 | Printing
--- teach
How print works.
--- task
Print hello.
--- solution
print("hello")
--- hint
Use print.
--- check output | prints hello
hello
${problem('practice', 1)}${problem('practice', 2)}
=== t-gate | Printing, mastered
--- teach
Everything about print.
--- gate
pass 4
questions 1
minutes 30
${[1, 2, 3, 4, 5].map((n) => problem('problem', n)).join('')}
+++ question | What it prints
--- ask
What does \`print(2 + 3)\` print?
--- answer
5
--- why
2 + 3 is 5.

+++ question | Why a set
--- ask
Why is membership fast in a set?
--- choice
It is sorted.
--- choice correct
It hashes.
--- choice
It is small.
--- why
Hashing finds the slot directly.
`

const track = parseTrack(SRC, 'test')
const [lesson, gate] = track.lessons as [NonNullable<(typeof track.lessons)[0]>, NonNullable<(typeof track.lessons)[0]>]

describe('practice and gate blocks in the lesson format', () => {
  it('reads practice problems under a lesson, each graded like a lesson', () => {
    expect(lesson.practice.map((p) => p.id)).toEqual(['t-01.p1', 't-01.p2'])
    expect(lesson.practice[1]!.solution).toBe('print(2)\n')
    expect(lesson.checks).toHaveLength(1)
    const unit = asLesson(lesson, lesson.practice[0]!)
    expect(unit).toMatchObject({ id: 't-01.p1', lang: 'python', task: 'Print 1.', practice: [] })
    expect(gradedUnits(lesson).map((u) => u.id)).toEqual(['t-01', 't-01.p1', 't-01.p2'])
  })

  it('reads a gate: its pass mark, its time, and problems with no task of its own', () => {
    expect(gate.gate).toMatchObject({ pass: 4, minutes: 30 })
    expect(gate.gate!.problems.map((p) => p.id)).toEqual(['t-gate.g1', 't-gate.g2', 't-gate.g3', 't-gate.g4', 't-gate.g5'])
    expect(gate.checks).toEqual([])
    expect(gradedUnits(gate)).toHaveLength(5)
  })

  it('reads questions: typed answers and choices, each with its why', () => {
    const [typed, choice] = gate.gate!.questions
    expect(typed).toMatchObject({ id: 't-gate.q1', answers: ['5'] })
    expect(answerMatches(typed!, '  5 ')).toBe(true)
    expect(answerMatches(typed!, '6')).toBe(false)
    expect(choice!.choices!.map((c) => c.correct)).toEqual([false, true, false])
    expect(gate.gate!.questionPass).toBe(1)
    expect(() => parseTrack(SRC.replace('--- why\nHashing finds the slot directly.\n', ''), 'x')).toThrow(/why/)
    expect(() => parseTrack(SRC.replace('--- choice correct\nIt hashes.', '--- choice\nIt hashes.'), 'x')).toThrow(/right choice/)
    expect(() => parseTrack(SRC.replace('questions 1\n', ''), 'x')).toThrow(/questions N/)
  })

  it('refuses a gate that could not be passed or is too small, and problems outside a gate', () => {
    expect(() => parseTrack(SRC.replace('pass 4', 'pass 6'), 'x')).toThrow(LessonFormatError)
    expect(() => parseTrack(SRC.replace('minutes 30', 'minutes 2'), 'x')).toThrow(/minutes/)
    expect(() => parseTrack(SRC.replace(problem('problem', 5), ''), 'x')).toThrow(/at least five problems/)
    expect(() => parseTrack(SRC.replace(problem('practice', 1), problem('problem', 1)), 'x')).toThrow(/problem" belongs in a gate/)
    expect(() => parseTrack(SRC.replace('+++ practice | Problem 2\n--- task\nPrint 2.\n', '+++ practice | Problem 2\n'), 'x')).toThrow(/needs a task/)
  })
})

describe('mastery', () => {
  const t0 = new Date('2026-10-01T10:00:00Z')

  it('a lesson is mastered once its task and every practice problem have passed, and then books a re-test', () => {
    let s = newLearnerState(t0)
    s = markPracticed(s, lesson, 't-01', t0)
    expect(lessonMastered(lesson, s.learn)).toBe(false)
    expect(s.learnRetests['t-01']).toBeUndefined()
    s = markPracticed(s, lesson, 't-01.p1', t0)
    s = markPracticed(s, lesson, 't-01.p2', t0)
    expect(lessonMastered(lesson, s.learn)).toBe(true)
    expect(Date.parse(s.learnRetests['t-01']!.due) - t0.getTime()).toBe(RETEST_DAYS[0] * 86_400_000)
    expect(courseMastered(track, s.learn)).toBe(false)
  })

  it('a re-test climbs the ladder on a pass and starts again on a miss', () => {
    let s = newLearnerState(t0)
    for (const id of ['t-01', 't-01.p1', 't-01.p2']) s = markPracticed(s, lesson, id, t0)
    const later = new Date(t0.getTime() + 3 * 86_400_000)
    expect(dueRetests(s.learnRetests, later)).toEqual(['t-01'])
    s = recordRetest(s, 't-01', true, later)
    expect(s.learnRetests['t-01']).toMatchObject({ step: 1 })
    expect(dueRetests(s.learnRetests, later)).toEqual([])
    s = recordRetest(s, 't-01', false, later)
    expect(s.learnRetests['t-01']).toMatchObject({ step: 0, rusty: true })
  })

  it('a gate passes on the pass mark within the time, and not with problems passed late', () => {
    let s = newLearnerState(t0)
    s = updateGate(s, gate, (r) => startSitting(gate, r, t0), t0)
    const sitting = openSitting(gate, s.learnGates['t-gate'], t0)!
    expect(new Set(sitting.order)).toEqual(new Set(gate.gate!.problems.map((p) => p.id)))
    const at = (min: number) => new Date(t0.getTime() + min * 60_000)
    for (const [i, id] of sitting.order.slice(0, 3).entries()) s = updateGate(s, gate, (r) => passInSitting(r!, id, at(i + 1)), at(i + 1))
    expect(s.learn['t-gate']).toBeUndefined()
    // The fourth pass lands after the 30 minutes: it does not count.
    const late = passInSitting(s.learnGates['t-gate']!, sitting.order[3]!, at(31))
    expect(sittingPassed(gate, late.sittings[0]!)).toBe(false)
    s = updateGate(s, gate, (r) => passInSitting(r!, sitting.order[3]!, at(20)), at(20))
    // Four problems are not enough without the question mark as well.
    expect(s.learn['t-gate']).toBeUndefined()
    s = updateGate(s, gate, (r) => answerInSitting(r!, 't-gate.q2', false, at(21)), at(21))
    s = updateGate(s, gate, (r) => answerInSitting(r!, 't-gate.q2', true, at(22)), at(22))
    expect(s.learn['t-gate'], 'a second answer to the same question does not count').toBeUndefined()
    s = updateGate(s, gate, (r) => answerInSitting(r!, 't-gate.q1', true, at(23)), at(23))
    expect(s.learn['t-gate']).toBeTruthy()
  })

  it('after a failed sitting the next one waits out the cooldown', () => {
    let s = newLearnerState(t0)
    s = updateGate(s, gate, (r) => startSitting(gate, r, t0), t0)
    const ended = new Date(t0.getTime() + 10 * 60_000)
    s = updateGate(s, gate, (r) => endSitting(r!, ended), ended)
    expect(openSitting(gate, s.learnGates['t-gate'], ended)).toBeUndefined()
    expect(nextSittingAt(gate, s.learnGates['t-gate'], ended)!.getTime()).toBe(ended.getTime() + GATE_COOLDOWN_MS)
    expect(nextSittingAt(gate, s.learnGates['t-gate'], new Date(ended.getTime() + GATE_COOLDOWN_MS + 1))).toBeNull()
  })

  it('shuffles the same way for the same seed and differently for another', () => {
    const xs = Array.from({ length: 10 }, (_, i) => i)
    expect(shuffled(xs, 42)).toEqual(shuffled(xs, 42))
    expect(shuffled(xs, 42)).not.toEqual(shuffled(xs, 43))
    expect([...shuffled(xs, 7)].sort((a, b) => a - b)).toEqual(xs)
  })

  it('keeps gate sittings and re-tests through a save and load, and drops what is malformed', () => {
    let s = newLearnerState(t0)
    s = updateGate(s, gate, (r) => startSitting(gate, r, t0), t0)
    for (const id of ['t-01', 't-01.p1', 't-01.p2']) s = markPracticed(s, lesson, id, t0)
    const back = migrateState(JSON.parse(JSON.stringify(s)), t0)
    expect(back.learnGates).toEqual(s.learnGates)
    expect(back.learnRetests).toEqual(s.learnRetests)
    const bad = migrateState({ ...JSON.parse(JSON.stringify(s)), learnGates: { x: { sittings: [{ startedAt: 'nope' }] } }, learnRetests: { y: { step: 'a' } } }, t0)
    expect(bad.learnGates).toEqual({ x: { sittings: [] } })
    expect(bad.learnRetests).toEqual({})
  })
})

describe('choice order', () => {
  const q = (texts: string[]): LearnQuestion => ({ id: 'q', title: 't', ask: 'a', why: 'w', choices: texts.map((text, i) => ({ text, correct: i === 0 })) })
  it('is a shuffle of every choice, different from run to run', () => {
    const question = q(['a', 'b', 'c', 'd'])
    const orders = new Set<string>()
    for (let seed = 1; seed <= 40; seed++) {
      let x = (seed * 2654435761) >>> 0
      const random = () => {
        x ^= x << 13
        x ^= x >>> 17
        x ^= x << 5
        return (x >>> 0) / 4294967296
      }
      const order = choiceOrder(question, random)
      expect([...order].sort()).toEqual([0, 1, 2, 3])
      orders.add(order.join(''))
    }
    expect(orders.size).toBeGreaterThan(10)
  })
  it('keeps the written order when a choice points at the others', () => {
    expect(choiceOrder(q(['a', 'b', 'All of the above']), () => 0)).toEqual([0, 1, 2])
  })
})
