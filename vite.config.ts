import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { learnNotesOf, notesOf } from './src/curriculum/lessons/notesIndex.ts'

// The version the app is running, so it can show what this build changed.
// package.json is the one place it is written down.
const version: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version

/**
 * `virtual:context-notes`: every context note in every lesson and every Learn
 * to code lesson, gathered at build time into one module that the app imports
 * lazily (src/lib/explain.ts).
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
      const tracks = fileURLToPath(new URL('./src/learn/tracks', import.meta.url))
      for (const f of readdirSync(tracks).sort()) {
        if (!f.endsWith('.txt')) continue
        const file = path.join(tracks, f)
        this.addWatchFile(file)
        notes.push(...learnNotesOf(readFileSync(file, 'utf8')))
      }
      return `export default ${JSON.stringify(notes)}`
    },
  }
}

const CATALOG_OF = fileURLToPath(new URL('./src/learn/catalogOf.ts', import.meta.url))

/**
 * `virtual:learn-catalog`: every Learn to code course (src/learn/tracks) and
 * every module practice file (src/learn/modules), parsed at build time and cut
 * down to ids, titles and the shape of each lesson's practice and gate (see
 * src/learn/catalogOf.ts). It is all the app needs at startup; a course's text
 * loads when it is opened. Whatever .txt files are in the folders are read, so
 * a new course is picked up with no list to keep. Exported so Vitest serves the
 * same module (vitest.config.ts).
 */
export function learnCatalog(): Plugin {
  const ID = 'virtual:learn-catalog'
  const dirs = {
    tracks: fileURLToPath(new URL('./src/learn/tracks', import.meta.url)),
    modules: fileURLToPath(new URL('./src/learn/modules', import.meta.url)),
  }
  const ours = (file: string) => file.endsWith('.txt') && Object.values(dirs).some((d) => path.dirname(file) === d)
  let building = false
  return {
    name: 'orbit-learn-catalog',
    configResolved(config) {
      building = config.command === 'build'
    },
    resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
    async load(id) {
      if (id !== `\0${ID}`) return undefined
      /*
       * Loaded by Node itself rather than imported above: the parser's types
       * reach into the app (src/lib/shell.ts), which this config's own
       * type-check (tsconfig.node.json) cannot follow. Node strips the types.
       */
      const { catalogOf } = (await import(pathToFileURL(CATALOG_OF).href)) as {
        catalogOf: (files: { tracks: [string, string][]; modules: [string, string][] }, broken?: (file: string, err: unknown) => void) => unknown
      }
      const read = (dir: string): [string, string][] =>
        readdirSync(dir)
          .filter((f) => f.endsWith('.txt'))
          .sort()
          .map((f) => {
            const file = path.join(dir, f)
            this.addWatchFile(file)
            return [f, readFileSync(file, 'utf8')]
          })
      // A malformed course fails the build. Under the dev server and the tests it is left out with a warning,
      // so a course half-saved by one writer does not stop everyone else; the full-course tests still fail on it.
      const broken = building ? undefined : (file: string, err: unknown) => this.warn(`${file} left out of the Learn catalog: ${err instanceof Error ? err.message : String(err)}`)
      return `export default ${JSON.stringify(catalogOf({ tracks: read(dirs.tracks), modules: read(dirs.modules) }, broken))}`
    },
    // A course added or removed under the dev server rebuilds the catalog too (an edit is caught by addWatchFile).
    configureServer(server) {
      const refresh = (file: string) => {
        if (!ours(file)) return
        const mod = server.moduleGraph.getModuleById(`\0${ID}`)
        if (mod) server.reloadModule(mod)
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

// Static, dependency-light build: the whole platform is client-side, so the
// output of `vite build` can be dropped on any static host (GitHub Pages,
// Vercel, Cloudflare Pages) with no server behind it.
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), contextNotes(), learnCatalog()],
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
