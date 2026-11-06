import type { Task } from '../tasks/types'

type TaskCardProps = {
  task: Task
  pending?: boolean
}

export function TaskCard({ task, pending = false }: TaskCardProps) {
  return (
    <article
      aria-busy={pending || undefined}
      className="rounded-lg border border-border bg-surface p-3 shadow-xs transition-[border-color,box-shadow] duration-150 ease-out hover:border-border-strong hover:shadow-sm"
    >
      <h3 className="line-clamp-2 text-sm font-medium break-words text-text">{task.title}</h3>
    </article>
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
