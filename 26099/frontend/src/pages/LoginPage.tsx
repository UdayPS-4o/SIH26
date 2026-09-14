/**
 * Login, route /login.
 *
 * A fake enterprise login. Any input works — the point is the look, not the gate.
 * Stores the chosen role and name in sessionStorage so the rest of the console
 * can read them.
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock } from '@phosphor-icons/react'

import { Button } from '@/components/ui'
import { useRole } from '@/store/role'
import { useService } from '@/store/service'

export default function LoginPage() {
  const navigate = useNavigate()
  const role = useRole()
  const service = useService()
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'reviewer'>('admin')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const displayName = name.trim() || 'Steward'
    role.setName(displayName)
    role.setRole(selectedRole)
    service.bootstrap()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-[28px] font-bold text-ink">CodeOne</h1>
          <p className="mt-2 text-[14px] text-ink-2">National Unified Material Master</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="relative">
            <User size={16} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-lg border border-rule-strong bg-surface pl-9 pr-3 py-1.5 text-[13px] text-ink placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-ink">Sign in as</label>
            <div className="grid grid-cols-2 gap-2">
              {(['reviewer', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`
                    rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors
                    ${selectedRole === r
                      ? 'border-primary bg-primary-bg text-accent'
                      : 'border-rule bg-surface text-ink-2 hover:bg-surface-hover'}
                  `}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" icon={<Lock size={16} />}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-ink-3">
          Demo mode — any input works. Your choice is kept in this browser only.
        </p>
      </div>
    </div>
  )
}
