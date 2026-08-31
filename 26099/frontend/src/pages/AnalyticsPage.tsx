import { useMemo } from 'react'
import { useDemoEngine, formatNumber } from '@/store/demo'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts'
import { TrendingUp } from 'lucide-react'

export default function AnalyticsPage() {
  const { sources, matches } = useDemoEngine()

  const familyData = useMemo(() => [
    { name: 'Fasteners', count: 48500, cnmc: 420 },
    { name: 'Pipes & Tubes', count: 39200, cnmc: 310 },
    { name: 'Valves & Fit.', count: 34100, cnmc: 280 },
    { name: 'Electrical', count: 29800, cnmc: 260 },
    { name: 'Bearings', count: 24500, cnmc: 190 },
    { name: 'Pumps & Comp', count: 21000, cnmc: 170 },
    { name: 'Structural', count: 18200, cnmc: 140 },
    { name: 'Safety & PPE', count: 12400, cnmc: 90 },
  ], [])

  const confidenceData = useMemo(() => {
    const high = matches.filter(m => m.confidence === 'HIGH').length || 6
    const med = matches.filter(m => m.confidence === 'MEDIUM').length || 3
    const low = matches.filter(m => m.confidence === 'LOW').length || 1
    return [
      { name: 'High Confidence (>90%)', value: high, color: '#10b981' },
      { name: 'Medium Confidence (75-90%)', value: med, color: '#f59e0b' },
      { name: 'Low / Distinct (<75%)', value: low, color: '#ef4444' },
    ]
  }, [matches])

  const cpseComparisonData = useMemo(() => {
    return sources.map(s => ({
      name: s.short,
      total: s.rows || s.rowCount,
      duplicates: s.duplicates || Math.round(s.rowCount * s.dupRate),
      rate: Number((s.dupRate * 100).toFixed(1)),
    }))
  }, [sources])

  return (
    <div className="h-full flex flex-col bg-dark-950 p-6 space-y-6 overflow-y-auto select-none">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-blue-500/20 bg-dark-900/80">
          <div className="text-xs text-dark-400 font-medium">Harmonization Coverage</div>
          <div className="text-2xl font-black text-white font-mono mt-1">84.1%</div>
          <div className="text-[11px] text-blue-400 mt-1 flex items-center gap-1 font-medium">
            <span>274.2K Unique Master Items</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-dark-900/80">
          <div className="text-xs text-dark-400 font-medium">Redundancy Reduction</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">15.9%</div>
          <div className="text-[11px] text-dark-400 mt-1">51.8K Duplicate SKUs Merged</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-dark-900/80">
          <div className="text-xs text-dark-400 font-medium">Procurement Synergies</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">₹48.6 Cr</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium">Annual estimated cost saving</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-purple-500/20 bg-dark-900/80">
          <div className="text-xs text-dark-400 font-medium">Unified CNMC Codes</div>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">1,840</div>
          <div className="text-[11px] text-dark-400 mt-1">Active in national registry</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Family Distribution */}
        <div className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Material Volume by Industrial Family
            </h3>
            <p className="text-xs text-dark-400">Total catalog items vs Assigned CNMC codes</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={familyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0b101d', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Confidence Distribution */}
        <div className="glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              AI Matching Confidence Distribution
            </h3>
            <p className="text-xs text-dark-400">Multi-stage Bi-Encoder and Cross-Encoder score ratings</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={confidenceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {confidenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0b101d', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CPSE Breakdown & Financial Synergy Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CPSE Duplicate Rate Comparison */}
        <div className="lg:col-span-2 glass-card p-5 rounded-xl border border-dark-700 bg-dark-900/80 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              CPSE Ingestion & Duplicate Analysis
            </h3>
            <p className="text-xs text-dark-400">Total volume vs detected duplicate rate per PSU</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {cpseComparisonData.map(c => (
              <div key={c.name} className="p-3 rounded-lg bg-dark-850 border border-dark-700/80 space-y-2">
                <div className="text-sm font-bold text-white font-mono">{c.name}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-dark-400">
                    <span>Records:</span>
                    <span className="font-mono text-white font-semibold">{formatNumber(c.total)}</span>
                  </div>
                  <div className="flex justify-between text-dark-400">
                    <span>Duplicates:</span>
                    <span className="font-mono text-amber-400 font-semibold">{formatNumber(c.duplicates)}</span>
                  </div>
                  <div className="flex justify-between text-dark-400">
                    <span>Dup Rate:</span>
                    <span className="font-mono text-primary-400 font-semibold">{c.rate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Government Savings Breakdown Card */}
        <div className="glass-card p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-dark-900 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={15} />
              <span>Projected Savings Model</span>
            </h3>
            <p className="text-xs text-dark-400">Government of India PSU Synergy</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded-lg bg-dark-850/80 border border-dark-700">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Bulk Rate Synergy</span>
                <span className="text-emerald-400 font-mono">₹28.4 Cr</span>
              </div>
              <p className="text-[11px] text-dark-400 mt-0.5">Aggregated cross-CPSE procurement volumes</p>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-850/80 border border-dark-700">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Holding Cost Reduction</span>
                <span className="text-emerald-400 font-mono">₹14.2 Cr</span>
              </div>
              <p className="text-[11px] text-dark-400 mt-0.5">Inter-CPSE emergency spares sharing</p>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-850/80 border border-dark-700">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Catalog Deduplication</span>
                <span className="text-emerald-400 font-mono">₹6.0 Cr</span>
              </div>
              <p className="text-[11px] text-dark-400 mt-0.5">Elimination of redundant SKU maintenance</p>
            </div>

            <div className="pt-2 border-t border-dark-700 flex justify-between items-center text-sm font-bold">
              <span className="text-white">Total Annual Benefit:</span>
              <span className="text-emerald-400 font-mono text-base">₹48.6 Cr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
