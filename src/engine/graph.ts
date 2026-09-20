/* ============================================================================
   ORBIT — prerequisite graph
   ----------------------------------------------------------------------------
   The curriculum is a DAG. This module answers the four questions the rest of
   the app asks of it:

     · what is safe to study right now?      → frontier()
     · what is blocking this module?         → blockers()
     · how ready am I overall?               → readiness()
     · what does finishing this unlock?      → descendants()

   The readiness roll-up is the number on the dashboard ring, so it is worth
   being precise about what it means. It is NOT "fraction of modules touched".
   It is a *weighted* mean of *effective* mastery, where:

     weight    — a module counts for more when more of the curriculum depends
                 on it. Linear algebra gates two thirds of the tree; a CAD
                 elective gates nothing. Weighting by descendant count means
                 the ring moves most when foundations move.

     effective — a module's mastery is discounted by the state of its weakest
                 prerequisite. Knowing the Kalman filter equations while shaky
                 on linear algebra is real but fragile knowledge, and the
                 number should say so.

   The discount is soft (`0.5 + 0.5·gate`) rather than a hard multiply. A hard
   gate makes the headline number lurch when one upstream topic wobbles, and a
   number that jumps for no visible reason is a number nobody trusts.
   ========================================================================== */
import type { Module } from '@/curriculum/types'

/** A prerequisite is considered satisfied at this mastery level. */
export const PREREQ_THRESHOLD = 0.7

/** A module is considered done at this mastery level. */
export const MASTERY_THRESHOLD = 0.9

export class Dag {
  readonly modules: Map<string, Module>
  private readonly children = new Map<string, string[]>()
  private readonly order: string[]
  private readonly descendantCache = new Map<string, Set<string>>()

  constructor(modules: Module[]) {
    this.modules = new Map(modules.map((m) => [m.id, m]))

    for (const m of modules) {
      for (const p of m.prereqs) {
        if (!this.children.has(p)) this.children.set(p, [])
        this.children.get(p)!.push(m.id)
      }
    }

    this.order = topoSort(modules)
  }

  has(id: string): boolean {
    return this.modules.has(id)
  }

  get(id: string): Module | undefined {
    return this.modules.get(id)
  }

  ids(): string[] {
    return this.order
  }

  all(): Module[] {
    return this.order.map((id) => this.modules.get(id)!)
  }

  /** Prerequisite ids that actually exist in this graph. */
  prereqs(id: string): string[] {
    return (this.modules.get(id)?.prereqs ?? []).filter((p) => this.modules.has(p))
  }

  /** Modules that list `id` as a prerequisite. */
  childrenOf(id: string): string[] {
    return this.children.get(id) ?? []
  }

  /** Every module reachable downstream of `id`. Memoised — it is asked for a lot. */
  descendants(id: string): Set<string> {
    const hit = this.descendantCache.get(id)
    if (hit) return hit

    const out = new Set<string>()
    const stack = [...this.childrenOf(id)]
    while (stack.length) {
      const n = stack.pop()!
      if (out.has(n)) continue
      out.add(n)
      stack.push(...this.childrenOf(n))
    }
    this.descendantCache.set(id, out)
    return out
  }

  /** Every module upstream of `id`, transitively. */
  ancestors(id: string): Set<string> {
    const out = new Set<string>()
    const stack = [...this.prereqs(id)]
    while (stack.length) {
      const n = stack.pop()!
      if (out.has(n)) continue
      out.add(n)
      stack.push(...this.prereqs(n))
    }
    return out
  }

  /** Prerequisites not yet at `PREREQ_THRESHOLD` — i.e. what is in the way. */
  blockers(id: string, mastery: ReadonlyMap<string, number>): string[] {
    return this.prereqs(id).filter((p) => (mastery.get(p) ?? 0) < PREREQ_THRESHOLD)
  }

  unlocked(id: string, mastery: ReadonlyMap<string, number>): boolean {
    return this.blockers(id, mastery).length === 0
  }

  /**
   * The teachable set: unlocked, but not yet mastered. This is the only place
   * the scheduler is allowed to pick new material from.
   */
  frontier(mastery: ReadonlyMap<string, number>, done = MASTERY_THRESHOLD): Module[] {
    return this.all().filter(
      (m) => (mastery.get(m.id) ?? 0) < done && this.unlocked(m.id, mastery),
    )
  }

  /**
   * The shortest prerequisite chain from something the learner can start today
   * to `target`, in study order. This is what the UI draws as "your path to
   * powered descent guidance".
   */
  pathTo(target: string, mastery: ReadonlyMap<string, number>): Module[] {
    if (!this.modules.has(target)) return []
    const needed = new Set<string>()
    const visit = (id: string) => {
      if (needed.has(id)) return
      if ((mastery.get(id) ?? 0) >= MASTERY_THRESHOLD) return
      needed.add(id)
      for (const p of this.prereqs(id)) visit(p)
    }
    visit(target)
    return this.order.filter((id) => needed.has(id)).map((id) => this.modules.get(id)!)
  }

  /**
   * Structural weight: how much of the curriculum rests on this module.
   * `importance` lets an author hand-boost a module the graph alone would
   * under-rate (interview-critical leaves, for instance).
   */
  weight(id: string): number {
    const m = this.modules.get(id)
    if (!m) return 0
    return (m.importance ?? 1) * (1 + this.descendants(id).size)
  }

  /**
   * Mastery discounted by the weakest prerequisite, propagated in topological
   * order so the penalty cascades down the tree rather than stopping at one
   * level.
   */
  effectiveMastery(raw: ReadonlyMap<string, number>): Map<string, number> {
    const eff = new Map<string, number>()
    for (const id of this.order) {
      const ps = this.prereqs(id).map((p) => eff.get(p) ?? 0)
      const gate = ps.length ? Math.min(...ps) : 1
      eff.set(id, (raw.get(id) ?? 0) * (0.5 + 0.5 * gate))
    }
    return eff
  }

  /** The headline number: weighted mean of effective mastery over a subset. */
  readiness(raw: ReadonlyMap<string, number>, filter?: (m: Module) => boolean): number {
    const eff = this.effectiveMastery(raw)
    let num = 0
    let den = 0
    for (const id of this.order) {
      const m = this.modules.get(id)!
      if (filter && !filter(m)) continue
      const w = this.weight(id)
      num += w * (eff.get(id) ?? 0)
      den += w
    }
    return den === 0 ? 0 : num / den
  }

  /** Readiness restricted to one track — the four dashboard bars. */
  trackReadiness(raw: ReadonlyMap<string, number>, track: string): number {
    return this.readiness(raw, (m) => m.track === track)
  }
}

/**
 * Kahn's algorithm. Modules in a cycle are appended at the end rather than
 * dropped: a cycle is an authoring bug that the validator reports loudly, but
 * the app should still render something rather than silently lose content.
 */
export function topoSort(modules: Module[]): string[] {
  const ids = new Set(modules.map((m) => m.id))
  const indeg = new Map<string, number>()
  const adj = new Map<string, string[]>()

  for (const m of modules) {
    indeg.set(m.id, 0)
    adj.set(m.id, [])
  }
  for (const m of modules) {
    for (const p of m.prereqs) {
      if (!ids.has(p)) continue // dangling prereq — validator's problem, not ours
      adj.get(p)!.push(m.id)
      indeg.set(m.id, (indeg.get(m.id) ?? 0) + 1)
    }
  }

  // Seed in authored order so equal-depth modules keep a stable, sensible
  // sequence instead of whatever Map iteration happens to give.
  const queue = modules.filter((m) => (indeg.get(m.id) ?? 0) === 0).map((m) => m.id)
  const out: string[] = []

  while (queue.length) {
    const n = queue.shift()!
    out.push(n)
    for (const c of adj.get(n) ?? []) {
      const d = (indeg.get(c) ?? 0) - 1
      indeg.set(c, d)
      if (d === 0) queue.push(c)
    }
  }

  if (out.length < modules.length) {
    const seen = new Set(out)
    for (const m of modules) if (!seen.has(m.id)) out.push(m.id)
  }
  return out
}

/** Cycles and dangling references, for the authoring validator. */
export function findGraphProblems(modules: Module[]): {
  cycles: string[][]
  dangling: { module: string; missing: string }[]
  duplicates: string[]
} {
  const ids = new Set<string>()
  const duplicates: string[] = []
  for (const m of modules) {
    if (ids.has(m.id)) duplicates.push(m.id)
    ids.add(m.id)
  }

  const dangling: { module: string; missing: string }[] = []
  for (const m of modules) {
    for (const p of m.prereqs) {
      if (!ids.has(p)) dangling.push({ module: m.id, missing: p })
    }
  }

  // Iterative DFS with an explicit colour map; recursion would blow the stack
  // on a deep curriculum and the trace is easier to read this way.
  const byId = new Map(modules.map((m) => [m.id, m]))
  const colour = new Map<string, 0 | 1 | 2>()
  const cycles: string[][] = []
  const path: string[] = []

  const walk = (start: string) => {
    const stack: { id: string; i: number }[] = [{ id: start, i: 0 }]
    colour.set(start, 1)
    path.push(start)

    while (stack.length) {
      const top = stack[stack.length - 1]!
      const prereqs = (byId.get(top.id)?.prereqs ?? []).filter((p) => ids.has(p))
      if (top.i >= prereqs.length) {
        colour.set(top.id, 2)
        stack.pop()
        path.pop()
        continue
      }
      const next = prereqs[top.i++]!
      const c = colour.get(next) ?? 0
      if (c === 1) {
        const from = path.indexOf(next)
        cycles.push([...path.slice(from), next])
      } else if (c === 0) {
        colour.set(next, 1)
        path.push(next)
        stack.push({ id: next, i: 0 })
      }
    }
  }

  for (const m of modules) if ((colour.get(m.id) ?? 0) === 0) walk(m.id)

  return { cycles, dangling, duplicates }
}
