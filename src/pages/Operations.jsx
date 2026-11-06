import { Fragment, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2, Pause, Play, XCircle } from '../components/icons'
import { PageHeader, Badge } from '../components/ui'
import { ago, useStore } from '../store'
import { seedChecks, compact } from '../data/seed'

const SCHEDULES = ['Every 15 minutes', 'Hourly', 'Every 6 hours', 'Daily', 'Weekly']
const STATUS = {
  success: { tone: 'good', label: 'Succeeded' },
  failed: { tone: 'bad', label: 'Failed' },
  running: { tone: 'info', label: 'Running' },
  paused: { tone: 'neutral', label: 'Paused' },
}

function logs(p) {
  const at = (m) => new Date(p.lastRun + m * 1000).toTimeString().slice(0, 8)
  if (p.status === 'failed') {
    return [`${at(0)}  INFO   Starting “${p.name}”`, `${at(2)}  INFO   Connecting to ${p.source}`, `${at(12)}  ERROR  ${p.error}`, `${at(12)}  INFO   Run stopped, 0 rows written`]
  }
  return [`${at(0)}  INFO   Starting “${p.name}”`, `${at(3)}  INFO   Extracted ${compact(p.rows)} rows from ${p.source}`, `${at(p.duration - 8)}  INFO   Validation passed`, `${at(p.duration)}  INFO   Loaded ${p.target} in ${p.duration}s`]
}

export default function Operations({ go }) {
  const { pipelines, runPipeline, patchPipeline, toast } = useStore()
  const [open, setOpen] = useState(null)
  const [checks] = useState(seedChecks)
  const ok = pipelines.filter((p) => p.status === 'success').length
  const failed = pipelines.filter((p) => p.status === 'failed').length
  const passRate = Math.round((checks.filter((c) => c.result === 'pass').length / checks.length) * 100)

  return (
    <div className="page">
      <PageHeader title="Operations" sub="Schedule pipelines, monitor jobs, track data quality and system health" />

      <section className="health">
        <div className="card stat"><small>Job success rate</small><b>{Math.round((ok / pipelines.length) * 100)}%</b><span className="muted">{ok} of {pipelines.length} latest runs</span></div>
        <div className={`card stat ${failed ? 'alert' : ''}`}><small>Active alerts</small><b>{failed + checks.filter((c) => c.result === 'fail').length}</b><span className="muted">{failed} job, {checks.filter((c) => c.result === 'fail').length} quality</span></div>
        <div className="card stat"><small>Data quality score</small><b>{passRate}%</b><span className="muted">{checks.length} checks</span></div>
        <div className="card stat"><small>Avg. run time</small><b>{Math.round(pipelines.reduce((a, p) => a + p.duration, 0) / pipelines.length)}s</b><span className="muted">across all pipelines</span></div>
      </section>

      <section className="card">
        <h2 className="pad-h">Pipelines</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th></th><th>Pipeline</th><th>Schedule</th><th>Status</th><th>Last run</th><th className="num">Rows</th><th className="act">Actions</th></tr></thead>
            <tbody>
              {pipelines.map((p) => {
                const st = p.paused && p.status !== 'running' ? STATUS.paused : STATUS[p.status]
                const isOpen = open === p.id
                return (
                  <Fragment key={p.id}>
                    <tr>
                      <td><button className="icon-btn" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} logs for ${p.name}`}><ChevronRight size={15} className={isOpen ? 'rot' : ''} /></button></td>
                      <td><b>{p.name}</b><small className="sub">{p.source} → {p.target}</small></td>
                      <td>
                        <select className="input slim" value={p.schedule} aria-label={`Schedule for ${p.name}`} onChange={(e) => { patchPipeline(p.id, { schedule: e.target.value }); toast(`Schedule set to ${e.target.value.toLowerCase()}`) }}>
                          {SCHEDULES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><Badge tone={st.tone} dot>{st.label}</Badge></td>
                      <td>{ago(p.lastRun)}<small className="sub">{p.duration}s</small></td>
                      <td className="num mono">{compact(p.rows)}</td>
                      <td className="act">
                        <button className="btn slim" disabled={p.status === 'running'} onClick={() => runPipeline(p.id)}>
                          {p.status === 'running' ? <Loader2 size={13} className="spin" /> : <Play size={13} />} Run now
                        </button>
                        <button className="icon-btn" aria-label={p.paused ? `Resume ${p.name}` : `Pause ${p.name}`} title={p.paused ? 'Resume' : 'Pause'} onClick={() => { patchPipeline(p.id, { paused: !p.paused }); toast(p.paused ? 'Pipeline resumed' : 'Pipeline paused') }}>
                          {p.paused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="log-row"><td colSpan={7}>
                        <pre className="log">{logs(p).join('\n')}</pre>
                        {p.status === 'failed' && <button className="btn" onClick={() => go('connectors')}>Fix credentials in Connectors</button>}
                      </td></tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="pad-h">Data quality checks</h2>
        <ul className="checks">
          {checks.map((c) => (
            <li key={c.id}>
              {c.result === 'pass' ? <CheckCircle2 size={17} className="ok-ico" /> : c.result === 'warn' ? <AlertTriangle size={17} className="warn-ico" /> : <XCircle size={17} className="bad-ico" />}
              <span><b>{c.name}</b><small className="sub">{c.table} · {c.detail}</small></span>
              <Badge tone={c.result === 'pass' ? 'good' : c.result === 'warn' ? 'warn' : 'bad'}>{c.result === 'pass' ? 'Passed' : c.result === 'warn' ? 'Warning' : 'Failed'}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
