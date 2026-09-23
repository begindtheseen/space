/// <reference types="vite/client" />

/**
 * `?raw` imports. CHANGELOG.md is read as text by the app so that the entry
 * for the version she is running is available with no network and no second
 * copy of the words: the release script reads the same file to fill in the
 * notes shown before an update.
 */
declare module '*.md?raw' {
  const content: string
  export default content
}

/** The version from package.json, injected at build time. */
declare const __APP_VERSION__: string
