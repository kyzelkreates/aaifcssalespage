/**
 * ============================================================
 * APEX AI — Auth Provider (Supabase)
 * Restores session from Supabase on app mount.
 * Listens for auth state changes (cross-tab, cross-browser).
 * ============================================================
 */

import { useEffect } from 'react'
import { authService } from '../services/supabase/authService'
import { useAuthStore } from '../core/storage'

export default function AuthProvider({ children }) {
  const setLoading = useAuthStore(s => s.setLoading)

  useEffect(() => {
    setLoading(true)

    // Restore existing session
    authService.getSession().finally(() => setLoading(false))

    // Listen for auth state changes across tabs/browsers
    const unsubscribe = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.getState().clearAuth()
      }
    })

    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [])

  return children
}
