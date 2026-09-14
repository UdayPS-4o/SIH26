/**
 * Simple role store.
 *
 * Two roles for the demo: Admin (full access, settings) and Reviewer (view,
 * search, approve/reject, export). The selection is kept in sessionStorage so
 * it survives a page reload during a demo.
 */

import { create } from 'zustand'

export type Role = 'admin' | 'reviewer'

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  reviewer: 'Reviewer',
}

const ROLE_KEY = 'codeone.role'
const NAME_KEY = 'codeone.name'

function readRole(): Role {
  try {
    const stored = sessionStorage.getItem(ROLE_KEY)
    if (stored && stored in ROLE_LABEL) return stored as Role
  } catch {
    /* storage unavailable */
  }
  return 'admin'
}

function readName(): string {
  try {
    const stored = sessionStorage.getItem(NAME_KEY)
    if (stored && stored.trim()) return stored.trim()
  } catch {
    /* storage unavailable */
  }
  return 'Guest'
}

interface RoleStore {
  role: Role
  name: string
  setRole: (role: Role) => void
  setName: (name: string) => void
  isAdmin: boolean
}

export const useRole = create<RoleStore>((set, get) => ({
  role: readRole(),
  name: readName(),

  setRole: (role) => {
    try { sessionStorage.setItem(ROLE_KEY, role) } catch { /* */ }
    set({ role })
  },

  setName: (name) => {
    try { sessionStorage.setItem(NAME_KEY, name) } catch { /* */ }
    set({ name })
  },

  get isAdmin() { return get().role === 'admin' },
}))
