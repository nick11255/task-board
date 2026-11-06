import { LogoMark, UserIcon } from './icons'
import { Badge } from './ui/Badge'

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 sm:px-6">
      <LogoMark />
      <span className="text-base font-semibold tracking-tight text-text">Task Board</span>
      <div className="ml-auto flex items-center gap-2">
        <Badge icon={<UserIcon size={12} />}>Guest session</Badge>
      </div>
    </header>
  )
}
