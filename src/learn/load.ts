/* ============================================================================
   Learn mode — a course's text, loaded when it is opened
   ----------------------------------------------------------------------------
   The app starts with the catalog only (catalogOf.ts): enough to count
   progress, draw roadmaps and work out locks and credit. The text of a course
   (teach, tasks, starters, checks, practice, gates) is megabytes per course,
   so each file is its own chunk, fetched and parsed the first time something
   opens it, then kept. A course is found by its id, a module's practice and
   test file by the module's id; both come from the catalog, so any file in
   the folders is loadable with no list kept by hand.
   ========================================================================== */
import { useEffect, useState } from 'react'
import CATALOG from 'virtual:learn-catalog'
import { parseTrack } from './parse'
import type { LearnTrack } from './types'

/** Every course and module file, each fetched only when asked for. */
const TEXT = import.meta.glob(['./tracks/*.txt', './modules/*.txt'], { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>

const COURSE_PATH = new Map(CATALOG.tracks.map((t) => [t.id, `./tracks/${t.file}`]))
const MODULE_PATH = new Map(CATALOG.modules.map((t) => [t.module ?? '', `./modules/${t.file}`]))

const loaded = new Map<string, LearnTrack>()
const pending = new Map<string, Promise<LearnTrack>>()

function load(path: string | undefined, what: string): Promise<LearnTrack> {
  if (!path || !TEXT[path]) return Promise.reject(new Error(`There is no ${what}.`))
  const done = loaded.get(path)
  if (done) return Promise.resolve(done)
  let p = pending.get(path)
  if (!p) {
    p = TEXT[path]()
      .then((text) => {
        const track = parseTrack(text, path.split('/').pop())
        loaded.set(path, track)
        return track
      })
      .finally(() => pending.delete(path))
    pending.set(path, p)
  }
  return p
}

/** A course's full text, by its id: fetched and parsed once, then kept. */
export function loadTrack(id: string): Promise<LearnTrack> {
  return load(COURSE_PATH.get(id), `course "${id}"`)
}

/** A module's practice sets and test in full, by the module's id. */
export function loadModuleTrack(moduleId: string): Promise<LearnTrack> {
  return load(MODULE_PATH.get(moduleId), `practice file for module "${moduleId}"`)
}

/** What a page has of a course while it loads: the course, or the error that stopped it, or neither yet. */
export type TrackLoad = { track: LearnTrack; error?: undefined } | { track?: undefined; error?: Error }

function useLoad(path: string | undefined, what: string): TrackLoad {
  const [, bump] = useState(0)
  const [failed, setFailed] = useState<{ path: string; error: Error } | null>(null)
  const track = path ? loaded.get(path) : undefined
  useEffect(() => {
    if (!path || loaded.has(path)) return
    let live = true
    load(path, what).then(
      () => live && bump((n) => n + 1),
      (err: unknown) => live && setFailed({ path, error: err instanceof Error ? err : new Error(String(err)) }),
    )
    return () => {
      live = false
    }
  }, [path, what])
  if (track) return { track }
  if (!path) return { error: new Error(`There is no ${what}.`) }
  return failed?.path === path ? { error: failed.error } : {}
}

/** A course's full text for a page: loads it the first time, and draws at once after that. */
export function useTrack(id: string | undefined): TrackLoad {
  return useLoad(id ? COURSE_PATH.get(id) : undefined, `course "${id}"`)
}

/** A module's practice sets and test in full, for a page. */
export function useModuleTrack(moduleId: string | undefined): TrackLoad {
  return useLoad(moduleId ? MODULE_PATH.get(moduleId) : undefined, `practice file for module "${moduleId}"`)
}
