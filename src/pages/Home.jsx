import { Activity, ArrowRight, Brain, Layers, LayoutDashboard, ListChecks, MessageSquare, Plug, Target, Users, Workflow } from '../components/icons'
import { PageHeader, Badge } from '../components/ui'
import { useStore } from '../store'
import { kpiStatus } from '../data/seed'

const MODULES = [
  { id: 'connectors', title: 'Connectors', desc: 'Connect and manage your data sources from databases, SaaS applications, files and APIs.', icon: Plug, c: '--m-blue' },
  { id: 'etl', title: 'ETL Studio', desc: 'AI-powered pipeline generation and data transformation.', icon: Workflow, c: '--m-grey', phase: 2 },
  { id: 'medallion', title: 'Medallion', desc: 'Automated Bronze, Silver and Gold warehouse architecture.', icon: Layers, c: '--m-grey', phase: 2 },
  { id: 'kpi', title: 'KPI Studio', desc: 'Define, manage and govern business metrics with AI assistance.', icon: Target, c: '--m-green' },
  { id: 'dashboards', title: 'Dashboards', desc: 'Create and customize interactive dashboards with AI visualizations.', icon: LayoutDashboard, c: '--m-purple' },
  { id: 'intelligence', title: 'Intelligence', desc: 'Detect anomalies, analyze drivers and get actionable recommendations.', icon: Brain, c: '--m-orange' },
  { id: 'copilot', title: 'Copilot', desc: 'Conversational analytics across your data, KPIs and business context.', icon: MessageSquare, c: '--m-pink' },
  { id: 'operations', title: 'Operations', desc: 'Schedule pipelines, monitor jobs, track data quality and system health.', icon: Activity, c: '--m-blue' },
]

export default function Home({ go }) {
  const { connections, kpis, pipelines } = useStore()
  const off = kpis.filter((k) => kpiStatus(k).key === 'bad').length
  const failed = pipelines.filter((p) => p.status === 'failed').length

  return (
    <div className="page">
      <PageHeader title="QMind AI Platform" sub="Unified data engineering, analytics, governance and decision intelligence">
        <div className="pulse-row" aria-label="Workspace status">
          <button onClick={() => go('connectors')}><b>{connections.length}</b> connections</button>
          <button onClick={() => go('kpi')} className={off ? 'warn' : ''}><b>{off}</b> KPIs off track</button>
          <button onClick={() => go('operations')} className={failed ? 'bad' : ''}><b>{failed}</b> failed jobs</button>
        </div>
      </PageHeader>

      <section className="module-grid">
        {MODULES.map((m) => (
          <button key={m.id} className={`module ${m.phase ? 'dim' : ''}`} style={{ '--c': `var(${m.c})` }} onClick={() => go(m.id)}>
            <span className="m-icon"><m.icon size={20} /></span>
            <span className="m-body">
              <span className="m-top">
                <b>{m.title}</b>
                {m.phase ? <Badge tone="purple">Coming in Phase {m.phase}</Badge> : <Badge tone="good">Available</Badge>}
              </span>
              <span className="m-desc">{m.desc}</span>
            </span>
            <ArrowRight size={16} className="m-go" />
          </button>
        ))}
        <button className="module wide" style={{ '--c': 'var(--m-teal)' }} onClick={() => go('admin')}>
          <span className="m-icon"><Users size={20} /></span>
          <span className="m-body">
            <span className="m-top">
              <b>Administration</b>
              <Badge tone="good">Available</Badge>
            </span>
            <span className="m-desc">Manage organizations, users, permissions, tenants and billing.</span>
          </span>
          <ArrowRight size={16} className="m-go" />
        </button>
      </section>

      <section className="next-phases card">
        <div className="np-title"><ListChecks size={16} /><b>Next Phases</b><span>Additional modules coming in Phase 2</span></div>
        <button onClick={() => go('etl')}><Workflow size={15} /><span><b>ETL Studio</b><small>AI pipeline generation and transformation</small></span></button>
        <button onClick={() => go('medallion')}><Layers size={15} /><span><b>Medallion</b><small>Automated Bronze, Silver and Gold architecture</small></span></button>
      </section>
    </div>
  )
}
