import { useState, type CSSProperties } from 'react'
import { toast, Toaster } from 'sonner'
import { AppHeader } from '../../components/AppHeader'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LockIcon, PlusIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { useTheme } from '../../lib/theme'
import { MOBILE_QUERY, useMediaQuery } from '../../lib/useMediaQuery'
import { NewTaskDialog } from '../tasks/NewTaskDialog'
import { TaskPanel } from '../tasks/TaskPanel'
import { TASK_STATUSES, type TaskStatus } from '../tasks/types'
import { Board } from './Board'
import { COLUMNS } from './columns'
import { MobileTabs } from './MobileTabs'
import { useBoard } from './useBoard'

export function BoardScreen({ userId }: { userId: string }) {
  const board = useBoard(userId)
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const theme = useTheme()
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<TaskStatus>('todo')
  // Derived, so the panel closes by itself if the task disappears (deleted, or gone after a refetch).
  const openTask = openTaskId ? (board.tasks.find((t) => t.id === openTaskId) ?? null) : null

  const ready = board.phase === 'ready'
  const counts = ready
    ? (Object.fromEntries(TASK_STATUSES.map((s) => [s, board.columns[s].length])) as Record<TaskStatus, number>)
    : null

  // "Move to…" from a card menu. On mobile the card leaves the visible tab,
  // so confirm where it went and offer a jump there.
  const moveTo = (id: string, status: TaskStatus) => {
    board
      .moveTask(id, status, 0)
      .then(() => {
        if (!isMobile) return
        const label = COLUMNS.find((c) => c.status === status)?.label ?? status
        toast.success(`Moved to ${label}`, { action: { label: 'View', onClick: () => setMobileTab(status) } })
      })
      .catch(() => {}) // moveTask already reverted and explained the failure
  }

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader
        userId={userId}
        mobileTitle="My board"
        actions={<ThemeToggle preference={theme.preference} onCycle={theme.cycle} />}
      />

      <main className="mx-auto flex min-h-0 w-full max-w-[88rem] flex-1 flex-col">
        <div className="flex items-end justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6 sm:pb-4">
          <div className="min-w-0 max-sm:hidden">
            <h1 className="text-xl font-semibold text-text">My board</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <LockIcon size={12} className="text-subtle" />
              Private to this browser
              {counts && (
                <>
                  <span aria-hidden className="text-subtle">
                    ·
                  </span>
                  <span className="tabular-nums">
                    {board.tasks.length} {board.tasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </>
              )}
            </p>
          </div>
          <Button
            variant="primary"
            leadingIcon={<PlusIcon />}
            onClick={() => setNewTaskOpen(true)}
            disabled={!ready}
            className="max-sm:hidden"
          >
            New task
          </Button>
          {isMobile && <MobileTabs active={mobileTab} counts={counts} onChange={setMobileTab} />}
        </div>

        <Board
          board={board}
          onOpenTask={setOpenTaskId}
          onMoveTo={moveTo}
          singleColumn={isMobile ? mobileTab : null}
        />
      </main>

      {/* Mobile: New task is a floating button, clear of the home indicator. */}
      <button
        type="button"
        aria-label="New task"
        onClick={() => setNewTaskOpen(true)}
        disabled={!ready}
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-overlay transition-transform duration-150 ease-out active:scale-95 disabled:opacity-50 sm:hidden"
      >
        <PlusIcon size={22} />
      </button>

      <NewTaskDialog
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreate={board.createTask}
        defaultStatus={isMobile ? mobileTab : 'todo'}
      />

      <TaskPanel
        task={openTask}
        onClose={() => setOpenTaskId(null)}
        onUpdate={board.updateTask}
        onMove={(id, status) => board.moveTask(id, status, 0, { notify: false })}
        onDelete={board.deleteTask}
      />

      <Toaster
        position={isMobile ? 'bottom-center' : 'bottom-right'}
        // Clear the floating New task button on phones.
        mobileOffset={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
        theme={theme.preference}
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
            actionButton: 'bg-accent! text-on-accent!',
          },
        }}
      />
    </div>
  )
}
