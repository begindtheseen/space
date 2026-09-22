/* ============================================================================
   ORBIT — last-resort error boundary
   ----------------------------------------------------------------------------
   Wraps the whole tree so a render-time throw leaves a page with a way out
   instead of an empty #root. Inside the desktop shell this matters twice: a
   downloaded curriculum bundle that crashes before its first commit must not
   report ready() — main.tsx leaves that to the shell's watchdog, which
   quarantines the bundle — and one that crashes later needs a visible route
   back to the built-in bundle, because Settings has gone down with the tree.
   Everything here is self-contained (inline layout, the shared .btn classes)
   so it still renders when the crash came from the rest of the UI.
   ========================================================================== */
import { Component, useState, type ReactNode } from 'react'
import { getOrbit } from '@/lib/desktop'

interface Props {
  children: ReactNode
  /** Called once per crash, after the fallback has been committed. */
  onCrash?: (error: unknown) => void
}

interface State {
  crashed: boolean
  error: unknown
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false, error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { crashed: true, error }
  }

  componentDidCatch(error: unknown): void {
    this.props.onCrash?.(error)
  }

  render(): ReactNode {
    return this.state.crashed ? <CrashScreen error={this.state.error} /> : this.props.children
  }
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message || error.name
  if (typeof error === 'string' && error) return error
  return 'Unknown error'
}

function CrashScreen({ error }: { error: unknown }) {
  const orbit = getOrbit()
  const [rollingBack, setRollingBack] = useState(false)
  // versions is filled synchronously by the preload, so no updater round-trip
  // is needed to know whether there is a built-in bundle to fall back to.
  const canRollback = orbit !== undefined && orbit.versions.bundle !== orbit.versions.builtIn

  const rollback = async () => {
    if (!orbit) return
    setRollingBack(true)
    try {
      await orbit.updates.rollback()
    } catch {
      // The shell declined; the buttons stay so the learner can try again.
    }
    setRollingBack(false)
  }

  return (
    <div
      data-orbit-crash
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        background: '#000208',
        color: 'var(--text, #dbe6f5)',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <div style={{ fontSize: 11, letterSpacing: '.3em', textTransform: 'uppercase', color: '#6b8bb0' }}>
          Off nominal
        </div>
        <h1 style={{ margin: '10px 0 12px', fontSize: 28, lineHeight: 1.15, fontWeight: 700 }}>
          ORBIT hit a problem
        </h1>
        <p style={{ margin: '0 0 16px', lineHeight: 1.55, color: 'var(--text-dim, #9fb3cc)' }}>
          Something in the interface threw an error before it could draw. Your progress is stored
          separately from the interface and is not affected.
          {canRollback
            ? ` This build of the curriculum was downloaded as an update; the version built into the app (${orbit.versions.builtIn}) is still here.`
            : ''}
        </p>
        <pre
          style={{
            margin: '0 0 20px',
            padding: '10px 12px',
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: '#ff8d8d',
          }}
        >
          {describeError(error)}
        </pre>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--primary btn--md" onClick={() => location.reload()}>
            Reload
          </button>
          {canRollback ? (
            <button
              type="button"
              className="btn btn--ghost btn--md"
              onClick={() => void rollback()}
              disabled={rollingBack}
            >
              {rollingBack ? 'Restarting…' : `Roll back to the built-in version ${orbit.versions.builtIn}`}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
