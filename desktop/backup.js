// The learner's progress, mirrored to a plain JSON file in the app's data
// directory.
//
// IndexedDB inside the shell's profile is the working copy, and it is good
// enough for almost everything. What it does not survive is the profile being
// rebuilt, the storage being evicted, or a partly-written database coming back
// unreadable after a hard power loss. Those are exactly the cases where
// someone an hour into a module loses the hour, which is the failure this file
// exists to prevent.
//
// Two rules make it trustworthy:
//
//   - The write is atomic. Content goes to a temp file in the same directory,
//     is flushed to the platter with fsync, and is then renamed over the
//     target. rename(2) within a filesystem is atomic, so a crash mid-write
//     leaves either the whole old file or the whole new one — never a
//     half-written file that parses as an empty collection.
//   - The previous copy is kept as `.prev`. If the newest file is somehow
//     unreadable, there is still one good generation behind it.
import fs from 'node:fs'
import path from 'node:path'
import { userDataDir } from './paths.js'

/** Refuse anything absurd rather than filling the disk. */
const MAX_BYTES = 32 * 1024 * 1024

export function backupFile() {
  return path.join(userDataDir(), 'progress.json')
}

function previousFile() {
  return `${backupFile()}.prev`
}

/**
 * Writes the mirror atomically. Never throws: a failed mirror must not break
 * the app, because the working copy in IndexedDB is still there.
 * @param {unknown} json the serialised state
 * @param {(...args: unknown[]) => void} log
 * @returns {boolean} whether the file was written
 */
export function writeBackup(json, log = () => {}) {
  if (typeof json !== 'string' || json.length === 0 || json.length > MAX_BYTES) return false

  const target = backupFile()
  const tmp = `${target}.${process.pid}.tmp`
  let fd
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fd = fs.openSync(tmp, 'w')
    fs.writeFileSync(fd, json, 'utf8')
    // Without the fsync the rename can land before the bytes do, which on a
    // power cut gives a correctly-named empty file — the worst outcome.
    fs.fsyncSync(fd)
    fs.closeSync(fd)
    fd = undefined

    try {
      if (fs.existsSync(target)) fs.copyFileSync(target, previousFile())
    } catch {
      // A missing previous generation is not a reason to skip the write.
    }

    fs.renameSync(tmp, target)
    return true
  } catch (err) {
    log('backup write failed:', err instanceof Error ? err.message : String(err))
    try {
      if (fd !== undefined) fs.closeSync(fd)
      fs.rmSync(tmp, { force: true })
    } catch {
      /* nothing further to do */
    }
    return false
  }
}

/**
 * Reads the mirror back, falling back to the previous generation.
 * @returns {string | null} the stored JSON, or null when there is none
 */
export function readBackup(log = () => {}) {
  for (const file of [backupFile(), previousFile()]) {
    try {
      if (!fs.existsSync(file)) continue
      const text = fs.readFileSync(file, 'utf8')
      if (!text) continue
      // Parse before handing it over so a truncated file is skipped here
      // rather than looking like a valid-but-empty collection upstream.
      JSON.parse(text)
      return text
    } catch (err) {
      log('backup read failed:', file, err instanceof Error ? err.message : String(err))
    }
  }
  return null
}
