import { useMemo, useState } from 'react'
import { PlusIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { describeError } from '../../lib/errors'
import { useToday } from '../../lib/useToday'
import type { Task } from '../tasks/types'
import { TaskCard } from './TaskCard'

type EmptyBoardProps = {
  onNewTask: () => void
  onLoadSample: () => Promise<void>
}

function exampleTasks(today: Date): [Task, Task] {
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  const base = { user_id: '', position: 0, created_at: '', updated_at: '' }
  return [
    {
      ...base,
      id: 'example-1',
      title: 'Design the launch page',
      description: 'Hero, pricing, FAQ.',
      status: 'in_progress',
      priority: 'high',
      due_date: iso,
    },
    { ...base, id: 'example-2', title: 'Write the release notes', description: null, status: 'todo', priority: 'low', due_date: null },
  ]
}

/** First run: a mini hero with two tilted example cards. */
export function EmptyBoard({ onNewTask, onLoadSample }: EmptyBoardProps) {
  const today = useToday()
  const [first, second] = useMemo(() => exampleTasks(today), [today])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      await onLoadSample() // on success this unmounts (the board isn't empty any more)
    } catch (err) {
      setError(describeError(err))
      setLoading(false)
    }
  }

  return (
    <section aria-labelledby="first-run-heading" className="flex w-full max-w-xl flex-col items-center text-center">
      {/* Decorative: what a card looks like. Real TaskCards, so the preview never drifts from the product. */}
      <div aria-hidden className="pointer-events-none relative mb-10 h-40 w-full max-w-lg select-none">
        <div className="hero-bloom absolute -inset-x-16 -inset-y-12 -z-10 opacity-90" />
        {/* Spread so both titles read in full; the overlap is only at the corners. */}
        <TaskCard task={second} variant="showcase" className="absolute top-10 left-0 w-52 -rotate-6 sm:w-56" />
        <TaskCard task={first} variant="showcase" className="absolute top-0 right-0 w-56 rotate-[5deg] sm:w-60" />
      </div>

      <h2 id="first-run-heading" className="font-display text-display text-balance text-text sm:text-display-lg">
        Start with a <em className="italic">clean</em> slate
      </h2>
      <p className="mt-3 max-w-md text-base text-muted">
        Add your first task, or load a sample board to see priorities, due dates and drag-and-drop in action.
      </p>

      <div className="mt-8 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row">
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
      <p className="mt-6 text-xs text-subtle">Sample tasks are regular tasks: edit or delete them anytime.</p>
    </section>
  )
}
