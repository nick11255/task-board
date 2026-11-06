import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ComponentProps } from 'react'
import { CalendarIcon, TextIcon } from '../../components/icons'
import { cx } from '../../lib/cx'
import { formatShortDate } from '../../lib/dates'
import { TaskPriorityIcon } from '../tasks/TaskFields'
import { PRIORITY_LABEL, type Task } from '../tasks/types'

type Variant = 'default' | 'ghost' | 'overlay'

type TaskCardProps = ComponentProps<'article'> & {
  task: Task
  pending?: boolean
  /** ghost = the slot left behind while dragging; overlay = the card under the pointer. */
  variant?: Variant
}

const variants: Record<Variant, string> = {
  default: 'border-border shadow-xs hover:border-border-strong hover:shadow-sm',
  ghost: 'border-border opacity-40 shadow-none',
  overlay: 'cursor-grabbing border-border-strong shadow-overlay rotate-2 scale-[1.02]',
}

export function TaskCard({ task, pending = false, variant = 'default', className, ...props }: TaskCardProps) {
  return (
    <article
      aria-busy={pending || undefined}
      className={cx(
        'rounded-lg border bg-surface p-3 transition-[border-color,box-shadow,opacity] duration-150 ease-out',
        variants[variant],
        className,
      )}
      {...props}
    >
      <h3 className="line-clamp-2 text-sm font-medium break-words text-text">{task.title}</h3>
      <TaskMeta task={task} />
    </article>
  )
}

function TaskMeta({ task }: { task: Task }) {
  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-muted">
      <span className="flex items-center" title={`${PRIORITY_LABEL[task.priority]} priority`}>
        <TaskPriorityIcon priority={task.priority} />
        <span className="sr-only">{PRIORITY_LABEL[task.priority]} priority</span>
      </span>
      {task.due_date && (
        <span className="flex items-center gap-1 tabular-nums">
          <CalendarIcon size={12} />
          <span className="sr-only">Due</span>
          {formatShortDate(task.due_date)}
        </span>
      )}
      {task.description && (
        <span className="flex items-center" title="Has a description">
          <TextIcon size={12} />
          <span className="sr-only">Has a description</span>
        </span>
      )}
    </div>
  )
}

type SortableTaskCardProps = {
  task: Task
  pending?: boolean
  onOpen: (id: string) => void
}

/** A card that can be picked up and moved within or across columns, and opened. */
export function SortableTaskCard({ task, pending = false, onOpen }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    // An unsaved card can't move yet: its row doesn't exist server-side.
    disabled: pending,
  })

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      pending={pending}
      variant={isDragging ? 'ghost' : 'default'}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx('touch-manipulation select-none', pending ? 'cursor-progress' : 'cursor-pointer')}
      {...attributes}
      aria-label={`${task.title}. Press Enter to open, Space to move.`}
      {...listeners}
      // Click opens (the 4px drag threshold keeps drags from counting as clicks).
      onClick={() => !pending && onOpen(task.id)}
      // Enter opens; Space is reserved for keyboard dragging (see sensor config).
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !isDragging && !pending) {
          event.preventDefault()
          onOpen(task.id)
          return
        }
        listeners?.onKeyDown?.(event)
      }}
    />
  )
}

/** Placeholder card shown while the board loads. */
export function TaskCardSkeleton({ lines = 2 }: { lines?: 1 | 2 }) {
  return (
    <div aria-hidden className="rounded-lg border border-border bg-surface p-3">
      <div className="h-3 w-4/5 animate-shimmer rounded-sm bg-column" />
      {lines === 2 && <div className="mt-2 h-3 w-1/2 animate-shimmer rounded-sm bg-column" />}
    </div>
  )
}
