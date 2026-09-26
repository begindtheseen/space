// Bundles the Anthropic SDK into one file the desktop shell can import.
//
// The shell ships with no node_modules (electron-builder.yml packs desktop/**
// and package.json only), so Ask AI's main-process half (desktop/ai.js) loads
// the SDK from desktop/vendor/anthropic-sdk.mjs instead. That file is built,
// not committed: `npm run build:bundle` runs this before every desktop build,
// e2e run and release.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'rolldown'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'desktop', 'vendor')
const entry = path.join(outDir, '.entry.mjs')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(entry, "export { default } from '@anthropic-ai/sdk'\n")
try {
  await build({
    input: entry,
    platform: 'node',
    logLevel: 'warn',
    output: { file: path.join(outDir, 'anthropic-sdk.mjs'), format: 'esm', minify: true, codeSplitting: false },
    write: true,
  })
} finally {
  fs.rmSync(entry, { force: true })
}
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/@anthropic-ai/sdk/package.json'), 'utf8'))
const size = fs.statSync(path.join(outDir, 'anthropic-sdk.mjs')).size
console.log(`vendor-sdk: @anthropic-ai/sdk ${version} → desktop/vendor/anthropic-sdk.mjs (${Math.round(size / 1024)} KB)`)
