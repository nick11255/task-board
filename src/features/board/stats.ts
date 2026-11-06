import { getDueState } from '../tasks/dueState'
import type { Task } from '../tasks/types'

export type BoardStats = {
  total: number
  inProgress: number
  completed: number
  /** Whole-number percent of tasks that are done (0 for an empty board). */
  completedPercent: number
  /** Past their due date and not done. */
  overdue: number
}

/**
 * Derived from board state (never fetched), so the numbers change the
 * instant a card is dropped, including optimistic moves.
 */
export function computeStats(tasks: readonly Task[], today: Date): BoardStats {
  let inProgress = 0
  let completed = 0
  let overdue = 0
  for (const task of tasks) {
    if (task.status === 'in_progress') inProgress++
    if (task.status === 'done') completed++
    if (getDueState(task.due_date, today, task.status) === 'overdue') overdue++
  }
  const total = tasks.length
  return {
    total,
    inProgress,
    completed,
    completedPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    overdue,
  }
}
