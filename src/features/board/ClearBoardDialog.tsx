import { useState } from 'react'
import { AlertIcon, CloseIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { IconButton } from '../../components/ui/IconButton'
import { describeError } from '../../lib/errors'

type ClearBoardDialogProps = {
  open: boolean
  onClose: () => void
  taskCount: number
  memberCount: number
  /** Deletes the tasks, then (optionally) the team. Rejects on failure. */
  onConfirm: (alsoTeam: boolean) => Promise<void>
}

export function ClearBoardDialog(props: ClearBoardDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} labelledBy="clear-board-title">
      <ClearBoardForm {...props} />
    </Dialog>
  )
}

function ClearBoardForm({ onClose, taskCount, memberCount, onConfirm }: ClearBoardDialogProps) {
  const [alsoTeam, setAlsoTeam] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm(alsoTeam)
      onClose()
    } catch (err) {
      setError(describeError(err))
      setBusy(false)
    }
  }

  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

  return (
    <div>
      <header className="flex items-start justify-between gap-4 px-6 pt-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertIcon size={20} />
          </span>
          <div>
            <h2 id="clear-board-title" className="font-display text-display text-text">
              Clear the <em className="italic">board</em>?
            </h2>
            <p className="mt-2 text-sm text-muted">
              This permanently deletes {plural(taskCount, 'task')}, along with their assignments and activity
              history. It can't be undone.
            </p>
          </div>
        </div>
        <IconButton label="Close" icon={<CloseIcon />} onClick={onClose} disabled={busy} />
      </header>

      <div className="px-6 pt-4">
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3 text-sm text-text has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
          <input
            type="checkbox"
            checked={alsoTeam}
            onChange={(e) => setAlsoTeam(e.target.checked)}
            disabled={memberCount === 0 || busy}
            className="mt-0.5 size-4 accent-[var(--color-danger)]"
          />
          <span>
            Also remove team members
            <span className="block text-xs text-muted">
              {memberCount === 0 ? 'No team members to remove.' : `${plural(memberCount, 'person', 'people')} on your roster.`}
            </span>
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Couldn't clear the board. {error}
          </p>
        )}
      </div>

      <footer className="mt-6 flex justify-end gap-2 border-t border-border px-6 py-4">
        {/* Destructive dialog: focus starts on the safe choice. */}
        <Button variant="ghost" onClick={onClose} disabled={busy} data-autofocus>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirm} loading={busy}>
          {alsoTeam ? 'Clear board and team' : 'Clear board'}
        </Button>
      </footer>
    </div>
  )
}
