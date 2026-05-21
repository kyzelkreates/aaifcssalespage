/**
 * ============================================================
 * APEX AI — Dispatch Center Page (Run 10)
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react'
import Icon from '@components/ui/Icon'
import Badge from '@components/ui/Badge'
import StatusDot from '@components/ui/StatusDot'
import { dispatchService, JOB_STATUS, JOB_PRIORITY, STATUS_COLORS } from '@services/dispatch/dispatchService'
import { useFleetStore, useDriverStore } from '@core/storage'
import { fleetService } from '@services/fleet/fleetService'
import { driverService } from '@services/drivers/driverService'
import { formatDateTime } from '@utils/format'

const PRIORITY_COLORS = { low: 'muted', normal: 'cyan', high: 'amber', urgent: 'red' }
const PRIORITY_ICONS  = { low: 'ArrowDown', normal: 'Minus', high: 'ArrowUp', urgent: 'AlertOctagon' }

function JobCard({ job, onAssign, onCancel, onComplete }) {
  const priColor = PRIORITY_COLORS[job.priority] || 'muted'
  const stsColor = STATUS_COLORS[job.status] || 'muted'
  return (
    <div className={`bg-[#0d1426] border rounded-lg p-4 transition-all ${
      job.priority === 'urgent' ? 'border-red-500/40' : 'border-slate-800/60'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{job.title || `Job #${job.id?.slice(0,8)}`}</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">{job.origin} → {job.destination}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant={priColor} size="sm">
            <Icon name={PRIORITY_ICONS[job.priority] || 'Minus'} size={9} />
            {job.priority}
          </Badge>
          <Badge variant={stsColor} size="sm">{job.status?.replace('_', ' ')}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
        <div className="flex items-center gap-1.5">
          <Icon name="User"  size={11} className="text-slate-600" />
          {job.driver_name || 'Unassigned'}
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="Truck" size={11} className="text-slate-600" />
          {job.vehicle_reg || 'No vehicle'}
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <Icon name="Clock" size={11} className="text-slate-600" />
          {formatDateTime(job.created_at)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {job.status === JOB_STATUS.PENDING && (
          <button onClick={() => onAssign?.(job)}
            className="flex-1 py-1.5 text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/20 transition-colors">
            <Icon name="UserCheck" size={11} className="inline mr-1" />Assign
          </button>
        )}
        {job.status === JOB_STATUS.ASSIGNED && (
          <button onClick={() => onComplete?.(job.id)}
            className="flex-1 py-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors">
            <Icon name="CheckCircle2" size={11} className="inline mr-1" />Complete
          </button>
        )}
        {![JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED].includes(job.status) && (
          <button onClick={() => onCancel?.(job.id)}
            className="py-1.5 px-3 text-xs text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

function JobModal({ onClose, onSaved, vehicles, drivers }) {
  const [form,   setForm]   = useState({ title: '', origin: '', destination: '', priority: JOB_PRIORITY.NORMAL, notes: '', driver_id: '', vehicle_id: '', scheduled_at: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const driver  = drivers.find(d => d.id === form.driver_id)
      const vehicle = vehicles.find(v => v.id === form.vehicle_id)
      await dispatchService.createJob({ ...form, driver_name: driver?.full_name, vehicle_reg: vehicle?.reg_number })
      onSaved?.(); onClose?.()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <h2 className="font-display font-semibold text-white">New Dispatch Job</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><Icon name="X" size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Job Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required className="apex-input" placeholder="e.g. Delivery to Manchester Depot" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Origin</label>
              <input value={form.origin} onChange={e => set('origin', e.target.value)} className="apex-input" placeholder="Pickup location" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Destination</label>
              <input value={form.destination} onChange={e => set('destination', e.target.value)} className="apex-input" placeholder="Drop-off location" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className="apex-input">
                {Object.entries(JOB_PRIORITY).map(([k, v]) => <option key={k} value={v}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Scheduled At</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} className="apex-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Assign Driver</label>
              <select value={form.driver_id} onChange={e => set('driver_id', e.target.value)} className="apex-input">
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Assign Vehicle</label>
              <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)} className="apex-input">
                <option value="">None</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="apex-input resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2 disabled:opacity-40">
              {saving ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dispatch() {
  const { vehicles } = useFleetStore(s => ({ vehicles: s.vehicles }))
  const { drivers }  = useDriverStore(s => ({ drivers: s.drivers }))
  const [jobs,    setJobs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [filter,  setFilter]  = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setJobs(await dispatchService.fetchJobs({ status: filter })) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load(); fleetService.fetchVehicles(); driverService.fetchDrivers() }, [load])

  useEffect(() => {
    const sub = dispatchService.subscribeToJobs(() => load())
    return () => sub.unsubscribe()
  }, [load])

  const handleAssign = async (job) => {
    const driverId  = prompt('Driver ID:')
    const vehicleId = prompt('Vehicle ID:')
    if (!driverId) return
    await dispatchService.assignJob(job.id, driverId, vehicleId || null)
    load()
  }

  const handleComplete = async (id) => {
    await dispatchService.updateJob(id, { status: JOB_STATUS.COMPLETED, completed_at: new Date().toISOString() })
    load()
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this job?')) return
    await dispatchService.cancelJob(id, 'Cancelled by operator')
    load()
  }

  const counts = Object.values(JOB_STATUS).reduce((acc, s) => {
    acc[s] = jobs.filter(j => j.status === s).length
    return acc
  }, {})

  const STATUS_TABS = [
    { key: null,                    label: 'All',         count: jobs.length },
    { key: JOB_STATUS.PENDING,      label: 'Pending',     count: counts.pending },
    { key: JOB_STATUS.ASSIGNED,     label: 'Assigned',    count: counts.assigned },
    { key: JOB_STATUS.IN_PROGRESS,  label: 'In Progress', count: counts.in_progress },
    { key: JOB_STATUS.COMPLETED,    label: 'Completed',   count: counts.completed },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Dispatch Center</h1>
            <p className="text-slate-500 text-xs mt-0.5">{jobs.length} jobs · {counts.pending || 0} pending assignment</p>
          </div>
          <button onClick={() => setModal(true)} className="btn-primary text-sm px-4 py-2">
            <Icon name="Plus" size={14} /> New Job
          </button>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === t.key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
              }`}>
              {t.label}
              <span className={`text-2xs px-1.5 py-0.5 rounded-full ${filter === t.key ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-600'}`}>
                {t.count}
              </span>
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={load} disabled={loading} className="btn-ghost p-2">
            <Icon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading && jobs.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.filter(j => !filter || j.status === filter).map(j => (
              <JobCard key={j.id} job={j} onAssign={handleAssign} onComplete={handleComplete} onCancel={handleCancel} />
            ))}
            {jobs.filter(j => !filter || j.status === filter).length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
                <Icon name="Radio" size={36} className="mb-3 opacity-20" />
                <p className="text-sm">No jobs {filter ? `with status: ${filter}` : ''}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && <JobModal onClose={() => setModal(false)} onSaved={load} vehicles={vehicles} drivers={drivers} />}
    </div>
  )
}
