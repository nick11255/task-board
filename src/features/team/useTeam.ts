import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { describeError } from '../../lib/errors'
import { deleteAssignee, deleteMember, fetchAssignees, fetchMembers, insertAssignees, insertMembers, updateMember } from './api'
import { nextColor } from './colors'
import type { MemberColor, TaskAssignee, TeamMember } from './types'

export type TeamPhase = 'loading' | 'error' | 'ready'

const key = (taskId: string, memberId: string) => `${taskId}:${memberId}`

/**
 * The guest's roster and who's assigned to what. Kept apart from useBoard:
 * tasks work fine even if this fails to load (cards just show no avatars).
 * Assigning/unassigning is optimistic with a precise revert; member edits
 * that are destructive (delete) wait for the server.
 */
export function useTeam() {
  const [phase, setPhase] = useState<TeamPhase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [assignments, setAssignments] = useState<TaskAssignee[]>([])
  /** Bumped after each confirmed assignment write, so timelines can refetch. */
  const [version, setVersion] = useState(0)

  const membersRef = useRef(members)
  const assignmentsRef = useRef(assignments)
  useLayoutEffect(() => {
    membersRef.current = members
    assignmentsRef.current = assignments
  }, [members, assignments])

  const load = useCallback(async () => {
    try {
      const [m, a] = await Promise.all([fetchMembers(), fetchAssignees()])
      setMembers(m)
      setAssignments(a)
      setPhase('ready')
      setError(null)
    } catch (err) {
      setError(describeError(err))
      setPhase((p) => (p === 'ready' ? p : 'error'))
    }
  }, [])

  // Initial load (state starts in 'loading'), then refresh when the tab is shown again.
  useEffect(() => {
    let cancelled = false
    Promise.all([fetchMembers(), fetchAssignees()]).then(
      ([m, a]) => {
        if (cancelled) return
        setMembers(m)
        setAssignments(a)
        setPhase('ready')
      },
      (err: unknown) => {
        if (cancelled) return
        setError(describeError(err))
        setPhase('error')
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const byTask = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const a of assignments) map.set(a.task_id, [...(map.get(a.task_id) ?? []), a.member_id])
    return map
  }, [assignments])

  /** Member ids on a task, in roster order (stable avatar order). */
  const idsFor = useCallback(
    (taskId: string) => {
      const ids = new Set(byTask.get(taskId) ?? [])
      return members.filter((m) => ids.has(m.id)).map((m) => m.id)
    },
    [byTask, members],
  )
  const membersFor = useCallback(
    (taskId: string) => idsFor(taskId).map((id) => byId.get(id)).filter((m): m is TeamMember => Boolean(m)),
    [idsFor, byId],
  )

  const assign = useCallback(async (taskId: string, memberId: string) => {
    const optimistic: TaskAssignee = { task_id: taskId, member_id: memberId, user_id: '', created_at: '' }
    setAssignments((prev) => (prev.some((a) => key(a.task_id, a.member_id) === key(taskId, memberId)) ? prev : [...prev, optimistic]))
    try {
      const [saved] = await insertAssignees([{ task_id: taskId, member_id: memberId }])
      setAssignments((prev) => prev.map((a) => (key(a.task_id, a.member_id) === key(taskId, memberId) ? saved : a)))
      setVersion((v) => v + 1)
    } catch (err) {
      setAssignments((prev) => prev.filter((a) => key(a.task_id, a.member_id) !== key(taskId, memberId)))
      throw err
    }
  }, [])

  const unassign = useCallback(async (taskId: string, memberId: string) => {
    const removed = assignmentsRef.current.find((a) => key(a.task_id, a.member_id) === key(taskId, memberId))
    if (!removed) return
    setAssignments((prev) => prev.filter((a) => key(a.task_id, a.member_id) !== key(taskId, memberId)))
    try {
      await deleteAssignee(taskId, memberId)
      setVersion((v) => v + 1)
    } catch (err) {
      setAssignments((prev) => [...prev, removed])
      throw err
    }
  }, [])

  /** Assign several members to a just-created task in one request. */
  const assignMany = useCallback(async (taskId: string, memberIds: readonly string[]) => {
    const saved = await insertAssignees(memberIds.map((member_id) => ({ task_id: taskId, member_id })))
    setAssignments((prev) => [...prev, ...saved])
    setVersion((v) => v + 1)
  }, [])

  const addMember = useCallback(async (name: string, color?: MemberColor) => {
    const [saved] = await insertMembers([{ name: name.trim(), color: color ?? nextColor(membersRef.current) }])
    setMembers((prev) => [...prev, saved])
    return saved
  }, [])

  const editMember = useCallback(async (id: string, patch: { name?: string; color?: MemberColor }) => {
    const before = membersRef.current.find((m) => m.id === id)
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    try {
      const saved = await updateMember(id, patch)
      setMembers((prev) => prev.map((m) => (m.id === id ? saved : m)))
    } catch (err) {
      if (before) setMembers((prev) => prev.map((m) => (m.id === id ? before : m)))
      throw err
    }
  }, [])

  const removeMember = useCallback(async (id: string) => {
    await deleteMember(id) // the DB cascades their assignments
    setMembers((prev) => prev.filter((m) => m.id !== id))
    setAssignments((prev) => prev.filter((a) => a.member_id !== id))
  }, [])

  /** Sample team for the first-run board: creates missing members, assigns by task title. */
  const seedSample = useCallback(
    async (tasks: readonly { id: string; title: string }[], plan: { name: string; color: MemberColor; titles: string[] }[]) => {
      const existing = new Map(membersRef.current.map((m) => [m.name.trim().toLowerCase(), m]))
      const missing = plan.filter((p) => !existing.has(p.name.toLowerCase()))
      const created = await insertMembers(missing.map(({ name, color }) => ({ name, color })))
      for (const m of created) existing.set(m.name.trim().toLowerCase(), m)
      setMembers((prev) => [...prev, ...created])

      const taskByTitle = new Map(tasks.map((t) => [t.title, t.id]))
      const rows = plan.flatMap((p) => {
        const member = existing.get(p.name.toLowerCase())
        return member ? p.titles.flatMap((title) => (taskByTitle.has(title) ? [{ task_id: taskByTitle.get(title) as string, member_id: member.id }] : [])) : []
      })
      const saved = await insertAssignees(rows)
      setAssignments((prev) => [...prev, ...saved])
      setVersion((v) => v + 1)
    },
    [],
  )

  return {
    phase,
    error,
    members,
    version,
    reload: load,
    idsFor,
    membersFor,
    assign,
    unassign,
    assignMany,
    addMember,
    editMember,
    removeMember,
    seedSample,
  }
}

export type Team = ReturnType<typeof useTeam>
