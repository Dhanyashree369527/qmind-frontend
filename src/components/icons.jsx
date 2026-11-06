// Small in-project icon set (24x24 stroke icons), so the app needs no icon library.
// Usage: <Check size={16} className="x" />

const make = (children) =>
  function Icon({ size = 16, className, strokeWidth = 2, ...rest }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {children}
      </svg>
    )
  }

export const Activity = make(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />)
export const AlertTriangle = make(<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>)
export const ArrowRight = make(<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>)
export const BarChart3 = make(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>)
export const Bell = make(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>)
export const BookOpen = make(<><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></>)
export const Brain = make(<><path d="M9.5 3A3.5 3.5 0 0 0 6 6.5a3 3 0 0 0-2 5 3 3 0 0 0 1.5 5.4A3.5 3.5 0 0 0 9 20.5a2.5 2.5 0 0 0 3-2.5V5.5A2.5 2.5 0 0 0 9.5 3z" /><path d="M14.5 3A3.5 3.5 0 0 1 18 6.5a3 3 0 0 1 2 5 3 3 0 0 1-1.5 5.4A3.5 3.5 0 0 1 15 20.5a2.5 2.5 0 0 1-3-2.5" /></>)
export const Building2 = make(<><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="22" x2="9" y2="18" /><line x1="15" y1="22" x2="15" y2="18" /><line x1="8" y1="6" x2="8.01" y2="6" /><line x1="12" y1="6" x2="12.01" y2="6" /><line x1="16" y1="6" x2="16.01" y2="6" /><line x1="8" y1="10" x2="8.01" y2="10" /><line x1="12" y1="10" x2="12.01" y2="10" /><line x1="16" y1="10" x2="16.01" y2="10" /><line x1="8" y1="14" x2="8.01" y2="14" /><line x1="12" y1="14" x2="12.01" y2="14" /><line x1="16" y1="14" x2="16.01" y2="14" /></>)
export const Check = make(<polyline points="20 6 9 17 4 12" />)
export const CheckCircle2 = make(<><circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" /></>)
export const ChevronDown = make(<polyline points="6 9 12 15 18 9" />)
export const ChevronRight = make(<polyline points="9 6 15 12 9 18" />)
export const Eye = make(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>)
export const EyeOff = make(<><path d="M17.9 17.9A10.9 10.9 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2" /><line x1="1" y1="1" x2="23" y2="23" /></>)
export const Home = make(<><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>)
export const LineChart = make(<><polyline points="3 3 3 21 21 21" /><polyline points="7 15 11 10 14 13 20 6" /></>)
export const Layers = make(<><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>)
export const LayoutDashboard = make(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>)
export const ListChecks = make(<><polyline points="3 6 4.5 7.5 7 4.5" /><polyline points="3 13 4.5 14.5 7 11.5" /><line x1="11" y1="6" x2="21" y2="6" /><line x1="11" y1="13" x2="21" y2="13" /><line x1="11" y1="20" x2="21" y2="20" /></>)
export const Loader2 = make(<path d="M21 12a9 9 0 1 1-6.2-8.6" />)
export const Lock = make(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>)
export const Mail = make(<><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2 6 12 13 22 6" /></>)
export const Menu = make(<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)
export const MessageSquare = make(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />)
export const Moon = make(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />)
export const MoreHorizontal = make(<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>)
export const Network = make(<><rect x="9" y="2" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="16" y="16" width="6" height="6" rx="1" /><path d="M5 16v-3h14v3M12 13V8" /></>)
export const Pause = make(<><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>)
export const Pencil = make(<><path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></>)
export const PieChart = make(<><path d="M21.2 15.9A10 10 0 1 1 8 2.8" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>)
export const Play = make(<polygon points="6 3 20 12 6 21 6 3" />)
export const Plug = make(<><path d="M12 22v-5" /><path d="M9 8V2M15 8V2" /><path d="M18 8v5a6 6 0 0 1-12 0V8z" /></>)
export const PlugZap = make(<><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4z" /><path d="m2 22 3-3M7.5 13.5 10 11M10.5 16.5 13 14M12 6l6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0z" /></>)
export const Plus = make(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>)
export const RefreshCw = make(<><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" /></>)
export const Search = make(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.7" y2="16.7" /></>)
export const Send = make(<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>)
export const ShieldCheck = make(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>)
export const Sparkles = make(<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 17v4M17 19h4M5 3v4M3 5h4" /></>)
export const Square = make(<rect x="3" y="3" width="18" height="18" rx="2" />)
export const Sun = make(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>)
export const Target = make(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>)
export const Trash2 = make(<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>)
export const Upload = make(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>)
export const UserPlus = make(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>)
export const Users = make(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>)
export const Workflow = make(<><rect x="3" y="3" width="8" height="8" rx="2" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect x="13" y="13" width="8" height="8" rx="2" /></>)
export const X = make(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>)
export const XCircle = make(<><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>)
