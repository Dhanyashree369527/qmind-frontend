import { useEffect, useRef, useState } from 'react'

function useWidth(def = 640) {
  const ref = useRef(null)
  const [w, setW] = useState(def)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const apply = () => setW(Math.max(220, Math.round(el.clientWidth || def)))
    apply()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [def])
  return [ref, w]
}

export function Sparkline({ data, color = 'var(--accent)', w = 96, h = 30 }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const r = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 4) + 2, h - 4 - ((v - min) / r) * (h - 8)])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="spark">
      <path d={`${d} L${last[0]} ${h} L${pts[0][0]} ${h} Z`} style={{ fill: color }} opacity="0.12" />
      <path d={d} fill="none" style={{ stroke: color }} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.6" style={{ fill: color }} />
    </svg>
  )
}

/**
 * series: [{ name, data, color, dashed, start }]  (start = index where the series begins)
 * labels: x label for each index. anomalies: indices flagged on the first series.
 */
export function LineChart({ series, labels, height = 240, fmt = (v) => String(Math.round(v)), anomalies = [], area = true }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState(null)
  const pad = { l: 54, r: 14, t: 14, b: 26 }
  const n = Math.max(...series.map((s) => (s.start || 0) + s.data.length))
  const all = series.flatMap((s) => s.data)
  let min = Math.min(...all)
  let max = Math.max(...all)
  const span = max - min || 1
  min -= span * 0.1
  max += span * 0.1
  const x = (i) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r)
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b)
  const ticks = [0, 1, 2, 3].map((i) => min + ((max - min) * i) / 3)
  const xt = [0, 1, 2, 3, 4].map((i) => Math.round((i / 4) * (n - 1)))

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left - pad.l) / (w - pad.l - pad.r)) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }
  const path = (s) =>
    s.data.map((v, i) => `${i ? 'L' : 'M'}${x((s.start || 0) + i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')

  const tip = hover == null ? null : series.map((s) => ({ s, v: s.data[hover - (s.start || 0)] })).filter((t) => t.v != null)

  return (
    <div className="chart" ref={ref}>
      <svg
        width={w}
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Line chart"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="grid-line" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="axis">
              {fmt(t)}
            </text>
          </g>
        ))}
        {xt.map((i) => (
          <text key={i} x={x(i)} y={height - 7} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="axis">
            {labels[i]}
          </text>
        ))}
        {area && series[0] && !series[0].dashed && (
          <path
            d={`${path(series[0])} L${x((series[0].start || 0) + series[0].data.length - 1)} ${height - pad.b} L${x(series[0].start || 0)} ${height - pad.b} Z`}
            style={{ fill: series[0].color }}
            opacity="0.08"
          />
        )}
        {series.map((s) => (
          <path
            key={s.name}
            d={path(s)}
            fill="none"
            style={{ stroke: s.color }}
            strokeWidth={s.dashed ? 1.5 : 2.2}
            strokeDasharray={s.dashed ? '5 4' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {anomalies.map((i) => (
          <circle key={i} cx={x(i)} cy={y(series[0].data[i])} r="5.5" className="anom" />
        ))}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={height - pad.b} className="cursor-line" />
            {tip.map(({ s, v }) => (
              <circle key={s.name} cx={x(hover)} cy={y(v)} r="4" style={{ fill: s.color }} className="dot-ring" />
            ))}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="tooltip" style={{ left: Math.min(Math.max(x(hover), 70), w - 70) }}>
          <b>{labels[hover]}</b>
          {tip.map(({ s, v }) => (
            <span key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}: {fmt(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function BarChart({ data, height = 190, color = 'var(--accent)', fmt = (v) => String(Math.round(v)) }) {
  const [ref, w] = useWidth(360)
  const [hover, setHover] = useState(null)
  const pad = { l: 8, r: 8, t: 22, b: 24 }
  const max = Math.max(...data.map((d) => d.value)) * 1.1 || 1
  const bw = (w - pad.l - pad.r) / data.length
  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - pad.t - pad.b)
          const bx = pad.l + i * bw + bw * 0.16
          const on = hover === i
          return (
            <g key={d.label + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * bw} y={0} width={bw} height={height} fill="transparent" />
              <rect x={bx} y={height - pad.b - h} width={bw * 0.68} height={h} rx="3" style={{ fill: color }} opacity={hover == null || on ? 1 : 0.45} />
              <text x={bx + bw * 0.34} y={height - 8} textAnchor="middle" className="axis">
                {d.label}
              </text>
              {on && (
                <text x={bx + bw * 0.34} y={height - pad.b - h - 6} textAnchor="middle" className="axis strong">
                  {fmt(d.value)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export const PALETTE = ['var(--m-blue)', 'var(--m-green)', 'var(--m-orange)', 'var(--m-purple)', 'var(--m-pink)', 'var(--m-teal)']

export function Donut({ parts, size = 150, fmt = (v) => String(Math.round(v)), centerLabel }) {
  const [hover, setHover] = useState(null)
  const total = parts.reduce((a, b) => a + b.value, 0) || 1
  const r = size / 2 - 12
  const c = 2 * Math.PI * r
  let off = 0
  const active = hover == null ? null : parts[hover]
  return (
    <div className="donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {parts.map((p, i) => {
            const len = (p.value / total) * c
            const el = (
              <circle
                key={p.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                strokeWidth={hover === i ? 20 : 16}
                strokeDasharray={`${Math.max(len - 2, 0)} ${c}`}
                strokeDashoffset={-off}
                style={{ stroke: PALETTE[i % PALETTE.length], transition: 'stroke-width .15s' }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            )
            off += len
            return el
          })}
        </g>
        <text x="50%" y="48%" textAnchor="middle" className="donut-val">
          {active ? fmt(active.value) : fmt(total)}
        </text>
        <text x="50%" y="62%" textAnchor="middle" className="axis">
          {active ? active.label : centerLabel || 'Total'}
        </text>
      </svg>
      <ul className="legend">
        {parts.map((p, i) => (
          <li key={p.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={hover === i ? 'on' : ''}>
            <i style={{ background: PALETTE[i % PALETTE.length] }} />
            <span>{p.label}</span>
            <b>{Math.round((p.value / total) * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  )
}
