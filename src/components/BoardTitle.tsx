/** The default until a guest renames their board. */
export const DEFAULT_BOARD_NAME = 'Team playbook'

/**
 * A board name in the display style: everything but the last word upright,
 * the last word in italic ("Team *playbook*"). A one-word name is all italic.
 */
export function BoardTitleText({ name }: { name: string }) {
  const trimmed = name.trim() || DEFAULT_BOARD_NAME
  const split = trimmed.lastIndexOf(' ')
  if (split === -1) return <em className="italic">{trimmed}</em>
  return (
    <>
      {trimmed.slice(0, split + 1)}
      <em className="italic">{trimmed.slice(split + 1)}</em>
    </>
  )
}
