import { useState } from 'react'
import { Plus, Sliders, Server, Save, Palette, Sun, Moon, Check } from 'lucide-react'
import { useDemoEngine } from '@/store/demo'
import { useThemeStore } from '@/store/theme'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { sources } = useDemoEngine()
  const [lexicalWeight, setLexicalWeight] = useState(30)
  const [semanticWeight, setSemanticWeight] = useState(40)
  const [numericWeight, setNumericWeight] = useState(30)

  const [form, setForm] = useState({
    name: '',
    short: '',
    code: '',
    sector: '',
    system: 'SAP S/4HANA',
  })

  const handleSaveWeights = () => {
    const total = lexicalWeight + semanticWeight + numericWeight
    if (total !== 100) {
      toast.error(`Weights must sum to 100% (currently ${total}%)`)
      return
    }
    toast.success('AI scoring weights updated successfully')
  }

  const handleAddOrg = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.short) {
      toast.error('Please enter Organization Name and Short Code')
      return
    }
    toast.success(`Registered connector for ${form.name} (${form.short})`)
    setForm({ name: '', short: '', code: '', sector: '', system: 'SAP S/4HANA' })
  }

  const { theme, setTheme } = useThemeStore()

  return (
    <div className="h-full flex flex-col bg-dark-950 p-6 space-y-6 overflow-y-auto select-none">
      {/* Top Administration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Scoring Weights Calibration */}
        <div className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders size={15} className="text-primary-400" />
                <span>AI Scoring Pipeline Weights</span>
              </h3>
              <p className="text-xs text-dark-400">Calibrate multi-modal similarity score composition</p>
            </div>
            <span className="text-xs font-mono font-bold text-primary-400">
              Total: {lexicalWeight + semanticWeight + numericWeight}%
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1.5 font-mono">
                <span className="text-purple-400 font-semibold">Semantic Bi-Encoder (Sentence-BERT)</span>
                <span className="text-white font-bold">{semanticWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={semanticWeight}
                onChange={e => setSemanticWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5 font-mono">
                <span className="text-blue-400 font-semibold">Lexical / BM25 Token Matching</span>
                <span className="text-white font-bold">{lexicalWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={lexicalWeight}
                onChange={e => setLexicalWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5 font-mono">
                <span className="text-emerald-400 font-semibold">Numeric & Standard IS/ASTM Matcher</span>
                <span className="text-white font-bold">{numericWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={numericWeight}
                onChange={e => setNumericWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="pt-2 border-t border-dark-700 flex justify-between items-center">
              <span className="text-[11px] text-dark-400 font-mono">Formula: {semanticWeight}% Sem + {lexicalWeight}% Lex + {numericWeight}% Num</span>
              <button
                onClick={handleSaveWeights}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition cursor-pointer"
              >
                <Save size={13} />
                <span>Save Weights</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interface Appearance & Theme Preferences */}
        <div className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Palette size={15} className="text-primary-400" />
              <span>UI Theme & Visual Appearance</span>
            </h3>
            <p className="text-xs text-dark-400">Switch display theme mode and real-time contrast preferences</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Light Theme Option Card */}
            <div
              onClick={() => {
                setTheme('light')
                toast.success('Switched to Light Executive Theme')
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/30'
                  : 'bg-dark-850/60 border-dark-700/80 hover:border-dark-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Sun size={17} />
                </div>
                {theme === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Check size={12} />
                  </span>
                )}
              </div>
              <div className="font-bold text-xs text-white mb-1">Light Executive</div>
              <p className="text-[11px] text-dark-400">High-clarity daytime contrast for executive reports & audits</p>
              <div className="mt-3 flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-50 border border-slate-300" />
                <div className="w-4 h-4 rounded bg-white border border-slate-300" />
                <div className="w-4 h-4 rounded bg-blue-600" />
                <div className="w-4 h-4 rounded bg-emerald-500" />
              </div>
            </div>

            {/* Dark Theme Option Card */}
            <div
              onClick={() => {
                setTheme('dark')
                toast.success('Switched to Dark Command Center Theme')
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/30'
                  : 'bg-dark-850/60 border-dark-700/80 hover:border-dark-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Moon size={17} />
                </div>
                {theme === 'dark' && (
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Check size={12} />
                  </span>
                )}
              </div>
              <div className="font-bold text-xs text-white mb-1">Dark Command Center</div>
              <p className="text-[11px] text-dark-400">Cyberpunk tactical palette with illuminated telemetry & neon cues</p>
              <div className="mt-3 flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-[#070a13] border border-slate-700" />
                <div className="w-4 h-4 rounded bg-[#0b101d] border border-slate-700" />
                <div className="w-4 h-4 rounded bg-blue-600" />
                <div className="w-4 h-4 rounded bg-purple-500" />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-dark-850 border border-dark-700/60 flex items-center justify-between text-xs">
            <span className="text-dark-400 font-mono text-[11px]">System Status: Theme synced to local profile</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
              ACTIVE: {theme.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Register New PSU / CPSE Connector Form */}
      <div className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server size={15} className="text-primary-400" />
            <span>Register New CPSE Connector</span>
          </h3>
          <p className="text-xs text-dark-400">Onboard additional PSU ERP systems into NUMMF</p>
        </div>

        <form onSubmit={handleAddOrg} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] text-dark-400 uppercase font-mono mb-1 block">Organization Full Name</label>
            <input
              type="text"
              placeholder="e.g. Bharat Petroleum Corporation Limited"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-xs text-white placeholder-dark-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-dark-400 uppercase font-mono mb-1 block">Short Code</label>
              <input
                type="text"
                placeholder="e.g. BPCL"
                value={form.short}
                onChange={e => setForm({ ...form, short: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-xs text-white placeholder-dark-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-dark-400 uppercase font-mono mb-1 block">ERP System</label>
              <select
                value={form.system}
                onChange={e => setForm({ ...form, system: e.target.value })}
                className="w-full px-3 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-xs text-white focus:border-blue-500 outline-none"
              >
                <option value="SAP S/4HANA">SAP S/4HANA</option>
                <option value="SAP ECC 6.0">SAP ECC 6.0</option>
                <option value="IBM Maximo 7.6">IBM Maximo 7.6</option>
                <option value="Oracle EBS 12.2">Oracle EBS 12.2</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Register PSU Connector</span>
          </button>
        </form>
      </div>

      {/* Active PSU Connectors List */}
      <div className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Active CPSE Data Source Nodes ({sources.length})
          </h3>
          <p className="text-xs text-dark-400">Live operational adapters and data synchronization status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sources.map(s => (
            <div key={s.id} className="p-4 rounded-xl bg-dark-850 border border-dark-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  CONNECTED
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{s.short}</h4>
                <p className="text-[11px] text-dark-400 truncate">{s.name}</p>
              </div>
              <div className="pt-2 border-t border-dark-700/60 text-xs font-mono space-y-1 text-dark-300">
                <div className="flex justify-between">
                  <span className="text-dark-500">Adapter:</span>
                  <span>{s.system}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Sync:</span>
                  <span className="text-emerald-400">Real-time</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
