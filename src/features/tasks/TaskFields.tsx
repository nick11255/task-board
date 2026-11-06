import { CloseIcon, PriorityIcon } from '../../components/icons'
import { controlClass, Select } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { cx } from '../../lib/cx'
import { COLUMNS } from '../board/columns'
import { PRIORITY_LABEL, TASK_PRIORITIES, type TaskPriority, type TaskStatus } from './types'

const LEVEL: Record<TaskPriority, 1 | 2 | 3> = { low: 1, normal: 2, high: 3 }

/** Priority glyph with the color rule used everywhere (only High stands out). */
export function TaskPriorityIcon({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <PriorityIcon
      level={LEVEL[priority]}
      className={cx(priority === 'high' ? 'text-danger' : 'text-subtle', className)}
    />
  )
}

/** Segmented Low / Normal / High control, built on native radios. */
export function PriorityPicker({
  name,
  value,
  onChange,
}: {
  name: string
  value: TaskPriority
  onChange: (priority: TaskPriority) => void
}) {
  return (
    <div role="radiogroup" aria-label="Priority" className="inline-flex rounded-md border border-border bg-bg p-0.5">
      {TASK_PRIORITIES.map((priority) => (
        <label
          key={priority}
          className={cx(
            'flex h-7 cursor-pointer items-center gap-1 rounded-sm px-2 text-xs font-medium text-muted',
            'transition-colors duration-150 ease-out hover:text-text',
            'has-checked:bg-surface has-checked:text-text has-checked:shadow-xs',
            'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
          )}
        >
          <input
            type="radio"
            name={name}
            value={priority}
            checked={value === priority}
            onChange={() => onChange(priority)}
            className="sr-only"
          />
          <TaskPriorityIcon priority={priority} />
          {PRIORITY_LABEL[priority]}
        </label>
      ))}
    </div>
  )
}

export function StatusSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: TaskStatus
  onChange: (status: TaskStatus) => void
}) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value as TaskStatus)}>
      {COLUMNS.map((column) => (
        <option key={column.status} value={column.status}>
          {column.label}
        </option>
      ))}
    </Select>
  )
}

/** Native date input (platform picker) plus a clear button. Value is YYYY-MM-DD or ''. */
export function DueDateInput({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(controlClass, 'h-8 px-3 [&::-webkit-calendar-picker-indicator]:opacity-60')}
      />
      {value && (
        <IconButton label="Clear due date" icon={<CloseIcon size={14} />} size="md" onClick={() => onChange('')} />
      )}
    </div>
  )
}
