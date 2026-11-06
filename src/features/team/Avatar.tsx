import { cx } from '../../lib/cx'
import { AVATAR_FILL, initials } from './colors'
import type { TeamMember } from './types'

const SIZES = {
  xs: 'size-5 text-[0.5625rem]',
  sm: 'size-6 text-[0.625rem]',
  md: 'size-8 text-xs',
} as const

type AvatarProps = {
  member: Pick<TeamMember, 'name' | 'color'>
  size?: keyof typeof SIZES
  className?: string
  /** Decorative when the name is shown next to it. */
  decorative?: boolean
}

/** Initials on a deep color fill (white text is ≥4.5:1 on every fill). */
export function Avatar({ member, size = 'sm', className, decorative = false }: AvatarProps) {
  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : member.name}
      aria-hidden={decorative || undefined}
      title={decorative ? undefined : member.name}
      style={{ backgroundColor: AVATAR_FILL[member.color] }}
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold leading-none text-white',
        SIZES[size],
        className,
      )}
    >
      {initials(member.name)}
    </span>
  )
}

/** Overlapping avatars: up to `max`, then "+N". The ring matches the card so overlaps stay crisp. */
export function AvatarStack({
  members,
  max = 3,
  size = 'xs',
  ringClass = 'ring-surface',
}: {
  members: readonly TeamMember[]
  max?: number
  size?: keyof typeof SIZES
  ringClass?: string
}) {
  if (members.length === 0) return null
  const shown = members.slice(0, max)
  const extra = members.length - shown.length
  const label = `Assigned to ${members.map((m) => m.name).join(', ')}`
  return (
    <span role="img" aria-label={label} title={label} className="flex items-center -space-x-1.5">
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size={size} decorative className={cx('ring-2', ringClass)} />
      ))}
      {extra > 0 && (
        <span
          aria-hidden
          className={cx(
            'inline-flex items-center justify-center rounded-full bg-column font-semibold text-muted tabular-nums ring-2',
            SIZES[size],
            ringClass,
          )}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}
