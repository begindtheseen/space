/* ============================================================================
   ORBIT — mission briefing
   ----------------------------------------------------------------------------
   The first thing to read, before the curriculum. Six short screens: what the
   mission is, how the coding she already does fits in, the route from here to
   the capstone, what a lesson feels like (with a real note to tap and a real
   Explain to try), how it sticks, and where to start.

   Written in the lessons' plain voice, for someone who has not started yet
   and needs a reason to. Every module it names or counts is read from the
   corpus (briefing-data.ts). Finishing it, or choosing where to start, marks
   the first-run welcome as done.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ExplainPanel } from '@/components/ExplainPanel'
import { SelectionAsk } from '@/components/SelectionAsk'
import {
  IconArrowRight,
  IconBook,
  IconBulb,
  IconChevronLeft,
  IconClock,
  IconCode,
  IconCompass,
  IconFlame,
  IconRecall,
  IconSpark,
  IconTarget,
} from '@/components/icons'
import { Button, Card } from '@/components/ui'
import { MODULES, TRACKS as CURRICULUM_TRACKS, lessonsFor } from '@/curriculum'
import { setOnboarded } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import { TRACKS as LEARN_TRACKS, passedCount } from '@/learn/index'
import { onExplainRequested } from '@/lib/ctxBus'
import type { ExplainSeed, LibraryLesson } from '@/lib/explain'
import { Markdown } from '@/lib/markdown'
import { navigate } from '@/lib/router'
import { BASECAMP_ID, PACES, bridges, missionStages } from './briefing-data'
import './briefing.css'

const CHAPTERS = ['The mission', 'You already started', 'The route', 'Inside a lesson', 'How it sticks', 'Where to start'] as const

export function Briefing() {
  const { setState } = useLearner()
  const [at, setAt] = useState(0)
  const top = useRef<HTMLDivElement | null>(null)

  const go = useCallback((n: number) => {
    setAt(Math.max(0, Math.min(CHAPTERS.length - 1, n)))
    top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])

  // Arrow keys turn the page, unless she is typing or has text selected for Explain.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, [contenteditable="true"]') || !window.getSelection()?.isCollapsed) return
      if (e.key === 'ArrowRight') go(at + 1)
      if (e.key === 'ArrowLeft') go(at - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [at, go])

  const finish = useCallback(
    (to: string) => {
      setState((s) => setOnboarded(s))
      navigate(to)
    },
    [setState],
  )

  const last = at === CHAPTERS.length - 1
  return (
    <div className="page page--padtop brief" ref={top}>
      <nav className="brief-rail" aria-label="Briefing chapters">
        {CHAPTERS.map((c, i) => (
          <button
            key={c}
            type="button"
            className="brief-rail__step"
            data-state={i === at ? 'here' : i < at ? 'done' : 'ahead'}
            onClick={() => go(i)}
            aria-current={i === at ? 'step' : undefined}
          >
            <span className="brief-rail__dot">{i + 1}</span>
            <span className="brief-rail__label">{c}</span>
          </button>
        ))}
      </nav>

      <div className="brief-body" key={at}>
        {at === 0 ? <Mission /> : null}
        {at === 1 ? <AlreadyStarted /> : null}
        {at === 2 ? <Route /> : null}
        {at === 3 ? <InsideALesson /> : null}
        {at === 4 ? <HowItSticks /> : null}
        {at === 5 ? <WhereToStart onPick={finish} /> : null}
      </div>

      <div className="brief-nav">
        {at > 0 ? (
          <Button variant="ghost" size="md" onClick={() => go(at - 1)}>
            <IconChevronLeft size={14} /> Back
          </Button>
        ) : (
          <span />
        )}
        {!last ? (
          <Button variant="primary" size="lg" onClick={() => go(at + 1)}>
            {at === 0 ? 'Show me how' : `Next: ${CHAPTERS[at + 1]}`} <IconArrowRight size={15} />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/* ── 1. The mission ───────────────────────────────────────────────────────── */

function Mission() {
  return (
    <section className="brief-mission">
      <div className="brief-mission__text">
        <div className="brief-kicker">Mission briefing</div>
        <h1 className="brief-h1">Somewhere right now, a rocket is landing itself.</h1>
        <p className="brief-lead">
          A booster falls back from the edge of space, faster than sound. It flips around, lights its engines and settles
          onto a ship the size of a football field. Nobody is holding a joystick. <strong>Code is flying it.</strong>
        </p>
        <p>That code answers three questions, many times every second:</p>
        <ul className="brief-gnc">
          <li>
            <span className="brief-gnc__letter">N</span>
            <span>
              <strong>Where am I?</strong> That is <em>navigation</em>.
            </span>
          </li>
          <li>
            <span className="brief-gnc__letter">G</span>
            <span>
              <strong>Where should I go?</strong> That is <em>guidance</em>.
            </span>
          </li>
          <li>
            <span className="brief-gnc__letter">C</span>
            <span>
              <strong>How do I get there?</strong> That is <em>control</em>.
            </span>
          </li>
        </ul>
        <p>
          The people who write it are called <strong>GNC engineers</strong>. ORBIT exists to take you from where you are
          today, one short lesson at a time, to being one.
        </p>
      </div>
      <Booster />
    </section>
  )
}

/** A booster coming down onto its ship. Still, for anyone who asked for less motion. */
function Booster() {
  return (
    <svg className="brief-booster" viewBox="0 0 200 260" role="img" aria-label="A rocket booster landing on a ship">
      <defs>
        <linearGradient id="brief-flame" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#ff7a2e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="brief-booster__stars" fill="#9cc3ff">
        <circle cx="24" cy="30" r="1.2" />
        <circle cx="170" cy="18" r="1" />
        <circle cx="150" cy="80" r="1.3" />
        <circle cx="40" cy="110" r="0.9" />
        <circle cx="182" cy="140" r="1" />
      </g>
      <g className="brief-booster__craft">
        <path d="M92 40 h16 v112 h-16 z" fill="#dfe8f5" />
        <path d="M92 40 l8 -14 l8 14 z" fill="#dfe8f5" />
        <rect x="92" y="60" width="16" height="6" fill="#1f4060" />
        <path d="M92 146 l-12 18 M108 146 l12 18" stroke="#dfe8f5" strokeWidth="3" strokeLinecap="round" />
        <path className="brief-booster__flame" d="M94 152 q6 34 6 44 q0 -10 6 -44 z" fill="url(#brief-flame)" />
      </g>
      <path d="M40 222 h120 l-10 14 h-100 z" fill="#12253d" />
      <path d="M20 240 q40 -6 80 0 t80 0" stroke="#1f4060" strokeWidth="2" fill="none" />
    </svg>
  )
}

/* ── 2. You already started ───────────────────────────────────────────────── */

function AlreadyStarted() {
  const { state } = useLearner()
  const passed = Object.keys(state.learn).length
  const courses = LEARN_TRACKS.filter((t) => passedCount(t, state.learn) > 0).length
  const list = useMemo(() => bridges(), [])
  return (
    <section>
      <div className="brief-kicker">You already started</div>
      <h2 className="brief-h2">The code you write in Learn to code is the code that flies.</h2>
      {passed ? (
        <p className="brief-lead">
          You have passed <strong>{passed}</strong> coding {passed === 1 ? 'lesson' : 'lessons'}
          {courses > 1 ? ` across ${courses} courses` : ''}. That is real progress, and none of it is wasted.
        </p>
      ) : null}
      <p>
        Learn to code teaches you <em>how</em> to tell a computer what to do. The curriculum teaches you{' '}
        <em>what a rocket needs to be told</em>. Here is where the things you already know show up:
      </p>
      <div className="brief-bridges">
        {list.map((b) => (
          <a key={b.skill} className="brief-bridge" href={`#/module/${b.moduleId}`}>
            <span className="brief-bridge__skill">
              <IconCode size={13} /> {b.skill}
            </span>
            <span className="brief-bridge__use">{b.use}</span>
            <span className="brief-bridge__where">{b.title}</span>
          </a>
        ))}
      </div>
      <p className="brief-note">
        Keep going with Learn to code alongside the curriculum. They are two halves of the same job: one without the
        other is either a programmer who cannot fly a rocket, or an engineer who cannot write the code.
      </p>
    </section>
  )
}

/* ── 3. The route ─────────────────────────────────────────────────────────── */

function Route() {
  const stages = useMemo(() => missionStages(), [])
  const coding = MODULES.filter((m) => m.track === 'coding').length
  const career = MODULES.filter((m) => m.track === 'career').length
  return (
    <section>
      <div className="brief-kicker">The route</div>
      <h2 className="brief-h2">From Basecamp to a rocket you fly yourself.</h2>
      <p>
        The route is a ladder: each stage uses the one before it, so nothing appears that you have not been ready for.
        You start at the bottom whatever you already know, and the placement test lets you skip what you can already do.
      </p>
      <ol className="brief-route">
        {stages.map((s, i) => (
          <li key={s.id} className="brief-stage" data-first={i === 0 || undefined}>
            <span className="brief-stage__n">{i + 1}</span>
            <div>
              <div className="brief-stage__head">
                <strong>{s.name}</strong>
                <span className="brief-stage__count">
                  {s.modules.length} {s.modules.length === 1 ? 'module' : 'modules'}
                </span>
                {i === 0 ? <span className="brief-here">You start here</span> : null}
              </div>
              <p className="brief-stage__about">{s.about}</p>
              <p className="brief-stage__payoff">
                <IconTarget size={12} /> {s.payoff}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="brief-alongside">
        <Card pad className="brief-alongside__card" style={{ borderColor: 'var(--d-coding)' }}>
          <strong style={{ color: 'var(--d-coding)' }}>{CURRICULUM_TRACKS.coding.title}</strong> runs alongside:{' '}
          {coding} modules, from Python to the C++ that flies, plus Linux, Git and MATLAB.
        </Card>
        <Card pad className="brief-alongside__card" style={{ borderColor: 'var(--d-career)' }}>
          <strong style={{ color: 'var(--d-career)' }}>{CURRICULUM_TRACKS.career.title}</strong> comes near the end:{' '}
          {career} modules on getting the job, from the first recruiter call to the final interview.
        </Card>
      </div>
      <p className="brief-note">
        It is long, because it is the real thing: the same subjects a GNC engineer learns at university and on the job.
        You never need to look at the whole ladder. You only ever need the next lesson, and each one takes about twenty
        minutes.
      </p>
    </section>
  )
}

/* ── 4. Inside a lesson ───────────────────────────────────────────────────── */

const DEMO = `Last lesson you worked out how fast things fall. Now for the strange part: a spacecraft in **orbit** is falling too, all the time.

Picture throwing a ball. Throw it harder and it lands further away. Now imagine throwing it so fast that, as it falls, the ground curves away underneath it just as quickly. It keeps falling, and it never lands. That is an [[orbit|brief-orbit]]: falling around the Earth instead of into it.

For a low orbit, "fast enough" is about **7.8 kilometers every second**. That is Los Angeles to San Francisco in about seventy seconds.

::: context brief-orbit Falling, but always missing
An orbit is a path where something falls toward a planet but moves sideways fast enough to keep missing it. Nothing holds a satellite up: gravity pulls it down the whole time, and its sideways speed carries it around. Astronauts float for the same reason: they and their spacecraft are falling together. You will work out the exact speed yourself in the Orbits stage, from one line of algebra.
:::
`

function InsideALesson() {
  const [asking, setAsking] = useState<ExplainSeed | null>(null)
  const closeAsk = useCallback(() => setAsking(null), [])
  const demoRef = useRef<HTMLDivElement | null>(null)
  const here = useMemo<LibraryLesson>(
    () => ({ moduleId: BASECAMP_ID, moduleTitle: 'Mission briefing', lessonId: 'briefing-demo', title: 'A sample lesson', body: DEMO }),
    [],
  )
  useEffect(() => onExplainRequested(setAsking), [])
  return (
    <section>
      <div className="brief-kicker">Inside a lesson</div>
      <h2 className="brief-h2">Lessons read like a friend explaining, not like a textbook.</h2>
      <p>Here is a real piece of one. Try the two things in the boxes below it.</p>
      <div className="brief-demo" ref={demoRef}>
        <Markdown className="reader__md" notes>
          {DEMO}
        </Markdown>
      </div>
      <div className="brief-tries">
        <div className="brief-try">
          <IconBulb size={15} />
          <span>
            <strong>Tap the underlined word.</strong> A note slides open with the story behind it. Lessons are full
            of them, for any word you might not know yet.
          </span>
        </div>
        <div className="brief-try">
          <IconSpark size={15} />
          <span>
            <strong>Highlight any words, then press Explain.</strong> It finds where the app explains them, and where
            you met them before. It works offline and never sends anything anywhere.
          </span>
        </div>
      </div>
      <ul className="brief-features">
        <li>
          <IconBook size={14} /> Every lesson starts from something you know and adds one idea at a time.
        </li>
        <li>
          <IconCode size={14} /> Code in a lesson runs right there. Change it and press Run.
        </li>
        <li>
          <IconCompass size={14} /> Check yourself questions at the end show whether it clicked, with the answer
          explained.
        </li>
        <li>
          <IconClock size={14} /> Read aloud reads any lesson to you, math included.
        </li>
      </ul>
      <SelectionAsk container={demoRef} onAsk={setAsking} />
      {asking ? <ExplainPanel seed={asking} here={here} onClose={closeAsk} /> : null}
    </section>
  )
}

/* ── 5. How it sticks ─────────────────────────────────────────────────────── */

function HowItSticks() {
  const { state, setState } = useLearner()
  const weekly = state.goals.weeklyMinutes
  const pick = (minutes: number) => setState((s) => ({ ...s, goals: { ...s.goals, weeklyMinutes: minutes } }))
  return (
    <section>
      <div className="brief-kicker">How it sticks</div>
      <h2 className="brief-h2">Reading a lesson once is the start, not the end.</h2>
      <div className="brief-sticks">
        <Stick icon={<IconRecall size={16} />} title="Flashcards that come back">
          After each module you get flashcards. The app brings each one back just before you would forget it: after a
          day, then a few days, then weeks. Five minutes of cards keeps everything you have learned.
        </Stick>
        <Stick icon={<IconTarget size={16} />} title="Quizzes and real exercises">
          Each module ends with a quiz and hands-on exercises, many of them code. Your mastery of a module fills up as
          you pass them, and the next module opens when you are ready for it.
        </Stick>
        <Stick icon={<IconClock size={16} />} title="Focus blocks">
          Start a focus block and the app keeps you on one thing for a set time. Most people
          get more done in 25 focused minutes than in an hour of dipping in.
        </Stick>
        <Stick icon={<IconFlame size={16} />} title="A little every day">
          Twenty minutes a day beats three hours on a Sunday. Your brain does the filing overnight, so short and often
          is how this stays in.
        </Stick>
      </div>
      <h3 className="brief-h3">Pick a pace for your first week</h3>
      <p>You can change it any time in Settings. Starting easy and finding you want more is better than the opposite.</p>
      <div className="brief-paces" role="radiogroup" aria-label="Weekly study goal">
        {PACES.map((p) => (
          <button
            key={p.minutes}
            type="button"
            role="radio"
            aria-checked={weekly === p.minutes}
            className="brief-pace"
            data-on={weekly === p.minutes || undefined}
            onClick={() => pick(p.minutes)}
          >
            <strong>{p.label}</strong>
            <span>{p.hint}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Stick({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="brief-stick">
      <span className="brief-stick__icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  )
}

/* ── 6. Where to start ────────────────────────────────────────────────────── */

function WhereToStart({ onPick }: { onPick: (to: string) => void }) {
  const first = lessonsFor(BASECAMP_ID)[0]
  const basecamp = `/module/${BASECAMP_ID}${first ? `?lesson=${first.id}` : ''}`
  return (
    <section>
      <div className="brief-kicker">Where to start</div>
      <h2 className="brief-h2">Two ways in. Both are right.</h2>
      <div className="brief-starts">
        <Card pad className="brief-start" accent="var(--accent)">
          <div className="brief-start__tag">Recommended</div>
          <h3 className="brief-h3">Take the placement test</h3>
          <p>
            A short set of questions, from counting up to logarithms. <strong>"I don't know" is a good
            answer</strong>: it is how the test finds the right place for you. At the end you get a plan: the lessons
            you need, in order, and the ones you can skip.
          </p>
          <Button variant="primary" size="lg" onClick={() => onPick('/placement')}>
            Take the placement test <IconArrowRight size={15} />
          </Button>
        </Card>
        <Card pad className="brief-start">
          <div className="brief-start__tag">Or</div>
          <h3 className="brief-h3">Start at Basecamp, lesson 1</h3>
          <p>
            Begin at the very bottom of the ladder: {first ? `"${first.title}"` : 'place value and estimating'}. It is
            gentle on purpose, and it moves quickly through anything you already know.
          </p>
          <Button variant="outline" size="lg" onClick={() => onPick(basecamp)}>
            Open Basecamp <IconArrowRight size={15} />
          </Button>
        </Card>
      </div>
      <p className="brief-note">
        You can come back to this briefing any time from the Guide. And keep your Learn to code streak going: a coding
        lesson and a curriculum lesson a day is a very good day.
      </p>
      <button type="button" className="brief-skip" onClick={() => onPick('/')}>
        Take me to the dashboard instead
      </button>
    </section>
  )
}
