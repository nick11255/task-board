import { useRef, useState, type KeyboardEvent } from 'react'
import { BoardTitleText } from '../../components/BoardTitle'
import { cx } from '../../lib/cx'
import { describeError } from '../../lib/errors'
import { BOARD_NAME_MAX_LENGTH } from './types'

type EditableBoardTitleProps = {
  name: string
  /** Hide the text until the saved name has loaded (avoids a default → custom flash). */
  loaded: boolean
  /** Saves; rejects on failure (the name has already been reverted). */
  onRename: (name: string) => Promise<string>
  /** display = page title; compact = the one-row mobile header. */
  size?: 'display' | 'compact'
}

/**
 * The board title in the display serif ("Team *playbook*"). Click (or Enter)
 * to rename inline: Enter or blur saves, Escape cancels, blank restores the
 * default. Saving is optimistic; a failure reverts and explains inline.
 */
export function EditableBoardTitle({ name, loaded, onRename, size = 'display' }: EditableBoardTitleProps) {
  const textClass = size === 'display' ? 'text-display' : 'text-xl leading-7'
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancelled = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const start = () => {
    setError(null)
    cancelled.current = false
    setDraft(name)
  }

  const finish = () => {
    if (draft === null) return
    const value = draft
    setDraft(null)
    if (cancelled.current) return
    onRename(value).catch((err: unknown) => setError(`Couldn't rename the board. ${describeError(err)}`))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur() // blur → finish (one save path)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelled.current = true
      setDraft(null)
      requestAnimationFrame(() => buttonRef.current?.focus())
    }
  }

  return (
    <div className="min-w-0">
      <h1 className={cx('font-display text-text', textClass)}>
        {draft !== null ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={finish}
            onKeyDown={onKeyDown}
            maxLength={BOARD_NAME_MAX_LENGTH}
            aria-label="Board name"
            // Same metrics as the title, so editing doesn't make the layout jump.
            className={cx(
              '-mx-2 w-[min(28rem,100%)] rounded-md bg-surface px-2 font-display text-text ring-2 ring-accent-soft focus-visible:outline-none',
              textClass,
            )}
          />
        ) : (
          <button
            ref={buttonRef}
            type="button"
            onClick={start}
            title="Rename board"
            aria-label={`${name}. Rename board`}
            className={cx(
              '-mx-2 max-w-full rounded-md px-2 text-left transition-colors duration-150 ease-out hover:bg-column',
              // One line, never clipped. The shrink-to-fit width rounds about 1px narrower
              // than the italic serif renders, so `truncate` turned "Launch week" into
              // "Launch we…" and wrapping broke it onto two lines. Nowrap lets that
              // stray pixel overflow invisibly; 60 characters still fit a desktop row.
              'whitespace-nowrap',
              size === 'compact' && 'block max-w-full overflow-hidden text-ellipsis',
              !loaded && 'invisible',
            )}
          >
            <BoardTitleText name={name} />
          </button>
        )}
      </h1>
      {error && (
        <p role="alert" className={cx('mt-1 text-xs text-danger', size === 'compact' && 'absolute top-full left-4 z-20 rounded-md bg-surface px-2 py-1 shadow-overlay')}>
          {error}
        </p>
      )}
    </div>
  )
}
