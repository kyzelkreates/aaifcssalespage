/**
 * ============================================================
 * APEX AI — Vehicles Page
 * Browse view: vehicle grid + Add Vehicle button
 * Detail view: profile, telemetry, service history, edit
 * ============================================================
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Icon from '@components/ui/Icon'
import Badge from '@components/ui/Badge'
import StatusDot from '@components/ui/StatusDot'
import TelemetryValue from '@components/ui/TelemetryValue'
import VehicleModal from '@modules/fleet/VehicleModal'
import { useFleetStore } from '@core/storage'
import { fleetService, VEHICLE_STATUS } from '@services/fleet/fleetService'
import { formatDate } from '@utils/format'

// ─── Vehicle Profile Card ─────────────────────────────────────
function VehicleProfile({ vehicle, onEdit, onDelete }) {
  const [delConfirm, setDelConfirm] = useState(false)
  const navigate = useNavigate()

  const dot = vehicle.status === VEHICLE_STATUS.ACTIVE   ? 'online'
            : vehicle.status === VEHICLE_STATUS.IDLE      ? 'idle'
            : vehicle.status === VEHICLE_STATUS.MAINTENANCE ? 'warning'
            : 'offline'

  const serviceDue = vehicle.next_service_date
    ? Math.ceil((new Date(vehicle.next_service_date) - Date.now()) / 86400000)
    : null

  const handleDelete = async () => {
    await fleetService.deleteVehicle(vehicle.id)
    navigate('/vehicles')
  }

  return (
    <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
            <Icon name="Truck" size={22} className="text-slate-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono font-bold text-xl text-white">{vehicle.reg_number}</h2>
              <StatusDot status={dot} />
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              {[vehicle.year, vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(' ')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-800 rounded-lg hover:text-white hover:border-slate-700 transition-colors">
            <Icon name="Pencil" size={12} /> Edit
          </button>
          {delConfirm ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDelete}
                className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">
                Confirm Delete
              </button>
              <button onClick={() => setDelConfirm(false)}
                className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setDelConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-800 rounded-lg hover:text-red-400 hover:border-red-500/30 transition-colors">
              <Icon name="Trash2" size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Core identity grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {[
          ['VIN',            vehicle.vin            || '—'],
          ['Type',           vehicle.type?.toUpperCase() || '—'],
          ['Body',           vehicle.body_type      || '—'],
          ['Category',       vehicle.vehicle_category || '—'],
          ['Fuel Type',      vehicle.fuel_type      || '—'],
          ['Euro Standard',  vehicle.euro_standard  || '—'],
          ['Odometer',       vehicle.odometer_km ? `${Number(vehicle.odometer_km).toLocaleString()} km` : '—'],
          ['Driver',         vehicle.driver_name    || 'Unassigned'],
          ['Last Service',   vehicle.last_service_date ? formatDate(vehicle.last_service_date) : '—'],
        ].map(([l, v]) => (
          <div key={l} className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-3">
            <div className="text-2xs text-slate-600 uppercase tracking-widest font-semibold mb-1">{l}</div>
            <div className="text-sm text-slate-300 font-medium">{v}</div>
          </div>
        ))}
      </div>

      {/* Dimensions & Weight summary */}
      {(vehicle.height_m || vehicle.width_m || vehicle.length_m || vehicle.gross_weight_t) && (
        <div className="bg-slate-900/30 border border-slate-800/30 rounded-lg p-3 mb-3">
          <div className="text-2xs text-slate-600 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
            <Icon name="Ruler" size={9} /> Dimensions &amp; Weight
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Height',  vehicle.height_m  ? `${vehicle.height_m} m`  : '—'],
              ['Width',   vehicle.width_m   ? `${vehicle.width_m} m`   : '—'],
              ['Length',  vehicle.length_m  ? `${vehicle.length_m} m`  : '—'],
              ['GVW',     vehicle.gross_weight_t ? `${vehicle.gross_weight_t} t` : '—'],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-2xs text-slate-600 mb-0.5">{l}</div>
                <div className="text-xs text-slate-300 font-mono font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route restrictions summary */}
      {(vehicle.hazmat || vehicle.ulez_compliant != null || vehicle.max_speed_kmh) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {vehicle.hazmat && (
            <span className="flex items-center gap-1 text-2xs px-2 py-1 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-md">
              <Icon name="AlertTriangle" size={9} /> ADR / HAZMAT
            </span>
          )}
          {vehicle.ulez_compliant && (
            <span className="flex items-center gap-1 text-2xs px-2 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-md">
              <Icon name="CheckCircle" size={9} /> ULEZ Compliant
            </span>
          )}
          {vehicle.speed_limiter && (
            <span className="flex items-center gap-1 text-2xs px-2 py-1 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 rounded-md">
              <Icon name="Gauge" size={9} /> Speed Limiter {vehicle.max_speed_kmh ? `${vehicle.max_speed_kmh} km/h` : ''}
            </span>
          )}
          {vehicle.dvs_side_scan && (
            <span className="flex items-center gap-1 text-2xs px-2 py-1 bg-violet-500/10 border border-violet-500/25 text-violet-400 rounded-md">
              <Icon name="Eye" size={9} /> DVS Side Scan
            </span>
          )}
        </div>
      )}

      {/* Service due banner */}
      {serviceDue !== null && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
          serviceDue < 0  ? 'bg-red-500/5 border-red-500/20 text-red-400'
          : serviceDue < 14 ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
          : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
        }`}>
          <Icon name="Wrench" size={12} />
          {serviceDue < 0
            ? `Service overdue by ${Math.abs(serviceDue)} days`
            : serviceDue === 0 ? 'Service due today'
            : `Next service in ${serviceDue} days (${formatDate(vehicle.next_service_date)})`}
        </div>
      )}
    </div>
  )
}

// ─── Live Telemetry Card ──────────────────────────────────────
function TelemetryCard({ vehicle }) {
  const [live, setLive] = useState({
    speed: vehicle.speed     ?? 0,
    fuel:  vehicle.fuel_level ?? 0,
    lat:   vehicle.lat       ?? null,
    lng:   vehicle.lng       ?? null,
  })

  useEffect(() => {
    if (vehicle.status !== VEHICLE_STATUS.ACTIVE) return
    const id = setInterval(() => {
      setLive(l => ({
        ...l,
        speed: Math.max(0, Math.min(90, l.speed + (Math.random() - 0.5) * 6)),
        fuel:  Math.max(0, l.fuel - 0.001),
      }))
    }, 3000)
    return () => clearInterval(id)
  }, [vehicle.status])

  return (
    <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Activity" size={14} className="text-cyan-400" />
        <span className="text-sm font-semibold text-white">Live Telemetry</span>
        {vehicle.status === VEHICLE_STATUS.ACTIVE && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Live
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TelemetryValue label="Speed" value={Math.round(live.speed)} unit="km/h" size="md"
          status={live.speed > 80 ? 'warning' : 'nominal'} />
        <TelemetryValue label="Fuel" value={Math.round(live.fuel)} unit="%" size="md"
          status={live.fuel < 20 ? 'critical' : live.fuel < 35 ? 'warning' : 'nominal'} />
        <TelemetryValue label="Lat" value={live.lat != null ? live.lat.toFixed(4) : '—'} size="md" />
        <TelemetryValue label="Lng" value={live.lng != null ? live.lng.toFixed(4) : '—'} size="md" />
      </div>
      {vehicle.status !== VEHICLE_STATUS.ACTIVE && (
        <p className="text-xs text-slate-600 text-center mt-3">
          Telemetry streams when vehicle is active
        </p>
      )}
    </div>
  )
}

// ─── Key Compliance Dates ─────────────────────────────────────
function ComplianceDates({ vehicle }) {
  const items = [
    { label: 'MOT Expiry',             date: vehicle.mot_expiry },
    { label: 'Annual Test Due',        date: vehicle.annual_test_due },
    { label: 'Insurance Expiry',       date: vehicle.insurance_expiry },
    { label: 'Operator Licence',       date: vehicle.operator_licence_expiry },
    { label: 'Driver CPC',             date: vehicle.driver_cpc_expiry },
    { label: 'Tacho Card',             date: vehicle.driver_tacho_expiry },
    { label: 'Tacho Calibration Due',  date: vehicle.tacho_next_calibration },
    { label: 'Safety Inspection Due',  date: vehicle.next_safety_inspection },
    { label: 'Next Service',           date: vehicle.next_service_date },
  ].filter(r => r.date)

  if (!items.length) return null

  return (
    <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="ClipboardCheck" size={14} className="text-slate-500" />
        <span className="text-sm font-semibold text-white">Compliance Dates</span>
      </div>
      <div className="space-y-0.5">
        {items.map(({ label, date }) => {
          const d = Math.round((new Date(date) - new Date()) / 86400000)
          const col = d < 0 ? 'text-red-400' : d < 14 ? 'text-red-400'
                    : d < 30 ? 'text-amber-400' : d < 90 ? 'text-yellow-400' : 'text-emerald-400'
          const badge = d < 0 ? `EXPIRED ${Math.abs(d)}d ago` : `${d}d`
          return (
            <div key={label} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/30 last:border-0">
              <span className="text-slate-500">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-mono text-2xs">{formatDate(date)}</span>
                <span className={`font-semibold font-mono ${col}`}>{badge}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Service History ──────────────────────────────────────────
function ServiceHistory({ vehicle }) {
  const entries = [
    vehicle.last_service_date && {
      date: vehicle.last_service_date,
      type: 'Last Service',
      km:   vehicle.last_service_km ? `${Number(vehicle.last_service_km).toLocaleString()} km` : '',
      notes: vehicle.notes || '',
    },
    vehicle.brake_test_date && {
      date: vehicle.brake_test_date,
      type: 'Brake Test',
      km: '',
      notes: vehicle.brake_test_result || '',
    },
    vehicle.last_safety_inspection && {
      date: vehicle.last_safety_inspection,
      type: 'Safety Inspection',
      km: '',
      notes: vehicle.safety_inspection_type || '',
    },
  ].filter(Boolean)

  if (!entries.length) {
    return (
      <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-5 flex flex-col items-center justify-center py-10 text-slate-600">
        <Icon name="Wrench" size={24} className="mb-2 opacity-30" />
        <p className="text-xs">No service records yet — add them via Edit Vehicle</p>
      </div>
    )
  }

  return (
    <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Wrench" size={14} className="text-slate-500" />
        <span className="text-sm font-semibold text-white">Service & Inspection History</span>
      </div>
      <div className="space-y-3">
        {entries.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-cyan-500/40 mt-1.5" />
              {i < entries.length - 1 && <div className="w-px flex-1 bg-slate-800/60 my-1 min-h-[20px]" />}
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{s.type}</span>
                <span className="text-2xs text-slate-600 font-mono">{formatDate(s.date)}</span>
              </div>
              {(s.km || s.notes) && (
                <div className="text-2xs text-slate-500 mt-0.5">
                  {[s.km, s.notes].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Vehicle Browse (grid with Add button) ────────────────────
function VehicleBrowse({ vehicles, isLoading, onSelect, onAdd }) {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState(null)

  const filtered = vehicles.filter(v => {
    if (statusFilter && v.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return v.reg_number?.toLowerCase().includes(q)
        || v.make?.toLowerCase().includes(q)
        || v.model?.toLowerCase().includes(q)
        || v.driver_name?.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl font-bold text-white">Vehicles</h1>
          <button onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg transition-colors shadow-[0_0_16px_rgba(6,182,212,0.3)]">
            <Icon name="Plus" size={14} />
            Add Vehicle
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search reg, make, driver…" className="apex-input pl-8 py-1.5 text-xs w-48" />
          </div>
          {[null, 'active', 'idle', 'maintenance', 'offline'].map(s => (
            <button key={String(s)} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${
                statusFilter === s ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}>{s || 'All'}</button>
          ))}
          <span className="ml-auto text-2xs text-slate-600">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-600 gap-2">
            <Icon name="Loader2" size={18} className="animate-spin" />
            <span className="text-sm">Loading fleet…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Add vehicle CTA card */}
            <button onClick={onAdd}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-cyan-400 transition-all group min-h-[140px]">
              <div className="w-10 h-10 rounded-xl bg-slate-900/60 group-hover:bg-cyan-500/10 border border-slate-800 group-hover:border-cyan-500/30 flex items-center justify-center transition-all">
                <Icon name="Plus" size={18} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">Add Vehicle</p>
                <p className="text-2xs text-slate-700 mt-0.5">Full legal &amp; safety data</p>
              </div>
            </button>

            {filtered.map(v => {
              const dot = v.status === 'active' ? 'online' : v.status === 'idle' ? 'idle' : 'offline'
              return (
                <button key={v.id} onClick={() => onSelect(v)}
                  className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-4 text-left hover:border-slate-700/60 hover:bg-slate-800/20 transition-all group">
                  <div className="flex items-center gap-2.5 mb-2">
                    <StatusDot status={dot} />
                    <span className="font-mono font-bold text-sm text-white group-hover:text-cyan-200 transition-colors">
                      {v.reg_number}
                    </span>
                    <span className={`ml-auto text-2xs px-2 py-0.5 rounded border capitalize ${
                      v.status === 'active'      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      : v.status === 'idle'      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : v.status === 'maintenance' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>{v.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'Unknown model'}
                  </div>
                  {/* Dimensions pill */}
                  {(v.height_m || v.gross_weight_t) && (
                    <div className="flex items-center gap-1.5 mb-2">
                      {v.height_m && (
                        <span className="text-2xs px-1.5 py-0.5 bg-slate-800/60 rounded text-slate-500 font-mono">
                          H {v.height_m}m
                        </span>
                      )}
                      {v.gross_weight_t && (
                        <span className="text-2xs px-1.5 py-0.5 bg-slate-800/60 rounded text-slate-500 font-mono">
                          {v.gross_weight_t}t GVW
                        </span>
                      )}
                      {v.hazmat && (
                        <span className="text-2xs px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400">
                          ADR
                        </span>
                      )}
                    </div>
                  )}
                  {v.driver_name && (
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <Icon name="User" size={10} />{v.driver_name}
                    </div>
                  )}
                  {v.fuel_level != null && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          v.fuel_level > 40 ? 'bg-emerald-500'
                          : v.fuel_level > 20 ? 'bg-amber-500' : 'bg-red-500'
                        }`} style={{ width: `${v.fuel_level}%` }} />
                      </div>
                      <span className="text-2xs font-mono text-slate-500">{v.fuel_level}%</span>
                    </div>
                  )}
                </button>
              )
            })}

            {filtered.length === 0 && vehicles.length > 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-600">
                <Icon name="Search" size={28} className="mb-3 opacity-20" />
                <p className="text-sm">No vehicles match your search</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page Root ────────────────────────────────────────────────
export default function Vehicles() {
  const { vehicleId } = useParams()
  const navigate      = useNavigate()
  const { vehicles, isLoading } = useFleetStore(s => ({
    vehicles:  s.vehicles,
    isLoading: s.isLoading,
  }))
  const [modal,    setModal]    = useState(null)   // null | 'add' | vehicle object
  const [selected, setSelected] = useState(null)

  useEffect(() => { fleetService.fetchVehicles() }, [])

  // Resolve selected vehicle from URL param
  useEffect(() => {
    if (vehicleId) {
      const v = vehicles.find(v => v.id === vehicleId)
      setSelected(v || null)
    } else {
      setSelected(null)
    }
  }, [vehicleId, vehicles])

  const handleSaved = () => {
    fleetService.fetchVehicles()
    setModal(null)
  }

  // ── Browse view ───────────────────────────────────────────
  if (!vehicleId || !selected) {
    return (
      <>
        <VehicleBrowse
          vehicles={vehicles}
          isLoading={isLoading}
          onSelect={v => navigate(`/vehicles/${v.id}`)}
          onAdd={() => setModal('add')}
        />

        {modal === 'add' && (
          <VehicleModal
            vehicle={null}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )}
      </>
    )
  }

  // ── Detail view ───────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="px-6 py-3.5 border-b border-slate-800/60 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/vehicles')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <Icon name="ChevronLeft" size={13} /> Vehicles
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-xs font-mono font-semibold text-white">{selected.reg_number}</span>
        <button onClick={() => setModal(selected)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 border border-slate-800 rounded-lg hover:text-white hover:border-slate-700 transition-colors">
          <Icon name="Pencil" size={11} /> Edit Vehicle
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4 max-w-4xl">
        <VehicleProfile
          vehicle={selected}
          onEdit={() => setModal(selected)}
          onDelete={() => navigate('/vehicles')}
        />
        <TelemetryCard vehicle={selected} />
        <ComplianceDates vehicle={selected} />
        <ServiceHistory vehicle={selected} />
      </div>

      {modal && modal !== 'add' && (
        <VehicleModal
          vehicle={modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
