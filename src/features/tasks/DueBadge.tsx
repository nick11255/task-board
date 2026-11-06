import { AlertIcon, CalendarIcon } from '../../components/icons'
import { cx } from '../../lib/cx'
import { useToday } from '../../lib/useToday'
import { dueDescription, dueLabel, getDueState, type DueState } from './dueState'
import type { TaskStatus } from './types'

/**
 * Urgency is carried by more than color: overdue swaps the calendar for an
 * alert icon and gets a filled chip, and every state has a text description.
 */
const STYLE: Record<Exclude<DueState, 'none'>, string> = {
  overdue: 'bg-danger-soft text-danger font-medium',
  today: 'bg-warning-soft text-warning font-medium',
  soon: 'text-warning',
  later: 'text-muted',
}

export function DueBadge({ dueDate, status }: { dueDate: string | null; status: TaskStatus }) {
  const today = useToday()
  const state = getDueState(dueDate, today, status)
  if (!dueDate || state === 'none') return null

  const description = dueDescription(dueDate, today, status)
  const chip = state === 'overdue' || state === 'today'
  const Icon = state === 'overdue' ? AlertIcon : CalendarIcon

  return (
    <span
      title={description}
      className={cx(
        'inline-flex h-5 items-center gap-1 rounded-sm tabular-nums',
        chip && 'px-1.5',
        status === 'done' && 'line-through decoration-subtle',
        STYLE[state],
      )}
    >
      <Icon size={12} />
      <span className="sr-only">{description}</span>
      <span aria-hidden>{dueLabel(dueDate, today)}</span>
    </span>
  )
}

/** One-line status for the detail panel, under the date input. */
export function DueHint({ dueDate, status }: { dueDate: string | null; status: TaskStatus }) {
  const today = useToday()
  const state = getDueState(dueDate, today, status)
  if (!dueDate || state === 'none') return null
  return (
    <p
      className={cx(
        'mt-1 text-xs',
        state === 'overdue' ? 'text-danger' : state === 'today' || state === 'soon' ? 'text-warning' : 'text-subtle',
      )}
    >
      {dueDescription(dueDate, today, status)}
    </p>
  )
}
