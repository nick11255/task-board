import type { ComponentProps } from 'react'

type IconProps = ComponentProps<'svg'> & { size?: number }

function Icon({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3.5v9M3.5 8h9" />
    </Icon>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3.5 13.5c.6-2.3 2.4-3.5 4.5-3.5s3.9 1.2 4.5 3.5" />
    </Icon>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5" />
      <path d="M8 11h.01" strokeWidth={2} />
    </Icon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Icon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </Icon>
  )
}

export function TextIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4.5h10M3 8h10M3 11.5h6" />
    </Icon>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.1a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.1" />
    </Icon>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5L8 10l3.5-3.5" />
    </Icon>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05" />
    </Icon>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z" />
    </Icon>
  )
}

export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="2.75" width="12" height="8.5" rx="1.5" />
      <path d="M5.5 14h5M8 11.25V14" />
    </Icon>
  )
}

export function MoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="3.5" cy="8" r="0.75" fill="currentColor" />
      <circle cx="8" cy="8" r="0.75" fill="currentColor" />
      <circle cx="12.5" cy="8" r="0.75" fill="currentColor" />
    </Icon>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </Icon>
  )
}

/** Signal-bar priority glyph: 1, 2 or 3 filled bars for low, normal, high. */
export function PriorityIcon({
  level,
  size = 16,
  className,
}: {
  level: 1 | 2 | 3
  size?: number
  className?: string
}) {
  const bars = [
    { x: 2, h: 4 },
    { x: 6.5, h: 7 },
    { x: 11, h: 10 },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className={className}>
      {bars.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={13 - bar.h}
          width="3"
          height={bar.h}
          rx="1"
          fill="currentColor"
          opacity={i < level ? 1 : 0.25}
        />
      ))}
    </svg>
  )
}

/** Brand mark: three stacked bars, a nod to board columns. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="var(--color-accent)" />
      <rect x="6" y="6" width="3" height="12" rx="1.5" fill="var(--color-on-accent)" />
      <rect x="10.5" y="6" width="3" height="8" rx="1.5" fill="var(--color-on-accent)" opacity="0.8" />
      <rect x="15" y="6" width="3" height="5" rx="1.5" fill="var(--color-on-accent)" opacity="0.6" />
    </svg>
  )
}
