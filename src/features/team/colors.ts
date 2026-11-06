import { MEMBER_COLORS, type MemberColor } from './types'

/**
 * Avatar fills. Deep (-600/-700) shades so white initials are ≥4.5:1 on
 * every color, in both themes, with no per-theme variants needed.
 */
export const AVATAR_FILL: Record<MemberColor, string> = {
  indigo: '#4f46e5',
  teal: '#0f766e',
  amber: '#b45309',
  rose: '#e11d48',
  sky: '#0369a1',
  violet: '#7c3aed',
  emerald: '#047857',
  orange: '#c2410c',
}

export const COLOR_LABEL: Record<MemberColor, string> = {
  indigo: 'Indigo',
  teal: 'Teal',
  amber: 'Amber',
  rose: 'Rose',
  sky: 'Sky',
  violet: 'Violet',
  emerald: 'Emerald',
  orange: 'Orange',
}

/** "Maya Chen" → "MC", "maya" → "MA", "  " → "?". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Next color for a new member: the least-used one, in palette order. */
export function nextColor(existing: readonly { color: MemberColor }[]): MemberColor {
  const counts = new Map(MEMBER_COLORS.map((c) => [c, 0]))
  for (const m of existing) counts.set(m.color, (counts.get(m.color) ?? 0) + 1)
  return MEMBER_COLORS.reduce((best, c) => ((counts.get(c) ?? 0) < (counts.get(best) ?? 0) ? c : best))
}
