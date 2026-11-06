import { supabase } from '../../lib/supabase'
import type { MemberColor, TaskAssignee, TeamMember } from './types'

const MEMBER_COLUMNS = 'id, user_id, name, color, created_at'
const ASSIGNEE_COLUMNS = 'task_id, member_id, user_id, created_at'

// No user_id filters or values anywhere: the DB default fills it, and RLS
// plus the composite foreign keys keep every row inside the caller's own data.

export async function fetchMembers(): Promise<TeamMember[]> {
  // Members added in one insert share created_at; name breaks the tie so avatar order is stable.
  const { data, error } = await supabase
    .from('team_members')
    .select(MEMBER_COLUMNS)
    .order('created_at')
    .order('name')
  if (error) throw error
  return data
}

export async function insertMembers(rows: { name: string; color: MemberColor }[]): Promise<TeamMember[]> {
  const { data, error } = await supabase.from('team_members').insert(rows).select(MEMBER_COLUMNS)
  if (error) throw error
  return data
}

export async function updateMember(id: string, patch: { name?: string; color?: MemberColor }): Promise<TeamMember> {
  const { data, error } = await supabase.from('team_members').update(patch).eq('id', id).select(MEMBER_COLUMNS).single()
  if (error) throw error
  return data
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id).select('id').single()
  if (error) throw error
}

export async function fetchAssignees(): Promise<TaskAssignee[]> {
  const { data, error } = await supabase.from('task_assignees').select(ASSIGNEE_COLUMNS)
  if (error) throw error
  return data
}

export async function insertAssignees(rows: { task_id: string; member_id: string }[]): Promise<TaskAssignee[]> {
  if (rows.length === 0) return []
  const { data, error } = await supabase.from('task_assignees').insert(rows).select(ASSIGNEE_COLUMNS)
  if (error) throw error
  return data
}

export async function deleteAssignee(taskId: string, memberId: string): Promise<void> {
  const { error } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)
    .eq('member_id', memberId)
    .select('task_id')
    .single()
  if (error) throw error
}
