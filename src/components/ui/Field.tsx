import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { ChevronDownIcon } from '../icons'

/** Shared look for text inputs, textareas and selects. */
export const controlClass =
  'w-full rounded-md border border-border bg-surface text-base text-text shadow-xs ' +
  'placeholder:text-subtle transition-colors duration-150 ease-out hover:border-border-strong ' +
  'focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft ' +
  'aria-invalid:border-danger disabled:opacity-50'

type FieldProps = {
  label: string
  htmlFor: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-text">
          {label}
        </label>
        {hint && <span className="text-xs text-subtle tabular-nums">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** Native select with our chevron (keeps platform pickers and a11y). */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cx(controlClass, 'h-8 appearance-none pr-8 pl-3', className)} {...props}>
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted" />
    </div>
  )
}
