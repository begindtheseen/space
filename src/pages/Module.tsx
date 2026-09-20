/* ============================================================================
   ORBIT — module page
   ----------------------------------------------------------------------------
   Everything about one module, and the one decision it has to make well: if
   this is locked, say so plainly and point upstream instead of letting someone
   grind against material they do not have the prerequisites for.
   ========================================================================== */
import { useMemo, useState } from 'react'
import {
  IconArrowRight,
  IconBook,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconLink,
  IconLock,
  IconRecall,
  IconRoute,
  IconStar,
  IconTarget,
  IconTerminal,
  IconWarn,
} from '@/components/icons'
import { Bar, Button, Card, CardHead, Chip, Empty, Ring, Segmented, Tile } from '@/components/ui'
import { TRACKS, moduleById } from '@/curriculum'
import type { Exercise, Module, Resource } from '@/curriculum/types'
import { togglePin } from '@/engine/apply'
import { atomsOf, dueAtoms } from '@/engine/scheduler'
import { diagnoseModule } from '@/engine/diagnose'
import { getItem } from '@/engine/state'
import { currentR } from '@/engine/fsrs'
import { useLearner } from '@/hooks/useLearner'
import { Markdown } from '@/lib/markdown'
import { navigate, useRoute } from '@/lib/router'
import './pages.css'

type Tab = 'overview' | 'lessons' | 'practice' | 'items'

export function ModulePage({ id }: { id: string }) {
  const { state, dag, mastery, setState } = useLearner()
  const route = useRoute()
  const module = moduleById(id)
  const [tab, setTab] = useState<Tab>(route.query.ex ? 'practice' : 'overview')
  const now = useMemo(() => new Date(), [])

  // Every hook has to run before the not-found branch below, or navigating
  // from a real module to a bad id changes the hook count between renders.
  const findings = useMemo(
    () => (module ? diagnoseModule(state, dag, module, now) : []),
    [state, dag, module, now],
  )

  if (!module) {
    return (
      <div className="page page--padtop">
        <Empty
          icon={<IconWarn size={30} />}
          title="No such module"
          body={`Nothing in the curriculum has the id “${id}”.`}
          action={
            <Button variant="primary" size="md" onClick={() => navigate('/learning')}>
              Browse the curriculum
            </Button>
          }
        />
      </div>
    )
  }

  const track = TRACKS[module.track]
  const mast = mastery.get(module.id) ?? 0
  const blockerIds = dag.blockers(module.id, mastery)
  const locked = blockerIds.length > 0
  const due = dueAtoms(state, [module], now).length
  const atoms = atomsOf(module)
  const seen = atoms.filter((a) => (state.items[a.id]?.memory.reps ?? 0) > 0).length
  const pinned = state.pinned.includes(module.id)

  const tabs: { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    ...((module.lessons?.length ?? 0) > 0 ? [{ value: 'lessons' as Tab, label: 'Lessons' }] : []),
    ...((module.exercises?.length ?? 0) > 0 ? [{ value: 'practice' as Tab, label: 'Practice' }] : []),
    { value: 'items', label: `Items (${atoms.length})` },
  ]

  return (
    <div className="page page--padtop">
      <button
        className="btn btn--quiet btn--sm"
        onClick={() => navigate(trackPath(module.track))}
        style={{ marginTop: 14, paddingLeft: 6 }}
        type="button"
      >
        <IconChevronLeft size={14} />
        {track.title}
      </button>

      <div className="page-head" style={{ paddingTop: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker" style={{ color: track.accent }}>
            <IconRoute size={13} />
            Tier {module.tier} · {module.hours} hours
            {module.tags?.map((t) => (
              <span key={t} style={{ marginLeft: 6 }}>
                <Chip ghost>{t}</Chip>
              </span>
            ))}
          </div>
          <h1 className="h-page">{module.title}</h1>
          <p className="page-head__sub">{module.summary}</p>
        </div>
        <Ring value={mast} size={68} thickness={5} color={track.accent} />
      </div>

      {locked ? <LockedBanner dag={dag} blockerIds={blockerIds} /> : null}

      {findings.length > 0 ? (
        <Card index={0} style={{ marginBottom: 'var(--gap)' }}>
          <CardHead icon={<IconRecall size={15} />} title="What the engine sees" divided />
          {findings.slice(0, 3).map((f, i) => (
            <div className="signal" key={i}>
              <span className="signal__dot" />
              <div className="grow">
                <div className="signal__msg">{f.message}</div>
                <div className="signal__action">{f.action}</div>
              </div>
            </div>
          ))}
        </Card>
      ) : null}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 'var(--gap)' }}>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate(`/review?module=${module.id}`)}
          disabled={atoms.length === 0}
        >
          <IconRecall size={15} />
          {due > 0 ? `Review ${due} due` : seen === 0 ? 'Start studying' : 'Study this module'}
          <IconArrowRight size={15} />
        </Button>
        <Button variant="ghost" size="lg" onClick={() => setState((s) => togglePin(s, module.id))}>
          <IconStar size={15} />
          {pinned ? 'Pinned' : 'Pin'}
        </Button>
      </div>

      <div style={{ marginBottom: 'var(--gap)' }}>
        <Segmented value={tab} options={tabs} onChange={setTab} />
      </div>

      <div className="read">
        <div className="stack">
          {tab === 'overview' ? <Overview module={module} /> : null}
          {tab === 'lessons' ? <Lessons module={module} /> : null}
          {tab === 'practice' ? <Practice module={module} highlight={route.query.ex} /> : null}
          {tab === 'items' ? <Items module={module} /> : null}
        </div>

        <div className="stack">
          <Card index={0}>
            <CardHead icon={<IconTarget size={15} />} title="Progress" divided />
            <div className="sect">
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <Bar
                  value={mast}
                  height={5}
                  fill={`linear-gradient(90deg, ${track.accent}55, ${track.accent})`}
                />
                <span style={{ fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(mast * 100)}%
                </span>
              </div>
              <div style={{ marginTop: 13, fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.8 }}>
                <div>
                  {seen} of {atoms.length} items seen
                </div>
                <div>{due} due for review now</div>
                <div>{module.resources.length} resources</div>
              </div>
            </div>
          </Card>

          <PrereqCard dag={dag} module={module} mastery={mastery} />
          <UnlocksCard dag={dag} module={module} />
          <ResourceCard resources={module.resources} />
        </div>
      </div>
    </div>
  )
}

/* ── Panels ──────────────────────────────────────────────────────────────── */

function LockedBanner({ dag, blockerIds }: { dag: ReturnType<typeof useLearner>['dag']; blockerIds: string[] }) {
  return (
    <Card
      index={0}
      style={{ marginBottom: 'var(--gap)', borderColor: 'rgba(240,168,72,0.28)' }}
    >
      <div style={{ padding: '15px 17px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Tile size={34} radius={9} color="var(--warn)">
          <IconLock size={16} />
        </Tile>
        <div className="grow">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            This one is gated, and that is on purpose
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.6 }}>
            You can study it anyway, but it will be much harder than it needs to be. Get{' '}
            {blockerIds
              .slice(0, 3)
              .map((b) => dag.get(b)?.title ?? b)
              .join(', ')}{' '}
            to 70% first.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 11, flexWrap: 'wrap' }}>
            {blockerIds.slice(0, 3).map((b) => (
              <Button key={b} variant="ghost" size="sm" onClick={() => navigate(`/module/${b}`)}>
                {dag.get(b)?.title ?? b}
                <IconArrowRight size={13} />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function Overview({ module }: { module: Module }) {
  return (
    <>
      <Card index={0}>
        <CardHead icon={<IconTarget size={15} />} title="What you will be able to do" divided />
        <div className="sect">
          <ul className="objlist">
            {module.objectives.map((o, i) => (
              <li key={i}>
                <IconCheck size={14} />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card index={1}>
        <CardHead icon={<IconBook size={15} />} title={`Topics (${module.topics.length})`} divided />
        <div className="sect">
          <div className="taglist">
            {module.topics.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </Card>
    </>
  )
}

function Lessons({ module }: { module: Module }) {
  const lessons = module.lessons ?? []
  if (lessons.length === 0) {
    return <Empty icon={<IconBook size={28} />} title="No written lessons yet" body="Work from the resources and exercises instead." />
  }
  return (
    <>
      {lessons.map((l, i) => (
        <Card key={l.id} index={i}>
          <CardHead
            icon={<IconBook size={15} />}
            title={l.title}
            right={
              <span className="eyebrow-dim">
                <IconClock size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {l.minutes}m
              </span>
            }
            divided
          />
          <div className="sect">
            <Markdown>{l.body}</Markdown>
          </div>
        </Card>
      ))}
    </>
  )
}

function Practice({ module, highlight }: { module: Module; highlight?: string }) {
  const exercises = module.exercises ?? []
  if (exercises.length === 0) {
    return <Empty icon={<IconTerminal size={28} />} title="No exercises in this module" />
  }
  return (
    <>
      {exercises.map((ex, i) => (
        <ExerciseCard key={ex.id} exercise={ex} index={i} highlighted={ex.id === highlight} />
      ))}
    </>
  )
}

function ExerciseCard({
  exercise,
  index,
  highlighted,
}: {
  exercise: Exercise
  index: number
  highlighted: boolean
}) {
  const [showSolution, setShowSolution] = useState(false)
  const runnable = exercise.kind === 'code' && !!exercise.lang

  return (
    <Card
      index={index}
      style={highlighted ? { borderColor: 'var(--line-blue-strong)' } : undefined}
    >
      <CardHead
        icon={<IconTerminal size={15} />}
        title={exercise.title}
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            <Chip ghost>{exercise.kind}</Chip>
            {exercise.lang ? <Chip tone="blue">{exercise.lang}</Chip> : null}
          </div>
        }
        divided
      />
      <div className="sect">
        <Markdown>{exercise.prompt}</Markdown>

        <div style={{ display: 'flex', gap: 9, marginTop: 15, flexWrap: 'wrap' }}>
          {runnable ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/playground?ex=${encodeURIComponent(exercise.id)}`)}
            >
              <IconTerminal size={14} />
              Open in playground
            </Button>
          ) : null}
          {exercise.solution ? (
            <Button variant="ghost" size="sm" onClick={() => setShowSolution((s) => !s)}>
              {showSolution ? 'Hide solution' : 'Show solution'}
            </Button>
          ) : null}
        </div>

        {showSolution && exercise.solution ? (
          <div style={{ marginTop: 15 }}>
            <Markdown>{'```' + (exercise.lang ?? '') + '\n' + exercise.solution + '\n```'}</Markdown>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

function Items({ module }: { module: Module }) {
  const { state } = useLearner()
  const now = new Date()
  const cards = module.cards ?? []
  const quiz = module.quiz ?? []

  return (
    <>
      <Card index={0}>
        <CardHead icon={<IconRecall size={15} />} title={`Flashcards (${cards.length})`} divided />
        <div className="sect">
          {cards.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>None yet.</p>
          ) : (
            cards.map((c) => {
              const it = getItem(state, `${module.id}::card::${c.id}`)
              const r = it.memory.reps > 0 ? currentR(it.memory, now) : null
              return (
                <div className="rsrc" key={c.id}>
                  <span className="rsrc__kind">{r == null ? 'new' : `${Math.round(r * 100)}%`}</span>
                  <div className="grow">
                    <div className="rsrc__title">{c.front}</div>
                    <div className="rsrc__by">{c.back}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card index={1}>
        <CardHead icon={<IconTarget size={15} />} title={`Questions (${quiz.length})`} divided />
        <div className="sect">
          {quiz.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>None yet.</p>
          ) : (
            quiz.map((q) => {
              const it = getItem(state, `${module.id}::quiz::${q.id}`)
              const acc = it.attempts > 0 ? it.correct / it.attempts : null
              return (
                <div className="rsrc" key={q.id}>
                  <span className="rsrc__kind">
                    {acc == null ? 'new' : `${Math.round(acc * 100)}%`}
                  </span>
                  <div className="grow">
                    <div className="rsrc__title">{q.q}</div>
                    <div className="rsrc__by">
                      {q.bloom ?? 'recall'} · difficulty {(q.b ?? 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </>
  )
}

function PrereqCard({
  dag,
  module,
  mastery,
}: {
  dag: ReturnType<typeof useLearner>['dag']
  module: Module
  mastery: Map<string, number>
}) {
  const prereqs = dag.prereqs(module.id)
  if (prereqs.length === 0) {
    return (
      <Card index={1}>
        <CardHead icon={<IconRoute size={15} />} title="Prerequisites" divided />
        <div className="sect" style={{ fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.6 }}>
          None. This is an entry point — you can start it today with no background at all.
        </div>
      </Card>
    )
  }

  return (
    <Card index={1}>
      <CardHead icon={<IconRoute size={15} />} title={`Prerequisites (${prereqs.length})`} divided />
      <div className="sect">
        {prereqs.map((p) => {
          const m = dag.get(p)
          const v = mastery.get(p) ?? 0
          const ok = v >= 0.7
          return (
            <button
              key={p}
              className="rsrc"
              onClick={() => navigate(`/module/${p}`)}
              style={{ width: '100%', textAlign: 'left' }}
              type="button"
            >
              <span className="rsrc__kind" style={{ color: ok ? 'var(--ok)' : 'var(--warn)' }}>
                {Math.round(v * 100)}%
              </span>
              <div className="grow">
                <div className="rsrc__title">{m?.title ?? p}</div>
                <div className="rsrc__by">{ok ? 'Ready' : 'Needs 70% to unlock this'}</div>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function UnlocksCard({ dag, module }: { dag: ReturnType<typeof useLearner>['dag']; module: Module }) {
  const direct = dag.childrenOf(module.id)
  const total = dag.descendants(module.id).size
  if (total === 0) return null

  return (
    <Card index={2}>
      <CardHead icon={<IconLink size={15} />} title={`Unlocks ${total}`} divided />
      <div className="sect">
        {direct.slice(0, 6).map((c) => (
          <button
            key={c}
            className="rsrc"
            onClick={() => navigate(`/module/${c}`)}
            style={{ width: '100%', textAlign: 'left' }}
            type="button"
          >
            <div className="grow">
              <div className="rsrc__title">{dag.get(c)?.title ?? c}</div>
            </div>
            <IconArrowRight size={13} style={{ color: 'var(--ink-5)' }} />
          </button>
        ))}
        {total > direct.length ? (
          <p style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 10 }}>
            …and {total - direct.length} further downstream.
          </p>
        ) : null}
      </div>
    </Card>
  )
}

function ResourceCard({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null
  // Free first — the whole point is that this is studiable without spending.
  const sorted = [...resources].sort((a, b) => Number(b.free) - Number(a.free))

  return (
    <Card index={3}>
      <CardHead icon={<IconBook size={15} />} title={`Resources (${resources.length})`} divided />
      <div className="sect">
        {sorted.map((r, i) => (
          <div className="rsrc" key={i}>
            <span className="rsrc__kind">{r.kind}</span>
            <div className="grow">
              {r.url ? (
                <a
                  className="rsrc__title"
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ display: 'inline-block' }}
                >
                  {r.title}
                </a>
              ) : (
                <span className="rsrc__title">{r.title}</span>
              )}
              <div className="rsrc__by">
                {r.author ? `${r.author} · ` : ''}
                {r.free ? 'free' : 'paid'}
                {r.note ? ` · ${r.note}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function trackPath(track: Module['track']): string {
  return track === 'gnc' ? '/gnc' : `/${track}`
}
