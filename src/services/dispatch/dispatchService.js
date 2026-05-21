/**
 * ============================================================
 * APEX AI — Dispatch Service (Local Mode)
 * Full CRUD via localStorage. BroadcastChannel for live updates.
 * ============================================================
 */

const JOBS_KEY = 'apex:db:jobs'
const BC_NAME  = 'apex:dispatch'

const lsRead  = () => { try { return JSON.parse(localStorage.getItem(JOBS_KEY) || '[]') } catch { return [] } }
const lsWrite = (v) => localStorage.setItem(JOBS_KEY, JSON.stringify(v))
const uid     = () => `job_${Date.now()}_${Math.random().toString(36).slice(2,7)}`

export const JOB_STATUS   = { PENDING: 'pending', ASSIGNED: 'assigned', IN_PROGRESS: 'in_progress', COMPLETED: 'completed', CANCELLED: 'cancelled' }
export const JOB_PRIORITY = { LOW: 'low', NORMAL: 'normal', HIGH: 'high', URGENT: 'urgent' }

export const STATUS_COLORS = {
  pending:     'muted',
  assigned:    'cyan',
  in_progress: 'amber',
  completed:   'cyan',
  cancelled:   'red',
}

export const dispatchService = {
  async fetchJobs(filters = {}) {
    let rows = lsRead().sort((a, b) => b.created_at?.localeCompare(a.created_at))
    if (filters.status)    rows = rows.filter(j => j.status === filters.status)
    if (filters.driver_id) rows = rows.filter(j => j.driver_id === filters.driver_id)
    if (filters.priority)  rows = rows.filter(j => j.priority === filters.priority)
    return rows
  },

  async createJob(payload) {
    const rows = lsRead()
    const row  = { ...payload, status: JOB_STATUS.PENDING, id: uid(), created_at: new Date().toISOString() }
    lsWrite([row, ...rows])
    try { new BroadcastChannel(BC_NAME).postMessage({ event: 'create', data: row }) } catch {}
    return row
  },

  async updateJob(id, payload) {
    const rows   = lsRead()
    const update = { ...payload, updated_at: new Date().toISOString() }
    const idx    = rows.findIndex(j => j.id === id)
    if (idx > -1) { rows[idx] = { ...rows[idx], ...update }; lsWrite(rows) }
    try { new BroadcastChannel(BC_NAME).postMessage({ event: 'update', data: rows[idx] }) } catch {}
    return rows[idx] || null
  },

  async assignJob(jobId, driverId, vehicleId) {
    return this.updateJob(jobId, {
      driver_id: driverId, vehicle_id: vehicleId,
      status: JOB_STATUS.ASSIGNED, assigned_at: new Date().toISOString(),
    })
  },

  async cancelJob(id, reason) {
    return this.updateJob(id, {
      status: JOB_STATUS.CANCELLED, cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
  },

  subscribeToJobs(callback) {
    try {
      const bc = new BroadcastChannel(BC_NAME)
      bc.onmessage = (e) => callback(e.data)
      return bc
    } catch {
      return { close: () => {} }
    }
  },
}

export default dispatchService
