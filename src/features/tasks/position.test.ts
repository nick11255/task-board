import { describe, expect, it } from 'vitest'
import {
  MIN_GAP,
  POSITION_STEP,
  hasRoom,
  planMove,
  positionBetween,
  renumber,
  topPosition,
  type Positioned,
} from './position'

const col = (...positions: number[]): Positioned[] =>
  positions.map((position, i) => ({ id: `t${i}`, position }))

/** Apply updates and return ids in sorted (display) order. */
function applyAndSort(column: Positioned[], movingId: string, index: number): Positioned[] {
  const updates = new Map(planMove(column, movingId, index).map((u) => [u.id, u.position]))
  const all = [...column, { id: movingId, position: NaN }].map((t) => ({
    id: t.id,
    position: updates.get(t.id) ?? t.position,
  }))
  return all.sort((a, b) => a.position - b.position)
}

describe('positionBetween', () => {
  it('starts an empty column at 0', () => {
    expect(positionBetween(null, null)).toBe(0)
  })
  it('goes one step above the first task', () => {
    expect(positionBetween(null, 100)).toBe(100 - POSITION_STEP)
  })
  it('goes one step below the last task', () => {
    expect(positionBetween(100, null)).toBe(100 + POSITION_STEP)
  })
  it('takes the midpoint between two tasks', () => {
    expect(positionBetween(0, 1024)).toBe(512)
  })
})

describe('hasRoom', () => {
  it('always has room at the edges', () => {
    expect(hasRoom(null, 5)).toBe(true)
    expect(hasRoom(5, null)).toBe(true)
  })
  it('has no room between equal positions', () => {
    expect(hasRoom(5, 5)).toBe(false)
  })
  it('has no room once the gap is below MIN_GAP', () => {
    expect(hasRoom(1, 1 + MIN_GAP / 2)).toBe(false)
  })
})

describe('planMove', () => {
  it('drops into an empty column with a single write', () => {
    expect(planMove([], 'x', 0)).toEqual([{ id: 'x', position: 0 }])
  })

  it('drops at the top, bottom and between neighbours with a single write', () => {
    const column = col(0, 1024, 2048)
    expect(planMove(column, 'x', 0)).toEqual([{ id: 'x', position: -1024 }])
    expect(planMove(column, 'x', 3)).toEqual([{ id: 'x', position: 3072 }])
    expect(planMove(column, 'x', 1)).toEqual([{ id: 'x', position: 512 }])
  })

  it('clamps out-of-range indexes', () => {
    const column = col(0, 1024)
    expect(planMove(column, 'x', 99)).toEqual([{ id: 'x', position: 2048 }])
    expect(planMove(column, 'x', -5)).toEqual([{ id: 'x', position: -1024 }])
  })

  it('places the task exactly where it was dropped', () => {
    const column = col(0, 1024, 2048)
    expect(applyAndSort(column, 'x', 2).map((t) => t.id)).toEqual(['t0', 't1', 'x', 't2'])
  })

  it('renumbers when neighbours share a position, keeping order', () => {
    const column = col(10, 10, 10)
    const sorted = applyAndSort(column, 'x', 1)
    expect(sorted.map((t) => t.id)).toEqual(['t0', 'x', 't1', 't2'])
    expect(new Set(sorted.map((t) => t.position)).size).toBe(4)
  })

  it('survives precision exhaustion: renumbers and keeps the order correct', () => {
    // Keep inserting directly after the first card — the worst case.
    let column: Positioned[] = col(0, POSITION_STEP)
    let renumbered = false
    for (let i = 0; i < 200; i++) {
      const id = `n${i}`
      const updates = planMove(column, id, 1)
      if (updates.length > 1) renumbered = true
      const next = applyAndSort(column, id, 1)
      // The new card must sit right after t0, and positions must stay distinct.
      expect(next[0].id).toBe('t0')
      expect(next[1].id).toBe(id)
      expect(new Set(next.map((t) => t.position)).size).toBe(next.length)
      column = next
    }
    expect(renumbered).toBe(true)
  })

  it('only writes rows whose position changes when renumbering', () => {
    const column: Positioned[] = [
      { id: 'a', position: POSITION_STEP },
      { id: 'b', position: POSITION_STEP },
    ]
    const updates = planMove(column, 'x', 1)
    // a is already at 1 * STEP, so only x and b move.
    expect(updates.map((u) => u.id).sort()).toEqual(['b', 'x'])
  })
})

describe('renumber', () => {
  it('spaces tasks evenly in the given order', () => {
    expect(renumber(['a', 'b', 'c'])).toEqual([
      { id: 'a', position: 1024 },
      { id: 'b', position: 2048 },
      { id: 'c', position: 3072 },
    ])
  })
})

describe('topPosition', () => {
  it('is 0 for an empty column and one step above the minimum otherwise', () => {
    expect(topPosition([])).toBe(0)
    expect(topPosition([{ position: 50 }, { position: -10 }])).toBe(-10 - POSITION_STEP)
  })
})
