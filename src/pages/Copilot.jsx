import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from '../components/icons'
import { PageHeader } from '../components/ui'
import { LineChart } from '../components/Charts'
import { useStore, ago } from '../store'
import { detectAnomalies, fmt, kpiStatus, weekLabels } from '../data/seed'
import { getConnector } from '../data/connectors'

const SUGGESTIONS = [
  'Which KPIs are off track?',
  'Show the revenue trend',
  'Why did churn spike?',
  'List my connections',
  'Any failed pipelines?',
]

// This is a scripted stand-in for the AI Copilot agent: it answers from the
// data in this app so the conversation flow can be reviewed without a backend.
function answer(text, { kpis, connections, pipelines }) {
  const t = text.toLowerCase()
  const kpi = kpis.find((k) => k.name.toLowerCase().split(' ').some((w) => w.length > 3 && t.includes(w)))

  if (/^(hi|hello|hey)\b/.test(t)) {
    return { text: 'Hello. I can look up KPIs, anomalies, connections and pipeline health. Try one of the suggestions below.' }
  }
  if (/failed|pipeline|job|operations/.test(t)) {
    const bad = pipelines.filter((p) => p.status === 'failed')
    if (!bad.length) return { text: `All ${pipelines.length} pipelines are healthy.`, actions: [{ label: 'Open Operations', go: 'operations' }] }
    return {
      text: `${bad.length} pipeline${bad.length > 1 ? 's have' : ' has'} failed:\n${bad.map((p) => `• ${p.name}: ${p.error}`).join('\n')}`,
      actions: [{ label: 'Open Connectors', go: 'connectors' }, { label: 'Open Operations', go: 'operations' }],
    }
  }
  if (/connect|source|database/.test(t)) {
    return {
      text: `You have ${connections.length} connections:\n${connections.map((c) => `• ${c.name} (${getConnector(c.connectorId)?.name}), synced ${ago(c.syncedAt)}`).join('\n')}`,
      actions: [{ label: 'Open Connectors', go: 'connectors' }],
    }
  }
  if (kpi && /why|spike|drop|anomal|change/.test(t)) {
    const a = detectAnomalies(kpi.series).filter((x) => x.index >= kpi.series.length - 12)
    const w = weekLabels(52)
    return {
      text: a.length
        ? `${kpi.name} moved ${a.map((x) => `${(x.dev * 100).toFixed(0)}% off its 8-week average in the week of ${w[x.index]}`).join('; ')}. Open Intelligence for the driver breakdown and a what-if forecast.`
        : `I see no unusual movement in ${kpi.name} over the last 12 weeks.`,
      chart: kpi.id,
      actions: [{ label: 'Analyse in Intelligence', go: 'intelligence' }],
    }
  }
  if (kpi) {
    const st = kpiStatus(kpi)
    const chg = kpi.series[51] / kpi.series[43] - 1
    return {
      text: `${kpi.name} is ${fmt(st.value, kpi.unit)} against a target of ${fmt(kpi.target, kpi.unit)} (${st.label.toLowerCase()}). Over 8 weeks it changed ${(chg * 100).toFixed(1)}%.`,
      chart: kpi.id,
      actions: [{ label: 'Add to dashboard', widget: kpi.id }, { label: 'Open KPI Studio', go: 'kpi' }],
    }
  }
  if (/kpi|metric|track|status/.test(t)) {
    const rows = kpis.map((k) => `• ${k.name}: ${fmt(kpiStatus(k).value, k.unit)} (${kpiStatus(k).label})`)
    return { text: `Here is where your KPIs stand:\n${rows.join('\n')}`, actions: [{ label: 'Open KPI Studio', go: 'kpi' }] }
  }
  if (/anomal|unusual/.test(t)) {
    const n = kpis.filter((k) => detectAnomalies(k.series).some((a) => a.index >= 40)).map((k) => k.name)
    return { text: n.length ? `Recent anomalies: ${n.join(', ')}.` : 'No anomalies in the last 12 weeks.', actions: [{ label: 'Open Intelligence', go: 'intelligence' }] }
  }
  return { text: 'I can answer questions about KPIs, anomalies, connections and pipelines. Try “Show the revenue trend” or “Which KPIs are off track?”.' }
}

export default function Copilot({ go }) {
  const store = useStore()
  const { toast, addWidget } = store
  const [msgs, setMsgs] = useState([
    { id: 0, role: 'ai', text: 'Hi, I am the QMind Copilot. Ask me about your KPIs, data sources or pipelines.' },
  ])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }) }, [msgs, typing])

  const send = (raw) => {
    const q = (raw ?? text).trim()
    if (!q || typing) return
    setText('')
    setMsgs((m) => [...m, { id: m.length, role: 'user', text: q }])
    setTyping(true)
    timer.current = setTimeout(() => {
      const a = answer(q, store)
      setMsgs((m) => [...m, { id: m.length, role: 'ai', ...a }])
      setTyping(false)
    }, 700)
  }

  const act = (a) => {
    if (a.go) go(a.go)
    else if (a.widget) { addWidget('line', a.widget); toast('Added to Dashboards') }
  }

  return (
    <div className="page copilot">
      <PageHeader title="Copilot" sub="Conversational analytics across your data, KPIs and business context" />
      <section className="card chat">
        <div className="chat-log" role="log" aria-live="polite">
          {msgs.map((m) => {
            const k = m.chart && store.kpis.find((x) => x.id === m.chart)
            return (
              <div key={m.id} className={`msg ${m.role}`}>
                {m.role === 'ai' && <span className="ai-av"><Sparkles size={14} /></span>}
                <div className="bubble">
                  {m.text.split('\n').map((l, i) => <p key={i}>{l}</p>)}
                  {k && (
                    <div className="mini-chart">
                      <LineChart labels={weekLabels(26)} height={150} fmt={(v) => fmt(v, k.unit)} series={[{ name: k.name, data: k.series.slice(-26), color: 'var(--accent)' }]} />
                    </div>
                  )}
                  {m.actions && (
                    <div className="row">
                      {m.actions.map((a) => <button key={a.label} className="btn" onClick={() => act(a)}>{a.label}</button>)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {typing && <div className="msg ai"><span className="ai-av"><Sparkles size={14} /></span><div className="bubble typing"><i /><i /><i /></div></div>}
          <div ref={end} />
        </div>
        <div className="chips">
          {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send() }}>
          <input id="copilot-input" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about your data…" aria-label="Message the Copilot" autoComplete="off" />
          <button className="btn primary" type="submit" disabled={!text.trim() || typing}><Send size={15} /> Send</button>
        </form>
      </section>
    </div>
  )
}
