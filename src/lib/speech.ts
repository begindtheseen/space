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
  // Arrows. Inside a frame subscript an arrow was already read as "from" (see mathToWords);
  // anywhere else a left arrow is an assignment, "gets", as algorithms are read aloud.
  [/\\leftarrow\b|\\gets\b/g, ' gets '], [/\\Leftarrow\b/g, ' is implied by '],
  [/\\longrightarrow\b/g, ' goes to '], [/\\Longrightarrow\b|\\implies\b/g, ' implies '],
  [/\\Longleftrightarrow\b|\\iff\b/g, ' if and only if '], [/\\mapsto\b/g, ' maps to '],
  [/\\uparrow\b/g, ' up '], [/\\downarrow\b/g, ' down '],
  // Products and sums written with circles: a quaternion product, element-wise, exclusive-or.
  [/\\otimes\b/g, ' times '], [/\\odot\b/g, ' element-wise times '], [/\\oplus\b/g, ' x or '],
  [/\\ominus\b/g, ' circled minus '], [/\\bigoplus\b/g, ' the direct sum of '],
  // Relations.
  [/\\ne\b/g, ' is not equal to '], [/\\lt\b/g, ' is less than '], [/\\gt\b/g, ' is greater than '],
  [/\\lesssim\b/g, ' is at most about '], [/\\gtrsim\b/g, ' is at least about '],
  [/\\cong\b/g, ' is congruent to '], [/\\simeq\b/g, ' is approximately equal to '],
  [/\\perp\b/g, ' perpendicular '], [/\\nparallel\b/g, ' is not parallel to '], [/\\parallel\b/g, ' is parallel to '],
  [/\\mid\b/g, ' given '], [/\\nmid\b/g, ' does not divide '],
  // A matrix compared with zero is definite or semi-definite; anything else precedes or follows.
  [/\\succeq\s*0(?![\d.])/g, ' is positive semidefinite '], [/\\succ\s*0(?![\d.])/g, ' is positive definite '],
  [/\\preceq\s*0(?![\d.])/g, ' is negative semidefinite '], [/\\prec\s*0(?![\d.])/g, ' is negative definite '],
  [/\\succeq\b/g, ' succeeds or equals '], [/\\succ\b/g, ' succeeds '], [/\\preceq\b/g, ' precedes or equals '], [/\\prec\b/g, ' precedes '],
  // Sets and logic.
  [/\\varnothing\b|\\emptyset\b/g, ' the empty set '], [/\\cap\b/g, ' intersect '], [/\\cup\b/g, ' union '],
  [/\\subseteq\b/g, ' is a subset of or equal to '], [/\\subset\b/g, ' is a subset of '],
  [/\\supseteq\b/g, ' is a superset of or equal to '], [/\\supset\b/g, ' is a superset of '],
  [/\\notin\b/g, ' is not in '], [/\\ni\b/g, ' contains '],
  [/\\land\b|\\wedge\b/g, ' and '], [/\\lor\b|\\vee\b/g, ' or '], [/\\lnot\b|\\neg\b/g, ' not '],
  [/\\therefore\b/g, ' therefore '], [/\\because\b/g, ' because '],
  // Functions and operators.
  [/\\sinh\b/g, 'hyperbolic sine'], [/\\cosh\b/g, 'hyperbolic cosine'], [/\\tanh\b/g, 'hyperbolic tangent'],
  [/\\coth\b/g, 'hyperbolic cotangent'], [/\\sec\b/g, 'secant'], [/\\csc\b/g, 'cosecant'], [/\\cot\b/g, 'cotangent'],
  [/\\arg\b/g, 'the argument of'], [/\\limsup\b/g, 'the limit superior of'], [/\\liminf\b/g, 'the limit inferior of'],
  [/\\sup\b/g, 'the supremum of'], [/\\inf\b/g, 'the infimum of'], [/\\dim\b/g, 'the dimension of'],
  [/\\ker\b/g, 'the kernel of'], [/\\deg\b/g, 'the degree of'], [/\\gcd\b/g, 'the greatest common divisor of'],
  [/\\bmod\b/g, ' mod '], [/\\iiint\b/g, ' the triple integral of '], [/\\iint\b/g, ' the double integral of '],
  [/\\oiint\b/g, ' the closed surface integral of '],
  // Letters written in another style are still those letters.
  [/\\varpi\b/g, 'pi'], [/\\varrho\b/g, 'rho'], [/\\varsigma\b/g, 'sigma'], [/\\varkappa\b/g, 'kappa'],
  [/\\angle\b/g, ' angle '], [/\\top\b/g, ' transpose '], [/\\checkmark\b/g, ' check '],
  [/\\hbar\b/g, 'h bar'], [/\\aleph\b/g, 'aleph'],
  [/\\not\b/g, ' not '],
].map(([re, word]) => [new RegExp((re as RegExp).source.replace(/(?<!\\)\\b/g, '(?![A-Za-z])'), 'g'), word] as [RegExp, string])

/** Spacing, sizing and styling commands that carry no sound at all. */
const SILENT = /\\(?:left|right|middle|[bB]igg?[lrm]?|displaystyle|textstyle|scriptstyle|limits|nolimits|quad|qquad|phantom\s*\{[^{}]*\}|hphantom\s*\{[^{}]*\}|vphantom\s*\{[^{}]*\}|,|;|:|!)(?![A-Za-z])|\\[,;:!]|\\ /g

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

/** The sets and operators written in blackboard bold: \mathbb{R} is "the real numbers", \mathbb{E} "the expected value of". */
const BLACKBOARD: Record<string, string> = {
  R: 'the real numbers', Z: 'the integers', N: 'the natural numbers', Q: 'the rational numbers', C: 'the complex numbers',
  E: 'the expected value of', P: 'the probability of', S: 'the symmetric matrices', '1': 'the indicator of', I: 'the indicator of',
}

function blackboard(tex: string): string {
  return tex.replace(/\\mathbb\s*(?:\{\s*([A-Za-z0-9]+)\s*\}|([A-Za-z0-9]))/g, (_m, a: string | undefined, b: string | undefined) => {
    const k = (a ?? b)!
    // Two letters, like RP, are read letter by letter.
    return ` ${BLACKBOARD[k] ?? k.split('').join(' ')} `
  })
}

/**
 * Brackets that are an operation rather than grouping, the arrows and circles whose meaning
 * depends on where they sit, and an underbrace with its label.
 */
function delimiters(tex: string): string {
  let s = tex
    // A frame pair in a subscript: q_{N\leftarrow B} is "q from B to N"; an arrow anywhere else is read with the symbols.
    .replace(/_\s*\{([^{}]*?)\s*\\leftarrow\s*([^{}]*?)\}/g, (_m, to: string, from: string) => `_{from ${from.trim()} to ${to.trim()}}`)
    .replace(/_\s*\{([^{}]*?)\s*\\(?:rightarrow|to)\s*([^{}]*?)\}/g, (_m, from: string, to: string) => `_{from ${from.trim()} to ${to.trim()}}`)
    // The circled plus is Earth in a subscript (R⊕, ω⊕), and exclusive-or everywhere else.
    .replace(/_\s*(?:\{\s*\\oplus\s*\}|\\oplus(?![A-Za-z]))/g, ' sub Earth ')
    .replace(/\\vert(?![A-Za-z])/g, '|')
  // Ceiling, floor and angle brackets, innermost first.
  const pairs: [RegExp, (x: string) => string][] = [
    [/\\lceil((?:(?!\\lceil)[\s\S])*?)\\rceil/, (x) => ` the ceiling of ${x} `],
    [/\\lfloor((?:(?!\\lfloor)[\s\S])*?)\\rfloor/, (x) => ` the floor of ${x} `],
    [/\\langle((?:(?!\\langle)[\s\S])*?)\\rangle/, (x) => {
      // Two things inside are an inner product; one is an average.
      const parts = x.split(/,(?![^{]*\})/)
      return parts.length === 2 ? ` the inner product of ${parts[0]} and ${parts[1]} ` : ` the average of ${x} `
    }],
  ]
  for (const [re, say] of pairs) for (let guard = 0; guard < 32; guard++) {
    const m = re.exec(s)
    if (!m) break
    s = s.slice(0, m.index) + say(m[1]!) + s.slice(m.index + m[0].length)
  }
  // An underbrace names what is under it: "a, that is b,".
  for (let guard = 0; guard < 16; guard++) {
    const at = s.indexOf('\\underbrace')
    if (at < 0) break
    let i = at + '\\underbrace'.length
    while (s[i] === ' ') i++
    const body = readArg(s, i)
    if (!body) {
      s = s.slice(0, at) + s.slice(at + '\\underbrace'.length)
      continue
    }
    let j = body.end
    while (s[j] === ' ') j++
    let label: { body: string; end: number } | null = null
    if (s[j] === '_') {
      j++
      while (s[j] === ' ') j++
      label = readArg(s, j)
    }
    s = s.slice(0, at) + ` ${body.body}${label ? `, that is ${label.body},` : ''} ` + s.slice(label ? label.end : body.end)
  }
  return s.replace(/\\overbrace\s*/g, '')
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

/** Brackets that open before they close and all close: `G(j4)` yes, `B)P(B` no. */
function balanced(x: string): boolean {
  let depth = 0
  for (const c of x) {
    depth += c === '(' ? 1 : c === ')' ? -1 : 0
    if (depth < 0) return false
  }
  return depth === 0
}

export function mathToWords(tex: string): string {
  let s = tex

  s = environments(s)
  s = boundedOperators(s)
  s = vectorDots(s)
  // Upright text first, so a transpose written `^{\mathsf{T}}` is still seen
  // as one, and an apostrophe in `\text{…}` is plainly inside a word.
  // A thousands comma, `6{,}000`, is part of the number.
  s = s.replace(/(\d)\{,\}(?=\d)/g, '$1')
  s = mathUnitsToWords(s)
  s = blackboard(s)
  s = delimiters(s)
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
  s = rewrite(s, 'mathfrak', 1, (a) => mathToWords(a))
  s = rewrite(s, 'mathtt', 1, (a) => a)
  s = rewrite(s, 'mathit', 1, (a) => a)
  s = rewrite(s, 'mathbin', 1, (a) => mathToWords(a))
  s = rewrite(s, 'mathrel', 1, (a) => mathToWords(a))
  s = rewrite(s, 'boxed', 1, (a) => mathToWords(a))
  s = rewrite(s, 'reflectbox', 1, (a) => mathToWords(a))
  s = rewrite(s, 'underline', 1, (a) => mathToWords(a))
  s = rewrite(s, 'overline', 1, (a) => `${mathToWords(a)} bar`)
  s = rewrite(s, 'tilde', 1, (a) => `${mathToWords(a)} tilde`)
  s = rewrite(s, 'widetilde', 1, (a) => `${mathToWords(a)} tilde`)
  s = rewrite(s, 'widehat', 1, (a) => `${mathToWords(a)} hat`)
  s = rewrite(s, 'dddot', 1, (a) => `${mathToWords(a)} triple dot`)
  s = rewrite(s, 'binom', 2, (a, b) => `${mathToWords(a)} choose ${mathToWords(b)}`)
  s = rewrite(s, 'xrightarrow', 1, (a) => `goes, by ${mathToWords(a)}, to`)
  s = rewrite(s, 'pmod', 1, (a) => `mod ${mathToWords(a)}`)

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
  // Bars around a short term are its size: |0.7 y| is "the absolute value of 0.7 y".
  // Brackets inside rule out a conditional like P(A|B) … P(B|A).
  s = s.replace(/(?<!\\)\|([^|\n]{1,40}?)(?<!\\)\|/g, (m, x: string) => (balanced(x) ? ` the absolute value of ${x} ` : m))

  // Subscripts.
  // Two-letter labels, and three with no vowel, are initials: omega_{nb} is "omega sub N B", not "sub nib".
  s = s.replace(/_\{\s*([a-z]{2}|[b-df-hj-np-tv-z]{3})\s*\}/g, (_m, p: string) => ` sub ${p.toUpperCase().split('').join(' ')} `)
  s = s.replace(/_\{((?:[^{}]|\{[^{}]*\})*)\}/g, (_m, p: string) => ` sub ${mathToWords(p)} `)
  // A named symbol after the underscore has been spelled out by now: `v_\perp`.
  s = s.replace(/_\s+([A-Za-z]+)/g, (_m, p: string) => ` sub ${SUB_WORDS[p] ?? p} `)
  s = s.replace(/_\s*(\\[A-Za-z]+)/g, ' sub $1 ')
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

interface Said {
  name: [string, string]
  power: number
}

/** Each unit written upright in an equation, as [one, many]. */
const MATH_UNITS: Record<string, [string, string]> = {
  s: ['second', 'seconds'], ms: ['millisecond', 'milliseconds'], 'µs': ['microsecond', 'microseconds'],
  ns: ['nanosecond', 'nanoseconds'], min: ['minute', 'minutes'], h: ['hour', 'hours'], hr: ['hour', 'hours'],
  d: ['day', 'days'], day: ['day', 'days'], yr: ['year', 'years'],
  m: ['meter', 'meters'], km: ['kilometer', 'kilometers'], cm: ['centimeter', 'centimeters'],
  mm: ['millimeter', 'millimeters'], 'µm': ['micrometer', 'micrometers'], nm: ['nanometer', 'nanometers'],
  AU: ['astronomical unit', 'astronomical units'], ft: ['foot', 'feet'],
  kg: ['kilogram', 'kilograms'], g: ['gram', 'grams'], mg: ['milli g', 'milli g'], t: ['metric ton', 'metric tons'],
  lb: ['pound', 'pounds'], lbf: ['pound of force', 'pounds of force'],
  N: ['newton', 'newtons'], mN: ['millinewton', 'millinewtons'], kN: ['kilonewton', 'kilonewtons'],
  MN: ['meganewton', 'meganewtons'], Pa: ['pascal', 'pascals'], kPa: ['kilopascal', 'kilopascals'],
  MPa: ['megapascal', 'megapascals'], GPa: ['gigapascal', 'gigapascals'], bar: ['bar', 'bar'],
  atm: ['atmosphere', 'atmospheres'], psi: ['P S I', 'P S I'],
  J: ['joule', 'joules'], kJ: ['kilojoule', 'kilojoules'], MJ: ['megajoule', 'megajoules'],
  W: ['watt', 'watts'], kW: ['kilowatt', 'kilowatts'], MW: ['megawatt', 'megawatts'],
  V: ['volt', 'volts'], A: ['amp', 'amps'], mA: ['milliamp', 'milliamps'], K: ['kelvin', 'kelvin'],
  nT: ['nanotesla', 'nanotesla'], 'Ω': ['ohm', 'ohms'],
  rad: ['radian', 'radians'], mrad: ['milliradian', 'milliradians'], 'µrad': ['microradian', 'microradians'],
  deg: ['degree', 'degrees'], mdeg: ['millidegree', 'millidegrees'], arcsec: ['arcsecond', 'arcseconds'],
  rpm: ['R P M', 'R P M'], rev: ['revolution', 'revolutions'],
  Hz: ['hertz', 'hertz'], kHz: ['kilohertz', 'kilohertz'], MHz: ['megahertz', 'megahertz'], GHz: ['gigahertz', 'gigahertz'],
  dB: ['decibel', 'decibels'], decade: ['decade', 'decades'], ppm: ['part per million', 'parts per million'],
  B: ['byte', 'bytes'], bytes: ['byte', 'bytes'], KB: ['kilobyte', 'kilobytes'], kB: ['kilobyte', 'kilobytes'],
  KiB: ['kibibyte', 'kibibytes'], MB: ['megabyte', 'megabytes'], MiB: ['mebibyte', 'mebibytes'],
  GB: ['gigabyte', 'gigabytes'], TB: ['terabyte', 'terabytes'], bit: ['bit', 'bits'], bits: ['bit', 'bits'],
  FLOP: ['flop', 'flops'], GFLOP: ['gigaflop', 'gigaflops'],
}

/**
 * An upright unit — `\mathrm{m/s^2}`, `\mathrm{kg\,m^2}`, `\mathrm{s^{-1}}` —
 * as words: "meters per second squared", "kilogram meters squared", "per
 * second". Null when any part of it is not a unit, so `\mathrm{diag}` and
 * `\text{true}` are left to be read as the words they are.
 */
export function mathUnitWords(unit: string, one = false): string | null {
  const parts = unit
    .replace(/\\mu\s*/g, 'µ')
    .replace(/\\Omega\b/g, 'Ω')
    .split('/')
  const top: Said[] = []
  const bottom: Said[] = []
  for (const [i, part] of parts.entries()) {
    const factors = part.replace(/\\[,;: !]|\\cdot|·|~/g, ' ').trim().split(/\s+/).filter(Boolean)
    if (!factors.length) return null
    for (const f of factors) {
      const m = /^([A-Za-zµΩ]+)(?:\^\s*\{?\s*(-?\d)\s*\}?)?$/.exec(f)
      if (!m || !Object.hasOwn(MATH_UNITS, m[1]!)) return null
      const name = MATH_UNITS[m[1]!]!
      const power = Number(m[2] ?? 1)
      ;(i === 0 && power > 0 ? top : bottom).push({ name, power: Math.abs(power) })
    }
  }
  const say = (u: Said, many: boolean) =>
    `${u.name[many ? 1 : 0]}${u.power === 2 ? ' squared' : u.power === 3 ? ' cubed' : u.power > 1 ? ` to the power of ${u.power}` : ''}`
  const head = top.map((u, i) => say(u, i === top.length - 1 && !one)).join(' ')
  const tail = bottom.map((u) => `per ${say(u, false)}`).join(' ')
  return [head, tail].filter(Boolean).join(' ')
}

const UPRIGHT_RE = /\\(?:mathrm|text)(?:\s*\{((?:[^{}]|\{[^{}]*\})*)\}|\s+([A-Za-z]+)\b)/g
const MATH_SPACE = String.raw`(?:\\[,;: ]|~|\s)*`

/**
 * Units in an equation. With `\mathrm` simply unwrapped, `370\,\mathrm{m}` was
 * read "370 m" and `9.8\,\mathrm{m/s^2}` "9.8 m divided by s squared". A
 * one-letter unit is only a unit after a number (or after the thin space
 * that sets one off), so `t_\mathrm{s}` and `\mathrm{d}t` keep their letters.
 */
function mathUnitsToWords(tex: string): string {
  return tex.replace(UPRIGHT_RE, (whole, braced: string | undefined, word: string | undefined, at: number, all: string) => {
    const unit = braced ?? word!
    const before = all.slice(0, at)
    const after = all.slice(at + whole.length)
    const bare = before.replace(new RegExp(`${MATH_SPACE}$`), '')
    // A label, not a unit: v_{\mathrm{esc}}, \mathrm{PM}_{\mathrm{rad}}, \mathrm{diag}(…).
    if (/(?:[_^]\s*\{?)$/.test(bare) || /^\s*[_(]/.test(after)) return whole
    // Degrees per second is read by the degree rule.
    if (/(?:°|\\circ)\s*\/$/.test(bare) && /^s(?:\^\{?2\}?)?$/.test(unit.trim())) return whole
    const spaced = bare.length < before.length && /\\[,;: ]|~/.test(before.slice(bare.length))
    const number = /(?<![\w.^])(\d[\d,{}]*(?:\.\d+)?)$/.exec(bare)?.[1]
    const perSlash = bare.endsWith('/')
    const short = unit.trim().length === 1
    if (short && !number && !spaced && !perSlash && !/[})]$/.test(bare)) return whole
    const words = mathUnitWords(unit, number === '1' || perSlash || /\bper$/.test(bare))
    if (!words) return whole
    return ` ${perSlash ? 'per ' : ''}${words} `
  }).replace(/\/\s+per /g, ' per ')
}


/**
 * Unit abbreviations, expanded only where they stand alone as a word so that
 * "m" inside a variable name is left alone.
 */
const UNITS: [RegExp, string][] = [
  [/\bkm\/s\b/g, 'kilometers per second'],
  [/\bkg\/s\b/g, 'kilograms per second'],
  [/\bN\/m\b/g, 'newtons per meter'],
  [/\bm\/s\^?2\b/g, 'meters per second squared'],
  [/\bm\/s\b/g, 'meters per second'],
  [/\bkm\b/g, 'kilometers'],
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

/* ── Code, abbreviations and the symbols prose leaves in ─────────────────── */

/**
 * Inline code as a person reads it aloud. `std::vector::push_back` came out
 * as "std colon colon vector colon colon push underscore back", `p->next` as
 * "p minus greater than next".
 */
/** Code that is one symbol on its own, as it is said: "`>` should be `>>`" is "greater than … double greater than". */
const SYMBOL_ALONE: Record<string, string> = {
  '/': 'slash', '//': 'double slash', '\\': 'backslash', '-': 'dash', '--': 'double dash', '>': 'greater than',
  '>>': 'double greater than', '<': 'less than', '<<': 'double less than', '|': 'pipe', '||': 'or', '&': 'and',
  '&&': 'and', '.': 'dot', '..': 'dot dot', './': 'dot slash', '../': 'dot dot slash', '~': 'tilde', '~/': 'home',
  '*': 'star', '**': 'double star', '#': 'hash', '$': 'dollar', '=': 'equals', '==': 'equals equals',
  '!=': 'not equals', ':': 'colon', ';': 'semicolon', ',': 'comma', '+': 'plus', '%': 'percent', '^': 'caret',
  '@': 'at', '?': 'question mark', '!': 'exclamation mark', '(': 'open bracket', ')': 'close bracket',
  '()': 'brackets', '[': 'open square bracket', ']': 'close square bracket', '[]': 'square brackets',
  '{': 'open brace', '}': 'close brace', '{}': 'braces', '"': 'double quote', "'": 'single quote', '`': 'backtick',
  "'\\n'": 'newline', '"\\n"': 'newline', '\\n': 'newline', '\\t': 'tab', '2>': 'two greater than', '->': 'arrow',
}

/** Two-letter words that are words: everything else that short is read out letter by letter. */
const SHORT_WORDS = new Set(['if', 'in', 'is', 'or', 'as', 'do', 'go', 'no', 'on', 'to', 'up', 'at', 'by', 'of', 'be', 'we', 'it', 'me', 'my', 'so', 'an', 'am', 'us', 'hi', 'oh', 'ok'])

/** Letters, said as their names: `eu` is "E U", `d` is "D". */
const spell = (w: string) => w.toUpperCase().split('').join(' ')

export function codeToWords(code: string): string {
  const alone = code.trim()
  if (SYMBOL_ALONE[alone]) return SYMBOL_ALONE[alone]!
  // A letter or two on its own ("it is missing a `d`", "`eu` should be `ue`") is spelled, not sounded out.
  if (/^[A-Za-z]$/.test(alone) || (/^[a-z]{2}$/.test(alone) && !SHORT_WORDS.has(alone))) return spell(alone)
  // A command line's flags: `ls -la` is "L S dash L A", `git log --oneline` "dash dash one line",
  // `[ "$a" -eq 1 ]` "dash E Q". Not in an expression, where a dash is a minus: `y = -x`, `f(-1)`.
  const command = !/[=(]/.test(code)
  // A compiler warning flag reads the same anywhere: -Wall is "dash W all", -Wextra "dash W extra".
  let c = code.replace(/(^|\s)-W([a-z][\w-]*)/g, (_m, pre: string, w: string) => `${pre}dash W ${w.replace(/-/g, ' ')}`)
  if (command) {
    c = c
      .replace(/(^|\s)--([A-Za-z][\w-]*)/g, (_m, pre: string, name: string) => `${pre}dash dash ${name.replace(/-/g, ' ')}`)
      .replace(/(^|\s)-([A-Za-z]{1,3})(?![\w-])/g, (_m, pre: string, f: string) => `${pre}dash ${f.toUpperCase().split('').join(' ')}`)
      // find's long flags have one dash: -type, -iname, -mtime.
      .replace(/(^|\s)-([a-z]{4,})(?![\w-])/g, '$1dash $2')
      // A lone dash is a place (cd -) or standard input (cat -).
      .replace(/(^|\s)-(?=\s|$)/g, '$1dash')
      // Where the output goes: > into a file, >> onto its end, 2> the errors, | into the next command.
      .replace(/(^|\s)2>&1(?=\s|$)/g, '$1two greater than and one')
      .replace(/(^|\s)2>>?(?=\s|\S)/g, (_m, pre: string) => `${pre}two greater than `)
      .replace(/\s*>>\s*/g, ' double greater than ')
      .replace(/(^|[^\w-=>])>(?![=>])\s*/g, '$1 greater than ')
      .replace(/\s+<(?![<=])\s+/g, ' less than ')
      .replace(/\s+\|(?:\s+|(?=…|$))/g, ' pipe ')
      // Paths: ../notes is "dot dot slash notes", /etc "slash etc", logs/2026 "logs slash 2026", and `git add .` ends in "dot".
      .replace(/(^|\s|\/)\.\.(?=\/|\s|$)/g, '$1dot dot')
      .replace(/(^|\s)\.\/(?=\S)/g, '$1dot slash ')
      .replace(/(^|\s)\.(?=\s|$)/g, '$1dot')
      .replace(/\/\//g, ' double slash ')
      .replace(/(?<!~)\//g, ' slash ')
    // Commands too short to say, like mv, cp, ls: letter by letter, as people say them.
    c = c.replace(/(?<![\w.\\-])([bcdfghjklmnpqrstvwxz]{2,3})(?![\w.':<-])/g, (w: string) => (CODE_SHORTS.has(w) ? w : spell(w)))
  }
  return (
    c
      // Escapes inside strings: "a\nb" is "a newline b".
      .replace(/\\n/g, ' newline ')
      .replace(/\\t/g, ' tab ')
      // HEAD~1 is "HEAD tilde one"; ~/notes is "home slash notes".
      .replace(/~\//g, 'home slash ')
      .replace(/~/g, ' tilde ')
      // Template arguments: vector<int> is "vector of int".
      .replace(/(\w)<([\w:, *&]+)>/g, '$1 of $2')
      .replace(/\bstd::/g, 'standard ')
      .replace(/::/g, ' ')
      .replace(/->/g, ' arrow ')
      .replace(/\+\+/g, ' plus plus ')
      .replace(/--(?=\w)|(?<=\w)--/g, ' minus minus ')
      .replace(/==/g, ' equals equals ')
      .replace(/!=/g, ' not equals ')
      .replace(/<=/g, ' less than or equal to ')
      .replace(/>=/g, ' greater than or equal to ')
      .replace(/&&/g, ' and ')
      .replace(/\|\|/g, ' or ')
      .replace(/\+=/g, ' plus equals ')
      .replace(/-=/g, ' minus equals ')
      .replace(/\*=/g, ' times equals ')
      .replace(/(^|[\s(])!(?=\w)/g, '$1not ')
      .replace(/\s%\s/g, ' mod ')
      .replace(/\s&\s/g, ' and ')
      .replace(/\s<\s/g, ' less than ')
      .replace(/\s>\s/g, ' greater than ')
      .replace(/\s=\s/g, ' equals ')
      .replace(/#include\b/g, 'hash include')
      // A call's empty brackets are silent: push_back() is "push back".
      .replace(/\(\)/g, '')
      .replace(/(?<=[A-Za-z0-9_)\]])\.(?=[A-Za-z_])/g, ' dot ')
      .replace(/\s\*\s/g, ' times ')
      .replace(/\*/g, ' star ')
      // What followed a star, or starts a hidden file: *.conf is "star dot conf", .gitignore "dot gitignore".
      .replace(/(^|\s)\.(?=[A-Za-z_])/g, '$1dot ')
      .replace(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g, (id) => id.toLowerCase())
      .replace(/(?<=[A-Za-z0-9])_(?=[A-Za-z0-9])/g, ' ')
      // A leading or trailing underscore (_pass, data_) has no sound.
      .replace(/_/g, ' ')
      .replace(/[;{}]/g, ' ')
  )
}

/** Tech names the voice guesses at, spelled the way people say them. */
const SAID_AS: [RegExp, string][] = [
  [/\bC\+\+(?=\d)/g, 'C plus plus '], [/\bC\+\+/g, 'C plus plus'], [/\bg\+\+/g, 'G plus plus'], [/\bC#/g, 'C sharp'],
  [/\blibstdc\+\+/g, 'lib standard C plus plus'], [/\bJSF\+\+/g, 'J S F plus plus'],
  [/\b(\w+)\+\+/g, '$1 plus plus'],
  [/\bstd::/g, 'standard '], [/(?<=\w)::(?=\w)/g, ' '],
  [/\bNumPy\b|\bnumpy\b/g, 'num pie'], [/\bSciPy\b|\bscipy\b/g, 'sigh pie'],
  [/\b[Mm]atplotlib\b/g, 'mat plot lib'], [/\bpytest\b/g, 'pie test'], [/\bPyPI\b/g, 'pie P I'],
  [/\bsudo\b/g, 'soo doo'], [/\bstdout\b/g, 'standard out'], [/\bstdin\b/g, 'standard in'],
  [/\bstderr\b/g, 'standard error'], [/\bprintf\b/g, 'print F'], [/\bcout\b/g, 'see out'],
  [/\bcin\b/g, 'see in'], [/\bJSON\b/g, 'Jason'], [/\bGUI\b/g, 'gooey'], [/\bASCII\b/g, 'ask ee'],
  [/\bLaTeX\b/g, 'lay tech'], [/\bMATLAB\b/g, 'mat lab'], [/\bgcc\b/g, 'G C C'], [/\bgdb\b/g, 'G D B'],
  [/\b[Cc][Mm]ake\b|\bcmake\b/g, 'C make'], [/\bnpm\b/g, 'N P M'], [/\bYAML\b/g, 'yam ul'],
  [/\bSQLite\b/g, 'S Q L light'], [/\bPostgreSQL\b/g, 'post gress Q L'], [/\biff\b/g, 'if and only if'],
  [/\bNaN\b/g, 'not a number'],
]

/**
 * Code words and names the phonemiser gets wrong, found by running every lesson's spoken text
 * through it and listening for the words it had to guess: `str` was spelled "S T R", `succ`
 * came out as "suck", `sizeof` as "size-i-off", `Eigen` as "eye-jen", `enum` as "in-um".
 * Each is how a programmer says it aloud.
 */
const CODE_WORDS: [RegExp, string][] = (
  [
    // C and C++.
    ['str', 'string'], ['ptr', 'pointer'], ['nullptr', 'null pointer'], ['sizeof', 'size of'], ['alignof', 'align of'],
    ['noexcept', 'no except'], ['constexpr', 'const expression'], ['consteval', 'const eval'], ['constinit', 'const init'],
    ['decltype', 'decl type'], ['typename', 'type name'], ['typedef', 'type def'], ['expr', 'expression'],
    ['enum', 'ee num'], ['enums', 'ee nums'], ['nullopt', 'null opt'],
    ['malloc', 'mal lock'], ['calloc', 'cal lock'], ['realloc', 'ree al lock'], ['alloc', 'al lock'],
    ['memcpy', 'mem copy'], ['memmove', 'mem move'], ['memset', 'mem set'], ['memcmp', 'mem compare'],
    ['strlen', 'string length'], ['strcpy', 'string copy'], ['strncpy', 'string N copy'], ['strcmp', 'string compare'],
    ['strcat', 'string cat'], ['substr', 'sub string'], ['strftime', 'string F time'], ['strptime', 'string P time'],
    ['printf', 'print F'], ['sprintf', 'S print F'], ['snprintf', 'S N print F'], ['fprintf', 'F print F'], ['scanf', 'scan F'],
    ['println', 'print line'], ['endl', 'end line'], ['cerr', 'see err'], ['getline', 'get line'], ['argv', 'arg V'], ['argc', 'arg C'],
    ['succ', 'successor'], ['impl', 'imple'], ['usize', 'you size'], ['isize', 'eye size'], ['fn', 'fun'],
    ['Eigen', 'eye gen'], ["Eigen's", "eye gen's"],
    // Python.
    ['elif', 'el if'], ['async', 'ay sink'], ['asyncio', 'ay sink I O'], ['eval', 'ee val'], ['isinstance', 'is instance'],
    ['kwargs', 'keyword args'], ['stdlib', 'standard lib'], ['heapq', 'heap Q'], ['iterable', 'it er a bull'], ['iterables', 'it er a bulls'],
    ['pyproject', 'pie project'], ['mypy', 'my pie'], ['pybind11', 'pie bind eleven'], ['venv', 'V env'], ['pipx', 'pip X'],
    ['inf', 'infinity'], ['nan', 'not a number'], ['sqrt', 'square root'], ['linalg', 'lin alg'],
    ['allclose', 'all close'], ['julianday', 'julian day'], ['unixepoch', 'unix epoch'], ['sys', 'sis'],
    // Everyday short names.
    ['idx', 'index'], ['qty', 'quantity'], ['avg', 'average'], ['addr', 'address'], ['cfg', 'config'], ['cmd', 'command'],
    ['tmp', 'temp'], ['src', 'source'], ['dst', 'destination'], ['obj', 'object'], ['inv', 'inverse'], ['recv', 'receive'],
    ['adj', 'adjacency'], ['txt', 'text'], ['usr', 'user'], ['pid', 'P I D'], ['imu', 'I M U'],
    ['du', 'D U'], ['cwnd', 'congestion window'], ['uniq', 'unique'], ['inode', 'eye node'], ['inodes', 'eye nodes'],
    ['regex', 'rej ex'], ['regexes', 'rej exes'], ['regexp', 'rej exp'], ['oneline', 'one line'], ['reflog', 'ref log'],
    // The shell.
    ['mkdir', 'make dir'], ['rmdir', 'remove dir'], ['chmod', 'change mod'], ['chown', 'change own'], ['xargs', 'X args'],
    ['pwd', 'P W D'], ['wc', 'W C'], ['ssh', 'S S H'], ['scp', 'S C P'], ['tmux', 'T mux'],
    ['mv', 'M V'], ['cp', 'C P'], ['rm', 'R M'], ['ls', 'L S'], ['cd', 'C D'], ['ps', 'P S'], ['md', 'M D'],
    ['README', 'read me'], ['gitignore', 'git ignore'], ['stash', 'stash'],
    // Formats and tools.
    ['json', 'Jason'], ['yaml', 'yam ul'], ['toml', 'tom ul'], ['TOML', 'tom ul'], ['Postgres', 'post gress'],
    ['MySQL', 'my S Q L'], ['KiB', 'kibibytes'], ['MiB', 'mebibytes'], ['GiB', 'gibibytes'], ['kPa', 'kilopascals'],
    ['sha256', 'shah two fifty six'], ['SHA256', 'shah two fifty six'], ['SHA', 'shah'],
  ] as [string, string][]
).map(([w, say]) => [new RegExp(`(?<![\\w-])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w]|'[a-rt-z])`, 'g'), say])

/** Consonant-only names with a spoken form of their own (in CODE_WORDS): not spelled out letter by letter. */
const CODE_SHORTS = new Set(['std', 'str', 'ptr', 'tmp', 'src', 'dst', 'cfg', 'cmd', 'txt', 'pwd', 'wc', 'ssh', 'scp', 'fn', 'sqrt', 'md', 'mv', 'cp', 'rm', 'ls', 'cd', 'ps'])

/** Lowercase pairs and triples that the phonemiser reads as Roman numerals: `I_xx` is not "I twenty". */
const NOT_ROMAN = /(?<![\w'])(ii|iii|xx|xxx|jj|kk)(?![\w'])/g

/** List markers in brackets, "(ii)", are counted, not spelled. */
const ROMAN_LIST: Record<string, string> = { ii: 'two', iii: 'three', iv: 'four', vi: 'six', vii: 'seven', viii: 'eight', ix: 'nine' }

/** The ordinal of a letter: the nth term is "the enth term". */
const LETTER_ORDINAL: Record<string, string> = { n: 'enth', k: 'kayth', i: 'eyeth', j: 'jayth', m: 'emth', p: 'peeth', r: 'arth', t: 'teeth' }

const ABBREVIATIONS: [RegExp, string][] = [
  [/\bvs\.?(?=\s|$|[,;:)])/g, 'versus'], [/(?<=[a-z])-vs-(?=[a-z])/g, ' versus '], [/\bVs\.?(?=\s)/g, 'Versus'],
  [/\be\.g\.,?/g, 'for example,'], [/\bi\.e\.,?/g, 'that is,'], [/\betc\./g, 'et cetera.'],
  [/\bapprox\b\.?/g, 'approximately'], [/\bcf\./g, 'compare'], [/\bw\.r\.t\.?/g, 'with respect to'],
  [/\ba\.k\.a\.?/g, 'also known as'], [/\bFig\.(?=\s*\d)/g, 'Figure'], [/\bEq\.(?=\s*\d)/g, 'Equation'],
  [/\bNo\.(?=\s*\d)/g, 'number'],
]

/** Units written after a number: "84.4 min", "5073 s", "400 m", "3 GB". */
const NUMBER_UNITS: [string, string][] = [
  ['µs', 'microseconds'], ['us', 'microseconds'], ['ns', 'nanoseconds'], ['s', 'seconds'], ['sec', 'seconds'],
  ['min', 'minutes'], ['h', 'hours'], ['hr', 'hours'], ['hrs', 'hours'], ['yr', 'years'],
  ['m', 'meters'], ['cm', 'centimeters'], ['mm', 'millimeters'], ['µm', 'micrometers'], ['ft', 'feet'],
  ['mi', 'miles'], ['nmi', 'nautical miles'], ['mph', 'miles per hour'], ['km/h', 'kilometers per hour'],
  ['N', 'newtons'], ['MN', 'meganewtons'], ['N·m', 'newton meters'], ['Nm', 'newton meters'], ['lbf', 'pounds of force'],
  ['lb', 'pounds'], ['t', 'metric tons'], ['g', 'grams'], ['W', 'watts'], ['kW', 'kilowatts'], ['MW', 'megawatts'],
  ['V', 'volts'], ['mA', 'milliamps'], ['Ω', 'ohms'], ['K', 'kelvin'], ['psi', 'P S I'], ['atm', 'atmospheres'],
  ['kHz', 'kilohertz'], ['MHz', 'megahertz'], ['GHz', 'gigahertz'], ['dB', 'decibels'],
  ['KB', 'kilobytes'], ['kB', 'kilobytes'], ['MB', 'megabytes'], ['GB', 'gigabytes'], ['TB', 'terabytes'],
  ['kbps', 'kilobits per second'], ['Mbps', 'megabits per second'], ['Gbps', 'gigabits per second'],
]
const esc = (u: string) => u.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const NUMBER_UNIT_RE = new RegExp(
  String.raw`(?<![\w.])(\d[\d,]*(?:\.\d+)?)\s?(${[...NUMBER_UNITS].sort((a, b) => b[0].length - a[0].length).map(([u]) => esc(u)).join('|')})(?![\w/^²³])`,
  'g',
)
const NUMBER_UNIT = new Map(NUMBER_UNITS)

/**
 * Units after numbers, in prose only: inside an equation "2t" is two times t
 * and "5s" is the Laplace variable, so maths and inline code are left alone.
 * "1 seconds" is read "1 second".
 */
/** A unit after a number, said: "1 second", "3 seconds". */
function unitWord(n: string, u: string): string {
  const word = NUMBER_UNIT.get(u)!
  if (n !== '1' || word.includes(' per ')) return word
  return word === 'feet' ? 'foot' : word.replace(/s$/, '')
}

export function unitsToWords(text: string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|`[^`\n]+`)/)
  return parts
    .map((part, i) => {
      if (i % 2) return part
      // "$15$ m": the number is in the equation and its unit in the prose after it.
      const math = parts[i - 1] ?? ''
      const out = /\d\$$/.test(math)
        ? part.replace(/^\s?([^\s\d.,;:)]+)(?![\w/^²³])/, (m, u: string) =>
            NUMBER_UNIT.has(u) ? ` ${unitWord(math === '$1$' ? '1' : '', u)}` : m,
          )
        : part
      return out.replace(NUMBER_UNIT_RE, (_m, n: string, u: string) => `${n} ${unitWord(n, u)}`)
    })
    .join('')
}

const SIGNS: [RegExp, string][] = [
  [/(\d)\s?%/g, '$1 percent'], [/(?<=\w)~(?=\d)/g, ' tilde '], [/~\s?(?=\d|Mach\b)/g, 'about '], [/≈/g, ' about '],
  [/≤/g, ' less than or equal to '], [/≥/g, ' greater than or equal to '], [/≠/g, ' not equal to '],
  [/±/g, ' plus or minus '], [/→/g, ' to '], [/←/g, ' from '], [/↔/g, ' and '], [/√/g, ' the square root of '],
  [/÷/g, ' divided by '], [/−(?=\s?\d)/g, ' minus '], [/§\s?/g, 'section '], [/′/g, ' prime'],
  [/Δ/g, 'delta '], [/σ/g, 'sigma'], [/ω/g, 'omega'], [/α/g, 'alpha'], [/β/g, 'beta'], [/π/g, 'pi'],
  [/χ/g, 'chi'], [/µ/g, 'mu'], [/Ω/g, 'omega'],
  [/⌀/g, 'diameter '], [/Ⓜ/g, ' circled M '], [/Ⓛ/g, ' circled L '], [/Ⓕ/g, ' circled F '],
  [/Ⓟ/g, ' circled P '], [/⌖/g, ' position '], [/[●○✓]/g, ' '],
  [/[₀₁₂₃₄₅₆₇₈₉]/g, ''],
  // A range: 5–10 is "5 to 10".
  [/(\d)\s?–\s?(?=\d)/g, '$1 to '],
  [/\s&\s/g, ' and '],
  // Evaluated in a frame: "d A over d t | sub inertial".
  [/\s\|\s(?=sub\b)/g, ' '], [/\|\|([^|\n]+)\|\|/g, 'the norm of $1'], [/\s\|\s/g, ', '],
  // A markdown heading marker left mid-paragraph.
  [/\s#{2,6}\s/g, '. '],
  // A differential: "m dv equals v sub e dm" is "m d v equals v sub e d m".
  [/\bd([tvxyzrsmθ])\b/g, 'd $1'],
]

/** Abbreviations, units, tech names and signs that reach the voice as prose. */
export function proseToWords(text: string): string {
  let s = text
  const subs = '₀₁₂₃₄₅₆₇₈₉'
  s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => String(subs.indexOf(c)))
  // Names with underscores outside code: ROW_NUMBER is "row number", sat_id "sat id".
  s = s
    .replace(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g, (id) => id.toLowerCase().replace(/_/g, ' '))
    .replace(/\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g, (id) => id.replace(/_/g, ' '))
  // A file named in plain text, as in “notes.txt” or about.html: its dot is said, like in code.
  s = s.replace(/(?<![\w/.])([A-Za-z_][\w-]*)\.(txt|md|py|js|ts|tsx|log|csv|json|cfg|conf|sh|html|css|cpp|hpp|h|c|sql|yml|yaml|toml|bin|tmp|bak|png|zip)\b/g, '$1 dot $2')
  // A flag named in plain text: "no -r needed".
  s = s.replace(/(?<!\b(?:equals|plus|minus|times|over|than|by|of|is|to|and|or|at)\s*)(^|\s)-([a-z]{1,2})(?=[\s,.;)]|$)/g, (_m, pre: string, f: string) => `${pre}dash ${f.toUpperCase().split('').join(' ')}`)
  for (const [re, w] of SAID_AS) s = s.replace(re, w)
  for (const [re, w] of CODE_WORDS) s = s.replace(re, w)
  s = s
    // Scientific notation: 1e-9 is "1 times ten to the minus 9"; the phonemiser dropped the minus.
    .replace(/(?<![\w.])(\d+(?:\.\d+)?)[eE]([-+]?)(\d+)(?![\w.])/g, (_m, m: string, sign: string, e: string) =>
      `${m} times ten to the ${sign === '-' ? 'minus ' : ''}${e}`,
    )
    // Only where a list would put one, and never a lone i, v or x: f(x) is not "f of ten".
    .replace(/(^|[\s,;:])\((ii|iii|iv|vi|vii|viii|ix)\)/g, (_m, pre: string, r: string) => `${pre}(${ROMAN_LIST[r]})`)
    .replace(NOT_ROMAN, (r: string) => r.split('').join(' '))
    .replace(/(?<![\w'])([nkijmprt])(?:-| )?th(?![\w'])/g, (_m, l: string) => LETTER_ORDINAL[l]!)
    // Superscript letters left in prose: 2ⁿ is "2 to the n".
    .replace(/ⁿ/g, ' to the n ').replace(/ⁱ/g, ' to the i ')
    .replace(/[₍₎]/g, ' ').replace(/₋/g, ' minus ').replace(/₊/g, ' plus ')
    .replace(/[ₐₑₒₓₔₕₖₗₘₙₚₛₜᵢⱼ]/g, (c) => 'aeoxəhklmnpstij'['ₐₑₒₓₔₕₖₗₘₙₚₛₜᵢⱼ'.indexOf(c)]!)
  for (const [re, w] of ABBREVIATIONS) s = s.replace(re, w)
  for (const [re, w] of SIGNS) s = s.replace(re, w)
  return s.replace(/ {2,}/g, ' ').replace(/ +([.,;:!?])/g, '$1')
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

  // Units after numbers, while maths and inline code can still be told apart.
  s = unitsToWords(s)

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
  s = s.replace(/`([^`\n]+)`/g, (_m, code: string) => ` ${codeToWords(code)} `)

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
  s = proseToWords(s)

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
