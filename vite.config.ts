import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { notesOf } from './src/curriculum/lessons/notesIndex.ts'

// The version the app is running, so it can show what this build changed.
// package.json is the one place it is written down.
const version: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version

/**
 * `virtual:context-notes`: every context note in every lesson, gathered at
 * build time into one module that the app imports lazily (src/lib/explain.ts).
 * Rebuilt whenever a lesson changes under the dev server.
 */
function contextNotes(): Plugin {
  const ID = 'virtual:context-notes'
  const dir = fileURLToPath(new URL('./src/curriculum/lessons', import.meta.url))
  return {
    name: 'orbit-context-notes',
    resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
    load(id) {
      if (id !== `\0${ID}`) return undefined
      const notes = []
      for (const mod of readdirSync(dir, { withFileTypes: true })) {
        if (!mod.isDirectory()) continue
        for (const f of readdirSync(path.join(dir, mod.name)).sort()) {
          if (!f.endsWith('.md')) continue
          const file = path.join(dir, mod.name, f)
          this.addWatchFile(file)
          notes.push(...notesOf(mod.name, readFileSync(file, 'utf8')))
        }
      }
      return `export default ${JSON.stringify(notes)}`
    },
  }
}

// Static, dependency-light build: the whole platform is client-side, so the
// output of `vite build` can be dropped on any static host (GitHub Pages,
// Vercel, Cloudflare Pages) with no server behind it.
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), contextNotes()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    // The curriculum chunk carries the whole corpus of module definitions,
    // because the dashboard cannot compute readiness without every module's
    // prereqs and item ids. It is fetched once and then served from the
    // service worker, so the cost is paid on first visit only. Splitting the
    // light metadata from the heavy card/quiz bodies is the next real win
    // here, and wants a build step rather than a manualChunks tweak.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Only React is pinned to the initial load. Lumping all of
          // node_modules into one "vendor" chunk drags CodeMirror (~600KB) in
          // with it and quietly undoes the playground's lazy import — the
          // dashboard would pay for an editor it never shows.
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react'
          }
          /*
           * Lesson bodies live under src/curriculum/lessons/<module>/*.md and
           * are pulled in by a lazy import.meta.glob precisely so they load
           * one at a time, when opened. A path test that matched them swept
           * every lesson into this chunk and silently undid that: the corpus
           * went from a few hundred kilobytes to twelve megabytes, all of it
           * fetched and parsed before the dashboard could paint, and growing
           * with every lesson written. Markdown is excluded by extension so
           * the dynamic imports split the way the loader documents.
           */
          if (/\.md(\?|$)/.test(id)) return undefined
          if (id.includes('/src/curriculum/')) return 'curriculum'
          if (id.includes('/src/engine/')) return 'engine'
          return undefined
        },
      },
    },
  },
  worker: { format: 'es' },
})
