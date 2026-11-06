import { useCallback, useEffect, useState } from 'react'
import { describeError } from '../../lib/errors'
import { fetchActivity } from './api'
import type { TaskActivity } from './types'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; entries: TaskActivity[] }

/**
 * A task's timeline. Refetches whenever `version` changes; the panel passes
 * the task's updated_at, which moves forward after every confirmed save, and
 * the trigger writes history in that same transaction, so the new entry is
 * already there. A failed refresh keeps the entries already on screen.
 */
export function useTaskActivity(taskId: string, version: string) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchActivity(taskId).then(
      (entries) => {
        if (!cancelled) setState({ status: 'ready', entries })
      },
      (err: unknown) => {
        if (!cancelled) setState((prev) => (prev.status === 'ready' ? prev : { status: 'error', message: describeError(err) }))
      },
    )
    return () => {
      cancelled = true
    }
  }, [taskId, version, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
