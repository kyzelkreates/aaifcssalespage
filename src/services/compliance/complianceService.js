/**
 * ============================================================
 * APEX AI — Compliance Service (Local Mode)
 * Full CRUD via localStorage. Zero external dependencies.
 * ============================================================
 */

const REC_KEY   = 'apex:db:compliance_records'
const HOURS_KEY = 'apex:db:driver_hours'

const lsRead  = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const lsWrite = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid     = () => `cmp_${Date.now()}_${Math.random().toString(36).slice(2,7)}`

export const COMPLIANCE_STATUS   = { PASS: 'pass', FAIL: 'fail', WARNING: 'warning', PENDING: 'pending', EXPIRED: 'expired' }
export const COMPLIANCE_CATEGORY = { LICENCE: 'licence', VEHICLE: 'vehicle', HOURS: 'hours', TACHOGRAPH: 'tachograph', INSURANCE: 'insurance', MOT: 'mot', TAX: 'tax', TRAINING: 'training' }

export const complianceService = {
  async fetchRecords(filters = {}) {
    let rows = lsRead(REC_KEY).sort((a, b) => a.expiry_date?.localeCompare(b.expiry_date))
    if (filters.status)    rows = rows.filter(r => r.status === filters.status)
    if (filters.category)  rows = rows.filter(r => r.category === filters.category)
    if (filters.entity_id) rows = rows.filter(r => r.entity_id === filters.entity_id)
    return rows
  },

  async createRecord(payload) {
    const rows = lsRead(REC_KEY)
    const row  = { ...payload, id: uid(), created_at: new Date().toISOString() }
    lsWrite(REC_KEY, [row, ...rows])
    return row
  },

  async updateRecord(id, payload) {
    const rows  = lsRead(REC_KEY)
    const update = { ...payload, updated_at: new Date().toISOString() }
    const idx   = rows.findIndex(r => r.id === id)
    if (idx > -1) { rows[idx] = { ...rows[idx], ...update }; lsWrite(REC_KEY, rows) }
    return rows[idx] || null
  },

  async fetchDriverHours(driverId, startDate, endDate) {
    return lsRead(HOURS_KEY)
      .filter(h => h.driver_id === driverId && h.date >= startDate && h.date <= endDate)
      .sort((a, b) => a.date?.localeCompare(b.date))
  },

  getExpiringRecords(records, days = 30) {
    const threshold = new Date(Date.now() + days * 86400000)
    return records.filter(r => r.expiry_date && new Date(r.expiry_date) <= threshold && r.status !== 'expired')
  },
}

export default complianceService
