/* ============================================================================
   ORBIT — card thumbnails
   ----------------------------------------------------------------------------
   Each domain card carries a small plate on its right edge. In the reference
   these are photographs; here they are drawn, which buys three things: they
   scale to any density, they cost ~2KB each instead of ~200KB, and they can be
   tinted to the domain's accent without a second asset.

   Every plate is authored on a 200×184 grid and slotted into the card with
   `preserveAspectRatio="xMidYMid slice"`, so it crops rather than distorts.
   ========================================================================== */
import { useId } from 'react'
import type { ReactNode } from 'react'
import { range, seeded } from './rng'

const W = 200
const H = 184

interface ThumbProps {
  className?: string
}

/* ── Coding & Software ───────────────────────────────────────────────────────
   An editor mid-edit: gutter, folded blocks, a selection, a caret. The "code"
   is abstract bars rather than glyphs, because at 150px wide real text is
   illegible noise while bars read instantly as code. */
export function CodeThumb({ className }: ThumbProps) {
  const uid = useId().replace(/:/g, '')
  const id = (k: string) => `${k}-${uid}`
  const rnd = seeded('thumb-code')

  const PALETTE = ['#4d9bff', '#6fd6ff', '#a78bfa', '#5f7fb3', '#8ea6c8', '#c084fc']
  const lines = Array.from({ length: 20 }, (_, i) => {
    const indent = [0, 0, 1, 1, 2, 2, 1, 0][Math.floor(rnd() * 8)] ?? 0
    const tokens: { w: number; c: string; o: number }[] = []
    let used = indent * 9
    const n = 2 + Math.floor(rnd() * 3)
    for (let t = 0; t < n; t++) {
      const w = range(rnd, 9, 36)
      if (used + w > 116) break
      tokens.push({
        w,
        c: PALETTE[Math.floor(rnd() * PALETTE.length)]!,
        o: range(rnd, 0.45, 1),
      })
      used += w + 5
    }
    return { y: 13 + i * 8.4, indent, tokens, blank: i === 5 || i === 13 }
  })

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#061020" />
          <stop offset="100%" stopColor="#02060e" />
        </linearGradient>
        <radialGradient id={id('vig')} cx="0.28" cy="0.18" r="0.95">
          <stop offset="0%" stopColor="#173966" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* a screen photographed off-axis falls away at the far edge */}
        <linearGradient id={id('fall')} x1="0.45" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="#000208" stopOpacity="0" />
          <stop offset="100%" stopColor="#000208" stopOpacity="0.55" />
        </linearGradient>
        <filter id={id('glow')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#${id('bg')})`} />
      <rect width={W} height={H} fill={`url(#${id('vig')})`} />

      {/* title bar */}
      <rect width={W} height="9" fill="#08101e" />
      <circle cx="7" cy="4.5" r="1.6" fill="#8d4a4a" opacity="0.5" />
      <circle cx="13" cy="4.5" r="1.6" fill="#8a7448" opacity="0.5" />
      <circle cx="19" cy="4.5" r="1.6" fill="#3f7a62" opacity="0.5" />
      <rect x="40" y="2.6" width="34" height="3.8" rx="1.9" fill="#1b2740" />

      {/* activity rail, then the line-number gutter — the two vertical bands
          on the left are most of what makes a screenshot read as an editor */}
      <rect x="0" y="9" width="11" height={H - 9} fill="#040a14" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={`a${i}`} cx="5.5" cy={22 + i * 17} r="2.4" fill="none" stroke="#1c3355" strokeWidth="1" />
      ))}
      <rect x="11" y="9" width="17" height={H - 9} fill="#060d18" />
      <line x1="28" x2="28" y1="9" y2={H} stroke="#0d1b2e" strokeWidth="0.8" />
      {lines.map((l, i) => (
        <rect key={`g${i}`} x="17" y={l.y} width="7" height="2.2" rx="1.1" fill="#1c2b45" />
      ))}

      {/* active-line highlight + caret */}
      <rect x="28" y={lines[8]!.y - 2.4} width={W - 28} height="7.4" fill="#4d9bff" opacity="0.07" />
      <rect x={34 + lines[8]!.indent * 9 + 58} y={lines[8]!.y - 2} width="1.4" height="6.4" fill="#7dd3fc">
        <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />
      </rect>

      {/* code */}
      {lines.map((l, i) =>
        l.blank ? null : (
          <g key={i}>
            {l.tokens.reduce<{ nodes: ReactNode[]; x: number }>(
              (acc, t, k) => {
                acc.nodes.push(
                  <rect
                    key={k}
                    x={acc.x}
                    y={l.y}
                    width={t.w}
                    height="2.6"
                    rx="1.3"
                    fill={t.c}
                    opacity={t.o * 0.78}
                  />,
                )
                acc.x += t.w + 5
                return acc
              },
              { nodes: [], x: 34 + l.indent * 9 },
            ).nodes}
          </g>
        ),
      )}

      {/* a soft bloom over the brightest region, as a screen would have */}
      <ellipse cx="62" cy="88" rx="54" ry="42" fill="#4d9bff" opacity="0.1" filter={`url(#${id('glow')})`} />
      <rect width={W} height={H} fill={`url(#${id('fall')})`} />
    </svg>
  )
}

/* ── Foundations & Math ──────────────────────────────────────────────────────
   A conic section on a coordinate grid: the ellipse, its focus, the radius
   vector to a body on it and the velocity tangent. It is the one picture that
   is simultaneously geometry, calculus and astrodynamics, which is exactly the
   span of this track. */
export function ConicThumb({ className }: ThumbProps) {
  const uid = useId().replace(/:/g, '')
  const id = (k: string) => `${k}-${uid}`

  /* Ellipse in its own frame, then tilted as a whole — drawing it tilted by
     hand means recomputing every point for no gain. */
  const cx = 104
  const cy = 94
  const rx = 72
  const ry = 45
  const c = Math.sqrt(rx * rx - ry * ry) // focal distance
  const fx = cx - c
  const t = (80 * Math.PI) / 180 // true position on the ellipse
  const px = cx + rx * Math.cos(t)
  const py = cy + ry * Math.sin(t)
  const vlen = Math.hypot(-rx * Math.sin(t), ry * Math.cos(t))
  const vx = (-rx * Math.sin(t) / vlen) * 27
  const vy = (ry * Math.cos(t) / vlen) * 27
  const ang = Math.atan2(py - cy, px - fx)
  const arcR = 23

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#06101f" />
          <stop offset="100%" stopColor="#02070f" />
        </linearGradient>
        <radialGradient id={id('vig')} cx="0.32" cy="0.34" r="0.85">
          <stop offset="0%" stopColor="#0f3b4f" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={id('soft')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <marker
          id={id('tip')}
          markerWidth="7"
          markerHeight="7"
          refX="5.4"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 z" fill="#7dd3fc" />
        </marker>
      </defs>

      <rect width={W} height={H} fill={`url(#${id('bg')})`} />
      <rect width={W} height={H} fill={`url(#${id('vig')})`} />

      {/* graph paper */}
      <g stroke="#0c1c2e" strokeWidth="0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`v${i}`} x1={i * 20} x2={i * 20} y1="0" y2={H} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1="0" x2={W} y1={i * 20} y2={i * 20} />
        ))}
      </g>

      <g transform={`rotate(-11 ${cx} ${cy})`}>
        {/* axes through the centre of the conic */}
        <g stroke="#17334f" strokeWidth="0.8">
          <line x1={cx - rx - 16} x2={cx + rx + 14} y1={cy} y2={cy} />
          <line x1={cx} x2={cx} y1={cy - ry - 18} y2={cy + ry + 18} />
        </g>

        {/* the conic itself */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="3"
          opacity="0.3"
          filter={`url(#${id('soft')})`}
        />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#67e8f9" strokeWidth="1.2" />

        {/* semi-major and semi-minor, dashed: where a and b actually live */}
        <g stroke="#2a6e86" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.8">
          <line x1={cx} x2={cx + rx} y1={cy} y2={cy} />
          <line x1={cx} x2={cx} y1={cy} y2={cy - ry} />
        </g>

        {/* the occupied focus, and the true-anomaly arc measured from it */}
        <path
          d={`M ${fx + arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${(fx + arcR * Math.cos(ang)).toFixed(2)} ${(cy + arcR * Math.sin(ang)).toFixed(2)}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="0.9"
          opacity="0.75"
        />
        <line x1={fx} y1={cy} x2={px} y2={py} stroke="#9ec9f7" strokeWidth="1" opacity="0.85" />
        <circle cx={fx} cy={cy} r="3.4" fill="#0a1a2c" stroke="#7dd3fc" strokeWidth="1.2" />

        {/* the body, and its velocity along the tangent */}
        <line
          x1={px}
          y1={py}
          x2={px + vx}
          y2={py + vy}
          stroke="#7dd3fc"
          strokeWidth="1.3"
          markerEnd={`url(#${id('tip')})`}
        />
        <circle cx={px} cy={py} r="6" fill="#67e8f9" opacity="0.25" filter={`url(#${id('soft')})`} />
        <circle cx={px} cy={py} r="2.8" fill="#e0f7ff" />
      </g>

      {/* a couple of set lines of mathematics, abstracted — at this size real
          glyphs are noise, but the rhythm of an equation still reads */}
      <g fill="#37627f" opacity="0.7">
        <rect x="12" y="16" width="16" height="2.4" rx="1.2" />
        <rect x="32" y="16" width="7" height="2.4" rx="1.2" opacity="0.7" />
        <rect x="43" y="16" width="24" height="2.4" rx="1.2" />
        <rect x="12" y="24" width="10" height="2.4" rx="1.2" opacity="0.7" />
        <rect x="26" y="24" width="19" height="2.4" rx="1.2" />
        <rect x="49" y="24" width="12" height="2.4" rx="1.2" opacity="0.55" />
      </g>
    </svg>
  )
}


/* ── GNC Preparation ─────────────────────────────────────────────────────────
   A powered-descent solution: the optimal trajectory arc, the vehicle on it
   under thrust, the landing ellipse with pad lights, and a thrust-cone hint.
   This is the picture of the thing the track actually teaches. */
export function DescentThumb({ className }: ThumbProps) {
  const uid = useId().replace(/:/g, '')
  const id = (k: string) => `${k}-${uid}`
  const rnd = seeded('thumb-descent')

  const stars = Array.from({ length: 34 }, () => ({
    x: range(rnd, 0, W),
    y: range(rnd, 0, 110),
    r: range(rnd, 0.3, 0.9),
    o: range(rnd, 0.2, 0.7),
  }))

  /* The trajectory: a cubic that comes in fast and flattens to vertical —
     the characteristic shape of a fuel-optimal powered descent. */
  const traj = 'M12 8 C60 42 92 78 112 116 C122 136 126 146 128 156'

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#050a16" />
          <stop offset="55%" stopColor="#0a1930" />
          <stop offset="100%" stopColor="#14283f" />
        </linearGradient>
        <linearGradient id={id('ground')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d2f42" />
          <stop offset="100%" stopColor="#070d16" />
        </linearGradient>
        <radialGradient id={id('pad')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#4d9bff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4d9bff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('plume')} cx="0.5" cy="0.1" r="0.85">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#9ec9ff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3f7fd8" stopOpacity="0" />
        </radialGradient>
        <filter id={id('b4')} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#${id('sky')})`} />
      <g fill="#dbe9ff">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>

      {/* range rings on the ground plane — the landing ellipse */}
      <g stroke="#3d6da8" fill="none" opacity="0.5">
        <ellipse cx="128" cy="162" rx="46" ry="11" strokeWidth="0.7" strokeDasharray="4 4" />
        <ellipse cx="128" cy="162" rx="26" ry="6.4" strokeWidth="0.8" />
      </g>
      <ellipse cx="128" cy="162" rx="54" ry="16" fill={`url(#${id('pad')})`} />

      {/* terrain */}
      <path d={`M0 ${H} L0 150 C40 144 66 154 96 152 C134 150 162 142 ${W} 148 L${W} ${H} Z`} fill={`url(#${id('ground')})`} />

      {/* pad lights */}
      <g fill="#7dd3fc">
        {[104, 116, 128, 140, 152].map((px, i) => (
          <circle key={i} cx={px} cy={162 - Math.abs(px - 128) * 0.06} r="1.1">
            <animate
              attributeName="opacity"
              values="0.35;1;0.35"
              dur="1.8s"
              begin={`${i * 0.24}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>

      {/* trajectory: a faint solved path plus a bright travelled section */}
      <path d={traj} fill="none" stroke="#4d9bff" strokeWidth="1" opacity="0.25" strokeDasharray="3 4" />
      <path
        d={traj}
        fill="none"
        stroke="#9ecdff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="210"
        strokeDashoffset="128"
        opacity="0.8"
      />

      {/* state knots along the path */}
      <g fill="#4d9bff">
        <circle cx="12" cy="8" r="1.6" opacity="0.55" />
        <circle cx="66" cy="49" r="1.6" opacity="0.7" />
        <circle cx="104" cy="101" r="1.6" opacity="0.85" />
      </g>

      {/* vehicle on the solution, canted into its thrust vector */}
      <g transform="translate(118 122) rotate(11)">
        <g filter={`url(#${id('b4')})`}>
          <ellipse cx="0" cy="22" rx="7" ry="19" fill={`url(#${id('plume')})`} />
        </g>
        <ellipse cx="0" cy="16" rx="2.6" ry="8.5" fill={`url(#${id('plume')})`} />
        <path d="M0 -15 C2.6 -11 4 -6 4 -2 L4 9 L-4 9 L-4 -2 C-4 -6 -2.6 -11 0 -15 Z" fill="#c3d6ef" />
        <path d="M0 -15 C-2.6 -11 -4 -6 -4 -2 L-4 9 L0 9 Z" fill="#46566e" />
        <path d="M-4 5 L-8.5 11 L-8.5 14 L-4 11 Z" fill="#2b3a4f" />
        <path d="M4 5 L8.5 11 L8.5 14 L4 11 Z" fill="#6d829e" />
      </g>

      {/* thrust-vector annotation */}
      <g stroke="#7dd3fc" opacity="0.5">
        <path d="M118 132 L126 156" strokeWidth="0.8" strokeDasharray="2 3" />
        <path d="M118 132 L118 158" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.6" />
      </g>
    </svg>
  )
}

/* ── Career Readiness ────────────────────────────────────────────────────────
   A high bay at dusk: the building mass, lit window grid, a vehicle standing
   inside the doorway, cranes and a gantry. Warm interior against a cold sky —
   the one place in the product where a warm colour appears at scale. */
export function HighBayThumb({ className }: ThumbProps) {
  const uid = useId().replace(/:/g, '')
  const id = (k: string) => `${k}-${uid}`
  const rnd = seeded('thumb-highbay-3')

  const windows: { x: number; y: number; w: number; h: number; o: number }[] = []
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 9; c++) {
      if (rnd() < 0.24) continue
      windows.push({ x: 18 + c * 9.4, y: 74 + r * 9.6, w: 6.2, h: 6, o: range(rnd, 0.25, 0.95) })
    }
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('dusk')} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#060b18" />
          <stop offset="48%" stopColor="#0d1e35" />
          <stop offset="76%" stopColor="#1d3550" />
          <stop offset="100%" stopColor="#3a5470" />
        </linearGradient>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="#141d2c" />
          <stop offset="60%" stopColor="#1b2738" />
          <stop offset="100%" stopColor="#0e1522" />
        </linearGradient>
        <radialGradient id={id('door')} cx="0.5" cy="0.9" r="0.9">
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#f0a848" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#c8762a" stopOpacity="0" />
        </radialGradient>
        <filter id={id('b5')} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#${id('dusk')})`} />

      {/* horizon haze */}
      <rect y="120" width={W} height="26" fill="#6d8aa8" opacity="0.14" filter={`url(#${id('b5')})`} />

      {/* distant gantry */}
      <g stroke="#1b2738" strokeWidth="1.1" opacity="0.7">
        <path d="M176 60 V150 M188 66 V150 M176 76 H188 M176 96 H188 M176 116 H188" stroke="#1b2738" />
        <path d="M176 60 L188 66" stroke="#1b2738" />
      </g>

      {/* the high bay */}
      <path d="M8 152 V62 L104 46 V152 Z" fill={`url(#${id('wall')})`} />
      <path d="M8 62 L104 46 L104 52 L8 68 Z" fill="#26364d" opacity="0.7" />

      {/* lit windows */}
      <g fill="#ffd9a0">
        {windows.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} opacity={w.o * 0.5} rx="0.6" />
        ))}
      </g>

      {/* open door with a vehicle standing inside */}
      <rect x="112" y="84" width="34" height="68" fill="#07101c" />
      <rect x="112" y="84" width="34" height="68" fill={`url(#${id('door')})`} />
      <g filter={`url(#${id('b5')})`}>
        <ellipse cx="129" cy="150" rx="30" ry="14" fill="#f0a848" opacity="0.35" />
      </g>
      <path
        d="M129 92 C132.4 97 134 103 134 109 V150 H124 V109 C124 103 125.6 97 129 92 Z"
        fill="#0b1320"
        opacity="0.92"
      />
      <path d="M133 96 V150" stroke="#ffe3b8" strokeWidth="0.9" opacity="0.55" />

      {/* ground + reflections */}
      <rect y="150" width={W} height={H - 150} fill="#060c15" />
      <g opacity="0.2" fill="#ffd9a0">
        <rect x="112" y="152" width="34" height="14" />
      </g>

      {/* crane arm across the sky */}
      <g stroke="#243550" strokeWidth="1.4" fill="none" opacity="0.85">
        <path d="M150 36 H196" />
        <path d="M158 36 V46" />
        <path d="M150 36 L156 26 L196 36" strokeWidth="0.9" opacity="0.6" />
      </g>
      <circle cx="158" cy="47" r="1.6" fill="#f4614e" opacity="0.8">
        <animate attributeName="opacity" values="0.15;0.9;0.15" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

/* ── Quote-card plate ────────────────────────────────────────────────────────
   A planet edge low in frame with a star field above. Two variants so the two
   quote cards on the home page do not look duplicated. `tone` shifts the body
   hue; `flip` mirrors the limb. */
export function PlanetPlate({
  className,
  tone = 'blue',
  flip = false,
  seed = 'plate-a',
}: ThumbProps & { tone?: 'blue' | 'violet'; flip?: boolean; seed?: string }) {
  const uid = useId().replace(/:/g, '')
  const id = (k: string) => `${k}-${uid}`
  const rnd = seeded(seed)

  const stars = Array.from({ length: 72 }, () => ({
    x: range(rnd, 0, 400),
    y: range(rnd, 0, 200),
    r: range(rnd, 0.35, 1.05),
    o: range(rnd, 0.2, 0.8),
  }))

  const body = tone === 'violet' ? ['#3a2f6b', '#1d1840', '#0b0a1c'] : ['#1d4a78', '#0d2440', '#050d1a']
  const rim = tone === 'violet' ? '#b39dff' : '#8fc9ff'

  return (
    <svg
      className={className}
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#03050c" />
          <stop offset="100%" stopColor="#060c18" />
        </linearGradient>
        <radialGradient id={id('body')} cx="0.68" cy="0.1" r="0.9">
          <stop offset="0%" stopColor={body[0]} />
          <stop offset="45%" stopColor={body[1]} />
          <stop offset="100%" stopColor={body[2]} />
        </radialGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={rim} stopOpacity="0" />
          <stop offset="45%" stopColor={rim} stopOpacity="0.75" />
          <stop offset="72%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor={rim} stopOpacity="0.15" />
        </linearGradient>
        <filter id={id('b14')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={id('b3')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width="400" height="260" fill={`url(#${id('sky')})`} />
      <g fill="#dce9ff">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>

      {/* limb */}
      <circle
        cx="230"
        cy="560"
        r="372"
        fill="none"
        stroke={`url(#${id('rim')})`}
        strokeWidth="34"
        opacity="0.4"
        filter={`url(#${id('b14')})`}
      />
      <circle
        cx="230"
        cy="560"
        r="372"
        fill="none"
        stroke={`url(#${id('rim')})`}
        strokeWidth="2.6"
        filter={`url(#${id('b3')})`}
      />
      <circle cx="230" cy="560" r="371" fill={`url(#${id('body')})`} />

      {/* A second, far smaller body for scale — kept to the right of frame,
          clear of the quote text that sits over the left of this plate. */}
      <circle cx="340" cy="52" r="13" fill="#10182a" />
      <circle cx="340" cy="52" r="13" fill="none" stroke={rim} strokeWidth="0.8" opacity="0.35" />
      <circle cx="336" cy="48" r="3" fill="#0a1120" opacity="0.75" />
    </svg>
  )
}
