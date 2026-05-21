/**
 * ============================================================
 * APEX AI — Driver Login Page
 * /src/pages/auth/DriverLogin.jsx
 *
 * Separate auth entry point for AP3X driver app.
 * Simplified login — drivers use PIN or email/pass.
 * ============================================================
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '@components/ui/Icon'
import { authService } from '@services/supabase/authService'

export default function DriverLogin() {
  const navigate = useNavigate()
  const [email,   setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await authService.signIn(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/ap3x', { replace: true })
  }

  return (
    <div className="min-h-[100dvh] bg-[#050810] flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 grid-tactical opacity-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-xs">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-center">
            <Icon name="Navigation" size={28} className="text-violet-400" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-white text-xl">AP3X Driver</h1>
            <p className="text-slate-500 text-xs tracking-widest uppercase">
              Navigation Platform
            </p>
          </div>
        </div>

        <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Driver Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="driver@fleet.io"
                className="w-full bg-[#090e1c] border border-slate-800 rounded-md px-3 py-2.5
                           text-sm text-white placeholder:text-slate-700
                           focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#090e1c] border border-slate-800 rounded-md px-3 py-2.5
                           text-sm text-white placeholder:text-slate-700
                           focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2">
                <Icon name="AlertCircle" size={13} className="text-red-400" />
                <span className="text-red-400 text-xs">{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30
                         text-violet-400 text-sm font-semibold rounded-md py-2.5
                         flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {loading ? 'Signing in...' : (
                <><Icon name="Navigation" size={14} />Start Shift</>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/auth/login')}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Fleet Admin Login →
          </button>
        </div>
      </div>
    </div>
  )
}
