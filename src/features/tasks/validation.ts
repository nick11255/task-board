import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from './types'

export type TaskFieldErrors = Partial<Record<'title' | 'description', string>>

/**
 * Client-side mirror of the tasks table check constraints, so users see a
 * friendly message before the database has to reject anything.
 */
export function validateTaskFields(fields: { title: string; description: string }): TaskFieldErrors {
  const errors: TaskFieldErrors = {}
  const title = fields.title.trim()
  if (!title) errors.title = 'Give the task a title.'
  else if (title.length > TITLE_MAX_LENGTH) errors.title = `Keep the title under ${TITLE_MAX_LENGTH} characters.`
  if (fields.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX_LENGTH.toLocaleString()} characters.`
  }
  return errors
}

/** Empty or whitespace-only descriptions are stored as NULL. */
export function normalizeDescription(description: string): string | null {
  const trimmed = description.trim()
  return trimmed ? description.trimEnd() : null
}
