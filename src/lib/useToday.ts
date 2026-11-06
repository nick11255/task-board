import { useSyncExternalStore } from 'react'

/**
 * One shared "today" for every component. A single timer fires just after
 * local midnight (and the value refreshes when the tab becomes visible
 * again, since timers are throttled in background tabs), so "Today" badges
 * turn into "Yesterday"/overdue without a reload.
 */
let today = startOfToday()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function refresh() {
  const next = startOfToday()
  if (next.getTime() !== today.getTime()) {
    today = next
    listeners.forEach((notify) => notify())
  }
}

function scheduleMidnight() {
  const now = new Date()
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  timer = setTimeout(() => {
    refresh()
    scheduleMidnight()
  }, nextMidnight.getTime() - now.getTime() + 1000)
}

function onVisible() {
  if (document.visibilityState === 'visible') refresh()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    refresh()
    scheduleMidnight()
    document.addEventListener('visibilitychange', onVisible)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }
}

/** Local midnight of the current day; re-renders when the date changes. */
export function useToday(): Date {
  return useSyncExternalStore(subscribe, () => today)
}
