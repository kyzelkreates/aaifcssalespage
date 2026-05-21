/**
 * ============================================================
 * APEX AI — Router
 * First-run redirects to /auth/setup to create accounts.
 * Setup check is async — reads from Supabase profiles table.
 * ============================================================
 */

import { createHashRouter, Navigate } from 'react-router-dom'

// Layouts
import AppShell from '../layouts/AppShell'

// Auth Pages
import Login        from '../pages/auth/Login'
import DriverLogin  from '../pages/auth/DriverLogin'
import ResetConfirm from '../pages/auth/ResetConfirm'
import Setup        from '../pages/auth/Setup'

// Driver App
import DriverApp    from '../pages/DriverApp'
import DriverImport from '../pages/DriverImport'
import DriverSetup  from '../pages/DriverSetup'

// App Pages
import Dashboard    from '../pages/Dashboard'
import Fleet        from '../pages/Fleet'
import Vehicles     from '../pages/Vehicles'
import Drivers      from '../pages/Drivers'
import Navigation   from '../pages/Navigation'
import Dispatch     from '../pages/Dispatch'
import Safety       from '../pages/Safety'
import Compliance   from '../pages/Compliance'
import Analytics    from '../pages/Analytics'
import Incidents    from '../pages/Incidents'
import Messaging    from '../pages/Messaging'
import Settings     from '../pages/Settings'
import AI          from '../pages/AI'
import AP3X        from '../pages/AP3X'
import NotFound    from '../pages/NotFound'

// Guards
import AuthGuard    from '../components/auth/AuthGuard'
import SetupGuard   from '../components/auth/SetupGuard'

export const router = createHashRouter([

  // ── First-run Setup ───────────────────────────────────────
  { path: '/auth/setup', element: <Setup /> },

  // ── Auth Routes ───────────────────────────────────────────
  { path: '/auth/login',         element: <SetupGuard><Login /></SetupGuard> },
  { path: '/auth/driver',        element: <SetupGuard><DriverLogin /></SetupGuard> },
  { path: '/auth/reset-confirm', element: <ResetConfirm /> },

  // ── Standalone Driver App (public) ───────────────────────
  { path: '/driver-app',    element: <DriverApp /> },
  { path: '/driver-import', element: <DriverImport /> },
  { path: '/ap3x',          element: <AP3X /> },

  // ── Fleet Dashboard (protected) ──────────────────────────
  {
    path: '/',
    element: <AuthGuard><AppShell /></AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',   element: <Dashboard /> },
      { path: 'fleet',       element: <Fleet /> },
      { path: 'vehicles',    element: <Vehicles /> },
      { path: 'drivers',     element: <Drivers /> },
      { path: 'navigation',  element: <Navigation /> },
      { path: 'dispatch',    element: <Dispatch /> },
      { path: 'safety',      element: <Safety /> },
      { path: 'compliance',  element: <Compliance /> },
      { path: 'analytics',   element: <Analytics /> },
      { path: 'incidents',   element: <Incidents /> },
      { path: 'messaging',   element: <Messaging /> },
      { path: 'ai',          element: <AI /> },
      { path: 'settings',    element: <Settings /> },
      { path: 'driver-setup', element: <DriverSetup /> },
    ],
  },

  { path: '*', element: <NotFound /> },
])
