import { useCallback, useEffect, useState } from 'react'
import type { TaskPriority } from '../tasks/types'
import { EMPTY_FILTERS, isFiltering, parseFilters, serializeFilters, type DueFilter, type Filters } from './filters'

/**
 * Filter state that lives in the URL (?q=…&priority=…&due=…), so a reload
 * or a shared link keeps the view. Uses replaceState: typing in the search
 * box shouldn't add a Back-button entry per keystroke.
 */
export function useFilters() {
  const [filters, setFilters] = useState<Filters>(() => parseFilters(window.location.search))

  useEffect(() => {
    const search = serializeFilters(filters, window.location.search)
    if (search !== window.location.search) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${search}${window.location.hash}`)
    }
  }, [filters])

  const setQuery = useCallback((query: string) => setFilters((f) => ({ ...f, query })), [])

  const togglePriority = useCallback(
    (priority: TaskPriority) =>
      setFilters((f) => ({
        ...f,
        priorities: f.priorities.includes(priority)
          ? f.priorities.filter((p) => p !== priority)
          : [...f.priorities, priority],
      })),
    [],
  )

  /** Due filters are exclusive: picking the active one again turns it off. */
  const toggleDue = useCallback(
    (due: DueFilter) => setFilters((f) => ({ ...f, due: f.due === due ? null : due })),
    [],
  )

  const clear = useCallback(() => setFilters(EMPTY_FILTERS), [])

  return { filters, active: isFiltering(filters), setQuery, togglePriority, toggleDue, clear }
}

export type FiltersApi = ReturnType<typeof useFilters>
