/**
 * APEX AI — Compliance Service
 */

import { supabase } from '@services/supabase/supabaseClient'

export const COMPLIANCE_STATUS = { PASS: 'pass', FAIL: 'fail', WARNING: 'warning', PENDING: 'pending', EXPIRED: 'expired' }
export const COMPLIANCE_CATEGORY = { LICENCE: 'licence', VEHICLE: 'vehicle', HOURS: 'hours', TACHOGRAPH: 'tachograph', INSURANCE: 'insurance', MOT: 'mot', TAX: 'tax', TRAINING: 'training' }

export const complianceService = {
  async fetchRecords(filters = {}) {
    let q = supabase.from('compliance_records').select('*').order('expiry_date', { ascending: true })
    if (filters.status)   q = q.eq('status', filters.status)
    if (filters.category) q = q.eq('category', filters.category)
    if (filters.entity_id) q = q.eq('entity_id', filters.entity_id)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async createRecord(payload) {
    const { data, error } = await supabase.from('compliance_records').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async updateRecord(id, payload) {
    const { data, error } = await supabase.from('compliance_records').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async fetchDriverHours(driverId, startDate, endDate) {
    const { data } = await supabase
      .from('driver_hours')
      .select('*')
      .eq('driver_id', driverId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
    return data || []
  },

  /** Check if any records expire within `days` */
  getExpiringRecords(records, days = 30) {
    const threshold = new Date(Date.now() + days * 86400000)
    return records.filter(r => r.expiry_date && new Date(r.expiry_date) <= threshold && r.status !== 'expired')
  }
}

export default complianceService
