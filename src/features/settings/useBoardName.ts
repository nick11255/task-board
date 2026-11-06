import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DEFAULT_BOARD_NAME } from '../../components/BoardTitle'
import { describeError } from '../../lib/errors'
import { fetchBoardName, saveBoardName } from './api'
import { normalizeBoardName } from './boardName'

/**
 * The guest's board name. Falls back to the default while loading, if they've
 * never renamed it, or if the load fails (renaming still works then: the save
 * is an upsert). Renames are optimistic; a failed save reverts and rejects.
 */
export function useBoardName() {
  const [name, setName] = useState(DEFAULT_BOARD_NAME)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const nameRef = useRef(name)
  useLayoutEffect(() => {
    nameRef.current = name
  }, [name])

  useEffect(() => {
    let cancelled = false
    fetchBoardName().then(
      (saved) => {
        if (cancelled) return
        if (saved) setName(saved)
        setLoaded(true)
      },
      (err: unknown) => {
        if (cancelled) return
        setLoadError(describeError(err))
        setLoaded(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  /** Saves the normalized name (blank → default). Resolves with what was saved. */
  const rename = useCallback(async (input: string) => {
    const next = normalizeBoardName(input)
    const before = nameRef.current
    if (next === before) return before
    setName(next)
    try {
      const saved = await saveBoardName(next)
      setName(saved)
      setLoadError(null)
      return saved
    } catch (err) {
      setName(before)
      throw err
    }
  }, [])

  return { name, loaded, loadError, rename }
}
