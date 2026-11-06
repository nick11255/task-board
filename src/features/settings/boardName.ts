import { DEFAULT_BOARD_NAME } from '../../components/BoardTitle'
import { BOARD_NAME_MAX_LENGTH } from './types'

/**
 * What a rename actually saves: trimmed, inner whitespace collapsed, capped
 * at the DB limit, and blank falls back to the default name.
 */
export function normalizeBoardName(input: string): string {
  const name = input.replace(/\s+/g, ' ').trim().slice(0, BOARD_NAME_MAX_LENGTH).trim()
  return name || DEFAULT_BOARD_NAME
}
