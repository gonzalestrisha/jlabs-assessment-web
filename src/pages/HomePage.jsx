import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const IPINFO_TOKEN = import.meta.env.VITE_IPINFO_TOKEN || ''

function buildUrl(ip = '') {
  const base = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json'
  return IPINFO_TOKEN ? `${base}?token=${IPINFO_TOKEN}` : base
}

function isValidIP(ip) {
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/
  const v6 = /^[0-9a-fA-F:]{2,39}$/
  if (v4.test(ip)) return ip.split('.').every(n => Number(n) >= 0 && Number(n) <= 255)
  return v6.test(ip)
}

const GEO_FIELDS = [
  { key: 'ip',       label: 'ip_address',  icon: '◎' },
  { key: 'city',     label: 'city',        icon: '⌖' },
  { key: 'region',   label: 'region',      icon: '◫' },
  { key: 'country',  label: 'country',     icon: '⊞' },
  { key: 'loc',      label: 'coordinates', icon: '⊕' },
  { key: 'org',      label: 'org',         icon: '⊙' },
  { key: 'timezone', label: 'timezone',    icon: '◷' },
  { key: 'postal',   label: 'postal',      icon: '◈' },
]

// ── Leaflet Map ───────────────────────────────────────────────────────────────
function MapView({ loc, theme }) {
  const mapRef      = useRef(null)
  const instanceRef = useRef(null)
  const markerRef   = useRef(null)
  const tileRef     = useRef(null)

  const darkTile  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  const lightTile = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  useEffect(() => {
    if (!loc || !window.L) return
    const [lat, lng] = loc.split(',').map(Number)
    if (isNaN(lat) || isNaN(lng)) return

    if (!instanceRef.current) {
      instanceRef.current = window.L.map(mapRef.current, { zoomControl: true, attributionControl: false })
        .setView([lat, lng], 11)
      tileRef.current = window.L.tileLayer(theme === 'dark' ? darkTile : lightTile, { maxZoom: 19 })
        .addTo(instanceRef.current)
    } else {
      instanceRef.current.setView([lat, lng], 11)
    }

    if (markerRef.current) markerRef.current.remove()
    const accentColor = theme === 'dark' ? '#c8ff00' : '#2d6a4f'
    const icon = window.L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${accentColor};border:2px solid var(--bg);box-shadow:0 0 0 5px ${accentColor}33,0 2px 8px rgba(0,0,0,0.4);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })
    markerRef.current = window.L.marker([lat, lng], { icon }).addTo(instanceRef.current)
  }, [loc, theme])

  // Swap tile layer on theme change
  useEffect(() => {
    if (!instanceRef.current || !window.L) return
    if (tileRef.current) tileRef.current.remove()
    tileRef.current = window.L.tileLayer(theme === 'dark' ? darkTile : lightTile, { maxZoom: 19 })
      .addTo(instanceRef.current)
  }, [theme])

  useEffect(() => () => { instanceRef.current?.remove(); instanceRef.current = null }, [])

  return (
    <div style={css.mapWrap}>
      <div style={css.mapLabel}>
        <span style={css.mapLabelText}>▸ map_view</span>
      </div>
      <div ref={mapRef} style={css.map} />
    </div>
  )
}

// ── Geo Card ─────────────────────────────────────────────────────────────────
function GeoCard({ data, isUser, theme }) {
  if (!data) return null
  return (
    <div style={css.card} className="fade-in">
      <div style={css.cardHeader}>
        <div style={css.cardHeaderLeft}>
          <span style={{ ...css.statusPip, background: isUser ? 'var(--accent)' : '#4d9fff' }} />
          <span style={css.cardCmd}>
            {isUser ? '~/session/me' : `~/lookup/${data.ip}`}
          </span>
        </div>
        {isUser && <span style={css.badge}>SESSION</span>}
      </div>

      <div style={css.grid}>
        {GEO_FIELDS.map(({ key, label, icon }) =>
          data[key] ? (
            <div key={key} style={css.gridItem}>
              <span style={css.gridLabel}>
                <span style={css.gridIcon}>{icon}</span>
                {label}
              </span>
              <span style={css.gridValue}>{data[key]}</span>
            </div>
          ) : null
        )}
      </div>

      {data.loc && <MapView loc={data.loc} theme={theme} />}
    </div>
  )
}

// ── Spinner / Error ───────────────────────────────────────────────────────────
function Spinner({ label = 'Fetching geolocation…' }) {
  return (
    <div style={css.stateBox}>
      <span style={css.spinner} />
      <span style={css.stateText}>{label}</span>
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div style={css.errorBox} className="fade-in">
      <span style={css.errorTag}>ERR</span>
      <span>{msg}</span>
    </div>
  )
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({ checked, onClick }) {
  return (
    <div onClick={onClick} style={{
      ...css.checkbox,
      background: checked ? 'var(--accent)' : 'transparent',
      borderColor: checked ? 'var(--accent)' : 'var(--border)',
    }}>
      {checked && <span style={css.checkmark}>✓</span>}
    </div>
  )
}

// ── Theme Toggle Button ───────────────────────────────────────────────────────
function ThemeToggle({ theme, toggle }) {
  return (
    <button onClick={toggle} style={css.themeBtn} title="Toggle theme" aria-label="Toggle theme">
      {theme === 'dark' ? '☀' : '◑'}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, logout }   = useAuth()
  const { theme, toggle }  = useTheme()
  const navigate           = useNavigate()
  const inputRef           = useRef(null)

  const [userGeo, setUserGeo]             = useState(null)
  const [userLoading, setUserLoading]     = useState(true)
  const [userError, setUserError]         = useState('')

  const [inputVal, setInputVal]           = useState('')
  const [inputError, setInputError]       = useState('')
  const [searchGeo, setSearchGeo]         = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError]     = useState('')

  const [history, setHistory]             = useState([])
  const [selected, setSelected]           = useState(new Set())

  const isSearchActive = searchGeo !== null

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await axios.get(buildUrl())
        setUserGeo(data)
      } catch {
        setUserError('Failed to fetch your geolocation.')
      } finally {
        setUserLoading(false)
      }
    })()
  }, [])

  const fetchIP = async ip => {
    setSearchLoading(true)
    setSearchError('')
    setSearchGeo(null)
    try {
      const { data } = await axios.get(buildUrl(ip))
      if (data.bogon) throw new Error('Private/bogon IP — no public geo data available.')
      setSearchGeo(data)
      setHistory(prev => prev.find(h => h.ip === ip) ? prev : [{ id: Date.now(), ip, data }, ...prev])
    } catch (err) {
      setSearchError(err.message || 'Failed to fetch geolocation.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearch = () => {
    const ip = inputVal.trim()
    if (!ip) return
    if (!isValidIP(ip)) { setInputError('Invalid IP address format.'); return }
    setInputError('')
    fetchIP(ip)
  }

  const handleClear = () => {
    setInputVal('')
    setInputError('')
    setSearchGeo(null)
    setSearchError('')
    inputRef.current?.focus()
  }

  const handleHistoryClick = item => {
    setInputVal(item.ip)
    setInputError('')
    setSearchGeo(item.data)
    setSearchError('')
  }

  const toggleSelect    = id  => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = ()  => setSelected(selected.size === history.length ? new Set() : new Set(history.map(h => h.id)))
  const deleteSelected  = ()  => { setHistory(prev => prev.filter(h => !selected.has(h.id))); setSelected(new Set()) }
  const handleLogout    = ()  => { logout(); navigate('/login', { replace: true }) }

  const displayGeo  = isSearchActive ? searchGeo : userGeo
  const displayUser = !isSearchActive

  return (
    <div style={css.root}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        .fade-in { animation: fadeIn 0.2s ease forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        input:focus { outline: none; border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-dim) !important; }
        .hist-item:hover { background: var(--surface-hover) !important; }
        button { transition: opacity 0.15s, transform 0.1s; }
        button:active { transform: scale(0.97); }
        @media (max-width: 600px) {
          .main-pad { padding: 24px 16px !important; }
          .search-row { flex-wrap: wrap !important; }
          .search-btn-full { width: 100% !important; }
          .grid-responsive { grid-template-columns: 1fr 1fr !important; }
          .hist-meta { display: none !important; }
          .nav-user  { display: none !important; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={css.nav}>
        <div style={css.navLeft}>
          <div style={css.navDot} />
          <span style={css.navBrand}>ipgeo</span>
          <span style={css.navSep}>/</span>
          <span style={css.navRoute}>dashboard</span>
        </div>
        <div style={css.navRight}>
          <span style={css.navUser} className="nav-user">{user?.email}</span>
          <ThemeToggle theme={theme} toggle={toggle} />
          <button onClick={handleLogout} style={css.logoutBtn}>logout</button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={css.main} className="main-pad">

        {/* Header */}
        <div style={css.pageHeader}>
          <div style={css.pageHeaderTop}>
            <h1 style={css.pageTitle}>Geolocation</h1>
            <span style={css.pageBadge}>v1.0</span>
          </div>
          <p style={css.pageSub}>
            <span style={css.promptChevron}>›</span>
            IP intelligence &amp; location lookup tool
          </p>
        </div>

        {/* Search */}
        <div style={css.searchSection}>
          <div style={css.searchLabel}>
            <span style={css.searchLabelText}>$ ipgeo lookup</span>
          </div>
          <div style={{ ...css.searchRow }} className="search-row">
            <div style={css.inputWrap}>
              <span style={css.inputPrefix}>›</span>
              <input
                ref={inputRef}
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); setInputError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="0.0.0.0"
                style={{
                  ...css.input,
                  borderColor: inputError ? 'var(--error-border)' : 'var(--border)',
                  boxShadow: inputError ? '0 0 0 3px var(--error-dim)' : 'inset 0 1px 3px rgba(0,0,0,0.12)',
                }}
              />
              {inputVal && (
                <button onClick={handleClear} style={css.clearBtn} title="Clear">✕</button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              style={{ ...css.searchBtn, opacity: searchLoading ? 0.5 : 1 }}
              className="search-btn-full"
            >
              {searchLoading ? <><span style={css.btnSpinner} /> running…</> : '→ run'}
            </button>
            {isSearchActive && (
              <button onClick={handleClear} style={css.clearSearchBtn} className="search-btn-full">
                ↩ revert
              </button>
            )}
          </div>

          {inputError && (
            <div style={{ ...css.errorBox, marginTop: '8px' }} className="fade-in">
              <span style={css.errorTag}>ERR</span>
              {inputError}
            </div>
          )}
        </div>

        {/* Geo result */}
        <div style={{ marginBottom: '32px' }}>
          {userLoading && <Spinner label="Detecting your location…" />}
          {!userLoading && userError && !isSearchActive && <ErrorBox msg={userError} />}
          {searchLoading && <Spinner label={`Looking up ${inputVal}…`} />}
          {!searchLoading && searchError && <ErrorBox msg={searchError} />}
          {!searchLoading && !searchError && displayGeo && (
            <GeoCard data={displayGeo} isUser={displayUser} theme={theme} />
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={css.historySection} className="fade-in">
            <div style={css.historyHeader}>
              <div style={css.historyHeaderLeft}>
                <span style={css.historyCmd}>$ history</span>
                <span style={css.historyCount}>{history.length}</span>
              </div>
              {selected.size > 0 && (
                <button onClick={deleteSelected} style={css.deleteBtn}>
                  delete {selected.size} selected
                </button>
              )}
            </div>

            <div style={css.historyList}>
              {/* Select all */}
              <div style={css.historySelectAll} onClick={toggleSelectAll} className="hist-item">
                <Checkbox checked={selected.size === history.length && history.length > 0} />
                <span style={css.selectAllLabel}>select_all</span>
              </div>

              {history.map(item => (
                <div key={item.id} style={css.historyItem} className="hist-item">
                  <Checkbox checked={selected.has(item.id)} onClick={() => toggleSelect(item.id)} />
                  <div style={css.historyContent} onClick={() => handleHistoryClick(item)}>
                    <div style={css.historyLeft}>
                      <span style={css.historyArrowLabel}>›</span>
                      <span style={css.historyIP}>{item.ip}</span>
                    </div>
                    <span style={css.historyMeta} className="hist-meta">
                      {[item.data.city, item.data.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <span style={css.historyChevron}>⌃</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Styles (CSS vars for theming) ─────────────────────────────────────────────
const css = {
  root: {
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: 'background 0.2s, color 0.2s',
  },

  // Nav
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: '52px',
    background: 'var(--nav-blur)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow-sm)',
  },
  navLeft:  { display: 'flex', alignItems: 'center', gap: '8px' },
  navDot:   { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 },
  navBrand: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text)',
    letterSpacing: '0.02em',
  },
  navSep:   { color: 'var(--border)', fontSize: '16px', fontWeight: '300' },
  navRoute: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  navUser:  {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: 'var(--text-muted)',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  themeBtn: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '7px',
    color: 'var(--text-dim)',
    width: '32px',
    height: '32px',
    fontSize: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  logoutBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '7px',
    color: 'var(--text-muted)',
    padding: '5px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
  },

  // Main
  main: { maxWidth: '800px', margin: '0 auto', padding: '40px 24px' },

  pageHeader:    { marginBottom: '28px' },
  pageHeaderTop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '600',
    letterSpacing: '-0.4px',
    color: 'var(--text)',
  },
  pageBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent-border)',
    borderRadius: '4px',
    padding: '2px 7px',
    letterSpacing: '0.04em',
  },
  pageSub: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  promptChevron: { color: 'var(--accent)', fontSize: '15px' },

  // Search
  searchSection: { marginBottom: '20px' },
  searchLabel:   { marginBottom: '8px' },
  searchLabelText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },
  searchRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  inputWrap: { position: 'relative', flex: 1, minWidth: '200px' },
  inputPrefix: {
    position: 'absolute',
    left: '13px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--accent)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '15px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    padding: '11px 38px 11px 30px',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-sm)',
  },
  clearBtn: {
    position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: '11px', padding: '4px',
  },
  searchBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    background: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: '9px',
    padding: '11px 20px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px var(--accent-dim)',
  },
  clearSearchBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    background: 'var(--surface)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    padding: '11px 16px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: 'var(--shadow-sm)',
  },
  btnSpinner: {
    display: 'inline-block', width: '11px', height: '11px',
    border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--accent-text)',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },

  // Card
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 18px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  statusPip: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  cardCmd: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: 'var(--text-dim)',
    letterSpacing: '0.02em',
  },
  badge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px',
    letterSpacing: '0.1em',
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent-border)',
    borderRadius: '4px',
    padding: '2px 7px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
  },
  gridItem: {
    padding: '14px 18px',
    borderRight: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  gridLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  gridIcon:  { fontSize: '11px', opacity: 0.6 },
  gridValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--text)',
    fontWeight: '400',
    wordBreak: 'break-all',
  },

  // Map
  mapWrap: {
    borderTop: '1px solid var(--border-subtle)',
    position: 'relative',
  },
  mapLabel: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 999,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '3px 9px',
    boxShadow: 'var(--shadow-sm)',
  },
  mapLabelText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },
  map: { width: '100%', height: '260px' },

  // States
  stateBox: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '18px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', boxShadow: 'var(--shadow-sm)',
  },
  spinner: {
    display: 'inline-block', width: '13px', height: '13px',
    border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
  },
  stateText: {
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-muted)', fontSize: '12px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--error-dim)', border: '1px solid var(--error-border)',
    borderRadius: '9px', padding: '11px 14px', color: 'var(--error)',
    fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
  },
  errorTag: {
    background: 'var(--error)', color: 'var(--bg)', fontSize: '9px',
    fontWeight: '700', letterSpacing: '0.08em', padding: '2px 6px',
    borderRadius: '4px', flexShrink: 0,
  },

  // History
  historySection: { marginTop: '8px' },
  historyHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  historyHeaderLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  historyCmd: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.04em',
  },
  historyCount: {
    fontFamily: "'JetBrains Mono', monospace",
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: '4px', padding: '1px 7px', fontSize: '11px', color: 'var(--text-muted)',
  },
  deleteBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    background: 'var(--error-dim)', border: '1px solid var(--error-border)',
    borderRadius: '7px', color: 'var(--error)', padding: '5px 12px',
    fontSize: '11px', cursor: 'pointer',
  },
  historyList: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  historySelectAll: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
  },
  selectAllLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px', color: 'var(--text-muted)',
  },
  historyItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)',
    transition: 'background 0.1s', cursor: 'pointer',
  },
  historyContent: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px', minWidth: 0,
  },
  historyLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  historyArrowLabel: { color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' },
  historyIP: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--text)',
  },
  historyMeta: { fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 },
  historyChevron: {
    color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0,
    transform: 'rotate(90deg)', display: 'inline-block',
  },
  checkbox: {
    width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'all 0.1s',
  },
  checkmark: {
    fontSize: '10px', color: 'var(--accent-text)', fontWeight: '700', lineHeight: 1,
  },
}