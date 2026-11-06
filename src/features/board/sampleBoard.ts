import { POSITION_STEP } from '../tasks/position'
import type { TaskInsert, TaskPriority, TaskStatus } from '../tasks/types'

type SampleTask = {
  title: string
  status: TaskStatus
  priority: TaskPriority
  /** Days from today; null = no due date. */
  dueInDays: number | null
  description?: string
}

/**
 * A small product team shipping a feature. Covers every column, all three
 * priorities, one overdue task, one due soon, and a done task whose past
 * due date must NOT read as overdue.
 */
const SAMPLE: SampleTask[] = [
  {
    title: 'Draft Q1 roadmap for leadership review',
    status: 'todo',
    priority: 'high',
    dueInDays: 6,
    description: 'Group themes by impact. Include the three bets we are not taking, and why.',
  },
  {
    title: 'Write the onboarding email sequence',
    status: 'todo',
    priority: 'normal',
    dueInDays: 9,
    description: 'Day 0 welcome, day 2 "create your first board", day 7 tips. Keep each under 120 words.',
  },
  { title: 'Audit color contrast on the settings page', status: 'todo', priority: 'low', dueInDays: null },
  {
    title: 'Migrate auth to Supabase',
    status: 'in_progress',
    priority: 'high',
    dueInDays: -1,
    description: 'Anonymous sessions first, then email magic links. RLS on every table before launch.',
  },
  { title: 'Design empty states for the dashboard', status: 'in_progress', priority: 'normal', dueInDays: 1 },
  {
    title: 'Fix timezone bug in due date badges',
    status: 'in_review',
    priority: 'high',
    dueInDays: null,
    description: 'Dates were parsed as UTC midnight, so they showed a day early west of UTC.',
  },
  { title: 'Add a keyboard shortcuts help panel', status: 'in_review', priority: 'low', dueInDays: null },
  { title: 'Set up CI with lint and unit tests', status: 'done', priority: 'normal', dueInDays: null },
  {
    title: 'Choose an analytics provider',
    status: 'done',
    priority: 'normal',
    dueInDays: -3,
    description: 'Picked a privacy-friendly option with no cookie banner needed.',
  },
]

function isoDate(today: Date, offsetDays: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Rows ready for one bulk insert. Every row has every key: PostgREST builds
 * the column list from the union of keys, and a missing `priority` would be
 * sent as NULL (rejected by NOT NULL).
 */
export function buildSampleTasks(today: Date): TaskInsert[] {
  const perColumn = new Map<TaskStatus, number>()
  return SAMPLE.map((task) => {
    const index = perColumn.get(task.status) ?? 0
    perColumn.set(task.status, index + 1)
    return {
      title: task.title,
      status: task.status,
      priority: task.priority,
      description: task.description ?? null,
      due_date: task.dueInDays === null ? null : isoDate(today, task.dueInDays),
      position: (index + 1) * POSITION_STEP,
    }
  })
}
