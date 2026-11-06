import { useEffect, useState } from 'react'
import {
  Activity, Building2, Check, ChevronDown, Home as HomeIcon, Layers, LayoutDashboard, Lock, Menu, MessageSquare,
  Moon, Network, Plug, Brain, Sun, Target, Users, Workflow, X,
} from './components/icons'
import { useStore } from './store'
import { ORGS } from './data/seed'
import Home from './pages/Home'
import Connectors from './pages/Connectors'
import KpiStudio from './pages/KpiStudio'
import Dashboards from './pages/Dashboards'
import Intelligence from './pages/Intelligence'
import Copilot from './pages/Copilot'
import Operations from './pages/Operations'
import Administration from './pages/Administration'
import PhasePage from './pages/PhasePage'
import Architecture from './pages/Architecture'

export const NAV = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'connectors', label: 'Connectors', icon: Plug },
  { id: 'etl', label: 'ETL Studio', icon: Workflow, phase: 2 },
  { id: 'medallion', label: 'Medallion', icon: Layers, phase: 2 },
  { id: 'kpi', label: 'KPI Studio', icon: Target },
  { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'copilot', label: 'Copilot', icon: MessageSquare },
  { id: 'operations', label: 'Operations', icon: Activity },
  { id: 'admin', label: 'Administration', icon: Users },
]

const ALL_IDS = [...NAV.map((n) => n.id), 'architecture']

function readHash() {
  try {
    const h = window.location.hash.replace('#', '')
    return ALL_IDS.includes(h) ? h : 'home'
  } catch {
    return 'home'
  }
}

export default function App() {
  const { theme, toggleTheme, orgId, setOrgId, toasts, toast } = useStore()
  const [page, setPage] = useState(readHash)
  const [menu, setMenu] = useState(false)
  const [orgMenu, setOrgMenu] = useState(false)
  const org = ORGS.find((o) => o.id === orgId)

  const go = (id) => {
    setPage(id)
    setMenu(false)
    try {
      window.location.hash = id
    } catch {
      /* ignore */
    }
    const m = document.querySelector('.main')
    if (m) m.scrollTop = 0
  }

  useEffect(() => {
    const h = () => setPage(readHash())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  const current = NAV.find((n) => n.id === page)
  const title = page === 'architecture' ? 'Architecture' : current?.label

  let view
  switch (page) {
    case 'connectors': view = <Connectors go={go} />; break
    case 'etl': view = <PhasePage kind="etl" go={go} />; break
    case 'medallion': view = <PhasePage kind="medallion" go={go} />; break
    case 'kpi': view = <KpiStudio go={go} />; break
    case 'dashboards': view = <Dashboards go={go} />; break
    case 'intelligence': view = <Intelligence go={go} />; break
    case 'copilot': view = <Copilot go={go} />; break
    case 'operations': view = <Operations go={go} />; break
    case 'admin': view = <Administration go={go} />; break
    case 'architecture': view = <Architecture go={go} />; break
    default: view = <Home go={go} />
  }

  return (
    <div className="app">
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      <aside className={`sidebar ${menu ? 'open' : ''}`} aria-label="Primary">
        <div className="brand">
          <span className="logo" aria-hidden="true">Q</span>
          <div>
            <b>QMind</b>
            <small>AI Platform</small>
          </div>
          <button className="icon-btn only-narrow" onClick={() => setMenu(false)} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'on' : ''} ${n.phase ? 'locked' : ''}`} onClick={() => go(n.id)} aria-current={page === n.id ? 'page' : undefined}>
              <n.icon size={17} />
              <span>{n.label}</span>
              {n.phase && <em>Phase {n.phase}</em>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <button className={`nav-item ${page === 'architecture' ? 'on' : ''}`} onClick={() => go('architecture')}>
            <Network size={17} />
            <span>Architecture</span>
          </button>
        </div>
      </aside>

      <div className="shell">
        <div className="topbar">
          <button className="icon-btn only-narrow" onClick={() => setMenu(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="crumbs">
            <span>QMind</span>
            <i>/</i>
            <b>{title}</b>
          </div>
          <div className="spacer" />
          <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch theme (current: ${theme})`} title="Toggle light / dark">
            <Sun size={16} className="theme-sun" />
            <Moon size={16} className="theme-moon" />
          </button>
          <div className="org">
            <button className="org-btn" onClick={() => setOrgMenu((v) => !v)} aria-haspopup="listbox" aria-expanded={orgMenu}>
              <Building2 size={16} />
              <span>
                <b>{org.name}</b>
                <small>{org.sub}</small>
              </span>
              <ChevronDown size={14} />
            </button>
            {orgMenu && (
              <>
                <div className="scrim clear" onClick={() => setOrgMenu(false)} />
                <ul className="menu org-menu" role="listbox">
                  {ORGS.map((o) => (
                    <li key={o.id}>
                      <button
                        role="option"
                        aria-selected={o.id === orgId}
                        onClick={() => {
                          setOrgId(o.id)
                          setOrgMenu(false)
                          toast(`Switched to ${o.name}`)
                        }}
                      >
                        <span>
                          <b>{o.name}</b>
                          <small>{o.projects} projects · {o.users} users</small>
                        </span>
                        {o.id === orgId && <Check size={14} />}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        <main className="main" id="main">
          {view}
        </main>
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            {t.tone === 'warn' ? <Lock size={14} /> : <Check size={14} />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
