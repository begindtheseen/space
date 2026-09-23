import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

const pkgVersion: string = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
).version

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: { __APP_VERSION__: JSON.stringify(pkgVersion) },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'desktop/test/**/*.test.ts'],
  },
})
