import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Loader2, RefreshCw, Sparkles } from '../components/icons'
import { PageHeader, Badge, Delta, Empty } from '../components/ui'
import { LineChart } from '../components/Charts'
import { useStore } from '../store'
import { detectAnomalies, fmt, rng, weekLabels, kpiStatus } from '../data/seed'

const WINDOW = 26
const HORIZON = 8

function drivers(kpi) {
  const r = rng(kpi.id + ':drivers')
  const total = kpi.series[kpi.series.length - 1] / kpi.series[kpi.series.length - 9] - 1
  const names = ['Region: EMEA', 'Channel: Paid search', 'Product: Core plan', 'Segment: SMB', 'Promotion: Autumn sale']
  const raw = names.map((n) => ({ name: n, w: r() - 0.35 }))
  const sum = raw.reduce((a, b) => a + Math.abs(b.w), 0) || 1
  return raw.map((d) => ({ name: d.name, impact: (d.w / sum) * Math.abs(total) * 2 + (d.w > 0 ? 0 : 0) })).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
}

function recommendations(kpi) {
  const st = kpiStatus(kpi)
  const dir = kpi.goodUp ? 'raise' : 'lower'
  const base = [
    `Review the top driver for ${kpi.name} with ${kpi.owner || 'the owning team'} this week.`,
    `Set an alert when ${kpi.name} moves more than 2 standard deviations from its 8-week average.`,
  ]
  if (st.key !== 'good') base.unshift(`${kpi.name} is ${st.label.toLowerCase()}. Plan one action to ${dir} it toward ${fmt(kpi.target, kpi.unit)}.`)
  else base.unshift(`${kpi.name} is on track. Consider a stretch target above ${fmt(kpi.target, kpi.unit)}.`)
  return base
}

export default function Intelligence({ go }) {
  const { kpis, toast } = useStore()
  const [selId, setSelId] = useState(kpis.find((k) => detectAnomalies(k.series.slice(-12)).length)?.id || kpis[0]?.id)
  const [busy, setBusy] = useState(false)
  const [ranAt, setRanAt] = useState('Not run in this session')
  const [spend, setSpend] = useState(0)
  const [done, setDone] = useState({})
  const sel = kpis.find((k) => k.id === selId) || kpis[0]

  const found = useMemo(
    () =>
      kpis.flatMap((k) =>
        detectAnomalies(k.series).filter((a) => a.index >= k.series.length - 12).map((a) => ({ k, ...a }))
      ).sort((a, b) => Math.abs(b.z) - Math.abs(a.z)),
    [kpis]
  )

  if (!sel) return <div className="page"><PageHeader title="Intelligence" /><Empty title="No KPIs to analyse">Create a KPI in KPI Studio first.</Empty></div>

  const view = sel.series.slice(-WINDOW)
  const offset = sel.series.length - WINDOW
  const anoms = detectAnomalies(sel.series).filter((a) => a.index >= offset).map((a) => a.index - offset)
  const labels = weekLabels(WINDOW, HORIZON)

  // what-if forecast
  const n = view.length
  const slope = (view[n - 1] - view[n - 9]) / 8
  const elasticity = 0.12 + rng(sel.id + ':el')() * 0.3
  const sign = sel.goodUp ? 1 : -1
  const last = view[n - 1]
  const forecast = [last]
  for (let i = 1; i <= HORIZON; i++) forecast.push(last + slope * i + sign * last * elasticity * (spend / 100) * (i / HORIZON))
  const baseline = last + slope * HORIZON
  const lift = forecast[HORIZON] / baseline - 1

  const run = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setRanAt('Just now')
      toast(`Analysis finished: ${found.length} anomalies in the last 12 weeks`)
    }, 1200)
  }

  const recs = recommendations(sel)

  return (
    <div className="page">
      <PageHeader title="Intelligence" sub="Detect anomalies, analyse drivers and get actionable recommendations">
        <span className="muted">Last analysis: {ranAt}</span>
        <button className="btn primary" onClick={run} disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />} {busy ? 'Analysing…' : 'Run analysis'}
        </button>
      </PageHeader>

      <div className="intel">
        <section className="card anomalies">
          <h2>Detected anomalies <Badge tone={found.length ? 'warn' : 'good'}>{found.length}</Badge></h2>
          {found.length === 0 && <p className="muted pad">Nothing unusual in the last 12 weeks.</p>}
          <ul className="alist">
            {found.map((a) => {
              const wk = weekLabels(52)[a.index]
              return (
                <li key={a.k.id + a.index}>
                  <button className={sel.id === a.k.id ? 'on' : ''} onClick={() => setSelId(a.k.id)}>
                    <AlertTriangle size={16} className={(a.dev > 0) === a.k.goodUp ? 'ok-ico' : 'bad-ico'} />
                    <span><b>{a.k.name}</b><small>Week of {wk}</small></span>
                    <Delta value={a.dev} goodUp={a.k.goodUp} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card chart-card">
          <div className="detail-head">
            <div>
              <label htmlFor="intel-kpi" className="muted">Analysing</label>
              <select id="intel-kpi" className="input inline" value={sel.id} onChange={(e) => setSelId(e.target.value)}>
                {kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div className="legend-inline"><i className="anom-key" /> Anomaly <i className="dash-key" /> Forecast</div>
          </div>
          <LineChart
            labels={labels}
            height={250}
            fmt={(v) => fmt(v, sel.unit)}
            anomalies={anoms}
            series={[
              { name: sel.name, data: view, color: 'var(--accent)' },
              { name: 'Forecast', data: forecast, start: n - 1, color: 'var(--m-orange)', dashed: true },
            ]}
          />
          <div className="whatif">
            <div>
              <label htmlFor="spend"><b>What-if:</b> change marketing spend</label>
              <input id="spend" type="range" min="-30" max="30" step="5" value={spend} onChange={(e) => setSpend(Number(e.target.value))} />
            </div>
            <div className="wi-out">
              <b>{spend > 0 ? '+' : ''}{spend}%</b>
              <span>In {HORIZON} weeks: <b>{fmt(forecast[HORIZON], sel.unit)}</b> <small className={lift === 0 ? 'muted' : (lift > 0) === sel.goodUp ? 'good-t' : 'bad-t'}>({lift >= 0 ? '+' : ''}{(lift * 100).toFixed(1)}% vs baseline)</small></span>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Key drivers <small className="muted">last 8 weeks</small></h2>
          <ul className="drivers">
            {drivers(sel).map((d) => {
              const max = 0.2
              const wpc = Math.min(100, (Math.abs(d.impact) / max) * 100)
              return (
                <li key={d.name}>
                  <span>{d.name}</span>
                  <div className="bar-track"><i className={d.impact >= 0 ? 'pos' : 'neg'} style={{ width: `${Math.max(wpc, 6)}%` }} /></div>
                  <b className="mono">{d.impact >= 0 ? '+' : '−'}{(Math.abs(d.impact) * 100).toFixed(1)}%</b>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card">
          <h2><Sparkles size={15} /> Recommendations</h2>
          <ul className="recs">
            {recs.map((r, i) => {
              const key = sel.id + i
              return (
                <li key={key} className={done[key] ? 'done' : ''}>
                  <button className="check" aria-pressed={!!done[key]} aria-label={done[key] ? 'Mark as not done' : 'Mark as done'} onClick={() => setDone((d) => ({ ...d, [key]: !d[key] }))}>
                    {done[key] && <Check size={13} />}
                  </button>
                  <span>{r}</span>
                </li>
              )
            })}
          </ul>
          <button className="btn" onClick={() => go('copilot')}>Ask Copilot why</button>
        </section>
      </div>
    </div>
  )
}
