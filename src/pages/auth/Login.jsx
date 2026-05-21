/**
 * ============================================================
 * APEX AI — Login Page (Supabase Auth)
 * Supports email or username login.
 * Session persisted by Supabase — works across browsers.
 * ============================================================
 */

import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { authService } from '../../services/supabase/authService'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Please enter your email/username and password.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await authService.signIn(identifier.trim(), password)
    setLoading(false)
    if (err) {
      setError(err.message || 'Login failed. Check your credentials.')
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-[100dvh] bg-[#050810] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-tactical opacity-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
              <span className="font-display font-bold text-cyan-400 text-xl tracking-wider">4P</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-white text-xl">Apex Intelligent AI</h1>
            <p className="text-slate-500 text-xs tracking-widest uppercase mt-0.5">Fleet Control OS</p>
          </div>
        </div>

        <div className="bg-[#0d1426] border border-slate-800/60 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Sign In</h2>
          <p className="text-slate-500 text-xs mb-5">Use your email or username to access the fleet dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Email or Username</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="admin@yourfleet.com"
                autoComplete="username"
                className="input w-full text-sm"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="input w-full text-sm pr-10"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <Icon name={showPass ? 'EyeOff' : 'Eye'} size={14} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">
                <Icon name="AlertCircle" size={13} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Signing in…
                  </span>
                : <span className="flex items-center justify-center gap-2">
                    <Icon name="LogIn" size={15} />
                    Sign In
                  </span>
              }
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
            <Link to="/auth/driver"
              className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
              <Icon name="Truck" size={12} />
              Driver Login
            </Link>
            <Link to="/auth/reset-confirm"
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-4">
          Apex Intelligent AI · Fleet Control OS
        </p>
      </div>
    </div>
  )
}
