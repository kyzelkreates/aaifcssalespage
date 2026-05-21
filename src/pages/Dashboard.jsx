/**
 * ============================================================
 * APEX AI — Command Dashboard (Run 13 — Full Build)
 * Real-time fleet overview · KPIs · live feed · map widget
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '@components/ui/Icon'
import Badge from '@components/ui/Badge'
import StatusDot from '@components/ui/StatusDot'
import TelemetryValue from '@components/ui/TelemetryValue'
import { useFleetStore, useDriverStore, useAppStore } from '@core/storage'
import { fleetService, VEHICLE_STATUS } from '@services/fleet/fleetService'
import { driverService, DRIVER_STATUS } from '@services/drivers/driverService'
import { safetyService } from '@services/safety/safetyService'
import { telemetryService } from '@services/realtime/telemetryService'
import { ROUTES } from '@config/routes'
import { formatDateTime } from '@utils/format'

const ApexMap = lazy(() => import('@modules/navigation/ApexMap'))

// ─── Live clock ───────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="text-right">
      <div className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight">
        {time.toLocaleTimeString('en-GB', { hour12: false })}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        {time.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, bg, border, pulse, onClick }) {
  return (
    <div onClick={onClick}
      className={`${bg} border ${border} rounded-xl p-4 cursor-pointer hover:brightness-110 transition-all group relative overflow-hidden`}>
      {pulse && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      )}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xs text-slate-500 font-semibold tracking-widest uppercase">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <Icon name={icon} size={14} className={color} />
        </div>
      </div>
      <div className={`font-mono text-3xl font-bold ${color} tabular-nums`}>{value ?? '—'}</div>
      {sub && <div className="text-2xs text-slate-600 mt-1.5">{sub}</div>}
    </div>
  )
}

// ─── Alert Row ────────────────────────────────────────────────
function AlertRow({ alert }) {
  const cfg = {
    critical: 'text-red-300 bg-red-500/8 border-red-500/25',
    high:     'text-red-400 bg-red-500/5 border-red-500/10',
    medium:   'text-amber-400 bg-amber-500/5 border-amber-500/20',
    low:      'text-slate-400 bg-slate-800/30 border-slate-800/60',
  }[alert.severity] || 'text-slate-400 bg-slate-800/30 border-slate-800/60'

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cfg}`}>
      <Icon name="AlertTriangle" size={12} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate capitalize">{alert.type?.replace(/_/g, ' ')}</div>
        <div className="text-2xs text-slate-600 truncate">{alert.driver_name || 'Unknown'} · {alert.vehicle_reg || '—'}</div>
      </div>
      <span className="text-2xs text-slate-600 flex-shrink-0 font-mono">
        {new Date(alert.created_at).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

// ─── Vehicle Row ──────────────────────────────────────────────
function VehicleRow({ vehicle, onClick }) {
  const dot = vehicle.status === 'active' ? 'online' : vehicle.status === 'idle' ? 'idle' : vehicle.status === 'maintenance' ? 'warning' : 'offline'
  return (
    <div onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors group">
      <StatusDot status={dot} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono font-semibold text-white group-hover:text-cyan-200 transition-colors">{vehicle.reg_number}</div>
        <div className="text-2xs text-slate-600 truncate">{vehicle.driver_name || 'Unassigned'}</div>
      </div>
      {vehicle.speed != null && vehicle.status === 'active' && (
        <span className="text-2xs font-mono text-cyan-400/70">{vehicle.speed}km/h</span>
      )}
      {vehicle.fuel_level != null && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${vehicle.fuel_level > 40 ? 'bg-emerald-500' : vehicle.fuel_level > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${vehicle.fuel_level}%` }} />
          </div>
          <span className="text-2xs font-mono text-slate-500 w-7 text-right">{vehicle.fuel_level}%</span>
        </div>
      )}
    </div>
  )
}

// ─── Driver Row ───────────────────────────────────────────────
function DriverRow({ driver, onClick }) {
  const dot   = driver.status === DRIVER_STATUS.ACTIVE ? 'online' : driver.status === DRIVER_STATUS.ON_BREAK ? 'idle' : 'offline'
  const score = driver.safety_score ?? 0
  return (
    <div onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors group">
      <StatusDot status={dot} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-white group-hover:text-cyan-200 transition-colors truncate">{driver.full_name}</div>
        <div className="text-2xs text-slate-600 truncate capitalize">{driver.status?.replace('_', ' ')}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${score}%`, background: score >= 85 ? '#10b981' : score >= 65 ? '#f59e0b' : '#ef4444' }} />
        </div>
        <span className={`text-2xs font-mono ${score >= 85 ? 'text-emerald-400' : score >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
      </div>
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────
function ActivityFeed({ vehicles, alerts, drivers }) {
  const events = [
    ...alerts.slice(0, 4).map(a => ({
      id:   `alert-${a.id}`,
      icon: 'AlertTriangle',
      color: a.severity === 'critical' ? 'text-red-400' : a.severity === 'high' ? 'text-red-400' : 'text-amber-400',
      text: `${a.type?.replace(/_/g,' ')} — ${a.driver_name || 'Unknown'}`,
      sub:  a.vehicle_reg || '',
      time: a.created_at,
    })),
    ...vehicles.filter(v => v.status === 'active').slice(0, 3).map(v => ({
      id:    `veh-${v.id}`,
      icon:  'Truck',
      color: 'text-cyan-400',
      text:  `${v.reg_number} active`,
      sub:   v.driver_name || 'Unassigned',
      time:  new Date().toISOString(),
    })),
    ...drivers.filter(d => d.status === DRIVER_STATUS.ACTIVE).slice(0, 2).map(d => ({
      id:    `drv-${d.id}`,
      icon:  'User',
      color: 'text-violet-400',
      text:  `${d.full_name} on duty`,
      sub:   d.vehicle_reg || '',
      time:  new Date().toISOString(),
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)

  return (
    <div className="space-y-1">
      {events.length === 0 && (
        <div className="flex flex-col items-center py-6 text-slate-700 gap-2">
          <Icon name="Activity" size={24} className="opacity-30" />
          <span className="text-xs">No recent activity</span>
        </div>
      )}
      {events.map(e => (
        <div key={e.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800/30 transition-colors">
          <div className={`w-6 h-6 rounded-md bg-slate-900 border border-slate-800/60 flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <Icon name={e.icon} size={11} className={e.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-300 truncate">{e.text}</div>
            {e.sub && <div className="text-2xs text-slate-600 truncate">{e.sub}</div>}
          </div>
          <span className="text-2xs text-slate-700 font-mono flex-shrink-0">
            {new Date(e.time).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────
function Section({ title, icon, action, children, className = '' }) {
  return (
    <div className={`bg-[#0d1426] border border-slate-800/60 rounded-xl flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/40">
        <div className="flex items-center gap-2">
          <Icon name={icon} size={13} className="text-slate-600" />
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        {action}
      </div>
      <div className="flex-1 p-3 overflow-y-auto scrollbar-none">
        {children}
      </div>
    </div>
  )
}

// ─── Live system status bar ───────────────────────────────────
function SystemBar({ vehicles, alerts, loading }) {
  const online   = vehicles.filter(v => v.status === 'active').length
  const critical = alerts.filter(a => a.severity === 'critical').length
  return (
    <div className="flex items-center gap-4 text-2xs text-slate-600 px-1">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${online > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
        <span>{online} live</span>
      </div>
      {critical > 0 && (
        <div className="flex items-center gap-1.5 text-red-400">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span>{critical} critical</span>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
        <span>{loading ? 'Syncing…' : 'Live'}</span>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { vehicles } = useFleetStore(s => ({ vehicles: s.vehicles }))
  const { drivers }  = useDriverStore(s => ({ drivers:  s.drivers  }))
  const [alerts,   setAlerts]  = useState([])
  const [loading,  setLoading] = useState(true)
  const mapRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fleetService.fetchVehicles(),
      driverService.fetchDrivers(),
      safetyService.fetchAlerts({ resolved: false })
        .then(setAlerts)
        .catch(() => setAlerts([])),
    ])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Subscribe to fleet-wide telemetry for live map markers
  useEffect(() => {
    const unsub = telemetryService.subscribeFleet(() => {})
    return () => unsub?.()
  }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  // Derived stats
  const activeVehicles  = vehicles.filter(v => v.status === VEHICLE_STATUS.ACTIVE).length
  const idleVehicles    = vehicles.filter(v => v.status === VEHICLE_STATUS.IDLE).length
  const maintenanceVeh  = vehicles.filter(v => v.status === VEHICLE_STATUS.MAINTENANCE).length
  const activeDrivers   = drivers.filter(d => d.status === DRIVER_STATUS.ACTIVE).length
  const criticalAlerts  = alerts.filter(a => a.severity === 'critical').length
  const lowFuel         = vehicles.filter(v => v.fuel_level != null && v.fuel_level < 20).length
  const avgScore        = drivers.length
    ? Math.round(drivers.reduce((s, d) => s + (d.safety_score || 0), 0) / drivers.length) : null

  const mapMarkers = vehicles
    .filter(v => v.lat && v.lng)
    .map(v => ({ id: v.id, lat: v.lat, lng: v.lng, label: v.reg_number, status: v.status, speed: v.speed, fuel: v.fuel_level }))

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Fleet Command</h1>
            <div className="mt-1">
              <SystemBar vehicles={vehicles} alerts={alerts} loading={loading} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
              <Icon name="RefreshCw" size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <LiveClock />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Active Vehicles" value={activeVehicles}     sub={`of ${vehicles.length} total`} icon="Truck"        color="text-cyan-400"    bg="bg-cyan-500/5"    border="border-cyan-500/10"   onClick={() => navigate(ROUTES.FLEET)} />
          <KpiCard label="Idle"            value={idleVehicles}       sub="vehicles idle"                 icon="PauseCircle"  color="text-amber-400"   bg="bg-amber-500/5"   border="border-amber-500/10"  onClick={() => navigate(ROUTES.FLEET)} />
          <KpiCard label="Maintenance"     value={maintenanceVeh}     sub="off the road"                  icon="Wrench"       color="text-violet-400"  bg="bg-violet-500/5"  border="border-violet-500/10" onClick={() => navigate(ROUTES.FLEET)} />
          <KpiCard label="Active Drivers"  value={activeDrivers}      sub={`of ${drivers.length} total`} icon="Users"        color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/10" onClick={() => navigate(ROUTES.DRIVERS)} />
          <KpiCard label="Open Alerts"     value={alerts.length}      sub={criticalAlerts > 0 ? `${criticalAlerts} critical` : 'all clear'} icon="Bell" color={criticalAlerts > 0 ? 'text-red-400' : 'text-slate-400'} bg={criticalAlerts > 0 ? 'bg-red-500/5' : 'bg-slate-900/40'} border={criticalAlerts > 0 ? 'border-red-500/15' : 'border-slate-800/60'} pulse={criticalAlerts > 0} onClick={() => navigate(ROUTES.SAFETY)} />
          <KpiCard label="Low Fuel"        value={lowFuel}            sub="below 20%"                     icon="Droplets"     color={lowFuel > 0 ? 'text-red-400' : 'text-slate-500'} bg={lowFuel > 0 ? 'bg-red-500/5' : 'bg-slate-900/40'} border={lowFuel > 0 ? 'border-red-500/10' : 'border-slate-800/60'} onClick={() => navigate(ROUTES.FLEET)} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left col: vehicles + drivers */}
          <div className="flex flex-col gap-5">
            <Section title="Active Fleet" icon="Truck"
              className="flex-1 min-h-[220px]"
              action={
                <button onClick={() => navigate(ROUTES.FLEET)}
                  className="text-2xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  View all <Icon name="ArrowRight" size={10} />
                </button>
              }>
              {vehicles.filter(v => v.status === 'active').slice(0, 7).map(v => (
                <VehicleRow key={v.id} vehicle={v} onClick={() => navigate(ROUTES.FLEET)} />
              ))}
              {vehicles.filter(v => v.status === 'active').length === 0 && (
                <div className="flex flex-col items-center py-6 text-slate-700 gap-1.5">
                  <Icon name="Truck" size={24} className="opacity-20" />
                  <span className="text-xs">No active vehicles</span>
                </div>
              )}
            </Section>

            <Section title="On-Duty Drivers" icon="Users"
              className="flex-1 min-h-[180px]"
              action={
                <button onClick={() => navigate(ROUTES.DRIVERS)}
                  className="text-2xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  View all <Icon name="ArrowRight" size={10} />
                </button>
              }>
              {drivers.filter(d => d.status === DRIVER_STATUS.ACTIVE).slice(0, 5).map(d => (
                <DriverRow key={d.id} driver={d} onClick={() => navigate(ROUTES.DRIVERS)} />
              ))}
              {drivers.filter(d => d.status === DRIVER_STATUS.ACTIVE).length === 0 && (
                <div className="flex flex-col items-center py-6 text-slate-700 gap-1.5">
                  <Icon name="Users" size={24} className="opacity-20" />
                  <span className="text-xs">No drivers active</span>
                </div>
              )}
            </Section>
          </div>

          {/* Centre: live map */}
          <div className="xl:col-span-1">
            <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl overflow-hidden h-full min-h-[460px] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <Icon name="Map" size={13} className="text-slate-600" />
                  <span className="text-sm font-semibold text-white">Live Map</span>
                  {mapMarkers.length > 0 && (
                    <span className="text-2xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full font-mono">
                      {mapMarkers.length}
                    </span>
                  )}
                </div>
                <button onClick={() => navigate(ROUTES.NAVIGATION)}
                  className="text-2xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                  Full map <Icon name="ArrowRight" size={10} />
                </button>
              </div>
              <div className="flex-1">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full bg-[#050810] text-slate-700 gap-2">
                    <Icon name="Loader2" size={16} className="animate-spin" /><span className="text-xs">Loading map…</span>
                  </div>
                }>
                  <ApexMap
                    ref={mapRef}
                    markers={mapMarkers}
                    height="100%"
                    className="h-full"
                  />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Right col: alerts + activity */}
          <div className="flex flex-col gap-5">
            <Section title="Safety Alerts" icon="ShieldAlert"
              className="flex-1 min-h-[220px]"
              action={
                alerts.length > 0 ? (
                  <button onClick={() => navigate(ROUTES.SAFETY)}
                    className="text-2xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View all <Icon name="ArrowRight" size={10} />
                  </button>
                ) : null
              }>
              {alerts.slice(0, 5).map(a => <AlertRow key={a.id} alert={a} />)}
              {alerts.length === 0 && (
                <div className="flex flex-col items-center py-6 text-slate-700 gap-1.5">
                  <Icon name="ShieldCheck" size={24} className="opacity-20" />
                  <span className="text-xs">All systems nominal</span>
                </div>
              )}
            </Section>

            <Section title="Activity Feed" icon="Activity"
              className="flex-1 min-h-[180px]">
              <ActivityFeed vehicles={vehicles} alerts={alerts} drivers={drivers} />
            </Section>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Dispatch Job',  icon: 'Radio',          color: 'text-cyan-400',    route: ROUTES.DISPATCH    },
            { label: 'Report Incident',   icon: 'FileText',       color: 'text-red-400',     route: ROUTES.INCIDENTS   },
            { label: 'Safety Alerts',     icon: 'ShieldAlert',    color: 'text-amber-400',   route: ROUTES.SAFETY      },
            { label: 'Open Analytics',    icon: 'BarChart3',      color: 'text-violet-400',  route: ROUTES.ANALYTICS   },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.route)}
              className="flex items-center gap-2.5 bg-[#0d1426] border border-slate-800/60 rounded-xl px-4 py-3.5 hover:border-slate-700/60 hover:bg-slate-800/20 transition-all text-left group">
              <Icon name={a.icon} size={15} className={`${a.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">{a.label}</span>
              <Icon name="ArrowRight" size={11} className="text-slate-700 group-hover:text-slate-500 ml-auto transition-colors" />
            </button>
          ))}
        </div>

        {/* Fleet health summary */}
        <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Activity" size={14} className="text-slate-600" />
            <span className="text-sm font-semibold text-white">Fleet Health</span>
            {avgScore != null && (
              <div className={`ml-auto flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                avgScore >= 85 ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/15' :
                avgScore >= 65 ? 'text-amber-400  bg-amber-500/5  border-amber-500/15'  :
                                 'text-red-400    bg-red-500/5    border-red-500/15'
              }`}>
                <Icon name="ShieldCheck" size={11} />
                Score {avgScore}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Fleet Utilisation', value: vehicles.length ? `${Math.round((activeVehicles / vehicles.length) * 100)}%` : '—', icon: 'Gauge',    color: 'text-cyan-400'    },
              { label: 'Avg Safety Score',  value: avgScore ?? '—',                                                                   icon: 'ShieldCheck', color: avgScore >= 85 ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'Vehicles Online',   value: `${activeVehicles}/${vehicles.length}`,                                            icon: 'Truck',      color: 'text-violet-400'  },
              { label: 'Drivers On Duty',   value: `${activeDrivers}/${drivers.length}`,                                              icon: 'Users',      color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/40 rounded-lg p-3">
                <Icon name={s.icon} size={16} className={s.color} />
                <div>
                  <div className={`font-mono font-bold text-lg leading-none ${s.color}`}>{s.value}</div>
                  <div className="text-2xs text-slate-600 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
