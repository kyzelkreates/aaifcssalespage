/**
 * ============================================================
 * APEX AI — Fleet Service (Supabase backend)
 * Full CRUD for vehicles via Supabase.
 * Falls back to localStorage if Supabase is unavailable.
 * Writes state to useFleetStore (SSOT).
 * ============================================================
 */

import { supabase, SUPABASE_CONFIGURED } from '../supabase/supabaseClient'
import { useFleetStore } from '../../core/storage'

export const VEHICLE_STATUS = {
  ACTIVE:          'active',
  IDLE:            'idle',
  MAINTENANCE:     'maintenance',
  OFFLINE:         'offline',
  DECOMMISSIONED:  'decommissioned',
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

// ─── localStorage fallback ─────────────────────────────────────
const LS_KEY = 'apex:vehicles'
const lsRead  = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
const lsWrite = (rows) => localStorage.setItem(LS_KEY, JSON.stringify(rows))
const lsId    = () => `loc_${Date.now()}_${Math.random().toString(36).slice(2,7)}`

export const fleetService = {

  // ── Fetch all vehicles ────────────────────────────────────
  async fetchVehicles(filters = {}) {
    useFleetStore.getState().setLoading(true)
    try {
      let rows = []

      if (SUPABASE_CONFIGURED) {
        let q = supabase.from('vehicles').select('*').order('created_at', { ascending: false })
        if (filters.status) q = q.eq('status', filters.status)
        if (filters.type)   q = q.eq('type',   filters.type)
        if (filters.search) q = q.ilike('reg_number', `%${filters.search}%`)
        const { data, error } = await q
        if (error) throw error
        rows = data || []
      } else {
        rows = lsRead()
        if (filters.status) rows = rows.filter(v => v.status === filters.status)
        if (filters.type)   rows = rows.filter(v => v.type   === filters.type)
        if (filters.search) {
          const s = filters.search.toLowerCase()
          rows = rows.filter(v =>
            v.reg_number?.toLowerCase().includes(s) ||
            v.make?.toLowerCase().includes(s)
          )
        }
      }

      useFleetStore.getState().setVehicles(rows)
      return rows
    } catch (e) {
      console.error('[fleetService] fetchVehicles:', e)
      // fallback to localStorage
      const rows = lsRead()
      useFleetStore.getState().setVehicles(rows)
      return rows
    } finally {
      useFleetStore.getState().setLoading(false)
    }
  },

  // ── Get single vehicle ────────────────────────────────────
  async getVehicle(id) {
    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single()
      if (error) throw error
      return data
    }
    return lsRead().find(v => v.id === id) || null
  },

  // ── Create vehicle ────────────────────────────────────────
  async createVehicle(payload) {
    const clean = { status: VEHICLE_STATUS.IDLE, ...payload }
    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([clean])
        .select()
        .single()
      if (error) throw error
      await this.fetchVehicles()
      return data
    }
    // localStorage fallback
    const rows = lsRead()
    const row  = { ...clean, id: lsId(), created_at: new Date().toISOString() }
    lsWrite([row, ...rows])
    await this.fetchVehicles()
    return row
  },

  // ── Update vehicle ────────────────────────────────────────
  async updateVehicle(id, payload) {
    const update = { ...payload, updated_at: new Date().toISOString() }
    if (SUPABASE_CONFIGURED) {
      const { data, error } = await supabase
        .from('vehicles')
        .update(update)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      useFleetStore.getState().setVehicles(
        useFleetStore.getState().vehicles.map(v => v.id === id ? data : v)
      )
      return data
    }
    // localStorage fallback
    const rows = lsRead()
    const idx  = rows.findIndex(v => v.id === id)
    if (idx > -1) { rows[idx] = { ...rows[idx], ...update }; lsWrite(rows) }
    useFleetStore.getState().setVehicles(
      useFleetStore.getState().vehicles.map(v => v.id === id ? { ...v, ...update } : v)
    )
    return rows[idx]
  },

  // ── Delete vehicle ────────────────────────────────────────
  async deleteVehicle(id) {
    if (SUPABASE_CONFIGURED) {
      const { error } = await supabase.from('vehicles').delete().eq('id', id)
      if (error) throw error
    } else {
      const rows = lsRead().filter(v => v.id !== id)
      lsWrite(rows)
    }
    useFleetStore.getState().setVehicles(
      useFleetStore.getState().vehicles.filter(v => v.id !== id)
    )
  },

  // ── Convenience helpers ───────────────────────────────────
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

  // ── Realtime subscription ─────────────────────────────────
  subscribeToVehicles(callback) {
    if (!SUPABASE_CONFIGURED) return () => {}
    const sub = supabase
      .channel('vehicles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
        this.fetchVehicles()
        callback?.(payload)
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  },
}

export default fleetService
