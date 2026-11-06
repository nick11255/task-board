import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { describeError } from '../../lib/errors'
import { fetchTasks, insertTask } from '../tasks/api'
import { topPosition } from '../tasks/position'
import type { Task, TaskStatus } from '../tasks/types'
import { groupTasks } from './groupTasks'

export type BoardPhase = 'loading' | 'error' | 'ready'

export type Board = {
  phase: BoardPhase
  /** Load error message (only when phase === 'error'). */
  error: string | null
  tasks: Task[]
  columns: Record<TaskStatus, Task[]>
  /** Ids of optimistic tasks not yet confirmed by the server. */
  pendingIds: ReadonlySet<string>
  reload: () => void
  /** Optimistically adds a task to the top of a column. Rejects if the insert fails (already rolled back). */
  createTask: (status: TaskStatus, title: string) => Promise<void>
}

export function useBoard(userId: string): Board {
  const [phase, setPhase] = useState<BoardPhase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set())

  // Latest values for async callbacks without re-creating them.
  const tasksRef = useRef(tasks)
  const pendingRef = useRef(pendingIds)
  useLayoutEffect(() => {
    tasksRef.current = tasks
    pendingRef.current = pendingIds
  }, [tasks, pendingIds])
  /** Bumped on every local mutation; a fetch that started earlier is stale. */
  const mutationVersion = useRef(0)

  const load = useCallback(async ({ silent }: { silent: boolean }) => {
    const startedAt = mutationVersion.current
    try {
      const server = await fetchTasks()
      // A create/update landed while we were fetching: this snapshot may be
      // missing it, so keep local state instead of flickering.
      if (silent && mutationVersion.current !== startedAt) return
      const serverIds = new Set(server.map((t) => t.id))
      const unsaved = tasksRef.current.filter((t) => pendingRef.current.has(t.id) && !serverIds.has(t.id))
      setTasks([...server, ...unsaved])
      setPhase('ready')
    } catch (err) {
      // A failed background refresh keeps the board as-is; only the first load shows an error.
      if (!silent) {
        setError(describeError(err))
        setPhase('error')
      }
    }
  }, [])

  // Initial load. State starts in 'loading'; BoardScreen is keyed by user id,
  // so a different guest remounts with fresh state.
  useEffect(() => {
    void load({ silent: false })
  }, [load])

  // Refetch when the tab regains focus, so other tabs' changes show up (no Realtime).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load({ silent: true })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const reload = useCallback(() => {
    setPhase('loading')
    setError(null)
    void load({ silent: false })
  }, [load])

  const createTask = useCallback(
    async (status: TaskStatus, title: string) => {
      // Client-generated id: the optimistic card and the saved row share one
      // identity, so there's no temp-id swap (and no remount flicker).
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const position = topPosition(tasksRef.current.filter((t) => t.status === status))
      const optimistic: Task = {
        id,
        user_id: userId,
        title,
        description: null,
        status,
        priority: 'normal',
        due_date: null,
        position,
        created_at: now,
        updated_at: now,
      }

      mutationVersion.current++
      setTasks((prev) => [...prev, optimistic])
      setPendingIds((prev) => new Set(prev).add(id))

      try {
        const saved = await insertTask({ id, title, status, position })
        setTasks((prev) => prev.map((t) => (t.id === id ? saved : t)))
      } catch (err) {
        setTasks((prev) => prev.filter((t) => t.id !== id))
        throw err
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [userId],
  )

  const columns = useMemo(() => groupTasks(tasks), [tasks])

  return { phase, error, tasks, columns, pendingIds, reload, createTask }
}
