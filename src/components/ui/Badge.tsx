import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

export type BadgeTone = 'neutral' | 'accent' | 'danger' | 'warning' | 'success'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-border text-muted',
  accent: 'bg-accent-soft text-accent',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
}

type BadgeProps = {
  tone?: BadgeTone
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', icon, className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex h-5 items-center gap-1 rounded-sm px-2 text-xs font-medium tabular-nums',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
