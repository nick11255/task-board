import { supabase } from '../../lib/supabase'
import type { TaskActivity } from './types'

/** Timeline entries to show; plenty for a detail panel. */
export const ACTIVITY_LIMIT = 50

/** A task's history, newest first. RLS limits it to the caller's own rows. */
export async function fetchActivity(taskId: string): Promise<TaskActivity[]> {
  const { data, error } = await supabase
    .from('task_activity')
    .select('id, task_id, user_id, kind, from_value, to_value, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false }) // same-statement rows share a timestamp
    .limit(ACTIVITY_LIMIT)
  if (error) throw error
  return data
}
