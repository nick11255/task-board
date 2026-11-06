import type { ReactNode } from 'react'
import { AlertIcon, LogoMark } from './icons'
import { Spinner } from './ui/Spinner'

type FullScreenStateProps = {
  title: string
  description?: ReactNode
  action?: ReactNode
}

/** Centered card for app-level failures (auth, config). */
export function FullScreenError({ title, description, action }: FullScreenStateProps) {
  return (
    <div className="flex h-dvh items-center justify-center bg-bg p-4">
      <div
        role="alert"
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center shadow-sm"
      >
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertIcon size={20} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-text">{title}</h1>
        {description && <div className="mt-2 text-sm text-muted">{description}</div>}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}

/** Quiet full-screen loader shown while the guest session starts. */
export function FullScreenLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg p-4"
    >
      <LogoMark size={32} />
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner size={14} />
        {label}
      </div>
    </div>
  )
}
