import App from './App'
import { AuthProvider } from './features/auth/AuthProvider'

/** Loaded only after the env check passes, so the Supabase client can be created. */
export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}
