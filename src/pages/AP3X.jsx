/**
 * ============================================================
 * APEX AI — AP3X Driver Platform (Full Build)
 * Driver HUD · active job · navigation · telemetry stream
 * ============================================================
 */

import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import Icon from '@components/ui/Icon'
import Badge from '@components/ui/Badge'
import StatusDot from '@components/ui/StatusDot'
import TelemetryValue from '@components/ui/TelemetryValue'
import { useAuthStore, useFleetStore } from '@core/storage'
import { formatDateTime } from '@utils/format'

const ApexMap = lazy(() => import('@modules/navigation/ApexMap'))

// ─── Mock active job ──────────────────────────────────────────
const DEMO_JOB = {
  id:          'demo-1',
  title:       'Pallet delivery — London Distribution Centre',
  origin:      'Depot A, Manchester M1 1AA',
  destination: 'Unit 4, Silvertown Way, London E16 2AA',
  priority:    'high',
  status:      'in_progress',
  driver_name: 'Demo Driver',
  vehicle_reg: 'AP3X 001',
  scheduled_at: new Date(Date.now() + 7200000).toISOString(),
  distance_km: 292,
  eta_mins:    187,
  notes:       'Handle with care — fragile goods. Tail lift required at delivery.',
}

const DEMO_TELEMETRY = { speed: 72, fuel: 58, heading: 45, engine: true, lat: 53.4808, lng: -2.2426 }

// ─── HUD Tile ─────────────────────────────────────────────────
function HUDTile({ label, value, unit, icon, color = 'text-cyan-400', warning = false }) {
  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
      warning
        ? 'bg-amber-500/5 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
        : 'bg-slate-900/50 border-slate-800/60'
    }`}>
      <Icon name={icon} size={14} className={warning ? 'text-amber-400 mb-1' : `${color} mb-1`} />
      <div className={`font-mono font-bold text-xl tabular-nums leading-none ${warning ? 'text-amber-400' : color}`}>{value}</div>
      {unit && <div className="text-2xs text-slate-600 mt-0.5">{unit}</div>}
      <div className="text-2xs text-slate-600 mt-1">{label}</div>
    </div>
  )
}

// ─── Active Job Card ──────────────────────────────────────────
function ActiveJobCard({ job, onComplete }) {
  const etaMins = job.eta_mins ? Math.max(0, job.eta_mins - Math.floor((Date.now() - Date.parse(job.scheduled_at || 0)) / 60000)) : null
  const etaHrs  = etaMins != null ? `${Math.floor(etaMins / 60)}h ${etaMins % 60}m` : '—'

  return (
    <div className="bg-[#0d1426] border border-violet-500/20 rounded-xl p-4 shadow-[0_0_24px_rgba(139,92,246,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-semibold text-violet-300">Active Job</span>
        </div>
        <span className={`text-2xs px-2 py-0.5 rounded border capitalize ${
          job.priority === 'urgent' ? 'bg-red-500/10 border-red-500/20 text-red-400'    :
          job.priority === 'high'   ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          'bg-slate-800 border-slate-700 text-slate-400'
        }`}>{job.priority}</span>
      </div>

      <h3 className="text-sm font-semibold text-white mb-3 leading-tight">{job.title}</h3>

      {/* Route */}
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="text-slate-400 truncate">{job.origin}</span>
        </div>
        <div className="ml-0.5 w-px h-3 bg-slate-700 ml-[3px]" />
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          <span className="text-slate-400 truncate">{job.destination}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-900/60 rounded-lg p-2 text-center">
          <div className="text-xs font-mono font-bold text-cyan-400">{job.distance_km} km</div>
          <div className="text-2xs text-slate-600">Distance</div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2 text-center">
          <div className="text-xs font-mono font-bold text-violet-400">{etaHrs}</div>
          <div className="text-2xs text-slate-600">ETA</div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2 text-center">
          <div className="text-xs font-mono font-bold text-emerald-400">{job.vehicle_reg}</div>
          <div className="text-2xs text-slate-600">Unit</div>
        </div>
      </div>

      {job.notes && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 mb-3 text-xs text-amber-300">
          <Icon name="Info" size={11} className="inline mr-1.5" />{job.notes}
        </div>
      )}

      <div className="flex gap-2">
        <button className="flex-1 py-2 text-xs bg-slate-800/60 border border-slate-700/40 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors">
          <Icon name="Navigation" size={11} className="inline mr-1" />Navigate
        </button>
        <button onClick={() => onComplete?.(job.id)}
          className="flex-1 py-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/15 transition-colors">
          <Icon name="CheckCircle2" size={11} className="inline mr-1" />Complete
        </button>
      </div>
    </div>
  )
}

// ─── Pre-trip checklist ───────────────────────────────────────
function Checklist() {
  const items = [
    'Tyre pressures checked',
    'Oil and coolant levels OK',
    'All lights functional',
    'Load secured',
    'Documents on board',
    'Tachograph card inserted',
  ]
  const [checked, setChecked] = useState({})
  const toggle = (i) => setChecked(c => ({ ...c, [i]: !c[i] }))
  const done = Object.values(checked).filter(Boolean).length

  return (
    <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="ClipboardCheck" size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Pre-trip Check</span>
        </div>
        <span className="text-xs font-mono text-slate-500">{done}/{items.length}</span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
            <div onClick={() => toggle(i)}
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                checked[i]
                  ? 'bg-emerald-500/20 border-emerald-500/40'
                  : 'bg-slate-900 border-slate-700 group-hover:border-slate-600'
              }`}>
              {checked[i] && <Icon name="Check" size={10} className="text-emerald-400" />}
            </div>
            <span className={`text-xs transition-colors ${checked[i] ? 'text-slate-600 line-through' : 'text-slate-400'}`}>{item}</span>
          </label>
        ))}
      </div>
      {done === items.length && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
          <Icon name="CheckCircle2" size={12} />All checks complete — safe to depart
        </div>
      )}
    </div>
  )
}

// ─── AP3X Page ────────────────────────────────────────────────
export default function AP3X() {
  const { user }     = useAuthStore(s => ({ user: s.user }))
  const { vehicles } = useFleetStore(s => ({ vehicles: s.vehicles }))
  const mapRef       = useRef(null)

  const [telemetry,   setTelemetry]   = useState(DEMO_TELEMETRY)
  const [activeJob,   setActiveJob]   = useState(DEMO_JOB)
  const [jobComplete, setJobComplete] = useState(false)
  const [tab,         setTab]         = useState('hud') // hud | jobs | check

  // Simulate live telemetry
  useEffect(() => {
    const id = setInterval(() => {
      setTelemetry(t => ({
        ...t,
        speed: Math.max(0, Math.min(90, t.speed + (Math.random() - 0.5) * 8)),
        fuel:  Math.max(0, t.fuel - 0.003),
      }))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const mapMarkers = activeJob ? [
    { id: 'vehicle', lat: telemetry.lat, lng: telemetry.lng, label: activeJob.vehicle_reg, status: 'active', speed: Math.round(telemetry.speed) },
  ] : []

  const tabs = [
    { key: 'hud',   label: 'Live HUD',  icon: 'Gauge'          },
    { key: 'jobs',  label: 'My Jobs',   icon: 'Navigation'     },
    { key: 'check', label: 'Checklist', icon: 'ClipboardCheck' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
                <span className="font-display font-bold text-violet-400 text-xs">AP</span>
              </div>
              <h1 className="font-display text-xl font-bold text-white">AP3X</h1>
              <span className="text-xs text-slate-500">Driver Platform</span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {user?.user_metadata?.full_name || user?.email || 'Driver'} · {activeJob?.vehicle_reg || 'No vehicle assigned'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="online" />
            <span className="text-xs text-emerald-400 font-medium">On Duty</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-800/60 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-all ${
              tab === t.key
                ? 'border-violet-400 text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* ── HUD Tab ── */}
        {tab === 'hud' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Live telemetry tiles */}
            <div className="grid grid-cols-4 gap-3">
              <HUDTile label="Speed"   value={Math.round(telemetry.speed)} unit="km/h" icon="Gauge"      color="text-cyan-400"   warning={telemetry.speed > 80} />
              <HUDTile label="Fuel"    value={Math.round(telemetry.fuel)}  unit="%"    icon="Droplets"   color={telemetry.fuel < 20 ? 'text-red-400' : 'text-emerald-400'} warning={telemetry.fuel < 20} />
              <HUDTile label="Heading" value={`${Math.round(telemetry.heading)}°`}     icon="Navigation" color="text-violet-400" />
              <HUDTile label="Engine"  value={telemetry.engine ? 'ON' : 'OFF'}         icon="Zap"        color={telemetry.engine ? 'text-emerald-400' : 'text-slate-600'} />
            </div>

            {/* Mini map */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800/60" style={{ height: 220 }}>
              <Suspense fallback={<div className="flex items-center justify-center h-full bg-[#050810] text-slate-600 text-sm">Loading map…</div>}>
                <ApexMap
                  ref={mapRef}
                  markers={mapMarkers}
                  height="100%"
                  className="h-full"
                  center={{ lat: telemetry.lat, lng: telemetry.lng }}
                  zoom={13}
                />
              </Suspense>
            </div>

            {/* Active job summary */}
            {activeJob && !jobComplete && (
              <ActiveJobCard job={activeJob} onComplete={() => setJobComplete(true)} />
            )}
            {jobComplete && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 text-center">
                <Icon name="CheckCircle2" size={32} className="text-emerald-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-emerald-400">Job Completed</div>
                <div className="text-xs text-slate-500 mt-1">Awaiting next assignment from dispatch</div>
              </div>
            )}
          </div>
        )}

        {/* ── Jobs Tab ── */}
        {tab === 'jobs' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-sm font-semibold text-slate-300 mb-2">My Assigned Jobs</h2>
            {activeJob && !jobComplete ? (
              <ActiveJobCard job={activeJob} onComplete={() => setJobComplete(true)} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-3">
                <Icon name="Navigation" size={36} className="opacity-20" />
                <p className="text-sm">No active jobs</p>
                <p className="text-xs">Contact dispatch for new assignment</p>
              </div>
            )}
          </div>
        )}

        {/* ── Checklist Tab ── */}
        {tab === 'check' && (
          <div className="max-w-md mx-auto">
            <Checklist />
          </div>
        )}
      </div>
    </div>
  )
}
