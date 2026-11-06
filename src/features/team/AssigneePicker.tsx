import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { CloseIcon, PlusIcon, UserIcon } from '../../components/icons'
import { cx } from '../../lib/cx'
import { describeError } from '../../lib/errors'
import { Avatar } from './Avatar'
import { MEMBER_NAME_MAX_LENGTH, type TeamMember } from './types'

type AssigneePickerProps = {
  members: readonly TeamMember[]
  selectedIds: readonly string[]
  /** Toggle one member; may reject (the caller has already reverted). */
  onToggle: (memberId: string, selected: boolean) => Promise<void> | void
  /** Create a member from the search text, then select them. */
  onAddMember: (name: string) => Promise<TeamMember>
  /** Inline error from a failed toggle, shown under the chips. */
  error?: string | null
}

/**
 * Selected people as removable chips, plus an "Assign" popover with search,
 * checkboxes, and "Add “name” as a member" when there's no match.
 * Escape closes just the popover (it never bubbles up to close a dialog).
 */
export function AssigneePicker({ members, selectedIds, onToggle, onAddMember, error }: AssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const selected = members.filter((m) => selectedIds.includes(m.id))
  const q = query.trim().toLowerCase()
  const matches = q ? members.filter((m) => m.name.toLowerCase().includes(q)) : members
  const exact = members.some((m) => m.name.trim().toLowerCase() === q)

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = () => {
    setOpen(false)
    setQuery('')
    setAddError(null)
    triggerRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault() // stops the native <dialog> from treating it as "close"
      event.stopPropagation()
      close()
    }
  }

  const add = async () => {
    const name = query.trim()
    if (!name) return
    setAdding(true)
    setAddError(null)
    try {
      const member = await onAddMember(name)
      setQuery('')
      await onToggle(member.id, true)
    } catch (err) {
      setAddError(describeError(err))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <div className="flex flex-wrap items-center gap-1">
        {selected.map((m) => (
          <span
            key={m.id}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-surface py-0.5 pr-1 pl-0.5 text-xs font-medium text-text"
          >
            <Avatar member={m} size="sm" decorative />
            {m.name}
            <button
              type="button"
              aria-label={`Unassign ${m.name}`}
              onClick={() => void onToggle(m.id, false)}
              className="flex size-5 items-center justify-center rounded-full text-muted hover:bg-column hover:text-text"
            >
              <CloseIcon size={10} />
            </button>
          </span>
        ))}
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => (open ? close() : setOpen(true))}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border-strong px-2 text-xs font-medium text-muted transition-colors duration-150 ease-out hover:border-accent hover:text-text"
        >
          {selected.length ? <PlusIcon size={12} /> : <UserIcon size={12} />}
          {selected.length ? 'Add' : 'Assign'}
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {open && (
        <div
          id={listId}
          className="absolute top-full left-0 z-30 mt-1 w-64 rounded-lg border border-border bg-surface p-1 shadow-overlay"
        >
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (q && !exact) void add()
              }
            }}
            maxLength={MEMBER_NAME_MAX_LENGTH}
            placeholder="Search or add a person…"
            aria-label="Search team members"
            className="h-8 w-full rounded-md bg-transparent px-2 text-sm text-text placeholder:text-subtle focus-visible:bg-column focus-visible:outline-none"
          />
          <div role="group" aria-label="Team members" className="mt-1 max-h-56 overflow-y-auto">
            {matches.map((m) => {
              const isOn = selectedIds.includes(m.id)
              return (
                <label
                  key={m.id}
                  className={cx(
                    'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-text hover:bg-column',
                    'has-[:focus-visible]:bg-column has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => void onToggle(m.id, !isOn)}
                    className="sr-only"
                  />
                  <Avatar member={m} size="xs" decorative />
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span aria-hidden className={cx('text-accent', !isOn && 'invisible')}>
                    ✓
                  </span>
                </label>
              )
            })}
            {matches.length === 0 && !q && (
              <p className="px-2 py-2 text-xs text-muted">No team members yet. Type a name to add one.</p>
            )}
          </div>
          {q && !exact && (
            <button
              type="button"
              onClick={() => void add()}
              disabled={adding}
              className="mt-1 flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-accent hover:bg-accent-soft disabled:opacity-50"
            >
              <PlusIcon size={14} />
              <span className="truncate">
                Add “{query.trim()}” as a member
              </span>
            </button>
          )}
          {addError && <p className="px-2 py-1 text-xs text-danger">{addError}</p>}
        </div>
      )}
    </div>
  )
}
