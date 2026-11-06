import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

type DialogProps = {
  open: boolean
  onClose: () => void
  /** modal = centered card; sheet = right-hand panel (full screen on mobile). */
  variant?: 'modal' | 'sheet'
  labelledBy: string
  children: ReactNode
}

const variants = {
  // Mobile: pinned 16px from the left and 48px from the top (vw/dvh units),
  // scrolling inside if tall. Desktop: centered.
  modal:
    'mt-12 mr-auto mb-auto ml-4 max-h-[calc(100dvh-4rem)] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto ' +
    'rounded-xl border border-border bg-surface shadow-overlay animate-dialog-in sm:m-auto',
  // Sized in vw (not %) and pinned left on mobile, so it never depends on
  // the fixed-position containing block matching the visible viewport.
  sheet:
    'm-0 h-dvh max-h-none w-screen max-w-none bg-surface shadow-overlay animate-sheet-in sm:ml-auto sm:w-[28rem] sm:border-l sm:border-border',
}

/**
 * Thin wrapper over the native <dialog> in modal mode, which gives us focus
 * trapping, Escape handling, an inert background and focus restoration
 * for free (no dialog library needed).
 */
export function Dialog({ open, onClose, variant = 'modal', labelledBy, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      // Escape: let React state drive closing.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // The browser can still force-close (e.g. a repeated Escape); keep state in sync.
      onClose={() => {
        if (open) onClose()
      }}
      // Backdrop clicks land on the <dialog> element itself; content clicks don't.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={cx(
        'p-0 text-text backdrop:bg-scrim focus-visible:outline-none',
        variants[variant],
      )}
    >
      {open && children}
    </dialog>
  )
}
