import { useState, type FormEvent } from 'react'
import { CloseIcon, TrashIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { controlClass } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { cx } from '../../lib/cx'
import { describeError } from '../../lib/errors'
import { Avatar } from './Avatar'
import { AVATAR_FILL, COLOR_LABEL } from './colors'
import { MEMBER_COLORS, MEMBER_NAME_MAX_LENGTH, type TeamMember } from './types'
import type { Team } from './useTeam'

export function TeamDialog({ open, onClose, team }: { open: boolean; onClose: () => void; team: Team }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="team-dialog-title">
      <TeamManager team={team} onClose={onClose} />
    </Dialog>
  )
}

function TeamManager({ team, onClose }: { team: Team; onClose: () => void }) {
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setAdding(true)
    setError(null)
    try {
      await team.addMember(trimmed)
      setName('')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 id="team-dialog-title" className="font-display text-display text-text">
            Your <em className="italic">team</em>
          </h2>
          <p className="mt-1 text-sm text-muted">
            People you can assign tasks to. They're names, not accounts, and private to this browser.
          </p>
        </div>
        <IconButton label="Close" icon={<CloseIcon />} onClick={onClose} className="self-start" />
      </header>

      <div className="px-6 py-4">
        {team.phase === 'error' && (
          <p role="alert" className="mb-3 text-sm text-danger">
            Couldn't load your team. {team.error}{' '}
            <button type="button" onClick={() => void team.reload()} className="font-medium underline">
              Try again
            </button>
          </p>
        )}

        {team.members.length === 0 && team.phase === 'ready' && (
          <p className="py-2 text-sm text-muted">No one yet. Add your first teammate below.</p>
        )}

        <ul className="flex flex-col divide-y divide-border">
          {team.members.map((member) => (
            <MemberRow key={member.id} member={member} team={team} />
          ))}
        </ul>

        <form onSubmit={add} className="mt-4 flex gap-2">
          <label htmlFor="new-member-name" className="sr-only">
            New member name
          </label>
          <input
            id="new-member-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MEMBER_NAME_MAX_LENGTH}
            placeholder="Name, e.g. Maya Chen"
            className={cx(controlClass, 'h-8 flex-1 px-3')}
          />
          <Button type="submit" variant="primary" loading={adding} disabled={!name.trim()}>
            Add
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function MemberRow({ member, team }: { member: TeamMember; team: Team }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (action: () => Promise<void>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(describeError(err))
    }
  }

  const commitName = () => {
    if (draft === null) return
    const next = draft.trim()
    setDraft(null)
    if (!next || next === member.name) return
    void run(() => team.editMember(member.id, { name: next }))
  }

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <Avatar member={{ name: draft ?? member.name, color: member.color }} size="md" decorative />
        <div className="min-w-0 flex-1">
          <label htmlFor={`member-${member.id}`} className="sr-only">
            Name
          </label>
          <input
            id={`member-${member.id}`}
            value={draft ?? member.name}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            maxLength={MEMBER_NAME_MAX_LENGTH}
            className="h-7 w-full rounded-md bg-transparent px-1 text-sm font-medium text-text hover:bg-column focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
          />
          <div role="radiogroup" aria-label={`Color for ${member.name}`} className="mt-1 flex gap-1 px-1">
            {MEMBER_COLORS.map((color) => (
              <label key={color} title={COLOR_LABEL[color]} className="cursor-pointer">
                <input
                  type="radio"
                  name={`color-${member.id}`}
                  checked={member.color === color}
                  onChange={() => void run(() => team.editMember(member.id, { color }))}
                  className="peer sr-only"
                  aria-label={COLOR_LABEL[color]}
                />
                <span
                  style={{ backgroundColor: AVATAR_FILL[color] }}
                  className="block size-4 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-text peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
                />
              </label>
            ))}
          </div>
        </div>
        {confirming ? (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Keep
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={busy}
              onClick={() => {
                setBusy(true)
                void run(() => team.removeMember(member.id)).finally(() => setBusy(false))
              }}
            >
              Remove
            </Button>
          </div>
        ) : (
          <IconButton label={`Remove ${member.name}`} icon={<TrashIcon size={14} />} onClick={() => setConfirming(true)} />
        )}
      </div>
      {confirming && (
        <p className="mt-1 pl-11 text-xs text-muted">They'll be unassigned from every task.</p>
      )}
      {error && (
        <p role="alert" className="mt-1 pl-11 text-xs text-danger">
          {error}
        </p>
      )}
    </li>
  )
}
