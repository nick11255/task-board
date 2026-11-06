import type { TaskActivity } from '../features/activity/types'
import type { Task, TaskInsert, TaskUpdate } from '../features/tasks/types'
import type { BoardSettings } from '../features/settings/types'
import type { MemberColor, TaskAssignee, TeamMember } from '../features/team/types'

/**
 * Hand-written Supabase schema types (the CLI generator isn't set up).
 * Keep in sync with supabase/migrations. Insert/Update have no `user_id`
 * on purpose (`never`), so the compiler stops the client from sending one.
 * task_activity is read-only from the client (no grant, written by a
 * trigger), so its Insert/Update types are `never` too.
 */
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: TaskInsert & { user_id?: never }
        Update: TaskUpdate & { user_id?: never }
        Relationships: []
      }
      task_activity: {
        Row: TaskActivity
        Insert: never
        Update: never
        Relationships: []
      }
      team_members: {
        Row: TeamMember
        Insert: { id?: string; name: string; color?: MemberColor; user_id?: never }
        Update: { name?: string; color?: MemberColor; user_id?: never }
        Relationships: []
      }
      board_settings: {
        Row: BoardSettings
        Insert: { board_name: string; user_id?: never }
        Update: { board_name?: string; user_id?: never }
        Relationships: []
      }
      task_assignees: {
        Row: TaskAssignee
        Insert: { task_id: string; member_id: string; user_id?: never }
        // No UPDATE grant: assignments are only added or removed.
        Update: never
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
