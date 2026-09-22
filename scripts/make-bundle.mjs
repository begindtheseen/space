#!/usr/bin/env node
// Packages a stamped dist/ as a release for the desktop updater:
//
//   release/orbit-bundle-<version>.zip   dist/ as one archive
//   release/orbit-manifest.json          what an installed app fetches first:
//                                        version, notes, bundle sha256/size,
//                                        minShell, and where the DMG lives
//
// The URLs point at the GitHub Release for tag v<version> in orbit.updates.repo,
// so this must run for the same package.json version that gets tagged.
// Requires `npm run build:bundle` to have run and the `zip` CLI.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

function fail(message) {
  console.error(`make-bundle: ${message}`)
  process.exit(1)
}

function readJson(file, what) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    fail(`cannot read ${what} (${file}): ${err.message}`)
  }
}

function readPackage() {
  const pkg = readJson(path.join(root, 'package.json'), 'package.json')
  const version = pkg.version
  const minShell = pkg.orbit?.minShell
  const repo = pkg.orbit?.updates?.repo
  if (typeof version !== 'string' || !SEMVER_RE.test(version)) fail(`package.json version ${JSON.stringify(version)} is not semver`)
  if (typeof minShell !== 'string' || !SEMVER_RE.test(minShell)) fail(`package.json orbit.minShell ${JSON.stringify(minShell)} is not semver`)
  if (typeof repo !== 'string' || !REPO_RE.test(repo)) fail(`package.json orbit.updates.repo ${JSON.stringify(repo)} is not owner/repo`)
  return { version, minShell, repo }
}

function releaseNotes(version) {
  const file = path.join(root, 'RELEASE_NOTES.md')
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8').trim()
    if (text) return text
    console.warn('make-bundle: RELEASE_NOTES.md is empty; using the default notes')
  }
  return `Release v${version}`
}

function publishedAt() {
  const epoch = process.env.SOURCE_DATE_EPOCH
  if (epoch === undefined || epoch === '') return new Date().toISOString()
  if (!/^\d+$/.test(epoch)) fail(`SOURCE_DATE_EPOCH must be a whole number of seconds, got ${JSON.stringify(epoch)}`)
  const date = new Date(Number(epoch) * 1000)
  if (Number.isNaN(date.getTime())) fail(`SOURCE_DATE_EPOCH ${epoch} is out of range`)
  return date.toISOString()
}

async function sha256(file) {
  const hash = createHash('sha256')
  await pipeline(fs.createReadStream(file), hash)
  return hash.digest('hex')
}

function zipDist(dist, zipFile) {
  fs.rmSync(zipFile, { force: true })
  try {
    // -X drops platform extra fields (uid/gid, timestamps beyond DOS), which
    // keeps the archive small and byte-stable across machines.
    execFileSync('zip', ['-r', '-X', '-q', zipFile, '.'], { cwd: dist, stdio: 'inherit' })
  } catch (err) {
    if (err.code === 'ENOENT') fail('the `zip` CLI is not installed (apt install zip, or brew install zip)')
    fail(`zip failed${typeof err.status === 'number' ? ` with exit code ${err.status}` : ''}`)
  }
  if (!fs.existsSync(zipFile)) fail(`zip reported success but ${zipFile} does not exist`)
}

const { version, minShell, repo } = readPackage()
const dist = path.join(root, 'dist')
const stampFile = path.join(dist, 'orbit-bundle.json')
if (!fs.existsSync(path.join(dist, 'index.html')) || !fs.existsSync(stampFile)) {
  fail('dist/ is not a stamped build; run `npm run build:bundle` first')
}
const stamp = readJson(stampFile, 'dist/orbit-bundle.json')
if (stamp.version !== version) {
  fail(`dist/orbit-bundle.json is version ${stamp.version} but package.json is ${version}; run \`npm run build:bundle\` again`)
}
if (stamp.minShell !== minShell) {
  fail(`dist/orbit-bundle.json has minShell ${stamp.minShell} but package.json says ${minShell}; run \`npm run build:bundle\` again`)
}

const release = path.join(root, 'release')
fs.mkdirSync(release, { recursive: true })

const bundleName = `orbit-bundle-${version}.zip`
const zipFile = path.join(release, bundleName)
zipDist(dist, zipFile)

const size = fs.statSync(zipFile).size
if (size <= 0) fail(`${bundleName} is empty`)
const digest = await sha256(zipFile)

const tag = `v${version}`
const downloads = `https://github.com/${repo}/releases/download/${tag}`
const manifest = {
  schema: 1,
  version,
  publishedAt: publishedAt(),
  notes: releaseNotes(version),
  bundle: {
    name: bundleName,
    url: `${downloads}/${bundleName}`,
    sha256: digest,
    size,
    minShell,
  },
  shell: {
    version,
    dmgUrl: `${downloads}/ORBIT-${version}-universal.dmg`,
    zipUrl: `${downloads}/ORBIT-${version}-universal-mac.zip`,
  },
}
const manifestFile = path.join(release, 'orbit-manifest.json')
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`)

const rel = (file) => path.relative(root, file)
console.log(`make-bundle: ${rel(zipFile)}`)
console.log(`  version   ${version} (minShell ${minShell}, commit ${stamp.commit ?? 'unknown'})`)
console.log(`  size      ${size} bytes`)
console.log(`  sha256    ${digest}`)
console.log(`make-bundle: ${rel(manifestFile)}`)
console.log(`  bundle    ${manifest.bundle.url}`)
console.log(`  dmg       ${manifest.shell.dmgUrl}`)
console.log(`  notes     ${manifest.notes.split('\n')[0].slice(0, 72)}${manifest.notes.includes('\n') ? ' …' : ''}`)
