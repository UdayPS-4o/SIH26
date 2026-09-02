import { useState, useRef } from 'react'
import { useDemoEngine } from '@/store/demo'
import { parseCsvText, ParsedCsvRow } from '@/utils/harmonizer'
import { Upload, FileSpreadsheet, Play, CheckCircle2, ArrowRight, RefreshCw, Database, Sparkles, FileCheck, Layers, GitMerge, Hash, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const SAMPLE_CSVS = {
  ongc: {
    name: 'ONGC_Material_Master_Sample.csv',
    org: 'ONGC',
    content: `Material_Code,Description,UOM,CPSE_Org,Category
ONGC-BRG-9001,BRG BALL SKF 6205 2RS 25MM ID,NOS,ONGC,Bearings
ONGC-PIP-9002,CS PIPE SCH40 100NB SEAMLESS IS:1239,MTR,ONGC,Pipes
ONGC-VLV-9003,GATE VLV FULL BORE 100NB PN40 SS304,NO,ONGC,Valves
ONGC-BLT-9004,HEX BOLT FULL THD M20X100 GR8.8 SS304,NOS,ONGC,Fasteners
ONGC-CBL-9005,PWR CBL 3.5C X 185MM2 XLPE 1.1KV AL,MTR,ONGC,Electrical`
  },
  sail: {
    name: 'SAIL_Steel_Spares_Catalog.csv',
    org: 'SAIL',
    content: `Item_Code,Material_Description,Unit,Organization,Group
SAIL-BRG-8001,BEARING BALL SINGLE ROW 6205 2RS,EA,SAIL,Bearings
SAIL-PIP-8002,CARBON STEEL PIPE 100NB SCH40 HEAVY,M,SAIL,Pipes
SAIL-VLV-8003,GATE VALVE DN100 PN40 FLANGED RF,EA,SAIL,Valves
SAIL-BLT-8004,HEXAGONAL BOLT M20X100 8.8 STAINLESS,EA,SAIL,Fasteners
SAIL-CBL-8005,POWER CABLE 3.5 CORE 185SQMM XLPE,M,SAIL,Electrical`
  },
  ntpc: {
    name: 'NTPC_Power_Plant_Master.csv',
    org: 'NTPC',
    content: `SKU_Number,Description_Text,UOM,CPSE_Node,Class
NTPC-BRG-7001,SKF BALL BEARING 6205-2RS/C3,NOS,NTPC,Bearings
NTPC-PIP-7002,CS PIPES 100 NB SCHEDULE 40 IS 1239,MTR,NTPC,Pipes
NTPC-VLV-7003,VALVE GATE FULL PORT 4INCH PN40,NOS,NTPC,Valves
NTPC-BLT-7004,BOLT HEXAGONAL HEAD M20X100MM 8.8,NOS,NTPC,Fasteners
NTPC-CBL-7005,3.5C 185 SQMM XLPE POWER CABLE,MTR,NTPC,Electrical`
  }
}

export default function UploadPage() {
  const { processCustomCsv, isRunning, phase } = useDemoEngine()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([])
  const [orgName, setOrgName] = useState('ONGC')
  const [isDone, setIsDone] = useState(false)

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast.error('Please upload a valid .csv or .txt file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setFileName(file.name)
      const rows = parseCsvText(text)
      setParsedRows(rows)
      if (rows.length > 0 && rows[0].org && rows[0].org !== 'CUSTOM') {
        setOrgName(rows[0].org.toUpperCase())
      }
      setIsDone(false)
      toast.success(`Loaded ${rows.length} records from ${file.name}`)
    }
    reader.readAsText(file)
  }

  const loadSample = (key: keyof typeof SAMPLE_CSVS) => {
    const sample = SAMPLE_CSVS[key]
    setFileName(sample.name)
    const rows = parseCsvText(sample.content)
    setParsedRows(rows)
    setOrgName(sample.org)
    setIsDone(false)
    toast.success(`Loaded sample dataset: ${sample.name}`)
  }

  const handleStartPipeline = async () => {
    if (parsedRows.length === 0) {
      toast.error('No CSV rows to process. Upload a file or click a sample dataset button.')
      return
    }

    setIsDone(false)
    await processCustomCsv(parsedRows, orgName)
    setIsDone(true)
    toast.success('Harmonization complete! View results in Review Queue or CNMC Registry.')
  }

  return (
    <div className="h-full flex flex-col bg-dark-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-12 border-b border-dark-700 bg-dark-900/60 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Upload size={16} className="text-blue-400" />
          <span className="text-xs font-semibold text-white">CPSE CSV Data Ingestion & Harmonization Pipeline</span>
          <span className="text-dark-500 text-xs">—</span>
          <span className="text-xs text-dark-400">Import custom material master CSV and run AI normalization & matching</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Real-time Client Parser Active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Sample Dataset Bar */}
        <div className="glass-card p-4 rounded-xl border border-dark-700 bg-dark-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Sample Datasets</h3>
              <p className="text-[11px] text-dark-400">Click any sample CPSE dataset to load test records instantly.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSample('ongc')}
              className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-mono font-medium transition cursor-pointer"
            >
              ⛽ Load ONGC CSV
            </button>
            <button
              onClick={() => loadSample('sail')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium transition cursor-pointer"
            >
              🔩 Load SAIL CSV
            </button>
            <button
              onClick={() => loadSample('ntpc')}
              className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium transition cursor-pointer"
            >
              ⚡ Load NTPC CSV
            </button>
          </div>
        </div>

        {/* ALWAYS VISIBLE Target CPSE Node Selection Dropdown Bar */}
        <div className="glass-card p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <Building2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Target CPSE Organization Node</h4>
              <p className="text-[11px] text-dark-300">Select which Public Sector Enterprise this material master dataset belongs to:</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-300 font-mono font-semibold">Select CPSE:</span>
            <select
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="px-3 py-1.5 bg-dark-850 border border-blue-400/50 rounded-lg text-xs text-blue-200 font-mono uppercase font-bold outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="ONGC">⛽ ONGC (Oil & Natural Gas Corp)</option>
              <option value="SAIL">🔩 SAIL (Steel Authority of India)</option>
              <option value="NTPC">⚡ NTPC (National Thermal Power)</option>
              <option value="IOCL">🔥 IOCL (Indian Oil Corporation)</option>
              <option value="CIL">⛏️ CIL (Coal India Limited)</option>
              <option value="CPCL">🏭 CPCL (Chennai Petroleum)</option>
              <option value="GAIL">🌐 GAIL India</option>
              <option value="BPCL">🛢️ BPCL</option>
              <option value="HPCL">⛽ HPCL</option>
              <option value="CUSTOM">📁 CUSTOM CPSE NODE</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-dark-700 hover:border-blue-500/60 bg-dark-900/40 hover:bg-dark-900/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".csv,.txt"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
            <FileSpreadsheet size={28} />
          </div>
          <p className="text-sm font-bold text-white mb-1">Click to Upload or Drag & Drop CPSE CSV File</p>
          <p className="text-xs text-dark-400 mb-3">Supports `.csv` files with Material Code, Description, UOM, and Organization columns</p>
          <div className="flex items-center gap-2 text-[10px] font-mono text-dark-500">
            <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700">Format: UTF-8 CSV</span>
            <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700">Auto-Column Matching</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">Target: {orgName}</span>
          </div>
        </div>

        {/* Preview & Column Mapper Section */}
        {parsedRows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Loaded File Preview ({parsedRows.length} Rows)
                </h3>
                <span className="text-xs text-emerald-400 font-mono font-bold">[{fileName}]</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold">
                Assigned Node: {orgName}
              </div>
            </div>

            {/* Parsed Rows Table */}
            <div className="border border-dark-700 rounded-xl overflow-hidden bg-dark-900/60">
              <div className="grid grid-cols-[140px_1fr_80px_100px] px-4 py-2.5 bg-dark-800 text-[10px] font-mono text-dark-400 uppercase tracking-wider border-b border-dark-700">
                <span>Material Code</span>
                <span>Raw Description</span>
                <span>UOM</span>
                <span>CPSE Org</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-dark-700/40">
                {parsedRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[140px_1fr_80px_100px] px-4 py-2 text-xs font-mono">
                    <span className="text-blue-400 font-bold">{row.code}</span>
                    <span className="text-dark-200 truncate">{row.description}</span>
                    <span className="text-purple-300">{row.uom}</span>
                    <span className="text-amber-400 font-bold">{orgName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-dark-400">
                Ready to execute NLP cleaning, TF-IDF / Jaccard similarity, and CNMC code minting for <span className="text-blue-300 font-bold font-mono">{orgName}</span>.
              </div>
              <button
                onClick={handleStartPipeline}
                disabled={isRunning}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>RUNNING HARMONIZATION PIPELINE...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>START HARMONIZATION PIPELINE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Processing Pipeline Stepper */}
        {(isRunning || isDone) && (
          <div className="glass-card p-6 rounded-2xl border border-dark-700 bg-dark-900/90 space-y-6">
            <div className="flex items-center justify-between border-b border-dark-700 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Pipeline Stepper Execution</h3>
              </div>
              <span className="text-xs font-mono text-dark-400">
                {isDone ? 'COMPLETED (1.42s)' : `ACTIVE PHASE: ${phase.toUpperCase()}`}
              </span>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { step: '1. INGEST', label: 'CSV Parse & Validate', phaseKey: 'importing', icon: Layers },
                { step: '2. NORMALIZE', label: 'Attribute Extraction', phaseKey: 'normalizing', icon: Sparkles },
                { step: '3. MATCHING', label: 'AI Similarity Funnel', phaseKey: 'matching', icon: GitMerge },
                { step: '4. CNMC MINT', label: 'Catalogue & Audit', phaseKey: 'generating', icon: Hash },
              ].map(({ step, label, phaseKey, icon: Icon }) => {
                const isActive = phase === phaseKey
                const isPassed = isDone || (phase !== 'idle' && phase !== phaseKey)
                return (
                  <div
                    key={step}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-md shadow-blue-500/20'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-dark-850 border-dark-700 text-dark-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase">{step}</span>
                      {isPassed ? <CheckCircle2 size={12} /> : isActive ? <RefreshCw size={12} className="animate-spin" /> : <Icon size={12} />}
                    </div>
                    <p className="text-xs font-semibold">{label}</p>
                  </div>
                )
              })}
            </div>

            {/* Navigation Jump Buttons when Done */}
            {isDone && (
              <div className="pt-4 border-t border-dark-700 flex items-center justify-between bg-dark-850/60 p-4 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Pipeline Finished Successfully!
                  </p>
                  <p className="text-[11px] text-dark-400">All uploaded items for {orgName} have been normalized, matched, and entered into the master queue.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/reviews')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow cursor-pointer"
                  >
                    <span>Open Review Queue</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => navigate('/registry')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow cursor-pointer"
                  >
                    <span>View CNMC Registry</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
