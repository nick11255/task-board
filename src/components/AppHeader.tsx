import type { ReactNode } from 'react'
import { LogoMark, UserIcon } from './icons'

type AppHeaderProps = {
  userId: string
  /** Shown in the bar on mobile, where there's no separate page header. */
  mobileTitle: string
  /** Extra controls on the right (e.g. theme toggle). */
  actions?: ReactNode
}

export function AppHeader({ userId, mobileTitle, actions }: AppHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 sm:h-14 sm:px-6">
      <LogoMark size={22} />
      <span className="text-base font-semibold tracking-tight text-text max-sm:hidden">Playbook</span>
      <span className="text-base font-semibold tracking-tight text-text sm:hidden">{mobileTitle}</span>
      <div className="ml-auto flex items-center gap-2">
        {actions}
        <span
          title={`Guest session · ${userId}`}
          data-testid="guest-id"
          data-user-id={userId}
          className="inline-flex h-6 items-center gap-1 rounded-full border border-border px-2 text-xs font-medium text-muted"
        >
          <UserIcon size={12} />
          Guest
        </span>
      </div>
    </header>
  )
}
