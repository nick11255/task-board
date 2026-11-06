import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { TITLE_MAX_LENGTH } from '../tasks/types'

type QuickAddProps = {
  columnId: string
  columnLabel: string
  value: string
  error: string | null
  onChange: (value: string) => void
  onSubmit: (title: string) => void
  onCancel: () => void
}

/**
 * Inline title-only composer at the top of a column. Enter adds and keeps
 * the composer open for the next task; Escape (or blurring while empty) closes.
 */
export function QuickAdd({ columnId, columnLabel, value, error, onChange, onSubmit, onCancel }: QuickAddProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const title = value.trim()
  const errorId = `quick-add-error-${columnId}`

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!title) return
    onSubmit(title)
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event)
    if (event.key === 'Escape') onCancel()
  }

  return (
    <form
      onSubmit={submit}
      onBlur={(event) => {
        const stillInside = event.currentTarget.contains(event.relatedTarget as Node | null)
        if (!stillInside && !title && !error) onCancel()
      }}
      className="rounded-lg border border-accent bg-surface p-2 shadow-sm"
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\n/g, ' '))}
        onKeyDown={onKeyDown}
        rows={2}
        maxLength={TITLE_MAX_LENGTH}
        placeholder="Task title"
        aria-label={`New task title in ${columnLabel}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="block w-full resize-none bg-transparent px-1 text-sm text-text placeholder:text-subtle focus-visible:outline-none"
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 px-1 text-xs text-danger">
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" type="submit" disabled={!title}>
          Add task
        </Button>
      </div>
    </form>
  )
}
