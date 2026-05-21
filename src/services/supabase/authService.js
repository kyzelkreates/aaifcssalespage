/**
 * ============================================================
 * APEX AI — Supabase Auth Service
 * Real email/password auth via Supabase.
 * - First-run setup creates admin + driver accounts in Supabase
 * - Sessions are persisted by Supabase across browsers/devices
 * - Roles stored in user_metadata
 * - Setup complete flag stored in Supabase profiles table
 * ============================================================
 */

import { supabase } from './supabaseClient'
import { useAuthStore } from '../../core/storage'

// ─── Role constants ────────────────────────────────────────────
export const USER_ROLES = {
  SUPER_ADMIN:   'super_admin',
  FLEET_ADMIN:   'fleet_admin',
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER:    'dispatcher',
  COMPLIANCE:    'compliance',
  DRIVER:        'driver',
  VIEWER:        'viewer',
}

export const ROLE_LABELS = {
  super_admin:    'Super Admin',
  fleet_admin:    'Fleet Admin',
  fleet_manager:  'Fleet Manager',
  dispatcher:     'Dispatcher',
  compliance:     'Compliance Officer',
  driver:         'Driver',
  viewer:         'Viewer',
}

export const ROLE_HIERARCHY = [
  USER_ROLES.VIEWER,
  USER_ROLES.DRIVER,
  USER_ROLES.COMPLIANCE,
  USER_ROLES.DISPATCHER,
  USER_ROLES.FLEET_MANAGER,
  USER_ROLES.FLEET_ADMIN,
  USER_ROLES.SUPER_ADMIN,
]

export const hasPermission = (userRole, requiredRole) => {
  const ui = ROLE_HIERARCHY.indexOf(userRole)
  const ri = ROLE_HIERARCHY.indexOf(requiredRole)
  return ui >= ri
}

// ─── Setup check — reads from Supabase profiles table ─────────
export const isSetupComplete = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'fleet_admin')
      .limit(1)
    if (error) return false
    return (data?.length ?? 0) > 0
  } catch {
    return false
  }
}

// ─── Sync user into profiles table ────────────────────────────
const upsertProfile = async (user, role, fullName) => {
  try {
    await supabase.from('profiles').upsert({
      id:         user.id,
      email:      user.email,
      full_name:  fullName || user.user_metadata?.full_name || '',
      role:       role || user.user_metadata?.role || USER_ROLES.VIEWER,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  } catch (e) {
    console.warn('[authService] upsertProfile failed:', e)
  }
}

// ─── Map Supabase user → store user shape ─────────────────────
const mapUser = (user, profileRole) => ({
  id:       user.id,
  email:    user.email,
  username: user.user_metadata?.username || user.email,
  user_metadata: {
    role:      profileRole || user.user_metadata?.role || USER_ROLES.VIEWER,
    full_name: user.user_metadata?.full_name || '',
    username:  user.user_metadata?.username || user.email,
  },
})

// ─── Load role from profiles table ────────────────────────────
const loadRole = async (userId) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    return data?.role || USER_ROLES.VIEWER
  } catch {
    return USER_ROLES.VIEWER
  }
}

// ─── Auth Service ──────────────────────────────────────────────
export const authService = {

  /**
   * First-run setup — creates admin + driver accounts in Supabase Auth.
   * Stores roles in profiles table.
   */
  async setupAccounts({ adminUsername, adminPassword, adminEmail,
                        driverUsername, driverPassword, driverEmail }) {
    const adminEmailFinal  = (adminEmail  || `${adminUsername}@apexfleet.local`).toLowerCase().trim()
    const driverEmailFinal = (driverEmail || `${driverUsername}@apexfleet.local`).toLowerCase().trim()

    // Create admin account
    const { data: adminData, error: adminErr } = await supabase.auth.signUp({
      email:    adminEmailFinal,
      password: adminPassword,
      options:  {
        data: {
          role:      USER_ROLES.FLEET_ADMIN,
          full_name: 'Fleet Administrator',
          username:  adminUsername.trim(),
        },
        emailRedirectTo: null,
      },
    })
    if (adminErr) return { error: adminErr }
    if (adminData?.user) {
      await upsertProfile(adminData.user, USER_ROLES.FLEET_ADMIN, 'Fleet Administrator')
    }

    // Create driver account
    const { data: driverData, error: driverErr } = await supabase.auth.signUp({
      email:    driverEmailFinal,
      password: driverPassword,
      options:  {
        data: {
          role:      USER_ROLES.DRIVER,
          full_name: 'Driver',
          username:  driverUsername.trim(),
        },
        emailRedirectTo: null,
      },
    })
    if (driverErr) return { error: driverErr }
    if (driverData?.user) {
      await upsertProfile(driverData.user, USER_ROLES.DRIVER, 'Driver')
    }

    return { error: null }
  },

  /**
   * Sign in with email (or username resolved to email) + password.
   * Session is persisted by Supabase — works across browsers.
   */
  async signIn(emailOrUsername, password) {
    let email = emailOrUsername.trim().toLowerCase()

    // If no @ — it's a username. Look up the email from profiles.
    if (!email.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', email)
        .maybeSingle()

      if (profile?.email) {
        email = profile.email
      } else {
        // Try appending local domain as fallback
        email = `${email}@apexfleet.local`
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { user: null, session: null, error }

    const role = await loadRole(data.user.id)
    const user = mapUser(data.user, role)

    useAuthStore.getState().setSession(data.session)
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setRole(role)

    return { user, session: data.session, error: null }
  },

  /**
   * Sign out — clears Supabase session everywhere.
   */
  async signOut() {
    await supabase.auth.signOut()
    useAuthStore.getState().clearAuth()
    return { error: null }
  },

  /**
   * Restore existing session on app load.
   * Supabase persists the JWT — works cross-browser via cookie/localStorage.
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data?.session) return { session: null, error: error || null }

    const role = await loadRole(data.session.user.id)
    const user = mapUser(data.session.user, role)

    useAuthStore.getState().setSession(data.session)
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setRole(role)

    return { session: data.session, error: null }
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) return { user: null, error: error || null }

    const role = await loadRole(data.user.id)
    const user = mapUser(data.user, role)
    return { user, error: null }
  },

  /**
   * Update password for current user.
   */
  async updatePassword(_userId, _currentPassword, newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error || null }
  },

  async updateProfile({ fullName, username }) {
    const updates = {}
    if (fullName)  updates.full_name = fullName
    if (username)  updates.username  = username
    const { data, error } = await supabase.auth.updateUser({ data: updates })
    if (!error && data?.user) {
      const { data: profile } = await supabase.auth.getSession()
      if (profile?.session) {
        const role = await loadRole(data.user.id)
        await supabase.from('profiles').update(updates).eq('id', data.user.id)
        useAuthStore.getState().setUser(mapUser(data.user, role))
      }
    }
    return { user: data?.user || null, error: error || null }
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error: error || null }
  },

  /**
   * Auth state change listener — keeps store in sync.
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const role = await loadRole(session.user.id)
          const user = mapUser(session.user, role)
          useAuthStore.getState().setSession(session)
          useAuthStore.getState().setUser(user)
          useAuthStore.getState().setRole(role)
        } else {
          useAuthStore.getState().clearAuth()
        }
        callback?.(event, session)
      }
    )
    return () => subscription.unsubscribe()
  },
}

export default authService
