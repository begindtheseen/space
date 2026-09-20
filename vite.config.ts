import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Static, dependency-light build: the whole platform is client-side, so the
// output of `vite build` can be dropped on any static host (GitHub Pages,
// Vercel, Cloudflare Pages) with no server behind it.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    // The curriculum chunk is legitimately ~600KB gzipped: it is the entire
    // corpus, and the dashboard cannot compute readiness without every
    // module's prereqs and item ids. It is fetched once and then served from
    // the service worker, so the cost is paid on first visit only. Splitting
    // the light metadata from the heavy card/quiz bodies is the next real win
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
          if (id.includes('/src/curriculum/')) return 'curriculum'
          if (id.includes('/src/engine/')) return 'engine'
          return undefined
        },
      },
    },
  },
  worker: { format: 'es' },
})
