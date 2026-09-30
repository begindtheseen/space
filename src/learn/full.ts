/* ============================================================================
   Learn mode — every course in full, for the tests only
   ----------------------------------------------------------------------------
   The app never holds every course's text at once: it starts from the catalog
   (catalogOf.ts) and loads a course when it is opened (load.ts). The tests
   that check what is inside the courses (every lesson well formed, every
   problem solvable) need all of it, so they read it here, eagerly, in the
   same order the app shows the courses.

   Test files only. An app import would put every course back into the
   startup bundle; learn.test.ts fails if anything outside a test imports it.
   ========================================================================== */
import { parseTrack } from './parse'
import { taughtCourses } from './platform'
import type { LearnTrack } from './types'

const COURSES = import.meta.glob('./tracks/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const MODULE_FILES = import.meta.glob('./modules/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const named = (files: Record<string, string>): [string, string][] => Object.entries(files).map(([path, text]) => [path.split('/').pop()!, text])

/** Every course this app offers, in full, in the order a beginner should meet them. */
export const TRACKS: LearnTrack[] = taughtCourses(named(COURSES), ([file]) => file).map(([file, text]) => parseTrack(text, file))

/** Every module practice file, in full. */
export const MODULE_TRACKS: LearnTrack[] = named(MODULE_FILES)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, text]) => parseTrack(text, file))
