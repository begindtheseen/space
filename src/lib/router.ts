/* ============================================================================
   ORBIT — hash router
   ----------------------------------------------------------------------------
   Hash routing rather than the History API, deliberately: the app ships as a
   static bundle to hosts that may not be configured to rewrite unknown paths
   back to index.html (GitHub Pages in particular). With hashes, a deep link
   survives a hard refresh with no server config at all.
   ========================================================================== */
import { useEffect, useState } from 'react'

export interface Route {
  /** The path with a leading slash and no hash, e.g. "/learning/orbital-1". */
  path: string
  /** Path split on "/" with empty segments removed. */
  segments: string[]
  /** Parsed query string, e.g. "#/review?deck=math" → { deck: "math" }. */
  query: Record<string, string>
}

function parse(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart = ''] = raw.split('?')
  const path = pathPart!.startsWith('/') ? pathPart! : `/${pathPart}`
  const query: Record<string, string> = {}
  for (const [k, v] of new URLSearchParams(queryPart)) query[k] = v
  return { path, segments: path.split('/').filter(Boolean), query }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parse(location.hash))
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  const next = `#${path.startsWith('/') ? path : `/${path}`}`
  if (location.hash === next) return
  if (opts.replace) {
    history.replaceState(null, '', next)
    dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    location.hash = next
  }
}

/**
 * Scrolls the main scroll container back to the top whenever the path changes.
 * Without this a deep page keeps the previous page's scroll offset, which reads
 * as a broken navigation.
 */
export function useScrollReset(path: string, ref: { current: HTMLElement | null }) {
  useEffect(() => {
    ref.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [path, ref])
}
