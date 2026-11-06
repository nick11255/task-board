import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { PlusIcon } from '../../components/icons'
import { IconButton } from '../../components/ui/IconButton'
import { cx } from '../../lib/cx'
import { describeError } from '../../lib/errors'
import type { Task, TaskStatus } from '../tasks/types'
import type { ColumnConfig } from './columns'
import { QuickAdd } from './QuickAdd'
import { StatusIcon } from './StatusIcon'
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
  /** 'single' = the only column on screen (mobile tabs): full width, no header. */
  layout: 'board' | 'single'
  /** Filters are on: an empty column means "no matches", not "no tasks". */
  filtering: boolean
  onCreate: (title: string) => Promise<void>
  onOpenTask: (id: string) => void
  onMoveTo: (id: string, status: TaskStatus) => void
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
  layout,
  filtering,
  onCreate,
  onOpenTask,
  onMoveTo,
}: ColumnProps) {
  const headingId = `column-${column.status}`
  const [composer, setComposer] = useState<Composer>({ open: false })
  // The column body is a drop zone too, so empty columns accept cards.
  const { setNodeRef } = useDroppable({ id: column.status })
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks])
  const isEmpty = phase === 'ready' && tasks.length === 0
  const single = layout === 'single'

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
      id={single ? 'mobile-column-panel' : undefined}
      role={single ? 'tabpanel' : undefined}
      aria-labelledby={single ? `tab-${column.status}` : headingId}
      className={cx(
        'group/column flex max-h-full flex-col transition-[background-color,box-shadow] duration-150 ease-out',
        // Board columns run the full height (a stable grid), and scroll inside.
        single ? 'w-full' : 'min-w-[17rem] flex-1 basis-0 self-stretch rounded-xl p-2',
        !single && (isDropTarget ? 'bg-accent-soft ring-1 ring-accent' : 'bg-column'),
      )}
    >
      {!single && (
        <header className="flex h-8 items-center gap-2 pr-1 pl-2">
          <StatusIcon status={column.status} />
          <h2 id={headingId} className="text-sm font-semibold text-text">
            {column.label}
          </h2>
          {phase === 'ready' && <span className="text-sm text-subtle tabular-nums">{tasks.length}</span>}
          {/* Empty columns get their own "Add task" row instead, so there's one action. */}
          {phase === 'ready' && !isEmpty && (
            <IconButton
              label={`Add task to ${column.label}`}
              icon={<PlusIcon />}
              size="sm"
              onClick={openComposer}
              className="ml-auto opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
            />
          )}
        </header>
      )}

      <div
        ref={setNodeRef}
        className={cx(
          'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto',
          single ? 'pb-28' : '-mx-2 mt-2 px-2 pb-1',
        )}
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
              <SortableTaskCard
                key={task.id}
                task={task}
                pending={pendingIds.has(task.id)}
                onOpen={onOpenTask}
                onMoveTo={onMoveTo}
              />
            ))}
          </SortableContext>
        )}

        {isEmpty && !composer.open && filtering && !isDragging && (
          <p className="px-2 py-2 text-sm text-subtle">No matches</p>
        )}

        {isEmpty && !composer.open && (!filtering || isDragging) &&
          (single && !isDragging ? (
            <TabEmpty column={column} onAdd={openComposer} />
          ) : (
            <ColumnEmpty label={column.label} dropping={isDragging} onAdd={openComposer} />
          ))}
      </div>
    </section>
  )
}

/** Phone tab with nothing in it: centered, quiet, one action. */
function TabEmpty({ column, onAdd }: { column: ColumnConfig; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-16 text-center">
      <StatusIcon status={column.status} size={20} />
      <p className="mt-3 text-sm font-medium text-text">Nothing in {column.label}</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex h-8 items-center gap-1 rounded-md px-3 text-sm font-medium text-accent transition-colors duration-150 ease-out hover:bg-accent-soft"
      >
        <PlusIcon size={14} />
        Add task
      </button>
    </div>
  )
}

/** One quiet action; turns into a drop slot while a card is being dragged. */
function ColumnEmpty({ label, dropping, onAdd }: { label: string; dropping: boolean; onAdd: () => void }) {
  if (dropping) {
    return (
      <div className="flex h-10 items-center justify-center rounded-lg border border-dashed border-accent text-xs font-medium text-accent">
        Drop here
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`No tasks in ${label}. Add task`}
      className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-sm text-subtle transition-colors duration-150 ease-out hover:bg-surface hover:text-text"
    >
      <PlusIcon size={14} />
      Add task
    </button>
  )
}
