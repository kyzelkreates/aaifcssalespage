/**
 * ============================================================
 * APEX AI — Supabase Client
 * Project: https://yldskdhdqusmtdbhxxsl.supabase.co
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://yldskdhdqusmtdbhxxsl.supabase.co'
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const SUPABASE_CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

export default supabase
