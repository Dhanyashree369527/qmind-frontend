import { useState } from 'react'
import { Bell, Check, Layers, Workflow } from '../components/icons'
import { PageHeader, Badge } from '../components/ui'
import { useStore } from '../store'

const COPY = {
  etl: {
    title: 'ETL Studio',
    sub: 'AI-powered pipeline generation and data transformation',
    icon: Workflow,
    features: [
      ['Describe a pipeline in plain English', 'The ETL Planner agent turns the request into extract, transform and load steps.'],
      ['Visual pipeline builder', 'Drag sources, transformations and targets onto a canvas and review generated SQL.'],
      ['Transformation logic suggestions', 'Profiling results from the Data Discovery agent drive cleaning and join suggestions.'],
      ['Validation before deploy', 'The Validation agent checks code, data quality and security rules.'],
    ],
  },
  medallion: {
    title: 'Medallion',
    sub: 'Automated Bronze, Silver and Gold warehouse architecture',
    icon: Layers,
    features: [
      ['Bronze: raw landing', 'Ingested data is stored as delivered with full history.'],
      ['Silver: cleaned and conformed', 'Types, keys and deduplication are applied automatically.'],
      ['Gold: business-ready marts', 'Dimensional models and KPI tables feed dashboards and Copilot.'],
      ['Lineage across layers', 'Trace any KPI back to the source column that produced it.'],
    ],
  },
}

export default function PhasePage({ kind, go }) {
  const c = COPY[kind]
  const { toast } = useStore()
  const [on, setOn] = useState(false)
  return (
    <div className="page">
      <PageHeader title={c.title} sub={c.sub}>
        <Badge tone="purple">Coming in Phase 2</Badge>
      </PageHeader>
      <section className="card phase">
        <c.icon size={28} />
        <h2>Planned for Phase 2</h2>
        <p>This module is not available yet. Here is what it will do.</p>
        <ul>
          {c.features.map(([t, d]) => (
            <li key={t}>
              <b>{t}</b>
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <div className="row">
          <button
            className={`btn ${on ? '' : 'primary'}`}
            onClick={() => {
              setOn(!on)
              toast(on ? 'Notification removed' : `We will notify you when ${c.title} is released`)
            }}
          >
            {on ? <Check size={15} /> : <Bell size={15} />}
            {on ? 'You will be notified' : 'Notify me'}
          </button>
          <button className="btn" onClick={() => go('connectors')}>Start with Connectors</button>
        </div>
      </section>
    </div>
  )
}
