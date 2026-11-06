import { TASK_STATUSES, type Task, type TaskStatus } from '../tasks/types'

/** Bucket tasks by status, each bucket sorted by position. */
export function groupTasks(tasks: readonly Task[]): Record<TaskStatus, Task[]> {
  const groups = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as Task[]])) as Record<
    TaskStatus,
    Task[]
  >
  for (const task of tasks) groups[task.status].push(task)
  for (const status of TASK_STATUSES) groups[status].sort((a, b) => a.position - b.position)
  return groups
}
