/* ============================================================================
   Learn mode — the catalog, built from the course files
   ----------------------------------------------------------------------------
   Every course in tracks/ and every module practice file in modules/, parsed
   with the one parser (parse.ts) and cut down to what the app needs before
   anything is opened: ids, titles, the order of lessons, and each lesson's
   practice, quiz and gate ids. That is everything progress, mastery, locks,
   credit, re-tests and roadmaps are computed from. The text itself (teach,
   task, starters, solutions, checks) stays in the files and loads when a
   course is opened (load.ts).

   vite.config.ts runs this at build time and serves the result as
   `virtual:learn-catalog`; Vitest gets the same module through the same
   plugin. It reads whatever files are in the folders, so a new course needs
   no list kept by hand.

   Like parse.ts, this is loaded straight into Node by vite.config.ts: runtime
   imports carry their extension, and everything else is types.
   ========================================================================== */
import { parseTrack } from './parse.ts'
import type { CatalogTrack, LearnCatalog, LearnTrack, LessonMeta } from './types'

const ids = (items: { id: string }[]): { id: string }[] => items.map((x) => ({ id: x.id }))

/** A parsed course, without its text. */
export function trackMeta(track: LearnTrack, file: string): CatalogTrack {
  return {
    file,
    id: track.id,
    lang: track.lang,
    level: track.level,
    title: track.title,
    name: track.name,
    blurb: track.blurb,
    ...(track.plainVoice !== undefined ? { plainVoice: track.plainVoice } : {}),
    ...(track.subject ? { subject: track.subject } : {}),
    ...(track.requires ? { requires: track.requires } : {}),
    ...(track.module ? { module: track.module } : {}),
    lessons: track.lessons.map(
      (l): LessonMeta => ({
        id: l.id,
        title: l.title,
        ...(l.forLesson ? { forLesson: l.forLesson } : {}),
        practice: ids(l.practice),
        ...(l.quiz ? { quiz: ids(l.quiz) } : {}),
        ...(l.gate
          ? {
              gate: {
                pass: l.gate.pass,
                questionPass: l.gate.questionPass,
                minutes: l.gate.minutes,
                problems: ids(l.gate.problems),
                questions: ids(l.gate.questions),
              },
            }
          : {}),
      }),
    ),
  }
}

/**
 * The catalog of every course and module file, from `[file name, text]` pairs.
 * Files come out in file-name order; which courses an app shows, and in what
 * order, is its platform.ts's call. A malformed file throws, naming the lesson
 * at fault, unless `broken` is given: then it is left out and reported there
 * (the dev server and the tests, so one half-saved course does not stop
 * everyone else's work; the full-course tests still fail on it).
 */
export function catalogOf(
  files: { tracks: [string, string][]; modules: [string, string][] },
  broken?: (file: string, err: unknown) => void,
): LearnCatalog {
  const build = (list: [string, string][]) =>
    list
      .slice()
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([file, text]) => {
        try {
          return [trackMeta(parseTrack(text, file), file)]
        } catch (err) {
          if (!broken) throw err
          broken(file, err)
          return []
        }
      })
  return { tracks: build(files.tracks), modules: build(files.modules) }
}
