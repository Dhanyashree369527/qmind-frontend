import { useMemo, useState } from 'react'
import { BarChart3, LineChart as LineIcon, PieChart, Plus, Square, X } from '../components/icons'
import { PageHeader, Modal, Segmented, Delta, Empty } from '../components/ui'
import { BarChart, Donut, LineChart, Sparkline } from '../components/Charts'
import { useStore } from '../store'
import { breakdown, fmt, kpiStatus, weekLabels } from '../data/seed'

const RANGES = [{ value: 8, label: '8W' }, { value: 26, label: '26W' }, { value: 52, label: '52W' }]
const TYPES = [
  { id: 'tile', label: 'Metric tile', icon: Square },
  { id: 'line', label: 'Trend line', icon: LineIcon },
  { id: 'bar', label: 'Weekly bars', icon: BarChart3 },
  { id: 'donut', label: 'Breakdown', icon: PieChart },
]

function Widget({ w, kpi, range, onRemove, onOpen }) {
  const labels = useMemo(() => weekLabels(range), [range])
  const data = kpi.series.slice(-range)
  const st = kpiStatus(kpi)
  const change = data[data.length - 1] / data[0] - 1
  const color = `var(--${st.key})`

  let body
  if (w.type === 'tile') {
    body = (
      <button className="tile-body" onClick={onOpen} aria-label={`Open ${kpi.name} detail`}>
        <b className="big">{fmt(data[data.length - 1], kpi.unit)}</b>
        <span className="row"><Delta value={change} goodUp={kpi.goodUp} /><span className="muted">target {fmt(kpi.target, kpi.unit)}</span></span>
        <Sparkline data={data} color={color} w={180} h={36} />
      </button>
    )
  } else if (w.type === 'line') {
    body = <LineChart labels={labels} series={[{ name: kpi.name, data, color: 'var(--accent)' }]} fmt={(v) => fmt(v, kpi.unit)} height={210} />
  } else if (w.type === 'bar') {
    const last = kpi.series.slice(-8)
    const lab = weekLabels(8)
    body = <BarChart data={last.map((v, i) => ({ label: lab[i], value: v }))} fmt={(v) => fmt(v, kpi.unit)} color="var(--m-purple)" />
  } else {
    body = <Donut parts={breakdown(kpi).map((p) => ({ label: p.label, value: p.value }))} fmt={(v) => fmt(v, kpi.unit)} centerLabel="This week" />
  }

  return (
    <article className={`widget ${w.type}`}>
      <header>
        <span>{kpi.name}{w.type === 'donut' ? ' by region' : ''}</span>
        <button className="icon-btn" onClick={onRemove} aria-label={`Remove ${kpi.name} widget`}><X size={14} /></button>
      </header>
      {body}
    </article>
  )
}

export default function Dashboards() {
  const { widgets, kpis, addWidget, removeWidget, toast } = useStore()
  const [range, setRange] = useState(26)
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState('line')
  const [kpiId, setKpiId] = useState(kpis[0]?.id)
  const [drill, setDrill] = useState(null)
  const drillKpi = kpis.find((k) => k.id === drill)

  const shown = widgets.map((w) => ({ w, kpi: kpis.find((k) => k.id === w.kpiId) })).filter((x) => x.kpi)

  return (
    <div className="page">
      <PageHeader title="Dashboards" sub="Executive overview. Click a metric tile to drill down.">
        <Segmented options={RANGES} value={range} onChange={setRange} label="Time range" />
        <button className="btn primary" onClick={() => setAdding(true)} disabled={kpis.length === 0}><Plus size={15} /> Add widget</button>
      </PageHeader>

      {shown.length === 0 ? (
        <Empty icon={BarChart3} title="This dashboard is empty">Use Add widget to place a KPI on it.</Empty>
      ) : (
        <div className="widgets">
          {shown.map(({ w, kpi }) => (
            <Widget key={w.id} w={w} kpi={kpi} range={range} onRemove={() => { removeWidget(w.id); toast('Widget removed') }} onOpen={() => setDrill(kpi.id)} />
          ))}
        </div>
      )}

      {adding && (
        <Modal
          title="Add widget"
          onClose={() => setAdding(false)}
          footer={<><button className="btn" onClick={() => setAdding(false)}>Cancel</button><button className="btn primary" onClick={() => { addWidget(type, kpiId); setAdding(false); toast('Widget added') }}>Add to dashboard</button></>}
        >
          <div className="field">
            <label htmlFor="w-kpi">KPI</label>
            <select id="w-kpi" className="input" value={kpiId} onChange={(e) => setKpiId(e.target.value)}>
              {kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <div className="type-grid" role="radiogroup" aria-label="Widget type">
            {TYPES.map((t) => (
              <button key={t.id} role="radio" aria-checked={type === t.id} className={type === t.id ? 'on' : ''} onClick={() => setType(t.id)}>
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {drillKpi && (
        <Modal title={`${drillKpi.name}: drill-down`} wide onClose={() => setDrill(null)} footer={<button className="btn" onClick={() => setDrill(null)}>Close</button>}>
          <LineChart labels={weekLabels(52)} series={[{ name: drillKpi.name, data: drillKpi.series, color: 'var(--accent)' }]} fmt={(v) => fmt(v, drillKpi.unit)} height={220} />
          <h4 className="mini-h">By region, this week</h4>
          <BarChart data={breakdown(drillKpi).map((p) => ({ label: p.label, value: p.value }))} fmt={(v) => fmt(v, drillKpi.unit)} color="var(--m-blue)" />
        </Modal>
      )}
    </div>
  )
}
