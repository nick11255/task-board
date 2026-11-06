import { describe, expect, it } from 'vitest'
import { activityText, formatRelativeTime } from './describe'

const today = new Date(2026, 10, 6, 12)

describe('activityText', () => {
  it('describes creation and status moves with column labels', () => {
    expect(activityText({ kind: 'created', from_value: null, to_value: 'todo' })).toBe('Created in To Do')
    expect(activityText({ kind: 'status_changed', from_value: 'todo', to_value: 'in_progress' })).toBe(
      'Moved from To Do → In Progress',
    )
  })

  it('describes priority and title changes', () => {
    expect(activityText({ kind: 'priority_changed', from_value: 'normal', to_value: 'high' })).toBe(
      'Changed priority from Normal to High',
    )
    expect(activityText({ kind: 'title_changed', from_value: 'a', to_value: 'Write docs' })).toBe(
      'Renamed to “Write docs”',
    )
  })

  it('truncates long titles', () => {
    const text = activityText({ kind: 'title_changed', from_value: null, to_value: 'x'.repeat(100) })
    expect(text.length).toBeLessThan(60)
    expect(text).toMatch(/…”$/)
  })

  it('distinguishes setting, changing and removing a due date', () => {
    expect(activityText({ kind: 'due_date_changed', from_value: null, to_value: '2026-11-12' }, today)).toMatch(
      /^Set the due date to Nov 12/,
    )
    expect(
      activityText({ kind: 'due_date_changed', from_value: '2026-11-12', to_value: '2026-11-14' }, today),
    ).toMatch(/^Changed the due date from Nov 12 to Nov 14/)
    expect(activityText({ kind: 'due_date_changed', from_value: '2026-11-12', to_value: null })).toBe(
      'Removed the due date',
    )
  })

  it('records description edits without their content', () => {
    expect(activityText({ kind: 'description_changed', from_value: null, to_value: null })).toBe(
      'Edited the description',
    )
  })
})

describe('formatRelativeTime', () => {
  const now = new Date(2026, 10, 6, 14, 0, 0)
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

  it('rounds to the natural unit', () => {
    expect(formatRelativeTime(ago(10_000), now, 'en')).toBe('just now')
    expect(formatRelativeTime(ago(5 * 60_000), now, 'en')).toBe('5 minutes ago')
    expect(formatRelativeTime(ago(2 * 3_600_000), now, 'en')).toBe('2 hours ago')
  })

  it('uses calendar days past ~a day', () => {
    expect(formatRelativeTime(new Date(2026, 10, 5, 9).toISOString(), now, 'en')).toBe('yesterday')
    expect(formatRelativeTime(new Date(2026, 10, 3, 9).toISOString(), now, 'en')).toBe('3 days ago')
  })

  it('switches to a date after a week', () => {
    expect(formatRelativeTime(new Date(2026, 9, 20).toISOString(), now, 'en')).toBe('Oct 20')
    expect(formatRelativeTime(new Date(2025, 9, 20).toISOString(), now, 'en')).toBe('Oct 20, 2025')
  })
})
