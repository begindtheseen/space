/* ============================================================================
   ORBIT — the hero plate
   ----------------------------------------------------------------------------
   Earth's limb seen from low orbit just after sunrise, with a vehicle standing
   downrange against it. Drawn entirely in SVG: no photograph ships with this
   app, which keeps the bundle small, the licensing clean, and lets the scene
   respond to state — the vehicle rides a little higher as readiness climbs.

   The geometry is not invented. The limb in the reference layout fits a circle
   of radius 556 centred 708 below the top of the plate, with its apex at
   x = 1164 of the viewBox below; every arc here is struck on that circle, so
   the horizon crosses the frame exactly where the reference's does.

   Construction, back to front:
     1. deep-space gradient and two star magnitudes
     2. three stacked arcs for the atmosphere — a wide diffuse halo, a tighter
        scatter band, and a 2px specular rim. Stacking blurred strokes is what
        makes airglow read as depth rather than as a stroked circle.
     3. the planet body: a radial gradient with its focus at the sunrise point,
        falling away into the night side
     4. terrain mottling and clustered city lights, both clipped to the planet
     5. the sunrise glint where the vehicle meets the horizon
     6. the vehicle
     7. a scrim under the headline
   ========================================================================== */
import { useId } from 'react'
import { range, seeded } from './rng'

/* The viewBox is wider than any hero so the plate can be anchored to its right
   edge — that is where the limb's apex and the vehicle live. `xMaxYMax slice`
   keeps the horizon and the vehicle pinned and spends any extra width on empty
   sky to the left, which is exactly what the reference does. At a 1024px
   viewport the visible window is x 564..1400, one SVG unit to one pixel. */
const VW = 1400
const VH = 242

/* The limb circle, fitted to the reference by least squares over 93 sampled
   rim points: centre (806.5, 915.6) with R = 757.7 in the reference's own
   pixels, rms error 0.24px. Shifted right by 376 so the plate's left edge
   lands at x = 564, which is where a 1024px viewport starts reading it. */
const CX = 1182.5
const CY = 915.6
const R = 757.7

/** y of the limb at a given x, or null where the circle does not reach. */
function limbY(x: number): number | null {
  const dx = x - CX
  const inner = R * R - dx * dx
  if (inner <= 0) return null
  return CY - Math.sqrt(inner)
}

/* Where the vehicle stands. */
const SHIP_X = 1281
const SHIP_HW = 12

export function EarthLimb({
  /** 0–1. Drives how high the vehicle has climbed off the limb. */
  progress = 0.34,
  className,
}: {
  progress?: number
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const id = (k: string) => `${k}-${uid}`
  const rnd = seeded('orbit-hero-v2')

  /* ── Star field ────────────────────────────────────────────────────────────
     Two passes. Dim stars are plentiful and flat; bright stars are few and get
     a cross-flare. Real skies have that distribution, and a uniform field
     immediately reads as dust on a lens. Both are kept above the limb — a star
     inside the planet is the kind of mistake nobody can unsee. */
  const dim = Array.from({ length: 120 }, () => {
    const x = range(rnd, 0, VW)
    const ceiling = limbY(x) ?? VH
    return {
      x,
      y: range(rnd, 0, Math.max(10, ceiling - 6)),
      r: range(rnd, 0.25, 0.75),
      o: range(rnd, 0.1, 0.42),
    }
  })
  const bright = Array.from({ length: 8 }, () => {
    const x = range(rnd, 0, VW)
    const ceiling = limbY(x) ?? VH
    return {
      x,
      y: range(rnd, 0, Math.max(10, ceiling - 24)),
      r: range(rnd, 0.8, 1.3),
      o: range(rnd, 0.4, 0.75),
    }
  })

  /* ── City lights ───────────────────────────────────────────────────────────
     Clustered, never uniform: a handful of seed points along the surface, a
     scatter of lights around each. They only appear on the night side, which
     here means left of the sunrise point. */
  const cities: { x: number; y: number; r: number; o: number }[] = []
  for (let c = 0; c < 20; c++) {
    const cx = range(rnd, 830, 1400)
    const surf = limbY(cx)
    if (surf == null) continue
    const depth = range(rnd, 6, 38)
    for (let k = 0; k < Math.floor(range(rnd, 4, 11)); k++) {
      cities.push({
        x: cx + range(rnd, -40, 40),
        y: surf + depth + range(rnd, -7, 14),
        r: range(rnd, 0.35, 0.95),
        o: range(rnd, 0.25, 0.9),
      })
    }
  }

  /* The nose rises with readiness, but only a little — the plate is cropped to
     the container's aspect and a taller climb clips it. */
  const noseY = 66 - progress * 16
  const flapTop = noseY + 22
  const glintY = limbY(SHIP_X) ?? 165

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('space')} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#000208" />
          <stop offset="60%" stopColor="#00040d" />
          <stop offset="100%" stopColor="#010a18" />
        </linearGradient>

        {/* Surface. Struck as a radial on the planet's own centre so the lit
            band hugs the limb rather than radiating from a point inside the
            frame — 10px below the horizon the reference reads #4272a9, 40px
            below it is already #051a33, and that falloff is the whole effect. */}
        <radialGradient
          id={id('surf')}
          gradientUnits="userSpaceOnUse"
          cx={CX}
          cy={CY}
          r={R}
        >
          <stop offset="0%" stopColor="#01060f" />
          <stop offset="85%" stopColor="#010c1c" />
          <stop offset="91.6%" stopColor="#02132a" />
          <stop offset="94.7%" stopColor="#051a33" />
          <stop offset="96%" stopColor="#254062" />
          <stop offset="97.4%" stopColor="#3e5077" />
          <stop offset="98.7%" stopColor="#4272a9" />
          <stop offset="100%" stopColor="#cfe4f9" />
        </radialGradient>

        {/* Night-side wash, drawn over the surface from the left. Struck in
            user space so the terminator lands at a fixed downrange point
            rather than at a fraction of the planet's bounding box — the lit
            band has to reach x 880 or the globe stops reading as a globe. */}
        <linearGradient
          id={id('term')}
          gradientUnits="userSpaceOnUse"
          x1={780}
          y1="0"
          x2={1340}
          y2="60"
        >
          <stop offset="0%" stopColor="#000208" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#000208" stopOpacity="0.52" />
          <stop offset="62%" stopColor="#000208" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#000208" stopOpacity="0" />
        </linearGradient>

        {/* A thin haze above the horizon: scattering does not stop at the rim,
            and without it the sky meets the planet like a cut edge. */}
        <linearGradient
          id={id('haze')}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={92}
          x2="0"
          y2={200}
        >
          <stop offset="0%" stopColor="#1d4f86" stopOpacity="0" />
          <stop offset="100%" stopColor="#3c82c8" stopOpacity="0.2" />
        </linearGradient>

        {/* Airglow along the limb — brightest where the sun is coming round,
            falling to nothing at both ends so the arc has no visible start. */}
        {/* Both struck in user space: the airglow peaks between x 1060 and
            1230, which is where the reference's rim tops out at 236/255, and
            it has to fall to nothing before either end of the arc or the
            stroke announces where it started. */}
        <linearGradient
          id={id('rim')}
          gradientUnits="userSpaceOnUse"
          x1={820}
          y1="0"
          x2={1420}
          y2="0"
        >
          <stop offset="0%" stopColor="#5f9fe4" stopOpacity="0" />
          <stop offset="16%" stopColor="#9cc8ef" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="68%" stopColor="#f2f8ff" stopOpacity="0.98" />
          <stop offset="86%" stopColor="#cfe4f9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6ba4de" stopOpacity="0.45" />
        </linearGradient>

        <linearGradient
          id={id('halo')}
          gradientUnits="userSpaceOnUse"
          x1={820}
          y1="0"
          x2={1420}
          y2="0"
        >
          <stop offset="0%" stopColor="#2b6bb4" stopOpacity="0" />
          <stop offset="34%" stopColor="#4b93da" stopOpacity="0.42" />
          <stop offset="62%" stopColor="#7cbaef" stopOpacity="0.46" />
          <stop offset="100%" stopColor="#2f77c0" stopOpacity="0.14" />
        </linearGradient>

        {/* The vehicle's skin: stainless, so it is a hard specular band rather
            than a soft shade — dark at both edges, hot down the near side. */}
        {/* Stainless against a black sky is almost entirely dark: in the
            reference the hull sits at #020e1c and every bit of the light is in
            one 3px specular line a third of the way across it. */}
        <linearGradient id={id('hull')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0a1524" />
          <stop offset="18%" stopColor="#1a2a41" />
          <stop offset="30%" stopColor="#233450" />
          <stop offset="44%" stopColor="#030f1e" />
          <stop offset="70%" stopColor="#010a16" />
          <stop offset="88%" stopColor="#2b3d57" />
          <stop offset="100%" stopColor="#0b1b30" />
        </linearGradient>

        <linearGradient id={id('nose')} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0%" stopColor="#060e1a" />
          <stop offset="22%" stopColor="#16253c" />
          <stop offset="40%" stopColor="#050f1d" />
          <stop offset="72%" stopColor="#000509" />
          <stop offset="100%" stopColor="#050d18" />
        </linearGradient>

        <radialGradient id={id('glint')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffdcac" stopOpacity="0.62" />
          <stop offset="30%" stopColor="#ffab5c" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#ff9838" stopOpacity="0" />
        </radialGradient>

        {/* Legibility scrim: heavy on the left where the headline sits, gone by
            the time it reaches the vehicle. */}
        <linearGradient id={id('scrim')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000208" stopOpacity="0.82" />
          <stop offset="28%" stopColor="#000208" stopOpacity="0.52" />
          <stop offset="58%" stopColor="#000208" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000208" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000208" stopOpacity="0" />
          <stop offset="100%" stopColor="#000208" stopOpacity="0.55" />
        </linearGradient>

        <filter id={id('soft')} x="-30%" y="-140%" width="160%" height="380%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <filter id={id('mid')} x="-20%" y="-120%" width="140%" height="340%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
        <filter id={id('tight')} x="-12%" y="-90%" width="124%" height="280%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
        <filter id={id('star')} x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>

        {/* The haze has to arrive from nothing on the night side. */}
        <mask id={id('hazemask')}>
          <rect x={820} y={0} width={VW - 820} height={VH} fill={`url(#${id('hazefade')})`} />
        </mask>
        <linearGradient
          id={id('hazefade')}
          gradientUnits="userSpaceOnUse"
          x1={820}
          y1="0"
          x2={1400}
          y2="0"
        >
          <stop offset="0%" stopColor="#000000" />
          <stop offset="34%" stopColor="#ffffff" />
          <stop offset="82%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#8a8a8a" />
        </linearGradient>

        <clipPath id={id('planet')}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      <rect width={VW} height={VH} fill={`url(#${id('space')})`} />

      {/* ── stars ─────────────────────────────────────────────────────────── */}
      <g fill="#dce9ff">
        {dim.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>
      <g filter={`url(#${id('star')})`}>
        {bright.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={s.o} />
        ))}
      </g>

      {/* A shallow band of scattered light above the horizon, masked to the
          lit half — the night side of a limb has no airglow to speak of. */}
      <rect
        x={820}
        y={92}
        width={VW - 820}
        height={108}
        fill={`url(#${id('haze')})`}
        mask={`url(#${id('hazemask')})`}
      />

      {/* ── atmosphere, struck on the limb circle ─────────────────────────── */}
      <circle
        cx={CX}
        cy={CY}
        r={R + 16}
        fill="none"
        stroke={`url(#${id('halo')})`}
        strokeWidth={44}
        filter={`url(#${id('soft')})`}
      />
      <circle
        cx={CX}
        cy={CY}
        r={R + 4}
        fill="none"
        stroke={`url(#${id('rim')})`}
        strokeWidth={9}
        opacity={0.55}
        filter={`url(#${id('mid')})`}
      />

      {/* ── planet ────────────────────────────────────────────────────────── */}
      <g clipPath={`url(#${id('planet')})`}>
        <circle cx={CX} cy={CY} r={R} fill={`url(#${id('surf')})`} />

        {/* Weather, not geography: soft bands struck roughly parallel to the
            limb. Any more contrast and the planet reads as marble. */}
        <g filter={`url(#${id('mid')})`}>
          <ellipse cx={1080} cy={CY - R + 34} rx={170} ry={13} fill="#5f86b4" opacity="0.3" />
          <ellipse cx={1310} cy={CY - R + 26} rx={130} ry={10} fill="#6f97c6" opacity="0.26" />
          <ellipse cx={1210} cy={CY - R + 62} rx={230} ry={17} fill="#2d4f78" opacity="0.34" />
          <ellipse cx={980} cy={CY - R + 74} rx={150} ry={14} fill="#24446c" opacity="0.3" />
          <ellipse cx={1150} cy={CY - R + 108} rx={260} ry={20} fill="#132c4b" opacity="0.4" />
        </g>

        {/* the sun breaking over the horizon, warming the cloud tops under it */}
        <ellipse
          cx={1160}
          cy={CY - R + 16}
          rx={230}
          ry={12}
          fill="#ffd2a0"
          opacity="0.16"
          filter={`url(#${id('mid')})`}
        />

        <circle cx={CX} cy={CY} r={R} fill={`url(#${id('term')})`} />

        {/* city lights */}
        <g>
          {cities.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="#ffa552" opacity={c.o} />
          ))}
        </g>
        <g filter={`url(#${id('mid')})`} opacity="0.5">
          {cities
            .filter((_, i) => i % 6 === 0)
            .map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={c.r * 2.1} fill="#ff9c3d" opacity={c.o * 0.5} />
            ))}
        </g>
      </g>

      {/* the specular rim sits on top of the planet, not under it */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={`url(#${id('rim')})`}
        strokeWidth={2.6}
        filter={`url(#${id('tight')})`}
      />

      {/* ── sunrise glint behind the vehicle ──────────────────────────────── */}
      <ellipse
        cx={SHIP_X - 4}
        cy={glintY + 4}
        rx={52}
        ry={17}
        fill={`url(#${id('glint')})`}
      />

      {/* ── vehicle ───────────────────────────────────────────────────────── */}
      <g>
        {/* aft flaps */}
        <path
          d={`M ${SHIP_X - SHIP_HW} 195 L ${SHIP_X - SHIP_HW - 17} 225 L ${SHIP_X - SHIP_HW - 17} 242 L ${SHIP_X - SHIP_HW} 242 Z`}
          fill="#0a131f"
        />
        <path
          d={`M ${SHIP_X + SHIP_HW} 195 L ${SHIP_X + SHIP_HW + 17} 225 L ${SHIP_X + SHIP_HW + 17} 242 L ${SHIP_X + SHIP_HW} 242 Z`}
          fill="#070d17"
        />

        {/* body */}
        <rect
          x={SHIP_X - SHIP_HW}
          y={noseY + 50}
          width={SHIP_HW * 2}
          height={VH - (noseY + 50)}
          fill={`url(#${id('hull')})`}
        />

        {/* nose cone */}
        <path
          d={`M ${SHIP_X - SHIP_HW} ${noseY + 52}
              C ${SHIP_X - SHIP_HW} ${noseY + 22} ${SHIP_X - 4.5} ${noseY + 1} ${SHIP_X - 0.5} ${noseY}
              C ${SHIP_X + 4} ${noseY + 1} ${SHIP_X + SHIP_HW} ${noseY + 22} ${SHIP_X + SHIP_HW} ${noseY + 52} Z`}
          fill={`url(#${id('nose')})`}
        />

        {/* forward flaps, swept back off the shoulder */}
        <path
          d={`M ${SHIP_X - SHIP_HW + 1} ${flapTop + 14} L ${SHIP_X - SHIP_HW - 15} ${flapTop + 34}
              L ${SHIP_X - SHIP_HW - 15} ${flapTop + 43} L ${SHIP_X - SHIP_HW + 1} ${flapTop + 43} Z`}
          fill="#101d2e"
        />
        <path
          d={`M ${SHIP_X + SHIP_HW - 1} ${flapTop + 14} L ${SHIP_X + SHIP_HW + 15} ${flapTop + 34}
              L ${SHIP_X + SHIP_HW + 15} ${flapTop + 43} L ${SHIP_X + SHIP_HW - 1} ${flapTop + 43} Z`}
          fill="#0a1420"
        />

        {/* the hard specular line down the near side */}
        <rect
          x={SHIP_X - 7}
          y={noseY + 10}
          width={2.6}
          height={VH - (noseY + 8)}
          fill="#dcdae0"
          opacity="0.95"
          filter={`url(#${id('tight')})`}
        />

        {/* weld rings — just enough to give the hull a scale */}
        <g stroke="#0a121d" strokeWidth="0.8" opacity="0.65">
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={SHIP_X - SHIP_HW}
              x2={SHIP_X + SHIP_HW}
              y1={noseY + 74 + i * 33}
              y2={noseY + 74 + i * 33}
            />
          ))}
        </g>
      </g>

      {/* ── scrims ────────────────────────────────────────────────────────── */}
      <rect width={VW} height={VH} fill={`url(#${id('scrim')})`} />
      <rect y={VH - 58} width={VW} height={58} fill={`url(#${id('floor')})`} />
    </svg>
  )
}
