import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getOrbit } from '@/lib/desktop'
import { navigate } from '@/lib/router'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')

// Present only inside the Electron shell (desktop/preload.cjs).
const orbit = getOrbit()

// Set once the error boundary has replaced the tree with its crash screen.
let crashed = false

function dismissSpinner() {
  const boot = document.getElementById('boot')
  if (!boot) return
  boot.classList.add('gone')
  setTimeout(() => boot.remove(), 500)
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary
      onCrash={() => {
        crashed = true
        // The spinner overlay would otherwise sit on top of the crash screen.
        dismissSpinner()
      }}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Dismiss the pre-mount spinner once React has committed its first frame, and
// only then tell the shell the renderer is up. The shell holds its splash until
// ready() arrives and quarantines a downloaded bundle that never sends it, so
// ready() must be tied to that first commit — not to something a page mounts
// later, and never to a tree that threw before it could commit: React unmounts
// such a tree (#root stays empty) or the boundary above takes it over, and
// either way the bundle is left for the shell's watchdog to judge.
const tick = () => {
  if (crashed) return
  if (root.childElementCount === 0) {
    requestAnimationFrame(tick)
    return
  }
  dismissSpinner()
  orbit?.ready()
  void warmUp()
}
requestAnimationFrame(tick)

/**
 * Work the app was going to do anyway, done while the splash is still up.
 *
 * Deliberately started *after* ready(): the shell's watchdog quarantines a
 * bundle that never reports ready, so the warm-up must never be able to delay
 * that signal. The shell holds the splash for this separately and caps how
 * long it will wait, so a warm-up that stalls costs a moment, never a launch.
 */
async function warmUp() {
  try {
    const [{ runBoot, BOOT_DONE_SIGNAL }, { loadState }] = await Promise.all([
      import('@/lib/boot'),
      import('@/engine/store'),
    ])
    const state = await loadState()
    await runBoot(state, (label) => orbit?.bootStatus(label))
    orbit?.bootStatus(BOOT_DONE_SIGNAL)
  } catch {
    // A failed warm-up is a cold cache, nothing more. Release the splash.
    orbit?.bootStatus('\u0000boot-done')
  }
}

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
