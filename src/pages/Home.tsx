/* ============================================================================
   ORBIT — dashboard
   ----------------------------------------------------------------------------
   The reference layout, wired to the engine. Nothing on this page is a mock:
   every percentage is a weighted roll-up of real mastery and the focus list is
   the scheduler's own plan for the day.
   ========================================================================== */
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { EarthLimb } from '@/components/art/EarthLimb'
import { CodeThumb, ConicThumb, DescentThumb, HighBayThumb, PlanetPlate } from '@/components/art/Thumbs'
import {
  IconArrowRight,
  IconBars,
  IconBook,
  IconBriefcase,
  IconBulb,
  IconClock,
  IconCalendar,
  IconCode,
  IconCompass,
  IconDatabase,
  IconDoc,
  IconRecall,
  IconShield,
  IconSigma,
  IconTarget,
  IconTerminal,
  IconWave,
  Logomark,
  type IconProps,
} from '@/components/icons'
import { Bar, Bullets, Button, Card, CardHead, Check, Ring, RowItem, Tile } from '@/components/ui'
import { TRACKS, TRACK_ORDER } from '@/curriculum'
import type { TrackId } from '@/curriculum/types'
import { setOnboarded, startFocus, toggleTask } from '@/engine/apply'
import { DEFAULT_BLOCK } from '@/engine/focus'
import type { ResumePoint } from '@/engine/resume'
import { dailyPlan } from '@/engine/scheduler'
import { streak } from '@/engine/state'
import { useLearner } from '@/hooks/useLearner'
import { nextUp } from '@/lib/nextUp'
import { navigate } from '@/lib/router'
import './home.css'

/* Per-track glyph and plate. Keyed here so the card body stays declarative. */
const TRACK_ICON: Record<TrackId, (p: IconProps) => ReactNode> = {
  foundations: IconSigma,
  coding: IconCode,
  gnc: IconTarget,
  career: IconBriefcase,
}

const TRACK_THUMB: Record<TrackId, (p: { className?: string }) => ReactNode> = {
  foundations: ConicThumb,
  coding: CodeThumb,
  gnc: DescentThumb,
  career: HighBayThumb,
}

const TRACK_PATH: Record<TrackId, string> = {
  foundations: '/foundations',
  coding: '/coding',
  gnc: '/gnc',
  career: '/career',
}

export function Home() {
  const { state, dag, mastery, trackReadiness, readiness, setState, setResume } = useLearner()
  const now = useMemo(() => new Date(), [])

  const plan = useMemo(() => dailyPlan(state, dag, now), [state, dag, now])
  const days = streak(state, now)

  return (
    <>
      <Hero name={state.settings.displayName} readiness={readiness} streakDays={days} />

      <div className="page">
        {!state.settings.onboarded ? (
          <Welcome onDismiss={() => setState((s) => setOnboarded(s))} />
        ) : null}

        <ResumeCard point={state.resume} onDismiss={() => setResume(null)} />

        <StartBlock />

        <div className="grid-2">
          {/* ── left column ─────────────────────────────────────────────── */}
          <div className="stack">
            <MissionProgress readiness={readiness} tracks={trackReadiness} />

            {TRACK_ORDER.map((id, i) => (
              <DomainCard key={id} id={id} progress={trackReadiness[id]} index={i + 1} />
            ))}
          </div>

          {/* ── right rail ──────────────────────────────────────────────── */}
          <div className="stack">
            <QuotePlate />

            <TodaysFocus
              plan={plan}
              date={now}
              onToggle={(taskId) => setState((s) => toggleTask(s, taskId, now))}
            />

            <QuickTools />

            <Resources />

            <ClosingPlate />
          </div>
        </div>

        <FootNote modules={dag.all().length} mastered={countMastered(mastery)} />
      </div>
    </>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────────── */

function Hero({
  name,
  readiness,
  streakDays,
}: {
  name: string
  readiness: number
  streakDays: number
}) {
  return (
    <section className="hero">
      <EarthLimb className="hero__art" progress={readiness} />
      <div className="hero__inner">
        <div className="hero__greet">{greeting()},</div>
        <h1 className="hero__name">{name}</h1>
        <p className="hero__tag">
          {streakDays > 1
            ? `${streakDays} days consistent. Discipline today, opportunities tomorrow.`
            : 'Discipline today. Opportunities tomorrow.'}
        </p>
        <div className="hero__bar">
          <Bar value={readiness} height={4} glow />
        </div>
      </div>
    </section>
  )
}

function greeting(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ── First-run welcome ───────────────────────────────────────────────────── */

/*
 * The eligibility step is first on purpose, and it is a link rather than a
 * sentence because the answer is one click away and worth having before
 * anything else here is worth starting. Nothing in the wording assumes which
 * side of that gate anyone falls on: the module is as useful to someone who
 * clears it on day one as to someone who needs a different plan, and the
 * technical preparation is the same either way.
 */
export const WELCOME_STEPS: { text: string; to?: string; linkText?: string }[] = [
  {
    text: 'Start with the eligibility question — it decides which employers are reachable',
    to: '/module/car_01_itar_gate',
    linkText: 'eligibility question',
  },
  { text: 'Pick a track and open its first module' },
  { text: 'Learn, then practice, then recall' },
  { text: 'Come back when reviews are due — the planner tells you' },
]

/** Renders a step, linking the phrase named by `linkText` if there is one. */
function StepText({ step }: { step: (typeof WELCOME_STEPS)[number] }) {
  if (!step.to || !step.linkText || !step.text.includes(step.linkText)) return <>{step.text}</>
  const [before, after] = step.text.split(step.linkText) as [string, string]
  return (
    <>
      {before}
      <a
        href={`#${step.to}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 2 }}
      >
        {step.linkText}
      </a>
      {after}
    </>
  )
}

/**
 * Shown until the guide has been opened or the card dismissed. Kept to one
 * short band above the grid: it has to be impossible to miss on a first visit
 * and impossible to resent on the second.
 */
function Welcome({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card index={0} style={{ marginBottom: 'var(--gap)' }}>
      <div style={{ padding: '15px 17px 14px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Tile size={40} radius={11} color="var(--accent)" lit>
          <IconCompass size={19} />
        </Tile>

        <div className="grow">
          <div className="eyebrow-dim" style={{ color: 'var(--accent)' }}>
            Welcome to ORBIT
          </div>
          <h2
            style={{
              marginTop: 4,
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              color: 'var(--ink)',
            }}
          >
            New here? Here is how this works.
          </h2>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px 18px',
              marginTop: 11,
            }}
          >
            <ol
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 18px',
                flex: '1 1 400px',
                minWidth: 0,
              }}
            >
              {WELCOME_STEPS.map((step, i) => (
                <li
                  key={step.text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--ink-2)',
                  }}
                >
                  <span
                    style={{
                      flex: 'none',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(86, 150, 248, 0.14)',
                      color: 'var(--accent)',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </span>
                  <StepText step={step} />
                </li>
              ))}
            </ol>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Button variant="primary" size="md" onClick={() => navigate('/guide')}>
                Read the guide
                <IconArrowRight size={15} />
              </Button>
              <Button variant="ghost" size="md" onClick={onDismiss}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ── Mission progress ────────────────────────────────────────────────────── */

function MissionProgress({
  readiness,
  tracks,
}: {
  readiness: number
  tracks: Record<TrackId, number>
}) {
  return (
    <Card className="mission" index={0}>
      <div className="spread">
        <span className="eyebrow">Your Mission Progress</span>
        <span className="eyebrow-dim">Overall Readiness</span>
      </div>

      <div className="mission__body">
        <div className="mission__rows">
          {TRACK_ORDER.map((id) => {
            const Icon = TRACK_ICON[id]
            return (
              <button
                key={id}
                className="mrow"
                onClick={() => navigate(TRACK_PATH[id])}
                type="button"
                aria-label={`${TRACKS[id].title} — ${Math.round(tracks[id] * 100)} percent`}
              >
                <Tile size={44} color={TRACKS[id].accent}>
                  <Icon size={19} />
                </Tile>
                <div className="grow">
                  <div className="mrow__label">{TRACKS[id].title}</div>
                  <Bar value={tracks[id]} height={5} />
                </div>
                <span className="mrow__pct">{Math.round(tracks[id] * 100)}%</span>
              </button>
            )
          })}
        </div>

        <div className="mission__ring">
          <Ring value={readiness} size={56} thickness={6} fontSize={17} />
        </div>
      </div>
    </Card>
  )
}

/* ── Domain card ─────────────────────────────────────────────────────────── */

function DomainCard({ id, progress, index }: { id: TrackId; progress: number; index: number }) {
  const t = TRACKS[id]
  const Icon = TRACK_ICON[id]
  const Thumb = TRACK_THUMB[id]
  const pct = Math.round(progress * 100)

  return (
    <Card className="dcard" interactive accent={t.accent} index={index}>
      <div className="dcard__body">
        <Tile size={52} radius={14} lit={progress > 0}>
          <Icon size={24} />
        </Tile>

        <div className="dcard__text">
          <h2 className="dcard__title">{t.title}</h2>
          <p className="dcard__blurb">{t.blurb}</p>
          <Bullets
            items={t.highlights.map((label, i) => ({
              label,
              // Highlights light up as the track advances — five bullets over
              // the track's span, so the card itself shows where you are.
              done: progress >= (i + 1) / t.highlights.length,
              active:
                progress >= i / t.highlights.length &&
                progress < (i + 1) / t.highlights.length,
            }))}
          />
        </div>

        <div className="dcard__thumb">
          <Thumb />
        </div>
      </div>

      <div className="dcard__foot">
        <Button variant="outline" size="md" onClick={() => navigate(TRACK_PATH[id])}>
          Continue
          <IconArrowRight size={15} />
        </Button>

        <div className="dcard__prog">
          <div className="dcard__pct">{pct}% Complete</div>
          <Bar value={progress} height={5} />
        </div>
      </div>
    </Card>
  )
}

/* ── Quote plates ────────────────────────────────────────────────────────── */

function QuotePlate() {
  return (
    <Card className="quote" index={0}>
      <PlanetPlate className="quote__art" seed="quote-top" />
      <div className="quote__scrim" />
      <div className="quote__inner">
        <p className="quote__text">
          “The best part is no part. The best process is no process.”
        </p>
        <div className="quote__by">— Design principle, first stage</div>
      </div>
    </Card>
  )
}

function ClosingPlate() {
  return (
    <Card className="quote quote--closing" index={5}>
      <PlanetPlate className="quote__art" tone="violet" flip seed="quote-bottom" />
      <div className="quote__scrim" />
      <div className="quote__inner">
        <p className="quote__text">
          You’re not just preparing for a job.
          <span className="quote__emph">You’re preparing for the work itself.</span>
        </p>
      </div>
      <Logomark size={46} className="quote__mark" />
    </Card>
  )
}

/* ── Today's focus ───────────────────────────────────────────────────────── */

function TodaysFocus({
  plan,
  date,
  onToggle,
}: {
  plan: ReturnType<typeof dailyPlan>
  date: Date
  onToggle: (taskId: string) => void
}) {
  return (
    <Card index={1}>
      <CardHead
        icon={<IconCalendar size={15} />}
        title="Today's Focus"
        right={
          <span className="eyebrow-dim" style={{ letterSpacing: '0.05em' }}>
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        }
        divided
      />

      {plan.length === 0 ? (
        <div style={{ padding: '22px 17px', fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.6 }}>
          Nothing scheduled yet. Open a track and study your first module — the planner builds
          tomorrow’s list out of what you do today.
        </div>
      ) : (
        plan.slice(0, 4).map((task) => (
          <div className="focus__row" key={task.id} data-done={task.done}>
            <Check
              checked={task.done}
              onChange={() => onToggle(task.id)}
              size={15}
              label={task.title}
            />
            <a className="grow" href={task.href} style={{ minWidth: 0 }}>
              <div className="focus__title">{task.title}</div>
              <div className="focus__meta">
                {task.context} · {formatMinutes(task.minutes)}
              </div>
            </a>
          </div>
        ))
      )}

      <div className="focus__foot">
        <Button variant="block" size="md" onClick={() => navigate('/progress')}>
          View Full Schedule
          <IconArrowRight size={15} />
        </Button>
      </div>
    </Card>
  )
}

function formatMinutes(m: number): string {
  if (m < 60) return `${Math.round(m)}m`
  const h = Math.floor(m / 60)
  const r = Math.round(m % 60)
  return r === 0 ? `${h}h` : `${h}h ${r}m`
}


/* ── Quick tools ─────────────────────────────────────────────────────────── */

const TOOLS: { icon: (p: IconProps) => ReactNode; title: string; sub: string; href: string }[] = [
  { icon: IconCompass, title: 'How ORBIT Works', sub: 'Where to start and how the loop runs', href: '#/guide' },
  { icon: IconTerminal, title: 'Code Playground', sub: 'Run Python, SQL and C++ in the browser', href: '#/playground' },
  { icon: IconBulb, title: 'Learn to Code', sub: 'Roadmaps: the command line, Git, Python, SQL and C++', href: '#/learn' },
  { icon: IconRecall, title: 'Review Session', sub: 'Clear what is scheduled today', href: '#/review' },
  { icon: IconWave, title: 'Forgetting Curve', sub: 'What you will still know in a year', href: '#/progress' },
  { icon: IconSigma, title: 'Formula Bank', sub: 'Every equation, one place', href: '#/resources' },
  { icon: IconDatabase, title: 'Backup & Restore', sub: 'Your progress lives on this device', href: '#/settings' },
]

function QuickTools() {
  return (
    <Card className="tools" index={3}>
      <CardHead icon={<IconTarget size={15} />} title="Quick Tools" divided />
      {TOOLS.map((t) => {
        const Icon = t.icon
        return (
          <RowItem
            key={t.title}
            icon={
              <Tile size={36} radius={9}>
                <Icon size={17} />
              </Tile>
            }
            title={t.title}
            sub={t.sub}
            chevron
            onClick={() => navigate(t.href.replace('#', ''))}
          />
        )
      })}
    </Card>
  )
}

/* ── Resources ───────────────────────────────────────────────────────────── */

const RESOURCES: { icon: (p: IconProps) => ReactNode; label: string; href: string }[] = [
  { icon: IconDoc, label: 'The GNC Knowledge Tree', href: '#/learning' },
  { icon: IconTarget, label: 'SpaceX Interview Guide', href: '#/career' },
  { icon: IconShield, label: 'ITAR & Eligibility — read first', href: '#/career' },
  { icon: IconBook, label: 'Recommended Reading', href: '#/resources' },
  { icon: IconBars, label: 'How This App Schedules You', href: '#/progress' },
]

function Resources() {
  return (
    <Card index={4}>
      <CardHead icon={<IconBook size={15} />} title="Resources" divided />
      <div className="res__list">
        {RESOURCES.map((r) => {
          const Icon = r.icon
          return (
            <button
              key={r.label}
              className="res__row"
              onClick={() => navigate(r.href.replace('#', ''))}
              type="button"
            >
              <Icon size={13} />
              <span className="grow truncate">{r.label}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/* ── Foot note ───────────────────────────────────────────────────────────── */

function FootNote({ modules, mastered }: { modules: number; mastered: number }) {
  return (
    <p
      style={{
        marginTop: 22,
        fontSize: 11,
        color: 'var(--ink-5)',
        textAlign: 'center',
        lineHeight: 1.7,
      }}
    >
      {mastered} of {modules} modules mastered · everything runs and is stored on this device ·{' '}
      <a href="#/settings" style={{ color: 'var(--ink-4)', textDecoration: 'underline' }}>
        export a backup
      </a>
    </p>
  )
}

function countMastered(mastery: Map<string, number>): number {
  let n = 0
  for (const v of mastery.values()) if (v >= 0.9) n += 1
  return n
}

/* ── Pick up where you left off ──────────────────────────────────────────── */

/**
 * The single most important control on this page for someone who struggles to
 * start. Opening the app and facing a dashboard is a decision; opening it and
 * finding one button that says "keep reading Kepler's laws, you were 60%
 * through" is not. It appears only when there is somewhere real to go back to,
 * and it can be dismissed when she would rather choose for herself.
 */
function ResumeCard({ point, onDismiss }: { point?: ResumePoint; onDismiss: () => void }) {
  if (!point) return null

  const pct = point.progress !== undefined ? Math.round(point.progress * 100) : null
  const verb = point.kind === 'lesson' ? 'Keep reading' : point.kind === 'video' ? 'Keep watching' : 'Pick up'

  return (
    <section className="card resume-card">
      <div className="resume-card__body">
        <p className="eyebrow-dim">{whenWord(point.at)}</p>
        <h2 className="resume-card__title">{point.label}</h2>
        {point.detail ? <p className="resume-card__detail">{point.detail}</p> : null}
        {pct !== null && pct > 2 ? (
          <div className="resume-card__bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        ) : null}
      </div>
      <div className="resume-card__actions">
        <button className="btn btn--primary" onClick={() => navigate(point.path)} type="button">
          {verb}
          {pct !== null && pct > 2 ? ` · ${pct}%` : ''}
        </button>
        <button className="btn btn--quiet btn--sm" onClick={onDismiss} type="button">
          Not now
        </button>
      </div>
    </section>
  )
}

/** "Yesterday", "3 days ago" — vaguer the further back, and never a scolding. */
function whenWord(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 'Where you left off'
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'Where you left off'
  if (days === 1) return 'Where you left off yesterday'
  if (days < 7) return `Where you left off ${days} days ago`
  return 'Where you left off'
}

/* ── Start a block ───────────────────────────────────────────────────────────
   The single most important control on the page, and the only one that is not
   a choice. Everything else on Home is information; this is the thing to press
   when she does not want to read any of it. It sits directly under the hero so
   that on a bad day the first thing she sees is one button with one sentence
   under it, and she never has to scroll into the menu at all. */

function StartBlock() {
  const { state, dag, setState } = useLearner()
  const pick = useMemo(() => nextUp(state, dag), [state, dag])

  if (state.focus) {
    return (
      <Card className="startblock" index={0}>
        <div className="startblock__body">
          <div className="startblock__text">
            <div className="startblock__kicker">Block running</div>
            <div className="startblock__title">{state.focus.pick.title}</div>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate(state.focus!.pick.href)}>
            Back to it
            <IconArrowRight size={15} />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="startblock" index={0}>
      <div className="startblock__body">
        <div className="startblock__text">
          <div className="startblock__kicker">Start here</div>
          <div className="startblock__title">{pick.title}</div>
          <p className="startblock__why">{pick.why}</p>
        </div>
        <div className="startblock__acts">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setState((s) => startFocus(s, pick, DEFAULT_BLOCK))
              navigate(pick.href)
            }}
          >
            <IconClock size={14} /> Start {DEFAULT_BLOCK} minutes
          </Button>
          <button className="startblock__alt" onClick={() => navigate('/focus')}>
            Longer, or something else
          </button>
        </div>
      </div>
    </Card>
  )
}
