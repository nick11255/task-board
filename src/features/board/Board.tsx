import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from '@dnd-kit/core'
import { AlertIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Column } from './Column'
import { COLUMNS } from './columns'
import { TaskCard } from './TaskCard'
import type { Board as BoardState } from './useBoard'
import { useBoardDnd } from './useBoardDnd'

const SKELETON_COUNTS = [3, 2, 1, 2] as const

const dropAnimation: DropAnimation = {
  duration: 200,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
}

export function Board({ board }: { board: BoardState }) {
  const dnd = useBoardDnd(board)

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
        <div className="min-h-0 flex-1 overflow-x-auto overscroll-x-contain">
          <div className="flex h-full snap-x snap-mandatory scroll-px-4 items-start gap-4 px-4 pb-6 sm:snap-none sm:px-6">
            {COLUMNS.map((column, i) => (
              <Column
                key={column.status}
                column={column}
                phase={board.phase}
                tasks={dnd.columns[column.status]}
                pendingIds={board.pendingIds}
                skeletonCount={SKELETON_COUNTS[i] ?? 2}
                isDragging={dnd.activeTask !== null}
                isDropTarget={dnd.overColumn === column.status}
                onCreate={(title) => board.createTask(column.status, title)}
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
