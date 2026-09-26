/* ============================================================================
   ORBIT — lesson validator
   ----------------------------------------------------------------------------
   "Nothing left out" is enforced here: a module's lessons must together cover
   every topic the module lists, every formula must parse, and every lesson
   must carry the parts a learner needs (worked examples, check-yourself
   questions with answers). Set LESSON_MODULE=<moduleId> to check one module
   while writing it.
   ========================================================================== */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { buildCoverage, buildManifest } from '../../scripts/lessons-manifest'
import { moduleById } from './index'
import { LESSON_COVERAGE, LESSON_MANIFEST } from './lessons/manifest'
import { parseLesson, proseWordCount } from './lessons/parse'
import { noteRefs, notePicture, pictureProblem, splitNotes } from '../lib/contextNotes'

const dir = fileURLToPath(new URL('./lessons', import.meta.url))
const only = process.env.LESSON_MODULE
/*
 * A module directory holding no lesson yet is skipped rather than failed.
 *
 * Git cannot commit an empty directory, so such a directory never reaches CI
 * and never reaches a reader — it exists only on the machine of whoever is
 * part-way through writing that module, in the window between creating the
 * folder and saving the first lesson into it. Failing on it means every
 * writing run reports a red suite for a state that cannot ship, which trains
 * whoever is watching to ignore red. Nothing is lost by skipping: a module
 * that is genuinely missing its lessons is caught by the coverage check,
 * which reads the module's topic list rather than the folder.
 */
const moduleDirs = fs
  .readdirSync(dir)
  .filter((d) => fs.statSync(path.join(dir, d)).isDirectory() && (!only || d === only))
  .filter((d) => fs.readdirSync(path.join(dir, d)).some((f) => f.endsWith('.md')))
  .sort()

const MIN_WORDS = 600
const MAX_WORDS = 7000
const KINDS = ['example', 'key', 'check', 'answer', 'note', 'warning', 'video', 'context']

/**
 * Every lesson carries context notes (TEMPLATE.md). The modules below were
 * written before that rule and are being rewritten; each one comes off this
 * list when its rewrite lands with a `.plain-voice` marker, and nothing is
 * ever added to it. A module not on it — every new module included — must
 * have notes in every lesson from the start. NOTES_REQUIRED=<id,id> holds a
 * listed module to the rule for a run, while its rewrite is in progress.
 */
const WRITTEN_BEFORE_NOTES = new Set<string>([
  // Career
  'car_01_itar_gate', 'car_02_role_families', 'car_03_levels_and_quals', 'car_04_degree_reality',
  'car_05_tooling_reality', 'car_06_portfolio', 'car_07_resume_and_referrals', 'car_08_pipeline',
  'car_09_screens', 'car_10_past_project_presentation', 'car_11_domain_round', 'car_12_first_principles',
  'car_13_behavioral_star',
  // Coding
  'cod_cpp_01_basics', 'cod_cpp_02_memory', 'cod_lnx_01_shell', 'cod_lnx_02_scripting', 'cod_py_01_basics',
  'cod_py_02_idiomatic',
  // Tier 0
  't0_m03_python_scicomp', 't0_m04_linear_algebra_1', 't0_m05_linear_algebra_2', 't0_m06_calculus_single',
  't0_m07_calculus_multi', 't0_m09_probability_stats', 't0_m10_numerical_methods', 't0_m11_optimization',
  't0_m12_cpp',
  // Tier 1
  't1_m14_rigid_body_dynamics', 't1_m15_rotating_frames', 't1_m16_attitude_representations',
  't1_m17_attitude_kinematics', 't1_m18_atmospheric_flight',
  // Tier 2
  't2_m19_two_body', 't2_m20_orbital_maneuvers', 't2_m21_perturbations', 't2_m22_lambert_targeting',
  't2_m23_relative_motion_rpo', 't2_m24_edl',
  // Tier 3
  't3_m25_signals_systems', 't3_m26_classical_control', 't3_m27_digital_control', 't3_m28_state_space',
  't3_m29_optimal_control_lqr', 't3_m30_robust_control', 't3_m31_nonlinear_control', 't3_m32_mpc',
  // Tier 4
  't4_m33_least_squares', 't4_m34_kalman_filter', 't4_m35_nonlinear_filters', 't4_m36_inertial_navigation',
  't4_m37_gnss', 't4_m38_sensors_optical_nav', 't4_m39_orbit_determination',
  // Tiers 5–7
  't5_m40_guidance_fundamentals', 't5_m41_ascent_guidance', 't5_m42_trajectory_optimization',
  't5_m43_convex_guidance', 't6_m44_realtime_embedded', 't6_m45_fsw_architecture', 't6_m46_6dof_simulation',
  't6_m47_vv_montecarlo', 't7_m48_capstone', 't7_m49_interview_prep',
])
const hasMarker = (d: string) => fs.existsSync(path.join(dir, d, '.plain-voice'))
const NOTES_REQUIRED = new Set<string>([
  ...(process.env.NOTES_REQUIRED ?? '').split(',').filter(Boolean),
  ...fs.readdirSync(dir).filter((d) => hasMarker(d) || !WRITTEN_BEFORE_NOTES.has(d)),
])
const NOTES_MIN = 4
const NOTES_MAX = 15
// `::: video <id>` — 11 URL-safe base64 characters, as the provider issues them.
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

function mathSpans(body: string): { tex: string; display: boolean }[] {
  const out: { tex: string; display: boolean }[] = []
  // Inline code can hold a bare $ — a vim lesson naming the end-of-line motion
  // has several — and two of them on one line pair into a math span that never
  // was one. Code spans come out before the math is found, the same way fenced
  // blocks already do.
  const noCode = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, ' ')
  const display = /\$\$([\s\S]*?)\$\$/g
  let m: RegExpExecArray | null
  while ((m = display.exec(noCode)) !== null) out.push({ tex: m[1]!.trim(), display: true })
  const rest = noCode.replace(/\$\$[\s\S]*?\$\$/g, ' ')
  const inline = /\$(?!\s)(?:[^$\n\\]|\\.)+?(?<!\s)\$/g
  while ((m = inline.exec(rest)) !== null) out.push({ tex: m[0].slice(1, -1), display: false })
  return out
}

/* ----------------------------------------------------------------------------
   Closed arithmetic
   ----------------------------------------------------------------------------
   When a lesson writes $1.578 \times 9600 = +1.51 \times 10^4$, both sides are
   numbers and the claim is either true or false. A reader checking the step on
   a calculator is the person who finds out, and by then she has spent ten
   minutes doubting her own algebra. These are the cheapest defects in the
   corpus to find and the most corrosive to leave: a lesson that is wrong about
   arithmetic teaches her not to trust the lessons.

   So every math span whose sides are purely numeric is re-evaluated here.
   Anything with a symbol, a unit, an unbound function or a construct without
   one unambiguous numeric reading is skipped rather than guessed at — this
   check exists to find real errors, not to argue about notation.

   Comparison is at the precision the lesson itself prints. A lesson that says
   "= 27" claims 27 to the two figures it shows, not 27.000000, so the
   tolerance is half a unit in the last displayed place; a trailing-zero
   integer like 950 is read as two significant figures, per the usual
   convention; and \approx buys an order of magnitude more slack than =.
   -------------------------------------------------------------------------- */

/** A scientific-notation literal is one number. `0.05/2.5 \times 10^{-5}` is a
 *  division by 2.5e-5, not a division by 2.5 followed by a multiplication. */
function foldSciNotation(s: string): string {
  return s.replace(/(\d+(?:\.\d+)?)\s*(?:\\times|\\cdot)\s*10\s*\^\s*\{?\s*(-?\d+)\s*\}?/g, '($1e$2)')
}

/*
 * A unit at the end of a side cancels against the same unit on the other side,
 * so "3.33 - 3.03 \\approx 0.31\\,\\mathrm m" is a closed claim about 0.31 and is
 * checkable. Different units on the two sides are a conversion — "1\\,\\mathrm{ft}
 * = 0.3048\\,\\mathrm m" is true and would read as 1 = 0.3048 — so those spans
 * are skipped. Ignoring units altogether was the earlier behaviour and it hid a
 * wrong dynamic-pressure figure for as long as the unit sat beside it.
 */
const TRAILING_UNIT = /\\(?:text|mathrm|operatorname)\s*(?:\{[^{}]*\}|[A-Za-z]+)\s*$/
const TRAILING_UNIT_G = /\\(?:text|mathrm|operatorname)\s*(?:\{[^{}]*\}|[A-Za-z]+)\s*(?=$|=)/g

function trailingUnits(tex: string): string[] {
  return tex
    .split('=')
    .map((side) => TRAILING_UNIT.exec(side.replace(/\\approx/g, '='))?.[0]?.replace(/\s+/g, '') ?? '')
}

function unitsAgree(tex: string): boolean {
  const units = trailingUnits(tex).filter(Boolean)
  return units.length < 2 || units.every((u) => u === units[0])
}

/*
 * When only one side names a unit, the other side's unit is unstated, and the
 * commonest reason for a clean factor of ten between them is that the working
 * is in base SI and the answer is given with a prefix — pascals computed,
 * kilopascals reported. That is a unit change, not a wrong number, and it is
 * what a calculation "=\u00a042\u202fms" beside a value of 0.0417 actually means. A
 * genuine error of exactly a factor of ten, with a unit attached, is possible
 * and would be missed here; between the two, letting that one through beats
 * flagging every prefixed answer in the corpus.
 */
function isUnitPrefixChange(a: number, b: number, oneSidedUnit: boolean): boolean {
  if (!oneSidedUnit || a === 0 || b === 0) return false
  const ratio = Math.abs(b / a)
  const decades = Math.log10(ratio)
  if (Math.abs(decades - Math.round(decades)) < 0.01 && Math.round(decades) !== 0) return true
  // The other conversions this curriculum actually writes across an equals
  // sign with the unit named only once: radians to degrees or arcseconds, and
  // a ratio to decibels in either the amplitude or the power convention.
  for (const f of [180 / Math.PI, Math.PI / 180, 648000 / Math.PI, Math.PI / 648000]) {
    if (Math.abs(ratio / f - 1) < 0.005) return true
  }
  for (const k of [20, 10]) {
    if (Math.abs(b - k * Math.log10(Math.abs(a))) < 0.05) return true
  }
  return false
}

/** A bare value, as opposed to a calculation whose rounded inputs carry error. */
function isBareValue(expr: string): boolean {
  const t = expr.trim().replace(/^[+-]/, '').replace(/[()\s]/g, '')
  return !/[+\-*/]/.test(t.replace(/e-?\d+/gi, ''))
}

function texToExpr(tex: string): string {
  let s = tex
  // The thin-space spacers are punctuation, so a trailing \b never matches
  // after them and they have to be their own alternation. Leaving \, in place
  // made every span that used one unreadable, and therefore unchecked.
  s = s.replace(/\\(?:quad|qquad|displaystyle|left|right)\b/g, ' ')
  s = s.replace(/\\(?:tfrac|dfrac)\b/g, '\\frac')
  s = s.replace(/\\[,;!:]/g, ' ')
  /*
   * A unit on the end of a value does not change the value: "0.31\\,\\mathrm{m}"
   * claims 0.31, and the claim is checkable. Treating the unit as an opaque
   * token instead made the whole span unreadable, so a statement like
   * "3.33 - 3.03 \\approx 0.31\\,\\mathrm{m}" was skipped rather than checked —
   * which is exactly how a wrong figure stayed in a dynamic-pressure example
   * until it was found by hand. Units are therefore dropped where they sit at
   * the end of a side, and only a unit in the middle of an expression, where
   * it might be a symbol rather than a unit, still stops the check.
   */
  s = s.replace(TRAILING_UNIT_G, ' ')
  s = s.replace(/\\(?:text|mathrm|mathbf|operatorname)\s*\{[^{}]*\}/g, ' UNIT ')
  s = foldSciNotation(s)
  for (let i = 0; i < 6; i++) {
    const next = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '(($1)/($2))')
    if (next === s) break
    s = next
  }
  for (let i = 0; i < 4; i++) {
    const next = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'Math.sqrt($1)')
    if (next === s) break
    s = next
  }
  s = s.replace(/\\times|\\cdot/g, '*').replace(/\\div/g, '/')
  s = s.replace(/\^\s*\{([^{}]*)\}/g, '**($1)').replace(/\^\s*(-?\d+(?:\.\d+)?)/g, '**($1)')
  s = s.replace(/[{}]/g, (c) => (c === '{' ? '(' : ')'))
  s = s.replace(/(\d),(?=\d\d\d(?!\d))/g, '$1')
  return s
}

/** Only expressions built from digits, operators, parentheses and Math.sqrt. */
const NUMERIC_ONLY = /^[\d\s.+\-*/()e]*$/
function isNumericOnly(expr: string): boolean {
  const stripped = expr.replace(/Math\.sqrt/g, '').replace(/\*\*/g, '*')
  return NUMERIC_ONLY.test(stripped) && /\d/.test(stripped)
}

function evalExpr(expr: string): number | null {
  if (!isNumericOnly(expr)) return null
  try {
    // Safe: the whitelist above admits digits, operators and Math.sqrt only.
    const v = new Function('Math', `"use strict"; return (${expr});`)(Math)
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

/** `10**(3.88)` is pinned by its exponent's last place, not its mantissa's. */
function powerOfTenTolerance(shown: string, value: number): number | null {
  const m = /^\s*\(?\s*10\s*\*\*\s*\(\s*(-?\d+\.(\d+))\s*\)\s*\)?\s*$/.exec(shown)
  if (!m) return null
  const halfUlp = 0.5 * 10 ** -m[2]!.length
  return Math.abs(value) * (10 ** halfUlp - 1)
}

/** Half a unit in the last place the text actually displays. */
function shownTolerance(shown: string): number | null {
  const t = shown.trim().replace(/\s+/g, '')
  const m = /(-?\d+(?:\.\d+)?)(?:e(-?\d+))?/.exec(t)
  if (!m) return null
  const [, mantissa, expPart] = m
  const exp = expPart ? Number(expPart) : 0
  const dot = mantissa!.indexOf('.')
  if (dot >= 0) return 0.5 * 10 ** (-(mantissa!.length - dot - 1) + exp)
  // An integer written with trailing zeros carries only the figures before
  // them: 950 is two significant figures, so its last place is the tens.
  const trailing = /0*$/.exec(mantissa!)![0].length
  const significant = mantissa!.replace('-', '').length - trailing
  return 0.5 * 10 ** (trailing + exp) * (significant === 0 ? 1 : 1)
}

function arithmeticMismatches(body: string): { tex: string; detail: string }[] {
  const out: { tex: string; detail: string }[] = []
  for (const { tex } of mathSpans(body)) {
    // \approx is a relation too, and testing for a literal '=' before it was
    // translated skipped every span that only ever used one — which is a large
    // share of them in a corpus that rounds as often as this one does.
    if (!/=|\\approx/.test(tex)) continue
    if (!unitsAgree(tex)) continue
    const approx = /\\approx/.test(tex)
    const expr = texToExpr(tex).replace(/\\approx/g, '=')
    const parts = expr.split('=').filter((p) => p.trim())
    if (parts.length < 2) continue
    if (!parts.every(isNumericOnly)) continue
    const vals = parts.map(evalExpr)
    if (vals.some((v) => v === null)) continue
    for (let i = 0; i < vals.length - 1; i++) {
      const a = vals[i]!
      const b = vals[i + 1]!
      if (a === b) continue
      // Neither side is the stated result: both are calculations built from
      // inputs the lesson printed rounded, so any gap between them is that
      // rounding, not a claim. The stated result is checked on its own pass.
      if (!isBareValue(parts[i]!) && !isBareValue(parts[i + 1]!)) continue
      const named = trailingUnits(tex).filter(Boolean).length
      if (isUnitPrefixChange(a, b, named === 1)) continue
      if (Math.max(Math.abs(a), Math.abs(b)) < 1e-9) continue // residue around zero
      let tol = 0
      for (const [v, shown] of [[a, parts[i]!], [b, parts[i + 1]!]] as const) {
        const t = powerOfTenTolerance(shown, v) ?? shownTolerance(shown)
        if (t !== null) tol = Math.max(tol, t)
      }
      /*
       * \approx usually marks a rounding, not a loose claim: "\approx 0.31"
       * still asserts the value rounds to 0.31 at the precision shown, so it
       * buys no extra slack. A blanket multiplier here let a figure through
       * that was a full unit out in its last place. The one case that really
       * is loose is an order-of-magnitude claim against a bare power of ten,
       * and that is worth naming rather than approximating with a fudge
       * factor: "of order 10^n" means within half an order of magnitude.
       */
      if (approx) {
        for (const shown of [parts[i]!, parts[i + 1]!]) {
          const m = /^\s*\(?\s*10\s*\*\*\s*\(?\s*(-?\d+)\s*\)?\s*\)?\s*$/.exec(shown)
          if (m) tol = Math.max(tol, 10 ** Number(m[1]) * (Math.sqrt(10) - 1))
        }
      }
      if (Math.abs(a - b) > tol * 1.0001) {
        out.push({ tex, detail: `${tex.slice(0, 90)}  →  ${a} vs ${b}` })
        break
      }
    }
  }
  return out
}

/*
 * Spans this check reads wrongly, adjudicated by hand and kept here so the
 * suite stays green and the reasoning is not lost. Matched on the exact TeX,
 * so an edit to any of these lessons brings the span back for review.
 */
const ARITHMETIC_EXCEPTIONS = new Map<string, string>([
  ['-1 = 4', 'a deliberately false line, shown to demonstrate an equation with no solution'],
  [
    'N \\ge (1.96 \\times 7.86/0.5)^2 = 950',
    'two significant figures: 949.33 rounds to 950',
  ],
  ['(76.7/3.40)^2 = 510', 'two significant figures: 508.9 rounds to 510'],
  [
    '(1 + 3.046\\times 10^{-8})^{30000} = 1.00091427',
    'the exponent base is displayed rounded; computed from the full 3.04617e-8 the printed result is exact',
  ],
  [
    '\\sqrt{0.333333+0.333333+0.111111} = \\sqrt{0.777778} = 0.881917',
    'thirds displayed rounded; the printed result matches the exact sqrt(7)/3',
  ],
  ['0.86603 + 0.86603 = 1.73205', 'the printed sum is sqrt(3) to six figures, not the sum of its two rounded halves'],
  [
    '10.2/0.05 = 205\\,\\mathrm{rad/s}',
    'the momentum is displayed as 10.2 but computed from 10.24, which gives 204.8',
  ],
  [
    '-0.00357/\\sqrt{0.1310\\times 1.43\\times 10^{-4}} = -0.826',
    'every input is displayed to three figures; their rounding alone spans the 0.0012 gap to the printed result',
  ],
])

// The manifest is regenerated by the orchestrator after a batch of lessons
// lands, so a single-module run (LESSON_MODULE set) does not check it.
if (!only) {
  describe('context notes everywhere', () => {
    it('lists only modules that still await their rewrite', () => {
      const done = [...WRITTEN_BEFORE_NOTES].filter(hasMarker)
      expect(done, 'rewritten with notes: take these off WRITTEN_BEFORE_NOTES').toEqual([])
      const gone = [...WRITTEN_BEFORE_NOTES].filter((d) => !fs.existsSync(path.join(dir, d)))
      expect(gone, 'no such lesson folder').toEqual([])
    })
  })

  describe('lesson manifest', () => {
    it('matches the files on disk (run `npm run lessons:manifest`)', () => {
      expect(LESSON_MANIFEST).toEqual(buildManifest())
    })

    // The UI reads these numbers to tell the learner a module is still being
    // written, so a stale value would be a lie rather than a cosmetic drift.
    it('carries coverage derived from those same files', () => {
      expect(LESSON_COVERAGE).toEqual(buildCoverage())
    })
  })
}

if (moduleDirs.length === 0) {
  describe('lessons', () => {
    it('has no lesson directories yet', () => {
      expect(moduleDirs).toEqual([])
    })
  })
}

describe.each(moduleDirs)('lessons for %s', (moduleId) => {
  const module = moduleById(moduleId)
  const modDir = path.join(dir, moduleId)
  const files = fs.readdirSync(modDir).filter((f) => f.endsWith('.md')).sort()
  const parsed = files.map((file) => {
    const src = fs.readFileSync(path.join(modDir, file), 'utf8')
    return { file, src, ...parseLesson(src, `${moduleId}/${file}`) }
  })

  it('belongs to a real module and is numbered contiguously', () => {
    expect(module, `${moduleId} is not a module id`).toBeDefined()
    expect(files.length).toBeGreaterThan(0)
    files.forEach((f, i) => {
      expect(f, 'file names are <nn>-<slug>.md').toMatch(/^\d{2}-[a-z0-9][a-z0-9-]*\.md$/)
      expect(Number(f.slice(0, 2)), `${f} should be number ${i + 1}`).toBe(i + 1)
    })
    const ids = parsed.map((p) => p.header.id)
    expect(new Set(ids).size, 'lesson ids are unique').toBe(ids.length)
  })

  it('only claims topics the module actually lists', () => {
    const topics = new Set(module!.topics)
    for (const p of parsed) {
      for (const c of p.header.covers) {
        expect(topics.has(c), `${p.file}: "covers" entry is not a module topic (must match verbatim): "${c}"`).toBe(true)
      }
    }
  })

  /*
   * Full coverage is the finish line, not the gate on every commit: modules are
   * written one at a time and a half-written module must be able to land and be
   * reviewed. What keeps that honest is that incompleteness is derived, not
   * declared — LESSON_COVERAGE is computed from the files, the module page shows
   * the shortfall to the learner, and `npm run lessons:check` makes it an error.
   * So a partial module is always visible as partial and can never be mistaken
   * for a finished one.
   */
  const strict = process.env.LESSONS_STRICT === '1'
  const coverageTest = strict ? it : it.skip
  coverageTest('covers every topic of the module', () => {
    const covered = new Set<string>()
    for (const p of parsed) for (const c of p.header.covers) covered.add(c)
    const missing = module!.topics.filter((t) => !covered.has(t))
    expect(missing, 'topics no lesson covers').toEqual([])
  })

  describe.each(parsed.map((p) => [p.file, p] as const))('%s', (_file, p) => {
    it('has context notes that are complete, in place and safe', () => {
      const { body, notes } = splitNotes(p.body)
      const refs = noteRefs(body)
      const blocks = [...p.body.matchAll(/^\s*:::\s*context\s+(\S+)/gm)].map((m) => m[1]!)
      expect(new Set(blocks).size, 'context note ids are unique').toBe(blocks.length)
      for (const id of blocks) expect(id, 'context note ids are lowercase words and dashes').toMatch(/^[a-z0-9][a-z0-9-]*$/)
      expect([...new Set(refs)].filter((id) => !notes.has(id)), 'marked phrases with no note').toEqual([])
      expect([...notes.keys()].filter((id) => !refs.includes(id)), 'notes nothing in the lesson points to').toEqual([])
      if (notes.size) {
        const summary = p.body.search(/^##\s+Summary/m)
        const first = p.body.search(/^\s*:::\s*context\s/m)
        expect(first, 'context notes go at the end, after the Summary').toBeGreaterThan(summary)
        expect(/^\s*:::\s*(?!context\b)[a-z]+/m.test(p.body.slice(first)), 'nothing but context notes after the first note').toBe(false)
      }
      for (const n of notes.values()) {
        expect(n.title.length, `note "${n.id}" title`).toBeLessThanOrEqual(80)
        const words = n.body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length
        expect(words, `note "${n.id}" should say something (15–260 words)`).toBeGreaterThanOrEqual(15)
        expect(words, `note "${n.id}" should say something (15–260 words)`).toBeLessThanOrEqual(260)
        expect((n.body.match(/```svg/g) ?? []).length, `note "${n.id}" has at most one picture`).toBeLessThanOrEqual(1)
        const svg = notePicture(n.body)
        if (svg) expect(pictureProblem(svg), `note "${n.id}" picture`).toBeNull()
      }
      if (NOTES_REQUIRED.has(moduleId)) {
        expect(notes.size, `lessons in ${moduleId} carry ${NOTES_MIN}–${NOTES_MAX} context notes`).toBeGreaterThanOrEqual(NOTES_MIN)
        expect(notes.size, `lessons in ${moduleId} carry ${NOTES_MIN}–${NOTES_MAX} context notes`).toBeLessThanOrEqual(NOTES_MAX)
      }
    })

    it('has a sane header', () => {
      expect(p.header.title.length).toBeLessThanOrEqual(90)
      expect(p.header.minutes).toBeGreaterThanOrEqual(5)
      expect(p.header.minutes).toBeLessThanOrEqual(90)
    })

    /*
     * A merge or a stash that went wrong leaves these markers in the prose,
     * and every other rule here passes straight over them: the word count is
     * fine, the blocks balance, the maths parses. It happened, it shipped, and
     * the only reason it was caught is that a writer mentioned it. So it is a
     * rule now.
     */
    it('carries no leftover conflict markers', () => {
      const markers = p.src
        .split('\n')
        .filter((l) => /^(<{7}|={7}|>{7})(\s|$)/.test(l))
      expect(markers, 'unresolved merge or stash conflict in the lesson').toEqual([])
    })

    it('is a full lesson, not a stub', () => {
      const words = proseWordCount(p.body)
      expect(words, `prose words (min ${MIN_WORDS})`).toBeGreaterThanOrEqual(MIN_WORDS)
      expect(words, `prose words (max ${MAX_WORDS})`).toBeLessThanOrEqual(MAX_WORDS)
      expect(p.body, 'at least two worked examples').toMatch(/^:::\s*example[\s\S]*^:::\s*example/m)
      expect(p.body, 'a Check yourself section').toMatch(/^##\s+Check yourself/m)
      expect(p.body, 'check questions').toMatch(/^:::\s*check/m)
      expect(p.body, 'answers that fold open').toMatch(/^:::\s*answer/m)
      expect(p.body, 'a Summary section').toMatch(/^##\s+Summary/m)
    })

    /*
     * A question with no answer behind it is a dead end: she reads the check,
     * thinks, opens nothing, and has no way to find out whether she was right.
     * That is worse than no question at all, because it costs her the attempt
     * and gives her nothing back. The counts are what catch it — a missing
     * `::: answer` is invisible in the rendered page until you click.
     */
    it('answers every question it asks', () => {
      const checks = (p.body.match(/^:::\s*check/gm) ?? []).length
      const answers = (p.body.match(/^:::\s*answer/gm) ?? []).length
      expect(answers, `${checks} check questions but ${answers} answers`).toBe(checks)
      expect(checks, 'at least three check questions').toBeGreaterThanOrEqual(3)
    })

    /*
     * `minutes` is not decoration: the focus planner budgets a session from
     * it, so a number invented rather than counted either strands her
     * mid-lesson or leaves her sitting on a finished one. The house estimate
     * is words/180 plus two minutes per worked example. The window here is
     * wide on purpose — the whole written corpus falls inside 0.87 to 1.65 of
     * that estimate, and this is meant to catch a number nobody counted at
     * all, not to referee a writer's judgement about a dense derivation.
     */
    it('claims a plausible reading time', () => {
      const est =
        proseWordCount(p.body) / 180 + 2 * (p.body.match(/^:::\s*example/gm) ?? []).length
      const ratio = p.header.minutes / est
      expect(
        ratio,
        `minutes: ${p.header.minutes} against an estimated ${est.toFixed(1)} ` +
          `(${proseWordCount(p.body)} words / 180 + 2 per example)`,
      ).toBeGreaterThan(0.5)
      expect(ratio, `minutes: ${p.header.minutes} against an estimated ${est.toFixed(1)}`).toBeLessThan(2.5)
    })

    it('uses only the markdown the renderer supports', () => {
      const lines = p.body.split('\n')
      const openers = lines.filter((l) => /^\s*:::\s*[a-z]+/.test(l))
      const closers = lines.filter((l) => /^\s*:::\s*$/.test(l))
      expect(closers.length, 'every ::: block is closed').toBe(openers.length)
      for (const l of openers) {
        const kind = /^\s*:::\s*([a-z]+)/.exec(l)![1]!
        expect(KINDS, `unknown callout kind "${kind}"`).toContain(kind)
        if (kind === 'video') {
          // A mistyped id renders a dead panel in the middle of a lesson, and
          // nothing downstream would catch it, so it is caught here.
          const id = /^\s*:::\s*video\s+(\S+)/.exec(l)?.[1] ?? ''
          expect(id, `"::: video" needs a video id: "${l.trim()}"`).toMatch(VIDEO_ID_RE)
        }
      }
      // Code first: `# comment` opens a Python line and `<T>` is a template
      // parameter. Neither is markdown, and both are common in these lessons.
      const noCode = p.body.replace(/```[\s\S]*?```/g, '')
      expect(
        noCode.split('\n').filter((l) => /^#\s/.test(l)),
        'no # headings (the title is the h1)',
      ).toEqual([])
      // Inline code goes before anything counts delimiters. A shell lesson is
      // full of `$?`, `$$` and `${tmp:?}`, and a C++ one of `$` in no context
      // at all; none of it is math, and counting it made the shell-scripting
      // lessons fail a check about display equations.
      const noSpans = noCode.replace(/`[^`\n]*`/g, '')
      const noMath = noSpans.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$\n]+\$/g, '')
      expect(noMath.match(/<[a-z][a-z0-9-]*[\s>/]/gi) ?? [], 'no raw HTML').toEqual([])
      expect(noMath.match(/\\\(|\\\[|\\begin\{equation/g) ?? [], 'math uses $ and $$ delimiters only').toEqual([])
      const dollars = (noSpans.match(/\$\$/g) ?? []).length
      expect(dollars % 2, 'balanced $$').toBe(0)
      // Against the code-free text: a C++ lambda written inline, `[omega](double
      // t)`, has a link's exact shape and is not a link.
      for (const m of noMath.matchAll(/\]\(([^)]+)\)/g)) {
        expect(m[1], 'links are https or in-app').toMatch(/^(https:\/\/|#\/)/)
      }
    })


    it('gets its arithmetic right', () => {
      const bad = arithmeticMismatches(p.body)
        .filter((m) => !ARITHMETIC_EXCEPTIONS.has(m.tex.trim()))
        .map((m) => m.detail)
      expect(
        bad,
        'every calculation whose two sides are both numbers must hold at the precision shown. ' +
          'If the checker is the one that is wrong — a rounded intermediate, a notation it reads ' +
          'differently — add the exact TeX to ARITHMETIC_EXCEPTIONS with the reason.',
      ).toEqual([])
    })

    it('has mathematics KaTeX can render', () => {
      const bad: string[] = []
      for (const { tex, display } of mathSpans(p.body)) {
        try {
          katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'ignore' })
        } catch (err) {
          bad.push(`${tex.slice(0, 80)} → ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      expect(bad).toEqual([])
    })
  })
})
