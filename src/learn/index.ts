/* ============================================================================
   Learn mode — the tracks
   ----------------------------------------------------------------------------
   One plain-text file per language (see parse.ts for the format), bundled as
   text and parsed once. Which files an app carries is its platform.ts's call. A malformed file fails loudly in the unit tests, so a
   typo never reaches a learner as a lesson that cannot be passed.
   ========================================================================== */
import { LEARN_SOURCES, ROADMAPS } from './platform'
import { parseTrack } from './parse'
import type { LearnLang, LearnLesson, LearnTrack, Roadmap } from './types'

/** Every track this app offers, in the order a beginner should meet them. */
export const TRACKS: LearnTrack[] = LEARN_SOURCES.map(([file, source]) => parseTrack(source, file))

const BY_ID = new Map<string, { track: LearnTrack; lesson: LearnLesson; index: number }>()
for (const track of TRACKS) track.lessons.forEach((lesson, index) => BY_ID.set(lesson.id, { track, lesson, index }))

/** A course by its id; a bare language name means that language's first course. */
export function trackFor(id: string): LearnTrack | undefined {
  return TRACKS.find((t) => t.id === id) ?? TRACKS.find((t) => t.lang === id)
}

/** A language's courses, basics first. */
export function tracksFor(lang: string): LearnTrack[] {
  return TRACKS.filter((t) => t.lang === lang)
}

/** The course to carry on with in a language: the first not finished, or the last. */
export function currentTrack(lang: string, passed: Record<string, string>): LearnTrack | undefined {
  const all = tracksFor(lang)
  return all.find((t) => passedCount(t, passed) < t.lessons.length) ?? all[all.length - 1]
}

export function findLesson(id: string): { track: LearnTrack; lesson: LearnLesson; index: number } | undefined {
  return BY_ID.get(id)
}

/** The first lesson in a track she has not passed yet — where "Continue" goes. */
export function nextLesson(track: LearnTrack, passed: Record<string, string>): LearnLesson {
  return track.lessons.find((l) => !passed[l.id]) ?? track.lessons[track.lessons.length - 1]!
}

export function passedCount(track: LearnTrack, passed: Record<string, string>): number {
  return track.lessons.filter((l) => passed[l.id]).length
}

/**
 * Days in a row, ending today, on which she passed a lesson. A day with no
 * pass yet today does not break it until the day is over.
 */
export function streak(passed: Record<string, string>, now: Date = new Date()): number {
  const day = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  const days = new Set(Object.values(passed).map((iso) => day(new Date(iso))))
  const d = new Date(now)
  if (!days.has(day(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(day(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

const LANG_NAMES: Record<string, string> = {
  bash: 'The command line',
  git: 'Git',
  html: 'HTML & CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  sql: 'SQL',
  cpp: 'C++',
}

export function langName(lang: string): string {
  return LANG_NAMES[lang] ?? lang
}

/**
 * One roadmap per language with more than one course: beginner to expert,
 * every course of that language in order, projects last.
 */
/**
 * Courses from another language a ladder leans on, and the step that first
 * needs each: TypeScript is JavaScript with types, git is typed at the command
 * line, and the web courses past intermediate script their pages in JavaScript.
 * A mastery roadmap puts that course just before the step, where this app has it.
 */
export const PREREQUISITES: Partial<Record<LearnLang, { before: string; course: string }[]>> = {
  typescript: [{ before: 'typescript', course: 'javascript' }],
  git: [{ before: 'git', course: 'bash' }],
  html: [{ before: 'html-advanced', course: 'javascript' }],
}

function masterySteps(lang: LearnLang): string[] {
  const steps = tracksFor(lang).map((t) => t.id)
  for (const { before, course } of PREREQUISITES[lang] ?? []) {
    const at = steps.indexOf(before)
    if (at >= 0 && TRACKS.some((t) => t.id === course) && !steps.includes(course)) steps.splice(at, 0, course)
  }
  return steps
}

export const MASTERY: Roadmap[] = [...new Set(TRACKS.map((t) => t.lang))]
  .filter((lang) => tracksFor(lang).length > 1)
  .map((lang) => ({
    id: `master-${lang}`,
    title: langName(lang),
    blurb: `${langName(lang)} from the first line to expert: the basics, then the idioms, the design and debugging skills and the problem solving that let you build anything in it on your own, then real projects.`,
    steps: masterySteps(lang),
  }))

export { parseTrack, ROADMAPS }
export type { LearnLang, LearnLesson, LearnTrack, Roadmap }
