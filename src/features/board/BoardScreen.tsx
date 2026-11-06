import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { toast, Toaster } from 'sonner'
import { AmbientBackground } from '../../components/AmbientBackground'
import { AppHeader } from '../../components/AppHeader'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LockIcon, MoreIcon, PlusIcon, TrashIcon, UserIcon } from '../../components/icons'
import { Menu } from '../../components/ui/Menu'
import { Button } from '../../components/ui/Button'
import { describeError } from '../../lib/errors'
import { useTheme } from '../../lib/theme'
import { MOBILE_QUERY, useMediaQuery } from '../../lib/useMediaQuery'
import { useToday } from '../../lib/useToday'
import { EditableBoardTitle } from '../settings/EditableBoardTitle'
import { useBoardName } from '../settings/useBoardName'
import { NewTaskDialog } from '../tasks/NewTaskDialog'
import { TaskPanel } from '../tasks/TaskPanel'
import { TASK_STATUSES, type Task, type TaskStatus } from '../tasks/types'
import { AvatarStack } from '../team/Avatar'
import { TeamDialog } from '../team/TeamDialog'
import { useTeam } from '../team/useTeam'
import { Board } from './Board'
import { ClearBoardDialog } from './ClearBoardDialog'
import { EmptyBoard } from './EmptyBoard'
import { FilterBar } from './FilterBar'
import { matchesFilters, type FilterableTask } from './filters'
import { COLUMNS } from './columns'
import { MobileTabs } from './MobileTabs'
import { SAMPLE_TEAM } from './sampleBoard'
import { computeStats } from './stats'
import { StatsBar, StatsLine } from './StatsBar'
import { useBoard, type NewTask } from './useBoard'
import { useFilters } from './useFilters'

export function BoardScreen({ userId }: { userId: string }) {
  const board = useBoard(userId)
  // Team data is separate: if it fails to load, tasks still work (cards just show no avatars).
  const team = useTeam(userId)
  const [teamOpen, setTeamOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  // Separate table and hook: Clear board never touches the name.
  const boardName = useBoardName()
  useEffect(() => {
    document.title = `${boardName.name} · Playbook`
  }, [boardName.name])
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
  const matches = useCallback((task: FilterableTask) => matchesFilters(task, filters, today), [filters, today])
  const { idsFor } = team
  const filter = useMemo(
    () => (filtering ? (task: Task) => matches({ ...task, assigneeIds: idsFor(task.id) }) : null),
    [filtering, matches, idsFor],
  )

  // A shared link may name members that don't exist here (or were removed): drop them.
  const { pruneAssignees } = filtersApi
  useEffect(() => {
    if (team.phase === 'ready') pruneAssignees(new Set(team.members.map((m) => m.id)))
  }, [team.phase, team.members, pruneAssignees])

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
  // Four zeros on a first run are noise; the hero explains the empty board instead.
  const showStats = board.phase !== 'error' && (!ready || board.tasks.length > 0)

  // Create, then attach assignees once the row exists (the FK needs it). A task created
  // while filtering may not match: say so instead of letting it vanish.
  const createTask = async (input: NewTask, memberIds: string[] = []) => {
    const id = input.id ?? crypto.randomUUID()
    await board.createTask({ ...input, id })
    if (memberIds.length > 0) {
      try {
        await team.assignMany(id, memberIds)
      } catch (err) {
        toast.error('Task created, but assigning people failed', { description: describeError(err) })
      }
    }
    const candidate = { priority: 'normal' as const, due_date: null, ...input, assigneeIds: memberIds }
    if (filtering && !matches(candidate)) {
      const label = COLUMNS.find((c) => c.status === input.status)?.label ?? input.status
      toast(`Added to ${label}, hidden by your filters`, {
        action: { label: 'Clear filters', onClick: filtersApi.clear },
      })
    }
  }

  const loadSample = async () => {
    const saved = await board.loadSampleBoard()
    try {
      await team.seedSample(saved, SAMPLE_TEAM)
    } catch (err) {
      toast.error("Sample tasks added, but the sample team couldn't be created", { description: describeError(err) })
    }
  }

  // Clear board: tasks first (assignments + activity cascade in the DB), then the team if asked.
  // A failure deleting tasks rejects (the dialog shows it); a failure on the team step after
  // the tasks are gone is reported separately, so the dialog never claims nothing happened.
  const clearBoard = async (alsoTeam: boolean) => {
    const deleted = await board.clearBoard()
    team.forgetAssignments()
    setOpenTaskId(null)
    setMobileTab('todo')
    filtersApi.clear()
    let membersRemoved = 0
    if (alsoTeam) {
      try {
        membersRemoved = await team.clearMembers()
      } catch (err) {
        toast.error("Board cleared, but team members couldn't be removed", { description: describeError(err) })
      }
    }
    const what = `${deleted} ${deleted === 1 ? 'task' : 'tasks'}${membersRemoved ? ` and ${membersRemoved} ${membersRemoved === 1 ? 'person' : 'people'}` : ''}`
    toast.success(`Cleared ${what}`)
  }

  const toggleAssignee = (taskId: string, memberId: string, selected: boolean) =>
    selected ? team.assign(taskId, memberId) : team.unassign(taskId, memberId)

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
        mobileTitle={
          isMobile ? (
            <EditableBoardTitle
              name={boardName.name}
              loaded={boardName.loaded}
              onRename={boardName.rename}
              size="compact"
            />
          ) : null
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setTeamOpen(true)}
              aria-label={`Team (${team.members.length} ${team.members.length === 1 ? 'person' : 'people'})`}
              className="inline-flex h-7 items-center gap-2 rounded-full border border-border px-2 text-xs font-medium text-muted transition-colors duration-150 ease-out hover:border-border-strong hover:text-text"
            >
              {team.members.length > 0 ? (
                <AvatarStack members={team.members} max={isMobile ? 2 : 3} size="xs" ringClass="ring-bg" />
              ) : (
                <UserIcon size={12} />
              )}
              <span className="max-sm:hidden">Team</span>
            </button>
            <Menu
              label="Board actions"
              trigger={<MoreIcon />}
              items={[
                {
                  label: 'Clear board…',
                  icon: <TrashIcon size={14} />,
                  tone: 'danger',
                  disabled: !ready || (board.tasks.length === 0 && team.members.length === 0),
                  onSelect: () => setClearOpen(true),
                },
              ]}
            />
            <ThemeToggle preference={theme.preference} onCycle={theme.cycle} />
          </>
        }
      />

      {/* isolate: the ambient layer's -z-10 stays inside this box (behind the board, not the page). */}
      <div className="relative isolate flex min-h-0 flex-1 flex-col">
        <AmbientBackground />
        <main className="mx-auto flex min-h-0 w-full max-w-[88rem] flex-1 flex-col">
          {isMobile ? (
            <div className="flex flex-col gap-3 px-4 pt-3">
              {showStats && <StatsLine stats={stats} />}
              {showFilters && (
                <FilterBar api={filtersApi} members={team.members} counts={filterCounts} layout="mobile" />
              )}
              <MobileTabs active={mobileTab} counts={counts} onChange={setMobileTab} />
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-x-6 gap-y-4 px-6 pt-6 pb-4">
              <div className="mr-auto min-w-0">
                <EditableBoardTitle name={boardName.name} loaded={boardName.loaded} onRename={boardName.rename} />
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  <LockIcon size={12} className="text-subtle" />
                  Private to this browser
                </p>
              </div>
              {/* Below lg the stats take their own full-width row under the title. */}
              {showStats && (
                <StatsBar stats={stats} className="order-last w-full lg:order-none lg:w-auto" />
              )}
              <Button variant="primary" leadingIcon={<PlusIcon />} onClick={() => setNewTaskOpen(true)} disabled={!ready}>
                New task
              </Button>
              {showFilters && (
                <div className="order-last w-full">
                  <FilterBar api={filtersApi} members={team.members} counts={filterCounts} layout="desktop" />
                </div>
              )}
            </div>
          )}

          {noMatches && (
            <div role="status" className="mx-4 mb-3 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm sm:mx-6">
              <span className="font-display text-xl text-text">
                No <em className="italic">matches</em>
              </span>
              <span className="text-sm text-muted max-sm:hidden">Try a different search, or clear the filters.</span>
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
            createTask={(input) => createTask(input)}
            assigneesFor={team.membersFor}
            overlay={
              ready && board.tasks.length === 0 ? (
                <EmptyBoard onNewTask={() => setNewTaskOpen(true)} onLoadSample={loadSample} />
              ) : undefined
            }
          />
        </main>
      </div>

      {/* Mobile: New task is a floating button, clear of the home indicator. */}
      <button
        type="button"
        aria-label="New task"
        onClick={() => setNewTaskOpen(true)}
        disabled={!ready}
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 flex size-14 items-center justify-center rounded-full bg-linear-to-br from-grad-1 via-grad-2 to-grad-3 text-on-accent shadow-cta-hover transition-transform duration-150 ease-out active:scale-95 disabled:opacity-50 sm:hidden"
      >
        <PlusIcon size={22} />
      </button>

      <NewTaskDialog
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreate={createTask}
        members={team.members}
        onAddMember={(name) => team.addMember(name)}
        defaultStatus={isMobile ? mobileTab : 'todo'}
      />

      <TaskPanel
        task={openTask}
        onClose={() => setOpenTaskId(null)}
        onUpdate={board.updateTask}
        onMove={(id, status) => board.moveTask(id, status, 0, { notify: false })}
        onDelete={board.deleteTask}
        members={team.members}
        assigneeIds={openTask ? team.idsFor(openTask.id) : []}
        onToggleAssignee={toggleAssignee}
        onAddMember={(name) => team.addMember(name)}
        teamVersion={team.version}
      />

      <TeamDialog open={teamOpen} onClose={() => setTeamOpen(false)} team={team} />

      <ClearBoardDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        taskCount={board.tasks.length}
        memberCount={team.members.length}
        onConfirm={clearBoard}
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
