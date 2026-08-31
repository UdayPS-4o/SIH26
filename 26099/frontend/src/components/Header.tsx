import { useLocation } from 'react-router-dom'
import { useDemoEngine } from '@/store/demo'
import { 
  Play, 
  RotateCcw, 
  LayoutDashboard, 
  Search, 
  GitCompare, 
  FileCheck2, 
  BarChart3, 
  Settings, 
  Zap, 
  Clock, 
  Layers
} from 'lucide-react'
import { useState, useEffect } from 'react'

const PAGE_META: Record<string, { title: string; subtitle: string; icon: any }> = {
  '/': { title: 'Harmonization Dashboard', subtitle: 'Cross-CPSE Material Master Harmonization', icon: LayoutDashboard },
  '/dashboard': { title: 'Harmonization Dashboard', subtitle: 'Cross-CPSE Material Master Harmonization', icon: LayoutDashboard },
  '/materials': { title: 'Material Master Explorer', subtitle: 'Indexed & Normalized CPSE Material Catalogue', icon: Search },
  '/matching': { title: 'AI Matching Engine', subtitle: 'Bi-Encoder Semantic + Lexical + Numeric Multi-Stage Classifier', icon: GitCompare },
  '/reviews': { title: 'Human-in-the-Loop Review Queue', subtitle: 'Expert Verification & Harmonization Audit Trail', icon: FileCheck2 },
  '/analytics': { title: 'Harmonization Analytics & Intelligence', subtitle: 'Procurement Synergy & Standardization Metrics', icon: BarChart3 },
  '/admin': { title: 'CPSE System Administration', subtitle: 'Connectors, AI Weights, and Master Parameters', icon: Settings },
}

export default function Header() {
  const location = useLocation()
  const engine = useDemoEngine()
  const { isRunning, phase, runDemo, resetDemo, sources } = engine
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const currentPath = location.pathname
  const meta = PAGE_META[currentPath] || PAGE_META['/dashboard']
  const IconComponent = meta.icon

  const phaseConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    idle: { label: 'ONLINE · READY', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    importing: { label: 'STAGE 1: INGESTING', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    normalizing: { label: 'STAGE 2: NORMALIZING', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    matching: { label: 'STAGE 3: AI MATCHING', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    generating: { label: 'STAGE 4: CNMC GEN', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    complete: { label: 'HARMONIZATION COMPLETE', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  }

  const activePhase = phaseConfig[phase] || phaseConfig.idle
  const connectedCount = sources.filter(s => s.status === 'connected').length

  return (
    <header className="h-16 border-b border-dark-700 bg-dark-900/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-primary-400 shadow-inner">
          <IconComponent size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">{meta.title}</h1>
            <span className="px-2 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-mono">
              SIH 26099
            </span>
          </div>
          <p className="text-xs text-dark-400 font-normal">{meta.subtitle}</p>
        </div>
      </div>

      {/* Right: Actions & Pipeline Status */}
      <div className="flex items-center gap-3">
        {/* CPSE Connected Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs text-dark-300">
          <Layers size={14} className="text-primary-400" />
          <span>Connected CPSEs:</span>
          <span className="font-mono font-semibold text-white">{connectedCount}/4</span>
        </div>

        {/* Live Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${activePhase.bg} ${activePhase.border} ${activePhase.color}`}>
          {isRunning ? (
            <Zap size={14} className="animate-pulse text-amber-400" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span>{activePhase.label}</span>
        </div>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs font-mono text-dark-300">
          <Clock size={13} className="text-dark-400" />
          <span>{time} IST</span>
        </div>

        {/* Reset Action */}
        <button
          onClick={resetDemo}
          disabled={isRunning}
          className="p-2 rounded-lg bg-dark-800 border border-dark-700 hover:bg-dark-700 text-dark-300 hover:text-white transition disabled:opacity-40"
          title="Reset Demo Data"
        >
          <RotateCcw size={15} />
        </button>

        {/* Run Pipeline CTA */}
        <button
          onClick={runDemo}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>PROCESSING...</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-current" />
              <span>RUN AI PIPELINE</span>
            </>
          )}
        </button>
      </div>
    </header>
  )
}
