import { useState } from 'react'
import { Building2, Mail, Trash2, UserPlus } from '../components/icons'
import { PageHeader, Badge, Modal, Segmented } from '../components/ui'
import { ORGS, ROLES, seedUsers } from '../data/seed'
import { newId, useStore } from '../store'

const MODULES = ['Connectors', 'KPI Studio', 'Dashboards', 'Intelligence', 'Copilot', 'Operations', 'Administration']
const DEFAULT_PERMS = {
  Administrator: [1, 1, 1, 1, 1, 1, 1],
  'Data Engineer': [1, 1, 1, 0, 1, 1, 0],
  'Data Analyst': [0, 1, 1, 1, 1, 0, 0],
  'Data Steward': [1, 1, 0, 1, 0, 1, 0],
  'Business User': [0, 0, 1, 0, 1, 0, 0],
}

function Invite({ onClose, onInvite }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLES[2])
  const [err, setErr] = useState('')
  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Enter a valid email address'); return }
    onInvite(email.trim(), role)
  }
  return (
    <Modal title="Invite user" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={submit}><Mail size={14} /> Send invite</button></>}>
      <div className={`field ${err ? 'err' : ''}`}>
        <label htmlFor="inv-email">Email <i>*</i></label>
        <input id="inv-email" className="input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} placeholder="name@company.com" />
        {err && <small className="field-err">{err}</small>}
      </div>
      <div className="field">
        <label htmlFor="inv-role">Role</label>
        <select id="inv-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
      </div>
    </Modal>
  )
}

export default function Administration() {
  const { toast, orgId, setOrgId } = useStore()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState(seedUsers)
  const [inviting, setInviting] = useState(false)
  const [perms, setPerms] = useState(DEFAULT_PERMS)
  const [plan, setPlan] = useState('Business')

  return (
    <div className="page">
      <PageHeader title="Administration" sub="Manage organizations, users, permissions, tenants and billing">
        <Segmented value={tab} onChange={setTab} label="Section" options={[{ value: 'users', label: 'Users' }, { value: 'tenants', label: 'Tenants' }, { value: 'roles', label: 'Permissions' }, { value: 'billing', label: 'Billing' }]} />
      </PageHeader>

      {tab === 'users' && (
        <section className="card">
          <div className="yours-head"><h2>Users</h2><button className="btn primary" onClick={() => setInviting(true)}><UserPlus size={15} /> Invite user</button></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Role</th><th>Status</th><th className="act">Actions</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><span className="cell"><span className="avatar">{u.name.split(' ').map((p) => p[0]).join('')}</span><span><b>{u.name}</b><small className="sub">{u.email}</small></span></span></td>
                    <td>
                      <select className="input slim" value={u.role} aria-label={`Role for ${u.name}`} onChange={(e) => { setUsers((l) => l.map((x) => (x.id === u.id ? { ...x, role: e.target.value } : x))); toast(`${u.name} is now ${e.target.value}`) }}>
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td><Badge tone={u.status === 'Active' ? 'good' : 'warn'} dot>{u.status}</Badge></td>
                    <td className="act"><button className="icon-btn" aria-label={`Remove ${u.name}`} onClick={() => { setUsers((l) => l.filter((x) => x.id !== u.id)); toast(`${u.name} removed`) }}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'tenants' && (
        <section className="tenants">
          {ORGS.map((o) => (
            <article key={o.id} className={`card tenant ${o.id === orgId ? 'on' : ''}`}>
              <Building2 size={20} />
              <div><h3>{o.name}</h3><p className="muted">{o.projects} projects · {o.users} users</p></div>
              {o.id === orgId ? <Badge tone="good" dot>Current</Badge> : <button className="btn" onClick={() => { setOrgId(o.id); toast(`Switched to ${o.name}`) }}>Switch</button>}
            </article>
          ))}
        </section>
      )}

      {tab === 'roles' && (
        <section className="card">
          <div className="yours-head"><h2>Module access by role</h2><span className="muted">Select a box to grant or remove access</span></div>
          <div className="table-wrap">
            <table className="table matrix">
              <thead><tr><th>Role</th>{MODULES.map((m) => <th key={m} className="c">{m}</th>)}</tr></thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r}>
                    <td><b>{r}</b></td>
                    {MODULES.map((m, i) => (
                      <td key={m} className="c">
                        <input type="checkbox" id={`perm-${r}-${i}`} aria-label={`${r} can use ${m}`} checked={!!perms[r][i]} disabled={r === 'Administrator'} onChange={() => setPerms((p) => ({ ...p, [r]: p[r].map((v, j) => (j === i ? (v ? 0 : 1) : v)) }))} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'billing' && (
        <section className="billing">
          <article className="card">
            <h2>Plan</h2>
            <div className="plans" role="radiogroup" aria-label="Plan">
              {[['Team', '$499', '10 users · 5 connections'], ['Business', '$1,499', '50 users · unlimited connections'], ['Enterprise', 'Custom', 'SSO · dedicated tenant']].map(([n, p, d]) => (
                <button key={n} role="radio" aria-checked={plan === n} className={plan === n ? 'on' : ''} onClick={() => { setPlan(n); toast(`Plan changed to ${n}`) }}>
                  <b>{n}</b><span className="big">{p}<small>{p !== 'Custom' ? '/mo' : ''}</small></span><small>{d}</small>
                </button>
              ))}
            </div>
          </article>
          <article className="card">
            <h2>Usage this month</h2>
            {[['Users', users.length, plan === 'Team' ? 10 : 50], ['Connections', 4, plan === 'Team' ? 5 : 40], ['AI Copilot queries', 2310, 5000]].map(([n, v, max]) => (
              <div key={n} className="usage">
                <span>{n}</span><div className="bar-track"><i className={v / max > 0.9 ? 'neg' : 'pos'} style={{ width: `${Math.min(100, (v / max) * 100)}%` }} /></div><b className="mono">{v} / {max}</b>
              </div>
            ))}
          </article>
        </section>
      )}

      {inviting && (
        <Invite
          onClose={() => setInviting(false)}
          onInvite={(email, role) => {
            setUsers((l) => [...l, { id: newId('u'), name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), email, role, status: 'Invited' }])
            setInviting(false)
            toast(`Invitation sent to ${email}`)
          }}
        />
      )}
    </div>
  )
}
