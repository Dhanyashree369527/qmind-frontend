import { useMemo, useState } from 'react'
import { LayoutDashboard, Plus, Sparkles, Trash2 } from '../components/icons'
import { PageHeader, Badge, Modal, Toggle, Empty, Segmented, Delta } from '../components/ui'
import { LineChart, Sparkline } from '../components/Charts'
import { useStore } from '../store'
import { fmt, kpiStatus, weekLabels } from '../data/seed'
import { getConnector } from '../data/connectors'

const TONE = { good: 'good', warn: 'warn', bad: 'bad' }
const RANGES = [{ value: 12, label: '12W' }, { value: 26, label: '26W' }, { value: 52, label: '52W' }]

function suggest(name) {
  const n = name.toLowerCase()
  if (/revenue|sales/.test(n)) return { formula: "SUM(order_total) WHERE status = 'completed'", description: 'Total value of completed orders per week.', unit: '$' }
  if (/churn|attrition/.test(n)) return { formula: 'COUNT(churned_customers) / COUNT(customers_at_start) * 100', description: 'Share of customers lost in the period.', unit: '%' }
  if (/margin|profit/.test(n)) return { formula: '(SUM(revenue) - SUM(cogs)) / SUM(revenue) * 100', description: 'Share of revenue kept after direct costs.', unit: '%' }
  if (/customer|user|account/.test(n)) return { formula: 'COUNT(DISTINCT customer_id) WHERE last_order_at >= NOW() - INTERVAL 90 DAY', description: 'Distinct active customers in the last 90 days.', unit: '#' }
  if (/session|traffic|visit/.test(n)) return { formula: 'SUM(sessions) GROUP BY week', description: 'Website sessions per week.', unit: '#' }
  return { formula: 'COUNT(DISTINCT id)', description: 'Distinct records counted per period.', unit: '#' }
}

function CreateKpi({ onClose, onCreate, connections }) {
  const [f, setF] = useState({ name: '', description: '', formula: '', sourceId: connections[0]?.id || '', unit: '#', target: '', goodUp: true, owner: '' })
  const [err, setErr] = useState({})
  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setErr((e) => ({ ...e, [k]: undefined })) }

  const submit = () => {
    const e = {}
    if (!f.name.trim()) e.name = 'Name is required'
    if (!f.formula.trim()) e.formula = 'Add a formula or use the AI suggestion'
    if (!f.sourceId) e.sourceId = 'Connect a data source first'
    if (!(Number(f.target) > 0)) e.target = 'Enter a target above zero'
    setErr(e)
    if (Object.keys(e).length) return
    onCreate({ ...f, name: f.name.trim(), target: Number(f.target) })
  }
  return (
    <Modal
      title="New KPI"
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={submit}>Create KPI</button></>}
    >
      <div className={`field ${err.name ? 'err' : ''}`}>
        <label htmlFor="kpi-name">Name <i>*</i></label>
        <input id="kpi-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Repeat Purchase Rate" />
        {err.name && <small className="field-err">{err.name}</small>}
      </div>
      <div className="row between">
        <span className="muted">Let the KPI Designer agent propose a definition from the name.</span>
        <button
          className="btn"
          type="button"
          onClick={() => {
            if (!f.name.trim()) { setErr((e) => ({ ...e, name: 'Enter a name first' })); return }
            const s = suggest(f.name)
            setF((x) => ({ ...x, formula: s.formula, description: s.description, unit: s.unit }))
            setErr((e) => ({ ...e, formula: undefined }))
          }}
        >
          <Sparkles size={14} /> Suggest with AI
        </button>
      </div>
      <div className={`field ${err.formula ? 'err' : ''}`}>
        <label htmlFor="kpi-formula">Formula <i>*</i></label>
        <textarea id="kpi-formula" className="input mono" rows={3} value={f.formula} onChange={(e) => set('formula', e.target.value)} placeholder="SUM(order_total) WHERE status = 'completed'" />
        {err.formula && <small className="field-err">{err.formula}</small>}
      </div>
      <div className="field">
        <label htmlFor="kpi-desc">Description</label>
        <input id="kpi-desc" className="input" value={f.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="fields">
        <div className="half field">
          <label htmlFor="kpi-source">Data source <i>*</i></label>
          <select id="kpi-source" className="input" value={f.sourceId} onChange={(e) => set('sourceId', e.target.value)}>
            {connections.length === 0 && <option value="">No connections yet</option>}
            {connections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {err.sourceId && <small className="field-err">{err.sourceId}</small>}
        </div>
        <div className="half field">
          <label htmlFor="kpi-owner">Owner</label>
          <input id="kpi-owner" className="input" value={f.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Team or person" />
        </div>
        <div className="half field">
          <label htmlFor="kpi-unit">Unit</label>
          <select id="kpi-unit" className="input" value={f.unit} onChange={(e) => set('unit', e.target.value)}>
            <option value="#">Count (#)</option><option value="$">Currency ($)</option><option value="%">Percent (%)</option><option value="x">Ratio (x)</option>
          </select>
        </div>
        <div className={`half field ${err.target ? 'err' : ''}`}>
          <label htmlFor="kpi-target">Target <i>*</i></label>
          <input id="kpi-target" className="input" type="number" value={f.target} onChange={(e) => set('target', e.target.value)} />
          {err.target && <small className="field-err">{err.target}</small>}
        </div>
      </div>
      <Toggle id="kpi-goodup" checked={f.goodUp} onChange={(v) => set('goodUp', v)} label="Higher is better" />
    </Modal>
  )
}

export default function KpiStudio({ go }) {
  const { kpis, connections, addKpi, removeKpi, addWidget, toast } = useStore()
  const [selId, setSelId] = useState(kpis[0]?.id)
  const [creating, setCreating] = useState(false)
  const [range, setRange] = useState(26)
  const [confirm, setConfirm] = useState(false)
  const sel = kpis.find((k) => k.id === selId) || kpis[0]
  const labels = useMemo(() => weekLabels(range), [range])
  const source = sel && connections.find((c) => c.id === sel.sourceId)

  return (
    <div className="page">
      <PageHeader title="KPI Studio" sub="Define, manage and govern business metrics with AI assistance">
        <button className="btn primary" onClick={() => setCreating(true)}><Plus size={15} /> New KPI</button>
      </PageHeader>

      {kpis.length === 0 ? (
        <Empty icon={Sparkles} title="No KPIs yet">Create your first KPI. The AI suggestion fills in a formula from the name.</Empty>
      ) : (
        <div className="split">
          <section className="card list-card">
            <div className="table-wrap">
              <table className="table select-rows">
                <thead><tr><th>KPI</th><th className="num">Value</th><th className="num">Target</th><th>Status</th><th>Trend</th></tr></thead>
                <tbody>
                  {kpis.map((k) => {
                    const st = kpiStatus(k)
                    return (
                      <tr key={k.id} className={sel?.id === k.id ? 'on' : ''} onClick={() => { setSelId(k.id); setConfirm(false) }} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelId(k.id)}>
                        <td><b>{k.name}</b><small className="sub">{k.owner || 'Unassigned'}</small></td>
                        <td className="num mono">{fmt(st.value, k.unit)}</td>
                        <td className="num mono muted">{fmt(k.target, k.unit)}</td>
                        <td><Badge tone={TONE[st.key]} dot>{st.label}</Badge></td>
                        <td><Sparkline data={k.series.slice(-16)} color={`var(--${st.key === 'good' ? 'good' : st.key === 'warn' ? 'warn' : 'bad'})`} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {sel && (
            <section className="card detail">
              <div className="detail-head">
                <div>
                  <h2>{sel.name}</h2>
                  <p className="muted">{sel.description || 'No description yet.'}</p>
                </div>
                <Segmented options={RANGES} value={range} onChange={setRange} label="Range" />
              </div>
              <div className="kpi-big">
                <b>{fmt(sel.series[sel.series.length - 1], sel.unit)}</b>
                <Delta value={sel.series[sel.series.length - 1] / sel.series[sel.series.length - range] - 1} goodUp={sel.goodUp} />
                <span className="muted">vs {range} weeks ago · target {fmt(sel.target, sel.unit)}</span>
              </div>
              <LineChart
                labels={labels}
                height={220}
                fmt={(v) => fmt(v, sel.unit)}
                series={[
                  { name: sel.name, data: sel.series.slice(-range), color: 'var(--accent)' },
                  { name: 'Target', data: Array(range).fill(sel.target), color: 'var(--faint)', dashed: true },
                ]}
              />
              <dl className="defs">
                <div><dt>Formula</dt><dd className="mono">{sel.formula}</dd></div>
                <div><dt>Data source</dt><dd>{source ? `${source.name} (${getConnector(source.connectorId)?.name})` : 'Source removed. Pick a new one in Connectors.'}</dd></div>
                <div><dt>Direction</dt><dd>{sel.goodUp ? 'Higher is better' : 'Lower is better'}</dd></div>
              </dl>
              <div className="row">
                <button className="btn" onClick={() => { addWidget('line', sel.id); toast('Added to Dashboards') }}><LayoutDashboard size={14} /> Add to dashboard</button>
                <button className="btn" onClick={() => go('intelligence')}>Analyse in Intelligence</button>
                {confirm ? (
                  <>
                    <button className="btn danger" onClick={() => { removeKpi(sel.id); setConfirm(false); toast(`${sel.name} deleted`) }}>Confirm delete</button>
                    <button className="btn" onClick={() => setConfirm(false)}>Keep</button>
                  </>
                ) : (
                  <button className="btn ghost danger" onClick={() => setConfirm(true)}><Trash2 size={14} /> Delete</button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {creating && (
        <CreateKpi
          connections={connections}
          onClose={() => setCreating(false)}
          onCreate={(k) => {
            const id = addKpi(k)
            setSelId(id)
            setCreating(false)
            toast(`${k.name} created`)
          }}
        />
      )}
    </div>
  )
}
