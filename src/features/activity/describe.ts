import { formatShortDate } from '../../lib/dates'
import { COLUMNS } from '../board/columns'
import { PRIORITY_LABEL, type TaskPriority } from '../tasks/types'
import type { TaskActivity } from './types'

/** A sentence in parts, so the values ("To Do", "High") can be emphasized. */
export type Segment = { text: string; strong?: boolean }

const statusLabel = (value: string | null) => COLUMNS.find((c) => c.status === value)?.label ?? value ?? 'unknown'
const priorityLabel = (value: string | null) => PRIORITY_LABEL[value as TaskPriority] ?? value ?? 'unknown'
const quote = (value: string | null, max = 40) => {
  const text = value ?? ''
  return `“${text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text}”`
}

export function describeActivity(entry: Pick<TaskActivity, 'kind' | 'from_value' | 'to_value'>, today = new Date()): Segment[] {
  const { kind, from_value: from, to_value: to } = entry
  const date = (value: string) => formatShortDate(value, today)

  switch (kind) {
    case 'created':
      return to
        ? [{ text: 'Created in ' }, { text: statusLabel(to), strong: true }]
        : [{ text: 'Created this task' }]
    case 'status_changed':
      return [
        { text: 'Moved from ' },
        { text: statusLabel(from), strong: true },
        { text: ' → ' },
        { text: statusLabel(to), strong: true },
      ]
    case 'title_changed':
      return [{ text: 'Renamed to ' }, { text: quote(to), strong: true }]
    case 'description_changed':
      // Only the fact of the edit is stored (descriptions can be long).
      return [{ text: 'Edited the description' }]
    case 'priority_changed':
      return [
        { text: 'Changed priority from ' },
        { text: priorityLabel(from), strong: true },
        { text: ' to ' },
        { text: priorityLabel(to), strong: true },
      ]
    case 'due_date_changed':
      if (!to) return [{ text: 'Removed the due date' }]
      if (!from) return [{ text: 'Set the due date to ' }, { text: date(to), strong: true }]
      return [
        { text: 'Changed the due date from ' },
        { text: date(from), strong: true },
        { text: ' to ' },
        { text: date(to), strong: true },
      ]
  }
}

/** Plain-text version (screen readers, tests). */
export const activityText = (entry: Parameters<typeof describeActivity>[0], today?: Date) =>
  describeActivity(entry, today)
    .map((s) => s.text)
    .join('')

/**
 * "just now", "5 minutes ago", "2 hours ago", "yesterday", "3 days ago",
 * then a short date after a week. Uses Intl.RelativeTimeFormat (no library).
 */
export function formatRelativeTime(timestamp: string, now: Date = new Date(), locale?: string): string {
  const then = new Date(timestamp)
  const seconds = Math.round((then.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(seconds)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (abs < 45) return 'just now'
  if (abs < 45 * 60) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 22 * 3600) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86400) {
    // Calendar days, so 11 PM yesterday is "yesterday", not "1 hour ago" rounded oddly.
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const days = Math.round((startOf(then) - startOf(now)) / 86_400_000)
    return rtf.format(days, 'day')
  }
  return then.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(then.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  })
}
