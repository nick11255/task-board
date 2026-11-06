import { describe, expect, it } from 'vitest'
import { getDueState } from '../tasks/dueState'
import { TASK_PRIORITIES, TASK_STATUSES } from '../tasks/types'
import { validateTaskFields } from '../tasks/validation'
import { buildSampleTasks, SAMPLE_TEAM } from './sampleBoard'

const today = new Date(2026, 10, 6, 9)
const rows = buildSampleTasks(today)

describe('buildSampleTasks', () => {
  it('creates 8–10 tasks covering every column and priority', () => {
    expect(rows.length).toBeGreaterThanOrEqual(8)
    expect(rows.length).toBeLessThanOrEqual(10)
    expect(new Set(rows.map((r) => r.status))).toEqual(new Set(TASK_STATUSES))
    expect(new Set(rows.map((r) => r.priority))).toEqual(new Set(TASK_PRIORITIES))
  })

  it('has exactly one overdue and one due-soon task, and a done task that is not overdue', () => {
    const states = rows.map((r) => getDueState(r.due_date ?? null, today, r.status))
    expect(states.filter((s) => s === 'overdue')).toHaveLength(1)
    expect(states.filter((s) => s === 'soon' || s === 'today')).toHaveLength(1)
    const doneWithPastDate = rows.find((r) => r.status === 'done' && r.due_date)
    expect(doneWithPastDate && getDueState(doneWithPastDate.due_date ?? null, today, 'done')).toBe('later')
  })

  it('includes some descriptions and passes the same validation as user input', () => {
    expect(rows.filter((r) => r.description).length).toBeGreaterThanOrEqual(3)
    for (const r of rows) expect(validateTaskFields({ title: r.title, description: r.description ?? '' })).toEqual({})
  })

  it('gives every row every column (safe for one bulk insert) and distinct positions per column', () => {
    const keys = JSON.stringify(Object.keys(rows[0]).sort())
    for (const r of rows) expect(JSON.stringify(Object.keys(r).sort())).toBe(keys)
    for (const status of TASK_STATUSES) {
      const positions = rows.filter((r) => r.status === status).map((r) => r.position)
      expect(new Set(positions).size).toBe(positions.length)
    }
  })

  it('never sends user_id (the database fills it)', () => {
    for (const r of rows) expect('user_id' in r).toBe(false)
  })
})

describe('SAMPLE_TEAM', () => {
  it('only references sample task titles, and every member has work', () => {
    const titles = new Set(rows.map((r) => r.title))
    for (const member of SAMPLE_TEAM) {
      expect(member.titles.length).toBeGreaterThan(0)
      for (const title of member.titles) expect(titles.has(title)).toBe(true)
    }
  })
  it('has unique names and shows multi-assignee cards', () => {
    expect(new Set(SAMPLE_TEAM.map((m) => m.name.toLowerCase())).size).toBe(SAMPLE_TEAM.length)
    const counts = new Map<string, number>()
    for (const m of SAMPLE_TEAM) for (const t of m.titles) counts.set(t, (counts.get(t) ?? 0) + 1)
    expect([...counts.values()].some((n) => n > 1)).toBe(true)
  })
})
