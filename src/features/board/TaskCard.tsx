import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ComponentProps, SyntheticEvent } from 'react'
import { MoreIcon, TextIcon } from '../../components/icons'
import { cx } from '../../lib/cx'
import { DueBadge } from '../tasks/DueBadge'
import { TaskPriorityIcon } from '../tasks/TaskFields'
import { PRIORITY_LABEL, type Task, type TaskStatus } from '../tasks/types'
import { AvatarStack } from '../team/Avatar'
import type { TeamMember } from '../team/types'
import { COLUMNS } from './columns'

type Variant = 'default' | 'ghost' | 'overlay' | 'showcase'

type TaskCardProps = ComponentProps<'article'> & {
  task: Task
  pending?: boolean
  /** ghost = the slot left behind while dragging; overlay = the card under the pointer. */
  variant?: Variant
  assignees?: readonly TeamMember[]
}

const variants: Record<Variant, string> = {
  // Solid surface for readability; a 1px lift on hover (instant under reduced motion).
  default:
    'border-border shadow-xs hover:-translate-y-px hover:border-border-strong hover:bg-surface-hover hover:shadow-sm',
  ghost: 'border-border opacity-40 shadow-none',
  // Lifted while dragging: tilt plus the gradient glow.
  overlay: 'cursor-grabbing border-transparent shadow-glow rotate-2 scale-[1.02]',
  // Decorative example cards in the first-run hero.
  showcase: 'border-border shadow-overlay',
}

export function TaskCard({
  task,
  pending = false,
  variant = 'default',
  assignees = [],
  className,
  ...props
}: TaskCardProps) {
  return (
    <article
      aria-busy={pending || undefined}
      className={cx(
        'rounded-lg border bg-surface p-3 transition-[border-color,background-color,box-shadow,opacity,translate] duration-150 ease-out',
        variants[variant],
        className,
      )}
      {...props}
    >
      <h3 className="line-clamp-2 text-sm font-medium break-words text-text">{task.title}</h3>
      <TaskMeta task={task} assignees={assignees} />
    </article>
  )
}

/** Only what differs from the defaults: Normal priority, no date, no description show nothing. */
function TaskMeta({ task, assignees }: { task: Task; assignees: readonly TeamMember[] }) {
  const showPriority = task.priority !== 'normal'
  if (!showPriority && !task.due_date && !task.description && assignees.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      {showPriority && (
        <span className="flex items-center gap-1" title={`${PRIORITY_LABEL[task.priority]} priority`}>
          <TaskPriorityIcon priority={task.priority} />
          <span className={task.priority === 'high' ? 'text-danger' : undefined}>
            {PRIORITY_LABEL[task.priority]}
          </span>
        </span>
      )}
      <DueBadge dueDate={task.due_date} status={task.status} />
      {task.description && (
        <span className="flex items-center" title="Has a description">
          <TextIcon size={12} />
          <span className="sr-only">Has a description</span>
        </span>
      )}
      {assignees.length > 0 && (
        <span className="ml-auto">
          <AvatarStack members={assignees} />
        </span>
      )}
    </div>
  )
}

type SortableTaskCardProps = {
  task: Task
  pending?: boolean
  assignees: readonly TeamMember[]
  onOpen: (id: string) => void
  onMoveTo: (id: string, status: TaskStatus) => void
}

/** A card that can be picked up and moved within or across columns, and opened. */
export function SortableTaskCard({ task, pending = false, assignees, onOpen, onMoveTo }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    // An unsaved card can't move yet: its row doesn't exist server-side.
    disabled: pending,
  })

  return (
    // The wrapper is what moves; the menu is a sibling of the card (not a
    // control nested inside its role="button").
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="group/card relative"
    >
      <TaskCard
        task={task}
        pending={pending}
        assignees={assignees}
        variant={isDragging ? 'ghost' : 'default'}
        className={cx('touch-manipulation pr-9 select-none', pending ? 'cursor-progress' : 'cursor-pointer')}
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
      {!pending && !isDragging && <MoveToMenu task={task} onMoveTo={onMoveTo} />}
    </div>
  )
}

/**
 * "Move to…" status picker. A native <select> sits invisibly over the ⋯ icon,
 * so phones get the platform's own picker sheet and keyboards work for free.
 */
function MoveToMenu({ task, onMoveTo }: { task: Task; onMoveTo: (id: string, status: TaskStatus) => void }) {
  const stop = (event: SyntheticEvent) => event.stopPropagation()
  return (
    <div
      className={cx(
        'absolute top-2 right-2 flex size-6 items-center justify-center rounded-md text-subtle',
        'transition-[opacity,background-color,color] duration-150 ease-out',
        'opacity-0 group-hover/card:opacity-100 has-[:focus-visible]:opacity-100 [@media(hover:none)]:opacity-100',
        'hover:bg-column hover:text-text has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
      )}
      // Keep the card from treating interaction with the menu as a click or drag.
      onClick={stop}
      onMouseDown={stop}
      onTouchStart={stop}
      onKeyDown={stop}
    >
      <MoreIcon />
      <select
        aria-label={`Move “${task.title}” to…`}
        value=""
        onChange={(event) => onMoveTo(task.id, event.target.value as TaskStatus)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        <option value="" disabled>
          Move to…
        </option>
        {COLUMNS.filter((c) => c.status !== task.status).map((column) => (
          <option key={column.status} value={column.status}>
            {column.label}
          </option>
        ))}
      </select>
    </div>
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
