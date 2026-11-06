/** Turn Supabase / network errors into a sentence a user can act on. */
export function describeError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status: unknown }).status)
      : undefined

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
