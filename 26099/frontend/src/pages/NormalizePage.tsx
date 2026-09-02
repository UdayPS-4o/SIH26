import { useState } from 'react'
import { NORMALIZATION_EXAMPLES, NormExample } from '@/demo/data'
import { ArrowRight, Zap, Copy, Database } from 'lucide-react'
import toast from 'react-hot-toast'

const ORG_COLORS: Record<string, string> = {
  IOCL: 'text-blue-600 bg-blue-50 border-blue-200',
  NTPC: 'text-purple-600 bg-purple-50 border-purple-200',
  SAIL: 'text-amber-600 bg-amber-50 border-amber-200',
  CIL: 'text-emerald-600 bg-emerald-50 border-emerald-200',
}

export default function NormalizePage() {
  const [selected, setSelected] = useState<NormExample>(NORMALIZATION_EXAMPLES[0])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const handleRun = async () => {
    setRunning(true)
    await new Promise(r => setTimeout(r, 1000))
    setRunning(false)
    setDone(true)
    toast.success('Normalization complete! Attributes extracted.')
  }

  const handleSelect = (ex: NormExample) => {
    setSelected(ex)
    setDone(false)
  }

  const copy = (t: string) => {
    navigator.clipboard.writeText(t)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="h-full flex flex-col bg-dark-950 overflow-hidden select-none p-6 space-y-4">
      {/* Sub-Header Banner */}
      <div className="glass-card rounded-2xl border border-dark-700 bg-dark-900 shadow-sm p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Zap size={16} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xs font-bold text-dark-100 tracking-tight">Material Normalization Engine</h2>
            <span className="text-dark-400 text-xs">—</span>
            <span className="text-xs text-dark-400">Raw CPSE description → Structured attributes (spaCy EntityRuler + MRO abbreviation dictionary)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>ENGINE ONLINE</span>
        </div>
      </div>

      {/* Main Grid: Left Selector, Middle Raw Input, Right Normalized Output */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden min-h-0">
        {/* Left Column: Select Material (col-span-3) */}
        <div className="col-span-3 glass-card rounded-2xl border border-dark-700 bg-dark-900 shadow-sm p-4 flex flex-col overflow-hidden">
          <div className="pb-3 mb-1">
            <span className="text-[10px] font-bold font-mono text-dark-500 uppercase tracking-wider">SELECT MATERIAL</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {NORMALIZATION_EXAMPLES.map(ex => {
              const isSelected = selected.id === ex.id
              return (
                <div
                  key={ex.id}
                  onClick={() => handleSelect(ex)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${isSelected
                      ? 'bg-blue-500/5 border-2 border-blue-500 shadow-xs'
                      : 'bg-dark-850/60 hover:bg-dark-850 border-dark-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono font-bold ${ORG_COLORS[ex.org]}`}>
                      {ex.org}
                    </span>
                    <span className="text-xs font-mono font-bold text-dark-100">{ex.rawCode}</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-dark-100 leading-snug line-clamp-2">
                    {ex.rawDesc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Middle Column: RAW INPUT (FROM CPSE ERP) (col-span-4 or col-span-4.5) */}
        <div className="col-span-4 glass-card rounded-2xl border border-dark-700 bg-dark-900 shadow-sm p-5 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span className="text-xs font-black font-mono text-dark-100 tracking-wider uppercase">RAW INPUT (FROM CPSE ERP)</span>
            </div>

            {/* Description Field Box */}
            <div className="rounded-2xl border border-dark-700 bg-dark-850 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider">
                  DESCRIPTION FIELD (40-char SAP truncation)
                </span>
                <button
                  onClick={() => copy(selected.rawDesc)}
                  className="text-dark-400 hover:text-dark-100 transition cursor-pointer p-1"
                  title="Copy raw text"
                >
                  <Copy size={13} />
                </button>
              </div>
              <p className="font-mono text-xs font-bold text-rose-500 leading-relaxed break-words">
                {selected.rawDesc}
              </p>
            </div>

            {/* Abbreviations Detected */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-dark-500 uppercase tracking-wider block">
                ABBREVIATIONS DETECTED ({selected.abbreviationsExpanded.length})
              </span>
              <div className="space-y-2">
                {selected.abbreviationsExpanded.map((ab, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-dark-700 bg-dark-850 px-4 py-3"
                  >
                    <span className="font-mono text-xs font-bold text-rose-500">{ab.from}</span>
                    <ArrowRight size={13} className="text-dark-400" />
                    <span className="font-mono text-xs font-bold text-emerald-500 text-right">{ab.to}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Metadata */}
            <div className="rounded-2xl border border-dark-700 bg-dark-850 p-4 space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <Database size={13} className="text-blue-500" />
                <span className="text-[10px] font-mono font-bold text-dark-400 uppercase tracking-wider">
                  SOURCE METADATA
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-dark-400 font-medium">Source Code</span>
                  <span className="font-mono font-bold text-dark-100">{selected.rawCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400 font-medium">Organization</span>
                  <span className="font-mono font-bold text-dark-100">{selected.org}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400 font-medium">UOM (raw)</span>
                  <span className="font-mono font-bold text-dark-100">NOS / MTR / NO (inconsistent)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: NORMALIZED OUTPUT (CNMC STANDARD) (col-span-5) */}
        <div className="col-span-5 glass-card rounded-2xl border border-dark-700 bg-dark-900 shadow-sm p-5 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-2 pb-4 border-b border-dark-700 mb-4 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-black font-mono text-dark-100 tracking-wider uppercase">NORMALIZED OUTPUT (CNMC STANDARD)</span>
          </div>

          {done ? (
            <div className="space-y-4">
              {/* Standard Golden Description Box */}
              <div className="rounded-2xl border border-dark-700 bg-dark-850 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                    STANDARD GOLDEN DESCRIPTION
                  </span>
                  <button
                    onClick={() => copy(selected.normalizedDesc)}
                    className="text-dark-400 hover:text-dark-100 transition cursor-pointer p-1"
                    title="Copy golden description"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="font-mono text-xs font-bold text-emerald-500 leading-relaxed">
                  {selected.normalizedDesc}
                </p>
              </div>

              {/* Extracted Attributes Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-dark-500 uppercase tracking-wider block">
                  EXTRACTED ATTRIBUTES ({selected.attributes.length})
                </span>
                <div className="rounded-2xl border border-dark-700 overflow-hidden bg-dark-850">
                  <div className="grid grid-cols-3 bg-dark-800/80 px-4 py-2.5 text-[10px] font-mono font-bold text-dark-400 uppercase tracking-wider border-b border-dark-700">
                    <span>ATTRIBUTE</span>
                    <span>RAW</span>
                    <span>NORMALIZED</span>
                  </div>
                  <div className="divide-y divide-dark-750">
                    {selected.attributes.map((a, i) => (
                      <div key={i} className="grid grid-cols-3 px-4 py-2.5 text-xs items-center hover:bg-dark-800/30 transition">
                        <span className="font-bold text-dark-100">{a.key}</span>
                        <span className="font-mono font-bold text-rose-500 text-[11px] truncate pr-2">{a.raw}</span>
                        <span className="font-mono font-bold text-emerald-500 text-[11px] truncate">{a.normalized}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              {running ? (
                <>
                  <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-dark-100">Running normalization...</p>
                    <p className="text-xs text-dark-400">spaCy EntityRuler → MRO dictionary → UNSPSC lookup</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-dark-850 border border-dark-700 flex items-center justify-center text-dark-400">
                    <Zap size={24} className="text-dark-500" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-dark-100">Ready to normalize</p>
                    <p className="text-xs text-dark-400">Click <span className="font-bold text-amber-500">"Run Normalization"</span> to extract structured attributes</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Action Bar */}
      <div className="glass-card rounded-2xl border border-dark-700 bg-dark-900 shadow-sm px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-dark-400">
            Pipeline: <span className="font-mono font-bold text-dark-100">spaCy EntityRuler + regex + MRO dictionary</span>
          </span>
          <span className="text-dark-500">|</span>
          <span className="text-dark-400">
            Avg. time: <span className="font-mono font-bold text-emerald-500">~12ms</span>
          </span>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition disabled:opacity-50 shadow-md shadow-amber-500/20 cursor-pointer"
        >
          {running ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Zap size={14} className="fill-slate-950" />
              <span>Run Normalization</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
