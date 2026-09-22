/* ============================================================================
   ORBIT — routes
   ========================================================================== */
import { Suspense, lazy, useEffect } from 'react'
import { Starfield } from '@/components/art/Starfield'
import { Shell, phaseFor } from '@/components/layout/Shell'
import { LearnerProvider, useLearner } from '@/hooks/useLearner'
import { useRoute } from '@/lib/router'
import { Home } from '@/pages/Home'

/* Split the heavy leaves out of the initial bundle. The dashboard is what the
   app opens on; the playground drags in an editor and a WASM runtime, and the
   module reader drags in the whole corpus. Neither should cost anything until
   someone navigates there. */
const Learning = lazy(() => import('@/pages/Learning').then((m) => ({ default: m.Learning })))
const ModulePage = lazy(() => import('@/pages/Module').then((m) => ({ default: m.ModulePage })))
const Review = lazy(() => import('@/pages/Review').then((m) => ({ default: m.Review })))
const Track = lazy(() => import('@/pages/Track').then((m) => ({ default: m.Track })))
const Playground = lazy(() => import('@/pages/Playground').then((m) => ({ default: m.Playground })))
const Progress = lazy(() => import('@/pages/Progress').then((m) => ({ default: m.Progress })))
const Resources = lazy(() => import('@/pages/Resources').then((m) => ({ default: m.Resources })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const Guide = lazy(() => import('@/pages/Guide').then((m) => ({ default: m.Guide })))

export function App() {
  return (
    <LearnerProvider>
      <Starfield />
      <Routed />
    </LearnerProvider>
  )
}

function Routed() {
  const route = useRoute()
  const { dueCount, readiness, state, loaded } = useLearner()

  useEffect(() => {
    document.title = `${titleFor(route.path)} · ORBIT`
  }, [route.path])

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(state.settings.reduceMotion)
  }, [state.settings.reduceMotion])

  return (
    <Shell dueCount={dueCount} phase={phaseFor(readiness)}>
      <Suspense fallback={<PageSpinner />}>
        {/* Pages that snapshot state on mount — the review queue, the
            playground's saved buffer — would otherwise build themselves from
            the empty pre-hydration state and show a learner nothing to do.
            IndexedDB resolves in a few milliseconds; the spinner is rarely
            seen and is far better than a wrong empty state. */}
        {loaded ? <Page path={route.path} segments={route.segments} /> : <PageSpinner />}
      </Suspense>
    </Shell>
  )
}

function Page({ path, segments }: { path: string; segments: string[] }) {
  const [head, rest] = [segments[0] ?? '', segments[1] ?? '']

  switch (head) {
    case '':
      return <Home />
    case 'learning':
      return <Learning />
    case 'module':
      return <ModulePage id={rest} />
    case 'review':
      return <Review />
    case 'foundations':
      return <Track track="foundations" />
    case 'coding':
      return <Track track="coding" />
    case 'gnc':
      return <Track track="gnc" />
    case 'career':
      return <Track track="career" />
    case 'playground':
      return <Playground />
    case 'progress':
      return <Progress />
    case 'resources':
      return <Resources />
    case 'settings':
      return <Settings />
    case 'guide':
      return <Guide />
    default:
      return <NotFound path={path} />
  }
}

function titleFor(path: string): string {
  const seg = path.split('/').filter(Boolean)[0]
  if (!seg) return 'Dashboard'
  return seg.charAt(0).toUpperCase() + seg.slice(1)
}

function PageSpinner() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '120px 0' }}>
      <div
        style={{
          width: 26,
          height: 26,
          border: '2px solid rgba(77,155,255,0.16)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  )
}

function NotFound({ path }: { path: string }) {
  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div>
          <div className="page-head__kicker">Off nominal</div>
          <h1 className="h-page">Nothing at {path}</h1>
          <p className="page-head__sub">
            That route does not exist. Head back to the dashboard and pick a track.
          </p>
        </div>
      </div>
      <a href="#/" className="btn btn--primary btn--md" style={{ display: 'inline-flex' }}>
        Back to dashboard
      </a>
    </div>
  )
}
