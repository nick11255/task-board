import { describe, expect, it } from 'vitest'
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from './types'
import { normalizeDescription, validateTaskFields } from './validation'

describe('validateTaskFields', () => {
  it('accepts a normal task', () => {
    expect(validateTaskFields({ title: 'Ship it', description: '' })).toEqual({})
  })
  it('rejects blank and whitespace-only titles (tasks_title_not_blank)', () => {
    expect(validateTaskFields({ title: '', description: '' }).title).toBeDefined()
    expect(validateTaskFields({ title: '   ', description: '' }).title).toBeDefined()
  })
  it('enforces the title length limit after trimming (tasks_title_length)', () => {
    expect(validateTaskFields({ title: 'a'.repeat(TITLE_MAX_LENGTH), description: '' }).title).toBeUndefined()
    expect(validateTaskFields({ title: 'a'.repeat(TITLE_MAX_LENGTH + 1), description: '' }).title).toBeDefined()
    expect(validateTaskFields({ title: ` ${'a'.repeat(TITLE_MAX_LENGTH)} `, description: '' }).title).toBeUndefined()
  })
  it('enforces the description length limit (tasks_description_length)', () => {
    const ok = 'd'.repeat(DESCRIPTION_MAX_LENGTH)
    expect(validateTaskFields({ title: 'x', description: ok }).description).toBeUndefined()
    expect(validateTaskFields({ title: 'x', description: `${ok}d` }).description).toBeDefined()
  })
})

describe('normalizeDescription', () => {
  it('stores empty descriptions as null', () => {
    expect(normalizeDescription('')).toBeNull()
    expect(normalizeDescription('  \n ')).toBeNull()
  })
  it('keeps leading indentation but drops trailing whitespace', () => {
    expect(normalizeDescription('  - item\n')).toBe('  - item')
  })
})
