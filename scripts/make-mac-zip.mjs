#!/usr/bin/env node
// Turns every packaged ORBIT.app under release/ into a drag-to-install zip:
//
//   release/ORBIT-<version>-<arch>-mac.zip
//     ORBIT <version>/
//       ORBIT.app
//       Applications -> /Applications
//       Install ORBIT.txt
//
// The DMG is the primary download, but a DMG can only be made on macOS. This
// zip can be made anywhere (electron-builder's own mac zip target works on
// Linux), and gives the same drag-onto-Applications install plus a note
// about the one-time Gatekeeper step. Run after `npm run desktop:pack` or
// after a Linux `npx electron-builder --mac zip --arm64 --x64 -c.mac.target=zip`.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

// electron-builder output directories: plain `mac` is x64.
const ARCH_BY_DIR = { mac: 'x64', 'mac-x64': 'x64', 'mac-arm64': 'arm64', 'mac-universal': 'universal' }

function fail(message) {
  console.error(`make-mac-zip: ${message}`)
  process.exit(1)
}

function readPackage() {
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  } catch (err) {
    fail(`cannot read package.json: ${err.message}`)
  }
  const version = pkg.version
  const productName = pkg.productName
  if (typeof version !== 'string' || !SEMVER_RE.test(version)) fail(`package.json version ${JSON.stringify(version)} is not semver`)
  if (typeof productName !== 'string' || !productName) fail('package.json productName is missing')
  return { version, productName }
}

function installNote(productName, version) {
  return [
    `${productName} ${version}`,
    '',
    `1. Drag ${productName}.app onto the Applications shortcut next to it.`,
    '',
    `2. The first launch needs one extra step, because ${productName} is signed`,
    '   ad hoc rather than with an Apple Developer ID and macOS will say it',
    '   "cannot be opened because Apple cannot check it for malicious software".',
    '   Any one of these works:',
    '',
    `   - In Applications, right-click (or Control-click) ${productName}.app and`,
    '     choose Open, then Open again in the dialog.',
    '   - Try to open it normally, then go to System Settings > Privacy &',
    `     Security, find the message about ${productName} and click "Open Anyway".`,
    '   - In Terminal:',
    `       xattr -dr com.apple.quarantine /Applications/${productName}.app`,
    '',
    '   macOS remembers the choice; every launch after that is ordinary.',
    '',
    `3. Updates: ${productName} > Settings > Updates > Check for updates.`,
    '',
  ].join('\n')
}

function zipFolder(parentDir, folderName, outFile) {
  fs.rmSync(outFile, { force: true })
  // ditto preserves resource forks, extended attributes and symlinks the way
  // Finder's own "Compress" does; Info-ZIP's -y keeps symlinks as symlinks.
  const [cmd, args] =
    process.platform === 'darwin'
      ? ['ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', folderName, outFile]]
      : ['zip', ['-r', '-y', '-X', '-q', outFile, folderName]]
  try {
    execFileSync(cmd, args, { cwd: parentDir, stdio: 'inherit' })
  } catch (err) {
    if (err.code === 'ENOENT') fail(`the \`${cmd}\` CLI is not installed`)
    fail(`${cmd} failed${typeof err.status === 'number' ? ` with exit code ${err.status}` : ''}`)
  }
  if (!fs.existsSync(outFile)) fail(`${cmd} reported success but ${outFile} does not exist`)
}

const { version, productName } = readPackage()
const appName = `${productName}.app`
const release = path.join(root, 'release')

let builds = []
try {
  builds = fs
    .readdirSync(release)
    .filter((dir) => ARCH_BY_DIR[dir] !== undefined)
    .filter((dir) => fs.existsSync(path.join(release, dir, appName, 'Contents', 'Info.plist')))
    .sort()
} catch (err) {
  if (err.code !== 'ENOENT') fail(`cannot read ${release}: ${err.message}`)
}
if (builds.length === 0) {
  fail(`no packaged app under release/ (expected e.g. release/mac-universal/${appName}); run \`npm run desktop:pack\` first`)
}

for (const dir of builds) {
  const arch = ARCH_BY_DIR[dir]
  const app = path.join(release, dir, appName)
  const outFile = path.join(release, `${productName}-${version}-${arch}-mac.zip`)
  const folderName = `${productName} ${version}`
  // Staged inside release/ so the copy never crosses filesystems and the
  // directory is already git-ignored if a crash leaves it behind.
  const stage = fs.mkdtempSync(path.join(release, `.stage-${arch}-`))
  try {
    const folder = path.join(stage, folderName)
    fs.mkdirSync(folder)
    fs.cpSync(app, path.join(folder, appName), { recursive: true, verbatimSymlinks: true })
    fs.symlinkSync('/Applications', path.join(folder, 'Applications'))
    fs.writeFileSync(path.join(folder, `Install ${productName}.txt`), installNote(productName, version))
    zipFolder(stage, folderName, outFile)
    const size = fs.statSync(outFile).size
    console.log(`make-mac-zip: ${path.relative(root, outFile)} (${arch}, ${(size / 1024 / 1024).toFixed(1)} MB) from ${path.relative(root, app)}`)
  } finally {
    fs.rmSync(stage, { recursive: true, force: true })
  }
}
