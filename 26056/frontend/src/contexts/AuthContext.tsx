import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/* ==========================================================================
   Types
   ========================================================================== */

export type Role = 'admin' | 'analyst' | 'viewer'

export interface User {
  username: string
  role: Role
  token: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = 'http://localhost:8000/api/v1'
const STORAGE_KEY = 'vimaan.auth'

/* ==========================================================================
   Mock credentials for demo / offline fallback
   ========================================================================== */

const DEMO_CREDENTIALS: Record<string, { password: string; role: Role }> = {
  admin:     { password: 'admin123',    role: 'admin' },
  analyst:   { password: 'analyst123',  role: 'analyst' },
  viewer:    { password: 'viewer123',   role: 'viewer' },
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function storeUser(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY)
}

/* ==========================================================================
   Provider
   ========================================================================== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (!user && location.pathname !== '/login') {
      navigate('/login', { replace: true })
    }
  }, [user, location.pathname, navigate])

  // Redirect authenticated users away from /login
  useEffect(() => {
    if (user && location.pathname === '/login') {
      navigate('/', { replace: true })
    }
  }, [user, location.pathname, navigate])

  const login = useCallback(async (username: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      let authUser: User | null = null

      // Attempt real backend first
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || `Login failed (${res.status})`)
        }

        const data = (await res.json()) as { access_token: string; username: string; role: string }
        authUser = {
          username: data.username,
          role: data.role as Role,
          token: data.access_token,
        }
      } catch (networkErr) {
        // Backend unavailable — fall back to mock
        const cred = DEMO_CREDENTIALS[username]
        if (!cred || cred.password !== password) {
          throw new Error('Invalid credentials. Use one of the demo accounts shown below.')
        }
        authUser = {
          username,
          role: cred.role,
          token: `mock-jwt-${Date.now()}`,
        }
      }

      if (!authUser) throw new Error('Login failed')

      setUser(authUser)
      storeUser(authUser)
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const logout = useCallback(() => {
    setUser(null)
    clearStoredUser()
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
      error,
      loading,
    }),
    [user, login, logout, error, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ==========================================================================
   Hook
   ========================================================================== */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/* ==========================================================================
   ProtectedRoute
   ========================================================================== */

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-[13px] text-ink-3">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Already handled by AuthProvider redirect, but render nothing here
    return null
  }

  return <>{children}</>
}
