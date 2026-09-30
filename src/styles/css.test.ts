/* The stylesheets, checked for a trap in how they are minified. */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? cssFiles(join(dir, d.name)) : d.name.endsWith('.css') ? [join(dir, d.name)] : []))
}

describe('stylesheets', () => {
  // The minifier treats the two spellings as one property and keeps the last: written standard first, only
  // the Safari spelling survived, and the desktop app (Chromium) drew frosted glass with no blur at all.
  it('write -webkit-backdrop-filter before backdrop-filter, never after', () => {
    const wrong = cssFiles(join(process.cwd(), 'src')).filter((f) => /^\s*backdrop-filter:[^;]*;\s*\n\s*-webkit-backdrop-filter:/m.test(readFileSync(f, 'utf8')))
    expect(wrong).toEqual([])
  })
})
