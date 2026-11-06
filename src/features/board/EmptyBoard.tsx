import { useState } from 'react'
import { LogoMark, PlusIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { describeError } from '../../lib/errors'

type EmptyBoardProps = {
  onNewTask: () => void
  onLoadSample: () => Promise<void>
}

/** First run: a brand-new guest with no tasks yet. */
export function EmptyBoard({ onNewTask, onLoadSample }: EmptyBoardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      await onLoadSample() // on success this component unmounts (the board isn't empty any more)
    } catch (err) {
      setError(describeError(err))
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center shadow-overlay">
      <div className="mx-auto w-fit">
        <LogoMark size={32} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-text">Your board is empty</h2>
      <p className="mt-2 text-sm text-muted">
        Add your first task, or load a sample board to see how everything works: priorities, due dates, drag
        and drop.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button variant="primary" leadingIcon={<PlusIcon />} onClick={onNewTask} disabled={loading}>
          New task
        </Button>
        <Button onClick={load} loading={loading}>
          Load sample board
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          Couldn't load the sample board. {error}
        </p>
      )}
      <p className="mt-4 text-xs text-subtle">Sample tasks are regular tasks: edit or delete them anytime.</p>
    </div>
  )
}
