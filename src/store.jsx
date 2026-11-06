import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ORGS, seedConnections, seedKpis, seedPipelines, seedWidgets, makeSeries } from './data/seed'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

// Browser storage may be blocked, so every access is wrapped.
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function ago(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.round(h / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

let uid = 0
export const newId = (p) => `${p}-${Date.now().toString(36)}${(uid++).toString(36)}`

export function StoreProvider({ children }) {
  // Only non-secret connection metadata is ever persisted (secrets are never kept).
  const [connections, setConnections] = useState(() => load('qmind.v1.connections', null) ?? seedConnections())
  const [kpis, setKpis] = useState(() => load('qmind.v1.kpis', null) ?? seedKpis())
  const [widgets, setWidgets] = useState(() => load('qmind.v1.widgets', null) ?? seedWidgets())
  const [pipelines, setPipelines] = useState(() => seedPipelines())
  const [theme, setTheme] = useState(() => load('qmind.v1.theme', 'system'))
  const [orgId, setOrgId] = useState(ORGS[0].id)
  const [toasts, setToasts] = useState([])
  const timers = useRef([])

  useEffect(() => save('qmind.v1.connections', connections), [connections])
  useEffect(() => save('qmind.v1.kpis', kpis), [kpis])
  useEffect(() => save('qmind.v1.widgets', widgets), [widgets])
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'system') el.removeAttribute('data-theme')
    else el.setAttribute('data-theme', theme)
    save('qmind.v1.theme', theme)
  }, [theme])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const later = useCallback((fn, ms) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  const toast = useCallback(
    (message, tone = 'ok') => {
      const id = newId('t')
      setToasts((t) => [...t, { id, message, tone }])
      later(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400)
    },
    [later]
  )

  const toggleTheme = () => {
    const dark =
      theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setTheme(dark ? 'light' : 'dark')
  }

  // ---- connections
  const addConnection = (c) => {
    const conn = { ...c, id: newId('c'), status: 'connected', syncedAt: Date.now() }
    setConnections((l) => [conn, ...l])
    return conn
  }
  const updateConnection = (id, patch) =>
    setConnections((l) => l.map((c) => (c.id === id ? { ...c, ...patch, syncedAt: Date.now() } : c)))
  const removeConnection = (id) => setConnections((l) => l.filter((c) => c.id !== id))
  const syncConnection = (id) => {
    updateConnection(id, {})
    toast('Sync started. Records refreshed.')
  }
  const syncAll = () => {
    setConnections((l) => l.map((c) => ({ ...c, syncedAt: Date.now() })))
    toast('All connections refreshed.')
  }

  // ---- KPIs / dashboard
  const addKpi = (k) => {
    const id = newId('k')
    const base = Math.max(1, k.target * 0.86)
    const series = makeSeries(id + k.name, { base, trend: k.goodUp ? 0.004 : -0.002, vol: 0.035 })
    setKpis((l) => [{ ...k, id, series }, ...l])
    return id
  }
  const removeKpi = (id) => {
    setKpis((l) => l.filter((k) => k.id !== id))
    setWidgets((l) => l.filter((w) => w.kpiId !== id))
  }
  const addWidget = (type, kpiId) => setWidgets((l) => [...l, { id: newId('w'), type, kpiId }])
  const removeWidget = (id) => setWidgets((l) => l.filter((w) => w.id !== id))

  // ---- pipelines
  const runPipeline = (id) => {
    setPipelines((l) => l.map((p) => (p.id === id ? { ...p, status: 'running', error: undefined } : p)))
    later(() => {
      setPipelines((l) =>
        l.map((p) =>
          p.id === id
            ? { ...p, status: 'success', lastRun: Date.now(), duration: 20 + Math.round(Math.random() * 120), rows: Math.round(p.rows || 50000 * (0.5 + Math.random())) }
            : p
        )
      )
      toast('Pipeline run finished successfully.')
    }, 2200)
  }
  const patchPipeline = (id, patch) => setPipelines((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const value = useMemo(
    () => ({
      connections, addConnection, updateConnection, removeConnection, syncConnection, syncAll,
      kpis, addKpi, removeKpi, widgets, addWidget, removeWidget,
      pipelines, runPipeline, patchPipeline,
      theme, toggleTheme, orgId, setOrgId, toasts, toast,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connections, kpis, widgets, pipelines, theme, orgId, toasts]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
