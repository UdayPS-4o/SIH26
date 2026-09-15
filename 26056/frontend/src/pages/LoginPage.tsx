import { useState, type FormEvent } from 'react'
import { Lock, User } from '@phosphor-icons/react'
import { Panel, Button, Badge, Callout } from '@/ds'
import { useAuth, type Role } from '@/contexts/AuthContext'

const ROLE_HINTS: Record<Role, { label: string; tone: 'accent' | 'good' | 'warn' }> = {
  admin:   { label: 'Full access',   tone: 'accent' },
  analyst: { label: 'Read / Write', tone: 'good' },
  viewer:  { label: 'Read only',    tone: 'warn' },
}

const DEMO_ACCOUNTS = [
  { username: 'admin',   password: 'admin123',    role: 'admin'   as Role },
  { username: 'analyst', password: 'analyst123',  role: 'analyst' as Role },
  { username: 'viewer',  password: 'viewer123',   role: 'viewer'  as Role },
]

export function LoginPage() {
  const { login, error, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login(username, password)
  }

  const matchedRole = username
    ? DEMO_ACCOUNTS.find((a) => a.username === username)?.role ?? null
    : null

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--vm-bg)] px-4">
      <div className="w-full max-w-[420px]">
        {/* Brand mark */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-control bg-accent font-display text-[22px] font-bold text-accent-ink shadow-panel">
            V
          </span>
          <div className="text-center">
            <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
              VIMAAN
            </h1>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
              MoSPI · PS 26056
            </p>
          </div>
        </div>

        {/* Login card */}
        <Panel
          title="Sign in"
          tone="neutral"
          footnote="Demo credentials shown below"
        >
          {error && (
            <Callout tone="critical" title="Sign in failed">
              {error}
            </Callout>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                <User size={11} weight="bold" />
                Username
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
                className="h-9 w-full rounded-control bg-surface-2 px-2.5 text-[13px] text-ink placeholder:text-ink-3
                           ring-1 ring-line transition-colors duration-[var(--vm-dur-fast)]
                           hover:bg-surface-3 focus:outline-none focus:ring-accent-line"
              />
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                <Lock size={11} weight="bold" />
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-9 w-full rounded-control bg-surface-2 px-2.5 text-[13px] text-ink placeholder:text-ink-3
                           ring-1 ring-line transition-colors duration-[var(--vm-dur-fast)]
                           hover:bg-surface-3 focus:outline-none focus:ring-accent-line"
              />
            </label>

            {/* Role preview */}
            {matchedRole && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  Role
                </span>
                <Badge tone={ROLE_HINTS[matchedRole].tone}>
                  {matchedRole} · {ROLE_HINTS[matchedRole].label}
                </Badge>
              </div>
            )}

            {/* Submit */}
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Panel>

        {/* Demo credentials hint */}
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Demo accounts
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {DEMO_ACCOUNTS.map((acct) => (
              <span
                key={acct.username}
                className="rounded-chip bg-surface-2 px-2 py-1 text-[11px] text-ink-3 ring-1 ring-line"
              >
                <span className="font-medium text-ink-2">{acct.username}</span>
                <span className="mx-1 text-ink-3">/</span>
                <span className="vm-num">{acct.password}</span>
                <span className="ml-1.5 text-ink-3">
                  <Badge tone={ROLE_HINTS[acct.role].tone}>{acct.role}</Badge>
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Compliance note */}
        <p className="mt-5 text-center text-[10.5px] leading-relaxed text-ink-3">
          VIMAAN is an indicative fare-price index. Figures are derived from public
          portal quotes and do not constitute official pricing. Backend unavailable?
          Demo login activates automatically.
        </p>
      </div>
    </div>
  )
}
