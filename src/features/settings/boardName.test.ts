import { describe, expect, it } from 'vitest'
import { DEFAULT_BOARD_NAME } from '../../components/BoardTitle'
import { normalizeBoardName } from './boardName'
import { BOARD_NAME_MAX_LENGTH } from './types'

describe('normalizeBoardName', () => {
  it('trims and collapses whitespace (the DB requires a trimmed value)', () => {
    expect(normalizeBoardName('  Launch   week  ')).toBe('Launch week')
  })
  it('falls back to the default when blank', () => {
    expect(normalizeBoardName('')).toBe(DEFAULT_BOARD_NAME)
    expect(normalizeBoardName('   \n ')).toBe(DEFAULT_BOARD_NAME)
  })
  it('caps at the DB limit without leaving a trailing space', () => {
    const long = `${'a'.repeat(BOARD_NAME_MAX_LENGTH - 1)} bcd`
    const result = normalizeBoardName(long)
    expect(result.length).toBeLessThanOrEqual(BOARD_NAME_MAX_LENGTH)
    expect(result).toBe(result.trim())
  })
})
