import { describe, expect, it } from 'vitest'
import { CHANGELOG, notesFor, notesForVersion, parseChangelog } from './changelog'

describe('parsing', () => {
  const md = [
    '# Changelog',
    'A preamble that is not an entry.',
    '',
    '## 1.0.6',
    'Newest.',
    '',
    '## 1.0.5',
    'Older.',
    '',
    '## 1.0.4',
    '',
  ].join('\n')

  it('keeps the entries in file order and drops the preamble', () => {
    expect(parseChangelog(md).map((e) => e.version)).toEqual(['1.0.6', '1.0.5', '1.0.4'])
    expect(notesFor(md, '1.0.6')).toBe('Newest.')
  })

  it('treats an entry with nothing under it as no notes', () => {
    expect(notesFor(md, '1.0.4')).toBeNull()
  })

  it('has no notes for a version that was never written up', () => {
    expect(notesFor(md, '9.9.9')).toBeNull()
  })

  it('ignores a heading that is not a bare version', () => {
    expect(parseChangelog('## Unreleased\nx\n\n## 1.0.0\ny').map((e) => e.version)).toEqual(['1.0.0'])
  })
})

describe('the shipped changelog', () => {
  it('has entries', () => {
    expect(CHANGELOG.length).toBeGreaterThan(0)
  })

  // The release script refuses to publish without an entry for the version it
  // is building, so this failing means the release would have failed anyway —
  // better to hear it here than after the tag is cut.
  it('describes the version this build is', () => {
    expect(notesForVersion(__APP_VERSION__), `no "## ${__APP_VERSION__}" entry in CHANGELOG.md`)
      .toEqual(expect.any(String))
  })

  it('is newest first', () => {
    const rank = (v: string) => v.split('.').map(Number).reduce((a, n) => a * 1000 + n, 0)
    const ranks = CHANGELOG.map((e) => rank(e.version))
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a))
  })
})
