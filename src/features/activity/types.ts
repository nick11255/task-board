/** Mirrors the task_activity_kind_valid check constraint (0002, widened in 0003). */
export const ACTIVITY_KINDS = [
  'created',
  'status_changed',
  'title_changed',
  'description_changed',
  'priority_changed',
  'due_date_changed',
  'assignee_added', // 0003
  'assignee_removed', // 0003
] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

/** A row of public.task_activity. Written only by the database trigger. */
export type TaskActivity = {
  id: number
  task_id: string
  user_id: string
  kind: ActivityKind
  /** jsonb: a status/priority/title string, a YYYY-MM-DD date, or null. */
  from_value: string | null
  to_value: string | null
  created_at: string
}
