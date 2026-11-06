import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TASK_STATUSES, type Task, type TaskStatus } from '../tasks/types'
import { COLUMNS } from './columns'
import type { Board } from './useBoard'

type IdColumns = Record<TaskStatus, string[]>

const isStatus = (id: UniqueIdentifier): id is TaskStatus =>
  (TASK_STATUSES as readonly UniqueIdentifier[]).includes(id)

const columnLabel = (status: TaskStatus | null) =>
  COLUMNS.find((c) => c.status === status)?.label ?? 'a column'

function toIds(columns: Record<TaskStatus, Task[]>): IdColumns {
  return Object.fromEntries(
    TASK_STATUSES.map((s) => [s, columns[s].map((t) => t.id)]),
  ) as IdColumns
}

/** Which column holds `id` (a column id, or a card id). */
function findColumn(cols: IdColumns, id: UniqueIdentifier): TaskStatus | null {
  if (isStatus(id)) return id
  return TASK_STATUSES.find((s) => cols[s].includes(String(id))) ?? null
}

/**
 * Drag state for the board. While dragging, card order lives in a local
 * id-only copy (so crossing columns is instant); on drop we hand the final
 * (status, index) to board.moveTask, which persists it.
 */
export function useBoardDnd(board: Board) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragCols, setDragColsState] = useState<IdColumns | null>(null)
  const origin = useRef<{ status: TaskStatus; index: number } | null>(null)
  // Mirrors of drag state for the collision callback, which runs outside render.
  const dragColsRef = useRef<IdColumns | null>(null)
  const lastOverId = useRef<UniqueIdentifier | null>(null)
  const justMovedColumns = useRef(false)

  const setDragCols = (next: IdColumns | null) => {
    dragColsRef.current = next
    setDragColsState(next)
  }

  // A cross-column move shifts layout for one frame; ignore collisions until it settles.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      justMovedColumns.current = false
    })
    return () => cancelAnimationFrame(frame)
  }, [dragCols])

  /**
   * Pointer first (the column under the cursor wins), then the nearest card
   * inside that column. Falls back to rectangle overlap for keyboard drags,
   * which have no pointer. Prevents the column-flip-flop you get from
   * corner-distance strategies when a move changes the layout.
   */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args)
    const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args)
    let overId = getFirstCollision(hits, 'id')

    if (overId != null) {
      const cols = dragColsRef.current
      if (cols && isStatus(overId) && cols[overId].length > 0) {
        const items = cols[overId]
        const nearest = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((c) => items.includes(String(c.id))),
        })
        overId = nearest[0]?.id ?? overId
      }
      lastOverId.current = overId
      return [{ id: overId }]
    }

    if (justMovedColumns.current) lastOverId.current = args.active.id
    return lastOverId.current != null ? [{ id: lastOverId.current }] : []
  }, [])

  const sensors = useSensors(
    // Small distance so a click (later: open details) isn't a drag.
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Press-and-hold on touch, so swiping still scrolls the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const taskById = useMemo(() => new Map(board.tasks.map((t) => [t.id, t])), [board.tasks])
  const idCols = dragCols ?? toIds(board.columns)

  /** Columns to render: drag order while dragging, server/optimistic order otherwise. */
  const columns = useMemo(() => {
    if (!dragCols) return board.columns
    return Object.fromEntries(
      TASK_STATUSES.map((s) => [s, dragCols[s].map((id) => taskById.get(id)).filter(Boolean)]),
    ) as Record<TaskStatus, Task[]>
  }, [dragCols, board.columns, taskById])

  const reset = () => {
    setActiveId(null)
    setDragCols(null)
    origin.current = null
    lastOverId.current = null
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    const cols = toIds(board.columns)
    const status = findColumn(cols, active.id)
    if (!status) return
    origin.current = { status, index: cols[status].indexOf(String(active.id)) }
    setActiveId(String(active.id))
    setDragCols(cols)
  }

  // Crossing into another column: move the id there now, so the target
  // column opens a gap under the pointer.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    const prev = dragColsRef.current
    if (!over || !prev) return
    const from = findColumn(prev, active.id)
    const to = findColumn(prev, over.id)
    if (!from || !to || from === to) return

    const id = String(active.id)
    const target = prev[to]
    const overIndex = target.indexOf(String(over.id))
    const dragged = active.rect.current.translated
    const below = overIndex >= 0 && dragged ? dragged.top > over.rect.top + over.rect.height / 2 : false
    const index = overIndex >= 0 ? overIndex + (below ? 1 : 0) : target.length

    justMovedColumns.current = true
    setDragCols({
      ...prev,
      [from]: prev[from].filter((x) => x !== id),
      [to]: [...target.slice(0, index), id, ...target.slice(index)],
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const cols = dragColsRef.current
    const start = origin.current
    reset()
    if (!over || !cols) return

    const id = String(active.id)
    const status = findColumn(cols, id)
    if (!status) return

    let items = cols[status]
    if (!isStatus(over.id)) {
      const from = items.indexOf(id)
      const to = items.indexOf(String(over.id))
      if (from >= 0 && to >= 0 && from !== to) items = arrayMove(items, from, to)
    }
    const index = items.indexOf(id)
    if (start && start.status === status && start.index === index) return // dropped where it started

    board.moveTask(id, status, index)
  }

  const titleOf = (id: UniqueIdentifier) => `“${taskById.get(String(id))?.title ?? 'task'}”`
  const positionIn = (cols: IdColumns, id: UniqueIdentifier) => {
    const status = findColumn(cols, id)
    if (!status) return 'outside the board'
    const index = cols[status].indexOf(String(id))
    return index < 0
      ? `in ${columnLabel(status)}`
      : `in ${columnLabel(status)}, position ${index + 1} of ${cols[status].length}`
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is ${positionIn(idCols, active.id)}.` : `${titleOf(active.id)} is outside the board.`,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${titleOf(active.id)} ${positionIn(idCols, active.id)}.` : `${titleOf(active.id)} was not moved.`,
    onDragCancel: ({ active }) => `Cancelled. ${titleOf(active.id)} was not moved.`,
  }

  return {
    sensors,
    collisionDetection,
    columns,
    activeTask: activeId ? (taskById.get(activeId) ?? null) : null,
    /** Column the dragged card currently sits in. */
    overColumn: activeId ? findColumn(idCols, activeId) : null,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: reset },
    accessibility: {
      announcements,
      screenReaderInstructions: {
        draggable:
          'To pick up a task, press Space or Enter. Use the arrow keys to move it within a column or to another column. Press Space or Enter again to drop it, or Escape to cancel.',
      },
    },
  }
}
