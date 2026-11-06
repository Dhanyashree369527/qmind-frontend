import { useState } from 'react'
import { PageHeader } from '../components/ui'

const LAYERS = [
  { id: 'user', name: 'User layer', sub: 'Who uses QMind', c: '--m-blue', items: [['Business Users', 'View dashboards, ask questions'], ['Data Analysts', 'Build KPIs, self-service analytics'], ['Data Engineers', 'Build pipelines, manage models'], ['Data Stewards', 'Manage governance, classify data'], ['Administrators', 'Tenants, users, permissions']] },
  { id: 'pres', name: 'Presentation layer', sub: 'Interfaces and experiences', c: '--m-green', items: [['Web application', 'Next.js + React'], ['AI Copilot', 'Conversational interface'], ['Visual builders', 'Pipeline, dashboard, KPI'], ['Dashboards & analytics', 'Drill-down, what-if']] },
  { id: 'ai', name: 'AI intelligence layer', sub: 'LangGraph agents', c: '--m-purple', items: [['Data Discovery agent', 'Connectors, schema, profiling'], ['ETL Planner agent', 'Pipelines, medallion modelling'], ['KPI Designer agent', 'Metrics, semantic modelling'], ['Dashboard agent', 'Chart selection, layout'], ['Insight Analyst agent', 'Anomalies, drivers'], ['Governance agent', 'PII, policies'], ['Validation agent', 'Code and quality checks'], ['LLM gateway', 'OpenAI, Anthropic, Azure, local']] },
  { id: 'app', name: 'Application layer', sub: 'Core services and APIs', c: '--m-blue', items: [['API gateway', 'FastAPI'], ['Metadata service', 'Catalog, lineage'], ['Pipeline service', 'Execution scheduling'], ['Semantic service', 'KPI calculations'], ['Dashboard service', 'Sharing, export'], ['Governance service', 'PII, audit'], ['Intelligence service', 'Forecasting, what-if']] },
  { id: 'exec', name: 'Execution layer', sub: 'Data processing', c: '--m-pink', items: [['Pipeline engine', 'Ingest → Bronze → Silver → Gold'], ['Processing frameworks', 'DuckDB, Spark, streaming'], ['Scheduling', 'Dependencies, alerts'], ['Data quality', 'Checks, schema validation']] },
  { id: 'store', name: 'Data storage layer', sub: 'Lakehouse and metadata', c: '--m-orange', items: [['Operational DB', 'PostgreSQL'], ['Data lake / lakehouse', 'Iceberg on S3'], ['Metadata store', 'Schemas, lineage'], ['Feature store', 'Time series, ML features'], ['Cache & queue', 'Redis']] },
  { id: 'src', name: 'Data sources layer', sub: 'Connect to any source', c: '--m-teal', items: [['Databases', 'PostgreSQL, MySQL, SQL Server, Oracle'], ['Cloud applications', 'Salesforce, SAP, Dynamics 365'], ['Files & storage', 'CSV, Parquet, S3, ADLS'], ['Streaming', 'Kafka, Kinesis, Event Hubs'], ['APIs', 'REST, GraphQL'], ['Other sources', 'ERP, CRM, IoT']] },
]

const SIDE = [
  { name: 'Integrations', items: ['SSO / identity providers', 'Cloud storage', 'LLM providers', 'Notification services', 'Business tools', 'Customer systems'] },
  { name: 'Security, governance & operations', items: ['Authentication & authorization', 'Data governance', 'PII detection & protection', 'Audit & compliance', 'Monitoring & observability', 'Multi-tenancy', 'Encryption', 'Data retention & lifecycle'] },
]

export default function Architecture() {
  const [pick, setPick] = useState(null)
  return (
    <div className="page">
      <PageHeader title="Platform architecture" sub="Seven layers from user experience down to data sources. Select a component to see its role." />
      <div className="arch">
        <div className="arch-layers">
          {LAYERS.map((l) => (
            <section key={l.id} className="layer" style={{ '--c': `var(${l.c})` }}>
              <header>
                <b>{l.name}</b>
                <small>{l.sub}</small>
              </header>
              <div className="layer-items">
                {l.items.map(([n, d]) => {
                  const key = `${l.id}:${n}`
                  return (
                    <button key={key} className={pick === key ? 'on' : ''} onClick={() => setPick(pick === key ? null : key)} aria-pressed={pick === key}>
                      <b>{n}</b>
                      {pick === key && <span>{d}</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
        <div className="arch-side">
          {SIDE.map((s) => (
            <section key={s.name} className="card">
              <h3>{s.name}</h3>
              <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
