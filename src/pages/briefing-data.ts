/* ============================================================================
   ORBIT — what the mission briefing says, worked out from the curriculum
   ----------------------------------------------------------------------------
   The briefing (Briefing.tsx) is the first thing to read: what ORBIT is for,
   the route from here to a GNC engineer, what a lesson feels like, and where
   to start. Everything it counts or links is read from the corpus here, so
   the page cannot promise a module that is not there.
   ========================================================================== */
import { MODULES, moduleById } from '@/curriculum'
import type { Module } from '@/curriculum/types'

export interface Stage {
  id: string
  name: string
  /** What the stage is, in one plain sentence. */
  about: string
  /** Something she will be able to do at the end of it. */
  payoff: string
  modules: Module[]
}

/**
 * The main route: the math and physics (Foundations) and the engineering core
 * (GNC Prep), in tier order. Coding and Career run alongside it rather than
 * in a line, so they are not stages.
 */
const STAGE_TEXT: { id: string; tier: number; name: string; about: string; payoff: string }[] = [
  {
    id: 'basecamp',
    tier: -1,
    name: 'Basecamp',
    about: 'The math under everything, from the ground up: fractions, formulas, graphs, angles and units.',
    payoff: 'Estimate how much fuel a rocket burns before you touch a calculator.',
  },
  {
    id: 'math',
    tier: 0,
    name: 'The math toolkit',
    about: 'Algebra, trigonometry, calculus, vectors and matrices: the language every later stage is written in.',
    payoff: 'Describe a rocket\'s position, speed and direction with numbers a computer can use.',
  },
  {
    id: 'motion',
    tier: 1,
    name: 'How things move',
    about: 'Forces, spinning bodies, and how to describe which way a spacecraft is pointing.',
    payoff: 'Predict how a rocket turns when one engine pushes harder than the others.',
  },
  {
    id: 'orbits',
    tier: 2,
    name: 'Orbits',
    about: 'Why things stay up, how to change orbit, how to meet another spacecraft, and how to land.',
    payoff: 'Plan the burns that move a satellite from a low orbit to a high one.',
  },
  {
    id: 'control',
    tier: 3,
    name: 'Control',
    about: 'Feedback: measuring what is happening and correcting it, fast and without overshooting.',
    payoff: 'Design the autopilot that holds a rocket straight as the wind pushes it.',
  },
  {
    id: 'navigation',
    tier: 4,
    name: 'Navigation',
    about: 'Working out where you are from noisy sensors: GPS, gyroscopes, star trackers and the Kalman filter.',
    payoff: 'Build the filter that tells a spacecraft where it is, even when a sensor lies.',
  },
  {
    id: 'guidance',
    tier: 5,
    name: 'Guidance',
    about: 'Choosing the path: the steering that gets a rocket to orbit and brings a booster down on its legs.',
    payoff: 'Compute a landing burn the way the landing boosters you have watched do it.',
  },
  {
    id: 'software',
    tier: 6,
    name: 'Flight software',
    about: 'Code that runs on time, every time, survives faults, and is tested thousands of times in simulation.',
    payoff: 'Run a thousand simulated flights and prove your software lands every one.',
  },
  {
    id: 'capstone',
    tier: 7,
    name: 'The capstone',
    about: 'Everything at once: your own simulation of a rocket, from lift-off to orbit to landing.',
    payoff: 'Show an interviewer a working GNC system you built yourself.',
  },
]

export const BASECAMP_ID = 't0_m00_basecamp'

export function missionStages(modules: Module[] = MODULES): Stage[] {
  const route = modules.filter((m) => m.track === 'foundations' || m.track === 'gnc')
  return STAGE_TEXT.map(({ tier, ...text }) => ({
    ...text,
    modules:
      tier === -1
        ? route.filter((m) => m.id === BASECAMP_ID)
        : route.filter((m) => m.tier === tier && m.id !== BASECAMP_ID),
  })).filter((s) => s.modules.length)
}

export interface Bridge {
  /** What she already does in Learn to code. */
  skill: string
  /** Where the curriculum puts it to work. */
  use: string
  moduleId: string
}

/**
 * The coding she already enjoys, and the place in the curriculum where each
 * piece of it stops being an exercise and starts flying something.
 */
export const BRIDGES: Bridge[] = [
  { skill: 'Variables and arithmetic', use: 'Turn a formula into a number: how long a burn lasts, how far a rocket climbs.', moduleId: 't0_m00_basecamp' },
  { skill: 'Loops', use: 'Step a falling rocket forward a hundredth of a second at a time: a simulation.', moduleId: 't0_m10_numerical_methods' },
  { skill: 'if and else', use: 'The heart of a controller: if the rocket leans left, push right.', moduleId: 't3_m26_classical_control' },
  { skill: 'Functions', use: 'Write an orbit calculator once and use it for every satellite you meet.', moduleId: 't2_m19_two_body' },
  { skill: 'Lists and NumPy arrays', use: 'Vectors and matrices: how position, speed and pointing are stored.', moduleId: 't0_m04_linear_algebra_1' },
  { skill: 'C++', use: 'The language real flight computers run, with rules strict enough to trust in space.', moduleId: 't6_m44_realtime_embedded' },
]

export function bridges(): (Bridge & { title: string })[] {
  return BRIDGES.flatMap((b) => {
    const m = moduleById(b.moduleId)
    return m ? [{ ...b, title: m.title }] : []
  })
}

/** Weekly study goals she can pick, in the words of a day. */
export const PACES: { minutes: number; label: string; hint: string }[] = [
  { minutes: 105, label: 'Easy start', hint: 'About 15 minutes a day' },
  { minutes: 175, label: 'Steady', hint: 'About 25 minutes a day, one lesson' },
  { minutes: 315, label: 'Keen', hint: 'About 45 minutes a day' },
  { minutes: 600, label: 'All in', hint: 'About an hour and a half a day' },
]
