/* ============================================================================
   ORBIT — diagnosis
   ----------------------------------------------------------------------------
   Turns raw state into the handful of statements worth putting in front of a
   learner, each paired with the one intervention that actually addresses it.

   The rule this file exists to enforce: never tell someone they are
   "struggling with the Kalman filter" when the real problem is that their
   linear algebra is shaky. Fix upstream first, always.
   ========================================================================== */
import type { Module } from '@/curriculum/types'
import { Dag, PREREQ_THRESHOLD } from './graph'
import { currentR } from './fsrs'
import { calibrationBias } from './mastery'
import { atomsOf, moduleIdleDays } from './scheduler'
import { getTopic, type LearnerState } from './state'

export type DiagnosisKind =
  | 'prereq_gap'
  | 'struggling'
  | 'leech'
  | 'high_difficulty'
  | 'stale'
  | 'overconfident'
  | 'idle'

export interface Diagnosis {
  kind: DiagnosisKind
  moduleId: string
  /** 0–1. Drives ordering and badge colour. */
  severity: number
  /** One sentence, addressed to the learner. */
  message: string
  /** What to do about it. */
  action: string
  /** Where the action leads. */
  href?: string
  /** Item ids implicated, for leeches. */
  itemIds?: string[]
  /** Blocking module ids, for prereq gaps. */
  blockers?: string[]
}

/** An item that keeps lapsing is usually a content defect, not under-practice. */
export const LEECH_LAPSES = 8

export function diagnoseModule(
  state: LearnerState,
  dag: Dag,
  module: Module,
  now: Date = new Date(),
): Diagnosis[] {
  const out: Diagnosis[] = []
  const atoms = atomsOf(module)
  const recent = state.attempts.filter((a) => a.moduleId === module.id).slice(-10)
  const acc = recent.length ? recent.filter((a) => a.correct).length / recent.length : 1

  // ── prerequisite gap ─────────────────────────────────────────────────────
  // Checked first and reported first: everything downstream is a symptom.
  const mastery = new Map<string, number>()
  for (const m of dag.all()) mastery.set(m.id, moduleMasteryQuick(state, m, now))
  const blockers = dag.blockers(module.id, mastery)
  if (blockers.length > 0 && (recent.length === 0 || acc < 0.75)) {
    const names = blockers.map((b) => dag.get(b)?.title ?? b)
    out.push({
      kind: 'prereq_gap',
      moduleId: module.id,
      severity: Math.min(1, 0.5 + blockers.length * 0.15),
      message: `${module.title} rests on ${names.slice(0, 2).join(' and ')}${
        names.length > 2 ? ` and ${names.length - 2} more` : ''
      }, which ${blockers.length === 1 ? 'is' : 'are'} not solid yet.`,
      action: `Work ${names[0]} up to ${Math.round(PREREQ_THRESHOLD * 100)}% first — this gets much easier after that.`,
      href: `#/module/${blockers[0]}`,
      blockers,
    })
  }

  // ── struggling ───────────────────────────────────────────────────────────
  if (recent.length >= 8 && acc < 0.6) {
    out.push({
      kind: 'struggling',
      moduleId: module.id,
      severity: (0.6 - acc) / 0.6,
      message: `You are at ${Math.round(acc * 100)}% on recent ${module.title} items — well below the ~85% band where learning is fastest.`,
      action: 'Dropping back to worked examples and smaller batches until accuracy recovers.',
      href: `#/module/${module.id}`,
    })
  }

  // ── leeches ──────────────────────────────────────────────────────────────
  const leeches = atoms
    .map((a) => ({ a, it: state.items[a.id] }))
    .filter((x) => (x.it?.memory.lapses ?? 0) >= LEECH_LAPSES)
    .map((x) => x.a.id)
  if (leeches.length > 0) {
    out.push({
      kind: 'leech',
      moduleId: module.id,
      severity: Math.min(1, leeches.length / 5),
      message: `${leeches.length} item${leeches.length === 1 ? '' : 's'} in ${module.title} ${
        leeches.length === 1 ? 'has' : 'have'
      } lapsed ${LEECH_LAPSES}+ times.`,
      action:
        'An item that keeps failing is almost always two facts in one card or an ambiguous prompt — suspend it and rewrite it rather than drilling harder.',
      href: `#/module/${module.id}`,
      itemIds: leeches,
    })
  }

  // ── high measured difficulty ─────────────────────────────────────────────
  const seen = atoms.map((a) => state.items[a.id]).filter((it) => it && it.memory.d != null)
  if (seen.length >= 5) {
    const meanD = seen.reduce((s, it) => s + (it!.memory.d ?? 0), 0) / seen.length
    if (meanD > 7.5) {
      out.push({
        kind: 'high_difficulty',
        moduleId: module.id,
        severity: Math.min(1, (meanD - 7.5) / 2.5),
        message: `${module.title} is scoring ${meanD.toFixed(1)}/10 on measured difficulty — genuinely hard for you, not just unfamiliar.`,
        action: 'Break the hard items into smaller ones and add a diagram or worked derivation to each.',
        href: `#/module/${module.id}`,
      })
    }
  }

  // ── staleness ────────────────────────────────────────────────────────────
  const withMemory = atoms.map((a) => state.items[a.id]).filter((it) => it && it.memory.reps > 0)
  if (withMemory.length >= 3) {
    const r = withMemory.reduce((s, it) => s + currentR(it!.memory, now), 0) / withMemory.length
    if (r < 0.7) {
      out.push({
        kind: 'stale',
        moduleId: module.id,
        severity: (0.7 - r) / 0.7,
        message: `Predicted recall on ${module.title} has fallen to ${Math.round(r * 100)}%.`,
        action: 'Queued at the top of your next review session before it decays further.',
        href: `#/review?module=${module.id}`,
      })
    }
  }

  // ── calibration ──────────────────────────────────────────────────────────
  const withConf = recent
    .filter((a) => typeof a.confidence === 'number')
    .map((a) => ({ confidence: a.confidence!, correct: a.correct }))
  if (withConf.length >= 6) {
    const bias = calibrationBias(withConf)
    if (bias > 0.2) {
      out.push({
        kind: 'overconfident',
        moduleId: module.id,
        severity: Math.min(1, bias / 0.5),
        message: `On ${module.title} you rate yourself ${Math.round(bias * 100)} points more confident than you turn out to be.`,
        action:
          'Switching these to free recall — typing the answer before seeing it breaks the fluency illusion that recognition creates.',
        href: `#/module/${module.id}`,
      })
    }
  }

  // ── idle ─────────────────────────────────────────────────────────────────
  const idle = moduleIdleDays(state, module, now)
  const started = !!getTopic(state, module.id).startedAt
  if (started && Number.isFinite(idle) && idle > 21) {
    out.push({
      kind: 'idle',
      moduleId: module.id,
      severity: Math.min(1, idle / 90),
      message: `${module.title} has not been touched in ${Math.round(idle)} days.`,
      action: 'Pick it back up, or archive it so it stops weighing on your readiness number.',
      href: `#/module/${module.id}`,
    })
  }

  // A prerequisite gap always sorts first, regardless of severity. Every other
  // finding on a gated module is downstream of it — reporting "you are
  // struggling with the Kalman filter" above "your linear algebra is shaky"
  // would send the learner to grind at the symptom.
  return out.sort(
    (a, b) =>
      Number(b.kind === 'prereq_gap') - Number(a.kind === 'prereq_gap') ||
      b.severity - a.severity,
  )
}

/**
 * Whole-corpus scan, most severe first.
 *
 * Only one diagnosis of each kind survives per scan: a wall of twelve
 * "struggling" cards is noise, and the learner can only act on one thing at a
 * time anyway.
 */
export function diagnoseAll(
  state: LearnerState,
  dag: Dag,
  now: Date = new Date(),
  limit = 5,
): Diagnosis[] {
  const all: Diagnosis[] = []
  for (const m of dag.all()) {
    const topic = getTopic(state, m.id)
    // Skip modules never touched — "you haven't started this" is not a finding.
    if (topic.attempts === 0 && !topic.startedAt) continue
    all.push(...diagnoseModule(state, dag, m, now))
  }

  all.sort(
    (a, b) =>
      Number(b.kind === 'prereq_gap') - Number(a.kind === 'prereq_gap') ||
      b.severity - a.severity,
  )

  const seenKinds = new Set<DiagnosisKind>()
  const out: Diagnosis[] = []
  for (const d of all) {
    if (seenKinds.has(d.kind)) continue
    seenKinds.add(d.kind)
    out.push(d)
    if (out.length >= limit) break
  }
  return out
}

/** Cheap mastery estimate used inside diagnosis to avoid a circular import. */
function moduleMasteryQuick(state: LearnerState, m: Module, now: Date): number {
  const atoms = atomsOf(m)
  if (atoms.length === 0) return getTopic(state, m.id).pKnown
  let seen = 0
  let retention = 0
  let depth = 0
  for (const a of atoms) {
    const it = state.items[a.id]
    if (!it || it.memory.reps === 0) continue
    seen += 1
    retention += currentR(it.memory, now)
    depth += Math.min((it.memory.s ?? 0) / 60, 1)
  }
  const coverage = seen / atoms.length
  const pKnown = getTopic(state, m.id).pKnown
  const blend =
    0.35 * (seen ? retention / seen : 0) + 0.35 * pKnown + 0.3 * (seen ? depth / seen : 0)
  return coverage * blend
}
