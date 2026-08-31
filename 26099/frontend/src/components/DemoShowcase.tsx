/** Cinematic auto-playing demo for video recording */
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Atom, Database, Sparkles, CheckCircle2, GitMerge, TrendingUp, Zap, Building2, ArrowRight, Play, Pause } from 'lucide-react'
import { useAppStore } from '@/store'

const SCENES = [
  { id: 'intro', title: 'NUMMF', subtitle: 'National Unified Material Master Framework', duration: 4000 },
  { id: 'problem', title: 'The Problem', subtitle: 'Same bolt. Different codes. Across every CPSE.', duration: 5000 },
  { id: 'ingest', title: 'Ingest', subtitle: 'Reading from 5 CPSEs simultaneously', duration: 4000 },
  { id: 'normalize', title: 'Stage 1: Normalize', subtitle: 'Indian industrial terms, IS codes, grades', duration: 4000 },
  { id: 'match', title: 'Stage 2: Match', subtitle: 'Bi-encoder + Lexical + Numeric scoring', duration: 4500 },
  { id: 'rerank', title: 'Stage 3: Re-rank', subtitle: 'Cross-encoder precision scoring', duration: 4000 },
  { id: 'classify', title: 'Stage 4: Classify', subtitle: 'EXACT · NEAR_DUPLICATE · EQUIVALENT · PARTIAL', duration: 4500 },
  { id: 'cnmc', title: 'Generate CNMC', subtitle: 'Stable semantic hash for "One Nation, One Material Code"', duration: 5000 },
  { id: 'dashboard', title: 'Dashboard', subtitle: 'Real-time view across all CPSEs', duration: 4500 },
  { id: 'review', title: 'Review Queue', subtitle: 'Human-in-the-loop approval', duration: 4500 },
  { id: 'analytics', title: 'Analytics', subtitle: 'Savings. Quality. Compliance.', duration: 4500 },
  { id: 'outro', title: 'One Nation, One Material Code', subtitle: 'NUMMF · SIH 2026 · Problem ID 26099', duration: 5000 },
]

export default function DemoShowcase() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const { dashboard, matching, materials, organizations } = useAppStore()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true
      dashboard.fetch()
      materials.fetch()
      matching.fetchProposals()
      organizations.fetch()
    }
  }, [])

  useEffect(() => {
    if (!playing) return
    const scene = SCENES[sceneIndex]
    const timer = setTimeout(() => {
      setSceneIndex((sceneIndex + 1) % SCENES.length)
    }, scene.duration)
    return () => clearTimeout(timer)
  }, [sceneIndex, playing])

  const scene = SCENES[sceneIndex]

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0f172a] to-[#1a1a2e] overflow-hidden">
      {/* Background animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Play/Pause control */}
      <button
        onClick={() => setPlaying(p => !p)}
        className="absolute top-6 right-6 z-50 glass-panel rounded-full p-3 hover:bg-dark-700/50 transition"
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
      </button>

      {/* Scene indicator dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSceneIndex(i)}
            className={`h-1 rounded-full transition-all ${i === sceneIndex ? 'w-8 bg-white' : 'w-4 bg-white/30'}`}
          />
        ))}
      </div>

      {/* Scenes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex items-center justify-center p-12"
        >
          {scene.id === 'intro' && <IntroScene />}
          {scene.id === 'problem' && <ProblemScene />}
          {scene.id === 'ingest' && <IngestScene />}
          {scene.id === 'normalize' && <NormalizeScene />}
          {scene.id === 'match' && <MatchScene />}
          {scene.id === 'rerank' && <RerankScene />}
          {scene.id === 'classify' && <ClassifyScene />}
          {scene.id === 'cnmc' && <CNMCScene />}
          {scene.id === 'dashboard' && <DashboardScene />}
          {scene.id === 'review' && <ReviewScene />}
          {scene.id === 'analytics' && <AnalyticsScene />}
          {scene.id === 'outro' && <OutroScene />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom bar with scene title */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <motion.div
          key={scene.id + '-caption'}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <p className="text-white/60 text-xs uppercase tracking-[0.3em] mb-1">{scene.title}</p>
          <p className="text-white text-xl font-semibold">{scene.subtitle}</p>
        </motion.div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Scene Components
// ──────────────────────────────────────────────────────────────────

function IntroScene() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1, type: 'spring' }}
        className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary-500 via-accent-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-accent-500/50"
      >
        <Atom size={64} className="text-white" />
      </motion.div>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-7xl font-bold text-white mb-4 tracking-tight"
      >
        NUMMF
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-2xl text-white/80 mb-2"
      >
        National Unified Material Master Framework
      </motion.p>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-lg text-accent-400 font-semibold"
      >
        One Nation, One Material Code
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mt-12 max-w-md mx-auto"
      />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="mt-6 text-sm text-white/50"
      >
        SIH 2026 · Problem ID 26099 · Ministry of Petroleum & Natural Gas
      </motion.div>
    </div>
  )
}

function ProblemScene() {
  const examples = [
    { org: 'IOCL', code: 'IOCL-BLT-001', desc: 'Hex Bolt M20x100 Grade 8.8 SS304' },
    { org: 'NTPC', code: 'NTPC-BLT-001', desc: 'Hexagonal Bolt M20x100 8.8 SS' },
    { org: 'SAIL', code: 'SAIL-BLT-001', desc: 'Hex Bolt M20x100 SS304 Grade 8.8' },
  ]
  return (
    <div className="max-w-4xl w-full">
      <div className="grid grid-cols-3 gap-4 mb-8">
        {examples.map((ex, i) => (
          <motion.div
            key={ex.code}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.2 }}
            className="glass-panel rounded-2xl p-6"
          >
            <p className="text-xs text-white/50 mb-1">{ex.org}</p>
            <p className="text-xs font-mono text-accent-400 mb-3">{ex.code}</p>
            <p className="text-white">{ex.desc}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent my-6"
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: 'spring' }}
        className="text-center"
      >
        <div className="text-7xl font-bold text-red-400 mb-2">Same Material</div>
        <div className="text-2xl text-white/70">3 Different Codes. 3 Different Masters.</div>
      </motion.div>
    </div>
  )
}

function IngestScene() {
  const sources = [
    { name: 'IOCL', count: 1247, sector: 'Oil & Gas', color: 'from-blue-500 to-blue-700' },
    { name: 'NTPC', count: 1089, sector: 'Power', color: 'from-purple-500 to-purple-700' },
    { name: 'SAIL', count: 956, sector: 'Steel', color: 'from-orange-500 to-red-600' },
    { name: 'CIL', count: 823, sector: 'Mining', color: 'from-emerald-500 to-teal-700' },
    { name: 'HEC', count: 634, sector: 'Engineering', color: 'from-pink-500 to-rose-600' },
  ]
  return (
    <div className="max-w-5xl w-full">
      <div className="grid grid-cols-5 gap-3 mb-8">
        {sources.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className={`glass-panel rounded-xl p-4 bg-gradient-to-br ${s.color}`}
          >
            <Building2 className="text-white/80 mb-2" size={24} />
            <p className="text-white font-bold text-lg">{s.name}</p>
            <p className="text-white/80 text-xs">{s.sector}</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + i * 0.15 }}
              className="text-2xl font-bold text-white mt-2"
            >
              {s.count.toLocaleString()}
            </motion.p>
            <p className="text-white/60 text-xs">materials</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="glass-panel rounded-2xl p-6 flex items-center justify-between"
      >
        <div>
          <p className="text-white text-2xl font-bold">Total Material Catalog</p>
          <p className="text-white/60">From 5 CPSEs across 14 families</p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2, type: 'spring' }}
          className="text-5xl font-bold gradient-text"
        >
          4,749
        </motion.div>
      </motion.div>
    </div>
  )
}

function NormalizeScene() {
  const before = 'IS:1239 Pipe SCH40 100NBx6M (CS)'
  const after = 'pipe sch40 100nb 6m carbon steel'
  return (
    <div className="max-w-4xl w-full">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <Sparkles className="inline-block text-accent-400 mb-3" size={32} />
        <h2 className="text-4xl font-bold text-white">Indian Industrial Normalizer</h2>
        <p className="text-white/60 mt-2">100+ domain-specific transformations</p>
      </motion.div>
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6 border-l-4 border-l-red-500"
        >
          <p className="text-xs text-red-400 mb-2">BEFORE</p>
          <p className="text-white text-lg font-mono">{before}</p>
        </motion.div>
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="glass-panel rounded-2xl p-6 border-l-4 border-l-emerald-500"
        >
          <p className="text-xs text-emerald-400 mb-2">AFTER</p>
          <p className="text-white text-lg font-mono">{after}</p>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-6 grid grid-cols-3 gap-3 text-center"
      >
        {['IS codes removed', 'Grades unified', 'UOM standardized'].map((t, i) => (
          <motion.div
            key={t}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.6 + i * 0.15, type: 'spring' }}
            className="glass-panel rounded-lg p-3 text-xs text-white/80"
          >
            ✓ {t}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function MatchScene() {
  const stages = [
    { label: 'Lexical', icon: GitMerge, weight: 30, color: 'from-blue-500 to-cyan-500' },
    { label: 'Semantic', icon: Sparkles, weight: 40, color: 'from-purple-500 to-pink-500' },
    { label: 'Numeric', icon: Database, weight: 30, color: 'from-orange-500 to-red-500' },
  ]
  return (
    <div className="max-w-4xl w-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-8"
      >
        <Zap className="inline-block text-yellow-400 mb-3" size={32} />
        <h2 className="text-4xl font-bold text-white">Multi-Score Fusion</h2>
        <p className="text-white/60 mt-2">Three independent AI scores combined for accuracy</p>
      </motion.div>
      <div className="grid grid-cols-3 gap-4">
        {stages.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.2 }}
              className={`glass-panel rounded-2xl p-6 bg-gradient-to-br ${s.color}`}
            >
              <Icon className="text-white mb-3" size={28} />
              <p className="text-white text-xl font-bold">{s.label}</p>
              <p className="text-white/80 text-sm mb-3">Score</p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1 + i * 0.2, duration: 0.8 }}
                className="h-3 bg-white/30 rounded-full overflow-hidden"
              >
                <div className="h-full bg-white" style={{ width: `${s.weight}%` }} />
              </motion.div>
              <p className="text-white text-3xl font-bold mt-3">{s.weight}%</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function RerankScene() {
  return (
    <div className="max-w-4xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
        <TrendingUp className="inline-block text-emerald-400 mb-3" size={32} />
        <h2 className="text-4xl font-bold text-white">Cross-Encoder Re-ranking</h2>
        <p className="text-white/60 mt-2">Bi-encoder (fast) → Cross-encoder (precise)</p>
      </motion.div>
      <div className="space-y-3">
        {[
          { rank: 1, score: 0.97, label: 'IOCL-BLT-001 ↔ SAIL-BLT-001', match: 'Hex Bolt M20x100 SS304' },
          { rank: 2, score: 0.96, label: 'IOCL-NUT-001 ↔ SAIL-NUT-001', match: 'Hex Nut M20 SS304' },
          { rank: 3, score: 0.95, label: 'IOCL-BLT-001 ↔ NTPC-BLT-001', match: 'Hex Bolt M20x100' },
          { rank: 4, score: 0.94, label: 'IOCL-VLV-001 ↔ NTPC-VLV-001', match: 'Gate Valve DN150' },
          { rank: 5, score: 0.91, label: 'IOCL-MCB-001 ↔ SAIL-MCB-001', match: 'MCB 32A 1P' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="glass-panel rounded-xl p-4 flex items-center gap-4"
          >
            <div className="text-3xl font-bold text-white/30 w-8">#{item.rank}</div>
            <div className="flex-1">
              <p className="text-white font-mono text-sm">{item.label}</p>
              <p className="text-white/60 text-xs">{item.match}</p>
            </div>
            <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.score * 100}%` }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.6 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
              />
            </div>
            <div className="text-2xl font-bold text-emerald-400 w-16 text-right">
              {(item.score * 100).toFixed(0)}%
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ClassifyScene() {
  const types = [
    { name: 'EXACT', range: '≥ 85%', desc: 'Identical specification', count: 24, color: 'bg-emerald-500' },
    { name: 'NEAR_DUPLICATE', range: '78-84%', desc: 'Same material, minor variation', count: 8, color: 'bg-yellow-500' },
    { name: 'EQUIVALENT', range: '65-77%', desc: 'Functionally interchangeable', count: 12, color: 'bg-blue-500' },
    { name: 'PARTIAL', range: '< 65%', desc: 'Different material, review needed', count: 5, color: 'bg-red-500' },
  ]
  return (
    <div className="max-w-4xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
        <CheckCircle2 className="inline-block text-primary-400 mb-3" size={32} />
        <h2 className="text-4xl font-bold text-white">Match Classification</h2>
        <p className="text-white/60 mt-2">Confidence + Type for human review</p>
      </motion.div>
      <div className="grid grid-cols-2 gap-4">
        {types.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
            className="glass-panel rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-white font-bold text-lg">{t.name}</p>
              <span className={`px-3 py-1 rounded-full text-white text-sm ${t.color}`}>
                {t.range}
              </span>
            </div>
            <p className="text-white/70 text-sm mb-4">{t.desc}</p>
            <div className="flex items-end justify-between">
              <p className="text-white/50 text-xs">Matches found</p>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + i * 0.15 }}
                className="text-4xl font-bold text-white"
              >
                {t.count}
              </motion.p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function CNMCScene() {
  return (
    <div className="max-w-4xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
        <Atom className="inline-block text-accent-400 mb-3" size={32} />
        <h2 className="text-4xl font-bold text-white">Common National Material Code</h2>
        <p className="text-white/60 mt-2">Stable · Unique · Traceable</p>
      </motion.div>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-2xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <p className="text-xs text-white/50 mb-1">Input</p>
            <p className="text-white font-mono">Hex Bolt M20x100 Grade 8.8 SS304</p>
          </div>
          <ArrowRight className="text-accent-400" size={32} />
          <div className="flex-1 text-right">
            <p className="text-xs text-white/50 mb-1">CNMC Code</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="text-3xl font-bold gradient-text font-mono"
            >
              CNMC-FA-A1B2C3
            </motion.p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <p className="text-xs text-white/50">FA</p>
            <p className="text-white text-sm">Fasteners</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
            <p className="text-xs text-white/50">A1B2C3</p>
            <p className="text-white text-sm">MD5 Hash</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
            <p className="text-xs text-white/50">Stable</p>
            <p className="text-white text-sm">Same → Always</p>
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-6 grid grid-cols-3 gap-3"
      >
        {['CNMC-FA-A1B2C3', 'CNMC-PT-J1K2L3', 'CNMC-EL-P7Q8R9', 'CNMC-VF-M4N5O6', 'CNMC-BE-V4W5X6', 'CNMC-HL-S1T2U3'].map((c, i) => (
          <motion.div
            key={c}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.9 + i * 0.08 }}
            className="glass-panel rounded-lg p-3 text-center"
          >
            <p className="text-white font-mono text-sm">{c}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function DashboardScene() {
  const kpis = [
    { label: 'Materials', value: 72, icon: Database, color: 'from-blue-500 to-blue-700' },
    { label: 'CPSEs', value: 5, icon: Building2, color: 'from-purple-500 to-purple-700' },
    { label: 'Proposals', value: 49, icon: Sparkles, color: 'from-pink-500 to-rose-600' },
    { label: 'Approved', value: 12, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-700' },
  ]
  return (
    <div className="max-w-5xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">Live Dashboard</h2>
      </motion.div>
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <motion.div
              key={k.label}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel rounded-2xl p-5"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center mb-3`}>
                <Icon size={22} className="text-white" />
              </div>
              <p className="text-white/60 text-xs">{k.label}</p>
              <AnimatedCounter value={k.value} delay={200 + i * 150} />
            </motion.div>
          )
        })}
      </div>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 glass-panel rounded-2xl p-6"
      >
        <p className="text-white font-bold mb-4">Materials by Family</p>
        <div className="space-y-2">
          {[
            { name: 'Fasteners', count: 14, pct: 100 },
            { name: 'Pipes', count: 9, pct: 64 },
            { name: 'Valves', count: 7, pct: 50 },
            { name: 'Electrical', count: 9, pct: 64 },
            { name: 'Bearings', count: 5, pct: 36 },
            { name: 'Safety', count: 6, pct: 43 },
          ].map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              className="flex items-center gap-3"
            >
              <p className="text-white/70 text-xs w-24">{f.name}</p>
              <div className="flex-1 h-6 bg-dark-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${f.pct}%` }}
                  transition={{ delay: 1 + i * 0.08, duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-end pr-2"
                >
                  <span className="text-xs text-white font-bold">{f.count}</span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const startDelay = setTimeout(() => {
      const startTime = performance.now()
      const step = () => {
        const progress = Math.min((performance.now() - startTime) / 600, 1)
        setDisplay(Math.round(progress * value))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(startDelay)
  }, [value, delay])

  return <span className="text-4xl font-bold text-white">{display.toLocaleString()}</span>
}

function ReviewScene() {
  return (
    <div className="max-w-4xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
        <CheckCircle2 className="inline-block text-emerald-400 mb-3" size={32} />
        <h2 className="text-4xl font-bold text-white">Review Queue</h2>
        <p className="text-white/60 mt-2">Human-in-the-loop · One-click approve</p>
      </motion.div>
      {[
        { src: 'IOCL-BLT-001', tgt: 'SAIL-BLT-001', desc: 'Hex Bolt M20x100 SS304', score: 97, status: 'pending' },
        { src: 'IOCL-VLV-001', tgt: 'NTPC-VLV-001', desc: 'Gate Valve DN150 PN16', score: 94, status: 'approved' },
        { src: 'IOCL-CBL-001', tgt: 'SAIL-CBL-001', desc: 'XLPE Cable 3Cx70 Sqmm', score: 93, status: 'approved' },
        { src: 'IOCL-PMP-001', tgt: 'NTPC-PMP-001', desc: 'Centrifugal Pump 10HP SS316', score: 94, status: 'pending' },
      ].map((p, i) => (
        <motion.div
          key={p.src + p.tgt}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.15 }}
          className="glass-panel rounded-xl p-4 mb-3 flex items-center gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-primary-400">{p.src}</span>
              <ArrowRight size={14} className="text-white/50" />
              <span className="text-xs font-mono text-accent-400">{p.tgt}</span>
            </div>
            <p className="text-white text-sm">{p.desc}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">{p.score}%</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5 + i * 0.2, type: 'spring' }}
            className={`px-4 py-2 rounded-lg text-xs font-medium ${
              p.status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {p.status === 'approved' ? '✓ Approved' : '○ Pending'}
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

function AnalyticsScene() {
  return (
    <div className="max-w-5xl w-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
        <TrendingUp className="inline-block text-yellow-400 mb-3" size={32} />
        <h2 className="text-4xl font-bold text-white">Analytics & Savings</h2>
      </motion.div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Data Quality', value: '94%', color: 'from-emerald-500 to-green-500' },
          { label: 'CNMC Coverage', value: '72%', color: 'from-blue-500 to-cyan-500' },
          { label: 'Duplicates Removed', value: '8%', color: 'from-purple-500 to-pink-500' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.2, type: 'spring' }}
            className={`glass-panel rounded-2xl p-6 bg-gradient-to-br ${s.color}`}
          >
            <p className="text-white/80 text-sm mb-2">{s.label}</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + i * 0.2, type: 'spring' }}
              className="text-6xl font-bold text-white"
            >
              {s.value}
            </motion.p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 glass-panel rounded-2xl p-6 text-center"
      >
        <p className="text-white/60 text-sm mb-2">Estimated Annual Savings per CPSE</p>
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.4, type: 'spring' }}
          className="text-7xl font-bold gradient-text"
        >
          ₹25 Lakhs
        </motion.p>
        <p className="text-white/50 text-xs mt-2">Based on 100K materials · 5% duplicate reduction</p>
      </motion.div>
    </div>
  )
}

function OutroScene() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 1 }}
        className="w-40 h-40 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary-500 via-accent-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-accent-500/50"
      >
        <Atom size={80} className="text-white" />
      </motion.div>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-6xl font-bold text-white mb-4"
      >
        One Nation
      </motion.h1>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-6xl font-bold gradient-text mb-6"
      >
        One Material Code
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-white/60 text-lg"
      >
        NUMMF · SIH 2026 · Problem ID 26099
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mt-8 max-w-md mx-auto"
      />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-6 flex items-center justify-center gap-4 text-sm text-white/50"
      >
        <span>Ministry of Petroleum & Natural Gas</span>
        <span>•</span>
        <span>CPCL</span>
      </motion.div>
    </div>
  )
}
