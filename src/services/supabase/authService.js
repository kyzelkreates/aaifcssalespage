/**
 * ============================================================
 * APEX AI — Auth Service (Local Mode — no Supabase)
 * All auth stored in localStorage. Works fully offline.
 * ============================================================
 */

import { useAuthStore } from '@core/storage'

const AUTH_KEY   = 'apex:auth:users'
const SESSION_KEY = 'apex:auth:session'

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

// ─── Local storage helpers ─────────────────────────────────────
const readUsers   = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]') } catch { return [] } }
const writeUsers  = (u) => localStorage.setItem(AUTH_KEY, JSON.stringify(u))
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null } }
const writeSession = (s) => s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY)
const uid = () => `usr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`

// ─── Setup check — true if any fleet_admin user exists ─────────
export const isSetupComplete = async () => {
  const users = readUsers()
  return users.some(u => u.role === USER_ROLES.FLEET_ADMIN)
}

// ─── Auth Service ──────────────────────────────────────────────
export const authService = {

  async setupAccounts({ adminUsername, adminPassword, adminEmail,
                        driverUsername, driverPassword, driverEmail }) {
    const now = new Date().toISOString()
    const adminUser = {
      id:         uid(),
      email:      (adminEmail || `${adminUsername}@apexfleet.local`).toLowerCase().trim(),
      username:   adminUsername.trim(),
      password:   adminPassword,
      role:       USER_ROLES.FLEET_ADMIN,
      full_name:  'Fleet Administrator',
      created_at: now,
    }
    const driverUser = {
      id:         uid(),
      email:      (driverEmail || `${driverUsername}@apexfleet.local`).toLowerCase().trim(),
      username:   driverUsername.trim(),
      password:   driverPassword,
      role:       USER_ROLES.DRIVER,
      full_name:  'Driver',
      created_at: now,
    }
    writeUsers([adminUser, driverUser])
    return { error: null }
  },

  async signIn(emailOrUsername, password) {
    const users = readUsers()
    const input = emailOrUsername.trim().toLowerCase()
    const user  = users.find(u =>
      (u.email === input || u.username === input) && u.password === password
    )
    if (!user) return { user: null, session: null, error: { message: 'Invalid credentials' } }

    const session = { userId: user.id, role: user.role, createdAt: Date.now() }
    writeSession(session)

    const mapped = this._mapUser(user)
    useAuthStore.getState().setSession(session)
    useAuthStore.getState().setUser(mapped)
    useAuthStore.getState().setRole(user.role)

    return { user: mapped, session, error: null }
  },

  async signOut() {
    writeSession(null)
    useAuthStore.getState().clearAuth()
    return { error: null }
  },

  async getSession() {
    const session = readSession()
    if (!session) return { session: null, error: null }

    const users = readUsers()
    const user  = users.find(u => u.id === session.userId)
    if (!user) { writeSession(null); return { session: null, error: null } }

    const mapped = this._mapUser(user)
    useAuthStore.getState().setSession(session)
    useAuthStore.getState().setUser(mapped)
    useAuthStore.getState().setRole(user.role)

    return { session, error: null }
  },

  async getUser() {
    const session = readSession()
    if (!session) return { user: null, error: null }
    const users = readUsers()
    const user  = users.find(u => u.id === session.userId)
    if (!user) return { user: null, error: null }
    return { user: this._mapUser(user), error: null }
  },

  async updatePassword(_userId, _currentPassword, newPassword) {
    const session = readSession()
    if (!session) return { error: { message: 'Not signed in' } }
    const users = readUsers()
    const idx   = users.findIndex(u => u.id === session.userId)
    if (idx > -1) { users[idx].password = newPassword; writeUsers(users) }
    return { error: null }
  },

  async updateProfile({ fullName, username }) {
    const session = readSession()
    if (!session) return { user: null, error: { message: 'Not signed in' } }
    const users = readUsers()
    const idx   = users.findIndex(u => u.id === session.userId)
    if (idx > -1) {
      if (fullName) users[idx].full_name = fullName
      if (username) users[idx].username  = username
      writeUsers(users)
      useAuthStore.getState().setUser(this._mapUser(users[idx]))
    }
    return { user: users[idx] ? this._mapUser(users[idx]) : null, error: null }
  },

  async resetPassword(_email) {
    // Local mode — no email sending; just succeed silently
    return { error: null }
  },

  onAuthStateChange(callback) {
    // In local mode, no subscription needed — just return unsubscribe noop
    callback?.('INITIAL', readSession())
    return () => {}
  },

  // ─── Internal helper ──────────────────────────────────────
  _mapUser(user) {
    return {
      id:       user.id,
      email:    user.email,
      username: user.username || user.email,
      user_metadata: {
        role:      user.role,
        full_name: user.full_name || '',
        username:  user.username || user.email,
      },
    }
  },
}

export default authService
