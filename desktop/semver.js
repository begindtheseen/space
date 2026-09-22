// Minimal semver: `x.y.z` and `x.y.z-pre.N` only. Build metadata (`+…`) and
// leading `v` are deliberately not accepted — versions come from package.json
// and the release manifest, both of which we control, so strictness catches
// mistakes instead of hiding them.

const RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
const NUMERIC = /^\d+$/

/**
 * @typedef {{ major: number, minor: number, patch: number, prerelease: string[] }} Version
 */

/**
 * @param {unknown} s
 * @returns {Version}
 */
export function parse(s) {
  if (typeof s !== 'string') throw new TypeError(`semver: expected a string, got ${typeof s}`)
  const m = RE.exec(s)
  if (!m) throw new TypeError(`semver: invalid version "${s}"`)
  const prerelease = m[4] ? m[4].split('.') : []
  for (const id of prerelease) {
    if (NUMERIC.test(id) && id.length > 1 && id[0] === '0') {
      throw new TypeError(`semver: invalid version "${s}" (numeric prerelease identifier with leading zero)`)
    }
  }
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), prerelease }
}

/** @param {unknown} s */
export function valid(s) {
  try {
    parse(s)
    return true
  } catch {
    return false
  }
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1}
 */
export function compare(a, b) {
  const va = parse(a)
  const vb = parse(b)
  for (const key of /** @type {const} */ (['major', 'minor', 'patch'])) {
    if (va[key] !== vb[key]) return va[key] < vb[key] ? -1 : 1
  }
  return comparePrerelease(va.prerelease, vb.prerelease)
}

/**
 * Semver §11.4: a version without prerelease outranks one with; identifiers
 * compare numerically when both numeric, numeric < alphanumeric otherwise,
 * alphanumerics by ASCII, and a longer list wins when all shared parts tie.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {-1 | 0 | 1}
 */
function comparePrerelease(a, b) {
  if (a.length === 0 && b.length === 0) return 0
  if (a.length === 0) return 1
  if (b.length === 0) return -1
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const x = a[i]
    const y = b[i]
    if (x === y) continue
    const xn = NUMERIC.test(x)
    const yn = NUMERIC.test(y)
    if (xn && yn) return Number(x) < Number(y) ? -1 : 1
    if (xn) return -1
    if (yn) return 1
    return x < y ? -1 : 1
  }
  if (a.length === b.length) return 0
  return a.length < b.length ? -1 : 1
}

/** @param {string} a @param {string} b */
export function gt(a, b) {
  return compare(a, b) === 1
}

/** @param {string} a @param {string} b */
export function gte(a, b) {
  return compare(a, b) !== -1
}
