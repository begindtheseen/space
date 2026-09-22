#!/usr/bin/env node
// Stamps a freshly built dist/ with the metadata the desktop shell reads:
//
//   dist/orbit-bundle.json   { version, minShell, builtAt, commit }
//
// `version` is what Settings shows and what the updater compares against a
// release manifest; `minShell` is the oldest app that may activate this bundle.
// Both come from package.json so a release cannot ship two different numbers.
// Runs as the second half of `npm run build:bundle`.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

function fail(message) {
  console.error(`stamp-bundle: ${message}`)
  process.exit(1)
}

function readPackage() {
  const file = path.join(root, 'package.json')
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    fail(`cannot read ${file}: ${err.message}`)
  }
  const version = pkg.version
  const minShell = pkg.orbit?.minShell
  if (typeof version !== 'string' || !SEMVER_RE.test(version)) fail(`package.json version ${JSON.stringify(version)} is not semver`)
  if (typeof minShell !== 'string' || !SEMVER_RE.test(minShell)) fail(`package.json orbit.minShell ${JSON.stringify(minShell)} is not semver`)
  return { version, minShell }
}

function gitCommit() {
  try {
    const out = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return out || null
  } catch {
    return null
  }
}

// Honour SOURCE_DATE_EPOCH (https://reproducible-builds.org/specs/source-date-epoch/)
// so two builds of the same commit can produce identical bundles.
function builtAt() {
  const epoch = process.env.SOURCE_DATE_EPOCH
  if (epoch === undefined || epoch === '') return new Date().toISOString()
  if (!/^\d+$/.test(epoch)) fail(`SOURCE_DATE_EPOCH must be a whole number of seconds, got ${JSON.stringify(epoch)}`)
  const date = new Date(Number(epoch) * 1000)
  if (Number.isNaN(date.getTime())) fail(`SOURCE_DATE_EPOCH ${epoch} is out of range`)
  return date.toISOString()
}

const { version, minShell } = readPackage()
const dist = path.join(root, 'dist')
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  fail('dist/index.html is missing; run `vite build` first (`npm run build:bundle` does both)')
}

const meta = { version, minShell, builtAt: builtAt(), commit: gitCommit() }
const target = path.join(dist, 'orbit-bundle.json')
try {
  fs.writeFileSync(target, `${JSON.stringify(meta, null, 2)}\n`)
} catch (err) {
  fail(`cannot write ${target}: ${err.message}`)
}
console.log(
  `stamp-bundle: dist/orbit-bundle.json → ${version} (minShell ${minShell}, commit ${meta.commit ?? 'unknown'}, built ${meta.builtAt})`,
)
