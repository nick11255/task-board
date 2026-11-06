/**
 * due_date is a calendar date (YYYY-MM-DD) with no time zone. Never pass it
 * to `new Date(string)`, which parses it as UTC midnight and can shift the
 * day for users west of UTC. Build a local date from the parts instead.
 */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** "Nov 12", or "Nov 12, 2027" outside the current year. */
export function formatShortDate(iso: string, today: Date = new Date()): string {
  const date = parseISODate(iso)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  })
}

/** "Nov 6, 2:41 PM" for created/updated timestamps. */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
