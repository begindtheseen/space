/* ============================================================================
   Learn mode — the tracks
   ----------------------------------------------------------------------------
   One plain-text file per course (see parse.ts for the format). What is here
   is the catalog of them (catalogOf.ts, built from the files at build time):
   every course's ids, titles and the shape of its lessons, which is all that
   progress, locks, credit and roadmaps need. A course's text loads when it is
   opened (load.ts). Which files an app carries is its platform.ts's call. A
   malformed file fails loudly in the build and the unit tests, so a typo never
   reaches a learner as a lesson that cannot be passed.
   ========================================================================== */
import { LEARN_COURSES, LEARN_LANGS, ROADMAPS } from './platform'
import { parseTrack } from './parse'
import type { CatalogTrack, LearnLang, LearnLesson, LearnTrack, LessonMeta, Roadmap, TrackMeta } from './types'

/** Every course this app offers, in the order a beginner should meet them: the catalog, without the text. */
export const TRACKS: CatalogTrack[] = LEARN_COURSES

const BY_ID = new Map<string, { track: CatalogTrack; lesson: LessonMeta; index: number }>()
for (const track of TRACKS) track.lessons.forEach((lesson, index) => BY_ID.set(lesson.id, { track, lesson, index }))

/** A course by its id; a bare language name means that language's first course. */
export function trackFor(id: string): CatalogTrack | undefined {
  return TRACKS.find((t) => t.id === id) ?? TRACKS.find((t) => t.lang === id)
}

/** A language's courses, basics first. Subject courses (the CS degree) sit on their subject's shelf instead. */
export function tracksFor(lang: string): CatalogTrack[] {
  return TRACKS.filter((t) => t.lang === lang && !t.subject)
}

/** The ladder a course sits on: its subject's courses in order, or its language's. */
export function ladderOf(track: Pick<TrackMeta, 'subject' | 'lang'>): CatalogTrack[] {
  return track.subject ? TRACKS.filter((t) => t.subject === track.subject) : tracksFor(track.lang)
}

/**
 * The courses whose gates must be passed before this one opens, then the course itself: its
 * `@requires` list when it has one (a degree course builds on particular courses, not on every
 * course numbered before it), otherwise the courses before it on its ladder.
 */
export function prerequisitesOf(track: TrackMeta): TrackMeta[] {
  if (!track.requires) return ladderOf(track)
  const before = track.requires.map((id) => TRACKS.find((t) => t.id === id)).filter((t): t is CatalogTrack => !!t)
  return [...before, track]
}


/** The course to carry on with in a language: the first not finished, or the last. */
export function currentTrack(lang: string, passed: Record<string, string>): CatalogTrack | undefined {
  const all = tracksFor(lang)
  return all.find((t) => passedCount(t, passed) < t.lessons.length) ?? all[all.length - 1]
}

/** A lesson of a course by its id, with its course and its place in it (catalog entries: load the course for the text). */
export function findLesson(id: string): { track: CatalogTrack; lesson: LessonMeta; index: number } | undefined {
  return BY_ID.get(id)
}

/** The first lesson in a track she has not passed yet — where "Continue" goes. */
export function nextLesson<L extends { id: string }>(track: { lessons: L[] }, passed: Record<string, string>): L {
  return track.lessons.find((l) => !passed[l.id]) ?? track.lessons[track.lessons.length - 1]!
}

export function passedCount(track: { lessons: { id: string }[] }, passed: Record<string, string>): number {
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

/** Every shelf of courses: one per language this app teaches, then one per subject. */
export interface Shelf {
  key: string
  name: string
  lang: LearnLang
  tracks: CatalogTrack[]
}

export const SHELVES: Shelf[] = [
  ...LEARN_LANGS.map((lang) => ({ key: lang, name: langName(lang), lang, tracks: tracksFor(lang) })),
  ...[...new Set(TRACKS.map((t) => t.subject).filter((s): s is string => !!s))].map((subject) => {
    const tracks = TRACKS.filter((t) => t.subject === subject)
    return { key: subject, name: subject, lang: tracks[0]!.lang, tracks }
  }),
]

export { parseTrack, ROADMAPS }
export type { CatalogTrack, LearnLang, LearnLesson, LearnTrack, LessonMeta, Roadmap, TrackMeta }
