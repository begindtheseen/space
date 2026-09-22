// electron-builder afterPack hook: ad-hoc signs the packaged macOS app.
//
// There is no Apple Developer ID behind ORBIT, so the app is signed with the
// ad-hoc identity ("-"). That is what lets macOS run it once the user has
// approved it (Privacy & Security → Open Anyway); an unsigned app is refused outright on
// Apple silicon. On macOS the hook uses Apple's codesign. On Linux it uses
// rcodesign (https://gregoryszorc.com/docs/apple-codesign/) when it is on
// PATH or named by RCODESIGN, so a Linux box can still produce a runnable
// build. With neither available the app is left unsigned and the build goes
// on; CI verifies the macOS build with `codesign --verify` afterwards.
//
// CommonJS on purpose: the repo is "type": "module" and electron-builder
// loads hooks through require()/import interop, which .cjs satisfies.
'use strict'
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const TAG = '[after-pack]'
const log = (...args) => console.log(TAG, ...args)
const quote = (s) => (/[\s"']/.test(s) ? JSON.stringify(s) : s)

function run(cmd, args) {
  log(`$ ${quote(cmd)} ${args.map(quote).join(' ')}`)
  execFileSync(cmd, args, { stdio: 'inherit' })
}

function isExecutableFile(file) {
  try {
    fs.accessSync(file, fs.constants.X_OK)
    return fs.statSync(file).isFile()
  } catch {
    return false
  }
}

function findRcodesign() {
  const explicit = process.env.RCODESIGN
  if (explicit) {
    // A wrong RCODESIGN is a misconfiguration, not a reason to ship unsigned.
    if (!isExecutableFile(explicit)) throw new Error(`${TAG} RCODESIGN=${explicit} is not an executable file`)
    return explicit
  }
  const names = process.platform === 'win32' ? ['rcodesign.exe', 'rcodesign'] : ['rcodesign']
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue
    for (const name of names) {
      const candidate = path.join(dir, name)
      if (isExecutableFile(candidate)) return candidate
    }
  }
  return null
}

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') {
    log(`skipping ${context.electronPlatformName}: only the macOS app is signed`)
    return
  }
  const { appOutDir } = context
  // A universal build packs an x64 and an arm64 slice into "<dir>-x64-temp"
  // and "<dir>-arm64-temp", merges them with lipo, then calls this hook once
  // more for the merged app. Signing the slices would leave differing
  // _CodeSignature files in each and make the merge refuse them.
  if (/-(x64|arm64)-temp$/.test(path.basename(appOutDir))) {
    log(`${path.basename(appOutDir)}: universal slice; the merged app is signed instead`)
    return
  }
  const app = path.join(appOutDir, `${context.packager.appInfo.productFilename}.app`)
  if (!fs.existsSync(path.join(app, 'Contents', 'Info.plist'))) {
    throw new Error(`${TAG} packaged app not found at ${app}`)
  }

  if (process.platform === 'darwin') {
    run('codesign', ['--force', '--deep', '--sign', '-', '--timestamp=none', app])
    run('codesign', ['--verify', '--deep', '--strict', app])
    log(`ad-hoc signed and verified ${app}`)
    return
  }

  const rcodesign = findRcodesign()
  if (!rcodesign) {
    log(`${app} left unsigned: not on macOS and rcodesign is not on PATH (set RCODESIGN=/path/to/rcodesign)`)
    return
  }
  run(rcodesign, ['sign', app])
  log(`ad-hoc signed ${app} with rcodesign`)
}
