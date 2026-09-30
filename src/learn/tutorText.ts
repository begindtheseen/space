/* ============================================================================
   ORBIT — the tutor's way with words
   ----------------------------------------------------------------------------
   What the code tutor (tutor.ts) and the terminal tutor (tutorShell.ts) share:
   what a diagnosis is, and the small helpers that turn one into a sentence a
   person would say, including how two names differ ("two letters are
   swapped", "it's missing an s", "capital letters").
   ========================================================================== */

export type DiagnosisKind =
  | 'unchanged'
  | 'error'
  | 'timeout'
  | 'empty'
  | 'output'
  | 'case'
  | 'rows'
  | 'check'
  | 'logic'
  | 'spelling'
  | 'place'
  | 'order'
  | 'content'
  | 'folder'
  | 'missing'
  | 'wrong-file'
  | 'git'

export interface Diagnosis {
  kind: DiagnosisKind
  /** Identifies this particular problem, so a repeat can be told from a new one. */
  key: string
  /** What is wrong, and where: said first. */
  say: string
  /** What to do about it: said from the second try on, or at once when `now` is set. */
  more?: string
  /** Say `more` straight away: when it is the whole point, and holding it back would only be coy. */
  now?: boolean
}

export const clip = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** Lower-cases the first word to follow on from "but", unless it is a name: Python stays Python. */
export const lowerFirst = (s: string) =>
  /^(?:Python|JavaScript|TypeScript|SQL|C\+\+|I|HTML|CSS|Git)\b/.test(s) || !/^[A-Z](?:[a-z]|\s)/.test(s) ? s : s[0]!.toLowerCase() + s.slice(1)

export const upperFirst = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s)

export const sentence = (s: string) => {
  const t = s.trim()
  return !t ? '' : /[.!?…]["'”)`]?$/.test(t) ? t : `${t}.`
}

export const quote = (s: string) => `“${clip(s.replace(/\s+/g, ' ').trim(), 70)}”`
export const code = (s: string) => `\`${clip(s.trim(), 60).replace(/`/g, "'")}\``

export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
export const pick = <T,>(list: readonly T[], seed: string): T => list[hash(seed) % list.length]!

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']
export const nth = (i: number) => ORDINALS[i] ?? `number ${i + 1}`

/** Edits between two strings, where swapping two neighbouring letters counts as one (the commonest typing slip). */
export function distance(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1)
    }
  return d[m]![n]!
}

/* ── How two names differ ────────────────────────────────────────────────── */

export type Slip = 'case' | 'extension' | 'no-extension' | 'separator' | 'plural' | 'typo' | 'space'

const extOf = (name: string): [string, string] => {
  const m = /^(.+?)(\.[A-Za-z0-9]+)$/.exec(name)
  return m ? [m[1]!, m[2]!] : [name, '']
}

/** How `got` is a slip for `want`, or null when they are simply different names. */
export function slipOf(want: string, got: string): Slip | null {
  if (!want || !got || want === got) return null
  if (want.toLowerCase() === got.toLowerCase()) return 'case'
  if (want.replace(/\s+/g, '') === got.replace(/\s+/g, '')) return 'space'
  const [ws, we] = extOf(want)
  const [gs, ge] = extOf(got)
  if (ws === gs && we !== ge) return ge ? 'extension' : 'no-extension'
  if (ws.replace(/[-_ .]/g, '').toLowerCase() === gs.replace(/[-_ .]/g, '').toLowerCase() && we === ge) return 'separator'
  if (we === ge && (ws === `${gs}s` || gs === `${ws}s`)) return 'plural'
  const d = distance(want, got)
  if (d <= Math.max(1, Math.floor(Math.max(want.length, got.length) / 4)) && Math.min(want.length, got.length) >= 2) return 'typo'
  return null
}

/** Says exactly how `got` differs from `want`, the way you would point it out to someone. */
export function describeSlip(want: string, got: string): string {
  const slip = slipOf(want, got)
  const [ws, we] = extOf(want)
  const [, ge] = extOf(got)
  switch (slip) {
    case 'case':
      return `the capital letters are different, and the terminal treats ${code(got)} and ${code(want)} as two different names`
    case 'space':
      return 'there is a space in a different place'
    case 'extension':
      return `the ending is ${code(ge)} instead of ${code(we)}`
    case 'no-extension':
      return `it is missing the ${code(we)} ending`
    case 'separator':
      return 'the dashes, dots or underscores between the words are different'
    case 'plural':
      return got.length > want.length ? `it has an extra ${code('s')}` : `it is missing the ${code('s')} at the end of ${code(ws)}`
    default:
      break
  }
  // One letter out: missing, extra, swapped, or the wrong one.
  if (got.length === want.length - 1) {
    for (let i = 0; i < want.length; i++)
      if (want.slice(0, i) + want.slice(i + 1) === got) return `it is missing ${/[aeiou]/i.test(want[i]!) ? 'an' : 'a'} ${code(want[i]!)}`
  }
  if (got.length === want.length + 1) {
    for (let i = 0; i < got.length; i++) if (got.slice(0, i) + got.slice(i + 1) === want) return `it has an extra ${code(got[i]!)}`
  }
  if (got.length === want.length) {
    const diff = [...want].map((c, i) => (c === got[i] ? -1 : i)).filter((i) => i >= 0)
    if (diff.length === 2 && diff[1] === diff[0]! + 1 && want[diff[0]!] === got[diff[1]!] && want[diff[1]!] === got[diff[0]!])
      return `two letters are swapped: ${code(got.slice(diff[0]!, diff[0]! + 2))} should be ${code(want.slice(diff[0]!, diff[0]! + 2))}`
    if (diff.length === 1) return `it has ${code(got[diff[0]!]!)} where ${code(want[diff[0]!]!)} should be`
  }
  return 'the spelling is a little different'
}

/** The name in `pool` that `got` is most likely a slip for, if any. */
export function closestSlip(got: string, pool: Iterable<string>): string | null {
  let best: string | null = null
  let bestD = Infinity
  for (const p of pool) {
    if (p === got) continue
    const s = slipOf(p, got)
    if (!s) continue
    const d = s === 'case' ? 0 : s === 'typo' ? distance(p, got) : 0.5
    if (d < bestD) {
      best = p
      bestD = d
    }
  }
  return best
}
