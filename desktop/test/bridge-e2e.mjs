// Proves the compiled languages work through the real preload bridge inside a
// real Electron app — not by calling runner.js directly.
//
// Not part of the update story in e2e.mjs: this one only asks whether the
// compiled languages can be reached from the page, which is the thing that was
// broken. It launches the app with the PATH launchd gives a Mac app started
// from the Dock, so a toolchain that is only findable because of the path we
// build is the only kind that can pass.
//
//   npm run build:bundle
//   xvfb-run -a node desktop/test/bridge-e2e.mjs
//
// A language that is genuinely not installed here is reported and skipped;
// ORBIT_BRIDGE_REQUIRE=cpp,rust,bash,matlab makes named ones mandatory.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'
import { _electron } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-bridge-e2e-'))
let failures = 0
const check = (cond, msg) => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${msg}`)
  if (!cond) failures++
}

const app = await _electron.launch({
  executablePath: electronPath,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '.'],
  cwd: root,
  // The PATH launchd gives a Mac app from the Dock. If the bridge works under
  // this, it works under hers.
  env: { ...process.env, ORBIT_E2E: '1', ORBIT_USER_DATA: userData, PATH: '/usr/bin:/bin:/usr/sbin:/sbin' },
})
// The first window is the splash, which has no bridge on it. The main window
// is the one served from app://orbit/.
const deadline = Date.now() + 60_000
let win = null
while (Date.now() < deadline && !win) {
  win = app.windows().find((p) => p.url().startsWith('app://orbit/')) ?? null
  if (!win) await new Promise((r) => setTimeout(r, 200))
}
if (!win) throw new Error(`main window never appeared (saw: ${app.windows().map((p) => p.url()).join(', ') || 'none'})`)
await win.waitForLoadState('domcontentloaded')
await win.waitForFunction(() => typeof window.orbit === 'object', null, { timeout: 30_000 })

const hasRun = await win.evaluate(() => typeof window.orbit?.run?.exec === 'function')
check(hasRun, 'window.orbit.run.exec is exposed by the preload bridge')

const detected = await win.evaluate(() => window.orbit.run.detect(true))
for (const [lang, info] of Object.entries(detected)) {
  console.log(`      ${lang.padEnd(7)} available=${info.available} bin=${info.bin ?? '-'}`)
}

// Bash is the one every machine has, so it is always required; the rest are
// required only when asked for, so this harness does not fail a CI box that
// has no Rust.
const required = new Set(['bash', ...(process.env.ORBIT_BRIDGE_REQUIRE ?? '').split(',').filter(Boolean)])

// Each program prints a phrase that could only come from running it, so a
// string comparison somewhere in the stack could not fake a pass.
const cases = {
  cpp: ['#include <cstdio>\nint main(){ std::printf("cpp through the bridge\\n"); }\n', 'cpp through the bridge'],
  rust: ['fn main(){ println!("rust through the bridge"); }\n', 'rust through the bridge'],
  bash: ['echo "bash through the bridge"\n', 'bash through the bridge'],
  matlab: ['disp("octave through the bridge")\n', 'octave through the bridge'],
}

for (const [lang, [source, expected]] of Object.entries(cases)) {
  if (!detected[lang]?.available) {
    if (required.has(lang)) check(false, `${lang}: no toolchain found under the launchd PATH`)
    else console.log(`  skip ${lang}: not installed on this machine`)
    continue
  }
  console.log(`      ${lang} uses ${detected[lang].bin}`)
  const res = await win.evaluate(([l, s]) => window.orbit.run.exec({ lang: l, source: s }), [lang, source])
  const got = (res?.stdout ?? '').trim()
  check(
    res?.ok === true && got === expected,
    `${lang}: ran and printed what only running it prints (exit ${res?.exitCode}, ${JSON.stringify(got)})` +
      (res?.ok ? '' : ` reason=${res?.reason} stderr=${res?.stderr}`),
  )
}

await app.close()
fs.rmSync(userData, { recursive: true, force: true })
console.log(failures === 0 ? '\nALL BRIDGE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
