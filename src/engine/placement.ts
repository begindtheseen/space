/* ============================================================================
   ORBIT — the placement test
   ----------------------------------------------------------------------------
   "Where should I start?" answered by asking, not guessing. The test walks up
   the skills the course is built on — Basecamp's arithmetic and geometry, then
   the first half of Algebra & Precalculus — two questions a skill, easiest
   first. Each skill comes out as:

     strong  both right: she has it, and its lesson is marked "tested out"
     shaky   one right: worth the lesson, probably quickly
     gap     neither right, or "I don't know": start here

   and the plan is every shaky or gap lesson in course order, so the first one
   is where she begins. Nothing is locked by it: a tested-out lesson is still
   there to read, and the test can be taken again at any time.

   There is no feedback during the test on purpose. It is a map, not a quiz;
   right and wrong answers are shown, with explanations, once it is over.

   This file is the logic and nothing else, so it can be tested against plain
   values; the questions live in src/curriculum/placement.ts.
   ========================================================================== */

export type SkillLevel = 'strong' | 'shaky' | 'gap'

export interface PlacementSkill {
  id: string
  /** What the skill is, in a few plain words. */
  label: string
  moduleId: string
  lessonId: string
}

export interface PlacementQuestion {
  id: string
  skill: string
  /** Markdown, with $…$ math. */
  prompt: string
  choices: string[]
  /** Index of the right choice. */
  answer: number
  /** Why that is the answer, shown in the review afterwards. */
  explain: string
}

/** What she chose for each question: a choice index, or null for "I don't know". */
export type PlacementAnswers = Record<string, number | null>

export interface PlacementResult {
  /** Bumped when the question bank changes enough that old results mislead. */
  version: number
  takenAt: string
  answers: PlacementAnswers
  levels: Record<string, SkillLevel>
}

export const PLACEMENT_VERSION = 1

/**
 * How many skills in a row with nothing right before the test offers to stop.
 * Past that, more questions tell her nothing she needs and cost her morale.
 */
export const STOP_AFTER_GAPS = 3

/** Each skill's level from the answers. Skills with no answers at all are gaps. */
export function score(skills: PlacementSkill[], bank: PlacementQuestion[], answers: PlacementAnswers): Record<string, SkillLevel> {
  const levels: Record<string, SkillLevel> = {}
  for (const s of skills) {
    const qs = bank.filter((q) => q.skill === s.id)
    const right = qs.filter((q) => answers[q.id] === q.answer).length
    levels[s.id] = qs.length > 0 && right === qs.length ? 'strong' : right > 0 ? 'shaky' : 'gap'
  }
  return levels
}

/** The lessons to do, in course order, and the ones she tested out of. */
export function planFor(skills: PlacementSkill[], levels: Record<string, SkillLevel>): { todo: PlacementSkill[]; testedOut: PlacementSkill[] } {
  return {
    todo: skills.filter((s) => levels[s.id] !== 'strong'),
    testedOut: skills.filter((s) => levels[s.id] === 'strong'),
  }
}

/**
 * Whether to offer stopping: the last `STOP_AFTER_GAPS` skills she has fully
 * answered all came out with nothing right.
 */
export function shouldOfferStop(skills: PlacementSkill[], bank: PlacementQuestion[], answers: PlacementAnswers): boolean {
  const done = skills.filter((s) => bank.filter((q) => q.skill === s.id).every((q) => q.id in answers))
  if (done.length < STOP_AFTER_GAPS) return false
  const last = done.slice(-STOP_AFTER_GAPS)
  return last.every((s) => bank.filter((q) => q.skill === s.id).every((q) => answers[q.id] !== q.answer))
}

export function lessonKeyOf(s: PlacementSkill): string {
  return `${s.moduleId}::${s.lessonId}`
}

/** Lesson keys (`moduleId::lessonId`) she tested out of. */
export function testedOutKeys(skills: PlacementSkill[], result: PlacementResult | undefined): Set<string> {
  if (!result) return new Set()
  return new Set(planFor(skills, result.levels).testedOut.map(lessonKeyOf))
}

export function coercePlacement(raw: unknown): PlacementResult | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (typeof r.takenAt !== 'string' || !Number.isFinite(Date.parse(r.takenAt))) return undefined
  const answers: PlacementAnswers = {}
  if (r.answers && typeof r.answers === 'object') {
    for (const [k, v] of Object.entries(r.answers as Record<string, unknown>)) {
      if (v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 16)) answers[k] = v as number | null
    }
  }
  const levels: Record<string, SkillLevel> = {}
  if (r.levels && typeof r.levels === 'object') {
    for (const [k, v] of Object.entries(r.levels as Record<string, unknown>)) {
      if (v === 'strong' || v === 'shaky' || v === 'gap') levels[k] = v
    }
  }
  return { version: typeof r.version === 'number' ? r.version : PLACEMENT_VERSION, takenAt: r.takenAt, answers, levels }
}
