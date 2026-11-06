import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

let pending: Promise<User> | null = null

/**
 * Resolve the current guest user, creating an anonymous account on first
 * launch. Memoized: React StrictMode runs effects twice in dev, and without
 * this every first visit would create two anonymous users.
 */
export function ensureGuestSession(): Promise<User> {
  pending ??= signInIfNeeded().catch((error: unknown) => {
    pending = null // let Retry start over
    throw error
  })
  return pending
}

/** Forget the memoized session (after a sign-out). */
export function resetGuestSession(): void {
  pending = null
}

async function signInIfNeeded(): Promise<User> {
  // A stored session (localStorage) means a returning guest. If reading or
  // refreshing it fails, supabase-js clears it and we fall through to a
  // fresh anonymous sign-in.
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session.user

  const { data: signIn, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  if (!signIn.user) throw new Error('Sign-in returned no user.')
  return signIn.user
}
