import { cx } from '../../lib/cx'
import type { TaskStatus } from '../tasks/types'

const COLOR: Record<TaskStatus, string> = {
  todo: 'text-subtle',
  in_progress: 'text-warning',
  in_review: 'text-accent',
  done: 'text-success',
}

/**
 * Progress-ring status glyphs: empty → half → three-quarters → checked.
 * The fill tells you how far along a status is without reading the label.
 */
export function StatusIcon({ status, size = 14, className }: { status: TaskStatus; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className={cx('shrink-0', COLOR[status], className)}>
      {status === 'done' ? (
        <>
          <circle cx="7" cy="7" r="6" fill="currentColor" />
          <path
            d="M4.4 7.2l1.8 1.8 3.4-3.6"
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {status === 'in_progress' && <path d="M7 7V3.5A3.5 3.5 0 0 1 7 10.5Z" fill="currentColor" />}
          {status === 'in_review' && <path d="M7 7V3.5A3.5 3.5 0 1 1 3.5 7Z" fill="currentColor" />}
        </>
      )}
    </svg>
  )
}
