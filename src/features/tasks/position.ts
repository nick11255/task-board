/**
 * Fractional ordering within a column. Each task has a float `position`;
 * moving a card writes ONE row: the midpoint of its new neighbours. When
 * repeated inserts into the same gap exhaust float precision, the column is
 * renumbered (rare: ~40 inserts into the exact same gap).
 */

/** Gap between neighbours on append / renumber. */
export const POSITION_STEP = 1024

/** Below this gap we stop halving and renumber instead. */
export const MIN_GAP = 1e-9

export type Positioned = { id: string; position: number }
export type PositionUpdate = { id: string; position: number }

/** Position strictly between two neighbours (null = no neighbour on that side). */
export function positionBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0
  if (before === null) return (after as number) - POSITION_STEP
  if (after === null) return before + POSITION_STEP
  return (before + after) / 2
}

/** Whether a distinct midpoint still fits between the two neighbours. */
export function hasRoom(before: number | null, after: number | null): boolean {
  if (before === null || after === null) return true
  const mid = (before + after) / 2
  return after - before > MIN_GAP && mid > before && mid < after
}

/** Evenly re-space a column, in the given order. */
export function renumber(ids: readonly string[]): PositionUpdate[] {
  return ids.map((id, i) => ({ id, position: (i + 1) * POSITION_STEP }))
}

/**
 * Plan the writes for dropping `movingId` at `index` of a column.
 * @param column destination column in display order, WITHOUT the moving task
 * @returns usually one update (the moved task); the whole column if renumbered
 */
export function planMove(
  column: readonly Positioned[],
  movingId: string,
  index: number,
): PositionUpdate[] {
  const at = Math.max(0, Math.min(index, column.length))
  const before = column[at - 1]?.position ?? null
  const after = column[at]?.position ?? null

  if (hasRoom(before, after)) {
    return [{ id: movingId, position: positionBetween(before, after) }]
  }

  const ordered = [
    ...column.slice(0, at).map((t) => t.id),
    movingId,
    ...column.slice(at).map((t) => t.id),
  ]
  const current = new Map(column.map((t) => [t.id, t.position]))
  // Only rows whose position actually changes need a write.
  return renumber(ordered).filter((u) => u.id === movingId || current.get(u.id) !== u.position)
}

/** Position that sorts before every task in the column (new tasks go on top). */
export function topPosition(column: readonly Pick<Positioned, 'position'>[]): number {
  if (column.length === 0) return 0
  return positionBetween(null, Math.min(...column.map((t) => t.position)))
}
