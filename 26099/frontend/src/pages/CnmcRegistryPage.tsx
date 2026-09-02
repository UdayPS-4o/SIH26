import { useState, useMemo } from 'react'
import { CNMC_REGISTRY, CnmcEntry } from '@/demo/data'
import { Hash, Search, ChevronRight, Building2, TrendingUp, Copy, Tag, BookOpen, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const FAMILIES = ['All', ...Array.from(new Set(CNMC_REGISTRY.map(e => e.family)))]

const ORG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  IOCL: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30' },
  NTPC: { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/30' },
  SAIL: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  CIL:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
}

export default function CnmcRegistryPage() {
  const [search, setSearch] = useState('')
  const [family, setFamily] = useState('All')
  const [selected, setSelected] = useState<CnmcEntry>(CNMC_REGISTRY[0])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return CNMC_REGISTRY.filter(e => {
      const matchFamily = family === 'All' || e.family === family
      const matchSearch = !q || e.cnmcCode.toLowerCase().includes(q)
        || e.standardDesc.toLowerCase().includes(q)
        || e.family.toLowerCase().includes(q)
        || e.legacyMappings.some(m => m.code.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q))
      return matchFamily && matchSearch
    })
  }, [search, family])

  const totalSavings = CNMC_REGISTRY.reduce((s, e) => s + e.estSavingsLakh, 0)
  const totalMappings = CNMC_REGISTRY.reduce((s, e) => s + e.legacyMappings.length, 0)

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success('Copied!') }

  return (
    <div className="h-full flex flex-col bg-dark-950 overflow-hidden select-none">
      {/* Sub-header */}
      <div className="h-12 border-b border-dark-700 bg-dark-900/60 px-6 flex items-center gap-3 shrink-0">
        <Hash size={15} className="text-indigo-400" />
        <span className="text-xs font-semibold text-white">CNMC Registry</span>
        <span className="text-dark-500 text-xs">—</span>
        <span className="text-xs text-dark-400">Common National Material Code directory — approved golden records with legacy CPSE mappings</span>
        <div className="ml-auto flex items-center gap-4 text-[10px] font-mono text-dark-500">
          <span><span className="text-white font-bold">{CNMC_REGISTRY.length}</span> Codes</span>
          <span><span className="text-white font-bold">{totalMappings}</span> Legacy Mappings</span>
          <span><span className="text-emerald-400 font-bold">₹{totalSavings.toFixed(1)}L</span> Est. Savings</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: list */}
        <div className="w-80 shrink-0 border-r border-dark-700 flex flex-col bg-dark-900/30">
          {/* Search + filter */}
          <div className="p-3 border-b border-dark-700/60 space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search code, description, material..."
                className="w-full pl-8 pr-4 py-2 bg-dark-850 border border-dark-700 rounded-lg text-[11px] text-white placeholder-dark-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {FAMILIES.map(f => (
                <button
                  key={f}
                  onClick={() => setFamily(f)}
                  className={`px-2 py-0.5 rounded text-[9px] font-medium border transition-all ${
                    family === f
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                      : 'text-dark-400 border-dark-700 hover:text-white hover:border-dark-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-dark-700/40">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-dark-500 text-xs gap-1">
                <Hash size={16} />No matching codes
              </div>
            ) : filtered.map(entry => (
              <button
                key={entry.cnmcCode}
                onClick={() => setSelected(entry)}
                className={`w-full text-left px-4 py-3 transition-all ${
                  selected.cnmcCode === entry.cnmcCode
                    ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500'
                    : 'hover:bg-dark-900/60 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-indigo-300 font-bold">{entry.cnmcCode}</span>
                  <span className="text-[9px] text-dark-500 font-mono">{entry.crossCpeCount} CPSEs</span>
                </div>
                <p className="text-[11px] text-dark-300 line-clamp-2 leading-snug">{entry.standardDesc}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700 text-dark-400 font-mono">{entry.family}</span>
                  <span className="text-[9px] text-emerald-400 font-mono">₹{entry.estSavingsLakh}L</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Code header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <Hash size={18} className="text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-white">{selected.cnmcCode}</span>
                    <button onClick={() => copy(selected.cnmcCode)} className="text-dark-500 hover:text-white transition">
                      <Copy size={12} />
                    </button>
                  </div>
                  <span className="text-xs text-indigo-400 font-mono">{selected.family}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                <CheckCircle2 size={10} />APPROVED
              </span>
            </div>
          </div>

          {/* Standard description */}
          <div className="bg-dark-900 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-[10px] font-mono text-dark-500 uppercase tracking-wider mb-2">Standard Golden Description</p>
            <p className="font-mono text-sm text-white leading-relaxed">{selected.standardDesc}</p>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Tag,        label: 'UNSPSC Code',   value: selected.unspscCode, sub: selected.unspscLabel, color: 'text-blue-400' },
              { icon: BookOpen,   label: 'Indian Standard', value: selected.standardRef, sub: 'Reference Standard', color: 'text-amber-400' },
              { icon: Hash,       label: 'Unit of Measure', value: selected.uom, sub: 'Normalized UOM', color: 'text-purple-400' },
              { icon: TrendingUp, label: 'Est. Savings',    value: `₹${selected.estSavingsLakh} Lakh`, sub: 'Annual procurement', color: 'text-emerald-400' },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="bg-dark-900/60 border border-dark-700/60 rounded-xl p-3.5 flex items-start gap-3">
                <Icon size={15} className={`${color} mt-0.5 shrink-0`} />
                <div>
                  <p className="text-[9px] font-mono text-dark-500 uppercase tracking-wider">{label}</p>
                  <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-[10px] text-dark-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Legacy mappings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={14} className="text-dark-400" />
              <span className="text-xs font-semibold text-white">Legacy CPSE Code Mappings ({selected.legacyMappings.length})</span>
            </div>
            <div className="space-y-2">
              {selected.legacyMappings.map(m => {
                const c = ORG_COLORS[m.org] ?? { bg: 'bg-dark-800', text: 'text-dark-300', border: 'border-dark-700' }
                return (
                  <div key={m.code} className={`flex items-center gap-4 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                    <span className={`text-[10px] font-bold font-mono ${c.text} w-10 shrink-0`}>{m.org}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-semibold ${c.text}`}>{m.code}</span>
                        <button onClick={() => copy(m.code)} className="text-dark-500 hover:text-white transition shrink-0">
                          <Copy size={10} />
                        </button>
                      </div>
                      <p className="text-[11px] text-dark-400 truncate">{m.desc}</p>
                    </div>
                    <ChevronRight size={12} className="text-dark-600 shrink-0" />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Audit info */}
          <div className="bg-dark-900/40 border border-dark-700/60 rounded-xl p-3">
            <p className="text-[9px] font-mono text-dark-500 uppercase tracking-wider mb-2">Approval Record</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-dark-500">Approved At</span>
                <span className="font-mono text-dark-300">{selected.approvedAt}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-dark-500">Approved By</span>
                <span className="font-mono text-dark-300">{selected.approvedBy}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-dark-500">Cross-CPSE Matches</span>
                <span className="font-mono text-emerald-400">{selected.crossCpeCount} organizations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
