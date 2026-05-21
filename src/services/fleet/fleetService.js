/**
 * ============================================================
 * APEX AI — Fleet Service (Local Mode — no Supabase)
 * Full CRUD via localStorage. Zero external dependencies.
 * ============================================================
 */

import { useFleetStore } from '@core/storage'

const LS_KEY = 'apex:db:vehicles'
const lsRead  = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
const lsWrite = (rows) => localStorage.setItem(LS_KEY, JSON.stringify(rows))
const uid     = () => `veh_${Date.now()}_${Math.random().toString(36).slice(2,7)}`

export const VEHICLE_STATUS = {
  ACTIVE:         'active',
  IDLE:           'idle',
  MAINTENANCE:    'maintenance',
  OFFLINE:        'offline',
  DECOMMISSIONED: 'decommissioned',
}

export const VEHICLE_TYPE = {
  HGV:     'hgv',
  VAN:     'van',
  CAR:     'car',
  TANKER:  'tanker',
  REEFER:  'reefer',
  FLATBED: 'flatbed',
  MINIBUS: 'minibus',
  OTHER:   'other',
}

export const STATUS_COLORS = {
  active:         'cyan',
  idle:           'amber',
  maintenance:    'orange',
  offline:        'red',
  decommissioned: 'slate',
}

export const fleetService = {

  async fetchVehicles(filters = {}) {
    useFleetStore.getState().setLoading(true)
    try {
      let rows = lsRead().sort((a, b) => b.created_at?.localeCompare(a.created_at))
      if (filters.status) rows = rows.filter(v => v.status === filters.status)
      if (filters.type)   rows = rows.filter(v => v.type === filters.type)
      if (filters.search) {
        const s = filters.search.toLowerCase()
        rows = rows.filter(v =>
          v.reg_number?.toLowerCase().includes(s) ||
          v.make?.toLowerCase().includes(s)
        )
      }
      useFleetStore.getState().setVehicles(rows)
      return rows
    } catch (e) {
      console.error('[fleetService] fetchVehicles:', e)
      return []
    } finally {
      useFleetStore.getState().setLoading(false)
    }
  },

  async getVehicle(id) {
    return lsRead().find(v => v.id === id) || null
  },

  async createVehicle(payload) {
    const rows = lsRead()
    const row  = { status: VEHICLE_STATUS.IDLE, ...payload, id: uid(), created_at: new Date().toISOString() }
    lsWrite([row, ...rows])
    await this.fetchVehicles()
    return row
  },

  async updateVehicle(id, payload) {
    const update = { ...payload, updated_at: new Date().toISOString() }
    const rows   = lsRead()
    const idx    = rows.findIndex(v => v.id === id)
    if (idx > -1) { rows[idx] = { ...rows[idx], ...update }; lsWrite(rows) }
    useFleetStore.getState().setVehicles(
      useFleetStore.getState().vehicles.map(v => v.id === id ? { ...v, ...update } : v)
    )
    return rows[idx] || null
  },

  async deleteVehicle(id) {
    lsWrite(lsRead().filter(v => v.id !== id))
    useFleetStore.getState().setVehicles(
      useFleetStore.getState().vehicles.filter(v => v.id !== id)
    )
  },

  async updateStatus(id, status) {
    return this.updateVehicle(id, { status })
  },

  async updateTelemetry(vehicleId, telemetry) {
    useFleetStore.getState().updateTelemetry?.(vehicleId, telemetry)
    return this.updateVehicle(vehicleId, {
      lat:        telemetry.lat,
      lng:        telemetry.lng,
      speed:      telemetry.speed,
      fuel_level: telemetry.fuel,
      last_seen:  new Date().toISOString(),
    })
  },

  // No-op in local mode — no realtime channel
  subscribeToVehicles(_callback) {
    return () => {}
  },
}

export default fleetService
