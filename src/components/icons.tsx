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
