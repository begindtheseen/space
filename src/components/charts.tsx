/* ============================================================================
   ORBIT — charts
   ----------------------------------------------------------------------------
   Hand-rolled SVG rather than a charting library. Four small, specific charts
   is not worth 150KB of generic machinery, and these need to sit inside the
   product's own visual language rather than be themed into it.

   Shared rules across all of them:
     · no chartjunk — one gridline set, no borders, no 3D, no legend when the
       series can be labelled inline
     · colour carries meaning, never decoration
     · every axis that shows a proportion is pinned to 0–100%, so two charts
       side by side are actually comparable
   ========================================================================== */
import { useId } from 'react'
import './charts.css'

/* ── Line / area ─────────────────────────────────────────────────────────── */

export interface Series {
  label: string
  color: string
  points: { x: number; y: number }[]
  dashed?: boolean
  fill?: boolean
}

export function LineChart({
  series,
  height = 190,
  yMax,
  yMin = 0,
  yFormat = (v) => `${Math.round(v * 100)}%`,
  xFormat,
  xTicks = 4,
  yTicks = 4,
  ariaLabel,
}: {
  series: Series[]
  height?: number
  yMax?: number
  yMin?: number
  yFormat?: (v: number) => string
  xFormat?: (v: number) => string
  xTicks?: number
  yTicks?: number
  ariaLabel: string
}) {
  const uid = useId().replace(/:/g, '')
  const all = series.flatMap((s) => s.points)
  if (all.length === 0) return <div className="chart chart--empty">No data yet</div>

  const xs = all.map((p) => p.x)
  const ys = all.map((p) => p.y)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = yMin
  const y1 = yMax ?? Math.max(...ys, 0.0001)

  const padL = 40
  const padR = 10
  const padT = 10
  const padB = 22
  const W = 600 // viewBox units; the SVG scales to its container

  const px = (x: number) => padL + ((x - x0) / (x1 - x0 || 1)) * (W - padL - padR)
  const py = (y: number) => height - padB - ((y - y0) / (y1 - y0 || 1)) * (height - padT - padB)

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
    >
      {/* gridlines + y labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = y0 + ((y1 - y0) * i) / yTicks
        const y = py(v)
        return (
          <g key={i}>
            <line className="chart__grid" x1={padL} x2={W - padR} y1={y} y2={y} />
            <text className="chart__ylabel" x={padL - 7} y={y + 3.5} textAnchor="end">
              {yFormat(v)}
            </text>
          </g>
        )
      })}

      {/* x labels */}
      {xFormat
        ? Array.from({ length: xTicks + 1 }, (_, i) => {
            const v = x0 + ((x1 - x0) * i) / xTicks
            return (
              <text
                key={i}
                className="chart__xlabel"
                x={px(v)}
                y={height - 6}
                textAnchor={i === 0 ? 'start' : i === xTicks ? 'end' : 'middle'}
              >
                {xFormat(v)}
              </text>
            )
          })
        : null}

      {series.map((s, si) => {
        if (s.points.length === 0) return null
        const d = s.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
          .join(' ')
        const gid = `g-${uid}-${si}`
        const last = s.points[s.points.length - 1]!
        return (
          <g key={s.label}>
            {s.fill ? (
              <>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.26" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${d} L${px(last.x).toFixed(1)},${height - padB} L${px(s.points[0]!.x).toFixed(1)},${height - padB} Z`}
                  fill={`url(#${gid})`}
                />
              </>
            ) : null}
            <path
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? '4 4' : undefined}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={px(last.x)} cy={py(last.y)} r="3" fill={s.color} />
          </g>
        )
      })}
    </svg>
  )
}

/* ── Bars ────────────────────────────────────────────────────────────────── */

export function BarChart({
  bars,
  height = 150,
  color = 'var(--accent)',
  yFormat = (v) => String(Math.round(v)),
  ariaLabel,
}: {
  bars: { label: string; value: number; color?: string }[]
  height?: number
  color?: string
  yFormat?: (v: number) => string
  ariaLabel: string
}) {
  if (bars.length === 0) return <div className="chart chart--empty">No data yet</div>

  const max = Math.max(...bars.map((b) => b.value), 1)
  const W = 600
  const padL = 34
  const padR = 8
  const padT = 8
  const padB = 20
  const slot = (W - padL - padR) / bars.length
  const bw = Math.max(2, Math.min(slot * 0.62, 26))

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
    >
      {[0, 0.5, 1].map((f) => {
        const y = height - padB - f * (height - padT - padB)
        return (
          <g key={f}>
            <line className="chart__grid" x1={padL} x2={W - padR} y1={y} y2={y} />
            <text className="chart__ylabel" x={padL - 6} y={y + 3.5} textAnchor="end">
              {yFormat(max * f)}
            </text>
          </g>
        )
      })}

      {bars.map((b, i) => {
        const h = Math.max(1, (b.value / max) * (height - padT - padB))
        const x = padL + i * slot + (slot - bw) / 2
        return (
          <g key={`${b.label}-${i}`}>
            <rect
              x={x}
              y={height - padB - h}
              width={bw}
              height={h}
              rx="2"
              fill={b.color ?? color}
              opacity={b.value === 0 ? 0.25 : 0.92}
            />
            {bars.length <= 14 ? (
              <text className="chart__xlabel" x={x + bw / 2} y={height - 6} textAnchor="middle">
                {b.label}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

/* ── Reliability diagram ─────────────────────────────────────────────────────
   Stated confidence against observed accuracy, with the perfect-calibration
   diagonal drawn behind. Points above the line are underconfidence, below it
   overconfidence. This is the single most behaviour-changing chart in the
   product: most people are visibly below the line and have never been shown
   it. */

export function ReliabilityChart({
  points,
  height = 200,
  ariaLabel,
}: {
  points: { bin: number; confidence: number; accuracy: number; n: number }[]
  height?: number
  ariaLabel: string
}) {
  const withData = points.filter((p) => p.n > 0)
  if (withData.length < 2) {
    return (
      <div className="chart chart--empty">
        Not enough rated answers yet — rate your confidence during reviews and this fills in.
      </div>
    )
  }

  const W = 320
  const pad = 30
  const size = Math.min(W, height) - pad * 2
  const px = (v: number) => pad + v * size
  const py = (v: number) => pad + size - v * size
  const maxN = Math.max(...withData.map((p) => p.n))

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={ariaLabel}>
      <rect x={pad} y={pad} width={size} height={size} className="chart__plot" />

      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line className="chart__grid" x1={px(0)} x2={px(1)} y1={py(f)} y2={py(f)} />
          <line className="chart__grid" x1={px(f)} x2={px(f)} y1={py(0)} y2={py(1)} />
        </g>
      ))}

      {/* perfect calibration */}
      <line
        x1={px(0)}
        y1={py(0)}
        x2={px(1)}
        y2={py(1)}
        stroke="var(--ink-5)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <path
        d={withData
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.confidence)},${py(p.accuracy)}`)
          .join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {withData.map((p, i) => (
        <circle
          key={i}
          cx={px(p.confidence)}
          cy={py(p.accuracy)}
          r={3 + (p.n / maxN) * 3.5}
          fill="var(--accent)"
          stroke="#000208"
          strokeWidth="1.2"
        >
          <title>{`${Math.round(p.confidence * 100)}% confident → ${Math.round(p.accuracy * 100)}% correct (${p.n} answers)`}</title>
        </circle>
      ))}

      <text className="chart__axis" x={px(0.5)} y={height - 6} textAnchor="middle">
        stated confidence
      </text>
      <text
        className="chart__axis"
        x={10}
        y={py(0.5)}
        textAnchor="middle"
        transform={`rotate(-90 10 ${py(0.5)})`}
      >
        actual accuracy
      </text>
    </svg>
  )
}

/* ── Heat strip ──────────────────────────────────────────────────────────────
   A year of activity as one row per week. Compact enough for a sidebar and
   honest: a blank cell is a blank cell. */

export function HeatStrip({
  days,
  weeks = 26,
  ariaLabel,
}: {
  days: { date: string; value: number }[]
  weeks?: number
  ariaLabel: string
}) {
  const max = Math.max(...days.map((d) => d.value), 1)
  const cell = 9
  const gap = 2.5
  const cols = weeks
  const W = cols * (cell + gap)
  const H = 7 * (cell + gap)

  return (
    <svg
      className="chart chart--heat"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMinYMid meet"
    >
      {days.slice(-cols * 7).map((d, i) => {
        const col = Math.floor(i / 7)
        const row = i % 7
        const t = d.value === 0 ? 0 : 0.18 + (d.value / max) * 0.82
        return (
          <rect
            key={d.date}
            x={col * (cell + gap)}
            y={row * (cell + gap)}
            width={cell}
            height={cell}
            rx="2"
            fill={d.value === 0 ? '#101725' : 'var(--accent)'}
            opacity={d.value === 0 ? 1 : t}
          >
            <title>{`${d.date}: ${d.value} reviews`}</title>
          </rect>
        )
      })}
    </svg>
  )
}
