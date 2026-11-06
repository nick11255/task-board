/** Turn Supabase / network errors into a sentence a user can act on. */
export function describeError(error: unknown): string {
  // PostgrestError is a plain object with `message`, not always an Error.
  const message =
    typeof error === 'string'
      ? error
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : ''
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status: unknown }).status)
      : undefined

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : undefined

  if (code === 'PGRST116') {
    return 'This task no longer exists. Refresh to see the latest board.'
  }
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
    return "Can't reach the server. Check your connection and try again."
  }
  if (/anonymous sign-ins are disabled/i.test(message)) {
    return 'Guest sign-in is turned off for this project.'
  }
  if (status === 429 || /rate limit/i.test(message)) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  return message || 'Something went wrong. Please try again.'
}
