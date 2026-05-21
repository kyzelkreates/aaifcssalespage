/**
 * ============================================================
 * APEX AI — Live Telemetry Service (Run 16)
 * Supabase realtime subscriptions for vehicle telemetry.
 * Falls back gracefully if tables don't exist yet.
 * ============================================================
 */

import { supabase }      from '@services/supabase/supabaseClient'
import { useFleetStore } from '@core/storage'

export const telemetryService = {
  _channels: new Map(),

  /**
   * Subscribe to live telemetry for a single vehicle.
   * Updates useFleetStore.telemetry[vehicleId] automatically.
   */
  subscribe(vehicleId, callback) {
    if (this._channels.has(vehicleId)) return // already subscribed

    const channel = supabase
      .channel(`telemetry:${vehicleId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'vehicle_telemetry',
        filter: `vehicle_id=eq.${vehicleId}`
      }, payload => {
        const data = payload.new
        useFleetStore.getState().updateTelemetry(vehicleId, data)
        callback?.(data)
      })
      .subscribe()

    this._channels.set(vehicleId, channel)
    return () => this.unsubscribe(vehicleId)
  },

  unsubscribe(vehicleId) {
    const ch = this._channels.get(vehicleId)
    if (ch) { ch.unsubscribe(); this._channels.delete(vehicleId) }
  },

  unsubscribeAll() {
    this._channels.forEach((ch) => ch.unsubscribe())
    this._channels.clear()
  },

  /**
   * Subscribe to ALL vehicle telemetry (fleet-wide).
   */
  subscribeFleet(callback) {
    const channel = supabase
      .channel('telemetry:fleet')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'vehicle_telemetry',
      }, payload => {
        const data = payload.new
        if (data.vehicle_id) {
          useFleetStore.getState().updateTelemetry(data.vehicle_id, data)
          callback?.(data)
        }
      })
      .subscribe()

    this._channels.set('fleet', channel)
    return () => { channel.unsubscribe(); this._channels.delete('fleet') }
  },

  /**
   * Fetch latest telemetry snapshot for a vehicle.
   */
  async getLatest(vehicleId) {
    const { data } = await supabase
      .from('vehicle_telemetry')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return data || null
  },

  /**
   * Fetch telemetry history for charting.
   */
  async getHistory(vehicleId, minutes = 60) {
    const since = new Date(Date.now() - minutes * 60000).toISOString()
    const { data } = await supabase
      .from('vehicle_telemetry')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .gte('created_at', since)
      .order('created_at')
    return data || []
  },

  /**
   * Insert a telemetry record (for AP3X driver app).
   */
  async push(vehicleId, payload) {
    const { data, error } = await supabase
      .from('vehicle_telemetry')
      .insert({ vehicle_id: vehicleId, ...payload })
      .select().single()
    if (error) throw error
    return data
  }
}

export default telemetryService
