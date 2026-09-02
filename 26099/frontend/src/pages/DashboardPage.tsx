import { useState, useMemo } from 'react'
import { useDemoEngine, formatNumber } from '@/store/demo'
import { 
  Sparkles, 
  Database, 
  GitMerge, 
  Cpu, 
  Hash, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Check, 
  X, 
  ShieldAlert, 
  Terminal,
  Zap,
  Search,
  Copy,
  ChevronRight,
  Users,
  FileText,
  Box,
  Share2,
  ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'overview', label: 'Executive Overview', icon: Sparkles },
  { key: 'ingest', label: 'CPSE Ingestion Feeds', icon: Database },
  { key: 'matching', label: 'AI Matching Matrix', icon: GitMerge },
  { key: 'cnmc', label: 'CNMC Code Directory', icon: Hash },
] as const

type Tab = typeof TABS[number]['key']

export default function DashboardPage() {
  const engine = useDemoEngine()
  const { phase, sources, matches, summary, logs, approveMatch, rejectMatch } = engine
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedMatch, setSelectedMatch] = useState<string | null>(matches[0]?.id || null)
  const [showLogs, setShowLogs] = useState(true)

  const totalRows = useMemo(() => sources.reduce((s, x) => s + x.rows, 0), [sources])
  const totalDups = useMemo(() => sources.reduce((s, x) => s + x.duplicates, 0), [sources])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied "${text}" to clipboard`)
  }

  return (
    <div className="h-full flex flex-col bg-dark-950 overflow-hidden select-none">
      {/* Sub-Header Navigation Tabs */}
      <div className="h-12 border-b border-dark-700 bg-dark-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {TABS.map(t => {
            const Icon = t.icon
            const isActive = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold shadow-xs'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-850 font-medium'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setShowLogs(!showLogs)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition cursor-pointer ${
            showLogs
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 font-semibold'
              : 'bg-dark-850 border-dark-700 text-dark-400 hover:text-dark-100'
          }`}
        >
          <Terminal size={13} />
          <span>Live Logs ({logs.length})</span>
        </button>
      </div>

      {/* Main Viewport & Optional Terminal Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab
              sources={sources}
              summary={summary}
              phase={phase}
              totalRows={totalRows}
              totalDups={totalDups}
              matches={matches}
            />
          )}

          {activeTab === 'ingest' && <IngestTab sources={sources} />}

          {activeTab === 'matching' && (
            <MatchingTab
              matches={matches}
              selectedMatchId={selectedMatch}
              onSelectMatch={setSelectedMatch}
              onApprove={(id: string) => {
                approveMatch(id)
                toast.success(`Match ${id} approved & harmonized into CNMC`)
              }}
              onReject={(id: string) => {
                rejectMatch(id)
                toast.error(`Match ${id} rejected`)
              }}
              onCopy={copyToClipboard}
            />
          )}

          {activeTab === 'cnmc' && <CnmcTab matches={matches} onCopy={copyToClipboard} />}
        </div>

        {/* Live Terminal Log Sidebar */}
        {showLogs && (
          <div className="w-80 border-l border-dark-700 bg-dark-900 flex flex-col shrink-0">
            <div className="h-12 border-b border-dark-700 px-5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-blue-500" />
                <span className="font-bold text-dark-100 uppercase tracking-wider">PIPELINE AUDIT LOG</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-dark-400">Auto-scrolling</span>
                <div className="w-8 h-4.5 rounded-full bg-indigo-600 p-0.5 relative transition-colors cursor-pointer">
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm translate-x-3.5" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] space-y-4 leading-relaxed bg-dark-900">
              {logs.length === 0 ? (
                <div className="text-dark-500 italic py-6 text-center">Awaiting pipeline trigger...</div>
              ) : (
                logs.map((l, i) => {
                  const isConn = l.msg.startsWith('CONN') || l.msg.startsWith('READY')
                  const isAi = l.msg.startsWith('AI') || l.msg.startsWith('CNMC')
                  const isErr = l.level === 'error' || l.msg.startsWith('ERR')
                  const isWarn = l.level === 'warn' || l.msg.startsWith('WARN')

                  return (
                    <div key={i} className="flex gap-3 items-start relative group">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isConn
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : isAi
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          : isErr
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : isWarn
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {isConn ? <CheckCircle2 size={13} /> : isAi ? <Cpu size={13} /> : <Zap size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-dark-400 mb-0.5">{l.ts}</div>
                        <p
                          className={`break-words text-xs leading-relaxed ${
                            isErr
                              ? 'text-red-500 font-semibold'
                              : isConn
                              ? 'text-emerald-500 font-medium'
                              : isWarn
                              ? 'text-amber-500 font-medium'
                              : isAi
                              ? 'text-blue-500 font-medium'
                              : 'text-dark-200'
                          }`}
                        >
                          {l.msg}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Bottom View Full Logs Button */}
            <div className="p-4 border-t border-dark-700 bg-dark-900">
              <button
                onClick={() => toast.success('Navigating to full audit log view')}
                className="w-full py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/15 text-blue-500 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FileText size={14} />
                <span>View Full Logs</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OverviewTab({ sources, summary, phase, totalRows, totalDups, matches }: any) {
  const connectedCount = sources.filter((s: any) => s.status === 'connected').length

  return (
    <div className="space-y-6">
      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connected CPSEs */}
        <div className="glass-card p-5 rounded-2xl border border-dark-700 bg-dark-900 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Users size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-dark-400 block truncate">Connected CPSEs</span>
              <div className="text-2xl font-black text-dark-100 font-mono tracking-tight mt-0.5">{connectedCount} / {sources.length}</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-500 flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={13} />
            <span>IOCL, NTPC, SAIL, CIL</span>
          </div>
          {/* Sparkline Blue */}
          <svg className="w-full h-9 -mb-2 mt-1" viewBox="0 0 100 25" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,20 Q15,10 30,18 T60,8 T85,15 T100,6 L100,25 L0,25 Z" fill="url(#grad-blue)" />
            <path d="M0,20 Q15,10 30,18 T60,8 T85,15 T100,6" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Total Material Records */}
        <div className="glass-card p-5 rounded-2xl border border-dark-700 bg-dark-900 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <Database size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-dark-400 block truncate">Total Material Records</span>
              <div className="text-2xl font-black text-dark-100 font-mono tracking-tight mt-0.5">{formatNumber(totalRows)}</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-dark-400">Across 4 distinct ERP systems</div>
          {/* Sparkline Purple */}
          <svg className="w-full h-9 -mb-2 mt-1" viewBox="0 0 100 25" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,18 Q20,22 40,12 T70,16 T90,8 T100,10 L100,25 L0,25 Z" fill="url(#grad-purple)" />
            <path d="M0,18 Q20,22 40,12 T70,16 T90,8 T100,10" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Duplicates Detected */}
        <div className="glass-card p-5 rounded-2xl border border-dark-700 bg-dark-900 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-dark-400 block truncate">Duplicates Detected</span>
              <div className="text-2xl font-black text-amber-500 font-mono tracking-tight mt-0.5">{formatNumber(totalDups)}</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-amber-500 font-medium">
            {totalRows ? `${((totalDups / totalRows) * 100).toFixed(1)}% redundant SKUs` : '15.8% redundant SKUs'}
          </div>
          {/* Sparkline Amber */}
          <svg className="w-full h-9 -mb-2 mt-1" viewBox="0 0 100 25" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,22 Q18,14 35,20 T65,10 T85,14 T100,8 L100,25 L0,25 Z" fill="url(#grad-amber)" />
            <path d="M0,22 Q18,14 35,20 T65,10 T85,14 T100,8" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Est. Procurement Savings */}
        <div className="glass-card p-5 rounded-2xl border border-dark-700 bg-dark-900 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 text-xl font-bold">
              ₹
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-dark-400 block truncate">Est. Procurement Savings</span>
              <div className="text-2xl font-black text-emerald-500 font-mono tracking-tight mt-0.5">₹{summary?.estSavingsCr || '48.6'} Cr</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-500 font-medium">Via unified bulk rate contracting</div>
          {/* Sparkline Emerald */}
          <svg className="w-full h-9 -mb-2 mt-1" viewBox="0 0 100 25" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-emerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,20 Q20,18 40,8 T70,15 T90,6 T100,4 L100,25 L0,25 Z" fill="url(#grad-emerald)" />
            <path d="M0,20 Q20,18 40,8 T70,15 T90,6 T100,4" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 4-Stage Pipeline Progress Tracker */}
      <div className="glass-card p-6 rounded-2xl border border-dark-700 bg-dark-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-xs font-black text-dark-100 tracking-wider uppercase">
                4-STAGE INTELLIGENT HARMONIZATION ENGINE
              </h2>
              <p className="text-xs text-dark-400 mt-0.5">Real-time pipeline flow from raw ERP ingestion to unified CNMC master</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-500 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            Pipeline Phase: {phase.toUpperCase()}
          </span>
        </div>
        <PipelineStepper phase={phase} />
      </div>

      {/* CPSE Source Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map((s: any) => (
          <div key={s.id} className="glass-card p-5 rounded-2xl border border-dark-700 bg-dark-900 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-dark-100">{s.short}</h3>
                  <p className="text-xs text-dark-400">{s.system}</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                s.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                s.status === 'importing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 animate-pulse' :
                'bg-dark-800 text-dark-400 border-dark-700'
              }`}>
                {s.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex justify-between">
                <span className="text-dark-400">Imported Rows</span>
                <span className="font-mono text-dark-100 font-bold">{formatNumber(s.rows)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Duplicates</span>
                <span className="font-mono text-amber-500 font-bold">{formatNumber(s.duplicates)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Dup Rate</span>
                <span className="font-mono text-dark-100 font-bold">{(s.dupRate * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden mt-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${s.progress}%`, backgroundColor: s.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Harmonized Material Pair Previews */}
      <div className="glass-card rounded-2xl border border-dark-700 bg-dark-900 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black text-dark-100 uppercase tracking-wider">
                CROSS-CPSE HARMONIZED MATERIAL CLUSTERS
              </h3>
              <p className="text-xs text-dark-400 mt-0.5">Multi-modal AI matches identified across disparate CPSE catalogues</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-dark-400">Showing top {matches.length} matches</span>
            <button className="text-xs font-bold text-blue-500 hover:text-blue-600 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-1 transition cursor-pointer">
              <span>View All</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-850 border-b border-dark-700 text-dark-400 font-semibold text-xs">
              <tr>
                <th className="py-3 px-4">CPSE Source Item</th>
                <th className="py-3 px-4">Cross-CPSE Target Item</th>
                <th className="py-3 px-4">Standard</th>
                <th className="py-3 px-4">Similarity</th>
                <th className="py-3 px-4">Unified CNMC Code</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/60 font-mono text-[11px]">
              {matches.slice(0, 6).map((m: any) => (
                <tr key={m.id} className="hover:bg-dark-850/60 transition">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-center gap-2 font-mono font-medium text-dark-100">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] border border-blue-500/20 font-bold">{m.sourceOrg}</span>
                      <span className="font-bold">{m.sourceCode}</span>
                    </div>
                    <div className="text-xs text-dark-300 font-normal truncate max-w-xs mt-0.5">{m.sourceDesc}</div>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-center gap-2 font-mono font-medium text-dark-100">
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[10px] border border-purple-500/20 font-bold">{m.targetOrg}</span>
                      <span className="font-bold">{m.targetCode}</span>
                    </div>
                    <div className="text-xs text-dark-300 font-normal truncate max-w-xs mt-0.5">{m.targetDesc}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-dark-300 font-medium">
                    {m.isStandard || 'IS / ASTM'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-dark-750 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: `${m.score * 100}%` }} />
                      </div>
                      <span className="font-bold text-dark-100 font-mono">{(m.score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold font-mono text-[10px]">
                      {m.cnmcCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      m.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                    }`}>
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function IngestTab({ sources }: { sources: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">CPSE Real-Time Ingestion Feeds</h2>
          <p className="text-xs text-dark-400">Live API and database connectors pulling Material Masters from PSUs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map(s => (
          <div key={s.id} className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{s.name}</h3>
                  <p className="text-xs text-dark-400">{s.system} Connector Adapter</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-dark-850 border border-dark-700/60 font-mono text-center">
              <div>
                <div className="text-[10px] text-dark-500 uppercase">Records</div>
                <div className="text-sm font-bold text-white">{formatNumber(s.rows)}</div>
              </div>
              <div>
                <div className="text-[10px] text-dark-500 uppercase">Duplicates</div>
                <div className="text-sm font-bold text-amber-400">{formatNumber(s.duplicates)}</div>
              </div>
              <div>
                <div className="text-[10px] text-dark-500 uppercase">Redundancy</div>
                <div className="text-sm font-bold text-dark-300">{(s.dupRate * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-dark-400">Ingest Pipeline Stream</span>
                <span className="text-primary-400 font-bold">{s.progress}%</span>
              </div>
              <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300" style={{ width: `${s.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchingTab({ matches, selectedMatchId, onSelectMatch, onApprove, onReject, onCopy }: any) {
  const selected = matches.find((m: any) => m.id === selectedMatchId) || matches[0]

  return (
    <div className="h-full flex gap-5">
      {/* Matches List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-dark-700">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            AI Similarity Candidate Pairs ({matches.length})
          </div>
          <div className="text-xs text-dark-400">Click a pair to inspect similarity breakdown</div>
        </div>

        {matches.map((m: any) => (
          <div
            key={m.id}
            onClick={() => onSelectMatch(m.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selected?.id === m.id
                ? 'bg-blue-600/10 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                : 'glass-card hover:border-dark-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold border border-blue-500/30">
                  {m.sourceOrg}
                </span>
                <span className="text-white font-semibold">{m.sourceCode}</span>
                <ArrowRight size={14} className="text-dark-500" />
                <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 font-bold border border-purple-500/30">
                  {m.targetOrg}
                </span>
                <span className="text-white font-semibold">{m.targetCode}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  m.confidence === 'HIGH' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                  m.confidence === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                  'bg-red-500/15 text-red-400 border-red-500/30'
                }`}>
                  {m.confidence} CONFIDENCE
                </span>
                <span className="text-sm font-bold text-white font-mono">{(m.score * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-dark-300 mb-2">
              <div className="truncate"><span className="text-dark-500">{m.sourceOrg}: </span>{m.sourceDesc}</div>
              <div className="truncate"><span className="text-dark-500">{m.targetOrg}: </span>{m.targetDesc}</div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-dark-800/80">
              <span className="text-dark-400 font-mono text-[11px]">{m.family} · {m.isStandard}</span>
              <span className="font-mono text-emerald-400 font-bold text-[11px]">{m.cnmcCode}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Match Inspector Drawer */}
      {selected && (
        <div className="w-96 glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/90 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-700">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Classifier Inspector</h3>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold">
                {selected.id}
              </span>
            </div>

            {/* Source CPSE Spec */}
            <div className="p-3 rounded-lg bg-dark-850 border border-dark-700/80 space-y-1">
              <div className="text-[10px] font-semibold text-blue-400 font-mono">{selected.sourceOrg} ITEM MASTER</div>
              <div className="text-xs font-bold text-white font-mono">{selected.sourceCode}</div>
              <div className="text-xs text-dark-300">{selected.sourceDesc}</div>
            </div>

            {/* Target CPSE Spec */}
            <div className="p-3 rounded-lg bg-dark-850 border border-dark-700/80 space-y-1">
              <div className="text-[10px] font-semibold text-purple-400 font-mono">{selected.targetOrg} ITEM MASTER</div>
              <div className="text-xs font-bold text-white font-mono">{selected.targetCode}</div>
              <div className="text-xs text-dark-300">{selected.targetDesc}</div>
            </div>

            {/* 3-Component Score Breakdown */}
            <div className="p-3 rounded-lg bg-dark-850 border border-dark-700/80 space-y-2.5">
              <div className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider font-mono">
                Multi-Model Score Composition
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-dark-300">Semantic (Sentence-BERT 40%)</span>
                    <span className="font-mono text-purple-400 font-bold">{((selected.semanticScore || 0.95) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(selected.semanticScore || 0.95) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-dark-300">Lexical (BM25 Token 30%)</span>
                    <span className="font-mono text-blue-400 font-bold">{((selected.lexicalScore || 0.92) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(selected.lexicalScore || 0.92) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-dark-300">Numeric (Specs & Standards 30%)</span>
                    <span className="font-mono text-emerald-400 font-bold">{((selected.numericScore || 0.98) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(selected.numericScore || 0.98) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CNMC Assignment */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-emerald-400 uppercase font-mono font-semibold">Unified CNMC Code</div>
                <div className="text-sm font-bold text-white font-mono">{selected.cnmcCode}</div>
              </div>
              <button
                onClick={() => onCopy(selected.cnmcCode)}
                className="p-2 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition"
                title="Copy CNMC"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dark-700">
            <button
              onClick={() => onReject(selected.id)}
              className="py-2.5 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <X size={14} />
              <span>Reject Match</span>
            </button>
            <button
              onClick={() => onApprove(selected.id)}
              className="py-2.5 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
            >
              <Check size={14} />
              <span>Approve CNMC</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CnmcTab({ matches, onCopy }: any) {
  const [search, setSearch] = useState('')
  const cnmcList = matches.filter((m: any) => m.cnmcCode)
  const filtered = cnmcList.filter((m: any) => 
    m.cnmcCode.toLowerCase().includes(search.toLowerCase()) ||
    m.sourceDesc.toLowerCase().includes(search.toLowerCase()) ||
    m.family.toLowerCase().includes(search.toLowerCase())
  )

  const FAMILIES = [
    { code: 'FA', name: 'Fasteners (Bolts, Nuts, Rivets, Studs)' },
    { code: 'PT', name: 'Pipes, Tubes & Seamless Conduits' },
    { code: 'VF', name: 'Valves, Gaskets, Flanges & Fittings' },
    { code: 'EL', name: 'Electrical (Cables, Switchgear, Motors)' },
    { code: 'BE', name: 'Bearings (Ball, Roller, Spherical)' },
    { code: 'PC', name: 'Pumps, Compressors & Turbines' },
    { code: 'SS', name: 'Structural Steel (Angles, Beams, Plates)' },
    { code: 'WE', name: 'Welding Electrodes & Rods' },
    { code: 'SP', name: 'Safety Equipment & Industrial PPE' },
  ]

  return (
    <div className="space-y-5">
      {/* Code Structure Card */}
      <div className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">CNMC Syntax Architecture</h2>
          <p className="text-xs text-dark-400">National Unified Material Master Code standard for CPSEs</p>
        </div>

        <div className="p-4 rounded-xl bg-dark-850 border border-dark-700 flex items-center justify-center gap-3 font-mono text-sm">
          <span className="text-dark-500 font-bold">FORMAT:</span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">CNMC</span>
          <span className="text-dark-600">-</span>
          <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold">{'{SEGMENT_2}'}</span>
          <span className="text-dark-600">-</span>
          <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold">{'{SEMANTIC_HASH_4}'}</span>
          <span className="text-dark-500 ml-4 font-sans text-xs">Example: <strong className="font-mono text-white">CNMC-FA-4A2B</strong></span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {FAMILIES.map(f => (
            <div key={f.code} className="p-2.5 rounded-lg bg-dark-850/60 border border-dark-700/50 flex items-center gap-2.5 text-xs">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold">{f.code}</span>
              <span className="text-dark-300 truncate">{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CNMC Assigned Master Directory */}
      <div className="glass-card rounded-xl border border-dark-700 bg-dark-900/80 overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Assigned National Master Codes ({filtered.length})
            </h3>
            <p className="text-xs text-dark-400">Deterministic harmonized material master index</p>
          </div>

          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search CNMC or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-xs text-white placeholder-dark-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-850/80 border-b border-dark-700 text-dark-400 font-medium">
              <tr>
                <th className="py-2.5 px-4">CNMC Code</th>
                <th className="py-2.5 px-4">Material Family</th>
                <th className="py-2.5 px-4">Cross-CPSE Matched Description</th>
                <th className="py-2.5 px-4">Linked CPSE SKUs</th>
                <th className="py-2.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60 font-mono text-[11px]">
              {filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-dark-800/40 transition">
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                      {c.cnmcCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-white">{c.family}</td>
                  <td className="py-3 px-4 font-sans text-dark-300 max-w-sm truncate">{c.sourceDesc}</td>
                  <td className="py-3 px-4 text-dark-400">
                    <span className="text-blue-400">{c.sourceCode}</span> + <span className="text-purple-400">{c.targetCode}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onCopy(c.cnmcCode)}
                      className="p-1.5 rounded bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition"
                      title="Copy CNMC"
                    >
                      <Copy size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PipelineStepper({ phase }: { phase: string }) {
  const steps = [
    { key: 'importing', label: '1. INGEST & VALIDATE', desc: 'Raw ERP extraction & deduplication', icon: FileText, color: 'blue' },
    { key: 'normalizing', label: '2. NORMALIZATION', desc: 'IS / ASTM / ISO technical standardization', icon: Box, color: 'purple' },
    { key: 'matching', label: '3. AI MATCHING', desc: 'Bi-encoder semantic + Cross-Encoder rerank', icon: Share2, color: 'emerald' },
    { key: 'generating', label: '4. CNMC CODE GEN', desc: 'Deterministic unified master assignment', icon: ShieldCheck, color: 'teal' },
  ]

  const phaseOrder = ['importing', 'normalizing', 'matching', 'generating', 'complete']
  const currentIdx = phaseOrder.indexOf(phase)

  return (
    <div className="flex flex-col lg:flex-row items-center gap-3">
      {steps.map((step, i) => {
        const isDone = currentIdx > i
        const isCurrent = currentIdx === i
        const IconComponent = step.icon

        return (
          <div key={step.key} className="flex-1 w-full flex items-center gap-2.5">
            <div
              className={`flex-1 p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : isCurrent
                  ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20'
                  : 'bg-dark-850 border-dark-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                step.color === 'blue' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                step.color === 'purple' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                step.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                'bg-teal-500/10 text-teal-500 border border-teal-500/20'
              }`}>
                <IconComponent size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-dark-100">{step.label}</span>
                  {isDone ? (
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <Zap size={14} className="text-blue-500 animate-pulse shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-dark-500 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-dark-400 leading-snug">{step.desc}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden lg:flex shrink-0 text-dark-500">
                <ArrowRight size={15} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
