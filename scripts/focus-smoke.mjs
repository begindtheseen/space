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

/* ── The countdown dial ──────────────────────────────────────────────────── */

await step('the block dial drains as the clock runs', async () => {
  await page.goto(base + '#/focus', { waitUntil: 'load' })
  await page.waitForTimeout(700)
  await page.click('.focus-start .btn, .focus-start button')
  await page.waitForSelector('.fbar__dial-arc', { timeout: 8000 })
  const read = () => page.$eval('.fbar__dial-arc', (el) => Number(el.getAttribute('stroke-dashoffset')))
  const a = await read()
  await page.waitForTimeout(2600)
  const b = await read()
  if (!(b > a)) throw new Error(`dial did not drain: ${a} -> ${b}`)
  console.log(`        dashoffset ${a.toFixed(1)} -> ${b.toFixed(1)}`)
})

await step('pausing stops the dial too', async () => {
  await page.click('.fbar__btn:has-text("Pause")')
  await page.waitForTimeout(300)
  const a = await page.$eval('.fbar__dial-arc', (el) => Number(el.getAttribute('stroke-dashoffset')))
  await page.waitForTimeout(2200)
  const b = await page.$eval('.fbar__dial-arc', (el) => Number(el.getAttribute('stroke-dashoffset')))
  if (a !== b) throw new Error(`paused dial moved: ${a} -> ${b}`)
  await page.click('.fbar__btn:has-text("I\'m done")')
  await page.waitForTimeout(800)
})

/* ── Reading progress ────────────────────────────────────────────────────── */

await step('a lesson shows how much is left, and it tracks the scroll', async () => {
  await page.goto(base + '#/module/t0_m01_algebra_precalc?lesson=l01-signed-numbers-and-fractions', {
    waitUntil: 'load',
  })
  await page.waitForTimeout(2500)
  const bar = await page.$('.rprog')
  if (!bar) throw new Error('no reading progress bar in the reader')
  const scale = () =>
    page.$eval('.rprog__fill', (el) => {
      const m = getComputedStyle(el).transform
      if (m === 'none') return 0
      return Number(m.match(/matrix\(([-\d.]+)/)?.[1] ?? 0)
    })
  const start = await scale()
  await page.evaluate(() => document.querySelector('.scroll')?.scrollTo({ top: 99999 }))
  await page.waitForTimeout(900)
  const end = await scale()
  if (!(end > start + 0.5)) throw new Error(`bar did not fill: ${start} -> ${end}`)
  console.log(`        fill ${start.toFixed(2)} -> ${end.toFixed(2)}`)
})

/* ── Read aloud ──────────────────────────────────────────────────────────── */

await step('a lesson offers to read itself aloud', async () => {
  await page.waitForSelector('.raloud', { timeout: 8000 })
  const label = await page.textContent('.raloud__btn--go')
  if (!/read aloud/i.test(label)) throw new Error('no read-aloud control: ' + label)
})

await step('it speaks prose, not LaTeX', async () => {
  // Capture what is handed to the synthesiser rather than trusting the
  // preparation code: this is the assertion that matters, because a voice
  // reading "backslash frac" is the whole failure mode.
  const said = await page.evaluate(async () => {
    const spoken = []
    const real = window.speechSynthesis.speak.bind(window.speechSynthesis)
    window.speechSynthesis.speak = (u) => {
      spoken.push(u.text)
      // Fire the end event so the chain advances without waiting for audio.
      setTimeout(() => u.onend && u.onend(new Event('end')), 5)
    }
    document.querySelector('.raloud__btn--go').click()
    await new Promise((r) => setTimeout(r, 900))
    window.speechSynthesis.speak = real
    return spoken
  })
  if (said.length < 5) throw new Error('only ' + said.length + ' sentences were spoken')
  const joined = said.join(' ')
  for (const bad of ['\\frac', '\\omega', '$$', '```', 'backslash']) {
    if (joined.includes(bad)) throw new Error('spoke raw markup: ' + bad)
  }
  console.log('        spoke ' + said.length + ' sentences, e.g. "' + said[3].slice(0, 90) + '"')
})

await step('it offers a choice of speed', async () => {
  const rates = await page.$$eval('.raloud__rate option', (o) => o.map((x) => x.value))
  if (rates.length < 4) throw new Error('too few speeds offered: ' + rates.join(','))
})

await step('reaching the end puts the control back to the start', async () => {
  // The stub in the previous step ran the whole lesson through in under a
  // second, so by now the player should have finished of its own accord and
  // collapsed back to the offer rather than sitting on a dead pause button.
  await page.waitForSelector('.raloud__btn--go', { timeout: 6000 })
  const on = await page.$eval('.raloud', (el) => el.dataset.on)
  if (on !== 'false') throw new Error('player still reports itself running')
})

/* ── The sidebar gets out of the way ─────────────────────────────────────── */

await step('the rail is hidden at rest', async () => {
  await page.goto(base + '#/', { waitUntil: 'load' })
  await page.waitForTimeout(900)
  const box = await page.$eval('.side', (el) => el.getBoundingClientRect().right)
  if (box > 4) throw new Error('rail is on screen at rest; right edge at ' + box)
})

await step('moving to the left edge brings it back', async () => {
  await page.mouse.move(4, 400)
  await page.waitForTimeout(600)
  const box = await page.$eval('.side', (el) => el.getBoundingClientRect().right)
  if (box < 100) throw new Error('rail did not reveal; right edge at ' + box)
})

await step('moving away hides it again', async () => {
  await page.mouse.move(900, 400)
  await page.waitForTimeout(1200)
  const box = await page.$eval('.side', (el) => el.getBoundingClientRect().right)
  if (box > 4) throw new Error('rail stayed out; right edge at ' + box)
})

await step('a brush past the edge does not snap it shut instantly', async () => {
  await page.mouse.move(4, 400)
  await page.waitForTimeout(400)
  await page.mouse.move(900, 400)
  await page.waitForTimeout(120)
  const box = await page.$eval('.side', (el) => el.getBoundingClientRect().right)
  if (box <= 4) throw new Error('rail vanished before the grace period elapsed')
  await page.waitForTimeout(1000)
})

await step('the content uses the full width while it is hidden', async () => {
  const gap = await page.$eval('.main', (el) => el.getBoundingClientRect().left)
  if (gap > 4) throw new Error('content still indented by ' + gap + 'px')
})

if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT })
await browser.close()
server.close()

const real = errors.filter((e) => !/favicon|ERR_|Failed to load resource/i.test(e))
console.log('\nerrors: ' + real.length)
for (const e of real) console.log('  ' + e)
process.exit(real.length ? 1 : 0)
