import { useCallback, useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

/** Keep in sync with the inline script in index.html (applies it before first paint). */
const STORAGE_KEY = 'theme'

function read(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system' // storage blocked (private mode etc.): just follow the system
  }
}

function apply(preference: ThemePreference) {
  const root = document.documentElement
  if (preference === 'system') delete root.dataset.theme
  else root.dataset.theme = preference
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Not persisted, but still applied for this visit.
  }
}

const NEXT: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' }

/** Theme preference with a cycle action: System → Light → Dark → System. */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(read)
  // Side effect outside the state updater (StrictMode may run updaters twice).
  const cycle = useCallback(() => {
    const next = NEXT[preference]
    apply(next)
    setPreference(next)
  }, [preference])
  return { preference, cycle }
}
