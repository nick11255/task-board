import { useEffect, useState, type ReactNode } from 'react'
import { CalendarIcon, PlusIcon, TextIcon, UserIcon } from '../../components/icons'
import { cx } from '../../lib/cx'
import { formatTimestamp } from '../../lib/dates'
import { StatusIcon } from '../board/StatusIcon'
import { TaskPriorityIcon } from '../tasks/TaskFields'
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskPriority, type TaskStatus } from '../tasks/types'
import { activityText, describeActivity, formatRelativeTime } from './describe'
import type { TaskActivity } from './types'
import { useTaskActivity } from './useTaskActivity'

/** Re-render every minute so "2 minutes ago" keeps counting. */
function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

const isStatus = (v: string | null): v is TaskStatus => (TASK_STATUSES as readonly (string | null)[]).includes(v)
const isPriority = (v: string | null): v is TaskPriority => (TASK_PRIORITIES as readonly (string | null)[]).includes(v)

function KindIcon({ entry }: { entry: TaskActivity }): ReactNode {
  switch (entry.kind) {
    case 'created':
      return <PlusIcon size={12} />
    case 'status_changed':
      return isStatus(entry.to_value) ? <StatusIcon status={entry.to_value} size={12} /> : null
    case 'priority_changed':
      return isPriority(entry.to_value) ? <TaskPriorityIcon priority={entry.to_value} className="size-3" /> : null
    case 'due_date_changed':
      return <CalendarIcon size={12} />
    case 'title_changed':
    case 'description_changed':
      return <TextIcon size={12} />
    case 'assignee_added':
    case 'assignee_removed':
      return <UserIcon size={12} />
  }
}

/** `extraVersion` changes when something outside the task row changed its history (e.g. an assignment). */
export function ActivityTimeline({ task, extraVersion = '' }: { task: Task; extraVersion?: string | number }) {
  const { state, retry } = useTaskActivity(task.id, `${task.updated_at}|${extraVersion}`)
  const now = useNow()

  return (
    <section aria-labelledby="activity-heading">
      <h3 id="activity-heading" className="text-sm font-medium text-text">
        Activity
      </h3>

      {state.status === 'loading' && (
        <ul aria-hidden className="mt-3 flex flex-col gap-4">
          {[0.7, 0.5, 0.6].map((w) => (
            <li key={w} className="flex items-center gap-3">
              <span className="size-5 shrink-0 animate-shimmer rounded-full bg-column" />
              <span className="h-3 animate-shimmer rounded-sm bg-column" style={{ width: `${w * 100}%` }} />
            </li>
          ))}
        </ul>
      )}

      {state.status === 'error' && (
        <p role="alert" className="mt-3 text-sm text-muted">
          Couldn't load activity. {state.message}{' '}
          <button type="button" onClick={retry} className="font-medium text-accent underline-offset-2 hover:underline">
            Try again
          </button>
        </p>
      )}

      {state.status === 'ready' && state.entries.length === 0 && (
        <p className="mt-3 text-sm text-subtle">No activity yet.</p>
      )}

      {state.status === 'ready' && state.entries.length > 0 && (
        <ol className="relative mt-3 flex flex-col gap-4">
          {/* The rail connecting the markers. */}
          <span aria-hidden className="absolute top-2.5 bottom-2.5 left-2.5 w-px -translate-x-1/2 bg-border" />
          {state.entries.map((entry) => (
            <li key={entry.id} className="relative flex items-start gap-3">
              <span className="z-0 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted">
                <KindIcon entry={entry} />
              </span>
              <p className="min-w-0 pt-0.5 text-sm text-muted">
                <span className="sr-only">{activityText(entry)}</span>
                <span aria-hidden>
                  {describeActivity(entry).map((segment, i) => (
                    <span key={i} className={cx(segment.strong && 'font-medium text-text')}>
                      {segment.text}
                    </span>
                  ))}
                </span>
                <span aria-hidden className="text-subtle">
                  {' · '}
                </span>
                <time dateTime={entry.created_at} title={formatTimestamp(entry.created_at)} className="text-subtle">
                  {formatRelativeTime(entry.created_at, now)}
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
