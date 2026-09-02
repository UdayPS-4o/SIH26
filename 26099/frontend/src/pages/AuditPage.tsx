import { useState, useMemo } from 'react'
import { useDemoEngine, AuditEntry, AuditAction } from '@/store/demo'
import { ClipboardList, Download, Filter, CheckCircle2, XCircle, Upload, GitMerge, Cpu, ShieldCheck, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const ACTION_META: Record<AuditAction, { label: string; color: string; icon: React.ElementType }> = {
  IMPORT:        { label: 'Import',        color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 font-bold',     icon: Upload },
  NORMALIZE:     { label: 'Normalize',     color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 font-bold', icon: Cpu },
  MATCH:         { label: 'AI Match',      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20 font-bold', icon: GitMerge },
  APPROVE:       { label: 'Approve',       color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-bold', icon: CheckCircle2 },
  REJECT:        { label: 'Reject',        color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20 font-bold',         icon: XCircle },
  BATCH_APPROVE: { label: 'Batch Approve', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-bold', icon: CheckCircle2 },
  BATCH_REJECT:  { label: 'Batch Reject',  color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20 font-bold',         icon: XCircle },
  SYSTEM:        { label: 'System',        color: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20 font-bold',   icon: ShieldCheck },
}

const ORG_COLORS: Record<string, string> = {
  IOCL:  'text-blue-600 dark:text-blue-400 font-bold',
  NTPC: 'text-purple-600 dark:text-purple-400 font-bold',
  SAIL:  'text-amber-600 dark:text-amber-400 font-bold',
  CIL:  'text-emerald-600 dark:text-emerald-400 font-bold',
  NUMMF: 'text-slate-600 dark:text-slate-400 font-bold',
}

const ACTION_FILTERS: { key: AuditAction | 'ALL'; label: string }[] = [
  { key: 'ALL',         label: 'All Actions' },
  { key: 'IMPORT',      label: 'Imports' },
  { key: 'NORMALIZE',   label: 'Normalize' },
  { key: 'MATCH',       label: 'AI Match' },
  { key: 'APPROVE',     label: 'Approvals' },
  { key: 'REJECT',      label: 'Rejections' },
  { key: 'SYSTEM',      label: 'System' },
]

export default function AuditPage() {
  const { auditLog } = useDemoEngine()
  const [filterAction, setFilterAction] = useState<AuditAction | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AuditEntry | null>(null)

  const filtered = useMemo(() => {
    return auditLog.filter(e => {
      const matchAction = filterAction === 'ALL' || e.action === filterAction || (filterAction === 'APPROVE' && e.action === 'BATCH_APPROVE') || (filterAction === 'REJECT' && e.action === 'BATCH_REJECT')
      const q = search.toLowerCase()
      const matchSearch = !q || e.detail.toLowerCase().includes(q) || e.org.toLowerCase().includes(q) || (e.cnmcCode?.toLowerCase().includes(q)) || (e.materialCode?.toLowerCase().includes(q))
      return matchAction && matchSearch
    })
  }, [auditLog, filterAction, search])

  const exportCSV = () => {
    const rows = [
      ['ID', 'Timestamp', 'Action', 'User', 'Org', 'Detail', 'Match ID', 'CNMC Code', 'Material Code'],
      ...auditLog.map(e => [e.id, e.ts, e.action, e.user, e.org, e.detail, e.matchId ?? '', e.cnmcCode ?? '', e.materialCode ?? '']),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'nummf_audit_log.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit log exported as CSV')
  }

  // Stats
  const approveCount = auditLog.filter(e => e.action === 'APPROVE' || e.action === 'BATCH_APPROVE').length
  const rejectCount  = auditLog.filter(e => e.action === 'REJECT'  || e.action === 'BATCH_REJECT').length
  const importCount  = auditLog.filter(e => e.action === 'IMPORT').length

  return (
    <div className="h-full flex flex-col bg-dark-950 overflow-hidden select-none">
      {/* Sub-header */}
      <div className="h-12 border-b border-dark-700 bg-dark-900 px-6 flex items-center gap-3 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
          <ClipboardList size={14} />
        </div>
        <span className="text-xs font-bold text-dark-100">Audit Trail</span>
        <span className="text-dark-400 text-xs">—</span>
        <span className="text-xs text-dark-400">Immutable chronological log of all system and officer actions</span>
        <button
          onClick={exportCSV}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-600 font-bold rounded-xl text-xs transition cursor-pointer"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="border-b border-dark-700 bg-dark-900 px-6 py-3 flex gap-8 shrink-0">
        {[
          { label: 'Total Entries', value: auditLog.length, color: 'text-dark-100' },
          { label: 'Imports',       value: importCount,    color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Approvals',     value: approveCount,   color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Rejections',    value: rejectCount,    color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`text-base font-black font-mono ${s.color}`}>{s.value}</span>
            <span className="text-xs text-dark-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Filters sidebar */}
        <div className="w-48 shrink-0 border-r border-dark-700 bg-dark-900 flex flex-col">
          <div className="px-4 py-3 border-b border-dark-700">
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-dark-500 uppercase tracking-wider">
              <Filter size={11} />
              <span>Filter by Action</span>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {ACTION_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterAction(f.key)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterAction === f.key
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold shadow-xs'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-850 border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Log table */}
        <div className="flex-1 flex flex-col overflow-hidden bg-dark-950">
          {/* Search */}
          <div className="px-5 py-3 border-b border-dark-700 bg-dark-900 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by detail, CNMC code, material code, org..."
                className="w-full pl-9 pr-4 py-2 bg-dark-850 border border-dark-700 rounded-xl text-xs text-dark-100 placeholder-dark-400 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Table header */}
            <div className="sticky top-0 grid grid-cols-[140px_110px_110px_1fr_120px] gap-3 px-5 py-2.5 bg-dark-850 border-b border-dark-700 text-[10px] font-mono font-bold text-dark-400 uppercase tracking-wider z-10">
              <span>Timestamp</span>
              <span>Action</span>
              <span>Org / User</span>
              <span>Detail</span>
              <span>CNMC Code</span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-dark-400 text-xs gap-2">
                <ClipboardList size={24} className="text-dark-500" />
                <span className="font-medium">No matching audit entries</span>
              </div>
            ) : (
              filtered.map(entry => {
                const meta = ACTION_META[entry.action]
                const Icon = meta.icon
                const isSelected = selected?.id === entry.id
                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelected(isSelected ? null : entry)}
                    className={`grid grid-cols-[140px_110px_110px_1fr_120px] gap-3 px-5 py-3 border-b border-dark-750 cursor-pointer transition-colors text-xs items-center ${
                      isSelected ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : 'hover:bg-dark-850/60 bg-dark-900'
                    }`}
                  >
                    <span className="font-mono text-dark-400 text-[11px] truncate font-medium">{entry.ts}</span>
                    <span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono ${meta.color}`}>
                        <Icon size={11} />{meta.label}
                      </span>
                    </span>
                    <div>
                      <div className={`text-xs ${ORG_COLORS[entry.org] ?? 'text-dark-100'}`}>{entry.org}</div>
                      <div className="text-[10px] text-dark-400 truncate">{entry.user}</div>
                    </div>
                    <span className="text-dark-200 font-medium truncate text-xs">{entry.detail}</span>
                    <span>
                      {entry.cnmcCode ? (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 font-mono text-[10px] font-bold">
                          {entry.cnmcCode}
                        </span>
                      ) : (
                        <span className="font-mono text-dark-400 text-[11px]">—</span>
                      )}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 border-l border-dark-700 bg-dark-900 flex flex-col overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-dark-700 flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-dark-100 uppercase tracking-wider">Entry Detail</span>
              <button onClick={() => setSelected(null)} className="text-dark-400 hover:text-dark-100 text-xs transition cursor-pointer">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { k: 'Audit ID',       v: selected.id },
                { k: 'Timestamp',      v: selected.ts },
                { k: 'Action',         v: selected.action },
                { k: 'Performed By',   v: selected.user },
                { k: 'Organization',   v: selected.org },
                { k: 'Match ID',       v: selected.matchId ?? '—' },
                { k: 'CNMC Code',      v: selected.cnmcCode ?? '—' },
                { k: 'Material Code',  v: selected.materialCode ?? '—' },
              ].map(({ k, v }) => (
                <div key={k} className="border-b border-dark-750 pb-2">
                  <p className="text-[10px] font-mono font-bold text-dark-400 uppercase tracking-wider mb-0.5">{k}</p>
                  <p className="text-xs text-dark-100 font-mono font-bold break-all">{v}</p>
                </div>
              ))}
              <div>
                <p className="text-[10px] font-mono font-bold text-dark-400 uppercase tracking-wider mb-1">Full Detail</p>
                <p className="text-xs text-dark-200 leading-relaxed bg-dark-850 p-3 rounded-xl border border-dark-700">{selected.detail}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
