#!/usr/bin/env node
// Renders public/icon.svg into the macOS app icon, desktop/icon/icon.png:
// a 1024×1024 PNG with a transparent margin and the 832×832 artwork clipped
// to a 22.37% corner radius, which is the closest a border-radius gets to
// Apple's squircle. electron-builder turns the PNG into the .icns.
//
// Uses Playwright's Chromium so the gradients come out exactly as the browser
// draws them. If Playwright's own download is missing (a CI cache, or a
// PLAYWRIGHT_BROWSERS_PATH holding a different build), any installed
// Playwright Chromium is used; ORBIT_CHROMIUM=/path/to/chrome overrides both.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'public', 'icon.svg')
const target = path.join(root, 'desktop', 'icon', 'icon.png')

const CANVAS = 1024
const TILE = 832
const RADIUS = '22.37%'

// Where a Playwright build puts the Chromium executable, per platform.
const EXECUTABLES = [
  'chrome-linux/chrome',
  'chrome-linux64/chrome',
  'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
  'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
  'chrome-win/chrome.exe',
  'chrome-win64/chrome.exe',
]

function fail(message) {
  console.error(`make-icon: ${message}`)
  process.exit(1)
}

function isExecutableFile(file) {
  try {
    fs.accessSync(file, fs.constants.X_OK)
    return fs.statSync(file).isFile()
  } catch {
    return false
  }
}

function browserRoots() {
  const roots = []
  const env = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (env && env !== '0') roots.push(env)
  const home = os.homedir()
  if (process.platform === 'darwin') roots.push(path.join(home, 'Library', 'Caches', 'ms-playwright'))
  else if (process.platform === 'win32') roots.push(path.join(process.env.LOCALAPPDATA ?? path.join(home, 'AppData', 'Local'), 'ms-playwright'))
  else roots.push(path.join(home, '.cache', 'ms-playwright'))
  return roots
}

function findInstalledChromium() {
  const found = []
  for (const dir of browserRoots()) {
    let entries
    try {
      entries = fs.readdirSync(dir)
    } catch {
      continue
    }
    for (const entry of entries) {
      const match = /^chromium-(\d+)$/.exec(entry)
      if (!match) continue
      const exe = EXECUTABLES.map((rel) => path.join(dir, entry, rel)).find(isExecutableFile)
      if (exe) found.push({ revision: Number(match[1]), exe })
    }
  }
  found.sort((a, b) => b.revision - a.revision)
  return found[0]?.exe ?? null
}

async function launchChromium() {
  // Chromium refuses to start its sandbox as root (CI containers, xvfb boxes).
  const args = process.getuid?.() === 0 ? ['--no-sandbox'] : []
  const explicit = process.env.ORBIT_CHROMIUM
  if (explicit) {
    if (!isExecutableFile(explicit)) fail(`ORBIT_CHROMIUM=${explicit} is not an executable file`)
    return chromium.launch({ executablePath: explicit, args })
  }
  try {
    return await chromium.launch({ args })
  } catch (err) {
    const fallback = findInstalledChromium()
    if (!fallback) {
      fail(
        `Playwright's Chromium is not installed (${String(err.message).split('\n')[0]}). ` +
          'Run `npx playwright install chromium`, or set ORBIT_CHROMIUM to a Chromium/Chrome binary.',
      )
    }
    console.warn(`make-icon: Playwright's bundled Chromium is unavailable; using ${fallback}`)
    return chromium.launch({ executablePath: fallback, args })
  }
}

function pageHtml(svg) {
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; width: ${CANVAS}px; height: ${CANVAS}px; background: transparent; overflow: hidden; }
      body { display: grid; place-items: center; }
      .tile { width: ${TILE}px; height: ${TILE}px; border-radius: ${RADIUS}; overflow: hidden; }
      .tile img { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div class="tile"><img src="${dataUri}" alt="" /></div>
  </body>
</html>`
}

function pngSize(buffer) {
  const signature = '\x89PNG\r\n\x1a\n'
  if (buffer.length < 24 || buffer.toString('latin1', 0, 8) !== signature) fail('screenshot is not a PNG')
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

let svg
try {
  svg = fs.readFileSync(source, 'utf8')
} catch (err) {
  fail(`cannot read ${source}: ${err.message}`)
}
if (!svg.includes('<svg')) fail(`${source} does not look like an SVG`)

const browser = await launchChromium()
let png
try {
  const page = await browser.newPage({ viewport: { width: CANVAS, height: CANVAS }, deviceScaleFactor: 1 })
  await page.setContent(pageHtml(svg), { waitUntil: 'load' })
  await page.waitForFunction(() => {
    const img = document.querySelector('img')
    return img !== null && img.complete && img.naturalWidth > 0
  })
  png = await page.screenshot({ type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: CANVAS, height: CANVAS } })
} finally {
  await browser.close()
}

const { width, height } = pngSize(png)
if (width !== CANVAS || height !== CANVAS) fail(`rendered ${width}×${height}, expected ${CANVAS}×${CANVAS}`)

fs.mkdirSync(path.dirname(target), { recursive: true })
const tmp = `${target}.tmp`
try {
  fs.writeFileSync(tmp, png)
  fs.renameSync(tmp, target)
} catch (err) {
  fs.rmSync(tmp, { force: true })
  fail(`cannot write ${target}: ${err.message}`)
}
console.log(`make-icon: ${path.relative(root, target)} (${width}×${height}, ${(png.length / 1024).toFixed(0)} KB) from ${path.relative(root, source)}`)
