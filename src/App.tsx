import { AppHeader } from './components/AppHeader'
import { FullScreenError, FullScreenLoading } from './components/FullScreenState'
import { PlusIcon } from './components/icons'
import { Button } from './components/ui/Button'
import { useAuth } from './features/auth/useAuth'
import { Board } from './features/board/Board'

function App() {
  const auth = useAuth()

  if (auth.status === 'loading') {
    return <FullScreenLoading label="Starting your guest session…" />
  }

  if (auth.status === 'error') {
    return (
      <FullScreenError
        title="Couldn't start your session"
        description={auth.message}
        action={
          <Button variant="primary" onClick={auth.retry}>
            Try again
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader userId={auth.user.id} />

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

        <Board />
      </main>
    </div>
  )
}

export default App
