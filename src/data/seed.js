// Deterministic sample data + small helpers shared by every module.

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rng(seed) {
  let a = hash(String(seed))
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const WEEKS = 52

export function makeSeries(seed, { base, trend = 0.003, vol = 0.04, anoms = [], n = WEEKS }) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < n; i++) {
    const season = 1 + 0.035 * Math.sin((i / 52) * Math.PI * 4)
    let v = base * Math.pow(1 + trend, i) * season * (1 + (r() - 0.5) * 2 * vol)
    for (const [idx, f] of anoms) if ((idx < 0 ? n + idx : idx) === i) v *= f
    out.push(v)
  }
  return out
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function weekLabels(n = WEEKS, extra = 0) {
  const out = []
  const now = new Date()
  for (let i = -(n - 1); i <= extra; i++) {
    const d = new Date(now.getTime() + i * 7 * 86400000)
    out.push(`${d.getDate()} ${MON[d.getMonth()]}`)
  }
  return out
}

export function compact(v) {
  const a = Math.abs(v)
  if (a >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (a >= 1e3) return (v / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'K'
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

export function fmt(v, unit) {
  if (v == null || Number.isNaN(v)) return '–'
  if (unit === '$') return '$' + compact(v)
  if (unit === '%') return v.toFixed(1) + '%'
  if (unit === 'x') return v.toFixed(2) + 'x'
  return compact(v)
}

export function kpiStatus(k) {
  const value = k.series[k.series.length - 1]
  const ratio = k.goodUp ? value / k.target : k.target / value
  if (ratio >= 1) return { key: 'good', label: 'On track', ratio, value }
  if (ratio >= 0.92) return { key: 'warn', label: 'At risk', ratio, value }
  return { key: 'bad', label: 'Off track', ratio, value }
}

export function detectAnomalies(series, win = 8, z = 2.3) {
  const out = []
  for (let i = win; i < series.length; i++) {
    const w = series.slice(i - win, i)
    const mean = w.reduce((a, b) => a + b, 0) / win
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - mean) ** 2, 0) / win) || 1e-9
    const zz = (series[i] - mean) / sd
    if (Math.abs(zz) > z) out.push({ index: i, z: zz, dev: (series[i] - mean) / mean })
  }
  return out
}

export function breakdown(kpi) {
  const r = rng(kpi.id + ':regions')
  const raw = ['North America', 'EMEA', 'APAC', 'LATAM'].map((label) => ({ label, w: 0.4 + r() }))
  const total = raw.reduce((a, b) => a + b.w, 0)
  const value = kpi.series[kpi.series.length - 1]
  return raw.map((p) => ({ label: p.label, share: p.w / total, value: (p.w / total) * value }))
}

const mk = (id, name, unit, base, target, goodUp, o = {}) => ({
  id,
  name,
  unit,
  target,
  goodUp,
  sourceId: o.sourceId,
  owner: o.owner,
  description: o.description,
  formula: o.formula,
  series: makeSeries(id, { base, trend: o.trend ?? 0.004, vol: o.vol ?? 0.04, anoms: o.anoms ?? [] }),
})

export const seedKpis = () => [
  mk('k-rev', 'Weekly Revenue', '$', 410000, 560000, true, {
    sourceId: 'c-sales', owner: 'Finance',
    description: 'Value of completed orders per week.',
    formula: "SUM(orders.total_amount) WHERE orders.status = 'completed'",
    trend: 0.0045, anoms: [[-9, 0.78]],
  }),
  mk('k-gm', 'Gross Margin', '%', 40.5, 44, true, {
    sourceId: 'c-sales', owner: 'Finance', vol: 0.015, trend: 0.0012,
    description: 'Share of revenue left after cost of goods.',
    formula: '(SUM(revenue) - SUM(cogs)) / SUM(revenue) * 100',
  }),
  mk('k-cust', 'Active Customers', '#', 12400, 15500, true, {
    sourceId: 'c-sales', owner: 'Growth', vol: 0.012, trend: 0.0038,
    description: 'Customers with at least one order in the last 90 days.',
    formula: 'COUNT(DISTINCT customer_id) WHERE last_order_at >= NOW() - INTERVAL 90 DAY',
  }),
  mk('k-churn', 'Churn Rate', '%', 3.1, 2.6, false, {
    sourceId: 'c-sales', owner: 'Customer Success', vol: 0.03, trend: 0.0006,
    description: 'Customers lost in the week as a share of customers at week start.',
    formula: 'COUNT(churned_customers) / COUNT(customers_at_start) * 100',
    anoms: [[-4, 1.5]],
  }),
  mk('k-aov', 'Average Order Value', '$', 186, 205, true, {
    sourceId: 'c-sales', owner: 'Merchandising', vol: 0.02, trend: 0.0018,
    description: 'Revenue divided by number of completed orders.',
    formula: 'SUM(order_total) / COUNT(order_id)',
  }),
  mk('k-pipe', 'Pipeline Coverage', 'x', 3.0, 3.5, true, {
    sourceId: 'c-sfdc', owner: 'Sales Ops', vol: 0.03, trend: 0.0016,
    description: 'Open pipeline value divided by remaining quota.',
    formula: 'SUM(opportunity.amount) WHERE is_closed = false / SUM(quota_remaining)',
  }),
  mk('k-web', 'Web Sessions', '#', 86000, 105000, true, {
    sourceId: 'c-ga', owner: 'Marketing', vol: 0.05, trend: 0.0028,
    description: 'Sessions recorded on the storefront.',
    formula: 'SUM(sessions) GROUP BY week',
    anoms: [[-3, 1.38]],
  }),
]

export const seedConnections = () => {
  const now = Date.now()
  return [
    {
      id: 'c-sales', connectorId: 'postgres', name: 'Acme Sales Database',
      desc: 'Production PostgreSQL database for sales data', status: 'connected',
      syncedAt: now - 10 * 60e3, records: 2400000,
      meta: { host: 'db.acme.com', port: 5432, database: 'sales_db', schema: 'public', username: 'qmind_user', sslmode: 'require', timeout: 30, poolSize: 5 },
    },
    {
      id: 'c-sfdc', connectorId: 'salesforce', name: 'Salesforce CRM',
      desc: 'Accounts, opportunities and leads', status: 'connected',
      syncedAt: now - 15 * 60e3, records: 1800000,
      meta: { environment: 'Production', instanceUrl: 'https://acme.my.salesforce.com', authFlow: 'OAuth 2.0 (client credentials)', clientId: '3MVG9-acme-consumer-key', apiVersion: 'v60.0', bulkApi: true },
    },
    {
      id: 'c-files', connectorId: 'excel', name: 'Marketing Files',
      desc: 'Campaign spend spreadsheets', status: 'connected',
      syncedAt: now - 60 * 60e3, records: 420000,
      meta: { file: 'marketing_2026.xlsx', sheetName: 'Spend', delimiter: ',', hasHeader: true, encoding: 'UTF-8' },
    },
    {
      id: 'c-ga', connectorId: 'ga', name: 'Google Analytics',
      desc: 'Storefront web analytics', status: 'connected',
      syncedAt: now - 3 * 3600e3, records: 850000,
      meta: { propertyId: '412887120', startDate: '2024-01-01', dimensions: 'date, country, sessionSource' },
    },
  ]
}

export const seedWidgets = () => [
  { id: 'w1', type: 'tile', kpiId: 'k-rev' },
  { id: 'w2', type: 'tile', kpiId: 'k-gm' },
  { id: 'w3', type: 'tile', kpiId: 'k-cust' },
  { id: 'w4', type: 'tile', kpiId: 'k-churn' },
  { id: 'w5', type: 'line', kpiId: 'k-rev' },
  { id: 'w6', type: 'donut', kpiId: 'k-rev' },
  { id: 'w7', type: 'bar', kpiId: 'k-web' },
]

export const seedPipelines = () => {
  const now = Date.now()
  return [
    { id: 'p1', name: 'Sales orders sync', source: 'Acme Sales Database', target: 'Gold · sales_mart', schedule: 'Hourly', status: 'success', lastRun: now - 12 * 60e3, duration: 94, rows: 128400, paused: false },
    { id: 'p2', name: 'CRM pipeline refresh', source: 'Salesforce CRM', target: 'Gold · pipeline_mart', schedule: 'Every 6 hours', status: 'failed', lastRun: now - 55 * 60e3, duration: 12, rows: 0, paused: false, error: 'INVALID_SESSION_ID: the Salesforce access token expired. Re-save the credentials in Connectors.' },
    { id: 'p3', name: 'Marketing spend load', source: 'Marketing Files', target: 'Silver · marketing_spend', schedule: 'Daily', status: 'success', lastRun: now - 5 * 3600e3, duration: 31, rows: 18200, paused: false },
    { id: 'p4', name: 'Web analytics import', source: 'Google Analytics', target: 'Silver · web_sessions', schedule: 'Daily', status: 'success', lastRun: now - 7 * 3600e3, duration: 58, rows: 402000, paused: false },
    { id: 'p5', name: 'Customer 360 build', source: 'Acme Sales Database', target: 'Gold · customer_360', schedule: 'Weekly', status: 'success', lastRun: now - 2 * 86400e3, duration: 301, rows: 1180000, paused: true },
  ]
}

export const seedChecks = () => [
  { id: 'q1', name: 'orders.order_id is unique', table: 'orders', result: 'pass', detail: '2.4M rows checked' },
  { id: 'q2', name: 'customers.email is not null', table: 'customers', result: 'warn', detail: '0.8% null, threshold 0.5%' },
  { id: 'q3', name: 'payments.amount ≥ 0', table: 'payments', result: 'pass', detail: '1.9M rows checked' },
  { id: 'q4', name: 'opportunity.close_date within 2 years', table: 'Opportunity', result: 'fail', detail: '312 rows out of range' },
  { id: 'q5', name: 'Schema drift on sales_db', table: 'sales_db', result: 'pass', detail: 'No changes since last run' },
]

export const ROLES = ['Administrator', 'Data Engineer', 'Data Analyst', 'Data Steward', 'Business User']

export const seedUsers = () => [
  { id: 'u1', name: 'Priya Nair', email: 'priya.nair@acme.com', role: 'Administrator', status: 'Active' },
  { id: 'u2', name: 'Arjun Mehta', email: 'arjun.mehta@acme.com', role: 'Data Engineer', status: 'Active' },
  { id: 'u3', name: 'Sara Khan', email: 'sara.khan@acme.com', role: 'Data Analyst', status: 'Active' },
  { id: 'u4', name: 'Daniel Ortiz', email: 'daniel.ortiz@acme.com', role: 'Data Steward', status: 'Active' },
  { id: 'u5', name: 'Meera Iyer', email: 'meera.iyer@acme.com', role: 'Business User', status: 'Active' },
  { id: 'u6', name: 'Rahul Verma', email: 'rahul.verma@acme.com', role: 'Business User', status: 'Invited' },
]

export const ORGS = [
  { id: 'acme', name: 'Acme Corp', sub: 'All Projects', projects: 6, users: 24 },
  { id: 'globex', name: 'Globex Retail', sub: '3 projects', projects: 3, users: 11 },
  { id: 'initech', name: 'Initech Finance', sub: '2 projects', projects: 2, users: 7 },
]
