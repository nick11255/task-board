import { describe, expect, it } from 'vitest'
import type { Task } from '../tasks/types'
import { EMPTY_FILTERS, isFiltering, matchesFilters, parseFilters, serializeFilters, type Filters } from './filters'

const today = new Date(2026, 10, 6, 12)
const task = (over: Partial<Task> = {}): Pick<Task, 'title' | 'priority' | 'due_date' | 'status'> => ({
  title: 'Write API docs',
  priority: 'normal',
  due_date: null,
  status: 'todo',
  ...over,
})
const f = (over: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...over })

describe('matchesFilters', () => {
  it('matches everything with no filters', () => {
    expect(matchesFilters(task(), EMPTY_FILTERS, today)).toBe(true)
    expect(isFiltering(EMPTY_FILTERS)).toBe(false)
  })

  it('searches titles case- and accent-insensitively, ignoring surrounding spaces', () => {
    expect(matchesFilters(task(), f({ query: 'api' }), today)).toBe(true)
    expect(matchesFilters(task(), f({ query: '  DOCS ' }), today)).toBe(true)
    expect(matchesFilters(task({ title: 'Café menu' }), f({ query: 'cafe' }), today)).toBe(true)
    expect(matchesFilters(task(), f({ query: 'onboarding' }), today)).toBe(false)
  })

  it('treats a whitespace-only query as no filter', () => {
    expect(isFiltering(f({ query: '   ' }))).toBe(false)
    expect(matchesFilters(task(), f({ query: '   ' }), today)).toBe(true)
  })

  it('filters by any of the selected priorities', () => {
    const filters = f({ priorities: ['high', 'low'] })
    expect(matchesFilters(task({ priority: 'high' }), filters, today)).toBe(true)
    expect(matchesFilters(task({ priority: 'low' }), filters, today)).toBe(true)
    expect(matchesFilters(task({ priority: 'normal' }), filters, today)).toBe(false)
  })

  it('filters overdue (never done tasks) and due soon (today + 2 days)', () => {
    const overdue = f({ due: 'overdue' })
    expect(matchesFilters(task({ due_date: '2026-11-05' }), overdue, today)).toBe(true)
    expect(matchesFilters(task({ due_date: '2026-11-05', status: 'done' }), overdue, today)).toBe(false)
    expect(matchesFilters(task({ due_date: null }), overdue, today)).toBe(false)

    const soon = f({ due: 'soon' })
    expect(matchesFilters(task({ due_date: '2026-11-06' }), soon, today)).toBe(true)
    expect(matchesFilters(task({ due_date: '2026-11-08' }), soon, today)).toBe(true)
    expect(matchesFilters(task({ due_date: '2026-11-09' }), soon, today)).toBe(false)
    expect(matchesFilters(task({ due_date: '2026-11-05' }), soon, today)).toBe(false)
  })

  it('combines filters with AND', () => {
    const filters = f({ query: 'docs', priorities: ['high'], due: 'overdue' })
    expect(matchesFilters(task({ priority: 'high', due_date: '2026-11-01' }), filters, today)).toBe(true)
    expect(matchesFilters(task({ priority: 'low', due_date: '2026-11-01' }), filters, today)).toBe(false)
  })
})

describe('URL round trip', () => {
  it('parses what it serializes', () => {
    const filters = f({ query: 'api docs & more', priorities: ['low', 'high'], due: 'soon' })
    expect(parseFilters(serializeFilters(filters))).toEqual({ ...filters, priorities: ['low', 'high'] })
  })

  it('writes priorities in a stable order and omits defaults', () => {
    expect(serializeFilters(f({ priorities: ['high', 'low'] }))).toBe('?priority=low%2Chigh')
    expect(serializeFilters(EMPTY_FILTERS)).toBe('')
  })

  it('keeps unrelated params and removes cleared ones', () => {
    expect(serializeFilters(EMPTY_FILTERS, '?q=old&ref=email')).toBe('?ref=email')
  })

  it('ignores malformed or unknown values', () => {
    expect(parseFilters('?priority=urgent,high,high&due=later')).toEqual(f({ priorities: ['high'] }))
    expect(parseFilters('')).toEqual(EMPTY_FILTERS)
  })
})
