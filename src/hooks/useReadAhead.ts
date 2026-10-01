import { useEffect, useRef } from 'react'
import { useLearner } from '@/hooks/useLearner'
import { DEFAULT_SPEECH_RATE } from '@/lib/speech'
import { readAhead, type Source } from '@/lib/voice/ahead'

/**
 * Makes the openings of these lessons ahead (lib/voice/ahead.ts), in her voice and speed, while this page is
 * open. `key` names the list: a new key replaces it, null makes none. `sources` is read when the key changes.
 */
export function useReadAhead(key: string | null, sources: () => Source[]): void {
  const { state } = useLearner()
  const voiceName = state.settings.voiceName
  const rate = state.settings.speechRate ?? DEFAULT_SPEECH_RATE
  const get = useRef(sources)
  get.current = sources
  useEffect(() => {
    if (!key) return
    return readAhead(get.current(), voiceName === undefined ? { rate } : { voiceName, rate })
  }, [key, voiceName, rate])
}
