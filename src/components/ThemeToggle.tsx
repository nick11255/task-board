import type { ThemePreference } from '../lib/theme'
import { MonitorIcon, MoonIcon, SunIcon } from './icons'
import { IconButton } from './ui/IconButton'

const LABEL: Record<ThemePreference, string> = { system: 'System', light: 'Light', dark: 'Dark' }
const NEXT: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' }
const ICON = { system: MonitorIcon, light: SunIcon, dark: MoonIcon }

export function ThemeToggle({ preference, onCycle }: { preference: ThemePreference; onCycle: () => void }) {
  const Icon = ICON[preference]
  return (
    <IconButton
      label={`Theme: ${LABEL[preference]}. Switch to ${LABEL[NEXT[preference]]}`}
      icon={<Icon />}
      size="sm"
      onClick={onCycle}
    />
  )
}
