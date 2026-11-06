import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { describeError } from '../../lib/errors'
import { supabase } from '../../lib/supabase'
import { AuthContext, type AuthState } from './authContext'
import { ensureGuestSession, resetGuestSession } from './guestSession'

type InternalState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; user: User }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  // Get (or create) the guest session. Re-runs when Retry bumps `attempt`.
  useEffect(() => {
    let cancelled = false
    ensureGuestSession().then(
      (user) => !cancelled && setState({ status: 'ready', user }),
      (error: unknown) => !cancelled && setState({ status: 'error', message: describeError(error) }),
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  // Keep `user` current across token refreshes; start over if signed out.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setState({ status: 'ready', user: session.user })
      } else if (event === 'SIGNED_OUT') {
        resetGuestSession()
        setState({ status: 'loading' })
        setAttempt((n) => n + 1)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo<AuthState>(
    () => (state.status === 'error' ? { ...state, retry } : state),
    [state, retry],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
