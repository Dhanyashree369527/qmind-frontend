import { useEffect } from 'react'
import { X } from './icons'

export function Badge({ tone = 'neutral', dot, children }) {
  return (
    <span className={`badge ${tone}`}>
      {dot && <i className="dot" />}
      {children}
    </span>
  )
}

export function Glyph({ text, color, size = 40 }) {
  return (
    <span
      className="glyph"
      aria-hidden="true"
      style={{ '--g': color, width: size, height: size, fontSize: text.length > 2 ? size * 0.3 : size * 0.38 }}
    >
      {text}
    </span>
  )
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Toggle({ id, checked, onChange, label }) {
  return (
    <label className="toggle-row" htmlFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
      <span>{label}</span>
    </label>
  )
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return (
          <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
            {l}
          </button>
        )
      })}
    </div>
  )
}

export function PageHeader({ title, sub, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  )
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={22} />}
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  )
}

export function Delta({ value, goodUp = true }) {
  const up = value >= 0
  const good = up === goodUp
  return (
    <span className={`delta ${good ? 'good' : 'bad'}`}>
      {up ? '▲' : '▼'} {Math.abs(value * 100).toFixed(1)}%
    </span>
  )
}
