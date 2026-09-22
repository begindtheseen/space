/* ============================================================================
   ORBIT — focus-block smoke test
   ----------------------------------------------------------------------------
   Serves dist/ and walks the whole focus flow in a real browser: start a block
   from the dashboard, watch the clock tick, navigate away and find the strip
   still there, park a thought, pause, end the block, reload and confirm it was
   banked.

   This exists because the unit tests cannot see any of that. They proved the
   arithmetic; they could not prove that the strip renders, that the timer
   survives a route change, or that the summary reads like something a person
   would want to see. The first run of this script found the last one: a block
   ended after a few seconds reported "0 minutes done", which is precisely the
   sentence the summary was written to avoid.

   Run:  npm run build && npm run smoke:focus
   Set CHROME to a Chromium binary if Playwright's own download is absent.
   ========================================================================== */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const dist = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'dist')
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png',
  '.webp':'image/webp', '.woff2':'font/woff2', '.wasm':'application/wasm', '.md':'text/plain' }

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  let f = path.join(dist, url === '/' ? 'index.html' : url)
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, 'index.html')
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}/`

const errors = []
const launch = { args: ['--no-sandbox'] }
if (process.env.CHROME) launch.executablePath = process.env.CHROME
const browser = await chromium.launch(launch)
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

const step = async (label, fn) => {
  try { await fn(); console.log('  PASS  ' + label) }
  catch (e) { console.log('  FAIL  ' + label + ' :: ' + e.message); errors.push(label + ': ' + e.message) }
}

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

await step('Home renders the start-a-block card', async () => {
  await page.waitForSelector('.startblock', { timeout: 8000 })
  const kicker = await page.textContent('.startblock__kicker')
  if (kicker.trim() !== 'Start here') throw new Error('kicker was ' + kicker)
  const title = (await page.textContent('.startblock__title')).trim()
  if (!title) throw new Error('no pick title')
  console.log('        pick: ' + title)
})

await step('the start button begins a block', async () => {
  await page.click('.startblock .btn, .startblock button')
  await page.waitForSelector('.fbar', { timeout: 8000 })
})

await step('the block strip shows a countdown', async () => {
  const a = await page.textContent('.fbar__clock')
  if (!/^\d+:\d{2}$/.test(a.trim())) throw new Error('clock read ' + a)
  await page.waitForTimeout(2200)
  const b = await page.textContent('.fbar__clock')
  if (a.trim() === b.trim()) throw new Error('clock did not tick: ' + a + ' -> ' + b)
  console.log('        clock ' + a.trim() + ' -> ' + b.trim())
})

await step('the block survives navigating away', async () => {
  await page.goto(base + '#/progress', { waitUntil: 'load' })
  await page.waitForTimeout(700)
  await page.waitForSelector('.fbar', { timeout: 5000 })
})

await step('a thought can be parked', async () => {
  await page.click('.fbar__btn:has-text("Park a thought")')
  await page.fill('.fbar__note', 'renew the registration')
  await page.press('.fbar__note', 'Enter')
  await page.waitForTimeout(400)
  await page.goto(base + '#/focus', { waitUntil: 'load' })
  await page.waitForTimeout(700)
  const txt = await page.textContent('.focus-parked')
  if (!txt.includes('renew the registration')) throw new Error('parked note missing')
})

await step('pause holds the clock', async () => {
  await page.click('.fbar__btn:has-text("Pause")')
  await page.waitForTimeout(300)
  const a = await page.textContent('.fbar__clock')
  await page.waitForTimeout(2200)
  const b = await page.textContent('.fbar__clock')
  if (a.trim() !== b.trim()) throw new Error('paused clock moved: ' + a + ' -> ' + b)
  await page.click('.fbar__btn:has-text("Resume")')
})

await step('ending the block banks it', async () => {
  await page.click('.fbar__btn:has-text("I\'m done")')
  await page.waitForTimeout(900)
  if (await page.$('.fbar')) throw new Error('strip still present after ending')
  const done = await page.textContent('.focus-done')
  if (!/done/i.test(done)) throw new Error('no summary: ' + done)
  console.log('        summary: ' + done.trim())
})

await step('the block is still banked after a reload', async () => {
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.goto(base + '#/focus', { waitUntil: 'load' })
  await page.waitForTimeout(900)
  const done = await page.textContent('.focus-done')
  if (!/done/i.test(done)) throw new Error('summary lost across reload')
})

if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT })
await browser.close()
server.close()

const real = errors.filter((e) => !/favicon|ERR_|Failed to load resource/i.test(e))
console.log('\nerrors: ' + real.length)
for (const e of real) console.log('  ' + e)
process.exit(real.length ? 1 : 0)
