import type { ReactNode } from 'react'
import { PlusIcon } from '../../components/icons'
import { Badge } from '../../components/ui/Badge'
import { IconButton } from '../../components/ui/IconButton'
import type { ColumnConfig } from './columns'

type ColumnProps = {
  column: ColumnConfig
  count: number
  children?: ReactNode
}

export function Column({ column, count, children }: ColumnProps) {
  const headingId = `column-${column.status}`

  return (
    <section
      aria-labelledby={headingId}
      className="group/column flex max-h-full w-[85vw] shrink-0 snap-center flex-col rounded-xl bg-column p-2 sm:w-72"
    >
      <header className="flex h-8 items-center gap-2 pl-2">
        <span aria-hidden className={`size-2 rounded-full ${column.dotClass}`} />
        <h2 id={headingId} className="text-base font-semibold text-text">
          {column.label}
        </h2>
        <Badge>{count}</Badge>
        <IconButton
          label={`Add task to ${column.label}`}
          icon={<PlusIcon />}
          size="sm"
          className="ml-auto opacity-0 group-hover/column:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        />
      </header>

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {count === 0 ? <ColumnEmpty /> : children}
      </div>
    </section>
  )
}

function ColumnEmpty() {
  return (
    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border-strong text-sm text-subtle">
      No tasks
    </div>
  )
}
