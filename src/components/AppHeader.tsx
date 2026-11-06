import type { ReactNode } from 'react'
import { LogoMark, UserIcon } from './icons'

type AppHeaderProps = {
  userId: string
  /** Shown in the bar on mobile, where there's no separate page header. */
  mobileTitle: ReactNode
  /** Extra controls on the right (e.g. theme toggle). */
  actions?: ReactNode
}

export function AppHeader({ userId, mobileTitle, actions }: AppHeaderProps) {
  return (
    <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 sm:h-14 sm:px-6">
      <LogoMark size={22} />
      <span className="text-base font-semibold tracking-tight text-text max-sm:hidden">Playbook</span>
      <div className="min-w-0 flex-1 sm:hidden">{mobileTitle}</div>
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {actions}
        <span
          title={`Guest session · ${userId}`}
          data-testid="guest-id"
          data-user-id={userId}
          className="inline-flex h-6 items-center gap-1 rounded-full border border-border px-2 text-xs font-medium text-muted"
        >
          <UserIcon size={12} />
          {/* Icon-only on phones so the board name gets the room; still announced. */}
          <span className="max-sm:sr-only">Guest</span>
        </span>
      </div>
    </header>
  )
}
