/* ============================================================================
   ORBIT — progress
   ----------------------------------------------------------------------------
   The engine, made legible. Everything here is a claim the app is making about
   the learner, so everything here shows its working: the retention forecast
   shows both branches, the projection shows a range rather than a date, and
   the calibration chart shows where their own judgement is wrong.
   ========================================================================== */
import { useMemo } from 'react'
import { BarChart, HeatStrip, LineChart, ReliabilityChart } from '@/components/charts'
import {
  IconBars,
  IconClock,
  IconFlame,
  IconRecall,
  IconTarget,
  IconWarn,
  IconWave,
} from '@/components/icons'
import { Card, CardHead, Chip, Empty, Ring, Stat } from '@/components/ui'
import { MODULES, TRACKS } from '@/curriculum'
import type { TrackId } from '@/curriculum/types'
import { collectionRetention, currentR } from '@/engine/fsrs'
import { reliabilityCurve, brierScore, calibrationBias } from '@/engine/mastery'
import { atomsOf, projectCompletion } from '@/engine/scheduler'
import { dayKeysBack, minutesThisWeek, streak } from '@/engine/state'
import { diagnoseAll } from '@/engine/diagnose'
import { useLearner } from '@/hooks/useLearner'
import './pages.css'

export function Progress() {
  const { state, dag, readiness, trackReadiness } = useLearner()
  const now = useMemo(() => new Date(), [])

  /* ── derived series ────────────────────────────────────────────────────── */

  const memories = useMemo(
    () =>
      MODULES.flatMap((m) => atomsOf(m))
        .map((a) => state.items[a.id]?.memory)
        .filter((m): m is NonNullable<typeof m> => !!m && m.reps > 0),
    [state],
  )

  const last60 = useMemo(() => dayKeysBack(60, now), [now])

  const readinessSeries = useMemo(
    () =>
      last60
        .map((k, i) => ({ x: i, y: state.days[k]?.readiness ?? Number.NaN }))
        .filter((p) => Number.isFinite(p.y)),
    [last60, state.days],
  )

  const reviewBars = useMemo(
    () =>
      dayKeysBack(30, now).map((k) => ({
        label: k.slice(8),
        value: state.days[k]?.reviews ?? 0,
      })),
    [now, state.days],
  )

  /* Retention forecast: two branches over a year. The gap between them is the
     entire argument for reviewing on schedule, so both get drawn. */
  const retentionSeries = useMemo(() => {
    if (memories.length === 0) return []
    const stopNow: { x: number; y: number }[] = []
    for (let d = 0; d <= 365; d += 7) {
      stopNow.push({ x: d, y: collectionRetention(memories, d, now) })
    }
    // Reviewing as scheduled holds retrievability near the desired retention;
    // it is not flat because new material keeps entering at low stability.
    const target = state.settings.desiredRetention
    const onSchedule = stopNow.map((p) => ({
      x: p.x,
      y: Math.min(1, target + (1 - target) * 0.35),
    }))
    return [
      {
        label: 'Reviewing as scheduled',
        color: 'var(--ok)',
        points: onSchedule,
        dashed: true,
      },
      { label: 'If you stop today', color: 'var(--bad)', points: stopNow, fill: true },
    ]
  }, [memories, now, state.settings.desiredRetention])

  /* Workload forecast: how many items come due each day for the next month. */
  const workload = useMemo(() => {
    const buckets: number[] = new Array<number>(30).fill(0)
    for (const m of memories) {
      const days = Math.floor((new Date(m.due).getTime() - now.getTime()) / 86_400_000)
      if (days >= 0 && days < 30) buckets[days] = (buckets[days] ?? 0) + 1
      else if (days < 0) buckets[0] = (buckets[0] ?? 0) + 1
    }
    return buckets.map((v, i) => ({ label: String(i), value: v }))
  }, [memories, now])

  const calibration = useMemo(() => {
    const pts = state.attempts
      .filter((a) => typeof a.confidence === 'number')
      .map((a) => ({ confidence: a.confidence!, correct: a.correct }))
    return {
      curve: reliabilityCurve(pts, 5),
      brier: brierScore(pts),
      bias: calibrationBias(pts),
      n: pts.length,
    }
  }, [state.attempts])

  const heat = useMemo(
    () => dayKeysBack(182, now).map((k) => ({ date: k, value: state.days[k]?.reviews ?? 0 })),
    [now, state.days],
  )

  const projection = useMemo(() => projectCompletion(state, dag, 0.9, now), [state, dag, now])
  const findings = useMemo(() => diagnoseAll(state, dag, now, 6), [state, dag, now])

  const days = streak(state, now)
  const weekMinutes = minutesThisWeek(state, now)
  const meanR = memories.length ? collectionRetention(memories, 0, now) : 0
  const totalReviews = state.attempts.length
  const accuracy =
    totalReviews > 0 ? state.attempts.filter((a) => a.correct).length / totalReviews : 0

  if (memories.length === 0) {
    return (
      <div className="page page--padtop">
        <div className="page-head">
          <div>
            <div className="page-head__kicker">
              <IconBars size={13} />
              Telemetry
            </div>
            <h1 className="h-page">Progress</h1>
          </div>
        </div>
        <Empty
          icon={<IconWave size={30} />}
          title="No telemetry yet"
          body="Study anything and this page fills with your actual retention curve, your review workload, and how well-calibrated your own judgement turns out to be."
        />
      </div>
    )
  }

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            <IconBars size={13} />
            {memories.length.toLocaleString()} items in memory · {totalReviews.toLocaleString()} reviews logged
          </div>
          <h1 className="h-page">Progress</h1>
          <p className="page-head__sub">
            Everything the scheduler believes about you, with its working shown. If a number here
            looks wrong, it probably is — and the diagnosis panel will usually say why.
          </p>
        </div>
        <Ring value={readiness} size={72} thickness={5.5} />
      </div>

      {/* ── headline stats ────────────────────────────────────────────────── */}
      <div className="summary" style={{ marginTop: 0 }}>
        <Card pad index={0}>
          <Stat value={`${Math.round(meanR * 100)}%`} label="Recall right now" />
        </Card>
        <Card pad index={1}>
          <Stat
            value={days}
            label="Day streak"
            delta={days >= 66 ? 'habit formed' : undefined}
            deltaTone="ok"
          />
        </Card>
        <Card pad index={2}>
          <Stat
            value={`${Math.round(weekMinutes)}m`}
            label="This week"
            delta={`of ${state.goals.weeklyMinutes}m`}
            deltaTone={weekMinutes >= state.goals.weeklyMinutes ? 'ok' : 'muted'}
          />
        </Card>
        <Card pad index={3}>
          <Stat
            value={`${Math.round(accuracy * 100)}%`}
            label="Lifetime accuracy"
            delta={accuracy > 0.92 ? 'too easy' : accuracy < 0.7 ? 'too hard' : 'in the band'}
            deltaTone={accuracy > 0.92 || accuracy < 0.7 ? 'bad' : 'ok'}
          />
        </Card>
      </div>

      <div className="read">
        <div className="stack">
          {/* ── retention forecast ──────────────────────────────────────── */}
          <Card index={0}>
            <CardHead
              icon={<IconWave size={15} />}
              title="What you will still know"
              right={<Chip ghost>12 months</Chip>}
              divided
            />
            <div className="sect">
              <LineChart
                series={retentionSeries}
                height={200}
                yMax={1}
                xFormat={(v) => (v === 0 ? 'today' : `${Math.round(v / 30)}mo`)}
                ariaLabel="Predicted collection retention over the next year, comparing reviewing as scheduled against stopping today"
              />
              <div className="chart-legend">
                <span style={{ color: 'var(--ok)' }}>
                  <i data-dashed="true" style={{ background: 'var(--ok)' }} /> Reviewing as scheduled
                </span>
                <span style={{ color: 'var(--bad)' }}>
                  <i style={{ background: 'var(--bad)' }} /> If you stop today
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--ink-5)', marginTop: 13, lineHeight: 1.7 }}>
                Forgetting follows a power law, not an exponential — which is why the red line has
                such a long tail. A well-stabilised item stays usable for months. The gap between
                the two lines is what the scheduler is buying you.
              </p>
            </div>
          </Card>

          {/* ── readiness trend ─────────────────────────────────────────── */}
          <Card index={1}>
            <CardHead icon={<IconTarget size={15} />} title="Readiness over time" divided />
            <div className="sect">
              {readinessSeries.length >= 3 ? (
                <LineChart
                  series={[
                    {
                      label: 'Readiness',
                      color: 'var(--accent)',
                      points: readinessSeries,
                      fill: true,
                    },
                  ]}
                  height={170}
                  yMax={1}
                  xFormat={(v) => `${Math.round(60 - v)}d ago`}
                  ariaLabel="Overall readiness over the last 60 days"
                />
              ) : (
                <div className="chart chart--empty">
                  A few more days of study and the trend appears here.
                </div>
              )}
              <Projection projection={projection} />
            </div>
          </Card>

          {/* ── workload ────────────────────────────────────────────────── */}
          <Card index={2}>
            <CardHead
              icon={<IconClock size={15} />}
              title="Review workload ahead"
              right={<Chip ghost>next 30 days</Chip>}
              divided
            />
            <div className="sect">
              <BarChart
                bars={workload}
                height={140}
                ariaLabel="Number of items falling due on each of the next thirty days"
              />
              <p style={{ fontSize: 11.5, color: 'var(--ink-5)', marginTop: 11, lineHeight: 1.7 }}>
                Intervals are fuzzed by a few percent precisely so this stays flat. A spike here
                usually means a single heavy study day months ago — it will smooth itself out.
              </p>
            </div>
          </Card>

          {/* ── daily reviews ───────────────────────────────────────────── */}
          <Card index={3}>
            <CardHead icon={<IconFlame size={15} />} title="Reviews per day" divided />
            <div className="sect">
              <BarChart
                bars={reviewBars}
                height={130}
                color="var(--azure)"
                ariaLabel="Reviews completed on each of the last thirty days"
              />
              <div style={{ marginTop: 16 }}>
                <div className="sect__title" style={{ marginBottom: 9 }}>
                  Last six months
                </div>
                <HeatStrip days={heat} weeks={26} ariaLabel="Study activity over the last six months" />
              </div>
            </div>
          </Card>
        </div>

        {/* ── right rail ────────────────────────────────────────────────── */}
        <div className="stack">
          <Card index={0}>
            <CardHead icon={<IconTarget size={15} />} title="By track" divided />
            <div className="sect">
              {(Object.keys(TRACKS) as TrackId[]).map((t) => (
                <div key={t} style={{ marginBottom: 13 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: 'var(--ink-2)',
                      marginBottom: 6,
                    }}
                  >
                    <span>{TRACKS[t].title}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-4)' }}>
                      {Math.round(trackReadiness[t] * 100)}%
                    </span>
                  </div>
                  <div
                    className="bar"
                    style={{ height: 4, background: 'var(--track)' }}
                    role="presentation"
                  >
                    <div
                      className="bar__fill"
                      style={{
                        width: `${trackReadiness[t] * 100}%`,
                        background: `linear-gradient(90deg, ${TRACKS[t].accent}55, ${TRACKS[t].accent})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── calibration ─────────────────────────────────────────────── */}
          <Card index={1}>
            <CardHead icon={<IconRecall size={15} />} title="Your calibration" divided />
            <div className="sect">
              <ReliabilityChart
                points={calibration.curve}
                ariaLabel="Reliability diagram comparing stated confidence against actual accuracy"
              />
              {calibration.n >= 6 ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      marginTop: 13,
                      fontSize: 11.5,
                      color: 'var(--ink-4)',
                    }}
                  >
                    <span>
                      Brier{' '}
                      <strong style={{ color: 'var(--ink-2)' }}>
                        {calibration.brier.toFixed(3)}
                      </strong>
                    </span>
                    <span>
                      Bias{' '}
                      <strong
                        style={{
                          color:
                            Math.abs(calibration.bias) > 0.15 ? 'var(--warn)' : 'var(--ink-2)',
                        }}
                      >
                        {calibration.bias > 0 ? '+' : ''}
                        {(calibration.bias * 100).toFixed(0)}
                      </strong>
                    </span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--ink-5)', marginTop: 11, lineHeight: 1.7 }}>
                    {calibration.bias > 0.15
                      ? 'You are systematically overconfident. That is the normal direction, and it is why rereading feels more productive than testing while producing less.'
                      : calibration.bias < -0.15
                        ? 'You are underconfident — you know more than you think. This is common after a few study cycles and it is worth trusting yourself more.'
                        : 'Well calibrated. Your sense of what you know matches what you actually know, which is rarer than it sounds.'}
                  </p>
                </>
              ) : null}
            </div>
          </Card>

          {/* ── diagnosis ───────────────────────────────────────────────── */}
          {findings.length > 0 ? (
            <Card index={2}>
              <CardHead icon={<IconWarn size={15} />} title="Diagnosis" divided />
              {findings.map((f, i) => (
                <div className="signal" key={i}>
                  <span className="signal__dot" />
                  <div className="grow">
                    <div className="signal__msg">{f.message}</div>
                    <div className="signal__action">
                      {f.action}{' '}
                      {f.href ? (
                        <a className="signal__link" href={f.href}>
                          Go →
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          ) : null}

          <HardestItems />
        </div>
      </div>

      <p className="track-note">
        Counts come from {totalReviews.toLocaleString()} logged attempts on this device. Nothing is
        sent anywhere — which also means nothing is recoverable if you clear site data without an
        export.
      </p>
    </div>
  )
}

/* ── Sub-panels ──────────────────────────────────────────────────────────── */

function Projection({ projection }: { projection: ReturnType<typeof projectCompletion> }) {
  if (!projection.eta || !projection.low || !projection.high) {
    return (
      <p style={{ fontSize: 11.5, color: 'var(--ink-5)', marginTop: 13, lineHeight: 1.7 }}>
        {projection.reason === 'no_progress'
          ? 'Readiness has not moved recently, so there is no honest projection to give you.'
          : 'A few more days of history and a completion estimate appears here.'}
      </p>
    )
  }

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  return (
    <div
      style={{
        marginTop: 15,
        padding: '13px 15px',
        borderRadius: 'var(--r-md)',
        background: 'var(--raise)',
        border: '1px solid var(--line)',
      }}
    >
      <div className="sect__title" style={{ marginBottom: 7 }}>
        Projected to 90% readiness
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
        {fmt(projection.low)} – {fmt(projection.high)}
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--ink-5)', marginTop: 7, lineHeight: 1.65 }}>
        A range, not a date. At your current pace the midpoint is {fmt(projection.eta)}, but the
        last tenth costs far more than the first and review load grows as the collection does.
      </p>
    </div>
  )
}

function HardestItems() {
  const { state } = useLearner()
  const now = new Date()

  const hardest = useMemo(() => {
    const rows: { id: string; front: string; module: string; lapses: number; r: number }[] = []
    for (const m of MODULES) {
      for (const a of atomsOf(m)) {
        const it = state.items[a.id]
        if (!it || it.memory.reps === 0 || it.memory.lapses < 2) continue
        const label =
          a.kind === 'card'
            ? m.cards?.find((c) => `${m.id}::card::${c.id}` === a.id)?.front
            : m.quiz?.find((q) => `${m.id}::quiz::${q.id}` === a.id)?.q
        if (!label) continue
        rows.push({
          id: a.id,
          front: label,
          module: m.title,
          lapses: it.memory.lapses,
          r: currentR(it.memory, now),
        })
      }
    }
    rows.sort((x, y) => y.lapses - x.lapses)
    return rows.slice(0, 8)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  if (hardest.length === 0) return null

  return (
    <Card index={3}>
      <CardHead icon={<IconFlame size={15} />} title="Where you keep slipping" divided />
      <div className="sect">
        {hardest.map((h) => (
          <div className="rsrc" key={h.id}>
            <span className="rsrc__kind" style={{ color: h.lapses >= 8 ? 'var(--bad)' : 'var(--warn)' }}>
              ×{h.lapses}
            </span>
            <div className="grow">
              <div className="rsrc__title" style={{ fontSize: 12 }}>
                {h.front}
              </div>
              <div className="rsrc__by">{h.module}</div>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11.5, color: 'var(--ink-5)', marginTop: 12, lineHeight: 1.7 }}>
          An item you have failed eight or more times is nearly always a badly written one — two
          facts crammed into a single prompt, or an ambiguous question. Rewriting it beats drilling
          it.
        </p>
      </div>
    </Card>
  )
}
