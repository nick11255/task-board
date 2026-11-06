/** Mirrors the tasks_status_valid check constraint in the database. */
export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
