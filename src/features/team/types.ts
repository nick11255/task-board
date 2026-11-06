/** Mirrors the team_members_color_valid check constraint (0003). */
export const MEMBER_COLORS = ['indigo', 'teal', 'amber', 'rose', 'sky', 'violet', 'emerald', 'orange'] as const
export type MemberColor = (typeof MEMBER_COLORS)[number]

/** Mirrors team_members_name_length. */
export const MEMBER_NAME_MAX_LENGTH = 60

/** A row of public.team_members: a named person on this guest's roster (not a login). */
export type TeamMember = {
  id: string
  user_id: string
  name: string
  color: MemberColor
  created_at: string
}

/** A row of public.task_assignees. */
export type TaskAssignee = {
  task_id: string
  member_id: string
  user_id: string
  created_at: string
}
