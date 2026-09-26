/* ============================================================================
   Recorded lessons
   ----------------------------------------------------------------------------
   A lesson recorded ahead of time (scripts/recorder/record-lessons.mts) is
   played as an ordinary audio file: the browser streams it, so it costs next
   to no memory and never waits on a model, on a phone as on a computer. Its
   timings file says where every sentence and word falls, for the counter,
   for skipping and for following along.

   A recording is found by the key of the lesson's prepared text, so one is
   only ever played against exactly the words it was made from: an edited
   lesson has a new key, and is read on the device until it is recorded again.
   ========================================================================== */
import { DEFAULT_NATURAL_VOICE, textKey } from './kokoro'
import { RECORDINGS_URL } from './recordings'

export interface RecordedUnit {
  /** The text read, as the app's own units split it. */
  t: string
  /** When it starts and ends in the file, in seconds. */
  s: number
  e: number
  /** Its sentence. */
  n: number
  /** Its words: [start, end, charStart, charEnd], seconds into the file and offsets into `t`. */
  w: [number, number, number, number][]
}

export interface Recording {
  key: string
  voice: string
  duration: number
  units: RecordedUnit[]
  /** The audio file's address. */
  url: string
}

interface Index {
  v: 1
  voice: string
  lessons: Record<string, { mp3: string; json: string; duration: number }>
}

let index: Promise<Index | null> | null = null

function base(): URL | null {
  if (!RECORDINGS_URL || typeof location === 'undefined') return null
  try {
    return new URL(RECORDINGS_URL, location.href)
  } catch {
    return null
  }
}

function loadIndex(): Promise<Index | null> {
  if (index) return index
  const at = base()
  index = at
    ? fetch(new URL('index.json', at), { cache: 'no-cache' })
        .then((r) => (r.ok ? (r.json() as Promise<Index>) : null))
        .then((i) => (i && i.v === 1 && i.lessons ? i : null))
        .catch(() => null)
    : Promise.resolve(null)
  // A failed lookup (offline) is tried again next time rather than remembered.
  void index.then((i) => {
    if (!i) index = null
  })
  return index
}

/** The recording of this exact lesson text in this voice, or null. */
export async function recordingFor(text: string, voice: string = DEFAULT_NATURAL_VOICE): Promise<Recording | null> {
  const idx = await loadIndex()
  const at = base()
  if (!idx || !at || idx.voice !== voice) return null
  const key = textKey(text)
  const entry = idx.lessons[key]
  if (!entry) return null
  try {
    const res = await fetch(new URL(entry.json, at))
    if (!res.ok) return null
    const t = (await res.json()) as { v: number; key: string; voice: string; duration: number; units: RecordedUnit[] }
    if (t.v !== 1 || t.key !== key || !Array.isArray(t.units) || !t.units.length) return null
    return { key, voice: t.voice, duration: t.duration, units: t.units, url: new URL(entry.mp3, at).href }
  } catch {
    return null
  }
}

/** The unit playing at time `t` (seconds into the file): the last one that has started. */
export function unitAt(units: readonly RecordedUnit[], t: number): number {
  let lo = 0
  let hi = units.length - 1
  if (hi < 0 || t < units[0]!.s) return 0
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (units[mid]!.s <= t) lo = mid
    else hi = mid - 1
  }
  return lo
}

/** The word of a unit being spoken at time `t`: the last one that has started, or -1 before the first. */
export function wordAt(unit: RecordedUnit, t: number): number {
  let k = -1
  for (let i = 0; i < unit.w.length; i++) {
    if (unit.w[i]![0] <= t) k = i
    else break
  }
  return k
}
