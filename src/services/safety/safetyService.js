/**
 * APEX AI — Safety Service
 */

import { supabase } from '@services/supabase/supabaseClient'

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
  critical: { variant: 'red',   dot: 'offline' }
}

export const safetyService = {
  async fetchAlerts(filters = {}) {
    let q = supabase.from('safety_alerts').select('*').order('created_at', { ascending: false }).limit(100)
    if (filters.severity) q = q.eq('severity', filters.severity)
    if (filters.driver_id) q = q.eq('driver_id', filters.driver_id)
    if (filters.resolved !== undefined) q = q.eq('resolved', filters.resolved)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async resolveAlert(id) {
    const { data, error } = await supabase
      .from('safety_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async fetchDriverScoreHistory(driverId, days = 30) {
    const since = new Date(Date.now() - days * 86400000).toISOString()
    const { data } = await supabase
      .from('driver_scores')
      .select('*')
      .eq('driver_id', driverId)
      .gte('date', since)
      .order('date')
    return data || []
  },

  subscribeToAlerts(callback) {
    return supabase
      .channel('safety_alerts_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'safety_alerts' }, p => callback(p.new))
      .subscribe()
  }
}

export default safetyService
