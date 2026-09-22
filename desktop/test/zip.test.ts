import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crc32 } from '../crc32.js'
import { MAX_TOTAL_UNCOMPRESSED, ZipError, extractZip, readEntries } from '../zip.js'
import {
  encryptedZipWithCli,
  makeTempDir,
  removeDir,
  writeBundleTree,
  zip64WithPython,
  zipEntriesWithPython,
  zipWithCli,
  zipWithPython,
} from './fixtures.ts'

let work: string
let src: string

beforeAll(() => {
  work = makeTempDir('zip')
  src = path.join(work, 'src')
  writeBundleTree(src, { version: '1.2.3', minShell: '1.0.0' })
})

afterAll(() => removeDir(work))

/** Every regular file under `dir`, as archive-style relative paths. */
function listFiles(dir: string, prefix = ''): string[] {
  const out: string[] = []
  for (const d of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${d.name}` : d.name
    if (d.isDirectory()) out.push(...listFiles(path.join(dir, d.name), rel))
    else out.push(rel)
  }
  return out
}

function expectSameTree(a: string, b: string): void {
  const fa = listFiles(a)
  expect(fa).toEqual(listFiles(b))
  for (const rel of fa) {
    expect(readFileSync(path.join(b, rel)).equals(readFileSync(path.join(a, rel))), rel).toBe(true)
  }
}

describe('extractZip with real archives', () => {
  it.each([
    ['python zipfile, deflate', (out: string) => zipWithPython(src, out, 'deflate')],
    ['python zipfile, stored', (out: string) => zipWithPython(src, out, 'store')],
    ['zip CLI (-r -X)', (out: string) => zipWithCli(src, out)],
  ])('round-trips a bundle tree built with %s', async (label, build) => {
    const out = path.join(work, `${label.replace(/[^a-z]+/gi, '-')}.zip`)
    const buf = build(out)
    const dest = path.join(work, `out-${label.replace(/[^a-z]+/gi, '-')}`)
    const result = await extractZip(buf, dest)
    expectSameTree(src, dest)
    expect(result.files).toBe(listFiles(src).length)
    expect(result.bytes).toBe(listFiles(src).reduce((n, f) => n + statSync(path.join(src, f)).size, 0))
    // Directory entries (python emits them explicitly) become real directories.
    expect(statSync(path.join(dest, 'data', 'nested')).isDirectory()).toBe(true)
  })

  it('decodes UTF-8 names and uses both compression methods in the same archive', () => {
    const buf = zipWithCli(src, path.join(work, 'mixed.zip'))
    const entries = readEntries(buf)
    const names = entries.map((e) => e.name)
    expect(names).toContain('data/nested/ünïcödé — file.txt')
    const methods = new Set(entries.filter((e) => !e.isDirectory).map((e) => e.method))
    // zip stores incompressible random bytes and deflates the rest.
    expect(methods).toEqual(new Set([0, 8]))
    for (const e of entries) expect(e.relativePath === null).toBe(e.isDirectory)
  })

  it('creates the destination and intermediate directories on demand', async () => {
    const buf = zipWithPython(src, path.join(work, 'deep.zip'), 'deflate')
    const dest = path.join(work, 'a', 'b', 'c')
    await extractZip(buf, dest)
    expect(existsSync(path.join(dest, 'assets', 'app.js'))).toBe(true)
  })
})

describe('extractZip rejections', () => {
  it.each([
    ['../evil.txt'],
    ['/abs.txt'],
    ['a\\b.txt'],
    ['x/../../y.txt'],
    ['ok/../still-inside-but-rejected.txt'],
    ['C:/windows.txt'],
    ['./dot.txt'],
    ['a//b.txt'],
  ])('refuses the path %s and writes nothing', async (name) => {
    const buf = zipEntriesWithPython(path.join(work, `bad-${Buffer.from(name).toString('hex')}.zip`), [
      ['fine.txt', 'ok'],
      [name, 'evil'],
    ])
    const dest = path.join(work, 'traversal', Buffer.from(name).toString('hex'))
    await expect(extractZip(buf, dest)).rejects.toBeInstanceOf(ZipError)
    expect(existsSync(dest)).toBe(false)
    expect(existsSync(path.join(work, 'traversal', 'evil.txt'))).toBe(false)
    expect(existsSync('/abs.txt')).toBe(false)
  })

  it('rejects an entry name containing NUL', () => {
    // Python's zipfile truncates names at NUL, so patch the byte in place
    // (local header and central directory both carry the name).
    const buf = Buffer.from(zipEntriesWithPython(path.join(work, 'nul.zip'), [['bad_name.txt', 'x']]))
    const needle = Buffer.from('bad_name.txt')
    let hits = 0
    for (let i = buf.indexOf(needle); i !== -1; i = buf.indexOf(needle, i + 1)) {
      buf[i + 3] = 0
      hits++
    }
    expect(hits).toBe(2)
    expect(() => readEntries(buf)).toThrow(/NUL/)
  })

  it('rejects zip64 markers written by python force_zip64', async () => {
    const buf = zip64WithPython(path.join(work, 'zip64.zip'))
    // Sanity: the local header really carries the 0xFFFFFFFF markers.
    expect(buf.readUInt32LE(18)).toBe(0xffffffff)
    expect(buf.readUInt32LE(22)).toBe(0xffffffff)
    await expect(extractZip(buf, path.join(work, 'zip64-out'))).rejects.toThrow(/zip64/)
    expect(existsSync(path.join(work, 'zip64-out', 'big.txt'))).toBe(false)
  })

  it('rejects zip64 end-of-central-directory counts', () => {
    const buf = Buffer.from(zipWithPython(src, path.join(work, 'eocd64.zip'), 'store'))
    const eocd = buf.length - 22
    expect(buf.readUInt32LE(eocd)).toBe(0x06054b50)
    const patched = Buffer.from(buf)
    patched.writeUInt16LE(0xffff, eocd + 8)
    patched.writeUInt16LE(0xffff, eocd + 10)
    expect(() => readEntries(patched)).toThrow(/zip64/)
    const patched2 = Buffer.from(buf)
    patched2.writeUInt32LE(0xffffffff, eocd + 16)
    expect(() => readEntries(patched2)).toThrow(/zip64/)
  })

  it('rejects a zip64 locator before the end record', () => {
    const buf = zipWithPython(src, path.join(work, 'loc64.zip'), 'store')
    const eocd = buf.subarray(buf.length - 22)
    const locator = Buffer.alloc(20)
    locator.writeUInt32LE(0x07064b50, 0)
    const patched = Buffer.concat([buf.subarray(0, buf.length - 22), locator, eocd])
    expect(() => readEntries(patched)).toThrow(/zip64/)
  })

  it('rejects encrypted entries made by the zip CLI', async () => {
    const enc = path.join(work, 'enc')
    writeBundleTree(enc, { version: '0.0.1', minShell: '1.0.0' })
    const buf = encryptedZipWithCli(enc, path.join(work, 'encrypted.zip'))
    await expect(extractZip(buf, path.join(work, 'enc-out'))).rejects.toThrow(/encrypted/)
  })

  it('detects a corrupted deflate stream / CRC mismatch', async () => {
    const buf = Buffer.from(zipWithPython(src, path.join(work, 'corrupt.zip'), 'deflate'))
    const entry = readEntries(buf).find((e) => e.name === 'assets/app.js')!
    const nameLength = buf.readUInt16LE(entry.localOffset + 26)
    const extraLength = buf.readUInt16LE(entry.localOffset + 28)
    const dataStart = entry.localOffset + 30 + nameLength + extraLength
    buf[dataStart + 5] ^= 0xff
    await expect(extractZip(buf, path.join(work, 'corrupt-out'))).rejects.toBeInstanceOf(ZipError)
  })

  it('detects a CRC mismatch on a stored entry', async () => {
    const buf = Buffer.from(zipWithPython(src, path.join(work, 'crc.zip'), 'store'))
    const entry = readEntries(buf).find((e) => e.name === 'assets/style.css')!
    const nameLength = buf.readUInt16LE(entry.localOffset + 26)
    const extraLength = buf.readUInt16LE(entry.localOffset + 28)
    const dataStart = entry.localOffset + 30 + nameLength + extraLength
    buf[dataStart] ^= 0x01
    expect(crc32(buf.subarray(dataStart, dataStart + entry.size))).not.toBe(entry.crc)
    await expect(extractZip(buf, path.join(work, 'crc-out'))).rejects.toThrow(/CRC-32 mismatch/)
  })

  it('rejects sizes that lie in the central directory', () => {
    const buf = Buffer.from(zipWithPython(src, path.join(work, 'lie.zip'), 'deflate'))
    const eocd = buf.length - 22
    const cdOffset = buf.readUInt32LE(eocd + 16)
    // First central entry: bump the uncompressed size field.
    buf.writeUInt32LE(buf.readUInt32LE(cdOffset + 24) + 1, cdOffset + 24)
    const entries = readEntries(buf)
    expect(entries.length).toBeGreaterThan(0)
    return expect(extractZip(buf, path.join(work, 'lie-out'))).rejects.toThrow(/size mismatch|inflate/)
  })

  it('rejects archives that would expand past the total limit', () => {
    const buf = Buffer.from(zipWithPython(src, path.join(work, 'huge.zip'), 'store'))
    const eocd = buf.length - 22
    const cdOffset = buf.readUInt32LE(eocd + 16)
    buf.writeUInt32LE(MAX_TOTAL_UNCOMPRESSED, cdOffset + 24)
    buf.writeUInt32LE(MAX_TOTAL_UNCOMPRESSED, cdOffset + 20)
    expect(() => readEntries(buf)).toThrow(/limit/)
  })

  it('rejects things that are not zip files', () => {
    expect(() => readEntries(Buffer.from('hello'))).toThrow(/too small/)
    expect(() => readEntries(Buffer.alloc(100))).toThrow(/not a zip file/)
    const html = Buffer.from('<!doctype html>'.repeat(20))
    expect(() => readEntries(html)).toThrow(ZipError)
  })

  it('rejects a truncated archive', () => {
    const buf = zipWithPython(src, path.join(work, 'trunc.zip'), 'deflate')
    expect(() => readEntries(buf.subarray(0, buf.length - 3))).toThrow(ZipError)
  })

  it('tolerates an archive comment and finds the real end record', async () => {
    const out = path.join(work, 'comment.zip')
    zipWithPython(src, out, 'store')
    // Append a comment that itself contains the EOCD signature bytes.
    const original = readFileSync(out)
    const comment = Buffer.concat([Buffer.from('comment '), Buffer.from([0x50, 0x4b, 0x05, 0x06]), Buffer.from(' trailing')])
    const patched = Buffer.concat([original, comment])
    patched.writeUInt16LE(comment.length, original.length - 2)
    writeFileSync(out, patched)
    const dest = path.join(work, 'comment-out')
    await extractZip(patched, dest)
    expectSameTree(src, dest)
  })
})
