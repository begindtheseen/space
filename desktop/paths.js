// Filesystem locations for the shell. Everything is derived from this file's own
// location (works both from the repo and from inside app.asar) or from Electron's
// userData path, so nothing depends on how the binary was launched.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'

export const desktopDir = path.dirname(fileURLToPath(import.meta.url))
export const appRoot = path.resolve(desktopDir, '..')
export const packageJsonFile = path.join(appRoot, 'package.json')
export const splashHtml = path.join(desktopDir, 'splash.html')
export const splashSourceJson = path.join(desktopDir, 'splash', 'SOURCE.json')
export const preloadFile = path.join(desktopDir, 'preload.cjs')

/** The web bundle shipped inside the app: extraResources when packaged, `<repo>/dist` in dev. */
export function builtInDir() {
  return app.isPackaged ? path.join(process.resourcesPath, 'dist') : path.join(appRoot, 'dist')
}

export function userDataDir() {
  return app.getPath('userData')
}

export function configFile() {
  return path.join(userDataDir(), 'config.json')
}

export function windowFile() {
  return path.join(userDataDir(), 'window.json')
}

export function bundlesDir() {
  return path.join(userDataDir(), 'bundles')
}
