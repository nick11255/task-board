import { describe, expect, it } from 'vitest'
import type { Task, TaskStatus } from '../tasks/types'
import { computeStats } from './stats'

const today = new Date(2026, 10, 6, 12)
let n = 0
const task = (status: TaskStatus, due_date: string | null = null): Task => ({
  id: `t${n++}`,
  user_id: 'u',
  title: 'x',
  description: null,
  status,
  priority: 'normal',
  due_date,
  position: n,
  created_at: '',
  updated_at: '',
})

describe('computeStats', () => {
  it('is all zeros for an empty board (no divide-by-zero)', () => {
    expect(computeStats([], today)).toEqual({
      total: 0,
      inProgress: 0,
      completed: 0,
      completedPercent: 0,
      overdue: 0,
    })
  })

  it('counts by status and rounds the completion percent', () => {
    const stats = computeStats(
      [task('todo'), task('in_progress'), task('in_progress'), task('in_review'), task('done'), task('done')],
      today,
    )
    expect(stats).toMatchObject({ total: 6, inProgress: 2, completed: 2, completedPercent: 33 })
  })

  it('counts overdue tasks but never done ones', () => {
    const stats = computeStats(
      [
        task('todo', '2026-11-05'), // overdue
        task('in_review', '2026-10-01'), // overdue
        task('done', '2026-10-01'), // done: not overdue
        task('todo', '2026-11-06'), // due today: not overdue
        task('todo', null),
      ],
      today,
    )
    expect(stats.overdue).toBe(2)
  })

  it('reaches 100% when everything is done', () => {
    expect(computeStats([task('done'), task('done')], today).completedPercent).toBe(100)
  })
})
