import { useState, useMemo } from 'react'
import { useDemoEngine } from '@/store/demo'
import { CheckCheck, XCircle, Check, FileCheck2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const

export default function ReviewsPage() {
  const { matches, approveMatch, rejectMatch, batchApprove, batchReject } = useDemoEngine()
  const [activeTab, setActiveTab] = useState<string>('PENDING')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return matches.filter(m => {
      if (activeTab === 'ALL') return true
      return m.status.toUpperCase() === activeTab
    })
  }, [matches, activeTab])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(m => m.id)))
    }
  }

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    batchApprove(ids)
    toast.success(`Batch approved ${ids.length} proposals to CNMC Master Catalogue`)
    setSelectedIds(new Set())
  }

  const handleBatchReject = () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    batchReject(ids)
    toast.error(`Batch rejected ${ids.length} proposals`)
    setSelectedIds(new Set())
  }

  return (
    <div className="h-full flex flex-col bg-dark-950 p-6 space-y-4 overflow-hidden select-none">
      {/* Action Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-dark-700 bg-dark-900/80 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2">
          {STATUS_TABS.map(tab => {
            const count = tab === 'ALL' ? matches.length : matches.filter(m => m.status.toUpperCase() === tab).length
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                  activeTab === tab
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
                    : 'bg-dark-850 text-dark-400 hover:text-white border border-dark-700'
                }`}
              >
                <span>{tab}</span>
                <span className="px-1.5 py-0.2 rounded bg-dark-800 text-[10px] text-dark-300">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Batch Operations */}
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-xs font-medium text-dark-300 hover:text-white transition"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? 'Deselect All' : `Select All (${filtered.length})`}
          </button>

          <button
            onClick={handleBatchReject}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition disabled:opacity-40"
          >
            <XCircle size={14} />
            <span>Reject ({selectedIds.size})</span>
          </button>

          <button
            onClick={handleBatchApprove}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition shadow-md shadow-emerald-500/10 disabled:opacity-40"
          >
            <CheckCheck size={14} />
            <span>Batch Approve ({selectedIds.size})</span>
          </button>
        </div>
      </div>

      {/* Review Queue Items List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 rounded-xl border border-dark-700 bg-dark-900/50 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-400">
              <FileCheck2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No Proposals in Queue</h3>
              <p className="text-xs text-dark-400 mt-1">All material harmonization candidate pairs have been reviewed.</p>
            </div>
          </div>
        ) : (
          filtered.map(m => {
            const isSelected = selectedIds.has(m.id)
            return (
              <div
                key={m.id}
                className={`glass-card p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-500/60 bg-blue-950/20 ring-1 ring-blue-500/30'
                    : 'border-dark-700 bg-dark-900/80 hover:border-dark-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => toggleSelect(m.id)}
                    className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                    }`}
                  >
                    {isSelected && <Check size={13} />}
                  </div>

                  {/* Pair Details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">PROPOSAL: {m.id}</span>
                        <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700 text-dark-300 text-[10px] font-mono">
                          {m.family}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-mono">
                          {m.isStandard}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          m.confidence === 'HIGH' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          m.confidence === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                          'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}>
                          {m.confidence} ({((m.score) * 100).toFixed(0)}%)
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          m.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                          m.status === 'rejected' ? 'bg-red-500/15 text-red-300 border border-red-500/30' :
                          'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Side-by-side comparison boxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-dark-850 border border-dark-700/80 space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-blue-400 font-bold">{m.sourceOrg} Material Master</span>
                          <span className="text-white font-semibold">{m.sourceCode}</span>
                        </div>
                        <p className="text-dark-200">{m.sourceDesc}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-dark-850 border border-dark-700/80 space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-purple-400 font-bold">{m.targetOrg} Material Master</span>
                          <span className="text-white font-semibold">{m.targetCode}</span>
                        </div>
                        <p className="text-dark-200">{m.targetDesc}</p>
                      </div>
                    </div>

                    {/* Suggested CNMC & Quick Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark-400 font-mono">Proposed CNMC Code:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                          {m.cnmcCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            rejectMatch(m.id)
                            toast.error(`Rejected ${m.id}`)
                          }}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            approveMatch(m.id)
                            toast.success(`Approved ${m.id} to CNMC Catalogue`)
                          }}
                          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Check size={12} />
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
