import { describe, expect, it } from 'vitest'
import { AVATAR_FILL, initials, nextColor } from './colors'
import { MEMBER_COLORS } from './types'

function contrastWithWhite(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return 1.05 / (l + 0.05)
}

describe('avatar colors', () => {
  it('cover every allowed DB color', () => {
    expect(Object.keys(AVATAR_FILL).sort()).toEqual([...MEMBER_COLORS].sort())
  })
  it('keep white initials at WCAG AA (4.5:1) on every fill', () => {
    for (const color of MEMBER_COLORS) expect(contrastWithWhite(AVATAR_FILL[color])).toBeGreaterThanOrEqual(4.5)
  })
})

describe('initials', () => {
  it('uses first and last word, or the first two letters of one word', () => {
    expect(initials('Maya Chen')).toBe('MC')
    expect(initials('Ana Lucía de la Cruz')).toBe('AC')
    expect(initials('leo')).toBe('LE')
    expect(initials('   ')).toBe('?')
  })
})

describe('nextColor', () => {
  it('picks the least-used color, in palette order', () => {
    expect(nextColor([])).toBe('indigo')
    expect(nextColor([{ color: 'indigo' }])).toBe('teal')
    const all = MEMBER_COLORS.map((color) => ({ color }))
    expect(nextColor([...all, { color: 'indigo' }])).toBe('teal')
  })
})
