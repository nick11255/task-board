import { useRef, type KeyboardEvent } from 'react'
import { cx } from '../../lib/cx'
import type { TaskStatus } from '../tasks/types'
import { COLUMNS } from './columns'
import { StatusIcon } from './StatusIcon'

type MobileTabsProps = {
  active: TaskStatus
  counts: Record<TaskStatus, number> | null
  onChange: (status: TaskStatus) => void
}

/** Status tabs for phones: one column at a time. Arrow keys move between tabs. */
export function MobileTabs({ active, counts, onChange }: MobileTabsProps) {
  const refs = useRef<Partial<Record<TaskStatus, HTMLButtonElement | null>>>({})

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const index = COLUMNS.findIndex((c) => c.status === active)
    const next = COLUMNS[(index + step + COLUMNS.length) % COLUMNS.length].status
    onChange(next)
    refs.current[next]?.focus()
    refs.current[next]?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }

  return (
    <div
      role="tablist"
      aria-label="Status"
      onKeyDown={onKeyDown}
      // The right-edge fade hints that more tabs scroll into view.
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-3 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none]"
    >
      {COLUMNS.map((column) => {
        const selected = column.status === active
        return (
          <button
            key={column.status}
            ref={(el) => {
              refs.current[column.status] = el
            }}
            id={`tab-${column.status}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls="mobile-column-panel"
            tabIndex={selected ? 0 : -1}
            onClick={(event) => {
              onChange(column.status)
              event.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })
            }}
            className={cx(
              'flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors duration-150 ease-out',
              selected ? 'bg-surface text-text shadow-xs ring-1 ring-border' : 'text-muted hover:text-text',
            )}
          >
            <StatusIcon status={column.status} size={13} />
            {column.label}
            {counts && <span className="text-subtle tabular-nums">{counts[column.status]}</span>}
          </button>
        )
      })}
    </div>
  )
}
