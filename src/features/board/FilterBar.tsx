import { useEffect, useRef, type ReactNode } from 'react'
import { AlertIcon, CalendarIcon, CloseIcon, SearchIcon } from '../../components/icons'
import { cx } from '../../lib/cx'
import { TaskPriorityIcon } from '../tasks/TaskFields'
import { PRIORITY_LABEL, type TaskPriority } from '../tasks/types'
import type { FiltersApi } from './useFilters'

/** High first: it's the one people filter for. */
const PRIORITY_ORDER: TaskPriority[] = ['high', 'normal', 'low']

type FilterBarProps = {
  api: FiltersApi
  /** Matching / total, shown while filtering. null while loading. */
  counts: { shown: number; total: number } | null
  layout: 'desktop' | 'mobile'
}

export function FilterBar({ api, counts, layout }: FilterBarProps) {
  const { filters, active } = api
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" focuses search from anywhere (unless you're already typing somewhere).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable], dialog[open]')) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const search = (
    <div className={cx('relative', layout === 'desktop' ? 'w-64' : 'w-full')}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle" />
      <input
        ref={inputRef}
        type="search"
        value={filters.query}
        onChange={(e) => api.setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && filters.query) {
            e.preventDefault()
            api.setQuery('')
          }
        }}
        placeholder="Search tasks"
        aria-label="Search tasks by title"
        className={cx(
          'h-8 w-full rounded-md border border-border bg-surface pr-8 pl-8 text-sm text-text shadow-xs',
          'placeholder:text-subtle transition-colors duration-150 ease-out hover:border-border-strong',
          'focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {filters.query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            api.setQuery('')
            inputRef.current?.focus()
          }}
          className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-subtle hover:bg-column hover:text-text"
        >
          <CloseIcon size={12} />
        </button>
      ) : (
        layout === 'desktop' && (
          <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-sm border border-border px-1 font-sans text-xs text-subtle">
            /
          </kbd>
        )
      )}
    </div>
  )

  const chips = (
    <>
      <div role="group" aria-label="Filter by priority" className="flex shrink-0 items-center gap-1">
        {PRIORITY_ORDER.map((priority) => (
          <Chip
            key={priority}
            pressed={filters.priorities.includes(priority)}
            onClick={() => api.togglePriority(priority)}
            icon={<TaskPriorityIcon priority={priority} />}
          >
            {PRIORITY_LABEL[priority]}
          </Chip>
        ))}
      </div>
      <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
      <div role="group" aria-label="Filter by due date" className="flex shrink-0 items-center gap-1">
        <Chip
          pressed={filters.due === 'overdue'}
          onClick={() => api.toggleDue('overdue')}
          icon={<AlertIcon size={12} className="text-danger" />}
        >
          Overdue
        </Chip>
        <Chip
          pressed={filters.due === 'soon'}
          onClick={() => api.toggleDue('soon')}
          icon={<CalendarIcon size={12} className="text-warning" />}
        >
          Due soon
        </Chip>
      </div>
    </>
  )

  const summary = active && counts && (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-xs text-muted tabular-nums" role="status">
        {counts.shown} of {counts.total}
      </span>
      <button
        type="button"
        onClick={api.clear}
        className="h-7 rounded-md px-2 text-xs font-medium text-muted transition-colors duration-150 ease-out hover:bg-column hover:text-text"
      >
        Clear filters
      </button>
    </div>
  )

  if (layout === 'mobile') {
    return (
      <div className="flex flex-col gap-2">
        {search}
        {/* While filtering, the count and Clear come first so they're never scrolled off-screen. */}
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none]">
          {summary}
          {chips}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {search}
      {chips}
      <div className="ml-auto">{summary}</div>
    </div>
  )
}

function Chip({
  pressed,
  onClick,
  icon,
  children,
}: {
  pressed: boolean
  onClick: () => void
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        'inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2 text-xs font-medium',
        'transition-colors duration-150 ease-out',
        pressed
          ? 'border-accent bg-accent-soft text-text'
          : 'border-border bg-surface text-muted shadow-xs hover:border-border-strong hover:text-text',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
