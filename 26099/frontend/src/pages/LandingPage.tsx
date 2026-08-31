import { useDemoEngine, formatNumber } from '@/store/demo'
import { Play, RefreshCw } from 'lucide-react'

export default function LandingPage({ onStart }: { onStart: () => void }) {
  const { isRunning, sources } = useDemoEngine()

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] overflow-hidden">
      <header className="h-14 border-b border-[#1e293b] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">N</div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">NUMMF</div>
            <div className="text-[10px] text-[#475569] tracking-widest uppercase">Material Harmonization Framework</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SIH 2026 · Problem 26099
          </div>
          <div className="text-[10px] text-[#475569] font-mono">v1.0.0</div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="text-center relative z-10 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4">
            One Nation,<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">One Material Code</span>
          </h1>
          <p className="text-base text-[#64748b] max-w-xl mx-auto mb-8 leading-relaxed">
            AI-driven standardization across material records from CPSEs.
            Normalize, match, and assign unified CNMC codes.
          </p>

          <button
            onClick={onStart}
            disabled={isRunning}
            className="group inline-flex items-center gap-3 px-8 py-3.5 bg-white text-black text-sm font-semibold rounded hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                PIPELINE RUNNING
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                START DEMO
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-14 w-full max-w-3xl">
          {sources.map((s: any) => (
            <div key={s.id} className="border border-[#1e293b] rounded p-4 bg-[#111827]/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{s.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-white">{s.short}</div>
                  <div className="text-[10px] text-[#475569]">{s.system}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#475569]">Records</span>
                  <span className="text-[#94a3b8] font-mono">{formatNumber(s.rowCount)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#475569]">Duplicates</span>
                  <span className="text-[#94a3b8] font-mono">{formatNumber(Math.round(s.rowCount * s.dupRate))}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#475569]">Standard</span>
                  <span className="text-emerald-400 font-mono">IS / ASTM</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="h-10 border-t border-[#1e293b] flex items-center justify-between px-6 text-[10px] text-[#475569] shrink-0">
        <div className="flex items-center gap-4">
          <span>FastAPI + React + sentence-transformers</span>
          <span className="text-[#1e293b]">|</span>
          <span>Bi-Encoder + Cross-Encoder Reranking</span>
        </div>
        <div>Ministry of Petroleum & Natural Gas · CPCL</div>
      </footer>
    </div>
  )
}
