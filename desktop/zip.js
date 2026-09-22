// Dependency-free zip reader for the curriculum bundle. It reads the central
// directory (the only authoritative listing), supports stored and deflated
// entries, and refuses anything the bundle build never produces: zip64,
// encryption, absolute or escaping paths, oversized archives.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { crc32 } from './crc32.js'

const SIG_EOCD = 0x06054b50
const SIG_ZIP64_LOCATOR = 0x07064b50
const SIG_CENTRAL = 0x02014b50
const SIG_LOCAL = 0x04034b50

const EOCD_SIZE = 22
const CENTRAL_SIZE = 46
const LOCAL_SIZE = 30
const MAX_COMMENT = 0xffff

const METHOD_STORE = 0
const METHOD_DEFLATE = 8
// Bit 0: traditional PKWARE encryption; bit 6: strong encryption.
const FLAG_ENCRYPTED = 0x0001 | 0x0040
const ZIP64_EXTRA_ID = 0x0001
const ZIP64_MARK32 = 0xffffffff
const ZIP64_MARK16 = 0xffff

export const MAX_ENTRIES = 20_000
export const MAX_TOTAL_UNCOMPRESSED = 512 * 1024 * 1024

export class ZipError extends Error {
  name = 'ZipError'
}

/**
 * @typedef {object} ZipEntry
 * @property {string} name raw name as stored (UTF-8 decoded)
 * @property {string | null} relativePath validated destination path relative to destDir, or null for directories
 * @property {boolean} isDirectory
 * @property {number} method
 * @property {number} flags
 * @property {number} crc
 * @property {number} compressedSize
 * @property {number} size
 * @property {number} localOffset
 */

/**
 * @param {Buffer} buf
 * @returns {number} offset of the end-of-central-directory record
 */
function findEocd(buf) {
  const lowest = Math.max(0, buf.length - EOCD_SIZE - MAX_COMMENT)
  for (let pos = buf.length - EOCD_SIZE; pos >= lowest; pos--) {
    if (buf.readUInt32LE(pos) !== SIG_EOCD) continue
    // A genuine record's comment runs exactly to the end of the file; the
    // signature can also appear by chance inside a comment or file data.
    const commentLength = buf.readUInt16LE(pos + 20)
    if (pos + EOCD_SIZE + commentLength === buf.length) return pos
  }
  throw new ZipError('not a zip file (end of central directory record not found)')
}

/**
 * @param {Buffer} extra
 * @returns {boolean} whether a zip64 extended-information field is present
 */
function hasZip64Extra(extra) {
  let p = 0
  while (p + 4 <= extra.length) {
    const id = extra.readUInt16LE(p)
    const size = extra.readUInt16LE(p + 2)
    if (id === ZIP64_EXTRA_ID) return true
    p += 4 + size
  }
  return false
}

/**
 * Validates an entry name and returns it as a path relative to the
 * extraction root, or throws.
 * @param {string} name
 * @returns {string}
 */
function safeRelativePath(name) {
  if (name.length === 0) throw new ZipError('entry with an empty name')
  if (name.includes('\0')) throw new ZipError(`entry name contains a NUL byte: ${JSON.stringify(name)}`)
  if (name.includes('\\')) throw new ZipError(`entry name contains a backslash: ${JSON.stringify(name)}`)
  if (name.startsWith('/')) throw new ZipError(`absolute entry path: ${JSON.stringify(name)}`)
  if (/^[A-Za-z]:/.test(name)) throw new ZipError(`drive-letter entry path: ${JSON.stringify(name)}`)
  const segments = name.endsWith('/') ? name.slice(0, -1).split('/') : name.split('/')
  for (const segment of segments) {
    if (segment === '' || segment === '.' || segment === '..') {
      throw new ZipError(`unsafe entry path: ${JSON.stringify(name)}`)
    }
  }
  return segments.join(path.sep)
}

/**
 * Parses the central directory. Throws ZipError on any structural problem or
 * unsupported feature; never touches the entry data.
 * @param {Buffer} buf
 * @returns {ZipEntry[]}
 */
export function readEntries(buf) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('readEntries: expected a Buffer')
  if (buf.length < EOCD_SIZE) throw new ZipError('not a zip file (too small)')
  const eocd = findEocd(buf)

  if (eocd >= 20 && buf.readUInt32LE(eocd - 20) === SIG_ZIP64_LOCATOR) {
    throw new ZipError('zip64 archives are not supported')
  }
  const diskNumber = buf.readUInt16LE(eocd + 4)
  const centralDisk = buf.readUInt16LE(eocd + 6)
  const entriesOnDisk = buf.readUInt16LE(eocd + 8)
  const totalEntries = buf.readUInt16LE(eocd + 10)
  const centralSize = buf.readUInt32LE(eocd + 12)
  const centralOffset = buf.readUInt32LE(eocd + 16)

  if (
    totalEntries === ZIP64_MARK16 ||
    entriesOnDisk === ZIP64_MARK16 ||
    centralSize === ZIP64_MARK32 ||
    centralOffset === ZIP64_MARK32
  ) {
    throw new ZipError('zip64 archives are not supported')
  }
  if (diskNumber !== 0 || centralDisk !== 0) throw new ZipError('multi-disk archives are not supported')
  if (entriesOnDisk !== totalEntries) throw new ZipError('inconsistent entry counts')
  if (totalEntries > MAX_ENTRIES) throw new ZipError(`too many entries (${totalEntries} > ${MAX_ENTRIES})`)
  const centralEnd = centralOffset + centralSize
  if (centralEnd > eocd) throw new ZipError('central directory extends past its end record')

  /** @type {ZipEntry[]} */
  const entries = []
  let totalUncompressed = 0
  let p = centralOffset
  for (let i = 0; i < totalEntries; i++) {
    if (p + CENTRAL_SIZE > centralEnd) throw new ZipError('truncated central directory')
    if (buf.readUInt32LE(p) !== SIG_CENTRAL) throw new ZipError('bad central directory header signature')
    const flags = buf.readUInt16LE(p + 8)
    const method = buf.readUInt16LE(p + 10)
    const crc = buf.readUInt32LE(p + 16)
    const compressedSize = buf.readUInt32LE(p + 20)
    const size = buf.readUInt32LE(p + 24)
    const nameLength = buf.readUInt16LE(p + 28)
    const extraLength = buf.readUInt16LE(p + 30)
    const commentLength = buf.readUInt16LE(p + 32)
    const diskStart = buf.readUInt16LE(p + 34)
    const localOffset = buf.readUInt32LE(p + 42)
    const headerEnd = p + CENTRAL_SIZE + nameLength + extraLength + commentLength
    if (headerEnd > centralEnd) throw new ZipError('truncated central directory')

    const name = buf.toString('utf8', p + CENTRAL_SIZE, p + CENTRAL_SIZE + nameLength)
    const extra = buf.subarray(p + CENTRAL_SIZE + nameLength, p + CENTRAL_SIZE + nameLength + extraLength)
    const label = JSON.stringify(name)

    if (
      compressedSize === ZIP64_MARK32 ||
      size === ZIP64_MARK32 ||
      localOffset === ZIP64_MARK32 ||
      diskStart === ZIP64_MARK16 ||
      hasZip64Extra(extra)
    ) {
      throw new ZipError(`zip64 entry is not supported: ${label}`)
    }
    if (diskStart !== 0) throw new ZipError(`multi-disk entry is not supported: ${label}`)
    if (flags & FLAG_ENCRYPTED) throw new ZipError(`encrypted entry is not supported: ${label}`)
    if (method !== METHOD_STORE && method !== METHOD_DEFLATE) {
      throw new ZipError(`unsupported compression method ${method}: ${label}`)
    }
    if (method === METHOD_STORE && compressedSize !== size) {
      throw new ZipError(`stored entry has mismatched sizes: ${label}`)
    }
    if (localOffset + LOCAL_SIZE > centralOffset) throw new ZipError(`local header out of range: ${label}`)

    const isDirectory = name.endsWith('/')
    const relativePath = safeRelativePath(name)
    if (isDirectory && (size !== 0 || compressedSize !== 0)) {
      throw new ZipError(`directory entry with data: ${label}`)
    }
    totalUncompressed += size
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
      throw new ZipError(`archive expands past the ${MAX_TOTAL_UNCOMPRESSED} byte limit`)
    }

    entries.push({
      name,
      relativePath: isDirectory ? null : relativePath,
      isDirectory,
      method,
      flags,
      crc,
      compressedSize,
      size,
      localOffset,
    })
    p = headerEnd
  }
  if (p !== centralEnd) throw new ZipError('central directory size does not match its entries')
  return entries
}

/**
 * Returns the entry's file bytes, verified against the central directory's
 * size and CRC-32.
 * @param {Buffer} buf
 * @param {ZipEntry} entry
 * @returns {Buffer}
 */
function readEntryData(buf, entry) {
  const label = JSON.stringify(entry.name)
  const h = entry.localOffset
  if (h + LOCAL_SIZE > buf.length) throw new ZipError(`truncated local header: ${label}`)
  if (buf.readUInt32LE(h) !== SIG_LOCAL) throw new ZipError(`bad local header signature: ${label}`)
  const localFlags = buf.readUInt16LE(h + 6)
  const localCompressed = buf.readUInt32LE(h + 18)
  const localSize = buf.readUInt32LE(h + 22)
  const nameLength = buf.readUInt16LE(h + 26)
  const extraLength = buf.readUInt16LE(h + 28)
  if (localFlags & FLAG_ENCRYPTED) throw new ZipError(`encrypted entry is not supported: ${label}`)
  if (localCompressed === ZIP64_MARK32 || localSize === ZIP64_MARK32) {
    throw new ZipError(`zip64 entry is not supported: ${label}`)
  }
  const extraStart = h + LOCAL_SIZE + nameLength
  const dataStart = extraStart + extraLength
  if (dataStart > buf.length) throw new ZipError(`truncated local header: ${label}`)
  if (hasZip64Extra(buf.subarray(extraStart, dataStart))) {
    throw new ZipError(`zip64 entry is not supported: ${label}`)
  }
  const dataEnd = dataStart + entry.compressedSize
  if (dataEnd > buf.length) throw new ZipError(`entry data runs past end of archive: ${label}`)
  const raw = buf.subarray(dataStart, dataEnd)

  let data
  if (entry.method === METHOD_STORE) {
    data = raw
  } else {
    try {
      // maxOutputLength caps a decompression bomb before we compare lengths.
      data = zlib.inflateRawSync(raw, { maxOutputLength: Math.max(entry.size, 1) })
    } catch (err) {
      throw new ZipError(`could not inflate ${label}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  if (data.length !== entry.size) {
    throw new ZipError(`size mismatch for ${label}: expected ${entry.size}, got ${data.length}`)
  }
  const actual = crc32(data)
  if (actual !== entry.crc) {
    throw new ZipError(`CRC-32 mismatch for ${label}: expected ${entry.crc.toString(16)}, got ${actual.toString(16)}`)
  }
  return data
}

/**
 * Extracts every entry of `buffer` under `destDir`. The whole central
 * directory is validated before any file is written, so an archive that is
 * rejected for structure or path reasons leaves the destination untouched
 * (a CRC/size failure mid-way can leave earlier files; callers extract into
 * a scratch directory and rename on success).
 * @param {Buffer} buffer
 * @param {string} destDir
 * @returns {Promise<{ files: number, bytes: number }>}
 */
export async function extractZip(buffer, destDir) {
  if (typeof destDir !== 'string' || destDir.length === 0) throw new TypeError('extractZip: destDir is required')
  const entries = readEntries(buffer)
  const root = path.resolve(destDir)
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep

  /** @param {string} relativePath */
  const target = (relativePath) => {
    const full = path.resolve(root, relativePath)
    if (!full.startsWith(rootPrefix)) throw new ZipError(`entry escapes destination: ${JSON.stringify(relativePath)}`)
    return full
  }

  await fs.mkdir(root, { recursive: true })
  let files = 0
  let bytes = 0
  for (const entry of entries) {
    if (entry.isDirectory) {
      const dirPath = safeRelativePath(entry.name)
      await fs.mkdir(target(dirPath), { recursive: true })
      continue
    }
    const full = target(/** @type {string} */ (entry.relativePath))
    const data = readEntryData(buffer, entry)
    await fs.mkdir(path.dirname(full), { recursive: true })
    await fs.writeFile(full, data)
    files++
    bytes += data.length
  }
  return { files, bytes }
}
