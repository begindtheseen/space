/* ============================================================================
   ORBIT — the knowledge tree
   ----------------------------------------------------------------------------
   The whole corpus in one place, with three ways in: what is open to you now,
   what everything depends on, and search.
   ========================================================================== */
import { useMemo, useState } from 'react'
import { ModuleCard } from '@/components/ModuleCard'
import {
  IconArrowRight,
  IconBook,
  IconLock,
  IconRecall,
  IconRoute,
  IconSearch,
  IconStar,
  IconX,
} from '@/components/icons'
import { Button, Card, CardHead, Empty, Segmented, Stat } from '@/components/ui'
import { MODULES, TRACKS, corpusStats, searchLessonsIn, searchModules } from '@/curriculum'
import type { Module, TrackId } from '@/curriculum/types'
import { dueAtoms, rankFrontier } from '@/engine/scheduler'
import { useLearner } from '@/hooks/useLearner'
import { navigate } from '@/lib/router'
import './pages.css'

type View = 'next' | 'all' | 'pinned' | 'locked'

export function Learning() {
  const { state, dag, mastery } = useLearner()
  const [view, setView] = useState<View>('next')
  const [query, setQuery] = useState('')
  const now = useMemo(() => new Date(), [])

  const stats = useMemo(() => corpusStats(), [])

  const dueByModule = useMemo(() => {
    const out = new Map<string, number>()
    for (const d of dueAtoms(state, MODULES, now)) {
      out.set(d.moduleId, (out.get(d.moduleId) ?? 0) + 1)
    }
    return out
  }, [state, now])

  const ranked = useMemo(
    () => rankFrontier(state, dag, mastery, now),
    [state, dag, mastery, now],
  )

  const results = useMemo(() => (query.trim() ? searchModules(query, 40) : null), [query])

  /* Lessons are searched alongside modules because past a certain size the
     module is the wrong unit of answer. Someone looking for the thing about
     the intermediate axis wants that lesson, not the twelve-lesson module it
     lives in. */
  const lessonHits = useMemo(() => (query.trim() ? searchLessonsIn(query, 12) : []), [query])

  const shown: Module[] = useMemo(() => {
    if (results) return results
    switch (view) {
      case 'next':
        return ranked.slice(0, 18).map((c) => c.module)
      case 'pinned':
        return state.pinned.map((id) => dag.get(id)).filter((m): m is Module => !!m)
      case 'locked':
        return dag.all().filter((m) => dag.blockers(m.id, mastery).length > 0)
      default:
        return dag.all()
    }
  }, [results, view, ranked, state.pinned, dag, mastery])

  const totalDue = [...dueByModule.values()].reduce((a, b) => a + b, 0)
  const mastered = dag.all().filter((m) => (mastery.get(m.id) ?? 0) >= 0.9).length

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            <IconRoute size={13} />
            {stats.modules} modules · {Math.round(stats.hours).toLocaleString()} hours ·{' '}
            {(stats.cards + stats.quiz).toLocaleString()} items
          </div>
          <h1 className="h-page">The knowledge tree</h1>
          <p className="page-head__sub">
            Every module in the curriculum and what each one depends on. The engine will not hide
            anything from you — but it will tell you honestly when something is out of reach yet.
          </p>
        </div>
        {totalDue > 0 ? (
          <Button variant="primary" size="lg" onClick={() => navigate('/review')}>
            <IconRecall size={15} />
            Review {totalDue}
            <IconArrowRight size={15} />
          </Button>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(146px, 1fr))',
          gap: 'var(--gap)',
          marginBottom: 'var(--gap)',
        }}
      >
        <Card pad index={0}>
          <Stat value={`${mastered}/${stats.modules}`} label="Mastered" />
        </Card>
        <Card pad index={1}>
          <Stat value={ranked.length} label="Open now" />
        </Card>
        <Card pad index={2}>
          <Stat value={totalDue} label="Due today" />
        </Card>
        <Card pad index={3}>
          <Stat value={stats.exercises} label="Exercises" />
        </Card>
      </div>

      {/* ── controls ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 'var(--gap)',
        }}
      >
        <Segmented
          value={view}
          options={[
            { value: 'next', label: 'Open now' },
            { value: 'all', label: 'Everything' },
            { value: 'pinned', label: `Pinned${state.pinned.length ? ` (${state.pinned.length})` : ''}` },
            { value: 'locked', label: 'Gated' },
          ]}
          onChange={(v) => {
            setView(v)
            setQuery('')
          }}
        />

        <label className="search grow">
          <IconSearch size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, modules, topics…"
            aria-label="Search the curriculum"
          />
          {query ? (
            <button onClick={() => setQuery('')} aria-label="Clear search" type="button">
              <IconX size={14} />
            </button>
          ) : null}
        </label>
      </div>

      {/* ── lessons that match ────────────────────────────────────────────── */}
      {lessonHits.length > 0 ? (
        <div className="lhits">
          <div className="lhits__head">
            {lessonHits.length} lesson{lessonHits.length === 1 ? '' : 's'} match
          </div>
          <ul className="lhits__list">
            {lessonHits.map((h) => (
              <li key={`${h.moduleId}::${h.lesson.id}`}>
                <button
                  className="lhits__item"
                  onClick={() => navigate(`/module/${h.moduleId}?lesson=${h.lesson.id}`)}
                >
                  <span className="lhits__title">{h.lesson.title}</span>
                  <span className="lhits__where">
                    {h.moduleTitle}
                    {h.matchedTopic ? ` · ${h.matchedTopic}` : ''}
                  </span>
                  <span className="lhits__mins num">{h.lesson.minutes}m</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ── results ───────────────────────────────────────────────────────── */}
      {shown.length === 0 && lessonHits.length === 0 ? (
        <Empty
          icon={view === 'pinned' ? <IconStar size={28} /> : <IconBook size={28} />}
          title={
            results
              ? `Nothing matches “${query}”`
              : view === 'pinned'
                ? 'Nothing pinned yet'
                : 'Nothing here'
          }
          body={
            view === 'pinned'
              ? 'Pin a module from its page to keep it in reach.'
              : 'Try a different filter or search term.'
          }
        />
      ) : shown.length === 0 ? null : (
        <>
          {results ? (
            <p style={{ fontSize: 11.5, color: 'var(--ink-4)', marginBottom: 12 }}>
              {results.length} match{results.length === 1 ? '' : 'es'}
            </p>
          ) : null}
          <div className="mgrid">
            {shown.map((m, i) => (
              <ModuleCard
                key={m.id}
                module={m}
                mastery={mastery.get(m.id) ?? 0}
                blockers={dag.blockers(m.id, mastery).map((b) => dag.get(b)?.title ?? b)}
                unlocks={dag.descendants(m.id).size}
                accent={TRACKS[m.track].accent}
                due={dueByModule.get(m.id) ?? 0}
                index={i}
              />
            ))}
          </div>
        </>
      )}

      {view === 'next' && !results && ranked.length > 0 ? <WhyThisOrder /> : null}
      {view === 'locked' && !results ? <GatedExplainer /> : null}

      <TrackLegend />
    </div>
  )
}

function WhyThisOrder() {
  return (
    <Card index={0} style={{ marginTop: 26 }}>
      <CardHead icon={<IconRoute size={15} />} title="Why this order" divided />
      <div className="sect" style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
        These are ranked, not listed alphabetically. Four things go into the score: how close the
        module sits to the difficulty where you learn fastest (~85% success), how much of it is
        decaying, whether you have touched it at all, and how many other modules it unblocks. A
        module that opens twelve doors beats one that opens none.
      </div>
    </Card>
  )
}

function GatedExplainer() {
  return (
    <Card index={0} style={{ marginTop: 26 }}>
      <CardHead icon={<IconLock size={15} />} title="About gating" divided />
      <div className="sect" style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
        Nothing is actually locked — you can open any module and study it. The gate is advice, not a
        wall: a prerequisite needs to reach 70% before its dependants stop being unnecessarily hard.
        Pushing past that is how people end up bouncing off the Kalman filter and concluding they
        are bad at maths, when the real gap was three modules upstream.
      </div>
    </Card>
  )
}

function TrackLegend() {
  return (
    <div className="legend">
      {(Object.keys(TRACKS) as TrackId[]).map((t) => (
        <button key={t} onClick={() => navigate(t === 'gnc' ? '/gnc' : `/${t}`)} type="button">
          <span style={{ background: TRACKS[t].accent }} />
          {TRACKS[t].title}
        </button>
      ))}
    </div>
  )
}
