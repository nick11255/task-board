import type { Task } from './types'

/** Gap between neighbours when appending; leaves room for ~50 midpoint inserts. */
export const POSITION_STEP = 1024

/** Position that sorts before every task in the column (new tasks go on top). */
export function topPosition(columnTasks: readonly Pick<Task, 'position'>[]): number {
  if (columnTasks.length === 0) return 0
  return Math.min(...columnTasks.map((t) => t.position)) - POSITION_STEP
}
