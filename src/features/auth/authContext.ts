import type { User } from '@supabase/supabase-js'
import { createContext } from 'react'

export type AuthState =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'ready'; user: User }

export const AuthContext = createContext<AuthState | null>(null)
