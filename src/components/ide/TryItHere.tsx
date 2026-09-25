/* ============================================================================
   "Try it here": the playground at the foot of a lesson
   ----------------------------------------------------------------------------
   Under a lesson's text (and in a module's Build step), the embedded
   playground in the languages that module works in, so putting the idea into
   code never means leaving the page. Code is kept per module and language.
   ========================================================================== */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Lang } from '@/curriculum/types'
import { LANGS } from '@/lib/runtimes'
import { CPP_STDIN, SCRATCH, SQL_SCHEMA } from '@/lib/scratch'
import { PlaygroundEmbed } from './Embed'
import { LangMark } from './index'

export function TryItHere({
  langs,
  saveKey,
  title = 'Try it here',
  intro,
}: {
  langs: Lang[]
  /** Kept as `<saveKey>:<lang>` in the learner's saved code. */
  saveKey: string
  title?: string
  intro?: ReactNode
}) {
  const [lang, setLang] = useState<Lang>(langs[0]!)
  if (!langs.length) return null
  return (
    <section className="tryit" aria-label={title}>
      <div className="tryit__head">
        <h2 className="tryit__title">{title}</h2>
        {langs.length > 1 ? (
          <div className="tryit__langs" role="tablist" aria-label="Language">
            {langs.map((l) => (
              <button key={l} type="button" role="tab" aria-selected={l === lang} data-active={l === lang} className="tryit__lang" onClick={() => setLang(l)}>
                <LangMark lang={l} size={16} />
                {LANGS[l]?.label ?? l}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p className="tryit__intro">
        {intro ?? 'Put the idea into code without leaving the lesson. It runs right here, and what you write is kept with this module.'}
      </p>
      <PlaygroundEmbed
        key={lang}
        lang={lang}
        code={lang === 'bash' ? '' : (SCRATCH[lang] ?? '')}
        saveKey={`${saveKey}:${lang}`}
        {...(lang === 'sql' ? { schema: SQL_SCHEMA } : {})}
        {...(lang === 'cpp' && CPP_STDIN ? { stdin: CPP_STDIN } : {})}
        minHeight={220}
      />
    </section>
  )
}
