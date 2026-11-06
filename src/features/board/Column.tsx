import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { PlusIcon } from '../../components/icons'
import { Badge } from '../../components/ui/Badge'
import { IconButton } from '../../components/ui/IconButton'
import { describeError } from '../../lib/errors'
import type { Task } from '../tasks/types'
import type { ColumnConfig } from './columns'
import { QuickAdd } from './QuickAdd'
import { cx } from '../../lib/cx'
import { SortableTaskCard, TaskCardSkeleton } from './TaskCard'
import type { BoardPhase } from './useBoard'

type ColumnProps = {
  column: ColumnConfig
  phase: BoardPhase
  tasks: readonly Task[]
  pendingIds: ReadonlySet<string>
  /** Skeleton cards to show while loading (varied per column so it doesn't look stamped). */
  skeletonCount: number
  /** A drag is in progress somewhere on the board. */
  isDragging: boolean
  /** The dragged card is currently over this column. */
  isDropTarget: boolean
  onCreate: (title: string) => Promise<void>
}

type Composer = { open: false } | { open: true; draft: string; error: string | null }

export function Column({
  column,
  phase,
  tasks,
  pendingIds,
  skeletonCount,
  isDragging,
  isDropTarget,
  onCreate,
}: ColumnProps) {
  const headingId = `column-${column.status}`
  const [composer, setComposer] = useState<Composer>({ open: false })
  const canAdd = phase === 'ready'
  // The column body is a drop zone too, so empty columns accept cards.
  const { setNodeRef } = useDroppable({ id: column.status })
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks])

  const openComposer = () =>
    setComposer((c) => (c.open ? c : { open: true, draft: '', error: null }))

  const submit = (title: string) => {
    setComposer({ open: true, draft: '', error: null })
    onCreate(title).catch((err: unknown) => {
      // The optimistic card is already rolled back; give the title back with the reason.
      setComposer((c) => ({
        open: true,
        draft: c.open && c.draft ? c.draft : title,
        error: `Couldn't add task. ${describeError(err)}`,
      }))
    })
  }

  return (
    <section
      aria-labelledby={headingId}
      className={cx(
        'group/column flex max-h-full w-[85vw] shrink-0 snap-center flex-col rounded-xl p-2 sm:w-72',
        'transition-[background-color,box-shadow] duration-150 ease-out',
        isDropTarget ? 'bg-accent-soft ring-1 ring-accent' : 'bg-column',
      )}
    >
      <header className="flex h-8 items-center gap-2 pl-2">
        <span aria-hidden className={`size-2 rounded-full ${column.dotClass}`} />
        <h2 id={headingId} className="text-base font-semibold text-text">
          {column.label}
        </h2>
        {phase === 'ready' && <Badge>{tasks.length}</Badge>}
        {canAdd && (
          <IconButton
            label={`Add task to ${column.label}`}
            icon={<PlusIcon />}
            size="sm"
            onClick={openComposer}
            className="ml-auto opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          />
        )}
      </header>

      <div
        ref={setNodeRef}
        className="-mx-2 mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-1"
      >
        {composer.open && (
          <QuickAdd
            columnId={column.status}
            columnLabel={column.label}
            value={composer.draft}
            error={composer.error}
            onChange={(draft) => setComposer({ open: true, draft, error: null })}
            onSubmit={submit}
            onCancel={() => setComposer({ open: false })}
          />
        )}

        {phase === 'loading' &&
          Array.from({ length: skeletonCount }, (_, i) => (
            <TaskCardSkeleton key={i} lines={i % 2 === 0 ? 2 : 1} />
          ))}

        {phase === 'ready' && (
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} pending={pendingIds.has(task.id)} />
            ))}
          </SortableContext>
        )}

        {phase === 'ready' && tasks.length === 0 && !composer.open && (
          <ColumnEmpty label={column.label} dropping={isDragging} onAdd={openComposer} />
        )}
      </div>
    </section>
  )
}

function ColumnEmpty({ label, dropping, onAdd }: { label: string; dropping: boolean; onAdd: () => void }) {
  if (dropping) {
    return (
      <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-accent text-sm text-accent">
        Drop here
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`No tasks in ${label}. Add a task`}
      className="group/empty flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong text-sm text-subtle transition-colors duration-150 hover:border-accent hover:text-accent"
    >
      <span>No tasks</span>
      <span className="flex items-center gap-1 text-xs opacity-0 transition-opacity duration-150 group-hover/empty:opacity-100 group-focus-visible/empty:opacity-100 [@media(hover:none)]:opacity-100">
        <PlusIcon size={12} /> Add task
      </span>
    </button>
  )
}
