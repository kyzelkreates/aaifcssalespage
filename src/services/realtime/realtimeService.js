/**
 * APEX AI — Realtime / Messaging Service
 */

import { supabase } from '@services/supabase/supabaseClient'

export const MESSAGE_TYPE = { TEXT: 'text', ALERT: 'alert', SYSTEM: 'system', LOCATION: 'location' }

export const realtimeService = {
  async fetchChannels() {
    const { data } = await supabase.from('message_channels').select('*').order('updated_at', { ascending: false })
    return data || []
  },

  async fetchMessages(channelId, limit = 50) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(limit)
    return data || []
  },

  async sendMessage(channelId, content, type = MESSAGE_TYPE.TEXT) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ channel_id: channelId, content, type })
      .select().single()
    if (error) throw error
    return data
  },

  async createChannel(name, participants = []) {
    const { data, error } = await supabase
      .from('message_channels')
      .insert({ name, participants })
      .select().single()
    if (error) throw error
    return data
  },

  subscribeToChannel(channelId, callback) {
    return supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, p => callback(p.new))
      .subscribe()
  }
}

export default realtimeService
