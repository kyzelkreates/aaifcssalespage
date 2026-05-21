/**
 * ============================================================
 * APEX AI — Realtime / Messaging Service (Local Mode)
 * localStorage-backed channels + messages. BroadcastChannel
 * syncs messages across tabs in real time.
 * ============================================================
 */

const CH_KEY  = 'apex:db:channels'
const MSG_KEY = 'apex:db:messages'
const BC_NAME = 'apex:messaging'

const lsRead  = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const lsWrite = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid     = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`

export const MESSAGE_TYPE = { TEXT: 'text', ALERT: 'alert', SYSTEM: 'system', LOCATION: 'location' }

export const realtimeService = {
  async fetchChannels() {
    return lsRead(CH_KEY).sort((a, b) => b.updated_at?.localeCompare(a.updated_at))
  },

  async fetchMessages(channelId, limit = 50) {
    return lsRead(MSG_KEY)
      .filter(m => m.channel_id === channelId)
      .sort((a, b) => a.created_at?.localeCompare(b.created_at))
      .slice(-limit)
  },

  async sendMessage(channelId, content, type = MESSAGE_TYPE.TEXT) {
    const msg = { id: uid(), channel_id: channelId, content, type, created_at: new Date().toISOString() }
    const msgs = lsRead(MSG_KEY)
    lsWrite(MSG_KEY, [...msgs, msg])
    // Update channel updated_at
    const channels = lsRead(CH_KEY)
    const idx = channels.findIndex(c => c.id === channelId)
    if (idx > -1) { channels[idx].updated_at = msg.created_at; lsWrite(CH_KEY, channels) }
    // Broadcast to other tabs
    try { new BroadcastChannel(BC_NAME).postMessage({ event: 'message', data: msg }) } catch {}
    return msg
  },

  async createChannel(name, participants = []) {
    const channels = lsRead(CH_KEY)
    const ch = { id: uid(), name, participants, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    lsWrite(CH_KEY, [ch, ...channels])
    return ch
  },

  subscribeToChannel(channelId, callback) {
    try {
      const bc = new BroadcastChannel(BC_NAME)
      bc.onmessage = (e) => {
        if (e.data?.event === 'message' && e.data?.data?.channel_id === channelId) {
          callback(e.data.data)
        }
      }
      return bc
    } catch {
      return { close: () => {} }
    }
  },
}

export default realtimeService
