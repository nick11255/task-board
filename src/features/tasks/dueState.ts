import { formatShortDate, parseISODate } from '../../lib/dates'
import type { TaskStatus } from './types'

/**
 * none    — no due date
 * overdue — before today (and not done)
 * today   — due today
 * soon    — due in 1–2 days
 * later   — further out, or the task is already done
 */
export type DueState = 'none' | 'overdue' | 'today' | 'soon' | 'later'

/** "Soon" covers tomorrow and the day after. */
export const SOON_DAYS = 2

const MS_PER_DAY = 86_400_000

/** Local midnight for a Date (drops the time of day). */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Whole calendar days from `today` to the due date (negative = past).
 * Rounded, so a DST day of 23 or 25 hours still counts as one day.
 */
export function daysUntil(dueDate: string, today: Date): number {
  return Math.round((parseISODate(dueDate).getTime() - startOfDay(today).getTime()) / MS_PER_DAY)
}

/**
 * Classify a due date relative to `today` (injected, so it's testable and
 * so the board can roll over at midnight). Done tasks are never overdue.
 */
export function getDueState(dueDate: string | null, today: Date, status?: TaskStatus): DueState {
  if (!dueDate) return 'none'
  if (status === 'done') return 'later'
  const days = daysUntil(dueDate, today)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= SOON_DAYS) return 'soon'
  return 'later'
}

/** Short label for a card: Today, Tomorrow, Yesterday, In 2 days, or the date. */
export function dueLabel(dueDate: string, today: Date): string {
  const days = daysUntil(dueDate, today)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 1 && days <= SOON_DAYS) return `In ${days} days`
  return formatShortDate(dueDate, today)
}

/** Longer description for tooltips, screen readers and the detail panel. */
export function dueDescription(dueDate: string, today: Date, status?: TaskStatus): string {
  const days = daysUntil(dueDate, today)
  const date = parseISODate(dueDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const plural = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`
  if (status === 'done') return `Was due ${date}`
  if (days < 0) return `Overdue by ${plural(-days)} (due ${date})`
  if (days === 0) return `Due today (${date})`
  return `Due ${date}, in ${plural(days)}`
}
