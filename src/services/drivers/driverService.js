/**
 * ============================================================
 * APEX AI — Driver Service (Local Mode — no Supabase)
 * Full CRUD via localStorage. Zero external dependencies.
 * ============================================================
 */

import { useDriverStore } from '@core/storage'

const LS_KEY   = 'apex:db:drivers'
const SCORE_KEY = 'apex:db:driver_scores'

const lsRead  = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
const lsWrite = (key, rows) => localStorage.setItem(key, JSON.stringify(rows))
const uid     = () => `drv_${Date.now()}_${Math.random().toString(36).slice(2,7)}`

export const DRIVER_STATUS = {
  ACTIVE:    'active',
  OFF_DUTY:  'off_duty',
  ON_BREAK:  'on_break',
  SUSPENDED: 'suspended',
  INACTIVE:  'inactive',
}

export const LICENCE_TYPE = {
  A: 'A', B: 'B', C: 'C', CE: 'CE', D: 'D', DE: 'DE', AM: 'AM',
}

export const driverService = {
  async fetchDrivers(filters = {}) {
    useDriverStore.getState().setLoading(true)
    try {
      let rows = lsRead(LS_KEY).sort((a, b) => b.created_at?.localeCompare(a.created_at))
      if (filters.status) rows = rows.filter(d => d.status === filters.status)
      if (filters.search) {
        const s = filters.search.toLowerCase()
        rows = rows.filter(d => d.full_name?.toLowerCase().includes(s) || d.licence_number?.toLowerCase().includes(s))
      }
      useDriverStore.getState().setDrivers(rows)
      return rows
    } catch (e) {
      console.error('[driverService] fetchDrivers:', e)
      return []
    } finally {
      useDriverStore.getState().setLoading(false)
    }
  },

  async getDriver(id) {
    return lsRead(LS_KEY).find(d => d.id === id) || null
  },

  async createDriver(payload) {
    const rows = lsRead(LS_KEY)
    const row  = { ...payload, id: uid(), created_at: new Date().toISOString() }
    lsWrite(LS_KEY, [row, ...rows])
    await this.fetchDrivers()
    return row
  },

  async updateDriver(id, payload) {
    const rows  = lsRead(LS_KEY)
    const update = { ...payload, updated_at: new Date().toISOString() }
    const idx   = rows.findIndex(d => d.id === id)
    if (idx > -1) { rows[idx] = { ...rows[idx], ...update }; lsWrite(LS_KEY, rows) }
    useDriverStore.getState().setDrivers(
      useDriverStore.getState().drivers.map(d => d.id === id ? { ...d, ...update } : d)
    )
    return rows[idx] || null
  },

  async deleteDriver(id) {
    const rows = lsRead(LS_KEY).filter(d => d.id !== id)
    lsWrite(LS_KEY, rows)
    useDriverStore.getState().setDrivers(
      useDriverStore.getState().drivers.filter(d => d.id !== id)
    )
  },

  async getScores(driverId) {
    return lsRead(SCORE_KEY)
      .filter(s => s.driver_id === driverId)
      .sort((a, b) => b.date?.localeCompare(a.date))
      .slice(0, 30)
  },
}

export default driverService
