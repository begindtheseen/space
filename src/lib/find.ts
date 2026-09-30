/* ============================================================================
   Find on the page
   ----------------------------------------------------------------------------
   The words she typed, found in what is on screen: every place they appear,
   as Ranges the find bar lights and steps through (components/FindBar.tsx).

   The page's text is read as one string, so a phrase is found even when the
   page draws part of it differently ("run `ls` to list" is three pieces of
   markup). Where one block of text ends and the next begins a line break is
   put in between, so the last word of a paragraph and the first of the next
   are never taken for one. Text that cannot be seen (a closed section, the
   copy of an equation kept for screen readers, the find bar itself) is
   skipped: finding what is not there to look at would only confuse.
   ========================================================================== */

/** Never searched: not shown, or not part of the page. */
const SKIP = 'script, style, noscript, template, .katex-mathml, .findbar, [hidden], [inert]'

/** Elements that start a new block of text. */
const BLOCK = 'p, li, h1, h2, h3, h4, h5, h6, pre, td, th, div, section, article, aside, header, footer, nav, blockquote, figcaption, dt, dd, summary, label, button, tr, table, ul, ol, dl, details, form, main'

interface Piece {
  node: Text
  /** Where this node's text starts in the joined string. */
  at: number
}

const visible = (el: Element, seen: Map<Element, boolean>): boolean => {
  let v = seen.get(el)
  if (v === undefined) {
    const check = (el as HTMLElement & { checkVisibility?: (o?: object) => boolean }).checkVisibility
    // Without checkVisibility (older browsers, tests) only a closed section is known to hide its text.
    v = check ? check.call(el, { visibilityProperty: true }) : !el.closest('details:not([open]) > :not(summary)')
    seen.set(el, v)
  }
  return v
}

/** Lower case, and letters with accents matched by their plain letter: "cafe" finds "café". */
export const foldText = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Every place `query` appears in `root`'s visible text, in page order, as Ranges. Case and accents do not
 * matter; spaces in the query match any run of white space on the page. At most `limit` are returned.
 */
export function findInPage(root: Element, query: string, limit = 2000): Range[] {
  const q = foldText(query).replace(/\s+/g, ' ').trim()
  if (!q) return []
  const doc = root.ownerDocument
  const seen = new Map<Element, boolean>()
  const pieces: Piece[] = []
  let text = ''
  let lastBlock: Element | null = null
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const el = n.parentElement
      if (!el || !n.nodeValue) return NodeFilter.FILTER_REJECT
      if (el.closest(SKIP)) return NodeFilter.FILTER_REJECT
      if (!visible(el, seen)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })
  // Each node's text is folded one character at a time, so offsets in the folded string map back to the node exactly.
  const maps: number[][] = []
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const block = n.parentElement!.closest(BLOCK)
    if (lastBlock && block !== lastBlock) text += '\n'
    lastBlock = block
    const raw = n.nodeValue!
    const map: number[] = []
    let folded = ''
    for (let i = 0; i < raw.length; i++) {
      const f = foldText(raw[i]!).replace(/\s/g, ' ')
      for (let k = 0; k < f.length; k++) map.push(i)
      folded += f
    }
    map.push(raw.length)
    pieces.push({ node: n, at: text.length })
    maps.push(map)
    text += folded
  }
  // White space in the query matches any run of white space (including a line break between blocks).
  const pattern = new RegExp(q.split(' ').map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'), 'g')
  const out: Range[] = []
  const locate = (pos: number, end: boolean): [Text, number] | null => {
    // The piece holding `pos` (for an end, the piece holding the character before it).
    let lo = 0
    let hi = pieces.length - 1
    const p = end ? pos - 1 : pos
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (pieces[mid]!.at <= p) lo = mid
      else hi = mid - 1
    }
    const piece = pieces[lo]
    if (!piece) return null
    const map = maps[lo]!
    const off = Math.min(Math.max(0, pos - piece.at), map.length - 1)
    return [piece.node, end ? (map[off - 1] ?? -1) + 1 : map[off]!]
  }
  for (let m = pattern.exec(text); m && out.length < limit; m = pattern.exec(text)) {
    if (!m[0].length) {
      pattern.lastIndex++
      continue
    }
    const a = locate(m.index, false)
    const b = locate(m.index + m[0].length, true)
    if (!a || !b) continue
    const r = doc.createRange()
    try {
      r.setStart(a[0], a[1])
      r.setEnd(b[0], b[1])
    } catch {
      continue
    }
    out.push(r)
  }
  return out
}
