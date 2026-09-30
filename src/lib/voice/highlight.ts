/* ============================================================================
   Following along: the word being read, lit up in the lesson
   ----------------------------------------------------------------------------
   The voice knows when every word of what it says starts and ends (the model's
   durations, see kokoro.ts wordTimes). This ties those words to the words on
   the page, so the one being spoken can be lit up and scrolled back to.

   What is spoken and what is shown are not the same text: code blocks and
   equations are left out of the reading (a code block is passed over in silence),
   headings and list markers are reshaped, numbers are read out, and the
   reading has its own full stops. So each spoken sentence is lined up with
   the page as a whole (alignNorms): as many of its words matched, in order, as
   can be without skipping far ahead on the page to do it. Matching each word
   greedily to the next page word that read the same once let one common word
   with no partner on the page ("code", "the") jump the light dozens of words
   ahead, where it stayed lost. A spoken word with no match simply lights
   nothing, and a sentence that cannot be placed leaves the place unchanged.

   The light is a CSS Custom Highlight (CSS.highlights): a Range painted by the
   browser, with no change to the lesson's markup at all — nothing to undo,
   and nothing that could disturb selection, links or the reading-progress bar.
   Where the browser has no Highlight API the words are still tracked, so
   "back to the word" still works; it just is not painted.
   ========================================================================== */
import { textWords } from './kokoro'

/**
 * Elements whose text is never read aloud. Code blocks (pre) and code windows are not read,
 * but inline code is read out (lib/speech.ts codeToWords), so its words can be lit too.
 */
const SKIP = 'pre, .katex, .katex-display, math, script, style, button, [aria-hidden="true"], .raloud, .runnable, .embed'

/** A word as the matcher sees it: letters and digits only, lower case. */
export const normWord = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

interface PageWord {
  norm: string
  node: Text
  start: number
  end: number
}

/** Score for each spoken word matched to a page word. */
const MATCH = 1
/** Cost of each page word skipped between two matched words of a sentence. */
const GAP = 0.2
/** Cost of each page word skipped before a sentence's first matched word (text not read, such as a label). */
const LEAD = 0.03

/**
 * Lines up a spoken sentence (`spoken`, as normWord gives) with the page's words
 * (`page`) from `from` on: the page word each spoken word lands on, or -1. It is
 * the in-order matching that scores best, a point per match less the page words
 * it skips to get them, so a lone word matching far ahead is never worth the jump.
 * A sentence it can place only on one word after skipping ahead lands nowhere.
 */
export function alignNorms(page: readonly string[], spoken: readonly string[], from: number): Int32Array {
  const n = spoken.length
  const out = new Int32Array(n).fill(-1)
  const width = Math.min(page.length - from, Math.max(80, n * 3 + 40))
  if (n === 0 || width <= 0) return out
  // score[j]: the best score so far with the last match at page word from + j.
  let score = new Float64Array(width).fill(-Infinity)
  // prev[k][j]: where the match before it was (-1: none) if spoken word k matched page word j, else -2.
  const prev: Int32Array[] = []
  for (let k = 0; k < n; k++) {
    const mark = new Int32Array(width).fill(-2)
    prev.push(mark)
    const norm = spoken[k]
    if (!norm) continue
    const next = score.slice() // not matching this word keeps every place reached so far
    // The best earlier match to come from, as page word j moves on: score + GAP·i, so the gap cost is one subtraction.
    let run = -Infinity
    let runAt = -1
    for (let j = 0; j < width; j++) {
      if (page[from + j] === norm) {
        let best = -LEAD * j
        let at = -1
        if (runAt >= 0 && run - GAP * (j - 1) > best) {
          best = run - GAP * (j - 1)
          at = runAt
        }
        if (best + MATCH > next[j]!) {
          next[j] = best + MATCH
          mark[j] = at
        }
      }
      if (score[j]! + GAP * j > run) {
        run = score[j]! + GAP * j
        runAt = j
      }
    }
    score = next
  }
  let j = -1
  let top = 0
  for (let i = 0; i < width; i++) if (score[i]! > top) (top = score[i]!), (j = i)
  let matched = 0
  for (let k = n - 1; k >= 0 && j >= 0; k--) {
    const m = prev[k]![j]!
    if (m === -2) continue
    out[k] = from + j
    matched++
    j = m
  }
  // One word found only after skipping ahead is a guess, not a place.
  const first = out.find((i) => i >= 0) ?? -1
  if (matched === 1 && first - from > 3) out.fill(-1)
  return out
}

/**
 * Where a run of spoken words begins on the page, searching from `from`: the
 * first place where most of its first few words match in order.
 */
export function seekNorms(page: readonly string[], spoken: readonly string[], from = 0): number {
  const probe = spoken.filter(Boolean).slice(0, 4)
  if (!probe.length) return from
  let best = from
  let bestScore = 0
  for (let i = from; i < page.length; i++) {
    if (page[i] !== probe[0]) continue
    let score = 1
    let j = i + 1
    for (let k = 1; k < probe.length && j < page.length; k++) {
      const hit = page.slice(j, j + 3).findIndex((w) => w === probe[k])
      if (hit >= 0) {
        score++
        j += hit + 1
      }
    }
    if (score > bestScore) {
      best = i
      bestScore = score
      if (score === probe.length) break
    }
  }
  return best
}

/**
 * Places a spoken sentence on the page after `from`, the way the reader goes: aligned from
 * where the last one ended, or, when it cannot be placed there (a long stretch of text that is
 * not read came between), from where its opening words are found further on.
 */
export function placeNorms(page: readonly string[], spoken: readonly string[], from: number): Int32Array {
  const here = alignNorms(page, spoken, from)
  if (here.some((i) => i >= 0) || spoken.filter(Boolean).length < 3) return here
  const found = seekNorms(page, spoken, from)
  return found > from ? alignNorms(page, spoken, found) : here
}

export class PageWords {
  readonly words: PageWord[] = []

  constructor(root: Element) {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => ((n.parentElement?.closest(SKIP) ?? null) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    })
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      for (const w of textWords(n.data)) {
        const norm = normWord(n.data.slice(w.start, w.end))
        if (norm) this.words.push({ norm, node: n, start: w.start, end: w.end })
      }
    }
  }

  /** The page's words as the matcher compares them. */
  get norms(): string[] {
    return (this._norms ??= this.words.map((w) => w.norm))
  }
  private _norms: string[] | null = null

  /** Where a run of spoken words begins on the page, searching from `from` (seekNorms). */
  seek(norms: readonly string[], from = 0): number {
    return seekNorms(this.norms, norms, from)
  }

  /** The page word each spoken word lands on (-1 for none), from `from` on (alignNorms). */
  align(norms: readonly string[], from: number): Int32Array {
    return alignNorms(this.norms, norms, from)
  }

  /** A spoken sentence placed after `from`, re-finding the place if it was lost (placeNorms). */
  place(norms: readonly string[], from: number): Int32Array {
    return placeNorms(this.norms, norms, from)
  }

  /** Whether page word `i` is still in the page: a part of the lesson drawn again leaves the old text behind. */
  alive(i: number): boolean {
    return !!this.words[i]?.node.isConnected
  }

  range(i: number, j = i): Range | null {
    const a = this.words[i]
    const b = this.words[j]
    if (!a || !b) return null
    const r = a.node.ownerDocument.createRange()
    try {
      r.setStart(a.node, a.start)
      r.setEnd(b.node, b.end)
    } catch {
      return null
    }
    return r
  }
}

/* ── Painting ─────────────────────────────────────────────────────────────── */

type HighlightCtor = new (...ranges: Range[]) => unknown
interface HighlightRegistry {
  set(name: string, h: unknown): void
  delete(name: string): void
}

function registry(): { Ctor: HighlightCtor; reg: HighlightRegistry } | null {
  const g = globalThis as unknown as { Highlight?: HighlightCtor; CSS?: { highlights?: HighlightRegistry } }
  return g.Highlight && g.CSS?.highlights ? { Ctor: g.Highlight, reg: g.CSS.highlights } : null
}

/** Lights up the word being read and, faintly, the sentence around it; null clears both. */
export function paint(word: Range | null, sentence: Range | null): void {
  glideTo(word)
  const h = registry()
  if (!h) return
  if (word) h.reg.set('raloud-word', new h.Ctor(word))
  else h.reg.delete('raloud-word')
  if (sentence) h.reg.set('raloud-sentence', new h.Ctor(sentence))
  else h.reg.delete('raloud-sentence')
}

/* ── The light that glides ────────────────────────────────────────────────
   A browser highlight can only jump from word to word. Under it runs one soft light that slides to each new
   word as it is said, the way a finger follows a line: an element of its own, on top of the page but
   ignoring the pointer, placed on the word's box. It slides when the word changes; when the page scrolls
   under the same word it simply stays on it, with no slide to lag behind. */

let glide: HTMLElement | null = null
let glideRange: Range | null = null
let glideFrame = 0
let glideLast = ''

function glideTo(word: Range | null): void {
  if (typeof document === 'undefined') return
  const changed = word !== glideRange
  glideRange = word
  if (!word) {
    if (glide) glide.style.opacity = '0'
    cancelAnimationFrame(glideFrame)
    glideFrame = 0
    glideLast = ''
    return
  }
  if (!glide || !glide.isConnected) {
    glide = document.createElement('div')
    glide.className = 'raloud-glide'
    glide.setAttribute('aria-hidden', 'true')
    document.body.appendChild(glide)
  }
  place(changed)
  if (!glideFrame) {
    const tick = () => {
      if (!glideRange) {
        glideFrame = 0
        return
      }
      place(false)
      glideFrame = requestAnimationFrame(tick)
    }
    glideFrame = requestAnimationFrame(tick)
  }
}

function place(slide: boolean): void {
  if (!glide || !glideRange) return
  const r = glideRange.getClientRects()[0] ?? glideRange.getBoundingClientRect()
  if (!r || (!r.width && !r.height)) {
    glide.style.opacity = '0'
    return
  }
  const pad = 3
  const key = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`
  if (key === glideLast && !slide) return
  glideLast = key
  glide.dataset.slide = slide ? 'true' : 'false'
  glide.style.opacity = '1'
  glide.style.width = `${r.width + pad * 2}px`
  glide.style.height = `${r.height + 2}px`
  glide.style.transform = `translate(${r.left - pad}px, ${r.top - 1}px)`
}

export const canPaint = (): boolean => registry() !== null

/** Whether a range is (at least partly) inside the visible part of its scroll container. */
export function inView(range: Range, scroller: Element | null): boolean {
  const r = range.getBoundingClientRect()
  if (!r.width && !r.height) return true
  const top = scroller ? Math.max(0, scroller.getBoundingClientRect().top) : 0
  const bottom = scroller ? Math.min(innerHeight, scroller.getBoundingClientRect().bottom) : innerHeight
  // The focus strip and the read-aloud bar take the bottom of the screen.
  return r.bottom > top + 40 && r.top < bottom - 90
}

/** Scrolls so the range sits a third of the way down the visible area. */
export function scrollToRange(range: Range, scroller: Element | null): void {
  const r = range.getBoundingClientRect()
  if (!scroller) {
    scrollBy({ top: r.top - innerHeight / 3, behavior: 'smooth' })
    return
  }
  const box = scroller.getBoundingClientRect()
  scroller.scrollBy({ top: r.top - box.top - box.height / 3, behavior: 'smooth' })
}
