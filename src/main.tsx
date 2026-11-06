import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FullScreenError } from './components/FullScreenState'
import { readEnv } from './lib/env'
import './index.css'

const root = createRoot(document.getElementById('root')!)
const env = readEnv()

if (!env.ok) {
  root.render(
    <StrictMode>
      <FullScreenError
        title="Missing configuration"
        description={
          <>
            <p>
              Set{' '}
              {env.missing.map((name, i) => (
                <span key={name}>
                  {i > 0 && ' and '}
                  <code className="rounded-sm bg-column px-1 font-medium text-text">{name}</code>
                </span>
              ))}{' '}
              in <code className="rounded-sm bg-column px-1 font-medium text-text">.env.local</code>.
            </p>
            <p className="mt-2">Copy .env.example to get started, then restart the dev server.</p>
          </>
        }
      />
    </StrictMode>,
  )
} else {
  // Dynamic import: the Supabase client module is only evaluated with valid env.
  const { default: Root } = await import('./Root')
  root.render(
    <StrictMode>
      <Root />
    </StrictMode>,
  )
}
