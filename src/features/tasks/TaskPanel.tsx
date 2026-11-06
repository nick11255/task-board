import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react'
import { toast } from 'sonner'
import { AlertIcon, CloseIcon, TrashIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { controlClass } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Spinner } from '../../components/ui/Spinner'
import { cx } from '../../lib/cx'
import { formatTimestamp } from '../../lib/dates'
import { describeError } from '../../lib/errors'
import { COLUMNS } from '../board/columns'
import { StatusIcon } from '../board/StatusIcon'
import type { TaskEdit } from '../board/useBoard'
import { DueHint } from './DueBadge'
import { DueDateInput, PriorityPicker, StatusSelect } from './TaskFields'
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, type Task, type TaskStatus } from './types'
import { normalizeDescription, validateTaskFields } from './validation'

type TaskPanelProps = {
  /** The open task, or null when the panel is closed. */
  task: Task | null
  onClose: () => void
  onUpdate: (id: string, edit: TaskEdit) => Promise<void>
  /** Moves to the top of the new column. Rejects on failure (already reverted). */
  onMove: (id: string, status: TaskStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

/**
 * Right-hand detail panel. Every field saves on its own (on blur for text,
 * on change for pickers), optimistically; a failed save reverts that field
 * and explains why inline.
 */
export function TaskPanel({ task, onClose, ...actions }: TaskPanelProps) {
  // Lets the panel save half-typed text when it's closed via Escape/backdrop.
  const flushRef = useRef<(() => void) | null>(null)
  const close = () => {
    flushRef.current?.()
    onClose()
  }

  return (
    <Dialog open={task !== null} onClose={close} variant="sheet" labelledBy="task-panel-heading">
      {task && <PanelContent key={task.id} task={task} onClose={close} flushRef={flushRef} {...actions} />}
    </Dialog>
  )
}

type PanelContentProps = Omit<TaskPanelProps, 'task'> & {
  task: Task
  flushRef: MutableRefObject<(() => void) | null>
}

function PanelContent({ task, onClose, onUpdate, onMove, onDelete, flushRef }: PanelContentProps) {
  // null = not editing; the field shows the task's current value.
  const [titleDraft, setTitleDraft] = useState<string | null>(null)
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Set in the effect (not just the initializer): StrictMode mounts, unmounts
  // and remounts in dev, and the remount must flip this back to true.
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const column = COLUMNS.find((c) => c.status === task.status)

  const save = (edit: TaskEdit) => track(onUpdate(task.id, edit))
  const move = (status: TaskStatus) => track(onMove(task.id, status))

  /** Show "Saving…" while a write is in flight, and explain a failure inline. */
  const track = (write: Promise<void>) => {
    setSaving((n) => n + 1)
    setSaveError(null)
    write
      .catch((err: unknown) => {
        const message = describeError(err)
        // Closed before the save failed: the panel is gone, so use a toast.
        if (mounted.current) setSaveError(message)
        else toast.error("Couldn't save your changes", { description: `${message} They were undone.` })
      })
      .finally(() => {
        if (mounted.current) setSaving((n) => n - 1)
      })
  }

  const commitTitle = () => {
    if (titleDraft === null) return
    const title = titleDraft.trim()
    setTitleDraft(null)
    if (title === task.title) return
    const { title: problem } = validateTaskFields({ title, description: '' })
    if (problem) {
      setSaveError(`${problem} The previous title was kept.`)
      return
    }
    save({ title })
  }

  const commitDescription = () => {
    if (descriptionDraft === null) return
    const description = normalizeDescription(descriptionDraft)
    if (descriptionDraft.length > DESCRIPTION_MAX_LENGTH) {
      setSaveError(validateTaskFields({ title: 'x', description: descriptionDraft }).description ?? null)
      return // keep the draft so the user can trim it
    }
    setDescriptionDraft(null)
    if (description !== task.description) save({ description })
  }

  useLayoutEffect(() => {
    flushRef.current = () => {
      commitTitle()
      commitDescription()
    }
  })

  const confirmDelete = async () => {
    setDeleting(true)
    setSaveError(null)
    try {
      await onDelete(task.id)
      toast.success('Task deleted')
      onClose()
    } catch (err) {
      setSaveError(`Couldn't delete the task. ${describeError(err)}`)
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  const description = descriptionDraft ?? task.description ?? ''

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 sm:px-6">
        <StatusIcon status={task.status} />
        <span className="text-sm text-muted">{column?.label}</span>
        <div className="ml-auto flex items-center gap-2">
          {saving > 0 && (
            <span role="status" className="flex items-center gap-1 text-xs text-subtle">
              <Spinner size={12} /> Saving…
            </span>
          )}
          <IconButton label="Close details" icon={<CloseIcon />} onClick={onClose} autoFocus />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-6">
        <div>
          <label htmlFor="task-panel-heading" className="sr-only">
            Title
          </label>
          <textarea
            id="task-panel-heading"
            value={titleDraft ?? task.title}
            onChange={(e) => setTitleDraft(e.target.value.replace(/\n/g, ' '))}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            maxLength={TITLE_MAX_LENGTH}
            rows={1}
            className="-mx-2 block w-[calc(100%+1rem)] resize-none rounded-md px-2 py-1 text-xl font-semibold text-text [field-sizing:content] hover:bg-column focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
          />
        </div>

        {saveError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertIcon className="mt-0.5 shrink-0" />
            <p className="min-w-0 flex-1">{saveError}</p>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="shrink-0 text-xs font-medium text-danger underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <dl className="grid grid-cols-[6rem_1fr] items-center gap-x-4 gap-y-3 text-sm">
          <dt>
            <label htmlFor="task-panel-status" className="text-muted">
              Status
            </label>
          </dt>
          <dd className="max-w-56">
            <StatusSelect id="task-panel-status" value={task.status} onChange={move} />
          </dd>

          <dt className="text-muted">Priority</dt>
          <dd>
            <PriorityPicker
              name="task-panel-priority"
              value={task.priority}
              onChange={(priority) => save({ priority })}
            />
          </dd>

          <dt>
            <label htmlFor="task-panel-due" className="text-muted">
              Due date
            </label>
          </dt>
          <dd className="max-w-56">
            <DueDateInput
              id="task-panel-due"
              value={task.due_date ?? ''}
              onChange={(value) => save({ due_date: value || null })}
            />
            <DueHint dueDate={task.due_date} status={task.status} />
          </dd>
        </dl>

        <div className="flex flex-col">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="task-panel-description" className="text-sm font-medium text-text">
              Description
            </label>
            {description.length > DESCRIPTION_MAX_LENGTH * 0.9 && (
              <span className="text-xs text-subtle tabular-nums">
                {description.length} / {DESCRIPTION_MAX_LENGTH}
              </span>
            )}
          </div>
          <textarea
            id="task-panel-description"
            value={description}
            onChange={(e) => setDescriptionDraft(e.target.value)}
            onBlur={commitDescription}
            placeholder="Add a description…"
            className={cx(controlClass, 'min-h-32 resize-y px-3 py-2 text-sm [field-sizing:content]')}
          />
        </div>

        <p className="text-xs text-subtle">
          Created {formatTimestamp(task.created_at)} · Updated {formatTimestamp(task.updated_at)}
        </p>
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-4 sm:px-6">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm delete">
            <p className="mr-auto text-sm text-text">Delete this task? This can't be undone.</p>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleting} autoFocus>
              Delete task
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<TrashIcon size={14} />}
            onClick={() => setConfirmingDelete(true)}
            className="hover:bg-danger-soft hover:text-danger"
          >
            Delete task
          </Button>
        )}
      </footer>
    </div>
  )
}
