import { Column } from './Column'
import { COLUMNS } from './columns'

export function Board() {
  return (
    <div className="min-h-0 flex-1 overflow-x-auto overscroll-x-contain">
      <div className="flex h-full snap-x snap-mandatory scroll-px-4 items-start gap-4 px-4 pb-6 sm:snap-none sm:px-6">
        {COLUMNS.map((column) => (
          <Column key={column.status} column={column} count={0} />
        ))}
      </div>
    </div>
  )
}
