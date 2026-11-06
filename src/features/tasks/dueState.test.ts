import { describe, expect, it } from 'vitest'
import { daysUntil, dueDescription, dueLabel, getDueState } from './dueState'

// "Today" is injected. Use a mid-afternoon local time to prove the time of day is ignored.
const today = new Date(2026, 10, 6, 15, 30) // Fri Nov 6 2026, 3:30 PM local

describe('getDueState', () => {
  it('is none without a due date', () => {
    expect(getDueState(null, today)).toBe('none')
  })

  it('is overdue for any day before today', () => {
    expect(getDueState('2026-11-05', today)).toBe('overdue')
    expect(getDueState('2025-01-01', today)).toBe('overdue')
  })

  it('is today for today, regardless of the time of day', () => {
    expect(getDueState('2026-11-06', today)).toBe('today')
    expect(getDueState('2026-11-06', new Date(2026, 10, 6, 0, 0, 1))).toBe('today')
    expect(getDueState('2026-11-06', new Date(2026, 10, 6, 23, 59, 59))).toBe('today')
  })

  it('is soon for tomorrow and the day after (the 2-day boundary)', () => {
    expect(getDueState('2026-11-07', today)).toBe('soon')
    expect(getDueState('2026-11-08', today)).toBe('soon')
    expect(getDueState('2026-11-09', today)).toBe('later')
  })

  it('is later for dates further out', () => {
    expect(getDueState('2026-12-25', today)).toBe('later')
  })

  it('never marks a done task as overdue', () => {
    expect(getDueState('2026-11-01', today, 'done')).toBe('later')
    expect(getDueState('2026-11-06', today, 'done')).toBe('later')
  })

  it('still flags non-done statuses', () => {
    expect(getDueState('2026-11-01', today, 'in_review')).toBe('overdue')
  })
})

describe('daysUntil (local calendar days)', () => {
  it('does not shift the day the way new Date("YYYY-MM-DD") (UTC) would', () => {
    // Late evening: a UTC parse of "2026-11-07" would land on Nov 6 west of UTC.
    const lateEvening = new Date(2026, 10, 6, 23, 0)
    expect(daysUntil('2026-11-07', lateEvening)).toBe(1)
  })

  it('counts a DST-change day as one day', () => {
    // US clocks change Nov 1 2026 and Mar 8 2026; month boundaries too.
    expect(daysUntil('2026-11-02', new Date(2026, 9, 31, 12))).toBe(2)
    expect(daysUntil('2026-03-09', new Date(2026, 2, 7, 12))).toBe(2)
    expect(daysUntil('2027-01-01', new Date(2026, 11, 31, 12))).toBe(1)
  })
})

describe('dueLabel', () => {
  it('uses relative words near today', () => {
    expect(dueLabel('2026-11-06', today)).toBe('Today')
    expect(dueLabel('2026-11-07', today)).toBe('Tomorrow')
    expect(dueLabel('2026-11-05', today)).toBe('Yesterday')
    expect(dueLabel('2026-11-08', today)).toBe('In 2 days')
  })

  it('falls back to a short date, with the year only outside this year', () => {
    expect(dueLabel('2026-11-20', today)).toMatch(/Nov/)
    expect(dueLabel('2026-11-20', today)).not.toMatch(/2026/)
    expect(dueLabel('2027-02-01', today)).toMatch(/2027/)
  })
})

describe('dueDescription', () => {
  it('explains overdue, today, upcoming and done', () => {
    expect(dueDescription('2026-11-04', today)).toMatch(/^Overdue by 2 days/)
    expect(dueDescription('2026-11-05', today)).toMatch(/^Overdue by 1 day /)
    expect(dueDescription('2026-11-06', today)).toMatch(/^Due today/)
    expect(dueDescription('2026-11-09', today)).toMatch(/in 3 days$/)
    expect(dueDescription('2026-11-01', today, 'done')).toMatch(/^Was due/)
  })
})
