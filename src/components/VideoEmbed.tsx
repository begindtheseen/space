/* ============================================================================
   ORBIT — lesson video
   ----------------------------------------------------------------------------
   Videos play inside the app, and the app does not carry them. Both halves
   matter. Shipping video files would put gigabytes into a bundle that updates
   over the air; sending her out to a browser tab would be the thing the app
   exists to replace, and a browser tab is where an hour disappears.

   So: a streamed embed, in a panel, in the lesson, with the surrounding lesson
   still there when it ends.

   Three decisions worth stating.

   A facade, not an iframe. Until she presses play there is no frame, no player
   script and no cookie — only a still from the thumbnail host. A lesson with
   six videos costs six images rather than six embedded players, and the
   still falls back to a drawn placeholder when it cannot be fetched.

   youtube-nocookie.com, with `rel=0` and no related-video wall at the end. It
   is the same video without the recommendation engine attached to it, which is
   the part that turns "watch this 9-minute explanation" into an hour gone.

   Position tracking without YouTube's script. The embed answers the postMessage
   protocol directly when `enablejsapi=1` is set, so a `listening` message gets
   back `infoDelivery` frames carrying currentTime and duration. That avoids
   loading a third-party script into the app, and it means a resumed video
   starts where she stopped.
   ========================================================================== */
import { useCallback, useEffect, useRef, useState } from 'react'
import { isMediaComplete, type MediaProgress } from '@/engine/resume'
import { useLearner } from '@/hooks/useLearner'
import { getOrbit } from '@/lib/desktop'
import './video.css'

const EMBED_ORIGIN = 'https://www.youtube-nocookie.com'
/** Thumbnails live on the plain host; the nocookie domain does not serve them. */
const THUMB_ORIGIN = 'https://i.ytimg.com'
const WATCH_ORIGIN = 'https://www.youtube.com'

/** YouTube ids are exactly 11 characters of URL-safe base64. */
export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

/** Don't write a position more than once every few seconds. */
const SAVE_EVERY_MS = 5000

export interface VideoEmbedProps {
  /** The provider's video id. */
  videoId: string
  /** Caption under the frame: title, channel, running time. */
  caption?: string
}

interface Info {
  currentTime?: number
  duration?: number
}

export function VideoEmbed({ videoId, caption }: VideoEmbedProps) {
  const { state, setMedia } = useLearner()
  const [playing, setPlaying] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const lastSaveRef = useRef(0)

  const saved: MediaProgress | undefined = state.media[videoId]
  const startAt = saved && !isMediaComplete(saved) ? Math.floor(saved.seconds) : 0

  /* ── position, straight from the embed ─────────────────────────────────── */
  useEffect(() => {
    if (!playing) return

    const post = (message: unknown) => {
      frameRef.current?.contentWindow?.postMessage(JSON.stringify(message), EMBED_ORIGIN)
    }

    const onMessage = (event: MessageEvent) => {
      // Origin first: anything can postMessage into this window.
      if (event.origin !== EMBED_ORIGIN) return
      if (typeof event.data !== 'string') return

      let payload: { event?: string; info?: Info }
      try {
        payload = JSON.parse(event.data) as { event?: string; info?: Info }
      } catch {
        return
      }
      const info = payload.info
      if (!info || typeof info.currentTime !== 'number') return

      const now = Date.now()
      if (now - lastSaveRef.current < SAVE_EVERY_MS) return
      lastSaveRef.current = now
      setMedia(videoId, {
        seconds: info.currentTime,
        duration: typeof info.duration === 'number' && info.duration > 0 ? info.duration : undefined,
        at: new Date().toISOString(),
      })
    }

    addEventListener('message', onMessage)
    // The frame ignores anything sent before it is ready, so ask repeatedly
    // for the first few seconds rather than racing its load event.
    const hello = setInterval(() => post({ event: 'listening', id: videoId }), 1000)
    const stopHello = setTimeout(() => clearInterval(hello), 8000)

    return () => {
      removeEventListener('message', onMessage)
      clearInterval(hello)
      clearTimeout(stopHello)
    }
  }, [playing, videoId, setMedia])

  const openExternally = useCallback(() => {
    const url = `${WATCH_ORIGIN}/watch?v=${encodeURIComponent(videoId)}`
    const orbit = getOrbit()
    if (orbit) void orbit.openExternal(url)
    else window.open(url, '_blank', 'noopener,noreferrer')
  }, [videoId])

  if (!VIDEO_ID_RE.test(videoId)) {
    return (
      <div className="video video--broken">
        <p>This video reference is malformed, so there is nothing to play here.</p>
      </div>
    )
  }

  const resumeLabel = startAt > 0 ? `Resume at ${formatClock(startAt)}` : 'Play'
  const watched = saved ? isMediaComplete(saved) : false

  return (
    <figure className="video">
      <div className="video__frame">
        {playing ? (
          <iframe
            ref={frameRef}
            className="video__iframe"
            src={`${EMBED_ORIGIN}/embed/${videoId}?${embedParams(startAt)}`}
            title={caption ?? 'Lesson video'}
            allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin"
            loading="lazy"
          />
        ) : (
          <button className="video__poster" onClick={() => setPlaying(true)} type="button">
            {posterFailed ? (
              <span className="video__placeholder" aria-hidden="true" />
            ) : (
              <img
                src={`${THUMB_ORIGIN}/vi/${videoId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                onError={() => setPosterFailed(true)}
              />
            )}
            <span className="video__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            <span className="video__cta">{resumeLabel}</span>
          </button>
        )}
      </div>

      <figcaption className="video__caption">
        <span className="video__text">
          {watched ? <span className="video__badge">Watched</span> : null}
          {caption ?? 'Lesson video'}
        </span>
        <button className="video__external" onClick={openExternally} type="button">
          Open in browser
        </button>
      </figcaption>
    </figure>
  )
}

/**
 * Built only once she has pressed play, because it reads `location.origin`,
 * which does not exist when the renderer runs outside a browser.
 */
function embedParams(startAt: number): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    autoplay: '1',
  })
  if (typeof location !== 'undefined') params.set('origin', location.origin)
  if (startAt > 0) params.set('start', String(startAt))
  return params.toString()
}

/** Seconds to m:ss, or h:mm:ss past an hour. */
export function formatClock(total: number): string {
  const s = Math.max(0, Math.floor(total))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  return `${hours > 0 ? `${hours}:` : ''}${mm}:${String(seconds).padStart(2, '0')}`
}
