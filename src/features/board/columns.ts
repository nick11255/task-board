import type { TaskStatus } from '../tasks/types'

export type ColumnConfig = {
  status: TaskStatus
  label: string
  /** Background class for the small status dot in the column header. */
  dotClass: string
}

export const COLUMNS: readonly ColumnConfig[] = [
  { status: 'todo', label: 'To Do', dotClass: 'bg-subtle' },
  { status: 'in_progress', label: 'In Progress', dotClass: 'bg-warning' },
  { status: 'in_review', label: 'In Review', dotClass: 'bg-accent' },
  { status: 'done', label: 'Done', dotClass: 'bg-success' },
]
