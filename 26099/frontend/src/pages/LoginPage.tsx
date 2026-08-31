import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Lock, User } from 'lucide-react'

export default function LoginPage({ onLogin }: { onLogin?: () => void }) {
  const [username, setUsername] = useState('officer@nummf.gov.in')
  const [password, setPassword] = useState('••••••••••••')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    if (onLogin) {
      onLogin()
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-dark-950 relative overflow-hidden select-none">
      {/* Background glow and subtle cyber grid */}
      <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="w-full max-w-md p-6 relative z-10">
        {/* Emblem & Branding */}
        <div className="text-center mb-8 space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl shadow-blue-500/25 ring-2 ring-white/20">
            N
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wider">NUMMF</h1>
            <p className="text-xs text-primary-400 font-mono font-medium">National Unified Material Master Framework</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-850 border border-dark-700 text-[10px] font-mono text-dark-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Smart India Hackathon 2026 · PS #26099</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6 rounded-2xl border border-dark-700 bg-dark-900/90 shadow-2xl space-y-5">
          <div className="border-b border-dark-700 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">CPSE Officer Portal</h2>
            <p className="text-xs text-dark-400">Authorized personnel access for AI Material Harmonization</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-mono text-dark-400 uppercase tracking-wider block mb-1.5">
                Official Government ID / Email
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-xs text-white placeholder-dark-500 focus:border-blue-500 outline-none transition"
                  placeholder="name@cpse.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-dark-400 uppercase tracking-wider block mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-xs text-white placeholder-dark-500 focus:border-blue-500 outline-none transition font-mono"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING CPSE SESSION...</span>
                </>
              ) : (
                <>
                  <span>LAUNCH HARMONIZATION DASHBOARD</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[10px] text-dark-500 font-mono">
              Connected to 4 CPSE ERP nodes: IOCL, NTPC, SAIL, CIL
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
