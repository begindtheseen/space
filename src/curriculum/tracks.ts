/* ============================================================================
   ORBIT — the four pillars
   ----------------------------------------------------------------------------
   Copy for the dashboard cards. The structure mirrors the reference layout
   exactly — icon, title, a three-line pitch, five bullet lines, a
   Continue action and a completion bar — with every pillar aimed at guidance,
   navigation and control work rather than at general self-improvement.
   ========================================================================== */
import type { TrackDef, TrackId } from './types'

export const TRACKS: Record<TrackId, TrackDef> = {
  coding: {
    id: 'coding',
    title: 'Coding & Software',
    blurb:
      'Build the skills to work on real flight systems. From Python and NumPy through to the production C++ that flies.',
    highlights: [
      'Python & Scientific Computing',
      'C++ / Systems Programming',
      'MATLAB & Simulink',
      'Linux, Git & Toolchains',
      'Real-World Projects',
    ],
    accent: 'var(--d-coding)',
  },
  foundations: {
    id: 'foundations',
    title: 'Foundations & Math',
    blurb:
      'Where it all starts. The mathematics and physics every later module leans on, built up from algebra and trigonometry to orbits.',
    highlights: [
      'Algebra, Trigonometry & Calculus',
      'Linear Algebra & Differential Equations',
      'Probability, Numerics & Optimization',
      'Classical & Rigid-Body Dynamics',
      'Frames, Attitude & Astrodynamics',
    ],
    accent: 'var(--d-foundations)',
  },
  gnc: {
    id: 'gnc',
    title: 'GNC Preparation',
    blurb:
      'The engineering core. Control theory, estimation, navigation and guidance, and the flight software that has to run them.',
    highlights: [
      'Control Theory & Stability',
      'Optimal, Robust & Nonlinear Control',
      'Estimation, Kalman & Navigation',
      'Guidance & Trajectory Optimization',
      'Flight Software & Simulation',
    ],
    accent: 'var(--d-gnc)',
  },
  career: {
    id: 'career',
    title: 'Career Readiness',
    blurb:
      'Stand out. Get noticed. Prepare for the interview loop, present your work to a panel, and build a portfolio that survives scrutiny.',
    highlights: [
      'Resume & Portfolio',
      'Interview Prep',
      'Technical Assessments',
      'Networking',
      'Company Culture & Values',
    ],
    accent: 'var(--d-career)',
  },
}

/** Dashboard order: the ladder as it is actually climbed — the mathematics
    first, then the tools, then the work itself, then the job. */
export const TRACK_ORDER: TrackId[] = ['foundations', 'coding', 'gnc', 'career']

export function trackDef(id: TrackId): TrackDef {
  return TRACKS[id]
}
