// Learn to code has its own focus block: started from a course, it opens the
// lesson in the focus look, lets her move through that language's lessons and
// courses, and turns anything else back. Run after `npm run build:bundle`:
//   node scripts/code-focus-smoke.mjs   (SHOTS=<dir> to save screenshots)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
const dist = path.resolve('dist')
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.woff2':'font/woff2', '.wasm':'application/wasm', '.md':'text/plain' }
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  let f = path.join(dist, url === '/' ? 'index.html' : url)
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, 'index.html')
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}/`
const shots = process.env.SHOTS
const browser = await chromium.launch({ args: ['--no-sandbox'], ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) })
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) errors.push(m) }
await page.goto(base + '#/learn/python', { waitUntil: 'networkidle' })
await page.waitForSelector('.lm-focus', { timeout: 10000 })
ok(true, 'the course page offers its own Focus')
await page.click('.lm-focus')
await page.waitForSelector('.focus-on', { timeout: 8000 })
const pressed = await page.getAttribute('.focus-on button:nth-child(2)', 'aria-pressed')
ok(pressed === 'true', 'the Focus page opens on "Learn to code"')
const title = (await page.textContent('.focus-pick__title')).trim()
ok(title.startsWith('Code: '), `the pick is a coding lesson: "${title}"`)
if (shots) await page.screenshot({ path: `${shots}/focus-code-pick.png` })
await page.click('.focus-start button')
await page.waitForSelector('.fbar', { timeout: 8000 })
const url1 = page.url()
ok(/#\/learn\/py-01$/.test(url1), `the block opens the lesson (${url1.split('#')[1]})`)
const lock = await page.getAttribute('html', 'data-focus-lock')
ok(lock === 'true', 'the app goes into the focus look')
const sideHidden = await page.evaluate(() => { const s = document.querySelector('.side'); return !s || getComputedStyle(s).display === 'none' })
ok(sideHidden, 'the sidebar is gone while coding in a block')
const mast = await page.textContent('.focus-mast').catch(() => '')
ok(/In focus/i.test(mast) && mast.includes('Code'), `the mast names the lesson: "${mast.replace(/\s+/g, ' ').trim()}"`)
if (shots) await page.screenshot({ path: `${shots}/focus-code-lesson.png` })
await page.evaluate(() => { location.hash = '#/learn/py-02' })
await page.waitForTimeout(600)
ok(/#\/learn\/py-02$/.test(page.url()), 'moving to the next Python lesson is allowed')
await page.evaluate(() => { location.hash = '#/learn/python-intermediate' })
await page.waitForTimeout(600)
ok(/#\/learn\/python-intermediate$/.test(page.url()), 'the next Python course is allowed')
await page.evaluate(() => { location.hash = '#/settings' })
await page.waitForTimeout(800)
ok(/#\/learn\/py-01$/.test(page.url()), `leaving for Settings is turned back (${page.url().split('#')[1]})`)
await page.evaluate(() => { location.hash = '#/learn/cpp-01' })
await page.waitForTimeout(800)
ok(!/cpp-01/.test(page.url()), 'another language is turned back too')
ok(!errors.some((e) => !/^[a-z]/.test(e) === false && e.includes('Error')), `no page errors`)
await browser.close()
server.close()
process.exit(errors.length ? 1 : 0)
