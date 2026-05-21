/**
 * APEX AI — System Status Hook (Run 16)
 * Monitors Supabase connectivity and updates the global app store.
 */

import { useEffect, useRef } from 'react'
import { supabase }    from '@services/supabase/supabaseClient'
import { useAppStore } from '@core/storage'

export function useSystemStatus() {
  const setSystemStatus = useAppStore(s => s.setSystemStatus)
  const intervalRef     = useRef(null)
  const channelRef      = useRef(null)

  useEffect(() => {
    // Realtime heartbeat via presence
    const channel = supabase.channel('system:heartbeat', {
      config: { presence: { key: 'apex-os' } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setSystemStatus('online')
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') setSystemStatus('online')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSystemStatus('degraded')
        if (status === 'CLOSED') setSystemStatus('offline')
      })

    channelRef.current = channel

    // Fallback — poll connectivity every 30s
    intervalRef.current = setInterval(async () => {
      try {
        const { error } = await supabase.from('vehicles').select('id').limit(1)
        setSystemStatus(error ? 'degraded' : 'online')
      } catch {
        setSystemStatus('offline')
      }
    }, 30000)

    return () => {
      if (channelRef.current)  channelRef.current.unsubscribe()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [setSystemStatus])
}

export default useSystemStatus
