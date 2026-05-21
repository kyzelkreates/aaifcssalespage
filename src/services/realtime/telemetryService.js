/**
 * ============================================================
 * APEX AI — Telemetry Service (Local Mode)
 * Stores telemetry in localStorage. Uses BroadcastChannel
 * to sync live data across tabs (AP3X → Fleet HQ).
 * ============================================================
 */

import { useFleetStore } from '@core/storage'

const TEL_KEY = 'apex:db:telemetry'
const BC_NAME = 'apex:telemetry'

const lsRead  = () => { try { return JSON.parse(localStorage.getItem(TEL_KEY) || '[]') } catch { return [] } }
const lsWrite = (rows) => localStorage.setItem(TEL_KEY, JSON.stringify(rows))
const uid     = () => `tel_${Date.now()}_${Math.random().toString(36).slice(2,7)}`

export const telemetryService = {
  _channels: new Map(),

  subscribe(vehicleId, callback) {
    if (this._channels.has(vehicleId)) return
    try {
      const bc = new BroadcastChannel(BC_NAME)
      bc.onmessage = (e) => {
        if (e.data?.vehicle_id === vehicleId) {
          useFleetStore.getState().updateTelemetry?.(vehicleId, e.data)
          callback?.(e.data)
        }
      }
      this._channels.set(vehicleId, bc)
    } catch {}
    return () => this.unsubscribe(vehicleId)
  },

  unsubscribe(vehicleId) {
    const bc = this._channels.get(vehicleId)
    if (bc) { try { bc.close() } catch {} this._channels.delete(vehicleId) }
  },

  unsubscribeAll() {
    this._channels.forEach(bc => { try { bc.close() } catch {} })
    this._channels.clear()
  },

  subscribeFleet(callback) {
    try {
      const bc = new BroadcastChannel(BC_NAME)
      bc.onmessage = (e) => {
        if (e.data?.vehicle_id) {
          useFleetStore.getState().updateTelemetry?.(e.data.vehicle_id, e.data)
          callback?.(e.data)
        }
      }
      this._channels.set('fleet', bc)
      return () => { try { bc.close() } catch {} this._channels.delete('fleet') }
    } catch {
      return () => {}
    }
  },

  async getLatest(vehicleId) {
    return lsRead()
      .filter(t => t.vehicle_id === vehicleId)
      .sort((a, b) => b.created_at?.localeCompare(a.created_at))[0] || null
  },

  async getHistory(vehicleId, minutes = 60) {
    const since = new Date(Date.now() - minutes * 60000).toISOString()
    return lsRead()
      .filter(t => t.vehicle_id === vehicleId && t.created_at >= since)
      .sort((a, b) => a.created_at?.localeCompare(b.created_at))
  },

  async push(vehicleId, payload) {
    const rows = lsRead()
    const row  = { ...payload, vehicle_id: vehicleId, id: uid(), created_at: new Date().toISOString() }
    // Keep last 500 records per vehicle
    const filtered = rows.filter(t => t.vehicle_id === vehicleId).slice(-499)
    const others   = rows.filter(t => t.vehicle_id !== vehicleId)
    lsWrite([...others, ...filtered, row])
    // Broadcast to fleet HQ tab
    try { new BroadcastChannel(BC_NAME).postMessage({ ...row }) } catch {}
    useFleetStore.getState().updateTelemetry?.(vehicleId, row)
    return row
  },
}

export default telemetryService
