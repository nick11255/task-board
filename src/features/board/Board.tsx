import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from '@dnd-kit/core'
import type { ReactNode } from 'react'
import { AlertIcon } from '../../components/icons'
import { cx } from '../../lib/cx'
import { Button } from '../../components/ui/Button'
import { Column } from './Column'
import { COLUMNS } from './columns'
import { TaskCard } from './TaskCard'
import type { Board as BoardState, NewTask } from './useBoard'
import { useBoardDnd } from './useBoardDnd'
import type { Task, TaskStatus } from '../tasks/types'

const SKELETON_COUNTS = [3, 2, 1, 2] as const

const dropAnimation: DropAnimation = {
  duration: 200,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
}

type BoardProps = {
  board: BoardState
  onOpenTask: (id: string) => void
  onMoveTo: (id: string, status: TaskStatus) => void
  /** Mobile shows one column at a time (picked with status tabs). */
  singleColumn: TaskStatus | null
  /** Search/filter predicate; null = show everything. */
  filter: ((task: Task) => boolean) | null
  /** Create (wrapped by the screen so it can flag tasks hidden by filters). */
  createTask: (input: NewTask) => Promise<void>
  /** Shown centered over a faded board (first run). */
  overlay?: ReactNode
}

export function Board({ board, onOpenTask, onMoveTo, singleColumn, filter, createTask, overlay }: BoardProps) {
  const dnd = useBoardDnd(board)
  const visible = singleColumn ? COLUMNS.filter((c) => c.status === singleColumn) : COLUMNS

  return (
    <>
      {board.phase === 'error' && <BoardErrorBanner message={board.error} onRetry={board.reload} />}
      {board.phase === 'loading' && (
        <p role="status" className="sr-only">
          Loading your tasks…
        </p>
      )}

      <DndContext
        sensors={dnd.sensors}
        collisionDetection={dnd.collisionDetection}
        accessibility={dnd.accessibility}
        {...dnd.handlers}
      >
        <div className="relative min-h-0 flex-1 overflow-x-auto overscroll-x-contain">
          {overlay && (
            <div className="absolute inset-0 z-10 flex items-start justify-center px-4 pt-16 sm:pt-24">{overlay}</div>
          )}
          <div
            // The faded columns behind the first-run card still show the board's shape.
            inert={overlay ? true : undefined}
            className={cx(
              'flex h-full items-start gap-3 px-4 pb-4 transition-opacity duration-300 sm:px-6 sm:pb-6',
              overlay ? 'opacity-30' : null,
            )}
          >
            {visible.map((column) => (
              <Column
                key={column.status}
                column={column}
                layout={singleColumn ? 'single' : 'board'}
                phase={board.phase}
                // Hidden cards stay in the drag model; positions are computed
                // against the full column, so order holds when filters clear.
                tasks={filter ? dnd.columns[column.status].filter(filter) : dnd.columns[column.status]}
                filtering={filter !== null}
                pendingIds={board.pendingIds}
                skeletonCount={SKELETON_COUNTS[COLUMNS.indexOf(column)] ?? 2}
                isDragging={dnd.activeTask !== null}
                isDropTarget={dnd.overColumn === column.status}
                onCreate={(title) => createTask({ status: column.status, title })}
                onOpenTask={onOpenTask}
                onMoveTo={onMoveTo}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {dnd.activeTask && <TaskCard task={dnd.activeTask} variant="overlay" />}
        </DragOverlay>
      </DndContext>
    </>
  )
}

function BoardErrorBanner({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="px-4 pb-4 sm:px-6">
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"
      >
        <AlertIcon className="shrink-0" />
        <p className="min-w-0 flex-1">
          <span className="font-medium">Couldn't load your tasks.</span>{' '}
          {message && <span className="text-muted">{message}</span>}
        </p>
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  )
}
