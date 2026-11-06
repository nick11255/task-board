import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  leadingIcon?: ReactNode
}

const base =
  'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium ' +
  'transition-[background-color,border-color,color,box-shadow,translate] duration-150 ease-out ' +
  'disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  // The shell gradient (one of its three uses). White text stays ≥4.5:1 across it.
  primary:
    'bg-linear-to-br from-grad-1 via-grad-2 to-grad-3 text-on-accent shadow-cta hover:-translate-y-px hover:shadow-cta-hover',
  secondary:
    'border border-border bg-surface text-text shadow-xs hover:border-border-strong hover:bg-column',
  ghost: 'text-muted hover:bg-column hover:text-text',
  danger: 'bg-danger-solid text-on-accent shadow-xs hover:bg-danger-solid-hover',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 gap-1 px-2 text-xs',
  md: 'h-8 gap-2 px-3 text-base',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leadingIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Spinner size={14} /> : leadingIcon}
      {children}
    </button>
  )
}
