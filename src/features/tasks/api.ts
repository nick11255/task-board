import { supabase } from '../../lib/supabase'
import type { Task, TaskInsert, TaskUpdate } from './types'

const TASK_COLUMNS =
  'id, user_id, title, description, status, priority, due_date, position, created_at, updated_at'

/**
 * All of the current guest's tasks. No user_id filter here on purpose:
 * RLS scopes the query to auth.uid(), so the database is the single
 * source of truth for "whose tasks".
 */
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Update one task. `.single()` makes "0 rows matched" (deleted, or hidden
 * by RLS) an error instead of a silent no-op, so the UI can revert.
 */
export async function updateTask(id: string, patch: TaskUpdate): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return data
}

/** Delete one task. Errors (PGRST116) if no row matched, e.g. already deleted. */
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id).select('id').single()
  if (error) throw error
}

/** Several tasks in one request (one transaction: all or nothing). */
export async function insertTasks(rows: TaskInsert[]): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').insert(rows).select(TASK_COLUMNS)
  if (error) throw error
  return data
}

export async function insertTask(input: TaskInsert): Promise<Task> {
  const { data, error } = await supabase.from('tasks').insert(input).select(TASK_COLUMNS).single()
  if (error) throw error
  return data
}
