export type Env = { url: string; anonKey: string }

export type EnvResult = { ok: true; env: Env } | { ok: false; missing: string[] }

/** Read and validate the public Supabase config baked in at build time. */
export function readEnv(): EnvResult {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

  if (url && anonKey) return { ok: true, env: { url, anonKey } }

  const missing: string[] = []
  if (!url) missing.push('VITE_SUPABASE_URL')
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  return { ok: false, missing }
}
