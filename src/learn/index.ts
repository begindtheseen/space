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
export const TRACKS: LearnTrack[] = LEARN_SOURCES.map(([lang, source]) => parseTrack(source, `${lang}.txt`))

const BY_ID = new Map<string, { track: LearnTrack; lesson: LearnLesson; index: number }>()
for (const track of TRACKS) track.lessons.forEach((lesson, index) => BY_ID.set(lesson.id, { track, lesson, index }))

export function trackFor(lang: string): LearnTrack | undefined {
  return TRACKS.find((t) => t.lang === lang)
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

export { parseTrack, ROADMAPS }
export type { LearnLang, LearnLesson, LearnTrack, Roadmap }
