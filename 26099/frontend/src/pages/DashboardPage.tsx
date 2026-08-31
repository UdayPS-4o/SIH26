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
  TrendingUp, 
  ShieldAlert, 
  Terminal,
  Zap,
  Search,
  Copy
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
      <div className="h-12 border-b border-dark-700 bg-dark-900/60 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {TABS.map(t => {
            const Icon = t.icon
            const isActive = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
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
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono border transition ${
            showLogs
              ? 'bg-dark-800 border-dark-600 text-primary-400'
              : 'border-dark-700 text-dark-400 hover:text-white'
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
          <div className="w-80 border-l border-dark-700 bg-dark-900/90 flex flex-col shrink-0">
            <div className="h-10 border-b border-dark-700 px-3 flex items-center justify-between text-xs font-mono text-dark-300">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-primary-400" />
                <span className="font-semibold text-white">PIPELINE AUDIT LOG</span>
              </div>
              <span className="text-[10px] text-dark-400">Auto-scrolling</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5 leading-relaxed bg-[#050811]">
              {logs.length === 0 ? (
                <div className="text-dark-500 italic py-4 text-center">Awaiting pipeline trigger...</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="flex gap-2 py-0.5 border-b border-dark-800/40 pb-1">
                    <span className="text-dark-500 shrink-0 text-[10px]">{l.ts}</span>
                    <span
                      className={`break-words ${
                        l.level === 'error' || l.msg.startsWith('ERR')
                          ? 'text-red-400'
                          : l.level === 'success' || l.msg.startsWith('SUCCESS') || l.msg.startsWith('DONE')
                          ? 'text-emerald-400'
                          : l.level === 'warn' || l.msg.startsWith('WARN')
                          ? 'text-amber-400'
                          : l.msg.startsWith('AI') || l.msg.startsWith('CNMC')
                          ? 'text-cyan-400'
                          : 'text-dark-300'
                      }`}
                    >
                      {l.msg}
                    </span>
                  </div>
                ))
              )}
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
        <div className="glass-card p-4 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-dark-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dark-300">Connected CPSEs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{connectedCount} / {sources.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 size={12} />
            <span>IOCL, NTPC, SAIL, CIL</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-dark-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dark-300">Total Material Records</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Hash size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">{formatNumber(totalRows)}</div>
          <div className="text-[11px] text-dark-400 mt-1">Across 4 distinct ERP systems</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-dark-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dark-300">Duplicates Detected</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{formatNumber(totalDups)}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">
            {totalRows ? `${((totalDups / totalRows) * 100).toFixed(1)}% redundant SKUs` : '15.9% redundancy'}
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-dark-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dark-300">Est. Procurement Savings</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">₹{summary?.estSavingsCr || '48.6'} Cr</div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Via unified bulk rate contracting</div>
        </div>
      </div>

      {/* 4-Stage Pipeline Progress Tracker */}
      <div className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Cpu size={16} className="text-primary-400" />
              <span>4-Stage Intelligent Harmonization Engine</span>
            </h2>
            <p className="text-xs text-dark-400">Real-time pipeline flow from raw ERP ingestion to unified CNMC master</p>
          </div>
          <span className="text-xs font-mono text-primary-400 px-2.5 py-1 rounded bg-primary-500/10 border border-primary-500/20">
            Pipeline Phase: {phase.toUpperCase()}
          </span>
        </div>
        <PipelineStepper phase={phase} />
      </div>

      {/* CPSE Source Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map((s: any) => (
          <div key={s.id} className="glass-card p-4 rounded-xl border border-dark-700 bg-dark-900/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <h3 className="text-xs font-bold text-white">{s.short}</h3>
                  <p className="text-[10px] text-dark-400">{s.system}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                s.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                s.status === 'importing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse' :
                'bg-dark-800 text-dark-400 border-dark-700'
              }`}>
                {s.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-dark-400">Imported Rows</span>
                <span className="font-mono text-white font-semibold">{formatNumber(s.rows)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Duplicates</span>
                <span className="font-mono text-amber-400 font-semibold">{formatNumber(s.duplicates)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Dup Rate</span>
                <span className="font-mono text-dark-300">{(s.dupRate * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${s.progress}%`, backgroundColor: s.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Harmonized Material Pair Previews */}
      <div className="glass-card rounded-xl border border-dark-700 bg-dark-900/80 overflow-hidden">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GitMerge size={15} className="text-primary-400" />
              <span>Cross-CPSE Harmonized Material Clusters</span>
            </h3>
            <p className="text-xs text-dark-400">Multi-modal AI matches identified across disparate CPSE catalogues</p>
          </div>
          <span className="text-xs font-mono text-dark-400">Showing top {matches.length} matches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-850/80 border-b border-dark-700 text-dark-400 font-medium">
              <tr>
                <th className="py-2.5 px-4">CPSE Source Item</th>
                <th className="py-2.5 px-4">Cross-CPSE Target Item</th>
                <th className="py-2.5 px-4">Standard</th>
                <th className="py-2.5 px-4">Similarity</th>
                <th className="py-2.5 px-4">Unified CNMC Code</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60 font-mono text-[11px]">
              {matches.slice(0, 6).map((m: any) => (
                <tr key={m.id} className="hover:bg-dark-800/40 transition">
                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-center gap-2 font-mono font-medium text-white">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">{m.sourceOrg}</span>
                      <span>{m.sourceCode}</span>
                    </div>
                    <div className="text-xs text-dark-300 font-normal truncate max-w-xs">{m.sourceDesc}</div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-center gap-2 font-mono font-medium text-white">
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20">{m.targetOrg}</span>
                      <span>{m.targetCode}</span>
                    </div>
                    <div className="text-xs text-dark-300 font-normal truncate max-w-xs">{m.targetDesc}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-dark-300">
                    {m.isStandard || 'IS / ASTM'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-dark-750 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: `${m.score * 100}%` }} />
                      </div>
                      <span className="font-bold text-white font-mono">{(m.score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold font-mono text-[10px]">
                      {m.cnmcCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      m.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
    { key: 'importing', label: '1. Ingest & Validate', desc: 'Raw ERP extraction & deduplication' },
    { key: 'normalizing', label: '2. Normalization', desc: 'IS / ASTM / ISO technical standardization' },
    { key: 'matching', label: '3. AI Matching', desc: 'Bi-Encoder semantic + Cross-Encoder rerank' },
    { key: 'generating', label: '4. CNMC Code Gen', desc: 'Deterministic unified master assignment' },
  ]

  const phaseOrder = ['importing', 'normalizing', 'matching', 'generating', 'complete']
  const currentIdx = phaseOrder.indexOf(phase)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {steps.map((step, i) => {
        const isDone = currentIdx > i
        const isCurrent = currentIdx === i
        return (
          <div
            key={step.key}
            className={`p-3 rounded-xl border transition-all ${
              isDone
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isCurrent
                ? 'bg-blue-600/15 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/30 animate-pulse-slow'
                : 'bg-dark-850/60 border-dark-700/60 text-dark-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono uppercase">{step.label}</span>
              {isDone ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : isCurrent ? (
                <Zap size={16} className="text-blue-400 animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-dark-600" />
              )}
            </div>
            <p className="text-[11px] text-dark-400 leading-snug">{step.desc}</p>
          </div>
        )
      })}
    </div>
  )
}
