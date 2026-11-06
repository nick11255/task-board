import { useState, type CSSProperties } from 'react'
import { Toaster } from 'sonner'
import { AppHeader } from '../../components/AppHeader'
import { PlusIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { NewTaskDialog } from '../tasks/NewTaskDialog'
import { TaskPanel } from '../tasks/TaskPanel'
import { Board } from './Board'
import { useBoard } from './useBoard'

export function BoardScreen({ userId }: { userId: string }) {
  const board = useBoard(userId)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  // Derived, so the panel closes by itself if the task disappears (deleted, or gone after a refetch).
  const openTask = openTaskId ? (board.tasks.find((t) => t.id === openTaskId) ?? null) : null

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader userId={userId} />

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 px-4 pt-6 pb-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-text">My board</h1>
            <p className="mt-1 text-sm text-muted">Drag tasks between columns to update their status.</p>
          </div>
          <Button
            variant="primary"
            leadingIcon={<PlusIcon />}
            onClick={() => setNewTaskOpen(true)}
            disabled={board.phase !== 'ready'}
          >
            New task
          </Button>
        </div>

        <Board board={board} onOpenTask={setOpenTaskId} />
      </main>

      <NewTaskDialog open={newTaskOpen} onClose={() => setNewTaskOpen(false)} onCreate={board.createTask} />

      <TaskPanel
        task={openTask}
        onClose={() => setOpenTaskId(null)}
        onUpdate={board.updateTask}
        onMove={(id, status) => board.moveTask(id, status, 0, { notify: false })}
        onDelete={board.deleteTask}
      />

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
