import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TRACKS } from '@/learn/full'
import { LearnerProvider } from '@/hooks/useLearner'
import { Markdown } from '@/lib/markdown'
import { prepare, toUtterances } from '@/lib/speech'
import { speechUnits, textWords } from './kokoro'
import { alignNorms, normWord, placeNorms, seekNorms } from './highlight'

/** The page's words as the highlighter sees them: skipped elements left out (highlight.ts SKIP). */
function pageNorms(html: string): string[] {
  let s = html
  for (const tag of ['pre', 'button', 'script', 'style', 'math']) s = s.replace(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, 'g'), ' ')
  s = s.replace(/<[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/[a-z]+>/g, ' ')
  s = s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ')
  return textWords(s).map((w) => normWord(s.slice(w.start, w.end))).filter(Boolean)
}

/** What the voice says, sentence by sentence, as the matcher sees it. */
function spokenUnits(md: string): string[][] {
  const { text } = prepare(md)
  return speechUnits(text, (p) => toUtterances(p, 100_000), 200).map((u) => textWords(u.text).map((w) => normWord(u.text.slice(w.start, w.end))))
}

/** The matching before this change: each word to the next page word that reads the same, within 40. */
function greedy(page: readonly string[], spoken: readonly string[], from: number): Int32Array {
  const out = new Int32Array(spoken.length).fill(-1)
  let at = from
  spoken.forEach((norm, k) => {
    if (!norm) return
    for (let i = at; i < Math.min(page.length, at + 40); i++)
      if (page[i] === norm) {
        out[k] = i
        at = i + 1
        return
      }
  })
  return out
}

/** Reads a lesson the way the player does and says how well the light followed. */
function follow(page: string[], units: string[][], place: (p: string[], s: string[], from: number) => Int32Array) {
  let pos = -1
  let words = 0
  let matched = 0
  let jumps = 0
  let last = -1
  for (const u of units) {
    const at = place(page, u, pos < 0 ? seekNorms(page, u, 0) : pos)
    for (const i of at) {
      if (i < 0) continue
      if (last >= 0 && i - last > 25) jumps++
      last = i
      pos = i + 1
    }
    words += u.filter(Boolean).length
    matched += [...at].filter((i) => i >= 0).length
  }
  return { words, matched, jumps }
}

function lessons(): { id: string; md: string }[] {
  const out = TRACKS.flatMap((t) => t.lessons.filter((l) => !l.gate).map((l) => ({ id: l.id, md: l.teach })))
  const root = join(process.cwd(), 'src/curriculum/lessons')
  for (const dir of readdirSync(root, { withFileTypes: true }))
    if (dir.isDirectory())
      for (const f of readdirSync(join(root, dir.name)))
        if (f.endsWith('.md')) out.push({ id: `${dir.name}/${f}`, md: readFileSync(join(root, dir.name, f), 'utf8').replace(/^---[\s\S]*?---\n/, '') })
  return out
}

describe('following along: the word lit is the word being said', () => {
  it('a word said but not shown (a code block, a number read out) does not throw the light ahead', () => {
    const page = 'print shows text on the screen here is an example of the code in a window you can run it then carry on reading'.split(' ')
    // The reading says "Code block." where the page shows the example; the page's own "code" is further on.
    const spoken = ['print', 'shows', 'text', 'on', 'the', 'screen', 'code', 'block', 'here', 'is', 'an', 'example']
    const at = alignNorms(page, spoken, 0)
    expect([...at]).toEqual([0, 1, 2, 3, 4, 5, -1, -1, 6, 7, 8, 9])
  })

  it('a sentence that cannot be placed leaves the place where it was, and the next one picks it up', () => {
    const page = 'first sentence here then the second one follows and a third'.split(' ')
    expect([...alignNorms(page, ['code', 'block'], 3)]).toEqual([-1, -1])
    expect([...placeNorms(page, ['then', 'the', 'second', 'one'], 3)]).toEqual([3, 4, 5, 6])
  })

  it('after a long stretch that is not read, the next sentence is found again', () => {
    const page = [...'we start here'.split(' '), ...Array.from({ length: 150 }, (_, i) => `label${i}`), ...'and the reading carries on from here'.split(' ')]
    const at = placeNorms(page, ['and', 'the', 'reading', 'carries', 'on'], 3)
    expect([...at]).toEqual([153, 154, 155, 156, 157])
  })

  it('across every lesson, the light jumps ahead far less often than it did, and matches as many words', () => {
    let before = { words: 0, matched: 0, jumps: 0 }
    let after = { words: 0, matched: 0, jumps: 0 }
    for (const { md } of lessons()) {
      const page = pageNorms(renderToStaticMarkup(<LearnerProvider><Markdown notes>{md}</Markdown></LearnerProvider>))
      const units = spokenUnits(md)
      const b = follow(page, units, greedy)
      const a = follow(page, units, placeNorms)
      before = { words: before.words + b.words, matched: before.matched + b.matched, jumps: before.jumps + b.jumps }
      after = { words: after.words + a.words, matched: after.matched + a.matched, jumps: after.jumps + a.jumps }
    }
    expect(after.jumps).toBeLessThan(before.jumps / 4)
    expect(after.matched / after.words).toBeGreaterThan(before.matched / before.words - 0.01)
  }, 300_000)
})
