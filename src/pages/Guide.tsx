/* ============================================================================
   ORBIT — field manual
   ----------------------------------------------------------------------------
   The one page that explains the product to someone who has just opened it:
   what ORBIT is, where to start, how a module is meant to be worked, how a
   recall session is graded, and what the numbers mean.

   Every figure on this page is read from the corpus and the engine at render
   time — module counts, thresholds, the learner's own goals and next module —
   so the copy cannot drift from the code it describes. Opening the page also
   retires the first-run welcome card on the dashboard.
   ========================================================================== */
import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import {
  IconArrowRight,
  IconBars,
  IconBook,
  IconBriefcase,
  IconBulb,
  IconCalendar,
  IconCode,
  IconCompass,
  IconDoc,
  IconDownload,
  IconGear,
  IconGrid,
  IconInfo,
  IconLock,
  IconRecall,
  IconRoute,
  IconSigma,
  IconTarget,
  IconTerminal,
  type IconProps,
} from '@/components/icons'
import { phaseFor, type Phase } from '@/components/layout/Shell'
import { Button, Card, Chip, Stat, Tile, prefersReducedMotion } from '@/components/ui'
import { MODULES, TRACKS, TRACK_ORDER, corpusStats, modulesInTrack, tiersInTrack } from '@/curriculum'
import type { ExerciseKind, Module, TrackId } from '@/curriculum/types'
import { setOnboarded } from '@/engine/apply'
import { MASTERY_THRESHOLD, PREREQ_THRESHOLD, type Dag } from '@/engine/graph'
import { rankFrontier } from '@/engine/scheduler'
import { minutesThisWeek, streak } from '@/engine/state'
import { useLearner } from '@/hooks/useLearner'
import { isDesktop } from '@/lib/desktop'
import { navigate } from '@/lib/router'
import './pages.css'
import './guide.css'

/* ── Sections ────────────────────────────────────────────────────────────── */

interface SectionDef {
  id: string
  /** Short form for the index at the top. */
  label: string
  title: string
  Icon: (p: IconProps) => ReactNode
}

const WHAT: SectionDef = { id: 'what', label: 'What it is', title: 'What ORBIT is (and is not)', Icon: IconBulb }
const START: SectionDef = { id: 'start', label: 'Where to start', title: 'Where to start', Icon: IconRoute }
const MODULE: SectionDef = {
  id: 'module',
  label: 'Inside a module',
  title: 'Inside a module: Learn → Practice → Recall',
  Icon: IconBook,
}
const RECALL: SectionDef = { id: 'recall', label: 'Recall sessions', title: 'Recall sessions', Icon: IconRecall }
const MASTERY: SectionDef = {
  id: 'mastery',
  label: 'Mastery & unlocking',
  title: 'Mastery, tiers and unlocking',
  Icon: IconTarget,
}
const DAY: SectionDef = { id: 'day', label: 'Your day', title: 'Your day', Icon: IconCalendar }
const PRACTICE: SectionDef = {
  id: 'practice',
  label: 'Practice',
  title: 'Practice and the playground',
  Icon: IconTerminal,
}
const PAGES: SectionDef = { id: 'pages', label: 'Other pages', title: 'The other pages', Icon: IconGrid }
const FAQ: SectionDef = { id: 'faq', label: 'Questions', title: 'Questions people ask', Icon: IconInfo }

const SECTIONS: SectionDef[] = [WHAT, START, MODULE, RECALL, MASTERY, DAY, PRACTICE, PAGES, FAQ]

const anchorId = (id: string) => `guide-${id}`
const titleId = (id: string) => `guide-${id}-title`

const TRACK_ICON: Record<TrackId, (p: IconProps) => ReactNode> = {
  foundations: IconSigma,
  coding: IconCode,
  gnc: IconTarget,
  career: IconBriefcase,
}

const TRACK_PATH: Record<TrackId, string> = {
  foundations: '/foundations',
  coding: '/coding',
  gnc: '/gnc',
  career: '/career',
}

const pct = (v: number) => `${Math.round(v * 100)}%`

/* ── Derived facts ───────────────────────────────────────────────────────── */

interface Entry {
  module: Module
  /** Titles of the prerequisites standing in the way; empty for a true entry point. */
  gatedBy: string[]
}

/**
 * Where a track can be entered. A true entry point has no prerequisites at
 * all. A track without one (GNC rests entirely on Foundations) shows its
 * lowest tier instead, with what each module opens after, so the row is
 * honest rather than empty.
 */
function entryPoints(track: TrackId, dag: Dag): Entry[] {
  const inTrack = modulesInTrack(track)
  const open = inTrack.filter((m) => m.prereqs.length === 0)
  if (open.length > 0) {
    const tier = Math.min(...open.map((m) => m.tier))
    return open.filter((m) => m.tier === tier).map((module) => ({ module, gatedBy: [] }))
  }
  const first = tiersInTrack(track)[0]
  if (!first) return []
  return first.modules.slice(0, 3).map((module) => ({
    module,
    gatedBy: dag.prereqs(module.id).map((p) => dag.get(p)?.title ?? p),
  }))
}

/**
 * The readiness at which the top bar first shows `phase`, found by scanning
 * `phaseFor` in 1% steps. Reading the thresholds back out of the function that
 * owns them keeps this page from ever disagreeing with the bar.
 */
function phaseFloor(phase: Phase): number {
  for (let i = 0; i <= 100; i++) if (phaseFor(i / 100) === phase) return i / 100
  return 1
}

const EXERCISE_KINDS: { kind: ExerciseKind; label: string; how: string }[] = [
  {
    kind: 'code',
    label: 'Code',
    how: 'Opens in the playground with its starter and, for Python and SQL, its tests. Other languages are written here and run on your own machine with a real toolchain.',
  },
  {
    kind: 'analysis',
    label: 'Analysis',
    how: 'Paper or a notebook. Reason it through and write the answer down before you open the solution to compare.',
  },
  {
    kind: 'build',
    label: 'Build',
    how: 'A project, measured in hours. The prompt says what done looks like; the result usually lives in your own repository.',
  },
  {
    kind: 'derivation',
    label: 'Derivation',
    how: 'By hand. Derive it, then check against the solution — after, not before.',
  },
  {
    kind: 'reading',
    label: 'Reading',
    how: 'Go to the linked resource and read it with the prompt’s question in mind.',
  },
]

/* ── The page ────────────────────────────────────────────────────────────── */

export function Guide() {
  const { state, dag, mastery, readiness, setState } = useLearner()
  const now = useMemo(() => new Date(), [])

  // Opening the guide is the strongest possible signal that the welcome card
  // has done its job. Guarded so an already-onboarded learner costs no write.
  const onboarded = state.settings.onboarded
  useEffect(() => {
    if (!onboarded) setState((s) => setOnboarded(s))
  }, [onboarded, setState])

  const stats = useMemo(() => corpusStats(), [])
  const freeSources = useMemo(
    () => MODULES.flatMap((m) => m.resources).filter((r) => r.free).length,
    [],
  )
  const formulas = useMemo(
    () => MODULES.flatMap((m) => m.cards ?? []).filter((c) => c.formula).length,
    [],
  )
  const exerciseCounts = useMemo(() => {
    const out = new Map<ExerciseKind, number>()
    let tested = 0
    for (const m of MODULES) {
      for (const e of m.exercises ?? []) {
        out.set(e.kind, (out.get(e.kind) ?? 0) + 1)
        if (e.tests?.length) tested += 1
      }
    }
    return { byKind: out, tested }
  }, [])

  const entries = useMemo(
    () => TRACK_ORDER.map((t) => ({ track: t, entries: entryPoints(t, dag) })),
    [dag],
  )
  const recommended = entries[0]?.entries[0]?.module
  const careerFirst = entries.find((e) => e.track === 'career')?.entries[0]?.module

  const ranked = useMemo(() => rankFrontier(state, dag, mastery, now), [state, dag, mastery, now])
  const next = ranked[0]

  const phase = phaseFor(readiness)
  const phases = useMemo(
    () => [
      { id: 'prepare' as Phase, label: 'Prepare', from: phaseFloor('prepare'), to: phaseFloor('build') },
      { id: 'build' as Phase, label: 'Build', from: phaseFloor('build'), to: phaseFloor('launch') },
      { id: 'launch' as Phase, label: 'Launch', from: phaseFloor('launch'), to: 1 },
    ],
    [],
  )

  const days = streak(state, now)
  const weekMinutes = Math.round(minutesThisWeek(state, now))
  const prereqPct = pct(PREREQ_THRESHOLD)
  const masteredPct = pct(MASTERY_THRESHOLD)
  const retention = pct(state.settings.desiredRetention)

  const jump = useCallback(
    (id: string) => {
      const el = document.getElementById(anchorId(id))
      if (!el) return
      const instant = prefersReducedMotion() || state.settings.reduceMotion
      el.scrollIntoView({ block: 'start', behavior: instant ? 'auto' : 'smooth' })
      el.focus({ preventScroll: true })
    },
    [state.settings.reduceMotion],
  )

  return (
    <div className="page page--padtop guide">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            <IconCompass size={13} />
            Field manual · 10-minute read
          </div>
          <h1 className="h-page">How to use ORBIT</h1>
          <p className="page-head__sub">
            Where to start, how a module is meant to be worked, what the grades and percentages
            mean, and how to keep your progress safe. Everything here is read from the curriculum
            and the scheduler as you look at it.
          </p>
        </div>
      </div>

      <Card index={0} style={{ marginBottom: 'var(--gap)' }}>
        <nav className="guide-index" aria-label="Sections of this guide">
          {SECTIONS.map((s, i) => (
            <button key={s.id} className="guide-index__item" onClick={() => jump(s.id)} type="button">
              <span className="guide-index__n">{i + 1}</span>
              {s.label}
            </button>
          ))}
        </nav>
      </Card>

      <div className="stack">
        {/* ── 1. What ORBIT is ────────────────────────────────────────────── */}
        <Section def={WHAT} index={1}>
          <div className="sect guide-prose">
            <p>
              ORBIT is three things. <strong>A map</strong> of everything a complete beginner needs
              on the way to guidance, navigation and control work — {stats.modules} modules on four
              tracks, arranged as a dependency graph so you always know what rests on what.{' '}
              <strong>A scheduler</strong> that decides what you review and when, using a fitted
              memory model, so what you learn stays learned. And <strong>practice</strong>:
              exercises, code that runs in the browser, and questions with worked explanations.
            </p>
            <p>
              It is becoming a <strong>textbook as well</strong>. Modules carry written lessons
              — derivations, worked examples and check-yourself questions, written for this app and
              rendered with real mathematics — and they are arriving track by track, Foundations
              first. Where a module has them, they are the Learn step and the cited material
              (Khan Academy, OpenStax, MIT OpenCourseWare, NASA technical reports and their like)
              becomes further reading. Where a module does not yet, the page says so and points at
              the best free material until its lessons land.
            </p>
          </div>
          <div className="sect">
            <div className="guide-facts">
              <Stat value={stats.modules} label="Modules" />
              <Stat value={stats.cards.toLocaleString()} label="Flashcards" />
              <Stat value={stats.quiz.toLocaleString()} label="Questions" />
              <Stat value={stats.exercises} label="Exercises" />
              <Stat value={stats.resources} label="Cited sources" delta={`${freeSources} free`} deltaTone="ok" />
              <Stat value={Math.round(stats.hours).toLocaleString()} label="Estimated hours" />
            </div>
          </div>
        </Section>

        {/* ── 2. Where to start ───────────────────────────────────────────── */}
        <Section def={START} index={2}>
          <div className="sect">
            <div className="guide-paths">
              <div className="guide-path" data-recommended="true">
                <Tile size={34} radius={9} color={TRACKS.foundations.accent}>
                  <IconSigma size={16} />
                </Tile>
                <div className="guide-path__title">Complete beginner</div>
                <p className="guide-path__body">
                  Start in {TRACKS.foundations.title}
                  {recommended ? (
                    <>
                      {' '}
                      with <strong>{recommended.title}</strong>. It assumes nothing, and{' '}
                      {dag.descendants(recommended.id).size} modules rest on it.
                    </>
                  ) : (
                    '.'
                  )}{' '}
                  Do not skip it because it sounds basic; the later maths quietly assumes it.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(recommended ? `/module/${recommended.id}` : '/foundations')}
                >
                  {recommended ? 'Open the first module' : 'Open Foundations'}
                  <IconArrowRight size={13} />
                </Button>
              </div>

              <div className="guide-path">
                <Tile size={34} radius={9} color="var(--accent)">
                  <IconBook size={16} />
                </Tile>
                <div className="guide-path__title">Already comfortable with the maths</div>
                <p className="guide-path__body">
                  Go to Learning and work from <strong>Open now</strong>: the modules whose
                  prerequisites you have already met, ranked by what the engine thinks you should
                  do next. Recall a few sessions of a foundation module you know cold and it
                  unlocks what sits above it.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/learning')}>
                  Open Learning
                  <IconArrowRight size={13} />
                </Button>
              </div>

              <div className="guide-path">
                <Tile size={34} radius={9} color={TRACKS.career.accent}>
                  <IconBriefcase size={16} />
                </Tile>
                <div className="guide-path__title">Here for the job</div>
                <p className="guide-path__body">
                  Read the {TRACKS.career.title} track first
                  {careerFirst ? (
                    <>
                      , starting with <strong>{careerFirst.title}</strong>
                    </>
                  ) : null}
                  . It covers eligibility, the role families, the degree question and the
                  interview loop — before you spend a year on the maths, know what the gate looks
                  like.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/career')}>
                  Open Career
                  <IconArrowRight size={13} />
                </Button>
              </div>
            </div>
          </div>

          <div className="sect">
            <div className="sect__title">Entry points by track</div>
            {entries.map(({ track, entries: rows }) => (
              <div key={track}>
                <div className="guide-track" style={{ color: TRACKS[track].accent }}>
                  <span className="guide-track__dot" style={{ background: TRACKS[track].accent }} />
                  <button
                    className="guide-track__name"
                    onClick={() => navigate(TRACK_PATH[track])}
                    type="button"
                  >
                    {TRACKS[track].title}
                  </button>
                </div>
                {rows.map(({ module: m, gatedBy }) => {
                  const own = mastery.get(m.id) ?? 0
                  return (
                    <button
                      key={m.id}
                      className="guide-row"
                      onClick={() => navigate(`/module/${m.id}`)}
                      type="button"
                    >
                      <div className="grow">
                        <div className="guide-row__title">
                          <span>{m.title}</span>
                          {m.id === recommended?.id ? <Chip tone="blue">Start here</Chip> : null}
                          {gatedBy.length > 0 ? (
                            <Chip ghost>
                              <IconLock size={10} />
                              gated
                            </Chip>
                          ) : null}
                        </div>
                        <div className="guide-row__meta">
                          Tier {m.tier} · {m.hours}h
                          {gatedBy.length > 0 ? ` · opens after ${gatedBy.join(' and ')}` : ''}
                          {own > 0 ? ` · ${pct(own)} mastered` : ''}
                        </div>
                      </div>
                      <IconArrowRight size={14} className="guide-row__chev" />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {next ? (
            <div className="sect">
              <div className="sect__title">Your next module, according to the engine</div>
              <NextModule
                module={next.module}
                mastery={next.mastery}
                reason={next.reasons[0] ?? 'next in sequence'}
              />
              <p className="guide-note">
                Ranked, not alphabetical. Four things go into the order: how close the module sits
                to the difficulty where you learn fastest, how much of it is fading, whether you
                have touched it at all, and how many other modules it unblocks. The same ranking
                fills Today’s Focus on the dashboard and Open now on the Learning page.
              </p>
            </div>
          ) : null}
        </Section>

        {/* ── 3. Inside a module ──────────────────────────────────────────── */}
        <Section def={MODULE} index={3}>
          <div className="sect">
            <ol className="guide-loop">
              <li className="guide-loop__step">
                <div className="guide-loop__head">
                  <span className="guide-loop__n">1</span>
                  <span className="guide-loop__label">Learn</span>
                </div>
                <p className="guide-loop__body">
                  Read the objectives — they are the exam. Work through the curated resources in
                  order, free ones first. Then skim the <strong>Notes</strong>: this module’s
                  flashcards laid out to read. Press <strong>Mark as studied</strong> when you are
                  done.
                </p>
              </li>
              <li className="guide-loop__step">
                <div className="guide-loop__head">
                  <span className="guide-loop__n">2</span>
                  <span className="guide-loop__label">Practice</span>
                </div>
                <p className="guide-loop__body">
                  The exercises. Code ones open in the playground with tests; derivations and
                  analyses are done on paper and checked against the solution afterwards; build
                  exercises are projects. Every module has at least one.
                </p>
              </li>
              <li className="guide-loop__step">
                <div className="guide-loop__head">
                  <span className="guide-loop__n">3</span>
                  <span className="guide-loop__label">Recall</span>
                </div>
                <p className="guide-loop__body">
                  The flashcards and questions, run as a spaced-repetition session.{' '}
                  <strong>Start recall</strong> begins the first one; from then on the scheduler
                  decides when each item comes back. This is where the app earns its keep.
                </p>
              </li>
            </ol>
          </div>

          <div className="sect guide-prose">
            <p>
              <strong>Why this order.</strong> Recall only works on something you have met, so
              Learn comes first. Questions stay hidden until Recall on purpose — the Recall step
              lists them as “Hidden until you attempt it” — because attempting a question cold and
              then reading the explanation is what makes it stick. Practice sits in the middle
              because an exercise is where you find out whether the reading landed.
            </p>
            <p>
              <strong>Lessons are written to be enough on their own.</strong> Every lesson names
              the module topics it covers, and a module’s lessons together must cover every topic
              the module lists — that is checked, not hoped for. Each one teaches from the ground
              up, derives what it asks you to remember, works numbers through, and ends with
              questions whose answers fold open. Read them in order; each marks itself read as you
              go, and the last one marks the module studied. The Notes below the lessons are the
              flashcards laid out to read, and the resources are there for depth.
            </p>
            <p>
              <strong>Mark as studied</strong> is how you tell ORBIT the Learn step is done. It is
              a progress marker, not a grade: the page records the date and moves you on to Recall,
              and the scheduler pays no attention to it. “Mark as studied and start recall” does
              both at once. A module page opens on whichever step is next for you — Learn until you
              have marked it, Recall whenever something is due, Practice in between.
            </p>
          </div>
        </Section>

        {/* ── 4. Recall sessions ──────────────────────────────────────────── */}
        <Section def={RECALL} index={4}>
          <div className="sect">
            <ol className="guide-flow" aria-label="One item in a recall session">
              <li>Prompt</li>
              <li>Confidence <span className="guide-flow__opt">optional</span></li>
              <li>Reveal</li>
              <li>Grade</li>
            </ol>
            <div className="guide-prose" style={{ marginTop: 14 }}>
              <p>
                A session is a run of up to 30 items. For a flashcard you read the prompt, say the
                answer to yourself, optionally rate how sure you are, press{' '}
                <strong>Show answer</strong>, and grade what happened. For a question you pick an
                answer — that is the reveal — the correct choice lights up with its explanation,
                and you grade yourself the same way. Confidence is asked before the reveal because
                afterwards it is contaminated by knowing the answer; it feeds the calibration chart
                on Progress and can be switched off in Settings.
              </p>
            </div>
          </div>

          <div className="sect">
            <div className="sect__title">The four grades</div>
            <div className="guide-grades">
              <div className="guide-grade guide-grade--again">
                <span className="guide-grade__key">1</span>
                <div className="guide-grade__label">Again</div>
                <p className="guide-grade__body">
                  You did not get it. The item comes back within minutes, its stability drops, and
                  the lapse is recorded. This is data, not failure.
                </p>
              </div>
              <div className="guide-grade guide-grade--hard">
                <span className="guide-grade__key">2</span>
                <div className="guide-grade__label">Hard</div>
                <p className="guide-grade__body">
                  You got there, slowly or shakily. It counts as a recall; the interval grows, but
                  less than it would for Good.
                </p>
              </div>
              <div className="guide-grade guide-grade--good">
                <span className="guide-grade__key">3</span>
                <div className="guide-grade__label">Good</div>
                <p className="guide-grade__body">
                  You recalled it with normal effort. The default grade — and the one that
                  Space or Enter gives after a reveal.
                </p>
              </div>
              <div className="guide-grade guide-grade--easy">
                <span className="guide-grade__key">4</span>
                <div className="guide-grade__label">Easy</div>
                <p className="guide-grade__body">
                  Instant and certain. The interval grows the most. Use it sparingly; Good on
                  something you nearly forgot is worth more.
                </p>
              </div>
            </div>
            <p className="guide-note">
              Every grade button shows the interval it will set — 10m, 3d, 2mo — computed by running
              the scheduler without committing, so there are no hidden consequences. A brand-new
              card is shown again after about a minute and again after ten before it graduates to
              intervals measured in days.
            </p>
          </div>

          <div className="sect">
            <ul className="guide-list">
              <li>
                <span>
                  <strong>Keyboard.</strong> <Kbd>Space</Kbd> or <Kbd>Enter</Kbd> reveals;{' '}
                  <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> <Kbd>4</Kbd> grade; <Kbd>Space</Kbd> or{' '}
                  <Kbd>Enter</Kbd> after the reveal grades Good.
                </span>
              </li>
              <li>
                <span>
                  <strong>New and review.</strong> Each card says which it is. Due reviews come
                  first, the ones closest to being forgotten at the front; new items follow, a
                  short run from one module at a time, up to your daily cap of {state.goals.newPerDay}.
                  With interleaving on (the default), reviews from different modules are mixed.
                </span>
              </li>
              <li>
                <span>
                  <strong>“Nothing due right now” is the scheduler working,</strong> not a bug.
                  Reviewing early buys almost nothing — the gain is largest when you had nearly
                  forgotten. Go and learn something new instead.
                </span>
              </li>
              <li>
                <span>
                  <strong>Retention target: {retention}.</strong> How much you want to still know
                  when an item comes due. Dropping from 90% to 80% roughly triples every interval;
                  raising it to 95% cuts them by about 60%. Change it in Settings, where a target
                  date also tightens intervals as the day approaches.
                </span>
              </li>
              <li>
                <span>
                  <strong>The summary</strong> at the end says whether the session sat in the
                  productive band — roughly four in five recalled. Well above it, the scheduler
                  stretches the intervals; below it, the next session leans easier.
                </span>
              </li>
            </ul>
          </div>
        </Section>

        {/* ── 5. Mastery ──────────────────────────────────────────────────── */}
        <Section def={MASTERY} index={5}>
          <div className="sect guide-prose">
            <p>
              Every module carries a <strong>mastery</strong> percentage, built from its recall
              items: how many of them you have met, how likely you are to recall them right now, how
              durable those memories have become, and a running estimate of whether you can
              actually do the thing. Coverage multiplies the rest, so a perfect score on three of
              forty items is not mastery of a module. Marking a module studied or finishing its
              exercises does not move the number; only recall does.
            </p>
          </div>
          <div className="sect">
            <div className="guide-kv">
              <div className="guide-kv__item">
                <div className="guide-kv__v">{prereqPct}</div>
                <div className="guide-kv__k">Unlocks dependants</div>
                <div className="guide-kv__note">
                  A prerequisite at this level counts as met, and the modules that rest on it open.
                </div>
              </div>
              <div className="guide-kv__item">
                <div className="guide-kv__v">{masteredPct}</div>
                <div className="guide-kv__k">Mastered</div>
                <div className="guide-kv__note">
                  A module is done at this level. The dashboard’s “mastered” count uses it.
                </div>
              </div>
              <div className="guide-kv__item">
                <div className="guide-kv__v">{pct(readiness)}</div>
                <div className="guide-kv__k">Your readiness</div>
                <div className="guide-kv__note">The ring on the dashboard, explained below.</div>
              </div>
            </div>
          </div>
          <div className="sect">
            <ul className="guide-list">
              <li>
                <span>
                  <strong>Tiers</strong> are depth in the ladder: tier 0 assumes nothing at all.{' '}
                  {TRACK_ORDER.map((t, i) => {
                    const tiers = tiersInTrack(t)
                    const lo = tiers[0]?.tier ?? 0
                    const hi = tiers[tiers.length - 1]?.tier ?? lo
                    return (
                      <span key={t}>
                        {TRACKS[t].title} runs tiers {lo}–{hi}
                        {i < TRACK_ORDER.length - 1 ? '; ' : '.'}
                      </span>
                    )
                  })}{' '}
                  Track pages lay their modules out tier by tier.
                </span>
              </li>
              <li>
                <span>
                  <strong>Gated modules are shown, not hidden,</strong> and the gate is advice: you
                  can study one anyway, it will just be harder than it needs to be. The module page
                  names what to bring to {prereqPct} first and links to it. People who push past the
                  gate tend to bounce off the Kalman filter and conclude they are bad at maths, when
                  the gap was three modules upstream.
                </span>
              </li>
              <li>
                <span>
                  <strong>Readiness</strong> — the ring and the four track bars — is a weighted
                  average of mastery. A module counts for more when more of the curriculum depends
                  on it, and its mastery is discounted while its weakest prerequisite is shaky. That
                  is why the ring moves most when foundations move.
                </span>
              </li>
            </ul>
          </div>
          <div className="sect">
            <div className="sect__title">Mission phase, from the top bar</div>
            <div className="guide-phases">
              {phases.map((p) => (
                <div key={p.id} className="guide-phase" data-on={p.id === phase}>
                  <div className="guide-phase__label">{p.label}</div>
                  <div className="guide-phase__range">
                    {p.to >= 1 ? `${pct(p.from)} and up` : `${pct(p.from)} – ${Math.round(p.to * 100) - 1}%`}
                  </div>
                  <div className="guide-phase__body">
                    {p.id === 'prepare'
                      ? 'Building the foundations everything else leans on.'
                      : p.id === 'build'
                        ? 'The engineering core is open and filling in.'
                        : 'Consolidating, and turning towards the job itself.'}
                    {p.id === phase ? ' You are here.' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 6. Your day ─────────────────────────────────────────────────── */}
        <Section def={DAY} index={6}>
          <div className="sect guide-prose">
            <p>
              The dashboard’s <strong>Today’s Focus</strong> is the planner’s list for the day: one
              review task whenever anything is due, then up to three study tasks drawn from the
              ranked frontier, then one practice exercise. Tick them off as you go; the list is
              rebuilt every day from what you did the day before. Nothing on it is a mock.
            </p>
          </div>
          <div className="sect">
            <div className="guide-kv">
              <div className="guide-kv__item">
                <div className="guide-kv__v">
                  {days} <span className="guide-kv__unit">day{days === 1 ? '' : 's'}</span>
                </div>
                <div className="guide-kv__k">Streak</div>
                <div className="guide-kv__note">
                  Consecutive days with any activity. A day not yet done does not break it until
                  tomorrow.
                </div>
              </div>
              <div className="guide-kv__item">
                <div className="guide-kv__v">
                  {weekMinutes} <span className="guide-kv__unit">/ {state.goals.weeklyMinutes} min</span>
                </div>
                <div className="guide-kv__k">This week</div>
                <div className="guide-kv__note">
                  Weekly rather than daily on purpose: one busy day should not turn a good week into
                  a felt failure.
                </div>
              </div>
              <div className="guide-kv__item">
                <div className="guide-kv__v">{state.goals.newPerDay}</div>
                <div className="guide-kv__k">New items per day</div>
                <div className="guide-kv__note">
                  Every new item is a permanent review obligation. Twelve a day is roughly ninety
                  reviews a day at steady state.
                </div>
              </div>
              <div className="guide-kv__item">
                <div className="guide-kv__v">
                  {state.goals.maxReviewsPerDay > 0 ? state.goals.maxReviewsPerDay : 'No cap'}
                </div>
                <div className="guide-kv__k">Max reviews per day</div>
                <div className="guide-kv__note">
                  Reviews beyond the cap wait for tomorrow; the most-forgotten items always go
                  first.
                </div>
              </div>
            </div>
            <div className="guide-actions">
              <Button variant="outline" size="sm" onClick={() => navigate('/progress')}>
                View full schedule
                <IconArrowRight size={13} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                Change goals
              </Button>
            </div>
          </div>
        </Section>

        {/* ── 7. Practice ─────────────────────────────────────────────────── */}
        <Section def={PRACTICE} index={7}>
          <div className="sect">
            <ul className="guide-list guide-list--kinds">
              {EXERCISE_KINDS.map((k) => (
                <li key={k.kind}>
                  <span>
                    <strong>{k.label}</strong>
                    <span className="guide-count"> · {exerciseCounts.byKind.get(k.kind) ?? 0}</span>
                    <br />
                    {k.how}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sect guide-prose">
            <p>
              <strong>The playground</strong> is where code exercises open, and it is also a
              scratchpad you can reach from Quick Tools. Python runs for real —{' '}
              <ExternalLink href="https://pyodide.org">CPython compiled to WebAssembly</ExternalLink>,
              with NumPy, SciPy, SymPy, pandas and Matplotlib loaded on demand, plots included. SQL
              runs for real against{' '}
              <ExternalLink href="https://sql.js.org">SQLite compiled to WebAssembly</ExternalLink>,
              each exercise on a fresh in-memory database. {exerciseCounts.tested} exercises carry
              tests you can pass. In the desktop app, C, C++, Rust and shell are compiled and run
              for real using the toolchain already on your Mac, and those exercises are graded by
              running your program and the reference solution and comparing what they actually
              printed. MATLAB runs through GNU Octave when it is installed, and still ships a NumPy
              equivalent when it is not. Where a compiler is missing, the header says which one and
              gives you the command that installs it, and falls back to comparing against the
              expected output until then. It always says which of these just happened, because a
              green tick on a string comparison would be worth less than nothing.
            </p>
            <p>
              <strong>The workbench</strong> is the other place code runs, and it is deliberately
              outside everything else. It holds small pieces of the actual job — retune a rate loop
              until it meets its margins, find the sign error in a frame transform, size a landing
              burn, stop a filter diverging. Your code runs against a real scenario and you get a
              margin report back rather than a mark: not &ldquo;correct&rdquo; but &ldquo;gain
              margin 4.2 dB, you need 6&rdquo;. None of it counts towards your mastery, readiness,
              review queue or daily plan, on purpose. It is the thing to open on a day when the
              curriculum feels like homework, and it would stop being that the moment it started
              counting.
            </p>
            <p>
              The first time you open the playground it downloads the runtime — several megabytes,
              once — from cdn.jsdelivr.net, and the browser caches it. Nothing you write leaves your
              machine. Your code is saved on this device as you type, per exercise and per scratch
              language; <strong>Reset</strong> restores the starter, and <Kbd>Ctrl</Kbd>+
              <Kbd>Enter</Kbd> runs.
            </p>
          </div>
        </Section>

        {/* ── 8. Other pages ──────────────────────────────────────────────── */}
        <Section def={PAGES} index={8}>
          <div className="sect" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <PageRow
              icon={<IconBook size={17} />}
              title="Learning"
              path="/learning"
              body={`The whole knowledge tree. Open now is the ranked frontier (${ranked.length} modules right now), Everything is the full corpus, Pinned is your bookmarks, Gated is what is still out of reach and why. Search covers titles, summaries, topics and tags.`}
            />
            <PageRow
              icon={<IconBars size={17} />}
              title="Progress"
              path="/progress"
              body="Everything the scheduler believes about you, with its working shown: recall right now, streak, this week and lifetime accuracy; what you will still know in a year if you keep reviewing versus if you stop; readiness over time; the review workload for the next thirty days; your calibration; and a diagnosis panel naming struggling, stale and leech items and prerequisite gaps. Completion is projected as a range, never a date. Empty until you have studied something."
            />
            <PageRow
              icon={<IconDoc size={17} />}
              title="Resources"
              path="/resources"
              body={`Every source the curriculum cites, deduplicated and sorted free-first, filterable by kind. The Formula bank tab collects all ${formulas} flashcards whose answer is an equation.`}
            />
            <PageRow
              icon={<IconGear size={17} />}
              title="Settings"
              path="/settings"
              body="Backup comes first for a reason: everything is stored on this device only, so Export regularly and keep the file somewhere else. Then the retention target, the confidence prompt, interleaving, interval fuzz and reduced motion; your goals and target date; your display name. The danger zone erases everything, with no undo."
            />
            <PageRow
              icon={<IconDownload size={17} />}
              title={isDesktop ? 'Settings → Updates' : 'Settings → Updates (Mac app)'}
              path="/settings"
              body="In the Mac app, an Updates card checks GitHub for a newer curriculum bundle, downloads it and switches to it on the next restart; Roll back returns to the bundle the app shipped with. While the repository is private it needs a read-only access token, stored in the macOS keychain."
              last
            />
          </div>
        </Section>

        {/* ── 9. FAQ ──────────────────────────────────────────────────────── */}
        <Section def={FAQ} index={9}>
          <div className="sect">
            <div className="guide-faq">
              <Faq q="I pressed Start and got a quiz. Where is the lesson?">
                That was the recall step. Earlier builds opened a module on a “Start studying”
                button that launched recall straight away, which read as a quiz you had never been
                taught for. The module page now leads with Learn — objectives, the curated
                resources and the Notes — and holds the questions back until Recall. ORBIT teaches
                through curated resources plus notes, then holds you to it; it has no lesson text
                of its own, on purpose.
              </Faq>
              <Faq q="Why are the questions hidden until Recall?">
                Because the attempt is the point. A question you try cold, get wrong and then read
                the explanation for is worth far more than one you read the answer to first. The
                flashcards are notes as much as tests, so the Learn step shows them in full.
              </Faq>
              <Faq q="Can I skip ahead?">
                Yes. Nothing is locked. Open any module from Learning → Everything or from a track
                page; if it is gated the page says what to bring to {prereqPct} first, and you can
                carry on regardless. Expect it to be harder. The gate only controls which modules
                the planner proposes as new material.
              </Faq>
              <Faq q="How long does the whole thing take?">
                The authored estimate is about {Math.round(stats.hours).toLocaleString()} hours of
                study across all {stats.modules} modules, for a true beginner. At the default goal
                of {state.goals.weeklyMinutes} minutes a week that is years, not months — and it
                depends heavily on where you start. An engineering graduate skips most of
                Foundations, and a module you already know cold takes a few recall sessions rather
                than its listed hours. After a couple of weeks of history, Progress projects a
                completion window from your own pace, as a range.
              </Faq>
              <Faq q={`Does ${masteredPct} mean I'm ready for interviews?`}>
                No. It means you retain the material in that module and can produce it on demand,
                as measured by its cards and questions — necessary, not sufficient. The Career
                track covers the interview itself: eligibility, the role families, the degree
                question, technical rounds, presenting your work. Exercises and build projects are
                what turn retention into something you can show.
              </Faq>
              <Faq q="What if I keep getting things wrong?">
                Press Again and move on; it is data, not failure. The scheduler brings the item
                back sooner, and it aims for roughly four in five right — a session where you got
                everything taught you little. If a module keeps hurting, the module page’s “What
                the engine sees” panel and the Diagnosis panel on Progress will usually say why: a
                prerequisite gap, a stale module, or a few leech items that keep lapsing. Nine
                times out of ten the fix is upstream.
              </Faq>
              <Faq q="Can I use it on my phone?">
                Yes. The web build works in a phone browser and installs as a web app from the
                browser’s “Add to Home Screen”; the layout is built for it, and the app shell works
                offline once loaded. The Mac app is desktop only. Progress does not sync between
                devices — export a backup on one and restore it on the other. The playground works
                on a phone too, though the Python runtime is a sizeable download.
              </Faq>
              <Faq q="Where is my data, and how do I not lose it?">
                On this device only: in the browser’s storage for this site, or in the Mac app’s
                own library folder. There is no account, no sync and no server copy, so clearing
                site data — or a browser evicting it — erases everything. Settings → Export writes
                a single JSON file with your whole scheduling state; keep it somewhere that is not
                this device, and refresh it regularly. Restore replaces everything with that file.
                Safari ignores requests to make storage persistent, so there the export is the only
                durable copy.
              </Faq>
            </div>
          </div>
        </Section>
      </div>

      <div className="guide-foot">
        <Button variant="primary" size="md" onClick={() => navigate(next ? `/module/${next.module.id}` : '/learning')}>
          {next ? `Open ${next.module.title}` : 'Open Learning'}
          <IconArrowRight size={15} />
        </Button>
        <Button variant="ghost" size="md" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      </div>

      <p className="track-note">
        Everything on this page is read from the curriculum and the engine as it renders — the
        counts, the thresholds, your goals and your next module — so it cannot drift from what the
        app actually does.
      </p>
    </div>
  )
}

/* ── Bits ────────────────────────────────────────────────────────────────── */

/**
 * A card with the standard header, but with a real heading element inside it
 * so the page can be navigated by heading. Same classes as `CardHead`, same
 * look; `CardHead` renders a span, which screen readers do not list.
 */
function Section({ def, index, children }: { def: SectionDef; index: number; children: ReactNode }) {
  return (
    <section className="guide-sect" id={anchorId(def.id)} tabIndex={-1} aria-labelledby={titleId(def.id)}>
      <Card index={Math.min(index, 4)}>
        <div className="card-head card-head--divided">
          <div className="card-head__title">
            <def.Icon size={15} />
            <h2 className="eyebrow guide-h2" id={titleId(def.id)}>
              {def.title}
            </h2>
          </div>
        </div>
        {children}
      </Card>
    </section>
  )
}

function NextModule({ module, mastery, reason }: { module: Module; mastery: number; reason: string }) {
  const Icon = TRACK_ICON[module.track]
  const track = TRACKS[module.track]
  return (
    <button className="guide-row guide-row--next" onClick={() => navigate(`/module/${module.id}`)} type="button">
      <Tile size={38} radius={10} color={track.accent} lit={mastery > 0.05}>
        <Icon size={17} />
      </Tile>
      <div className="grow">
        <div className="guide-row__title">
          <span>{module.title}</span>
          <Chip ghost>{reason}</Chip>
        </div>
        <div className="guide-row__meta">
          {track.title} · Tier {module.tier} · {module.hours}h · {pct(mastery)} mastered
        </div>
      </div>
      <IconArrowRight size={15} className="guide-row__chev" />
    </button>
  )
}

function PageRow({
  icon,
  title,
  body,
  path,
  last = false,
}: {
  icon: ReactNode
  title: string
  body: string
  path: string
  last?: boolean
}) {
  return (
    <button className="guide-page" data-last={last} onClick={() => navigate(path)} type="button">
      <Tile size={36} radius={9}>
        {icon}
      </Tile>
      <div className="grow">
        <div className="guide-page__title">{title}</div>
        <p className="guide-page__body">{body}</p>
      </div>
      <IconArrowRight size={14} className="guide-row__chev" />
    </button>
  )
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="guide-faq__item">
      <h3 className="guide-faq__q">{q}</h3>
      <p className="guide-faq__a">{children}</p>
    </div>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="guide-kbd">{children}</kbd>
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  )
}
