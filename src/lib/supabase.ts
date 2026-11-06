import { createClient } from '@supabase/supabase-js'
import { readEnv } from './env'

// main.tsx checks readEnv() before this module is loaded, so this throw is
// a safety net, not the user-facing error path.
const result = readEnv()
if (!result.ok) {
  throw new Error(`Missing Supabase config: ${result.missing.join(', ')}`)
}

/** The one Supabase client. Uses the public anon key only; RLS does the rest. */
export const supabase = createClient(result.env.url, result.env.anonKey, {
  auth: {
    persistSession: true, // guest session survives reloads (localStorage)
    autoRefreshToken: true,
    detectSessionInUrl: false, // anonymous auth has no redirect flow
  },
})
