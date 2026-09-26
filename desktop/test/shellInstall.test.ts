/* ============================================================================
   The app replacing itself: shellInstall.js
   ----------------------------------------------------------------------------
   The swap script is run for real, with bash, against directories standing in
   for the old and new apps and a process standing in for ORBIT: it must wait
   for that process to go, put the new app where the old one was, open it, and
   — if the new one cannot be put there — leave the old one exactly as it was.
   The macOS-only steps (ditto, plutil, codesign) are exercised on macOS by
   hand; here only what they are wrapped in.
   ========================================================================== */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { appBundleOf, createShellInstaller, findAppIn, startSwap } from '../shellInstall.js'
import { makeTempDir, removeDir } from './fixtures.ts'

let dir: string
beforeEach(() => {
  dir = makeTempDir('shell-install')
})
afterEach(() => removeDir(dir))

function fakeApp(at: string, version: string) {
  mkdirSync(path.join(at, 'Contents', 'MacOS'), { recursive: true })
  writeFileSync(path.join(at, 'Contents', 'MacOS', 'ORBIT'), `binary ${version}`)
  writeFileSync(path.join(at, 'Contents', 'version.txt'), version)
}

async function waitFor(check: () => boolean, ms = 10_000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (check()) return true
    await new Promise((r) => setTimeout(r, 50))
  }
  return check()
}

describe('appBundleOf', () => {
  it('finds the .app an executable lives in', () => {
    expect(appBundleOf('/Applications/ORBIT.app/Contents/MacOS/ORBIT')).toBe('/Applications/ORBIT.app')
    expect(appBundleOf('/Users/b/Apps/ORBIT.app/Contents/MacOS/ORBIT')).toBe('/Users/b/Apps/ORBIT.app')
  })
  it('is null outside an app bundle', () => {
    expect(appBundleOf('/usr/local/bin/electron')).toBeNull()
    expect(appBundleOf('/x/node_modules/electron/dist/electron')).toBeNull()
  })
})

describe('findAppIn', () => {
  it('finds the app inside the release zip layout, not a helper app inside it', () => {
    fakeApp(path.join(dir, 'ORBIT 9.9.9', 'ORBIT.app'), '9.9.9')
    mkdirSync(path.join(dir, 'ORBIT 9.9.9', 'ORBIT.app', 'Contents', 'Frameworks', 'ORBIT Helper.app'), { recursive: true })
    expect(findAppIn(dir, 'ORBIT')).toBe(path.join(dir, 'ORBIT 9.9.9', 'ORBIT.app'))
  })
  it('is null when there is no app', () => {
    mkdirSync(path.join(dir, 'ORBIT 9.9.9'))
    expect(findAppIn(dir, 'ORBIT')).toBeNull()
  })
})

describe('createShellInstaller().supported', () => {
  it('only on a Mac', () => {
    const inst = createShellInstaller({ execPath: '/Applications/ORBIT.app/Contents/MacOS/ORBIT', isPackaged: true, productName: 'ORBIT', platform: 'linux' })
    expect(inst.supported()).toEqual({ ok: false, reason: expect.stringMatching(/Mac/) })
  })
  it('not for a development build', () => {
    const inst = createShellInstaller({ execPath: '/x/node_modules/electron/dist/electron', isPackaged: false, productName: 'ORBIT', platform: 'darwin' })
    expect(inst.supported()).toEqual({ ok: false, reason: expect.stringMatching(/development build/) })
  })
  it('not from the read-only copy macOS runs a freshly downloaded app from', () => {
    const inst = createShellInstaller({
      execPath: '/private/var/folders/x/AppTranslocation/ABC/d/ORBIT.app/Contents/MacOS/ORBIT',
      isPackaged: true,
      productName: 'ORBIT',
      platform: 'darwin',
    })
    expect(inst.supported()).toEqual({ ok: false, reason: expect.stringMatching(/Move ORBIT into Applications/) })
  })
  it('only where it may write', () => {
    const app = path.join(dir, 'ORBIT.app')
    fakeApp(app, '1.0.0')
    const inst = createShellInstaller({ execPath: path.join(app, 'Contents', 'MacOS', 'ORBIT'), isPackaged: true, productName: 'ORBIT', platform: 'darwin' })
    expect(inst.supported()).toEqual({ ok: true })
    const missing = createShellInstaller({ execPath: '/nonexistent/ORBIT.app/Contents/MacOS/ORBIT', isPackaged: true, productName: 'ORBIT', platform: 'darwin' })
    expect(missing.supported()).toEqual({ ok: false, reason: expect.stringMatching(/not allowed to replace itself/) })
  })
})

describe('the swap script', () => {
  function setUp() {
    const target = path.join(dir, 'Applications', 'ORBIT.app')
    fakeApp(target, '1.0.0')
    const work = path.join(dir, 'userData', 'shell-update')
    const newApp = path.join(work, '9.9.9', 'ORBIT 9.9.9', 'ORBIT.app')
    fakeApp(newApp, '9.9.9')
    const opened = path.join(dir, 'opened.txt')
    const opener = path.join(dir, 'open.sh')
    writeFileSync(opener, `#!/bin/bash\necho "$1" >> ${JSON.stringify(opened)}\n`, { mode: 0o755 })
    // Stands in for ORBIT: the swap must wait until it has gone.
    const orbit = spawn('sleep', ['30'], { stdio: 'ignore' })
    return { target, work, newApp, opened, opener, orbit }
  }

  it('waits for ORBIT to quit, puts the new app in its place, and opens it', async () => {
    const { target, work, newApp, opened, opener, orbit } = setUp()
    startSwap({ pid: orbit.pid!, newApp, target, workDir: work, opener })
    await new Promise((r) => setTimeout(r, 400))
    // Still running: nothing touched yet.
    expect(readFileSync(path.join(target, 'Contents', 'version.txt'), 'utf8')).toBe('1.0.0')
    expect(existsSync(opened)).toBe(false)

    orbit.kill()
    expect(await waitFor(() => existsSync(opened))).toBe(true)
    expect(readFileSync(path.join(target, 'Contents', 'version.txt'), 'utf8')).toBe('9.9.9')
    expect(readFileSync(opened, 'utf8').trim()).toBe(target)
    expect(existsSync(`${target}.orbit-previous`)).toBe(false)
    expect(existsSync(work)).toBe(false)
    expect(readFileSync(`${work}.log`, 'utf8')).toMatch(/installed/)
  })

  it('leaves the old app exactly where it was, and opens it, when the new one cannot be put there', async () => {
    const { target, work, opened, opener, orbit } = setUp()
    startSwap({ pid: orbit.pid!, newApp: path.join(work, 'missing', 'ORBIT.app'), target, workDir: work, opener })
    orbit.kill()
    expect(await waitFor(() => existsSync(opened))).toBe(true)
    expect(readFileSync(path.join(target, 'Contents', 'version.txt'), 'utf8')).toBe('1.0.0')
    expect(readFileSync(path.join(target, 'Contents', 'MacOS', 'ORBIT'), 'utf8')).toBe('binary 1.0.0')
    expect(existsSync(`${target}.orbit-previous`)).toBe(false)
    expect(readFileSync(`${work}.log`, 'utf8')).toMatch(/putting the old app back/)
  })
})
