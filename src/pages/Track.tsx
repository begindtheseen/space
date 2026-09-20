/* ============================================================================
   ORBIT — track page
   ----------------------------------------------------------------------------
   One pillar, laid out as the dependency ladder it actually is: tier by tier,
   foundations at the top, with what is open now separated from what is still
   gated.
   ========================================================================== */
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { ModuleCard } from '@/components/ModuleCard'
import {
  IconArrowRight,
  IconBriefcase,
  IconCode,
  IconRecall,
  IconTarget,
  IconSigma,
  type IconProps,
} from '@/components/icons'
import { Bar, Button, Card, CardHead, Chip, Empty, Ring, Stat } from '@/components/ui'
import { TRACKS, corpusStats, modulesInTrack, tiersInTrack } from '@/curriculum'
import type { TrackId } from '@/curriculum/types'
import { rankFrontier, atomsOf, dueAtoms } from '@/engine/scheduler'
import { useLearner } from '@/hooks/useLearner'
import { navigate } from '@/lib/router'
import './pages.css'

const TRACK_ICON: Record<TrackId, (p: IconProps) => ReactNode> = {
  foundations: IconSigma,
  coding: IconCode,
  gnc: IconTarget,
  career: IconBriefcase,
}

/** Human labels for the tier ladder, per track. */
const TIER_LABELS: Record<TrackId, Record<number, string>> = {
  foundations: {
    0: 'Mathematical & computational foundations',
    1: 'Dynamics',
    2: 'Astrodynamics',
  },
  gnc: {
    3: 'Control theory',
    4: 'Estimation & navigation',
    5: 'Guidance',
    6: 'Flight software, simulation & V&V',
    7: 'Integration & career',
  },
  coding: {
    0: 'First contact',
    1: 'Core language',
    2: 'Working fluency',
    3: 'Engineering practice',
    4: 'Production & performance',
    5: 'Specialisation',
    6: 'Interview readiness',
    7: 'Mastery',
  },
  career: {
    0: 'Eligibility & reality check',
    1: 'The roles',
    2: 'Materials',
    3: 'The loop',
    4: 'Technical rounds',
    5: 'Presenting your work',
    6: 'Negotiation & offer',
    7: 'Long game',
  },
}

export function Track({ track }: { track: TrackId }) {
  const { state, dag, mastery, trackReadiness } = useLearner()
  const def = TRACKS[track]
  const Icon = TRACK_ICON[track]
  const now = useMemo(() => new Date(), [])

  const modules = useMemo(() => modulesInTrack(track), [track])
  const tiers = useMemo(() => tiersInTrack(track), [track])
  const stats = useMemo(() => corpusStats(modules), [modules])

  const dueByModule = useMemo(() => {
    const out = new Map<string, number>()
    for (const d of dueAtoms(state, modules, now)) {
      out.set(d.moduleId, (out.get(d.moduleId) ?? 0) + 1)
    }
    return out
  }, [state, modules, now])

  const nextUp = useMemo(() => {
    const ranked = rankFrontier(state, dag, mastery, now).filter((c) => c.module.track === track)
    return ranked[0]
  }, [state, dag, mastery, now, track])

  const readiness = trackReadiness[track]
  const unlockedCount = modules.filter((m) => dag.unlocked(m.id, mastery)).length
  const doneCount = modules.filter((m) => (mastery.get(m.id) ?? 0) >= 0.9).length
  const totalDue = [...dueByModule.values()].reduce((a, b) => a + b, 0)

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker" style={{ color: def.accent }}>
            <Icon size={13} />
            {stats.modules} modules · {Math.round(stats.hours)} hours
          </div>
          <h1 className="h-page">{def.title}</h1>
          <p className="page-head__sub">{def.blurb}</p>
        </div>
        <Ring value={readiness} size={68} thickness={5} color={def.accent} />
      </div>

      {/* ── status strip ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--gap)',
          marginBottom: 'var(--gap)',
        }}
      >
        <Card pad index={0}>
          <Stat value={`${doneCount}/${stats.modules}`} label="Modules mastered" />
        </Card>
        <Card pad index={1}>
          <Stat value={unlockedCount} label="Open to study now" />
        </Card>
        <Card pad index={2}>
          <Stat value={stats.cards + stats.quiz} label="Reviewable items" />
        </Card>
        <Card pad index={3}>
          <Stat
            value={totalDue}
            label="Due today"
            delta={totalDue > 0 ? 'review now' : undefined}
            deltaTone={totalDue > 0 ? 'bad' : 'muted'}
          />
        </Card>
      </div>

      {/* ── next up ───────────────────────────────────────────────────────── */}
      {nextUp ? (
        <Card index={4} style={{ marginBottom: 'var(--gap)' }}>
          <CardHead
            icon={<IconRecall size={15} />}
            title="Recommended next"
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                {nextUp.reasons.slice(0, 2).map((r) => (
                  <Chip key={r} ghost>
                    {r}
                  </Chip>
                ))}
              </div>
            }
            divided
          />
          <div
            style={{
              padding: '15px 17px 17px',
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div className="grow" style={{ minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                {nextUp.module.title}
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.55 }}>
                {nextUp.module.summary}
              </p>
              <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bar
                  value={nextUp.mastery}
                  height={4}
                  fill={`linear-gradient(90deg, ${def.accent}55, ${def.accent})`}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    fontVariantNumeric: 'tabular-nums',
                    width: 34,
                    textAlign: 'right',
                  }}
                >
                  {Math.round(nextUp.mastery * 100)}%
                </span>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/module/${nextUp.module.id}`)}
            >
              {nextUp.mastery > 0.05 ? 'Continue' : 'Start'}
              <IconArrowRight size={15} />
            </Button>
          </div>
        </Card>
      ) : null}

      {/* ── the ladder ────────────────────────────────────────────────────── */}
      {modules.length === 0 ? (
        <Empty
          icon={<Icon size={30} />}
          title="No modules in this track yet"
          body="The curriculum for this pillar has not been authored."
        />
      ) : (
        tiers.map(({ tier, modules: mods }) => {
          const tierHours = mods.reduce((a, m) => a + m.hours, 0)
          return (
            <section key={tier}>
              <div className="tier">
                <span className="tier__n" style={{ color: def.accent }}>
                  Tier {tier}
                </span>
                <span className="tier__label">{TIER_LABELS[track][tier] ?? ''}</span>
                <span className="tier__rule" />
                <span className="tier__meta">
                  {mods.length} modules · {tierHours}h
                </span>
              </div>

              <div className="mgrid">
                {mods.map((m, i) => (
                  <ModuleCard
                    key={m.id}
                    module={m}
                    mastery={mastery.get(m.id) ?? 0}
                    blockers={dag.blockers(m.id, mastery).map((b) => dag.get(b)?.title ?? b)}
                    unlocks={dag.descendants(m.id).size}
                    accent={def.accent}
                    due={dueByModule.get(m.id) ?? 0}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )
        })
      )}

      <TrackFootnote track={track} atomCount={modules.reduce((a, m) => a + atomsOf(m).length, 0)} />
    </div>
  )
}

function TrackFootnote({ track, atomCount }: { track: TrackId; atomCount: number }) {
  if (track === 'career') {
    return (
      <p className="track-note">
        Hiring requirements change. Everything in this track was drawn from job postings and
        candidate accounts at the time it was written — verify the current posting before you rely
        on any specific line in it.
      </p>
    )
  }
  return (
    <p className="track-note">
      {atomCount} reviewable items in this track. Scheduling is handled for you — study what the
      planner surfaces and the spacing takes care of itself.
    </p>
  )
}
