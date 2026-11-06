import { useSyncExternalStore } from 'react'

/** Subscribe to a CSS media query (e.g. the mobile breakpoint). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Matches Tailwind's `max-sm` (below 640px). */
export const MOBILE_QUERY = '(max-width: 639.98px)'
