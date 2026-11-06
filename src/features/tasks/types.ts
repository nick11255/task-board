/** Mirrors the tasks_status_valid check constraint in the database. */
export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

/** Mirrors the tasks_priority_valid check constraint in the database. */
export const TASK_PRIORITIES = ['low', 'normal', 'high'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

/** Mirrors the tasks_title_length check constraint. */
export const TITLE_MAX_LENGTH = 200

/** Mirrors the tasks_description_length check constraint. */
export const DESCRIPTION_MAX_LENGTH = 5000

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

/** A row of public.tasks, as returned by the API. */
export type Task = {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null // ISO date, YYYY-MM-DD
  position: number
  created_at: string
  updated_at: string
}

/**
 * What the client may send on insert. `user_id` is deliberately absent:
 * the database fills it from auth.uid(), and RLS rejects anything else.
 */
export type TaskInsert = {
  id?: string
  title: string
  status?: TaskStatus
  priority?: TaskPriority
  description?: string | null
  due_date?: string | null
  position: number
}

export type TaskUpdate = Partial<Omit<TaskInsert, 'id'>>
