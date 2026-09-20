/* ============================================================================
   ORBIT — persistence
   ----------------------------------------------------------------------------
   Local-first, no account, no server. Everything the learner does lives in
   IndexedDB on the device they did it on.

   That is a real trade-off and the product should be honest about it: clearing
   site data loses the collection. So export is a first-class action, not a
   buried one, and the app asks for persistent storage up front rather than
   leaving the origin evictable under pressure.

   IndexedDB with a localStorage fallback — Safari private mode and some
   embedded webviews refuse to open a database at all, and losing a session is
   better than failing to start.
   ========================================================================== */
import { migrateState, newLearnerState, type LearnerState } from './state'

const DB_NAME = 'orbit'
const DB_VERSION = 1
const STORE = 'state'
const KEY = 'learner'
const LS_KEY = 'orbit_state_v1'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    let settled = false
    const done = (v: IDBDatabase | null) => {
      if (settled) return
      settled = true
      resolve(v)
    }

    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      req.onsuccess = () => done(req.result)
      req.onerror = () => done(null)
      req.onblocked = () => done(null)
      // Private-mode Safari can hang rather than error.
      setTimeout(() => done(null), 3000)
    } catch {
      done(null)
    }
  })
  return dbPromise
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  if (!db) return undefined
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result as T | undefined)
      req.onerror = () => resolve(undefined)
    } catch {
      resolve(undefined)
    }
  })
}

async function idbSet(key: string, value: unknown): Promise<boolean> {
  const db = await openDb()
  if (!db) return false
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(value, key)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
      tx.onabort = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export async function loadState(): Promise<LearnerState> {
  const fromIdb = await idbGet<unknown>(KEY)
  if (fromIdb) return migrateState(fromIdb)

  // Fall back to localStorage, and migrate it into IndexedDB if that works.
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = migrateState(JSON.parse(raw))
      void idbSet(KEY, parsed)
      return parsed
    }
  } catch {
    /* storage disabled — start fresh */
  }

  return newLearnerState()
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
let pending: LearnerState | null = null

/**
 * Debounced write. Study sessions fire a state change per graded item, and
 * writing the whole collection on every keystroke-speed event is what makes
 * local-first apps feel sluggish.
 */
export function saveState(state: LearnerState, delay = 400): void {
  pending = state
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    const s = pending
    pending = null
    if (s) void writeNow(s)
  }, delay)
}

/** Forces any pending write out immediately — used on pagehide. */
export async function flushState(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  const s = pending
  pending = null
  if (s) await writeNow(s)
}

async function writeNow(state: LearnerState): Promise<void> {
  const ok = await idbSet(KEY, state)
  if (!ok) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state))
    } catch {
      /* quota or disabled — nothing more we can do silently */
    }
  }
}

/**
 * Asks the browser to make this origin's storage persistent so it is not
 * evicted under disk pressure. Chrome grants it silently on engaged origins;
 * Safari ignores it. Worth asking regardless — the downside is nothing.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export interface StorageEstimate {
  usedBytes: number
  quotaBytes: number
  persisted: boolean
}

export async function storageEstimate(): Promise<StorageEstimate | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const e = await navigator.storage.estimate()
    return {
      usedBytes: e.usage ?? 0,
      quotaBytes: e.quota ?? 0,
      persisted: (await navigator.storage.persisted?.()) ?? false,
    }
  } catch {
    return null
  }
}

/* ── Backup ──────────────────────────────────────────────────────────────── */

export interface BackupFile {
  app: 'orbit'
  version: number
  exportedAt: string
  state: LearnerState
}

export function makeBackup(state: LearnerState): BackupFile {
  return { app: 'orbit', version: state.version, exportedAt: new Date().toISOString(), state }
}

export function downloadBackup(state: LearnerState): void {
  const blob = new Blob([JSON.stringify(makeBackup(state), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type RestoreResult =
  | { ok: true; state: LearnerState }
  | { ok: false; error: string }

/**
 * Parses a backup file. Everything goes through `migrateState`, so a malformed
 * or hostile file cannot put invalid values into the engine — the worst it can
 * do is restore an empty collection.
 */
export function parseBackup(text: string): RestoreResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'That file does not contain a backup.' }
  }

  const body = parsed as Partial<BackupFile>
  const raw = body.app === 'orbit' && body.state ? body.state : parsed
  const state = migrateState(raw)

  const itemCount = Object.keys(state.items).length
  const topicCount = Object.keys(state.topics).length
  if (itemCount === 0 && topicCount === 0 && state.attempts.length === 0) {
    return { ok: false, error: 'That backup is empty — nothing to restore.' }
  }

  return { ok: true, state }
}

/** Wipes everything. The caller is responsible for confirming first. */
export async function clearAll(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  pending = null

  const db = await openDb()
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).delete(KEY)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    /* ignore */
  }
}
