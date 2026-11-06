import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen, Check, CheckCircle2, ChevronDown, Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Plus,
  PlugZap, RefreshCw, Search, ShieldCheck, Trash2, Upload, X, XCircle,
} from '../components/icons'
import { CATEGORIES, CONNECTORS, GROUP_OF, SAMPLE_TABLES, getConnector } from '../data/connectors'
import { ago, useStore } from '../store'
import { Badge, Glyph, Toggle } from '../components/ui'
import { BarChart } from '../components/Charts'
import { compact, rng } from '../data/seed'

const allFields = (c) => [...c.fields, ...(c.advanced || [])]
const isVisible = (f, v) => {
  if (!f.showIf) return true
  const cur = v[f.showIf.key]
  return Array.isArray(f.showIf.eq) ? f.showIf.eq.includes(cur) : cur === f.showIf.eq
}

function initialValues(c, editing) {
  const v = {}
  for (const f of allFields(c)) {
    v[f.key] = f.default ?? (f.type === 'toggle' ? false : f.type === 'select' ? f.options[0] : '')
  }
  if (editing) Object.assign(v, editing.meta)
  return v
}

/* ---------------------------------------------------------------- field */
function FieldInput({ f, id, value, onChange, error, editing }) {
  const [show, setShow] = useState(false)
  const saved = editing && f.secret
  const ph = saved ? '•••••••• saved, leave blank to keep' : f.placeholder
  let control
  if (f.type === 'select') {
    control = (
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  } else if (f.type === 'textarea') {
    control = (
      <textarea
        id={id}
        className={`input ${f.secret ? 'mono' : ''}`}
        rows={f.secret ? 4 : 3}
        value={value}
        placeholder={ph}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    )
  } else if (f.type === 'password') {
    control = (
      <div className="pw">
        <input
          id={id}
          className="input"
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={ph}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
        <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide value' : 'Show value'}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    )
  } else if (f.type === 'toggle') {
    return <Toggle id={id} checked={!!value} onChange={onChange} label={f.label} />
  } else if (f.type === 'file') {
    control = (
      <label className={`drop ${value ? 'has' : ''}`} htmlFor={id}>
        <Upload size={16} />
        <span>{value ? value : 'Choose a file or drop it here'}</span>
        <input id={id} type="file" accept={f.accept} onChange={(e) => onChange(e.target.files?.[0]?.name || '')} />
      </label>
    )
  } else {
    control = (
      <input
        id={id}
        className="input"
        type={f.type}
        value={value}
        placeholder={ph}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    )
  }
  return (
    <div className={`field ${error ? 'err' : ''}`}>
      <label htmlFor={id}>
        {f.label}
        {f.required && !saved && <i title="Required"> *</i>}
      </label>
      {control}
      {error && <small className="field-err">{error}</small>}
    </div>
  )
}

/* ------------------------------------------------------------- the form */
function ConnectorForm({ connector: c, editing, initialTab, onSave, onClose, kpis }) {
  const [name, setName] = useState(editing?.name ?? '')
  const [desc, setDesc] = useState(editing?.desc ?? '')
  const [values, setValues] = useState(() => initialValues(c, editing))
  const [errors, setErrors] = useState({})
  const [adv, setAdv] = useState(false)
  const [tab, setTab] = useState(initialTab || 'Configuration')
  const [test, setTest] = useState({ state: 'idle' })
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const set = (k, v) => {
    setValues((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
    if (test.state !== 'idle') setTest({ state: 'idle' })
  }

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.__name = 'Give this connection a name'
    for (const f of allFields(c)) {
      if (!isVisible(f, values) || !f.required) continue
      if (editing && f.secret) continue
      if (f.type === 'toggle') continue
      if (String(values[f.key] ?? '').trim() === '') errs[f.key] = `${f.label} is required`
    }
    return errs
  }

  const runTest = () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) {
      setTest({ state: 'fail', msg: 'Fill in the highlighted fields, then test again.' })
      return
    }
    setTest({ state: 'testing' })
    timer.current = setTimeout(() => {
      const rejected = allFields(c).some((f) => f.secret && isVisible(f, values) && /^(bad|wrong|invalid)/i.test(String(values[f.key] || '')))
      if (rejected) {
        setTest({ state: 'fail', msg: 'Authentication failed (401). The server rejected these credentials.' })
      } else {
        setTest({ state: 'ok', ms: 70 + Math.round(Math.random() * 170), info: c.testInfo })
      }
    }, 1100)
  }

  const save = () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) {
      setTest({ state: 'fail', msg: 'Fix the highlighted fields before saving.' })
      return
    }
    const meta = {}
    for (const f of allFields(c)) if (!f.secret && isVisible(f, values)) meta[f.key] = values[f.key]
    const r = rng(c.id + name)
    onSave({
      connectorId: c.id,
      name: name.trim(),
      desc: desc.trim(),
      meta,
      records: editing?.records ?? Math.round(120000 + r() * 2600000),
    })
  }

  const visibleMain = c.fields.filter((f) => isVisible(f, values))
  const visibleAdv = (c.advanced || []).filter((f) => isVisible(f, values))
  const tables = SAMPLE_TABLES[c.category] || []
  const usedBy = editing ? kpis.filter((k) => k.sourceId === editing.id) : []
  const usage = useMemo(() => {
    const r = rng(c.id + 'usage')
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({ label: d, value: Math.round(80 + r() * 420) }))
  }, [c.id])

  const needSaved = (
    <p className="muted pad">Save this connection first. Schema, profile, lineage and usage appear once it is connected.</p>
  )

  return (
    <div className="panel-inner">
      <header className="panel-head">
        <Glyph text={c.glyph} color={c.color} size={42} />
        <div className="ph-text">
          <h2>{c.name}</h2>
          <span>{c.sub}</span>
        </div>
        {editing ? <Badge tone="good" dot>Connected</Badge> : <Badge dot>Not connected</Badge>}
        <button className="icon-btn only-narrow" onClick={onClose} aria-label="Close panel"><X size={16} /></button>
      </header>

      <div className="tabs" role="tablist">
        {['Configuration', 'Schema', 'Profile', 'Lineage', 'Usage'].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="panel-body">
        {tab === 'Configuration' && (
          <>
            <div className="auth-chip"><ShieldCheck size={14} /> Sign-in method: <b>{c.auth}</b></div>

            <div className={`field ${errors.__name ? 'err' : ''}`}>
              <label htmlFor="f-name">Connection name <i> *</i></label>
              <input id="f-name" className="input" value={name} placeholder={`e.g. Acme ${c.name}`} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, __name: undefined })) }} />
              {errors.__name && <small className="field-err">{errors.__name}</small>}
            </div>
            <div className="field">
              <label htmlFor="f-desc">Description</label>
              <textarea id="f-desc" className="input" rows={2} value={desc} placeholder="What is this connection used for?" onChange={(e) => setDesc(e.target.value)} />
            </div>

            <div className="fields">
              {visibleMain.map((f) => (
                <div key={f.key} className={f.half ? 'half' : 'full'}>
                  <FieldInput f={f} id={`f-${f.key}`} value={values[f.key]} onChange={(v) => set(f.key, v)} error={errors[f.key]} editing={editing} />
                </div>
              ))}
            </div>

            {(c.advanced || []).length > 0 && (
              <div className="adv">
                <button type="button" className="adv-toggle" onClick={() => setAdv((a) => !a)} aria-expanded={adv}>
                  <ChevronDown size={14} className={adv ? 'rot' : ''} /> Advanced options
                </button>
                {adv && (
                  <div className="fields">
                    {visibleAdv.map((f) => (
                      <div key={f.key} className={f.half || f.type === 'toggle' ? 'half' : 'full'}>
                        <FieldInput f={f} id={`f-${f.key}`} value={values[f.key]} onChange={(v) => set(f.key, v)} error={errors[f.key]} editing={editing} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {test.state === 'testing' && <div className="result testing"><Loader2 size={15} className="spin" /> Testing connection…</div>}
            {test.state === 'ok' && (
              <div className="result ok">
                <CheckCircle2 size={16} />
                <span><b>Connection successful</b> · {test.ms} ms<br /><small>{test.info}</small></span>
              </div>
            )}
            {test.state === 'fail' && (
              <div className="result fail" role="alert">
                <XCircle size={16} />
                <span><b>Could not connect</b><br /><small>{test.msg}</small></span>
              </div>
            )}
            <p className="demo-note">Demo environment: credentials stay in this browser tab. Secret values are not saved or sent anywhere.</p>
          </>
        )}

        {tab === 'Schema' && (editing ? (
          <ul className="plain-list">
            {tables.map(([t, cols]) => (
              <li key={t}><b className="mono">{t}</b><span>{cols} columns</span></li>
            ))}
          </ul>
        ) : needSaved)}

        {tab === 'Profile' && (editing ? (
          <div className="stat-grid">
            <div><small>Records</small><b>{compact(editing.records)}</b></div>
            <div><small>Tables</small><b>{tables.length}</b></div>
            <div><small>Null rate</small><b>{(rng(c.id + 'n')() * 3 + 0.4).toFixed(1)}%</b></div>
            <div><small>Last sync</small><b>{ago(editing.syncedAt)}</b></div>
          </div>
        ) : needSaved)}

        {tab === 'Lineage' && (editing ? (
          <div className="lineage">
            <div className="ln"><b>{editing.name}</b><small>Source</small></div>
            <span>→</span>
            <div className="ln dim"><b>Bronze · Silver · Gold</b><small>Phase 2</small></div>
            <span>→</span>
            <div className="ln">
              <b>{usedBy.length} KPI{usedBy.length === 1 ? '' : 's'}</b>
              <small>{usedBy.length ? usedBy.map((k) => k.name).join(', ') : 'None yet'}</small>
            </div>
          </div>
        ) : needSaved)}

        {tab === 'Usage' && (editing ? (
          <>
            <p className="muted">Queries per day, last 7 days</p>
            <BarChart data={usage} color={c.color} />
          </>
        ) : needSaved)}
      </div>

      {tab === 'Configuration' && (
        <footer className="panel-foot">
          <button className="btn" onClick={runTest} disabled={test.state === 'testing'}>
            <PlugZap size={15} /> Test connection
          </button>
          <button className="btn primary" onClick={save} disabled={test.state === 'testing'}>
            <Check size={15} /> {editing ? 'Update connection' : 'Save connection'}
          </button>
        </footer>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- page */
export default function Connectors() {
  const { connections, addConnection, updateConnection, removeConnection, syncConnection, syncAll, kpis, toast } = useStore()
  const [tab, setTab] = useState('All Connectors')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState('postgres')
  const [editId, setEditId] = useState(null)
  const [tabHint, setTabHint] = useState({ tab: 'Configuration', n: 0 })
  const [drawer, setDrawer] = useState(false)
  const [filter, setFilter] = useState('All')
  const [menu, setMenu] = useState(null)
  const [newMenu, setNewMenu] = useState(false)
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const connected = useMemo(() => new Set(connections.map((c) => c.connectorId)), [connections])
  const list = CONNECTORS.filter(
    (c) => (tab === 'All Connectors' || c.category === tab) && (c.name + c.sub).toLowerCase().includes(q.toLowerCase())
  )
  const connector = getConnector(sel)
  const editing = connections.find((c) => c.id === editId) || null

  const pick = (id) => {
    setSel(id)
    setEditId(null)
    setTabHint((h) => ({ tab: 'Configuration', n: h.n + 1 }))
    setDrawer(true)
  }
  const open = (conn, t) => {
    setSel(conn.connectorId)
    setEditId(conn.id)
    setTabHint((h) => ({ tab: t, n: h.n + 1 }))
    setDrawer(true)
  }

  const onSave = (data) => {
    if (editing) {
      updateConnection(editing.id, data)
      toast(`${data.name} updated`)
    } else {
      const conn = addConnection(data)
      setEditId(conn.id)
      setTabHint((h) => ({ tab: 'Configuration', n: h.n + 1 }))
      toast(`${data.name} connected`)
    }
  }

  const rows = connections.filter((c) => {
    if (filter === 'All') return true
    return GROUP_OF[getConnector(c.connectorId)?.category] === filter
  })
  const count = (g) => connections.filter((c) => g === 'All' || GROUP_OF[getConnector(c.connectorId)?.category] === g).length

  return (
    <div className="page connectors">
      <header className="page-head">
        <div>
          <h1>Connectors</h1>
          <p>Connect and manage your data sources from databases, SaaS applications, files and APIs</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => toast('Documentation opens in the full product', 'ok')}><BookOpen size={15} /> View documentation</button>
          <div className="dropdown">
            <button className="btn primary" onClick={() => setNewMenu((v) => !v)} aria-expanded={newMenu}>
              <Plus size={15} /> New connection <ChevronDown size={14} />
            </button>
            {newMenu && (
              <>
                <div className="scrim clear" onClick={() => setNewMenu(false)} />
                <ul className="menu">
                  {CATEGORIES.slice(1).map((cat) => (
                    <li key={cat}>
                      <button onClick={() => { setTab(cat); setNewMenu(false); const first = CONNECTORS.find((c) => c.category === cat); if (first) pick(first.id) }}>
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="conn-layout">
        <section className="conn-main">
          <div className="conn-bar">
            <div className="tabs scroll" role="tablist" aria-label="Connector categories">
              {CATEGORIES.map((c) => (
                <button key={c} role="tab" aria-selected={tab === c} className={tab === c ? 'on' : ''} onClick={() => setTab(c)}>{c}</button>
              ))}
            </div>
            <label className="search">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search connectors…" aria-label="Search connectors" />
            </label>
          </div>

          <div className="tiles">
            {list.map((c) => (
              <button key={c.id} className={`tile ${sel === c.id ? 'on' : ''}`} onClick={() => pick(c.id)} aria-pressed={sel === c.id}>
                {connected.has(c.id) && <span className="tick" title="Connection saved"><Check size={11} /></span>}
                <Glyph text={c.glyph} color={c.color} size={38} />
                <b>{c.name}</b>
                <small>{c.sub}</small>
              </button>
            ))}
            {list.length === 0 && <p className="muted pad">No connectors match “{q}”.</p>}
          </div>
        </section>

        {drawer && <div className="scrim only-narrow-block" onClick={() => setDrawer(false)} />}
        <aside className={`panel card ${drawer ? 'open' : ''}`} aria-label="Connector settings">
          {connector ? (
            <ConnectorForm
              key={`${sel}:${editId}:${tabHint.n}`}
              connector={connector}
              editing={editing}
              initialTab={tabHint.tab}
              onSave={onSave}
              onClose={() => setDrawer(false)}
              kpis={kpis}
            />
          ) : null}
        </aside>
      </div>

      <section className="card yours">
        <div className="yours-head">
          <h2>Your connections</h2>
          <div className="pills" role="tablist" aria-label="Filter connections">
            {['All', 'Databases', 'SaaS', 'Files', 'Other'].map((g) => (
              <button key={g} role="tab" aria-selected={filter === g} className={filter === g ? 'on' : ''} onClick={() => setFilter(g)}>
                {g} ({count(g)})
              </button>
            ))}
          </div>
          <button className="btn" onClick={syncAll}><RefreshCw size={14} /> Refresh</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Status</th><th>Last sync</th><th className="num">Records</th><th className="act">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const k = getConnector(c.connectorId)
                return (
                  <tr key={c.id}>
                    <td><span className="cell"><Glyph text={k.glyph} color={k.color} size={24} /><b>{c.name}</b></span></td>
                    <td>{k.name}</td>
                    <td><Badge tone="good" dot>Connected</Badge></td>
                    <td>{ago(c.syncedAt)}</td>
                    <td className="num mono">{compact(c.records)}</td>
                    <td className="act">
                      <button className="icon-btn" aria-label={`View ${c.name}`} title="View schema" onClick={() => open(c, 'Schema')}><Eye size={15} /></button>
                      <button className="icon-btn" aria-label={`Edit ${c.name}`} title="Edit credentials" onClick={() => open(c, 'Configuration')}><Pencil size={15} /></button>
                      <span className="dropdown">
                        <button className="icon-btn" aria-label={`More actions for ${c.name}`} onClick={() => setMenu(menu === c.id ? null : c.id)}><MoreHorizontal size={15} /></button>
                        {menu === c.id && (
                          <>
                            <div className="scrim clear" onClick={() => setMenu(null)} />
                            <ul className="menu right">
                              <li><button onClick={() => { syncConnection(c.id); setMenu(null) }}><RefreshCw size={14} /> Sync now</button></li>
                              <li><button className="danger" onClick={() => { removeConnection(c.id); if (editId === c.id) setEditId(null); setMenu(null); toast(`${c.name} removed`) }}><Trash2 size={14} /> Delete</button></li>
                            </ul>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="muted pad">No connections in this group yet. Pick a connector above and save it.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
