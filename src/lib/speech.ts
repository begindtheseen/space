/* ============================================================================
   ORBIT — reading a lesson out loud
   ----------------------------------------------------------------------------
   The speaking is the easy part. Every browser ships a synthesiser, and on a
   Mac the system voices are genuinely good. What makes read-aloud sound like
   a broken robot is almost never the voice — it is what the voice is handed.

   A lesson in this app is markdown full of LaTeX. Give a synthesiser the raw
   source and it says "dollar T equals backslash tfrac open brace one close
   brace two I sub k omega sub k caret two dollar", which is worse than
   silence. So this file exists to turn a lesson into something a person would
   actually say out loud:

     - maths becomes English — "H squared over two I sub three", not symbols
     - code blocks and tables are named and skipped rather than spelled out
     - callouts announce themselves, so "Key point." lands before the point
     - headings get a full stop, so the voice drops and pauses like a reader
     - the result is split on sentence boundaries, never on a character count

   That last one matters more than it sounds. Synthesisers pause at the end of
   each utterance, so chunking mid-sentence puts a silence in the middle of a
   clause and that single fact is what makes read-aloud sound chopped up. Split
   where a human would breathe and the same voice sounds fluent.

   Everything here is a pure function of a string, so it is all testable
   without a browser, which is the only reason it can be trusted.
   ========================================================================== */

import { splitNotes, stripNoteRefs } from './contextNotes'

/* ── Maths ───────────────────────────────────────────────────────────────── */

/** Greek and the handful of named symbols a GNC lesson actually uses. */
const SYMBOLS: [RegExp, string][] = [
  [/\\alpha\b/g, 'alpha'], [/\\beta\b/g, 'beta'], [/\\gamma\b/g, 'gamma'],
  [/\\Gamma\b/g, 'capital gamma'], [/\\delta\b/g, 'delta'], [/\\Delta\b/g, 'delta'],
  [/\\epsilon\b/g, 'epsilon'], [/\\varepsilon\b/g, 'epsilon'], [/\\zeta\b/g, 'zeta'],
  [/\\eta\b/g, 'eta'], [/\\theta\b/g, 'theta'], [/\\Theta\b/g, 'capital theta'],
  [/\\vartheta\b/g, 'theta'], [/\\iota\b/g, 'iota'], [/\\kappa\b/g, 'kappa'],
  [/\\lambda\b/g, 'lambda'], [/\\Lambda\b/g, 'capital lambda'], [/\\mu\b/g, 'mu'],
  [/\\nu\b/g, 'nu'], [/\\xi\b/g, 'xi'], [/\\Xi\b/g, 'capital xi'], [/\\pi\b/g, 'pi'],
  [/\\Pi\b/g, 'capital pi'], [/\\rho\b/g, 'rho'], [/\\sigma\b/g, 'sigma'],
  [/\\Sigma\b/g, 'capital sigma'], [/\\tau\b/g, 'tau'], [/\\upsilon\b/g, 'upsilon'],
  [/\\phi\b/g, 'phi'], [/\\varphi\b/g, 'phi'], [/\\Phi\b/g, 'capital phi'],
  [/\\chi\b/g, 'chi'], [/\\psi\b/g, 'psi'], [/\\Psi\b/g, 'capital psi'],
  [/\\omega\b/g, 'omega'], [/\\Omega\b/g, 'capital omega'],
  [/\\infty\b/g, 'infinity'], [/\\partial\b/g, 'partial'], [/\\nabla\b/g, 'del'],
  [/\\pm\b/g, ' plus or minus '], [/\\mp\b/g, ' minus or plus '],
  // A centred dot is multiplication — "I times 2 to the power of minus n" —
  // except between two vectors, where it is the dot product; those were
  // marked \innerproduct before this list runs (see vectorDots).
  [/\\innerproduct\b/g, ' dot '],
  [/\\times\b/g, ' times '], [/\\cdot\b/g, ' times '], [/[·∙⋅×]/g, ' times '],
  [/\\div\b/g, ' divided by '],
  [/\\approx\b/g, ' is approximately '], [/\\equiv\b/g, ' is identical to '],
  [/\\neq\b/g, ' is not equal to '], [/\\sim\b/g, ' of order '],
  [/\\leq\b|\\le\b/g, ' is less than or equal to '],
  [/\\geq\b|\\ge\b/g, ' is greater than or equal to '],
  [/\\ll\b/g, ' is much less than '], [/\\gg\b/g, ' is much greater than '],
  [/\\rightarrow\b|\\to\b/g, ' goes to '], [/\\Rightarrow\b/g, ' implies '],
  [/\\leftrightarrow\b|\\Leftrightarrow\b/g, ' if and only if '],
  [/\\in\b/g, ' in '], [/\\propto\b/g, ' is proportional to '],
  [/\\forall\b/g, ' for all '], [/\\exists\b/g, ' there exists '],
  [/\\prime\b/g, ' prime '], [/\\star\b|\\ast\b/g, ' star '],
  [/\\ldots|\\dots|\\cdots|\\vdots|\\ddots/g, ' and so on '],
  // Composition: `(f \circ g)(x)`. A degree sign is `^\circ`, read before this.
  [/\\circ\b/g, ' composed with '],
  // Norms are written without braces around the thing being measured, so they
  // are handled here rather than as a command with an argument.
  [/\\lVert|\\lvert|\\\|/g, ' the magnitude of '],
  [/\\rVert|\\rvert/g, ' '],
  [/\\sin\b/g, 'sine'], [/\\cos\b/g, 'cosine'], [/\\tan\b/g, 'tangent'],
  [/\\arctan\b/g, 'arctangent'], [/\\arcsin\b/g, 'arcsine'], [/\\arccos\b/g, 'arccosine'],
  [/\\log\b/g, 'log'], [/\\ln\b/g, 'natural log'], [/\\exp\b/g, 'exponential of'],
  [/\\min\b/g, 'minimum'], [/\\max\b/g, 'maximum'], [/\\det\b/g, 'the determinant of'],
  [/\\int\b/g, ' the integral of '], [/\\oint\b/g, ' the closed integral of '],
  [/\\sum\b/g, ' the sum of '], [/\\prod\b/g, ' the product of '],
  [/\\lim\b/g, ' the limit of '],
]

/** Spacing, sizing and styling commands that carry no sound at all. */
const SILENT = /\\(?:left|right|big|Big|bigg|Bigg|displaystyle|textstyle|limits|nolimits|,|;|:|!|quad|qquad)\b|\\[,;:!]|\\ /g

/**
 * Escaped punctuation. Only letters follow a backslash in the catch-all near
 * the end of mathToWords, so these survived it and were spoken with the
 * backslash still attached — "19 backslash percent".
 */
const ESCAPED: [RegExp, string][] = [
  [/\\%/g, ' percent '],
  [/\\&/g, ' and '],
  [/\\\$/g, ' dollars '],
  [/\\#/g, ' number '],
  [/\\_/g, '_'],
]

/** Digits after a subscript read better as words: "I sub 3" beats "I sub three"? No. */
const SUB_WORDS: Record<string, string> = {
  '0': 'nought', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
}

/** Balanced-brace argument reader, so nested braces survive. */
function readArg(s: string, from: number): { body: string; end: number } | null {
  // TeX lets a single token stand in for a braced group, and this curriculum
  // uses that constantly: `\dot R` is how range rate is written, `\dot\lambda`
  // how line-of-sight rate is. Requiring a brace meant both fell through to
  // the "drop the command" path below, so R-dot was read as "R" and
  // lambda-dot as "lambda" — the rate silently became the quantity, which in
  // a guidance derivation is the difference between closing speed and range.
  if (s[from] !== '{') {
    const rest = s.slice(from)
    const single = /^(\\[A-Za-z]+|[A-Za-z0-9])/.exec(rest)
    if (!single) return null
    return { body: single[1], end: from + single[1].length }
  }
  let depth = 0
  for (let i = from; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) return { body: s.slice(from + 1, i), end: i + 1 }
    }
  }
  return null
}

/**
 * Rewrites one command that takes one or two braced arguments, innermost
 * first, so that a fraction inside a square root comes out in the right order.
 */
function rewrite(
  tex: string,
  name: string,
  arity: 1 | 2,
  say: (a: string, b: string) => string,
): string {
  const token = `\\${name}`
  let out = tex
  for (let guard = 0; guard < 64; guard++) {
    const at = out.lastIndexOf(token)
    if (at < 0) break
    let i = at + token.length
    while (out[i] === ' ') i++
    const a = readArg(out, i)
    if (!a) {
      // Malformed or unbraced. Drop the command rather than spell it out.
      out = out.slice(0, at) + ' ' + out.slice(at + token.length)
      continue
    }
    let b = { body: '', end: a.end }
    if (arity === 2) {
      let j = a.end
      while (out[j] === ' ') j++
      const second = readArg(out, j)
      if (second) b = second
    }
    out = out.slice(0, at) + ' ' + say(a.body, b.body) + ' ' + out.slice(b.end)
  }
  return out
}

/* ── Degrees, powers and the other little marks ───────────────────────── */

/** One number and the degree sign after it, or a bare degree sign. */
const DEGREE_RE =
  /(-?\d[\d,]*(?:\.\d+)?)?\s*°\s*(?:\/\s*(?:s|sec)\s*(\^\s*\{?\s*2\s*\}?|²)?(?![A-Za-z])|([CFK])\b)?/g

/**
 * The degree sign, read the way a person reads it: "53 degrees", "1 degree",
 * "12.34 degrees per second", "20 degrees Celsius". Left to the voice, "°/s"
 * came out as "degrees slash s", and inside an equation `^\circ` was read as
 * "circ".
 */
export function degreesToWords(s: string): string {
  return s.replace(DEGREE_RE, (_m, n: string | undefined, squared: string | undefined, scale: string | undefined) => {
    const unit = n !== undefined && /^-?1$/.test(n) ? 'degree' : 'degrees'
    let out = `${n !== undefined ? `${n} ` : ' '}${unit}`
    if (scale) out += ` ${{ C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' }[scale]}`
    else if (_m.includes('/')) out += squared ? ' per second squared' : ' per second'
    return ` ${out} `
  })
}

/** A power spoken: the common ones have names, the rest are "to the power of". */
function powerWords(p: string): string {
  const q = p.trim()
  if (q === '2') return ' squared '
  if (q === '3') return ' cubed '
  const named: Record<string, string> = {
    '1/2': 'one half', '-1/2': 'minus one half', '3/2': 'three halves',
    '-3/2': 'minus three halves', '1/3': 'one third', '2/3': 'two thirds',
  }
  return ` to the power of ${named[q.replace(/\s+/g, '').replace(/^\+/, '')] ?? q} `
}

const SUPERSCRIPT: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-',
}

/**
 * The symbols prose uses for arithmetic, outside any equation: "3 × 10⁸",
 * "10^6", "m²", "45°", "8.4 deg". Each was read literally, or not at all —
 * "x^2" came out as "x two".
 */
export function symbolsToWords(text: string): string {
  let s = text.replace(/([^\s⁰¹²³⁴⁵⁶⁷⁸⁹⁻])([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_m, base: string, sup: string) =>
    `${base}^${[...sup].map((c) => SUPERSCRIPT[c]).join('')}`,
  )
  s = degreesToWords(s)
  // Units first, so "m/s^2" is still a unit when the caret is reached.
  s = expandUnits(s)
  s = s.replace(/([\w)])\^\{?(-?\d+(?:\.\d+)?)\}?/g, (_m, base: string, p: string) => `${base}${powerWords(p)}`)
  s = s
    .replace(/(\d)\s*[·∙⋅×]\s*(?=[\d(])/g, '$1 times ')
    // A spaced dot between phrases is a separator: a pause, or nothing after
    // a full stop.
    .replace(/([.!?;:,])\s+[·∙]\s+/g, '$1 ')
    .replace(/\s[·∙]\s/g, ', ')
    .replace(/(\p{L})[·∙⋅](?=\p{L})/gu, '$1 ')
    .replace(/\s*×\s*/g, ' times ')
    .replace(/ +([.,;:!?])/g, '$1')
  return s
}

const ORDINAL = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

/**
 * Matrices, cases and aligned lines, which were read as "begin pmatrix 0 and
 * 1 backslash minus 2 …". A matrix is read row by row; a column is read as a
 * vector; cases are read as "this, if that"; aligned working is read line by
 * line.
 */
function environments(tex: string): string {
  const rowsOf = (body: string) =>
    body
      .split(/\\\\(?:\[[^\]]*\])?/)
      .map((r) => r.replace(/\\hline/g, '').trim())
      .filter(Boolean)
  const det = (env: string) => /^[vV]matrix/.test(env)
  const cellsOf = (row: string) => row.split(/(?<!\\)&/).map((c) => mathToWords(c)).filter(Boolean)
  let s = tex
  for (let guard = 0; guard < 32; guard++) {
    // Innermost first: an environment whose body holds no other \begin.
    const m = /\\begin\s*\{(\w+\*?)\}(?:\{[^{}]*\})?((?:(?!\\begin\s*\{)[\s\S])*?)\\end\s*\{\1\}/.exec(s)
    if (!m) break
    const [whole, env, body] = m
    const rows = rowsOf(body).map(cellsOf)
    let said: string
    if (/^[pbBvV]?matrix\*?$|^smallmatrix$/.test(env)) {
      const isDet = det(env)
      if (rows.every((r) => r.length <= 1)) said = `the column vector ${rows.map((r) => r[0] ?? '0').join(', ')}`
      else if (rows.length === 1) said = `the row vector ${rows[0].join(', ')}`
      else said = `the matrix with ${rows.map((r, i) => `${ORDINAL[i] ? `row ${ORDINAL[i]}: ` : ''}${r.join(', ')}`).join('; ')}`
      if (isDet) said = said.replace(/^the /, 'the determinant of the ')
    } else if (/^[dr]?cases\*?$/.test(env)) {
      said = rows.map((r) => (r.length > 1 ? `${r[0]}, ${/^(if|when|for|otherwise|else)\b/.test(r[1]) ? '' : 'if '}${r.slice(1).join(' ')}` : r[0])).join('; ')
    } else {
      // aligned, align, gathered, split, array, eqnarray: working, one line at a time.
      said = rows.map((r) => r.join(' ')).join('. ')
    }
    // A comma, not a full stop: the equation usually carries on past it.
    const before = det(env) ? s.slice(0, m.index).replace(/\\det\s*$/, '') : s.slice(0, m.index)
    s = before + ` ${said}, ` + s.slice(m.index + whole.length)
  }
  // Transforms are written as an operator on braces: \mathcal{L}\{f(t)\}.
  const transform: Record<string, string> = { L: 'Laplace transform', Z: 'z-transform', F: 'Fourier transform' }
  s = s.replace(/\\mathcal\s*\{([LZF])\}\s*(\^\s*\{\s*-\s*1\s*\})?\s*(?=\\\{|\\left\s*\\\{)/g, (_m, k: string, inv: string | undefined) =>
    ` the ${inv ? 'inverse ' : ''}${transform[k]} of `,
  )
  // Set-builder braces: "the set of x such that …". Any other escaped brace
  // is grouping and has no sound.
  s = s.replace(/\\\{([^{}]*?)(?:\s:\s|:|\\mid|\|)([^{}]*?)\\\}/g, ' the set of $1 such that $2 ')
  s = s.replace(/\\[{}]/g, ' ')
  // A line break outside an environment is a pause.
  s = s.replace(/\\\\(?:\[[^\]]*\])?/g, ' , ')
  return s
}

/**
 * Integrals, sums and products with limits, and limits themselves: "the
 * integral from 0 to T of", not "the integral of sub nought to the power T".
 */
function boundedOperators(tex: string): string {
  const arg = String.raw`(\{(?:[^{}]|\{[^{}]*\})*\}|\\[A-Za-z]+|[A-Za-z0-9])`
  const strip = (a: string) => mathToWords(a.startsWith('{') ? a.slice(1, -1) : a)
  const name: Record<string, string> = { int: 'integral', oint: 'closed integral', sum: 'sum', prod: 'product' }
  let s = tex.replace(
    new RegExp(String.raw`\\(int|oint|sum|prod)(?:\\limits)?\s*_\s*${arg}\s*\^\s*${arg}`, 'g'),
    (_m, op: string, lo: string, hi: string) => ` the ${name[op]} from ${strip(lo)} to ${strip(hi)} of `,
  )
  s = s.replace(
    new RegExp(String.raw`\\(int|oint|sum|prod)(?:\\limits)?\s*_\s*${arg}`, 'g'),
    (_m, op: string, lo: string) => ` the ${name[op]} over ${strip(lo)} of `,
  )
  s = s.replace(new RegExp(String.raw`\\lim\s*_\s*${arg}`, 'g'), (_m, lo: string) => ` the limit as ${strip(lo)} of `)
  return s
}

/**
 * The superscripts that are not powers: transpose, inverse, star and prime.
 * Run before bold is dropped, because bold is what says a letter is a matrix.
 */
function namedSuperscripts(tex: string): string {
  const matrix = String.raw`(\\(?:mathbf|boldsymbol)\s*\{[^{}]*\}|\\[A-Z][a-z]*\b|(?<![A-Za-z\\])[A-Z](?![a-z]))`
  const T = String.raw`(?:T|\\top|\\intercal|\\mathsf\s*\{T\}|\\mathrm\s*\{T\}|\\mathsf\s*T)`
  return tex
    .replace(new RegExp(String.raw`\^\s*\{\s*-\s*${T}\s*\}`, 'g'), ' inverse transpose ')
    .replace(new RegExp(String.raw`\^\s*(?:\{\s*${T}\s*\}|${T}(?![A-Za-z]))`, 'g'), ' transpose ')
    .replace(new RegExp(String.raw`${matrix}\s*\^\s*\{\s*-\s*1\s*\}`, 'g'), '$1 inverse ')
    .replace(/\^\s*\{?\s*(?:\*|\\ast|\\star)\s*\}?/g, ' star ')
    // The cross-product matrix: a^\times is "a cross", not a power.
    .replace(/\^\s*\{?\s*\\times\s*\}?/g, ' cross ')
    .replace(/\^\s*\{?\s*\\wedge\s*\}?/g, ' wedge ')
    // Not an apostrophe inside a word: `\text{don't}` is not "don prime t".
    .replace(/\^\s*\{?\s*\\prime\s*\\prime\s*\}?|(?<=[A-Za-z)}])''(?![A-Za-z])/g, ' double prime ')
    .replace(/\^\s*\{?\s*\\prime\s*\}?|(?<=[A-Za-z)}])'(?![A-Za-z])/g, ' prime ')
}

/**
 * Marks a centred dot between two vectors as a dot product, so it is not
 * read as "times" with everything else.
 */
function vectorDots(tex: string): string {
  const vector = String.raw`(?:\\(?:mathbf|boldsymbol|vec)\s*(?:\{[^{}]*\}|\\?[A-Za-z]+\b)|\\hat\s*\{[^{}]*\}|\\hat\s*\\?[A-Za-z]+|\\nabla)`
  return tex.replace(new RegExp(String.raw`(${vector}(?:\s*_\s*(?:\{[^{}]*\}|\w))?)\s*\\cdot(?![a-z])\s*(?=${vector})`, 'g'), '$1 \\innerproduct ')
}

/**
 * Turns one LaTeX expression into words.
 *
 * It is not a parser and does not try to be. It handles the constructions
 * that actually appear in these lessons and degrades to reading the symbols
 * aloud for anything else, which is the right failure: a slightly clumsy
 * sentence is recoverable, a stream of backslashes is not.
 */
/**
 * The reading speeds offered anywhere in the app.
 *
 * One list, because there are two controls: the picker above a lesson and the
 * row in Settings. If they offered different values, choosing 1.75 in Settings
 * would leave the lesson picker showing nothing, since a select cannot display
 * a value that is not one of its options. The range matches the clamp in
 * engine/state.ts, so every speed here survives being saved and reloaded.
 */
export const SPEECH_RATES = [0.5, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2] as const

/** What a learner who has never touched the control hears. */
export const DEFAULT_SPEECH_RATE = 1

/**
 * The speeds to offer, given the one currently saved.
 *
 * A select cannot show a value that is not one of its options: it renders
 * blank instead. So a speed saved before this list existed — or before it last
 * changed — is folded in rather than silently losing the setting the moment
 * she opens the menu.
 */
export function speechRateOptions(current: number): number[] {
  const all = new Set<number>(SPEECH_RATES)
  if (Number.isFinite(current)) all.add(current)
  return [...all].sort((a, b) => a - b)
}

export function mathToWords(tex: string): string {
  let s = tex

  s = environments(s)
  s = boundedOperators(s)
  s = vectorDots(s)
  // Upright text first, so a transpose written `^{\mathsf{T}}` is still seen
  // as one, and an apostrophe in `\text{…}` is plainly inside a word.
  s = rewrite(s, 'mathrm', 1, (a) => a)
  s = rewrite(s, 'text', 1, (a) => a)
  s = rewrite(s, 'mathsf', 1, (a) => a)
  s = rewrite(s, 'operatorname', 1, (a) => a)
  s = namedSuperscripts(s)
  s = rewrite(s, 'tfrac', 2, (a, b) => `${mathToWords(a)} over ${mathToWords(b)}`)
  s = rewrite(s, 'dfrac', 2, (a, b) => `${mathToWords(a)} over ${mathToWords(b)}`)
  s = rewrite(s, 'frac', 2, (a, b) => `${mathToWords(a)} over ${mathToWords(b)}`)
  s = rewrite(s, 'sqrt', 1, (a) => `the square root of ${mathToWords(a)}`)
  s = rewrite(s, 'dot', 1, (a) => `${mathToWords(a)} dot`)
  s = rewrite(s, 'ddot', 1, (a) => `${mathToWords(a)} double dot`)
  s = rewrite(s, 'hat', 1, (a) => `${mathToWords(a)} hat`)
  s = rewrite(s, 'bar', 1, (a) => `${mathToWords(a)} bar`)
  s = rewrite(s, 'vec', 1, (a) => `vector ${mathToWords(a)}`)
  // In this curriculum bold means a vector or a matrix, so say so.
  s = rewrite(s, 'mathbf', 1, (a) => mathToWords(a))
  s = rewrite(s, 'boldsymbol', 1, (a) => mathToWords(a))
  s = rewrite(s, 'mathcal', 1, (a) => mathToWords(a))

  for (const [re, word] of ESCAPED) s = s.replace(re, word)
  s = s.replace(SILENT, ' ')
  // Degrees before anything reads the caret: `65^\circ`, `{}^\circ/\mathrm{s}`.
  s = s.replace(/\{\s*\}\s*\^\s*\\circ\b|\^\s*\{\s*\\circ\s*\}|\^\s*\\circ\b|\\degree\b/g, '°')
  s = degreesToWords(s)
  // Spaced, so a name never runs into the next one: `\cos\theta` had become
  // "\costheta", which no later rule recognised.
  for (const [re, word] of SYMBOLS) s = s.replace(re, ` ${word} `)

  // Powers. The common ones have names; the rest are "to the power of".
  s = s.replace(/\^\s*\{\s*([23])\s*\}|\^\s*([23])(?![0-9])/g, (_m, a: string, b: string) => powerWords(a ?? b))
  s = s.replace(/\^\s*\{([^{}]*)\}/g, (_m, p: string) => {
    const q = p.replace(/\s+/g, '')
    return /^[+-]?\d\/\d$/.test(q) ? powerWords(q) : ` to the power of ${mathToWords(p)} `
  })
  s = s.replace(/\^\s*(-?(?:\d+(?:\.\d+)?|[A-Za-z]+))/g, (_m, p: string) => powerWords(p))

  // `|_N` means "evaluated in frame N" throughout these lessons, and a voice
  // reading the bar as "sub N" loses the only word that carried the meaning.
  s = s.replace(/\|\s*_\{?([A-Za-z])\}?/g, ' in frame $1 ')

  // Subscripts.
  s = s.replace(/_\{([^{}]*)\}/g, (_m, p: string) => ` sub ${mathToWords(p)} `)
  s = s.replace(/_(\w)/g, (_m, p: string) => ` sub ${SUB_WORDS[p] ?? p} `)
  // Labels abbreviated in a subscript: v_circ is circular speed.
  s = s.replace(/\bsub\s+(circ|esc|max|min|ref|cmd|init|avg|rel)\b/g, (_m, l: string) =>
    ` sub ${{ circ: 'circular', esc: 'escape', max: 'max', min: 'min', ref: 'ref', cmd: 'command', init: 'initial', avg: 'average', rel: 'relative' }[l]} `,
  )

  // Units before operators: the slash in "m/s" is part of a name, not a
  // division, and turning it into "divided by" made a speed read as an
  // algebraic quotient — "1000 m divided by s".
  s = expandUnits(s)

  s = s
    .replace(/\\\\/g, ' . ')
    .replace(/[{}]/g, ' ')
    // Alignment marks outside an environment have no sound.
    .replace(/(?<!\\)&/g, ' ')
    .replace(/\s*=\s*/g, ' equals ')
    .replace(/\s*\+\s*/g, ' plus ')
    // A slash between terms is a quotient. Left silent it ran the two sides
    // together — "t equals R V sub c" sounds like a product, which is the
    // opposite of what time-to-go is.
    .replace(/\s*\/\s*/g, ' divided by ')
    .replace(/(\w)\s*-\s*(\w)/g, '$1 minus $2')
    // A minus that opens an expression, or follows an operator or a bracket,
    // has nothing to its left for the rule above to match, so it was dropped
    // and the value was read as positive.
    .replace(/(^|[(\[,=+\s])-\s*(?=[\w\\(])/g, '$1 minus ')
    .replace(/\s*<\s*/g, ' is less than ')
    .replace(/\s*>\s*/g, ' is greater than ')
    // Anything left with a backslash is a command this does not know. Saying
    // its name is closer to useful than saying "backslash".
    .replace(/\\([A-Za-z]+)/g, ' $1 ')
    // A caret nothing above could read has no sound worth making.
    .replace(/\^/g, ' ')
    // Implied multiplication, spaced out. Run together, "2I" is read as one
    // token and comes out as "two-eye"; separated, the voice says "two I",
    // which is how the expression is read aloud by a person.
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

  return s
}

/* ── Units ───────────────────────────────────────────────────────────────── */

/**
 * Unit abbreviations, expanded only where they stand alone as a word so that
 * "m" inside a variable name is left alone.
 */
const UNITS: [RegExp, string][] = [
  [/\bkm\/s\b/g, 'kilometres per second'],
  [/\bkg\/s\b/g, 'kilograms per second'],
  [/\bN\/m\b/g, 'newtons per metre'],
  [/\bm\/s\^?2\b/g, 'metres per second squared'],
  [/\bm\/s\b/g, 'metres per second'],
  [/\bkm\b/g, 'kilometres'],
  [/\bkg\b/g, 'kilograms'],
  [/\bkN\b/g, 'kilonewtons'],
  [/\bkPa\b/g, 'kilopascals'],
  [/\bMPa\b/g, 'megapascals'],
  [/\brad\/s\b/g, 'radians per second'],
  [/\bdeg\/s\b/g, 'degrees per second'],
  [/\bdeg\b/g, 'degrees'],
  [/\brpm\b/g, 'revolutions per minute'],
  [/\bHz\b/g, 'hertz'],
  [/\bms\b/g, 'milliseconds'],
]

function expandUnits(s: string): string {
  let out = s
  for (const [re, word] of UNITS) out = out.replace(re, word)
  return out
}

/* ── Markdown ────────────────────────────────────────────────────────────── */

const CALLOUT_NAME: Record<string, string> = {
  example: 'Example.',
  key: 'Key point.',
  check: 'Check yourself.',
  answer: 'Answer.',
  note: 'Note.',
  warning: 'Careful.',
  video: '',
}

/**
 * Turns a lesson body into speech-ready prose.
 *
 * Structure that cannot be spoken usefully is named and skipped rather than
 * read out. "Code block." is a second of audio and tells her to look; reading
 * forty lines of C++ aloud is a minute of noise she has to sit through.
 */
export function speakableFromMarkdown(md: string): string {
  // Context notes are for looking up, not for listening to: the notes go, and
  // a marked phrase is read as its plain words (see lib/contextNotes.ts).
  let s = stripNoteRefs(splitNotes(md).body)

  // Fenced code: named, not read.
  s = s.replace(/```[\s\S]*?```/g, '\nCode block.\n')

  // Tables: named, not read. A table read linearly is unintelligible.
  s = s.replace(/^\|.*\|\s*$(?:\n^\|.*\|\s*$)+/gm, '\nTable.\n')

  // Callouts announce themselves and then read normally.
  s = s.replace(/^:::\s*(\w+)[ \t]*(.*)$/gm, (_m, kind: string, title: string) => {
    const name = CALLOUT_NAME[kind] ?? ''
    return `\n${name}${title ? ` ${title}.` : ''}\n`
  })
  s = s.replace(/^:::\s*$/gm, '\n')

  // A literal dollar sign in prose is written \$, and left alone it opened an
  // "equation" that ran to the next dollar sign: "\$150 per credit … 9000".
  s = s.replace(/\\\$\s?(\d[\d,]*(?:\.\d+)?)/g, '$1 dollars').replace(/\\\$/g, ' dollars ')

  // Display maths, then inline maths.
  //
  // A displayed equation sits in its own paragraph, but the sentence that
  // introduces it usually does not finish first — "The tempting move is",
  // then the equation. Left as two paragraphs those become two utterances,
  // so the voice stopped dead on "is" and started again. The blank lines
  // around the equation are taken with it, which puts it back in the sentence
  // that was reaching for it.
  s = s.replace(
    /[ \t]*\n\s*\$\$([\s\S]*?)\$\$[ \t]*\n?/g,
    (_m, tex: string) => ` ${mathToWords(tex)} `,
  )
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_m, tex: string) => ` ${mathToWords(tex)} `)
  s = s.replace(/\$([^$\n]+)\$/g, (_m, tex: string) => ` ${mathToWords(tex)} `)

  // Inline code reads as its own text — it is usually an identifier.
  s = s.replace(/`([^`\n]+)`/g, ' $1 ')

  // Headings become sentences so the voice drops and takes a breath.
  s = s.replace(/^#{1,6}\s+(.*)$/gm, (_m, t: string) => `\n${t.replace(/[.:;]+$/, '')}.\n`)

  // Emphasis, links and images.
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')

  // List markers: the bullet itself is not a word.
  s = s.replace(/^\s*[-*+]\s+/gm, '')
  s = s.replace(/^\s*\d+\.\s+/gm, '')

  // Horizontal rules and stray markup.
  s = s.replace(/^\s*(?:-{3,}|_{3,})\s*$/gm, '\n')
  s = s.replace(/^>\s?/gm, '')

  s = symbolsToWords(s)

  return s
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim()
}

/* ── Sentences ───────────────────────────────────────────────────────────── */

/**
 * Abbreviations whose full stop does not end a sentence. Splitting after
 * "e.g." puts a beat in the middle of a clause, which is exactly the
 * choppiness this whole file exists to avoid.
 */
const NOT_AN_END = /(?:\b(?:e\.g|i\.e|cf|vs|approx|Fig|Eq|No|Dr|Mr|Ms|St|etc|al)\.|\b[A-Z]\.)$/

/**
 * Splits prose into utterances on sentence boundaries.
 *
 * A synthesiser inserts a pause between utterances, so the split points are
 * the pauses. Sentences are the right unit: they are where a person would
 * pause anyway. Very long sentences are broken at a semicolon or a clause
 * comma instead, because a forty-second utterance cannot be paused or
 * rewound, not because the voice needs the rest.
 */
export function toUtterances(text: string, maxChars = 320): string[] {
  const out: string[] = []

  for (const para of text.split(/\n{2,}/)) {
    const block = para.replace(/\n/g, ' ').trim()
    if (!block) continue

    let buf = ''
    for (const piece of block.split(/(?<=[.!?])\s+/)) {
      const candidate = buf ? `${buf} ${piece}` : piece
      if (NOT_AN_END.test(buf.trim()) || /\b\d+\.$/.test(buf.trim())) {
        buf = candidate
        continue
      }
      if (buf) out.push(buf.trim())
      buf = piece
    }
    if (buf.trim()) out.push(buf.trim())
  }

  // Break anything still too long at a natural internal boundary.
  const sized: string[] = []
  for (const s of out) {
    if (s.length <= maxChars) {
      sized.push(s)
      continue
    }
    let rest = s
    while (rest.length > maxChars) {
      const window = rest.slice(0, maxChars)
      const cut = Math.max(window.lastIndexOf('; '), window.lastIndexOf(', '))
      const at = cut > maxChars * 0.4 ? cut + 1 : window.lastIndexOf(' ')
      if (at <= 0) break
      const piece = rest.slice(0, at).trim()
      // This is the middle of a sentence, cut for length alone. It ends on a
      // comma so the voice keeps its pitch up and sounds like it is still
      // going; a full stop here would close a sentence that has not ended,
      // and bare words would trail off flat.
      sized.push(/[.,;:!?]$/.test(piece) ? piece : `${piece},`)
      rest = rest.slice(at).trim()
    }
    if (rest) sized.push(rest)
  }

  // Every utterance ends on a mark the synthesiser can hear.
  //
  // Without one it reads the last words flat and simply stops, which is the
  // sound of a sentence that has not finished. A heading, a list item or a
  // line that trailed off into an equation all arrive here bare, and a full
  // stop is right for those: they are complete. The pieces cut for length
  // above already carry their own comma and keep it.
  return sized
    .filter((s) => /[A-Za-z0-9]/.test(s))
    .map((s) => (/[.!?,;:]$/.test(s) ? s : `${s}.`))
}

/** Everything the reader needs: prepared prose, split for speaking. */
export function prepare(md: string): { text: string; utterances: string[] } {
  const text = speakableFromMarkdown(md)
  return { text, utterances: toUtterances(text) }
}

/* ── Choosing a voice ────────────────────────────────────────────────────── */

export interface VoiceLike {
  name: string
  lang: string
  localService: boolean
  default?: boolean
}

/**
 * The macOS novelty voices. They are shipped alongside the real ones and are
 * indistinguishable in a raw list, so an app that just shows everything the
 * system reports will sooner or later have someone pick "Zarvox" and conclude
 * that read-aloud sounds like a broken robot. It does — that one is supposed
 * to.
 */
const NOVELTY =
  /\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Kathy|Princess|Bruce|Agnes|Victoria|Hysterical|Pipe Organ)\b/i

/**
 * Names the platforms give their better voices. These are the neural ones,
 * and they are the whole difference between prose and a robot.
 */
const PREMIUM = /\b(Premium|Enhanced|Neural|Natural|Siri|Google\s|Microsoft\s)/i

/**
 * Orders the system's voices best-first for reading a lesson.
 *
 * Local voices are preferred over network ones even when the network one is
 * nominally better: a remote voice introduces a pause before every utterance,
 * and this app is built to work with the laptop shut and the wifi off.
 */
export function rankVoices(voices: VoiceLike[], lang = 'en'): VoiceLike[] {
  const score = (v: VoiceLike): number => {
    let n = 0
    if (v.lang.toLowerCase().startsWith(lang.toLowerCase())) n += 100
    else if (v.lang.toLowerCase().startsWith('en')) n += 40
    if (PREMIUM.test(v.name)) n += 45
    if (v.localService) n += 25
    if (v.default) n += 5
    if (NOVELTY.test(v.name)) n -= 200
    return n
  }
  return [...voices]
    .map((v, i) => ({ v, i, s: score(v) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.v)
}

/** Voices worth showing her. Novelty voices and other languages are dropped. */
export function usableVoices(voices: VoiceLike[], lang = 'en'): VoiceLike[] {
  return rankVoices(voices, lang).filter(
    (v) => !NOVELTY.test(v.name) && v.lang.toLowerCase().startsWith('en'),
  )
}
