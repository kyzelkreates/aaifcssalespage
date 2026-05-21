/**
 * SetupGuard — redirects to /auth/setup if no admin account exists in Supabase.
 * Used to wrap Login so users can't reach it before setup is complete.
 */

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isSetupComplete } from '../../services/supabase/authService'

export default function SetupGuard({ children }) {
  const [status, setStatus] = useState('checking') // checking | done | needed

  useEffect(() => {
    isSetupComplete().then(done => setStatus(done ? 'done' : 'needed'))
  }, [])

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-[#050810]">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'needed') return <Navigate to="/auth/setup" replace />
  return children
}
