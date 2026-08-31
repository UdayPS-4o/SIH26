import { useState, useMemo } from 'react'
import { useDemoEngine } from '@/store/demo'
import { Search, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const CPSE_FILTERS = ['ALL', 'IOCL', 'NTPC', 'SAIL', 'CIL'] as const
const STATUS_FILTERS = ['ALL', 'HARMONIZED', 'DUPLICATE', 'ACTIVE'] as const

export default function MaterialsPage() {
  const { sources, matches } = useDemoEngine()
  const [selectedCpse, setSelectedCpse] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Generate enriched material items linked with CNMC codes
  const allMaterials = useMemo(() => {
    const items: any[] = []
    const families = ['Fasteners', 'Pipes & Tubes', 'Valves & Fittings', 'Electrical', 'Bearings', 'Pumps & Comp', 'Structural Steel', 'Welding', 'Safety & PPE']
    const standards = ['IS 1364', 'IS 1239', 'IS 5428', 'IS 1554', 'ISO 281', 'IS 15224', 'IS 2062', 'IS 814', 'IS 2925']

    sources.forEach((src) => {
      const rows = src.rows || src.rowCount || 50
      for (let i = 0; i < Math.min(rows, 60); i++) {
        const family = families[i % families.length]
        const std = standards[i % standards.length]
        const isDup = i % 6 === 0
        const match = matches.find(m => m.sourceCode.startsWith(src.short) || m.targetCode.startsWith(src.short))
        const cnmc = (i % 2 === 0 || match) ? (match?.cnmcCode || `CNMC-${family.substring(0, 2).toUpperCase()}-${Math.abs(hashIt(i + src.short)).toString(36).substring(0, 4).toUpperCase()}`) : null

        items.push({
          id: `${src.short}-${1000 + i}`,
          code: `${src.short}-MAT-${String(1000 + i).padStart(5, '0')}`,
          description: getItemDescription(family, i, std),
          org: src.short,
          orgName: src.name,
          icon: src.icon,
          system: src.system,
          family,
          standard: std,
          isDuplicate: isDup,
          status: isDup ? 'DUPLICATE' : cnmc ? 'HARMONIZED' : 'ACTIVE',
          cnmcCode: cnmc,
        })
      }
    })
    return items
  }, [sources, matches])

  const filtered = useMemo(() => {
    return allMaterials.filter(m => {
      if (selectedCpse !== 'ALL' && m.org !== selectedCpse) return false
      if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          m.code.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.family.toLowerCase().includes(q) ||
          (m.cnmcCode && m.cnmcCode.toLowerCase().includes(q)) ||
          m.standard.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allMaterials, selectedCpse, selectedStatus, searchQuery])

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied "${text}" to clipboard`)
  }

  return (
    <div className="h-full flex flex-col bg-dark-950 p-6 space-y-4 overflow-hidden select-none">
      {/* Control Bar: Search & Filters */}
      <div className="glass-card p-4 rounded-xl border border-dark-700 bg-dark-900/80 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search by description, material code, IS standard, or CNMC..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-850 border border-dark-700 rounded-lg text-xs text-white placeholder-dark-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* CPSE Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-dark-400 mr-1 font-mono">CPSE:</span>
          {CPSE_FILTERS.map(cpse => (
            <button
              key={cpse}
              onClick={() => setSelectedCpse(cpse)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                selectedCpse === cpse
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'bg-dark-850 text-dark-400 hover:text-white border border-dark-700'
              }`}
            >
              {cpse}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-dark-400 mr-1 font-mono">STATUS:</span>
          {STATUS_FILTERS.map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                selectedStatus === st
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                  : 'bg-dark-850 text-dark-400 hover:text-white border border-dark-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Table Card */}
      <div className="flex-1 glass-card rounded-xl border border-dark-700 bg-dark-900/80 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-dark-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider">Indexed CPSE Catalog</span>
            <span className="px-2 py-0.5 rounded-full bg-dark-800 border border-dark-700 text-dark-300 font-mono">
              Showing {filtered.length} of {allMaterials.length} items
            </span>
          </div>
          <span className="text-dark-400 font-mono text-[11px]">Auto-normalized via Sentence-BERT + IS/ASTM Lexicon</span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-dark-850/95 backdrop-blur border-b border-dark-700 text-dark-400 font-medium z-10">
              <tr>
                <th className="py-3 px-4">CPSE Source</th>
                <th className="py-3 px-4">Internal Material Code</th>
                <th className="py-3 px-4">Technical Description</th>
                <th className="py-3 px-4">Material Family</th>
                <th className="py-3 px-4">Technical Standard</th>
                <th className="py-3 px-4">Unified CNMC Code</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60 font-mono text-[11px]">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-dark-800/40 transition">
                  <td className="py-3 px-4 font-sans">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-dark-800 border border-dark-700 text-white font-medium">
                      <span>{m.icon}</span>
                      <span>{m.org}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-dark-200 font-semibold">{m.code}</td>
                  <td className="py-3 px-4 font-sans text-white max-w-xs truncate">{m.description}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700 text-dark-300">
                      {m.family}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-primary-400 font-medium">{m.standard}</td>
                  <td className="py-3 px-4">
                    {m.cnmcCode ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                          {m.cnmcCode}
                        </span>
                        <button
                          onClick={() => copyCode(m.cnmcCode)}
                          className="p-1 text-dark-400 hover:text-white transition"
                          title="Copy"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-dark-500 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {m.status === 'HARMONIZED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                        HARMONIZED
                      </span>
                    ) : m.status === 'DUPLICATE' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                        DUPLICATE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-dark-800 border border-dark-700 text-dark-400 text-[10px]">
                        ACTIVE
                      </span>
                    )}
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

function getItemDescription(family: string, i: number, std: string): string {
  const samples: Record<string, string[]> = {
    Fasteners: [
      `Hex Bolt M20x100 Grade 8.8 SS304 ${std}`,
      `Hex Nut M20 SS304 Full Thread ${std}`,
      `Stud Bolt M24x120 ASTM A193 B7 Heavy Hex`,
      `Socket Head Cap Screw M12x50 SS316 ${std}`,
    ],
    'Pipes & Tubes': [
      `CS Pipe SCH40 100NB Seamless ${std}`,
      `Carbon Steel Heavy Pipe 150NB SCH80 ${std}`,
      `SS304 Seamless Tube 25NBx6M Length`,
    ],
    'Valves & Fittings': [
      `Gate Valve DN150 PN16 Flanged SS304 Body ${std}`,
      `Spiral Wound Gasket 100NB PN40 ASME B16.20`,
      `Ball Valve 50NB Class 300 Full Bore`,
    ],
    Electrical: [
      `XLPE Power Cable 3.5C x 185 Sqmm 1.1kV ${std}`,
      `Control Cable 4 Core x 2.5 Sqmm Copper Armoured`,
      `Single Pole MCB 32A 10kA C-Curve IS:8828`,
    ],
    Bearings: [
      `Deep Groove Ball Bearing 6205-2RS C3 SKF ISO:281`,
      `Spherical Roller Bearing 22212 E/W33 C3`,
      `Taper Roller Bearing 30208 Steel Cage`,
    ],
    'Pumps & Comp': [
      `Centrifugal Pump 10HP SS316 Body 100NB ${std}`,
      `End Suction Water Pump 15kW IE3 Motor`,
    ],
    'Structural Steel': [
      `MS Angle Equal 50x50x6mm 6M ${std}`,
      `ISMB 150 Structural Steel Beam 6M Length`,
    ],
    Welding: [
      `Welding Electrode E6013 3.15mm 5kg Pack ${std}`,
      `Low Hydrogen Electrode E7018 4.00mm IS:814`,
    ],
    'Safety & PPE': [
      `Industrial Safety Helmet HDPE White ISI Marked ${std}`,
      `Chemical Safety Goggles Anti-Fog Polycarbonate`,
    ],
  }

  const list = samples[family] || samples.Fasteners
  return list[i % list.length]
}

function hashIt(n: string): number {
  let h = 0
  for (let i = 0; i < n.length; i++) {
    h = (h << 5) - h + n.charCodeAt(i)
    h |= 0
  }
  return h
}
