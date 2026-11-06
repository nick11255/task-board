import type { TaskActivity } from '../features/activity/types'
import type { Task, TaskInsert, TaskUpdate } from '../features/tasks/types'

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
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
