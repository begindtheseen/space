// The platform half of the app updating itself (updater.js downloadShell /
// installShell): unpack the downloaded app, check it is the version asked for
// and intact, and swap it in for this one once ORBIT has quit.
//
// macOS only. ORBIT is signed ad hoc, not with a Developer ID, so Squirrel
// (Electron's autoUpdater) will not take it; instead a small script, started
// detached just before ORBIT quits, waits for this process to exit, moves the
// new app into place (keeping the old one until the new one is there, and
// putting it back if anything fails) and opens it — or, when the swap happens
// because she quit ORBIT (updater.js installOnExit), leaves it closed, the way
// an ordinary app installs its update on quit. A download made by the app
// itself carries no quarantine flag, so the new app opens without the
// Gatekeeper prompt a browser download would get.
import { execFile, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

/**
 * The script that does the swap, as its own file so it runs after ORBIT has
 * gone. Arguments, never interpolated into the text: the PID to wait for, the
 * new app, the app to replace, the work directory to delete afterwards, the
 * command that opens an app (`open` on macOS; a stand-in under test), and
 * whether to open it afterwards (1, the default, or 0).
 */
export const SWAP_SCRIPT = `#!/bin/bash
pid="$1"; new="$2"; target="$3"; work="$4"; opener="\${5:-/usr/bin/open}"; reopen="\${6:-1}"
log="$work.log"
exec >>"$log" 2>&1
echo "$(date) swapping in $new for $target (waiting for $pid)"
open_app() { if [ "$reopen" = "1" ]; then "$opener" "$target"; fi; }
# A quit she asked for can take a moment (windows close, state is saved), so
# wait up to five minutes, and never swap an app that is still running.
for _ in $(seq 1 3000); do kill -0 "$pid" 2>/dev/null || break; sleep 0.1; done
if kill -0 "$pid" 2>/dev/null; then
  echo "ORBIT is still running; leaving the old app in place"
  exit 1
fi
backup="$target.orbit-previous"
rm -rf "$backup"
if ! mv "$target" "$backup"; then
  echo "could not move the old app aside; leaving it in place"
  open_app; exit 1
fi
# Same volume (userData and /Applications usually are): a rename, instant and
# exact. Otherwise a copy that keeps symlinks, permissions and attributes.
if mv "$new" "$target" 2>/dev/null || { command -v ditto >/dev/null && ditto "$new" "$target"; } || cp -Rp "$new" "$target"; then
  command -v xattr >/dev/null && xattr -dr com.apple.quarantine "$target" 2>/dev/null
  rm -rf "$backup" "$work"
  echo "installed"
  open_app
else
  echo "the copy failed; putting the old app back"
  rm -rf "$target"
  mv "$backup" "$target"
  open_app
  exit 1
fi
`

/**
 * The .app bundle an executable belongs to: .../ORBIT.app/Contents/MacOS/ORBIT
 * → .../ORBIT.app, or null when it is not inside one.
 * @param {string} execPath
 * @returns {string | null}
 */
export function appBundleOf(execPath) {
  const bundle = path.resolve(execPath, '..', '..', '..')
  const macos = path.dirname(execPath)
  if (!bundle.endsWith('.app') || path.basename(macos) !== 'MacOS' || path.basename(path.dirname(macos)) !== 'Contents') return null
  return bundle
}

/**
 * The first `<name>.app` directory within two levels of `dir` (the release zip
 * holds `ORBIT <version>/ORBIT.app`).
 * @param {string} dir
 * @param {string} name
 * @returns {string | null}
 */
export function findAppIn(dir, name) {
  const want = `${name}.app`
  /** @param {string} at @param {number} depth @returns {string | null} */
  const walk = (at, depth) => {
    let entries
    try {
      entries = fs.readdirSync(at, { withFileTypes: true })
    } catch {
      return null
    }
    for (const e of entries) if (e.isDirectory() && e.name === want) return path.join(at, e.name)
    if (depth === 0) return null
    for (const e of entries) {
      if (!e.isDirectory() || e.name.endsWith('.app') || e.name.startsWith('.')) continue
      const hit = walk(path.join(at, e.name), depth - 1)
      if (hit) return hit
    }
    return null
  }
  return walk(dir, 2)
}

/**
 * Starts the swap script detached, so it outlives this process.
 * @param {{ pid: number, newApp: string, target: string, workDir: string, opener?: string, reopen?: boolean }} o
 * @returns {string} the script's path
 */
export function startSwap({ pid, newApp, target, workDir, opener, reopen = true }) {
  fs.mkdirSync(workDir, { recursive: true })
  const script = path.join(path.dirname(workDir), 'swap-app.sh')
  fs.writeFileSync(script, SWAP_SCRIPT, { mode: 0o755 })
  const args = [script, String(pid), newApp, target, workDir, opener || '/usr/bin/open', reopen ? '1' : '0']
  const child = spawn('/bin/bash', args, { detached: true, stdio: 'ignore' })
  child.unref()
  return script
}

/**
 * @param {{ execPath?: string, isPackaged: boolean, productName: string, platform?: string, log?: (...a: unknown[]) => void }} o
 * @returns {import('./updater.js').ShellInstaller}
 */
export function createShellInstaller({ execPath = process.execPath, isPackaged, productName, platform = process.platform, log = () => {} }) {
  const target = appBundleOf(execPath)
  return {
    supported() {
      if (platform !== 'darwin') return { ok: false, reason: 'ORBIT can only update itself on a Mac.' }
      if (!isPackaged || !target) return { ok: false, reason: 'This is a development build of ORBIT, not an installed app.' }
      if (target.includes('/AppTranslocation/')) {
        return {
          ok: false,
          reason: 'macOS is running ORBIT from a temporary read-only copy, because it was opened straight from the download. Move ORBIT into Applications, open it from there, and it can update itself.',
        }
      }
      try {
        fs.accessSync(path.dirname(target), fs.constants.W_OK)
        fs.accessSync(target, fs.constants.W_OK)
      } catch {
        return { ok: false, reason: `ORBIT is not allowed to replace itself in ${path.dirname(target)}. Download the new app and drag it into Applications instead.` }
      }
      return { ok: true }
    },
    async extract(zip, dest) {
      // ditto is what Finder uses: it keeps the symlinks and attributes an
      // app bundle and its code signature depend on.
      await run('/usr/bin/ditto', ['-x', '-k', zip, dest])
    },
    findApp(dir) {
      return findAppIn(dir, productName)
    },
    async verify(app, version) {
      const { stdout } = await run('/usr/bin/plutil', ['-extract', 'CFBundleShortVersionString', 'raw', '-o', '-', path.join(app, 'Contents', 'Info.plist')])
      const found = stdout.trim()
      if (found !== version) throw new Error(`it says it is version ${found || 'unknown'}, not ${version}`)
      try {
        await run('/usr/bin/codesign', ['--verify', '--deep', '--strict', app])
      } catch (err) {
        const detail = /** @type {{ stderr?: string }} */ (err).stderr
        throw new Error(`its code signature is broken${detail ? `: ${detail.trim().split('\n')[0]}` : ''}`)
      }
    },
    install(app, workDir, { reopen = true } = {}) {
      if (!target) throw new Error('This is not an installed app.')
      const script = startSwap({ pid: process.pid, newApp: app, target, workDir, reopen })
      log(`shell-install: ${script} will swap ${app} in for ${target}`)
    },
  }
}
