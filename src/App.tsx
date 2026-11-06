import { FullScreenError, FullScreenLoading } from './components/FullScreenState'
import { Button } from './components/ui/Button'
import { useAuth } from './features/auth/useAuth'
import { BoardScreen } from './features/board/BoardScreen'

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

  // key: a different guest gets a fresh board state.
  return <BoardScreen key={auth.user.id} userId={auth.user.id} />
}

export default App
