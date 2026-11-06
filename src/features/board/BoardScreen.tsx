import type { CSSProperties } from 'react'
import { Toaster } from 'sonner'
import { AppHeader } from '../../components/AppHeader'
import { PlusIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Board } from './Board'
import { useBoard } from './useBoard'

export function BoardScreen({ userId }: { userId: string }) {
  const board = useBoard(userId)

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader userId={userId} />

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 px-4 pt-6 pb-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-text">My board</h1>
            <p className="mt-1 text-sm text-muted">Drag tasks between columns to update their status.</p>
          </div>
          <Button variant="primary" leadingIcon={<PlusIcon />}>
            New task
          </Button>
        </div>

        <Board board={board} />
      </main>

      <Toaster
        position="bottom-right"
        theme="system"
        closeButton
        style={
          {
            '--normal-bg': 'var(--color-surface)',
            '--normal-border': 'var(--color-border)',
            '--normal-text': 'var(--color-text)',
            '--border-radius': 'var(--radius-lg)',
            fontFamily: 'var(--font-sans)',
          } as CSSProperties
        }
        toastOptions={{
          classNames: {
            toast: 'shadow-overlay! text-sm!',
            description: 'text-muted!',
            error: '[&_[data-icon]]:text-danger',
          },
        }}
      />
    </div>
  )
}
