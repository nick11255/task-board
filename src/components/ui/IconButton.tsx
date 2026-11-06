import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx'

type IconButtonProps = Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  /** Required: icon-only buttons must have an accessible name. */
  label: string
  icon: ReactNode
  size?: 'sm' | 'md'
}

export function IconButton({
  label,
  icon,
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md text-muted',
        'transition-colors duration-150 ease-out hover:bg-border hover:text-text',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'size-6' : 'size-8',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
