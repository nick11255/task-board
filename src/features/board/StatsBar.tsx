import type { ReactNode } from 'react'
import { AlertIcon } from '../../components/icons'
import { cx } from '../../lib/cx'
import type { BoardStats } from './stats'
import { StatusIcon } from './StatusIcon'

type StatsBarProps = {
  /** null while the board is loading. */
  stats: BoardStats | null
  className?: string
}

/** Desktop: a compact strip of four stats. */
export function StatsBar({ stats, className }: StatsBarProps) {
  const overdue = stats?.overdue ?? 0
  return (
    <dl
      aria-label="Board stats"
      aria-busy={stats === null || undefined}
      className={cx(
        'flex items-stretch divide-x divide-border rounded-lg border border-border bg-surface shadow-xs',
        // Cells share the width when the strip is full width.
        '*:flex-1 lg:*:flex-none',
        className,
      )}
    >
      <Stat label="Total" value={stats?.total} />
      <Stat label="In progress" icon={<StatusIcon status="in_progress" size={12} />} value={stats?.inProgress} />
      <Stat
        label="Completed"
        icon={<StatusIcon status="done" size={12} />}
        value={stats?.completed}
      >
        {/* Inline (not below), so every cell has the same height and baseline. */}
        <ProgressBar percent={stats?.completedPercent ?? 0} className="w-12 self-center" />
        {stats && <span className="text-xs text-subtle tabular-nums">{stats.completedPercent}%</span>}
      </Stat>
      <Stat
        label="Overdue"
        icon={<AlertIcon size={12} className={overdue > 0 ? 'text-danger' : undefined} />}
        value={stats?.overdue}
        tone={overdue > 0 ? 'danger' : 'default'}
      />
    </dl>
  )
}

/** Mobile: one line, so the header stays compact. */
export function StatsLine({ stats }: StatsBarProps) {
  if (!stats) return <div aria-hidden className="h-4 w-full animate-shimmer rounded-sm bg-column" />
  return (
    <div className="flex items-center gap-3 text-xs text-muted" aria-label="Board stats">
      <ProgressBar percent={stats.completedPercent} className="flex-1" />
      <span className="tabular-nums">
        {stats.completed}/{stats.total} done
      </span>
      {stats.overdue > 0 && (
        <span className="flex items-center gap-1 font-medium text-danger tabular-nums">
          <AlertIcon size={12} />
          {stats.overdue} overdue
        </span>
      )}
    </div>
  )
}

function Stat({
  label,
  icon,
  value,
  tone = 'default',
  children,
}: {
  label: string
  icon?: ReactNode
  value: number | undefined
  tone?: 'default' | 'danger'
  /** Extra inline content after the value (e.g. a progress bar). */
  children?: ReactNode
}) {
  return (
    <div className="flex min-w-28 flex-col justify-center px-4 py-2">
      <dt className="flex items-center gap-1 text-xs text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 flex items-baseline gap-2">
        {value === undefined ? (
          <span aria-hidden className="my-1 h-4 w-8 animate-shimmer rounded-sm bg-column" />
        ) : (
          <span className={cx('text-lg font-semibold tabular-nums', tone === 'danger' ? 'text-danger' : 'text-text')}>
            {value}
          </span>
        )}
        {children}
      </dd>
    </div>
  )
}

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label="Tasks completed"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cx('h-1 overflow-hidden rounded-full bg-column', className)}
    >
      <div
        className="h-full rounded-full bg-success transition-[width] duration-300 ease-snappy"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
