/**
 * ============================================================
 * APEX AI — System Status Hook (Local Mode)
 * Monitors localStorage availability + navigator.onLine.
 * Sets systemStatus to 'online' | 'degraded' | 'offline'.
 * ============================================================
 */

import { useEffect, useRef } from 'react'
import { useAppStore } from '@core/storage'

export function useSystemStatus() {
  const setSystemStatus = useAppStore(s => s.setSystemStatus)
  const intervalRef     = useRef(null)

  useEffect(() => {
    const check = () => {
      try {
        // Verify localStorage is writable
        localStorage.setItem('apex:ping', '1')
        localStorage.removeItem('apex:ping')
        setSystemStatus(navigator.onLine ? 'online' : 'degraded')
      } catch {
        setSystemStatus('offline')
      }
    }

    check()

    const onOnline  = () => setSystemStatus('online')
    const onOffline = () => setSystemStatus('degraded')

    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    intervalRef.current = setInterval(check, 30000)

    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [setSystemStatus])
}

export default useSystemStatus
