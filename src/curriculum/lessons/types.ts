/** Lesson metadata as carried on a Module; the body is loaded on demand. */
export interface LessonMeta {
  id: string
  title: string
  minutes: number
  /** The module topic strings this lesson teaches, verbatim. */
  covers: string[]
  /** Path under src/curriculum/lessons/, e.g. "t0_m01_algebra_precalc/01-functions.md". */
  file: string
}
