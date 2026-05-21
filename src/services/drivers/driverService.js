/**
 * APEX AI — Driver Service
 */

import { supabase }       from '../supabase/supabaseClient'
import { useDriverStore } from '../../core/storage'

export const DRIVER_STATUS = {
  ACTIVE:    'active',
  OFF_DUTY:  'off_duty',
  ON_BREAK:  'on_break',
  SUSPENDED: 'suspended',
  INACTIVE:  'inactive'
}

export const LICENCE_TYPE = {
  A: 'A', B: 'B', C: 'C', CE: 'CE', D: 'D', DE: 'DE', AM: 'AM'
}

export const driverService = {
  async fetchDrivers(filters = {}) {
    useDriverStore.getState().setLoading(true)
    try {
      let q = supabase.from('drivers').select('*').order('created_at', { ascending: false })
      if (filters.status) q = q.eq('status', filters.status)
      if (filters.search) q = q.ilike('full_name', `%${filters.search}%`)
      const { data, error } = await q
      if (error) throw error
      useDriverStore.getState().setDrivers(data || [])
      return data
    } catch (e) { console.error('[DriverService]', e); return [] }
    finally { useDriverStore.getState().setLoading(false) }
  },

  async getDriver(id) {
    const { data, error } = await supabase.from('drivers').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async createDriver(payload) {
    const { data, error } = await supabase.from('drivers').insert(payload).select().single()
    if (error) throw error
    await this.fetchDrivers()
    return data
  },

  async updateDriver(id, payload) {
    const { data, error } = await supabase.from('drivers').update(payload).eq('id', id).select().single()
    if (error) throw error
    useDriverStore.getState().setDrivers(
      useDriverStore.getState().drivers.map(d => d.id === id ? data : d)
    )
    return data
  },

  async deleteDriver(id) {
    const { error } = await supabase.from('drivers').delete().eq('id', id)
    if (error) throw error
    useDriverStore.getState().setDrivers(
      useDriverStore.getState().drivers.filter(d => d.id !== id)
    )
  },

  async getScores(driverId) {
    const { data } = await supabase
      .from('driver_scores')
      .select('*')
      .eq('driver_id', driverId)
      .order('date', { ascending: false })
      .limit(30)
    return data || []
  }
}

export default driverService
