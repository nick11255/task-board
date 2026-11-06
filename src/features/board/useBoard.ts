import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { describeError } from '../../lib/errors'
import { deleteTask as apiDeleteTask, fetchTasks, insertTask, insertTasks, updateTask as apiUpdateTask } from '../tasks/api'
import { planMove, topPosition } from '../tasks/position'
import type { Task, TaskPriority, TaskStatus, TaskUpdate } from '../tasks/types'
import { groupTasks } from './groupTasks'
import { buildSampleTasks } from './sampleBoard'

export type BoardPhase = 'loading' | 'error' | 'ready'

export type NewTask = {
  /** Optional client id, so a caller can attach assignees once the insert lands. */
  id?: string
  status: TaskStatus
  title: string
  description?: string | null
  priority?: TaskPriority
  due_date?: string | null
}

/** Fields editable from the detail panel (status/position go through moveTask). */
export type TaskEdit = Pick<TaskUpdate, 'title' | 'description' | 'priority' | 'due_date'>

export type Board = {
  phase: BoardPhase
  /** Load error message (only when phase === 'error'). */
  error: string | null
  tasks: Task[]
  columns: Record<TaskStatus, Task[]>
  /** Ids of optimistic tasks not yet confirmed by the server. */
  pendingIds: ReadonlySet<string>
  reload: () => void
  /** Optimistically adds a task to the top of its column. Rejects if the insert fails (already rolled back). */
  createTask: (input: NewTask) => Promise<void>
  /** Optimistically edits fields. Rejects if the save fails (fields already reverted). */
  updateTask: (id: string, edit: TaskEdit) => Promise<void>
  /** Deletes on the server first, then removes the card. Rejects on failure. */
  deleteTask: (id: string) => Promise<void>
  /**
   * Optimistically move a task to `index` within `status`. On failure the card
   * goes back, then a toast explains why (unless `notify: false`, for callers
   * that show the error themselves) and the promise rejects.
   */
  moveTask: (id: string, status: TaskStatus, index: number, options?: { notify?: boolean }) => Promise<void>
  /** First-run helper: inserts a realistic sample board in one request; resolves with the saved tasks. */
  loadSampleBoard: () => Promise<Task[]>
}

const shorten = (title: string) => (title.length > 48 ? `${title.slice(0, 47).trimEnd()}…` : title)

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

  /**
   * Apply server-confirmed values for just the fields we wrote (plus
   * updated_at), so a response can't clobber a newer optimistic edit to a
   * different field of the same task.
   */
  const mergeSaved = (saved: Task, fields: readonly (keyof Task)[]) =>
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== saved.id) return t
        const next: Task = { ...t, updated_at: saved.updated_at }
        for (const field of fields) (next as Record<string, unknown>)[field] = saved[field]
        return next
      }),
    )

  const createTask = useCallback(
    async (input: NewTask) => {
      // Client-generated id: the optimistic card and the saved row share one
      // identity, so there's no temp-id swap (and no remount flicker).
      const id = input.id ?? crypto.randomUUID()
      const now = new Date().toISOString()
      const position = topPosition(tasksRef.current.filter((t) => t.status === input.status))
      const fields = {
        title: input.title,
        status: input.status,
        description: input.description ?? null,
        priority: input.priority ?? 'normal',
        due_date: input.due_date ?? null,
        position,
      }
      const optimistic: Task = { id, user_id: userId, created_at: now, updated_at: now, ...fields }

      mutationVersion.current++
      setTasks((prev) => [...prev, optimistic])
      setPendingIds((prev) => new Set(prev).add(id))

      try {
        const saved = await insertTask({ id, ...fields })
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

  const updateTask = useCallback(async (id: string, edit: TaskEdit) => {
    const current = tasksRef.current.find((t) => t.id === id)
    if (!current) return
    const fields = Object.keys(edit) as (keyof TaskEdit)[]
    const before = Object.fromEntries(fields.map((f) => [f, current[f]])) as Partial<Task>

    mutationVersion.current++
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...edit } : t)))

    try {
      const saved = await apiUpdateTask(id, edit)
      mergeSaved(saved, fields)
    } catch (err) {
      // Revert only the fields this edit touched.
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...before } : t)))
      throw err
    }
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    // Not optimistic: deleting is destructive, so wait for the server.
    mutationVersion.current++
    await apiDeleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const moveTask = useCallback(async (id: string, status: TaskStatus, index: number, { notify = true } = {}) => {
    const current = tasksRef.current
    const moving = current.find((t) => t.id === id)
    if (!moving) return

    const destination = current
      .filter((t) => t.status === status && t.id !== id)
      .sort((a, b) => a.position - b.position)
    const updates = planMove(destination, id, index)
    const byId = new Map(updates.map((u) => [u.id, u.position]))

    // Snapshot exactly what we're about to change, for a precise revert.
    const snapshot = new Map(
      current.filter((t) => byId.has(t.id)).map((t) => [t.id, { status: t.status, position: t.position }]),
    )

    mutationVersion.current++
    setTasks((prev) =>
      prev.map((t) => {
        const position = byId.get(t.id)
        if (position === undefined) return t
        return t.id === id ? { ...t, status, position } : { ...t, position }
      }),
    )

    // The moved card is one write; a renumber (rare) adds the column's other rows.
    const writes = updates.map((u) =>
      apiUpdateTask(u.id, u.id === id ? { status, position: u.position } : { position: u.position }),
    )

    try {
      const saved = await Promise.all(writes)
      saved.forEach((t) => mergeSaved(t, ['status', 'position']))
    } catch (err) {
      // Put every touched card back where it was, then say why.
      setTasks((prev) =>
        prev.map((t) => {
          const before = snapshot.get(t.id)
          return before ? { ...t, ...before } : t
        }),
      )
      if (notify) {
        toast.error(`Couldn't move “${shorten(moving.title)}”`, {
          description: `${describeError(err)} The card was put back.`,
        })
      }
      throw err
    }
  }, [])

  const loadSampleBoard = useCallback(async () => {
    // Not optimistic: nine cards popping in and then out on failure would be
    // worse than a short wait on the button. One insert = one transaction.
    mutationVersion.current++
    const saved = await insertTasks(buildSampleTasks(new Date()))
    setTasks((prev) => [...prev, ...saved])
    return saved
  }, [])

  const columns = useMemo(() => groupTasks(tasks), [tasks])

  return { phase, error, tasks, columns, pendingIds, reload, createTask, updateTask, deleteTask, moveTask, loadSampleBoard }
}
