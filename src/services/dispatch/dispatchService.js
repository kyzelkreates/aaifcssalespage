/**
 * APEX AI — Dispatch Service
 */

import { supabase } from '@services/supabase/supabaseClient'

export const JOB_STATUS = { PENDING: 'pending', ASSIGNED: 'assigned', IN_PROGRESS: 'in_progress', COMPLETED: 'completed', CANCELLED: 'cancelled' }
export const JOB_PRIORITY = { LOW: 'low', NORMAL: 'normal', HIGH: 'high', URGENT: 'urgent' }

export const STATUS_COLORS = {
  pending:     'muted',
  assigned:    'cyan',
  in_progress: 'amber',
  completed:   'cyan',
  cancelled:   'red'
}

export const dispatchService = {
  async fetchJobs(filters = {}) {
    let q = supabase.from('dispatch_jobs').select('*').order('created_at', { ascending: false })
    if (filters.status)    q = q.eq('status', filters.status)
    if (filters.driver_id) q = q.eq('driver_id', filters.driver_id)
    if (filters.priority)  q = q.eq('priority', filters.priority)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  async createJob(payload) {
    const { data, error } = await supabase.from('dispatch_jobs').insert({ ...payload, status: JOB_STATUS.PENDING }).select().single()
    if (error) throw error
    return data
  },

  async updateJob(id, payload) {
    const { data, error } = await supabase.from('dispatch_jobs').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async assignJob(jobId, driverId, vehicleId) {
    return this.updateJob(jobId, { driver_id: driverId, vehicle_id: vehicleId, status: JOB_STATUS.ASSIGNED, assigned_at: new Date().toISOString() })
  },

  async cancelJob(id, reason) {
    return this.updateJob(id, { status: JOB_STATUS.CANCELLED, cancel_reason: reason, cancelled_at: new Date().toISOString() })
  },

  subscribeToJobs(callback) {
    return supabase.channel('dispatch_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_jobs' }, p => callback(p))
      .subscribe()
  }
}

export default dispatchService
