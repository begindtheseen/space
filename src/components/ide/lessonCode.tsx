/* ============================================================================
   Runnable code inside lesson text
   ----------------------------------------------------------------------------
   Hands the markdown renderer a way to draw a lesson's fenced code blocks as
   the embedded playground, wherever the block can run here as written (see
   lib/practice.ts). Anything else — output listings, fragments, commands for
   a real machine — stays a plain block.

   A Python snippet that uses a module an earlier snippet in the same lesson
   imported gets those imports added, silently, on one line ahead of it, so
   a lesson written notebook-style still runs block by block.
   ========================================================================== */
import { useMemo } from 'react'
import type { CodeRenderer } from '@/lib/markdown'
import { runnableFence } from '@/lib/practice'
import { echoExpressions, fromTranscript } from './echo'
import { PlaygroundEmbed } from './Embed'

function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return h.toString(36)
}

const IMPORT = /^(?:import\s+[\w.]+(?:\s+as\s+\w+)?(?:\s*,\s*[\w.]+(?:\s+as\s+\w+)?)*|from\s+[\w.]+\s+import\s+.+)$/

/** Import lines from Python blocks before `code` in `body` that `code` does not have itself. */
export function importsBefore(body: string, code: string): string {
  const at = body.indexOf(code)
  const before = at >= 0 ? body.slice(0, at) : ''
  const blocks = [...before.matchAll(/```(?:python|py)\s*\n([\s\S]*?)```/g)].map((m) => m[1]!)
  const have = new Set(code.split('\n').map((l) => l.trim()))
  const lines: string[] = []
  for (const b of blocks)
    for (const raw of b.split('\n')) {
      const l = raw.trim()
      if (IMPORT.test(l) && !have.has(l) && !lines.includes(l)) lines.push(l)
    }
  return lines.join('; ')
}

/** The code renderer for one lesson; edits are kept per lesson and snippet. */
export function useLessonCode(saveBase: string, body: string | null, schema?: string): CodeRenderer {
  return useMemo(
    () => (info: string, code: string) => {
      const lang = runnableFence(info, code)
      if (!lang) return null
      // A REPL transcript opens as the code she would type; run, it prints the transcript's output.
      const typed = lang === 'python' ? fromTranscript(code) : code
      const prelude = lang === 'python' && body ? importsBefore(body, code) : ''
      return (
        <PlaygroundEmbed
          lang={lang}
          code={typed}
          saveKey={`${saveBase}:${hash(code)}`}
          {...(prelude ? { prelude } : {})}
          {...(lang === 'sql' && schema ? { schema } : {})}
          // A transcript echoes every expression, as the REPL it came from did.
          transform={(c) => echoExpressions(lang, c, typed !== code)}
          minHeight={90}
        />
      )
    },
    [saveBase, body, schema],
  )
}
