import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { toast, Toaster } from 'sonner'
import { AppHeader } from '../../components/AppHeader'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LockIcon, PlusIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { useTheme } from '../../lib/theme'
import { MOBILE_QUERY, useMediaQuery } from '../../lib/useMediaQuery'
import { useToday } from '../../lib/useToday'
import { NewTaskDialog } from '../tasks/NewTaskDialog'
import { TaskPanel } from '../tasks/TaskPanel'
import { TASK_STATUSES, type Task, type TaskStatus } from '../tasks/types'
import { Board } from './Board'
import { EmptyBoard } from './EmptyBoard'
import { FilterBar } from './FilterBar'
import { matchesFilters } from './filters'
import { COLUMNS } from './columns'
import { MobileTabs } from './MobileTabs'
import { computeStats } from './stats'
import { StatsBar, StatsLine } from './StatsBar'
import { useBoard, type NewTask } from './useBoard'
import { useFilters } from './useFilters'

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
  const today = useToday()
  // Stats always describe the whole board; filters only change what's shown.
  const stats = useMemo(() => (ready ? computeStats(board.tasks, today) : null), [ready, board.tasks, today])

  const filtersApi = useFilters()
  const { filters, active: filtering } = filtersApi
  const matches = useCallback(
    (task: Pick<Task, 'title' | 'priority' | 'due_date' | 'status'>) => matchesFilters(task, filters, today),
    [filters, today],
  )
  const filter = filtering ? matches : null

  const counts = ready
    ? (Object.fromEntries(
        TASK_STATUSES.map((s) => [s, filter ? board.columns[s].filter(filter).length : board.columns[s].length]),
      ) as Record<TaskStatus, number>)
    : null
  const shown = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0
  const filterCounts = ready ? { shown, total: board.tasks.length } : null
  const noMatches = ready && filtering && shown === 0 && board.tasks.length > 0
  // Nothing to search on an empty board (but keep it if a shared link set filters, so they can be cleared).
  const showFilters = !ready || board.tasks.length > 0 || filtering

  // A task created while filtering may not match: say so instead of letting it vanish.
  const createTask = async (input: NewTask) => {
    await board.createTask(input)
    const candidate = { priority: 'normal' as const, due_date: null, ...input }
    if (filtering && !matches(candidate)) {
      const label = COLUMNS.find((c) => c.status === input.status)?.label ?? input.status
      toast(`Added to ${label}, hidden by your filters`, {
        action: { label: 'Clear filters', onClick: filtersApi.clear },
      })
    }
  }

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
        {isMobile ? (
          <div className="flex flex-col gap-3 px-4 pt-3">
            {board.phase !== 'error' && <StatsLine stats={stats} />}
            {showFilters && <FilterBar api={filtersApi} counts={filterCounts} layout="mobile" />}
            <MobileTabs active={mobileTab} counts={counts} onChange={setMobileTab} />
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4 px-6 pt-6 pb-4">
            <div className="mr-auto min-w-0">
              <h1 className="text-xl font-semibold text-text">My board</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                <LockIcon size={12} className="text-subtle" />
                Private to this browser
              </p>
            </div>
            {/* Below lg the stats take their own full-width row under the title. */}
            {board.phase !== 'error' && (
              <StatsBar stats={stats} className="order-last w-full lg:order-none lg:w-auto" />
            )}
            <Button variant="primary" leadingIcon={<PlusIcon />} onClick={() => setNewTaskOpen(true)} disabled={!ready}>
              New task
            </Button>
            {showFilters && (
              <div className="order-last w-full">
                <FilterBar api={filtersApi} counts={filterCounts} layout="desktop" />
              </div>
            )}
          </div>
        )}

        {noMatches && (
          <div role="status" className="mx-4 mb-3 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm sm:mx-6">
            <span className="text-text">No tasks match your filters.</span>
            <button
              type="button"
              onClick={filtersApi.clear}
              className="ml-auto text-sm font-medium text-accent underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        <Board
          board={board}
          onOpenTask={setOpenTaskId}
          onMoveTo={moveTo}
          singleColumn={isMobile ? mobileTab : null}
          filter={filter}
          createTask={createTask}
          overlay={
            ready && board.tasks.length === 0 ? (
              <EmptyBoard onNewTask={() => setNewTaskOpen(true)} onLoadSample={board.loadSampleBoard} />
            ) : undefined
          }
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
        onCreate={createTask}
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
