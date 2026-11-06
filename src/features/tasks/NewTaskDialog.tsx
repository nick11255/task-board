import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { AlertIcon, CloseIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { controlClass, Field } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { cx } from '../../lib/cx'
import { describeError } from '../../lib/errors'
import type { NewTask } from '../board/useBoard'
import { AssigneePicker } from '../team/AssigneePicker'
import type { TeamMember } from '../team/types'
import { DueDateInput, PriorityPicker, StatusSelect } from './TaskFields'
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, type TaskPriority, type TaskStatus } from './types'
import { normalizeDescription, validateTaskFields, type TaskFieldErrors } from './validation'

type NewTaskDialogProps = {
  open: boolean
  onClose: () => void
  /** Creates the task, then assigns `memberIds` (rejects if the task insert fails). */
  onCreate: (input: NewTask, memberIds: string[]) => Promise<void>
  members: readonly TeamMember[]
  onAddMember: (name: string) => Promise<TeamMember>
  /** Pre-selected column (e.g. the tab you're on, on mobile). */
  defaultStatus?: TaskStatus
}

export function NewTaskDialog({
  open,
  onClose,
  onCreate,
  members,
  onAddMember,
  defaultStatus = 'todo',
}: NewTaskDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="new-task-title">
      {/* Mounted only while open, so every open starts with a fresh form. */}
      <NewTaskForm
        onClose={onClose}
        onCreate={onCreate}
        members={members}
        onAddMember={onAddMember}
        defaultStatus={defaultStatus}
      />
    </Dialog>
  )
}

function NewTaskForm({
  onClose,
  onCreate,
  members,
  onAddMember,
  defaultStatus,
}: Omit<NewTaskDialogProps, 'open' | 'defaultStatus'> & { defaultStatus: TaskStatus }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Show field errors only after the first submit attempt.
  const errors: TaskFieldErrors = submitted ? validateTaskFields({ title, description }) : {}

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateTaskFields({ title, description })).length > 0) return

    setSaving(true)
    setServerError(null)
    try {
      await onCreate(
        {
          status,
          title: title.trim(),
          description: normalizeDescription(description),
          priority,
          due_date: dueDate || null,
        },
        assigneeIds,
      )
      onClose()
    } catch (err) {
      // The optimistic card is already gone; keep the form so nothing is lost.
      setServerError(describeError(err))
      setSaving(false)
    }
  }

  const submitOnModEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void submit()
  }

  return (
    <form onSubmit={submit} onKeyDown={submitOnModEnter} noValidate>
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 id="new-task-title" className="text-lg font-semibold">
          New task
        </h2>
        <IconButton label="Close" icon={<CloseIcon />} onClick={onClose} />
      </header>

      <div className="flex flex-col gap-4 px-6 py-6">
        <Field label="Title" htmlFor="new-task-title-input" error={errors.title}>
          <input
            id="new-task-title-input"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX_LENGTH + 20 /* allow pasting, then explain the limit */}
            placeholder="What needs to be done?"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'new-task-title-input-error' : undefined}
            className={cx(controlClass, 'h-9 px-3')}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="new-task-description"
          error={errors.description}
          hint={description.length > DESCRIPTION_MAX_LENGTH * 0.9 ? `${description.length} / ${DESCRIPTION_MAX_LENGTH}` : 'Optional'}
        >
          <textarea
            id="new-task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add details, links or acceptance criteria…"
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? 'new-task-description-error' : undefined}
            className={cx(controlClass, 'resize-y px-3 py-2 text-sm')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="new-task-status">
            <StatusSelect id="new-task-status" value={status} onChange={setStatus} />
          </Field>
          <Field label="Due date" htmlFor="new-task-due" hint="Optional">
            <DueDateInput id="new-task-due" value={dueDate} onChange={setDueDate} />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-text">Assignees</p>
          <AssigneePicker
            members={members}
            selectedIds={assigneeIds}
            onToggle={(id, selected) =>
              setAssigneeIds((ids) => (selected ? [...new Set([...ids, id])] : ids.filter((x) => x !== id)))
            }
            onAddMember={onAddMember}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-text">Priority</p>
          <PriorityPicker name="new-task-priority" value={priority} onChange={setPriority} />
        </div>

        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertIcon className="mt-0.5 shrink-0" />
            <p>
              <span className="font-medium">Couldn't create the task.</span>{' '}
              <span className="text-muted">{serverError}</span>
            </p>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-border px-6 py-4">
        <span className="hidden text-xs text-subtle sm:inline">
          <kbd className="font-sans">⌘</kbd>/<kbd className="font-sans">Ctrl</kbd> + Enter to create
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={saving}>
            Create task
          </Button>
        </div>
      </footer>
    </form>
  )
}
