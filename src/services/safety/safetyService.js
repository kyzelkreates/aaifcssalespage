/**
 * ============================================================
 * APEX AI — Safety Service (Local Mode)
 * Full CRUD via localStorage. BroadcastChannel for live alerts.
 * ============================================================
 */

const ALERTS_KEY = 'apex:db:safety_alerts'
const SCORES_KEY = 'apex:db:driver_scores'
const BC_NAME    = 'apex:safety'

const lsRead  = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const lsWrite = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid     = () => `saf_${Date.now()}_${Math.random().toString(36).slice(2,7)}`

export const ALERT_SEVERITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' }
export const ALERT_TYPE = {
  SPEEDING:       'speeding',
  HARSH_BRAKE:    'harsh_brake',
  HARSH_ACCEL:    'harsh_acceleration',
  FATIGUE:        'fatigue',
  PHONE_USE:      'phone_use',
  SEATBELT:       'seatbelt',
  LANE_DEPARTURE: 'lane_departure',
  COLLISION:      'collision',
  GEOFENCE:       'geofence_breach',
}

export const SEVERITY_COLORS = {
  low:      { variant: 'cyan',  dot: 'idle'    },
  medium:   { variant: 'amber', dot: 'warning' },
  high:     { variant: 'red',   dot: 'warning' },
  critical: { variant: 'red',   dot: 'offline' },
}

export const safetyService = {
  async fetchAlerts(filters = {}) {
    let rows = lsRead(ALERTS_KEY)
      .sort((a, b) => b.created_at?.localeCompare(a.created_at))
      .slice(0, 100)
    if (filters.severity)           rows = rows.filter(a => a.severity === filters.severity)
    if (filters.driver_id)          rows = rows.filter(a => a.driver_id === filters.driver_id)
    if (filters.resolved !== undefined) rows = rows.filter(a => a.resolved === filters.resolved)
    return rows
  },

  async createAlert(payload) {
    const rows = lsRead(ALERTS_KEY)
    const row  = { ...payload, id: uid(), resolved: false, created_at: new Date().toISOString() }
    lsWrite(ALERTS_KEY, [row, ...rows])
    try { new BroadcastChannel(BC_NAME).postMessage(row) } catch {}
    return row
  },

  async resolveAlert(id) {
    const rows  = lsRead(ALERTS_KEY)
    const update = { resolved: true, resolved_at: new Date().toISOString() }
    const idx   = rows.findIndex(a => a.id === id)
    if (idx > -1) { rows[idx] = { ...rows[idx], ...update }; lsWrite(ALERTS_KEY, rows) }
    return rows[idx] || null
  },

  async fetchDriverScoreHistory(driverId, days = 30) {
    const since = new Date(Date.now() - days * 86400000).toISOString()
    return lsRead(SCORES_KEY)
      .filter(s => s.driver_id === driverId && s.date >= since.slice(0, 10))
      .sort((a, b) => a.date?.localeCompare(b.date))
  },

  subscribeToAlerts(callback) {
    try {
      const bc = new BroadcastChannel(BC_NAME)
      bc.onmessage = (e) => callback(e.data)
      return bc
    } catch {
      return { close: () => {} }
    }
  },
}

export default safetyService
