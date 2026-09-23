/* ============================================================================
   ORBIT — icon set
   ----------------------------------------------------------------------------
   Hand-drawn on a 24×24 grid with a 1.7 stroke, round caps and round joins, so
   every glyph in the product shares one optical weight. Nothing here is
   imported from an icon library: at the sizes this UI uses (14–26px) a
   general-purpose set goes muddy, and the aerospace glyphs (thrust vector,
   orbit, gimbal) do not exist in one anyway.
   ========================================================================== */
import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ── Navigation ──────────────────────────────────────────────────────────── */

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.2 10.4 12 3.5l8.8 6.9V20a1 1 0 0 1-1 1h-4.6v-6.2H8.8V21H4.2a1 1 0 0 1-1-1z" />
  </Svg>
)

export const IconBook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.6C10.4 5.2 8.3 4.5 5.6 4.5A1.6 1.6 0 0 0 4 6.1v10.6a1.6 1.6 0 0 0 1.6 1.6c2.7 0 4.8.7 6.4 2.1" />
    <path d="M12 6.6c1.6-1.4 3.7-2.1 6.4-2.1A1.6 1.6 0 0 1 20 6.1v10.6a1.6 1.6 0 0 1-1.6 1.6c-2.7 0-4.8.7-6.4 2.1" />
    <path d="M12 6.6v13.8" />
  </Svg>
)

export const IconCode = (p: IconProps) => (
  <Svg {...p}>
    <path d="m8.4 8-4.6 4 4.6 4" />
    <path d="m15.6 8 4.6 4-4.6 4" />
    <path d="m13.4 5-2.8 14" />
  </Svg>
)

export const IconTrend = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 17.2 9 11.6l3.4 3.4 5.3-5.6" />
    <path d="M14.3 9.2h4.2v4.2" />
    <path d="M3.5 20.6h17" />
  </Svg>
)

/** Crosshair / reticle — the GNC mark. */
export const IconTarget = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="7.6" />
    <circle cx="12" cy="12" r="2.1" />
    <path d="M12 1.9v3.1M12 19v3.1M22.1 12H19M5 12H1.9" />
  </Svg>
)

export const IconBriefcase = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="7.4" width="18.4" height="12.4" rx="2" />
    <path d="M8.6 7.4V5.6a1.8 1.8 0 0 1 1.8-1.8h3.2a1.8 1.8 0 0 1 1.8 1.8v1.8" />
    <path d="M2.8 12.4h18.4" />
    <path d="M10.4 12.4h3.2" />
  </Svg>
)

export const IconBars = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.4 20.4v-6.6" />
    <path d="M12 20.4V6" />
    <path d="M18.6 20.4v-9.8" />
  </Svg>
)

export const IconDoc = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3.2H7.2a1.8 1.8 0 0 0-1.8 1.8v14a1.8 1.8 0 0 0 1.8 1.8h9.6a1.8 1.8 0 0 0 1.8-1.8V7.8z" />
    <path d="M14 3.2v4.6h4.6" />
    <path d="M8.8 12.6h6.4M8.8 16.2h6.4M8.8 9h2.2" />
  </Svg>
)

export const IconGear = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.2 14.6a1.5 1.5 0 0 0 .3 1.66l.05.06a1.83 1.83 0 1 1-2.6 2.6l-.05-.06a1.5 1.5 0 0 0-1.66-.3 1.5 1.5 0 0 0-.9 1.37v.17a1.83 1.83 0 1 1-3.66 0v-.09a1.5 1.5 0 0 0-1-1.37 1.5 1.5 0 0 0-1.65.3l-.06.06a1.83 1.83 0 1 1-2.6-2.6l.06-.06a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.91h-.17a1.83 1.83 0 1 1 0-3.66h.09a1.5 1.5 0 0 0 1.37-1 1.5 1.5 0 0 0-.3-1.65l-.06-.06a1.83 1.83 0 1 1 2.6-2.6l.06.06a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .91-1.37v-.17a1.83 1.83 0 1 1 3.66 0v.09a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.66-.3l.06-.06a1.83 1.83 0 1 1 2.6 2.6l-.06.06a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.91h.17a1.83 1.83 0 1 1 0 3.66h-.09a1.5 1.5 0 0 0-1.37.9z" />
  </Svg>
)

/* ── Structure & chrome ──────────────────────────────────────────────────── */

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2" />
    <path d="M3.4 10h17.2" />
    <path d="M8.2 3.4v3.6M15.8 3.4v3.6" />
  </Svg>
)

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Svg>
)

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5.5 9.5 6.5 6.5 6.5-6.5" />
  </Svg>
)

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Svg>
)

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.2 12h15.6" />
    <path d="m13.6 5.8 6.2 6.2-6.2 6.2" />
  </Svg>
)

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.4" r="3.9" />
    <path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" />
  </Svg>
)

export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.4 9.6a5.6 5.6 0 0 1 11.2 0c0 4 1.4 5.6 1.4 5.6H5s1.4-1.6 1.4-5.6Z" />
    <path d="M10.2 18.6a2 2 0 0 0 3.6 0" />
  </Svg>
)

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.6 6.6h16.8M3.6 12h16.8M3.6 17.4h16.8" />
  </Svg>
)

export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.8" cy="10.8" r="6.6" />
    <path d="m15.7 15.7 4.1 4.1" />
  </Svg>
)

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4.8 12.4 4.8 4.8L19.2 7.4" />
  </Svg>
)

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.6v14.8M4.6 12h14.8" />
  </Svg>
)

export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.6" y="10.4" width="14.8" height="10" rx="2" />
    <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" />
  </Svg>
)

export const IconFlame = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.6s.9 3 3 5.2c2 2.1 3.4 3.7 3.4 6.4a6.4 6.4 0 1 1-12.8 0c0-1.7.6-3 1.6-4.2.3 1 1 1.9 2 2.3-.3-2.9.8-6.6 2.8-9.7" />
  </Svg>
)

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 6.8V12l3.4 2" />
  </Svg>
)

export const IconPlay = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.4 4.8 19 12 7.4 19.2z" />
  </Svg>
)

export const IconRefresh = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 11.2a8 8 0 1 0-.6 4.4" />
    <path d="M20.4 5.4v5.8h-5.8" />
  </Svg>
)

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.6v11.2" />
    <path d="m7.4 10.4 4.6 4.4 4.6-4.4" />
    <path d="M4.4 19.6h15.2" />
  </Svg>
)

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15.2V4" />
    <path d="m7.4 8.4 4.6-4.4 4.6 4.4" />
    <path d="M4.4 19.6h15.2" />
  </Svg>
)

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.4 6.6h15.2" />
    <path d="M9.2 6.6V4.8a1.4 1.4 0 0 1 1.4-1.4h2.8a1.4 1.4 0 0 1 1.4 1.4v1.8" />
    <path d="M6.4 6.6 7.3 19a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5l.9-12.4" />
  </Svg>
)

export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 11.2v5M12 7.8v.4" />
  </Svg>
)

export const IconBulb = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.4 17.6a5.8 5.8 0 1 1 5.2 0v1.9a1.4 1.4 0 0 1-1.4 1.4h-2.4a1.4 1.4 0 0 1-1.4-1.4z" />
    <path d="M9.6 18.6h4.8" />
  </Svg>
)

export const IconLink = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.2 13.8a3.6 3.6 0 0 0 5.4.4l2.8-2.8a3.6 3.6 0 0 0-5.1-5.1L11.7 8" />
    <path d="M13.8 10.2a3.6 3.6 0 0 0-5.4-.4l-2.8 2.8a3.6 3.6 0 0 0 5.1 5.1L12.3 16" />
  </Svg>
)

export const IconQuote = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.4 6.6c-2.8 1-4.6 3.6-4.6 6.9v3.9h5.2v-5.2H7.6c0-2 .8-3.4 2.6-4.2z" />
    <path d="M18.6 6.6c-2.8 1-4.6 3.6-4.6 6.9v3.9h5.2v-5.2h-2.4c0-2 .8-3.4 2.6-4.2z" />
  </Svg>
)

/* ── Domain / tool glyphs ────────────────────────────────────────────────── */

/** Terminal — the code playground. */
export const IconTerminal = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="4.4" width="18.4" height="15.2" rx="2" />
    <path d="m7 10.2 2.6 2.4L7 15" />
    <path d="M12.6 15.4h4.4" />
  </Svg>
)

/** Nested rings — an orbital path around a body. */
export const IconOrbit = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <ellipse cx="12" cy="12" rx="9.4" ry="4.4" transform="rotate(-28 12 12)" />
    <circle cx="19.1" cy="8.2" r="1.5" />
  </Svg>
)

/** A vehicle with a thrust vector off the centreline — control authority. */
export const IconThrust = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8c2.6 2.5 4 5.7 4 9.2v3.4H8V12c0-3.5 1.4-6.7 4-9.2z" />
    <path d="M8 13.6 5.2 16v3.2L8 17.4M16 13.6 18.8 16v3.2L16 17.4" />
    <path d="M12 18.6v2.8" />
  </Svg>
)

/** Signal / telemetry downlink. */
export const IconSignal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 18.6v.1" />
    <path d="M8.6 15.2a4.8 4.8 0 0 1 6.8 0" />
    <path d="M5.4 11.9a9.4 9.4 0 0 1 13.2 0" />
    <path d="M2.4 8.6a13.9 13.9 0 0 1 19.2 0" />
  </Svg>
)

/** Sigma — the mathematics track. */
export const IconSigma = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17.6 4.6H6.4l6 7.4-6 7.4h11.2" />
  </Svg>
)

/** Waveform — signals, filtering, estimation. */
export const IconWave = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.4 12h2.4l2.4-6.6L11.4 18l2.6-9 2.2 5.4h5.4" />
  </Svg>
)

/** Database cylinder — SQL. */
export const IconDatabase = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="6.2" rx="7.6" ry="3.2" />
    <path d="M4.4 6.2v11.6c0 1.8 3.4 3.2 7.6 3.2s7.6-1.4 7.6-3.2V6.2" />
    <path d="M4.4 12c0 1.8 3.4 3.2 7.6 3.2s7.6-1.4 7.6-3.2" />
  </Svg>
)

/** Drafting compass — CAD. */
export const IconCompass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="4.6" r="1.8" />
    <path d="m11 6.2-5.4 13.6M13 6.2l5.4 13.6" />
    <path d="M8.9 14.4a7 7 0 0 0 6.2 0" />
  </Svg>
)

/** Interlocking blocks — Simulink / model-based design. */
export const IconBlocks = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="7" width="6.4" height="5.4" rx="1.2" />
    <rect x="14.8" y="11.6" width="6.4" height="5.4" rx="1.2" />
    <path d="M9.2 9.7h2.6a1.6 1.6 0 0 1 1.6 1.6v1.4a1.6 1.6 0 0 0 1.6 1.6h.8" />
  </Svg>
)

/** Brain / recall — the review engine. */
export const IconRecall = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.4 4.4a3.2 3.2 0 0 0-3.2 3.2 3 3 0 0 0-1.8 5.4 3.2 3.2 0 0 0 1.4 5.2 3.2 3.2 0 0 0 6.2-1V6.6a2.2 2.2 0 0 0-2.6-2.2z" />
    <path d="M14.6 4.4a3.2 3.2 0 0 1 3.2 3.2 3 3 0 0 1 1.8 5.4 3.2 3.2 0 0 1-1.4 5.2 3.2 3.2 0 0 1-6.2-1" />
  </Svg>
)

/** Dumbbell — the conditioning track. */
export const IconDumbbell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 9.4v5.2M6 7.4v9.2M18 7.4v9.2M21 9.4v5.2" />
    <path d="M6 12h12" />
  </Svg>
)

/** Fork — a branch in a plan, used for path/route affordances. */
export const IconRoute = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6.2" cy="5.8" r="2.4" />
    <circle cx="6.2" cy="18.2" r="2.4" />
    <circle cx="17.8" cy="12" r="2.4" />
    <path d="M6.2 8.2v7.6" />
    <path d="M8.6 5.8h4a3.2 3.2 0 0 1 3.2 3.2v.8" />
  </Svg>
)

export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3.2 8.6 4.4L12 12 3.4 7.6z" />
    <path d="m3.4 12.2 8.6 4.4 8.6-4.4" />
    <path d="m3.4 16.6 8.6 4.4 8.6-4.4" />
  </Svg>
)

export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8 4.6 6v6c0 4.6 3.1 8.2 7.4 9.2 4.3-1 7.4-4.6 7.4-9.2V6z" />
    <path d="m8.8 12 2.2 2.2 4.2-4.4" />
  </Svg>
)

export const IconGrid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.4" y="3.4" width="7" height="7" rx="1.4" />
    <rect x="13.6" y="3.4" width="7" height="7" rx="1.4" />
    <rect x="3.4" y="13.6" width="7" height="7" rx="1.4" />
    <rect x="13.6" y="13.6" width="7" height="7" rx="1.4" />
  </Svg>
)

export const IconPause = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 5v14M15 5v14" />
  </Svg>
)

export const IconStar = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3.4 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.8l6.1-.9z" />
  </Svg>
)

export const IconWarn = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.6 3.9 2.5 17.6a1.6 1.6 0 0 0 1.4 2.4h16.2a1.6 1.6 0 0 0 1.4-2.4L13.4 3.9a1.6 1.6 0 0 0-2.8 0z" />
    <path d="M12 9v4M12 16.6v.1" />
  </Svg>
)

/* ── Brand marks ─────────────────────────────────────────────────────────────
   Drawn, not traced: a long flat wordmark whose X trails into a swoosh, which
   is the silhouette this layout is built around. */

export function Wordmark({ height = 16, ...rest }: SVGProps<SVGSVGElement> & { height?: number }) {
  return (
    <svg
      viewBox="0 0 260 30"
      height={height}
      fill="currentColor"
      role="img"
      aria-label="ORBIT"
      {...rest}
    >
      <g>
        {/* O R B I T — geometric, wide-tracked, flat-sided like a DIN cut. */}
        <path d="M14.6 2.2C6.9 2.2 1.6 7.6 1.6 15s5.3 12.8 13 12.8S27.7 22.4 27.7 15 22.3 2.2 14.6 2.2Zm0 4.9c4.5 0 7.6 3.2 7.6 7.9s-3.1 7.9-7.6 7.9S7 19.7 7 15s3.1-7.9 7.6-7.9Z" />
        <path d="M35.4 2.8v24.4h5.4v-8.6h4.9l5.2 8.6h6.2l-6-9.7c3.2-1.3 5-4 5-7.5 0-4.7-3.4-7.2-9.2-7.2Zm5.4 4.8h5.3c2.5 0 3.9 1 3.9 2.9s-1.4 3-3.9 3h-5.3Z" />
        <path d="M64.9 2.8v24.4h11.5c5.7 0 9-2.6 9-6.9 0-3-1.6-5-4.5-5.9 2.3-1 3.6-2.8 3.6-5.3 0-4-3.1-6.3-8.6-6.3Zm5.3 4.6h5c2.2 0 3.4.8 3.4 2.4s-1.2 2.5-3.4 2.5h-5Zm0 9.2h5.6c2.5 0 3.8 1 3.8 2.8s-1.3 2.9-3.8 2.9h-5.6Z" />
        <path d="M93.6 2.8h5.4v24.4h-5.4z" />
        <path d="M106.2 2.8v4.9h7.7v19.5h5.4V7.7h7.7V2.8Z" />
      </g>
      {/* The trailing swoosh: a crescent that leaves the T and rises away to the
          right, thick where it departs and tapering to nothing. It starts clear
          of the T's stem — overlapping the letterforms reads as a mistake at
          small sizes, where this mark spends most of its life. */}
      <path
        d="M131 8.4C179 7.2 227 4.8 263 0.9C227 6.4 179 9.9 131 11.4Z"
        opacity="0.95"
      />
    </svg>
  )
}

/**
 * The standalone mark — two strokes crossing at the centre, where the
 * ascending one carries on past the crossing and flattens into a long trail.
 * That asymmetry is the whole mark: a symmetric X is a letter, a swept one
 * reads as departure.
 */
export function Logomark({ size = 48, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg viewBox="0 0 120 56" width={size} fill="none" role="img" aria-label="ORBIT" {...rest}>
      {/* Descending stroke: top-left, through the crossing, down to the right.
          Control points lie along the stroke's own direction — pulling them
          horizontal instead flares all four tips and the mark reads as a
          bowtie rather than an X. */}
      <path
        d="M6 10C28 17 44 23 58 28C74 34 90 40 108 46"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Ascending stroke: bottom-left, through the same point, then out and up
          past its partner, flattening as it goes. This is the arm that flies
          off, and the asymmetry is the entire mark. */}
      <path
        d="M6 46C28 39 44 33 58 28C80 21 98 12 118 9"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
