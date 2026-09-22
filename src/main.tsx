import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { getOrbit } from '@/lib/desktop'
import { navigate } from '@/lib/router'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')

// Present only inside the Electron shell (desktop/preload.cjs).
const orbit = getOrbit()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dismiss the pre-mount spinner once React has painted a frame.
requestAnimationFrame(() => {
  const boot = document.getElementById('boot')
  if (boot) {
    boot.classList.add('gone')
    setTimeout(() => boot.remove(), 500)
  }
  // The shell holds its splash until the renderer reports a painted frame,
  // and quarantines a downloaded bundle that never does — so this must be
  // the same moment the spinner goes, not something a page mounts later.
  orbit?.ready()
})

// Menu items ("Check for Updates…") land on a route through the shell.
orbit?.onNavigate((path) => {
  if (typeof path === 'string' && path.length > 0) navigate(path)
})

// The service worker is opt-in at build time: during development an aggressive
// cache is far more trouble than offline support is worth. The desktop shell
// serves the bundle from disk under app://orbit, where a worker would only
// shadow the files the updater just swapped in.
if (!orbit && import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* offline support is a bonus, never a requirement */
    })
  })
}
