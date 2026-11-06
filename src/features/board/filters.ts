import { getDueState } from '../tasks/dueState'
import { TASK_PRIORITIES, type Task, type TaskPriority } from '../tasks/types'

/** overdue = past due and not done; soon = due today or in the next two days. */
export type DueFilter = 'overdue' | 'soon'

export type Filters = {
  query: string
  /** Empty = any priority. */
  priorities: TaskPriority[]
  due: DueFilter | null
}

export const EMPTY_FILTERS: Filters = { query: '', priorities: [], due: null }

export function isFiltering(filters: Filters): boolean {
  return filters.query.trim() !== '' || filters.priorities.length > 0 || filters.due !== null
}

/** Case- and accent-insensitive: "cafe" finds "Café". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function matchesFilters(
  task: Pick<Task, 'title' | 'priority' | 'due_date' | 'status'>,
  filters: Filters,
  today: Date,
): boolean {
  const query = normalize(filters.query.trim())
  if (query && !normalize(task.title).includes(query)) return false
  if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false
  if (filters.due) {
    const state = getDueState(task.due_date, today, task.status)
    if (filters.due === 'overdue' && state !== 'overdue') return false
    if (filters.due === 'soon' && state !== 'today' && state !== 'soon') return false
  }
  return true
}

// URL format: ?q=docs&priority=high,low&due=overdue (only non-default params are written)

/** Read filters from a query string, ignoring anything malformed. */
export function parseFilters(search: string): Filters {
  const params = new URLSearchParams(search)
  const priorities = (params.get('priority') ?? '')
    .split(',')
    .filter((p): p is TaskPriority => (TASK_PRIORITIES as readonly string[]).includes(p))
  const due = params.get('due')
  return {
    query: params.get('q') ?? '',
    priorities: [...new Set(priorities)],
    due: due === 'overdue' || due === 'soon' ? due : null,
  }
}

/** Write filters into a query string, keeping any unrelated params. Returns '' or '?…'. */
export function serializeFilters(filters: Filters, currentSearch = ''): string {
  const params = new URLSearchParams(currentSearch)
  const set = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key))
  set('q', filters.query.trim() ? filters.query : '')
  // Stable order, so the same filters always produce the same URL.
  set('priority', TASK_PRIORITIES.filter((p) => filters.priorities.includes(p)).join(','))
  set('due', filters.due ?? '')
  const query = params.toString()
  return query ? `?${query}` : ''
}
