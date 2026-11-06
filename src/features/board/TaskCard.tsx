import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx'
import type { Task } from '../tasks/types'

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
    </article>
  )
}

/** A card that can be picked up and moved within or across columns. */
export function SortableTaskCard({ task, pending = false }: { task: Task; pending?: boolean }) {
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
      className={cx('touch-manipulation select-none', !pending && 'cursor-grab')}
      {...attributes}
      {...listeners}
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
