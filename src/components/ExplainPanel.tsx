/* ============================================================================
   ORBIT — Explain, in the context panel
   ----------------------------------------------------------------------------
   Opens where a context note opens. First, the note that explains the words
   she highlighted, the lesson it comes from, and whether she has read that
   lesson; then any other notes on the same idea, a flashcard if one defines
   it, and the places in lessons she has read where the words came up before.
   Everything comes from the app itself (src/lib/explain.ts): no network, no
   waiting, no cost.
   ========================================================================== */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconBook, IconSpark, IconX } from '@/components/icons'
import { Chip } from '@/components/ui'
import { searchLessons } from '@/curriculum/lessons'
import { moduleById } from '@/curriculum'
import { useLearner } from '@/hooks/useLearner'
import { claimCtx, holdCtxOpen, onCtxClaimed } from '@/lib/ctxBus'
import {
  matchCards,
  pickPassages,
  rankNotes,
  snippet,
  type CardHit,
  type ExplainSeed,
  type LibraryLesson,
  type Passage,
  type RankedNote,
} from '@/lib/explain'
import { allCards, lessonLabel, libraryKeys, loadLibrary, loadNotes } from '@/lib/explainLibrary'
import { Markdown } from '@/lib/markdown'
import './context-panel.css'

interface Found {
  notes: RankedNote[]
  cards: CardHit[]
  passages: Passage[]
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s)

/** Pictures in notes are drawn as images, exactly as the note panel draws them. */
const drawSvg = (lang: string, code: string) =>
  lang === 'svg' ? (
    <img className="ctx-panel__pic" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(code.trim())}`} alt="" />
  ) : null

const WHERE: Record<RankedNote['where'], { label: string; tone: 'default' | 'blue' | 'ok' }> = {
  here: { label: 'this lesson', tone: 'blue' },
  read: { label: 'you read this', tone: 'ok' },
  earlier: { label: 'earlier lesson', tone: 'default' },
  ahead: { label: 'coming up', tone: 'default' },
}

function NoteSource({ r }: { r: RankedNote }) {
  const label = lessonLabel(r.note.m, r.note.l)
  if (!label) return null
  return (
    <div className="explain__from">
      <IconBook size={12} />
      {r.where === 'here' ? (
        <span>From this lesson</span>
      ) : (
        <a href={`#/module/${r.note.m}?lesson=${r.note.l}`}>
          {label.title} <span>· {label.module}</span>
        </a>
      )}
      <Chip tone={WHERE[r.where].tone}>{WHERE[r.where].label}</Chip>
    </div>
  )
}

export function ExplainPanel({ seed, here, onClose }: { seed: ExplainSeed; here: LibraryLesson; onClose: () => void }) {
  const { state } = useLearner()
  const [found, setFound] = useState<Found | null>(null)
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLElement | null>(null)
  // Read once per highlight: marking a lesson read while the panel is open should not reshuffle it.
  const stateRef = useRef(state)
  stateRef.current = state

  useLayoutEffect(() => {
    claimCtx('explain')
    return holdCtxOpen()
  }, [])
  useEffect(() => onCtxClaimed('explain', onClose), [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let alive = true
    setFound(null)
    setFailed(false)
    ref.current?.scrollTo({ top: 0 })
    ref.current?.focus({ preventScroll: true })
    const s = stateRef.current
    const at = { moduleId: here.moduleId, lessonId: here.lessonId }
    const keys = libraryKeys(s, at)
    const me = { here: at, read: new Set(Object.keys(s.read)), earlier: new Set(keys) }
    const known = new Set(keys.map((k) => k.split('::')[0]))
    Promise.all([loadNotes(), loadLibrary(keys)])
      .then(([notes, library]) => {
        if (!alive) return
        setFound({
          notes: rankNotes(seed, notes, me),
          // Only cards from modules she is in or has read from: a card from far ahead
          // defines the word in a sense she has not met yet.
          cards: matchCards(seed, allCards().filter((c) => c.moduleId === here.moduleId || known.has(c.moduleId))),
          passages: pickPassages(seed, library, 3),
        })
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [seed, here])

  const [best, ...more] = found?.notes ?? []
  const empty = found && !best && !found.cards.length && !found.passages.length
  const taughtIn = empty ? searchLessons(seed.selection, (id) => moduleById(id)?.title, 3) : []

  return createPortal(
    <aside className="ctx-panel explain" role="dialog" aria-modal="false" aria-labelledby="explain-title" tabIndex={-1} ref={ref}>
      <div className="ctx-panel__head">
        <div style={{ minWidth: 0 }}>
          <div className="ctx-panel__kicker">
            <IconSpark size={12} /> Explain
          </div>
          <h2 className="ctx-panel__title explain__title" id="explain-title">
            “{clip(seed.selection.replace(/\s+/g, ' ').trim(), 90)}”
          </h2>
        </div>
        <button type="button" className="ctx-panel__close" onClick={onClose} aria-label="Close Explain">
          <IconX size={15} />
        </button>
      </div>

      {failed ? <p className="explain__empty">The explanations could not be loaded. Close this and try again.</p> : null}
      {!found && !failed ? <p className="explain__status">Looking through what you have learned…</p> : null}

      {best ? (
        <section className="explain__best">
          <h3 className="explain__h">{best.note.title}</h3>
          <Markdown className="ctx-panel__body" renderCode={drawSvg}>
            {best.note.body}
          </Markdown>
          <NoteSource r={best} />
        </section>
      ) : null}

      {found?.cards.length ? (
        <section className="explain__sect">
          <div className="explain__label">Flashcard</div>
          {found.cards.map((c) => (
            <div key={`${c.moduleId}:${c.front}`} className="explain__card">
              <Markdown className="explain__card-front">{c.front}</Markdown>
              <Markdown className="explain__card-back">{c.back}</Markdown>
            </div>
          ))}
        </section>
      ) : null}

      {more.length ? (
        <section className="explain__sect">
          <div className="explain__label">More on this</div>
          {more.map((r) => (
            <details key={`${r.note.m}:${r.note.l}:${r.note.id}`} className="explain__more">
              <summary>{r.note.title}</summary>
              <Markdown className="ctx-panel__body" renderCode={drawSvg}>
                {r.note.body}
              </Markdown>
              <NoteSource r={r} />
            </details>
          ))}
        </section>
      ) : null}

      {found?.passages.length ? (
        <section className="explain__sect">
          <div className="explain__label">Where you met it before</div>
          {found.passages.map((p) => (
            <a
              key={`${p.lesson.moduleId}:${p.lesson.lessonId}:${p.text.slice(0, 24)}`}
              className="explain__passage"
              href={`#/module/${p.lesson.moduleId}?lesson=${p.lesson.lessonId}`}
            >
              <Markdown className="explain__quote">{snippet(p.text, seed)}</Markdown>
              <span className="explain__passage-from">
                {p.lesson.title} · {p.lesson.moduleTitle.split(':')[0]}
              </span>
            </a>
          ))}
        </section>
      ) : null}

      {empty ? (
        <div className="explain__empty">
          <p>Nothing you have read explains this yet. Try highlighting just the key word or two.</p>
          {taughtIn.length ? (
            <>
              <div className="explain__label">It is taught in</div>
              <ul>
                {taughtIn.map((h) => (
                  <li key={`${h.moduleId}:${h.lesson.id}`}>
                    <a href={`#/module/${h.moduleId}?lesson=${h.lesson.id}`}>{h.lesson.title}</a>
                    <span> · {h.moduleTitle.split(':')[0]}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </aside>,
    document.body,
  )
}
