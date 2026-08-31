import { useState, useMemo } from 'react'
import { useDemoEngine } from '@/store/demo'
import { ArrowRight, Check, X, Search, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const CONFIDENCE_FILTERS = ['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const

export default function MatchingPage() {
  const { matches, approveMatch, rejectMatch } = useDemoEngine()
  const [filter, setFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (filter !== 'ALL' && m.confidence !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          m.sourceCode.toLowerCase().includes(q) ||
          m.targetCode.toLowerCase().includes(q) ||
          m.sourceDesc.toLowerCase().includes(q) ||
          m.targetDesc.toLowerCase().includes(q) ||
          m.cnmcCode.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [matches, filter, search])

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied "${text}"`)
  }

  return (
    <div className="h-full flex flex-col bg-dark-950 p-6 space-y-4 overflow-hidden select-none">
      {/* Header Controls */}
      <div className="glass-card p-4 rounded-xl border border-dark-700 bg-dark-900/80 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search AI candidate pairs by code, specification, or CNMC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-850 border border-dark-700 rounded-lg text-xs text-white placeholder-dark-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Confidence Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-dark-400 mr-1 font-mono">CONFIDENCE:</span>
          {CONFIDENCE_FILTERS.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                filter === c
                  ? c === 'HIGH' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : c === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : c === 'LOW' ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'bg-dark-850 text-dark-400 hover:text-white border border-dark-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Matching Matrix Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div
              key={m.id}
              className="glass-card p-4 rounded-xl border border-dark-700 bg-dark-900/80 flex flex-col justify-between space-y-3 hover:border-dark-600 transition"
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700 text-dark-400 font-mono text-[10px]">
                    ID: {m.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      m.confidence === 'HIGH' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      m.confidence === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                      'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>
                      {m.confidence}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[10px]">
                      {m.type}
                    </span>
                  </div>
                </div>

                {/* CPSE Material 1 vs Material 2 */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700/80">
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-blue-400 font-bold">{m.sourceOrg}</span>
                      <span className="text-white font-semibold">{m.sourceCode}</span>
                    </div>
                    <p className="text-dark-300 line-clamp-2">{m.sourceDesc}</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-400">
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700/80">
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-purple-400 font-bold">{m.targetOrg}</span>
                      <span className="text-white font-semibold">{m.targetCode}</span>
                    </div>
                    <p className="text-dark-300 line-clamp-2">{m.targetDesc}</p>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="mt-3 p-2.5 rounded-lg bg-dark-850/60 border border-dark-700/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-dark-400">Combined Similarity</span>
                    <span className="text-white font-bold text-sm">{(m.score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full"
                      style={{ width: `${m.score * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono text-center text-dark-400">
                    <div>Sem: <span className="text-purple-400 font-semibold">{((m.semanticScore || 0.95) * 100).toFixed(0)}%</span></div>
                    <div>Lex: <span className="text-blue-400 font-semibold">{((m.lexicalScore || 0.92) * 100).toFixed(0)}%</span></div>
                    <div>Num: <span className="text-emerald-400 font-semibold">{((m.numericScore || 0.98) * 100).toFixed(0)}%</span></div>
                  </div>
                </div>
              </div>

              {/* Bottom CNMC & Action row */}
              <div className="pt-3 border-t border-dark-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                    {m.cnmcCode}
                  </span>
                  <button
                    onClick={() => copyCode(m.cnmcCode)}
                    className="p-1 text-dark-400 hover:text-white transition"
                    title="Copy CNMC"
                  >
                    <Copy size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      rejectMatch(m.id)
                      toast.error(`Rejected ${m.id}`)
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                    title="Reject"
                  >
                    <X size={13} />
                  </button>
                  <button
                    onClick={() => {
                      approveMatch(m.id)
                      toast.success(`Approved ${m.id} to CNMC catalog`)
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold font-mono transition flex items-center gap-1"
                  >
                    <Check size={13} />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
