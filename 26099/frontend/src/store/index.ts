import { create } from 'zustand'
import axios from 'axios'

const API_BASE = '/api/v1'
const IS_DEMO = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')

const realApi = axios.create({ baseURL: API_BASE })
realApi.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface Organization { id: number; name: string; short_code: string; sector?: string; material_count?: number }
interface Material { id: number; cpse_organization_id: number; cpse_material_code: string; description: string; family: string; sub_family?: string; material_type?: string; grade?: string; standard_code?: string; dimensions?: string; unit_of_measure?: string; is_duplicate?: boolean; confidence_score?: number; organization?: { name: string; short_code: string }; cnmc?: { code: string; description: string } }
interface DashboardStats { kpis: Record<string, number>; by_family: { family: string; count: number }[]; by_cpse: { name: string; count: number }[]; matching: Record<string, number> }
interface MatchProposal { id: number; source_material_id: number; target_material_id: number; source_code?: string; source_description?: string; target_code?: string; target_description?: string; overall_score: number; semantic_score?: number; lexical_score?: number; numeric_score?: number; reranker_score?: number; match_type: string; confidence_level: string; explanation?: string; differences?: string[]; status: string; review_comment?: string; created_at?: string }

interface AppState {
  isDemo: boolean
  auth: { user: any | null; isAuthenticated: boolean; login: (u: string, p: string) => Promise<void>; logout: () => void }
  materials: { materials: Material[]; loading: boolean; fetch: () => Promise<void>; add: (m: any) => Promise<void> }
  dashboard: { stats: DashboardStats | null; loading: boolean; fetch: () => Promise<void> }
  matching: { proposals: MatchProposal[]; summary: any; loading: boolean; fetchProposals: () => Promise<void>; review: (id: number, action: string, comment?: string) => Promise<void>; detectDuplicates: (threshold?: number) => Promise<any>; matchQuery: (desc: string) => Promise<any>; runPipeline: (sourceId: number, targetId: number) => Promise<MatchProposal[]>; pipelineRunning: boolean; pipelineProgress: number }
  organizations: { list: Organization[]; create: (name: string, shortCode: string) => Promise<void>; fetch: () => Promise<void> }
}

const demoMaterials: Material[] = [
  { id: 1, cpse_organization_id: 1, cpse_material_code: 'IOCL-BLT-001', description: 'Hex Bolt M20x100 Grade 8.8 SS304', family: 'fasteners', grade: '8.8', standard_code: 'IS 1364', dimensions: 'M20x100', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 2, cpse_organization_id: 1, cpse_material_code: 'IOCL-BLT-002', description: 'Hex Bolt M16x80 Grade 8.8 SS304', family: 'fasteners', grade: '8.8', standard_code: 'IS 1364', dimensions: 'M16x80', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 3, cpse_organization_id: 1, cpse_material_code: 'IOCL-NUT-001', description: 'Hex Nut M20 Grade 8.8 SS304', family: 'fasteners', grade: '8.8', standard_code: 'IS 1363', dimensions: 'M20', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 4, cpse_organization_id: 1, cpse_material_code: 'IOCL-PIP-001', description: 'Carbon Steel Pipe SCH40 100NBx6M IS:1239', family: 'pipes_tubes', grade: 'CS', standard_code: 'IS 1239', dimensions: '100NBx6M', unit_of_measure: 'MTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 5, cpse_organization_id: 1, cpse_material_code: 'IOCL-VLV-001', description: 'Gate Valve DN150 PN16 Flanged SS304', family: 'valves_fittings', grade: '304', standard_code: 'IS 5428', dimensions: 'DN150', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 6, cpse_organization_id: 1, cpse_material_code: 'IOCL-CBL-001', description: 'XLPE Power Cable 3Cx70 Sqmm 1.1kV', family: 'electrical', grade: 'Cu', standard_code: 'IS 1554', dimensions: '3Cx70', unit_of_measure: 'MTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 7, cpse_organization_id: 1, cpse_material_code: 'IOCL-HYO-001', description: 'Hydraulic Oil ISO VG 46 200L Drum', family: 'hydraulics_lubricants', grade: 'VG46', dimensions: '200L', unit_of_measure: 'LTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 8, cpse_organization_id: 1, cpse_material_code: 'IOCL-BRG-001', description: 'Deep Groove Ball Bearing 6205-2RS', family: 'bearings', grade: '6205', standard_code: 'ISO 281', dimensions: '25x52x15', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 9, cpse_organization_id: 1, cpse_material_code: 'IOCL-PRG-001', description: 'Pressure Gauge 0-10 Bar 100mm Dial SS', family: 'instruments', grade: 'SS', standard_code: 'IS 2176', dimensions: '100mm', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 10, cpse_organization_id: 1, cpse_material_code: 'IOCL-ANG-001', description: 'MS Angle 50x50x6mm 6M', family: 'structural_steel', grade: 'E250A', standard_code: 'IS 808', dimensions: '50x50x6', unit_of_measure: 'MTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 11, cpse_organization_id: 1, cpse_material_code: 'IOCL-ELC-001', description: 'ERW Electrode E6013 3.15mm 5kg', family: 'welding', grade: 'E6013', standard_code: 'IS 814', dimensions: '3.15mm', unit_of_measure: 'KG', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 12, cpse_organization_id: 1, cpse_material_code: 'IOCL-HLM-001', description: 'Safety Helmet White ISI Marked', family: 'safety_ppe', grade: 'General', standard_code: 'IS 2925', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 13, cpse_organization_id: 1, cpse_material_code: 'IOCL-PMP-001', description: 'Centrifugal Pump 10HP SS316', family: 'pumps_comp', grade: 'SS316', standard_code: 'IS 15224', dimensions: '100NB', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 14, cpse_organization_id: 1, cpse_material_code: 'IOCL-ACD-001', description: 'Sulphuric Acid 98% 50L Drum', family: 'chemicals', grade: '98%', standard_code: 'IS 266', dimensions: '50L', unit_of_measure: 'LTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 15, cpse_organization_id: 2, cpse_material_code: 'NTPC-BLT-001', description: 'Hexagonal Bolt M20x100 8.8 SS', family: 'fasteners', grade: '8.8', standard_code: 'IS 1364', dimensions: 'M20x100', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 16, cpse_organization_id: 2, cpse_material_code: 'NTPC-BLT-002', description: 'Hexagonal Bolt M16x80 8.8 SS', family: 'fasteners', grade: '8.8', standard_code: 'IS 1364', dimensions: 'M16x80', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 17, cpse_organization_id: 2, cpse_material_code: 'NTPC-NUT-001', description: 'Hex Nut M20 8.8 SS304', family: 'fasteners', grade: '8.8', standard_code: 'IS 1363', dimensions: 'M20', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 18, cpse_organization_id: 2, cpse_material_code: 'NTPC-PIP-001', description: 'CS Pipe SCH40 100NB IS:1239 Seamless', family: 'pipes_tubes', grade: 'CS', standard_code: 'IS 1239', dimensions: '100NBx6M', unit_of_measure: 'MTR', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 19, cpse_organization_id: 2, cpse_material_code: 'NTPC-VLV-001', description: 'Gate Valve 150mm PN16 Flanged SS304', family: 'valves_fittings', grade: '304', standard_code: 'IS 5428', dimensions: 'DN150', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 20, cpse_organization_id: 2, cpse_material_code: 'NTPC-CBL-001', description: 'Power Cable 3Core 70mm 1.1kV XLPE', family: 'electrical', grade: 'Cu', standard_code: 'IS 1554', dimensions: '3Cx70', unit_of_measure: 'MTR', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 21, cpse_organization_id: 2, cpse_material_code: 'NTPC-PRG-001', description: 'Pressure Gauge 0-10 Bar 100mm SS Case', family: 'instruments', grade: 'SS', standard_code: 'IS 2176', dimensions: '100mm', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 22, cpse_organization_id: 2, cpse_material_code: 'NTPC-HLM-001', description: 'Safety Helmet Red ISI Marked', family: 'safety_ppe', grade: 'General', standard_code: 'IS 2925', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 23, cpse_organization_id: 2, cpse_material_code: 'NTPC-PMP-001', description: 'Centrifugal Pump 10 HP SS316 Body', family: 'pumps_comp', grade: 'SS316', standard_code: 'IS 15224', dimensions: '100NB', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 24, cpse_organization_id: 2, cpse_material_code: 'NTPC-HYO-001', description: 'Hydraulic Fluid VG 46 200L', family: 'hydraulics_lubricants', grade: 'VG46', dimensions: '200L', unit_of_measure: 'LTR', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 25, cpse_organization_id: 3, cpse_material_code: 'SAIL-BLT-001', description: 'Hex Bolt M20x100 SS304 Grade 8.8', family: 'fasteners', grade: '8.8', standard_code: 'IS 1364', dimensions: 'M20x100', unit_of_measure: 'NOS', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 26, cpse_organization_id: 3, cpse_material_code: 'SAIL-NUT-001', description: 'Hex Nut M20 SS304 Grade 8.8', family: 'fasteners', grade: '8.8', standard_code: 'IS 1363', dimensions: 'M20', unit_of_measure: 'NOS', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 27, cpse_organization_id: 3, cpse_material_code: 'SAIL-PIP-001', description: 'CS Seamless Pipe 100NB SCH40 IS:1239', family: 'pipes_tubes', grade: 'CS', standard_code: 'IS 1239', dimensions: '100NBx6M', unit_of_measure: 'MTR', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 28, cpse_organization_id: 3, cpse_material_code: 'SAIL-ANG-001', description: 'MS Angle Equal 50x50x6mm 6mtr', family: 'structural_steel', grade: 'E250A', standard_code: 'IS 808', dimensions: '50x50x6', unit_of_measure: 'MTR', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 29, cpse_organization_id: 3, cpse_material_code: 'SAIL-BRG-001', description: 'Deep Groove Ball Bearing 6205-2RS SKF', family: 'bearings', grade: '6205', standard_code: 'ISO 281', dimensions: '25x52x15', unit_of_measure: 'NOS', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 30, cpse_organization_id: 3, cpse_material_code: 'SAIL-CBL-001', description: 'XLPE Cable 3x70sqmm 1.1kV', family: 'electrical', grade: 'Cu', standard_code: 'IS 1554', dimensions: '3Cx70', unit_of_measure: 'MTR', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 31, cpse_organization_id: 3, cpse_material_code: 'SAIL-PMP-001', description: 'Centrifugal Pump SS316 10HP', family: 'pumps_comp', grade: 'SS316', standard_code: 'IS 15224', dimensions: '100NB', unit_of_measure: 'NOS', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 32, cpse_organization_id: 3, cpse_material_code: 'SAIL-ELC-001', description: 'Welding Electrode E6013 3.15mm', family: 'welding', grade: 'E6013', standard_code: 'IS 814', dimensions: '3.15mm', unit_of_measure: 'KG', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 33, cpse_organization_id: 3, cpse_material_code: 'SAIL-MCB-001', description: 'MCB 32Amp Single Pole 6kA', family: 'electrical', grade: 'Cu', standard_code: 'IS 8828', dimensions: '32A', unit_of_measure: 'NOS', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 34, cpse_organization_id: 4, cpse_material_code: 'CIL-VLV-001', description: 'Gate Valve DN150 PN16 Cast Steel', family: 'valves_fittings', grade: 'CS', standard_code: 'IS 5428', dimensions: 'DN150', unit_of_measure: 'NOS', organization: { name: 'Coal India Limited', short_code: 'CIL' } },
  { id: 35, cpse_organization_id: 4, cpse_material_code: 'CIL-HLM-001', description: 'Safety Helmet Yellow ISI', family: 'safety_ppe', grade: 'General', standard_code: 'IS 2925', unit_of_measure: 'NOS', organization: { name: 'Coal India Limited', short_code: 'CIL' } },
  { id: 36, cpse_organization_id: 4, cpse_material_code: 'CIL-ACD-001', description: 'Hydrochloric Acid 30% 50L', family: 'chemicals', grade: '30%', standard_code: 'IS 265', dimensions: '50L', unit_of_measure: 'LTR', organization: { name: 'Coal India Limited', short_code: 'CIL' } },
  { id: 37, cpse_organization_id: 5, cpse_material_code: 'HEC-ELC-001', description: 'Electrode E7018 4mm 5kg', family: 'welding', grade: 'E7018', standard_code: 'IS 814', dimensions: '4mm', unit_of_measure: 'KG', organization: { name: 'Heavy Engineering Corporation', short_code: 'HEC' } },
  { id: 38, cpse_organization_id: 2, cpse_material_code: 'NTPC-LLB-001', description: 'LED Light 36W Round Panel', family: 'electrical', grade: 'Al', standard_code: 'IS 3043', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 39, cpse_organization_id: 2, cpse_material_code: 'NTPC-CBL-002', description: 'Control Cable 4x2.5mm 1.1kV', family: 'electrical', grade: 'Cu', standard_code: 'IS 1554', dimensions: '4Cx2.5', unit_of_measure: 'MTR', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 40, cpse_organization_id: 2, cpse_material_code: 'NTPC-GSK-001', description: 'Gasket Spiral Wound 150mm SS304', family: 'valves_fittings', grade: '304', standard_code: 'ASME B16.20', dimensions: '150NB', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 41, cpse_organization_id: 2, cpse_material_code: 'NTPC-VLV-002', description: 'Ball Valve DN50 PN40 Threaded SS316', family: 'valves_fittings', grade: '316', standard_code: 'IS 5428', dimensions: 'DN50', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 42, cpse_organization_id: 1, cpse_material_code: 'IOCL-GSK-001', description: 'Spiral Wound Gasket 150NB SS304 + Graphite', family: 'valves_fittings', grade: '304', standard_code: 'ASME B16.20', dimensions: '150NB', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 43, cpse_organization_id: 1, cpse_material_code: 'IOCL-CPT-001', description: 'Copper Tube 15NBx5M Soft Annealed', family: 'pipes_tubes', grade: 'Cu', standard_code: 'ASTM B280', dimensions: '15NBx5M', unit_of_measure: 'MTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 44, cpse_organization_id: 1, cpse_material_code: 'IOCL-CBL-002', description: 'Control Cable 4Cx2.5 Sqmm 1.1kV', family: 'electrical', grade: 'Cu', standard_code: 'IS 1554', dimensions: '4Cx2.5', unit_of_measure: 'MTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 45, cpse_organization_id: 1, cpse_material_code: 'IOCL-PIP-002', description: 'Carbon Steel Pipe SCH80 50NBx6M', family: 'pipes_tubes', grade: 'CS', standard_code: 'IS 1239', dimensions: '50NBx6M', unit_of_measure: 'MTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 46, cpse_organization_id: 1, cpse_material_code: 'IOCL-MCB-001', description: 'MCB 32A 1P 6kA', family: 'electrical', grade: 'Cu', standard_code: 'IS 8828', dimensions: '32A', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 47, cpse_organization_id: 1, cpse_material_code: 'IOCL-GRE-001', description: 'Grease Lithium EP2 180kg Drum', family: 'hydraulics_lubricants', grade: 'EP2', standard_code: 'ISO 12924', dimensions: '180kg', unit_of_measure: 'KG', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 48, cpse_organization_id: 1, cpse_material_code: 'IOCL-WSH-001', description: 'Plain Washer M20 SS304', family: 'fasteners', grade: '304', standard_code: 'IS 2016', dimensions: 'M20', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 49, cpse_organization_id: 1, cpse_material_code: 'IOCL-ANB-001', description: 'Anchor Bolt M24x500 Grade 8.8', family: 'fasteners', grade: '8.8', standard_code: 'IS 1364', dimensions: 'M24x500', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 50, cpse_organization_id: 3, cpse_material_code: 'SAIL-PLT-001', description: 'MS Plate 10mm 1x2M IS:2062', family: 'structural_steel', grade: 'E250A', standard_code: 'IS 2062', dimensions: '10mm', unit_of_measure: 'SHT', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 51, cpse_organization_id: 3, cpse_material_code: 'SAIL-BBM-001', description: 'MS Beam 150x75x6mm 6M', family: 'structural_steel', grade: 'E250A', standard_code: 'IS 808', dimensions: '150x75x6', unit_of_measure: 'MTR', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 52, cpse_organization_id: 3, cpse_material_code: 'SAIL-TUB-001', description: 'SS304 Tube 15NBx5M', family: 'pipes_tubes', grade: '304', standard_code: 'ASTM A269', dimensions: '15NBx5M', unit_of_measure: 'MTR', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 53, cpse_organization_id: 3, cpse_material_code: 'SAIL-RVT-001', description: 'Rivet 8mm SS304', family: 'fasteners', grade: '304', standard_code: 'IS 2155', dimensions: '8mm', unit_of_measure: 'NOS', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 54, cpse_organization_id: 3, cpse_material_code: 'SAIL-BRG-002', description: 'Spherical Roller Bearing 22212', family: 'bearings', grade: '22212', standard_code: 'ISO 281', dimensions: '60x110x28', unit_of_measure: 'NOS', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 55, cpse_organization_id: 4, cpse_material_code: 'CIL-FLG-001', description: 'Flange 150NB PN16 Slip-On WN RF', family: 'valves_fittings', grade: 'CS', standard_code: 'IS 2048', dimensions: '150NB', unit_of_measure: 'NOS', organization: { name: 'Coal India Limited', short_code: 'CIL' } },
  { id: 56, cpse_organization_id: 2, cpse_material_code: 'NTPC-PIP-003', description: 'GI Pipe 25NBx3M', family: 'pipes_tubes', grade: 'GI', standard_code: 'IS 1239', dimensions: '25NBx3M', unit_of_measure: 'MTR', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 57, cpse_organization_id: 2, cpse_material_code: 'NTPC-STU-001', description: 'Stud Bolt M20x80 Grade 8.8', family: 'fasteners', grade: '8.8', standard_code: 'IS 1364', dimensions: 'M20x80', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 58, cpse_organization_id: 2, cpse_material_code: 'NTPC-THS-001', description: 'Temperature Transmitter RTD PT100', family: 'instruments', grade: 'PT100', standard_code: 'IEC 60751', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 59, cpse_organization_id: 2, cpse_material_code: 'NTPC-GRE-001', description: 'Grease Lithium EP 2 180kg', family: 'hydraulics_lubricants', grade: 'EP2', standard_code: 'ISO 12924', dimensions: '180kg', unit_of_measure: 'KG', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 60, cpse_organization_id: 1, cpse_material_code: 'IOCL-THG-001', description: 'Thermowell Assembly SS304 1/2 BSP', family: 'instruments', grade: '304', standard_code: 'ASME PTC 19.3', dimensions: '1/2 BSP', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 61, cpse_organization_id: 1, cpse_material_code: 'IOCL-FLS-001', description: 'Rotameter 25mm SS304 0-100 LPM', family: 'instruments', grade: '304', standard_code: 'IS 2403', dimensions: '25mm', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 62, cpse_organization_id: 1, cpse_material_code: 'IOCL-DRM-001', description: 'Steel Drum 210L UN Approved', family: 'packaging', grade: 'MS', standard_code: 'IS 5845', dimensions: '210L', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 63, cpse_organization_id: 2, cpse_material_code: 'NTPC-PAL-001', description: 'HDPE Pallet 1200x800mm', family: 'packaging', grade: 'FG', standard_code: 'IS 7954', dimensions: '1200x800', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 64, cpse_organization_id: 2, cpse_material_code: 'NTPC-SCR-001', description: 'Socket Head Cap Screw M12x40 SS304', family: 'fasteners', grade: '304', standard_code: 'ISO 4762', dimensions: 'M12x40', unit_of_measure: 'NOS', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 65, cpse_organization_id: 2, cpse_material_code: 'NTPC-GAO-001', description: 'Gear Oil VG 220 210L Drum', family: 'hydraulics_lubricants', grade: 'VG220', standard_code: 'ISO 6743', dimensions: '210L', unit_of_measure: 'LTR', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 66, cpse_organization_id: 1, cpse_material_code: 'IOCL-HYO-002', description: 'Turbine Oil ISO VG 32 210L Drum', family: 'hydraulics_lubricants', grade: 'VG32', standard_code: 'ISO 6743', dimensions: '210L', unit_of_measure: 'LTR', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 67, cpse_organization_id: 2, cpse_material_code: 'NTPC-ACD-001', description: 'Sulphuric Acid 98%', family: 'chemicals', grade: '98%', standard_code: 'IS 266', dimensions: '50L', unit_of_measure: 'LTR', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 68, cpse_organization_id: 1, cpse_material_code: 'IOCL-BAR-001', description: 'HDPE Barrel 200L Food Grade', family: 'packaging', grade: 'FG', standard_code: 'IS 10146', dimensions: '200L', unit_of_measure: 'NOS', organization: { name: 'Indian Oil Corporation Limited', short_code: 'IOCL' } },
  { id: 69, cpse_organization_id: 3, cpse_material_code: 'SAIL-SHT-001', description: 'GI Sheet 22SWG 1x2M', family: 'structural_steel', grade: 'GI', standard_code: 'IS 277', dimensions: '1x2M', unit_of_measure: 'SHT', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
  { id: 70, cpse_organization_id: 2, cpse_material_code: 'NTPC-PIP-003', description: 'GI Pipe 25NBx3M', family: 'pipes_tubes', grade: 'GI', standard_code: 'IS 1239', dimensions: '25NBx3M', unit_of_measure: 'MTR', organization: { name: 'NTPC Limited', short_code: 'NTPC' } },
  { id: 71, cpse_organization_id: 4, cpse_material_code: 'CIL-VLV-001', description: 'Gate Valve DN150 PN16 Cast Steel', family: 'valves_fittings', grade: 'CS', standard_code: 'IS 5428', dimensions: 'DN150', unit_of_measure: 'NOS', organization: { name: 'Coal India Limited', short_code: 'CIL' } },
  { id: 72, cpse_organization_id: 3, cpse_material_code: 'SAIL-VLV-001', description: 'Gate Valve DN150 Flanged CS', family: 'valves_fittings', grade: 'CS', standard_code: 'IS 5428', dimensions: 'DN150', unit_of_measure: 'NOS', organization: { name: 'Steel Authority of India', short_code: 'SAIL' } },
]

const demoProposals: MatchProposal[] = [
  { id: 1, source_material_id: 1, target_material_id: 15, source_code: 'IOCL-BLT-001', source_description: 'Hex Bolt M20x100 Grade 8.8 SS304', target_code: 'NTPC-BLT-001', target_description: 'Hexagonal Bolt M20x100 8.8 SS', overall_score: 0.96, semantic_score: 0.96, lexical_score: 0.95, numeric_score: 0.95, reranker_score: 0.96, match_type: 'exact', confidence_level: 'high', explanation: 'Identical spec across CPSEs', differences: [], status: 'approved' },
  { id: 2, source_material_id: 2, target_material_id: 16, source_code: 'IOCL-BLT-002', source_description: 'Hex Bolt M16x80 Grade 8.8 SS304', target_code: 'NTPC-BLT-002', target_description: 'Hexagonal Bolt M16x80 8.8 SS', overall_score: 0.96, semantic_score: 0.95, lexical_score: 0.95, numeric_score: 0.95, reranker_score: 0.96, match_type: 'exact', confidence_level: 'high', explanation: 'Identical spec', differences: [], status: 'approved' },
  { id: 3, source_material_id: 3, target_material_id: 17, source_code: 'IOCL-NUT-001', source_description: 'Hex Nut M20 Grade 8.8 SS304', target_code: 'NTPC-NUT-001', target_description: 'Hex Nut M20 8.8 SS304', overall_score: 0.95, semantic_score: 0.96, lexical_score: 0.95, numeric_score: 0.95, reranker_score: 0.95, match_type: 'exact', confidence_level: 'high', explanation: 'Identical spec', differences: [], status: 'approved' },
  { id: 4, source_material_id: 4, target_material_id: 18, source_code: 'IOCL-PIP-001', source_description: 'Carbon Steel Pipe SCH40 100NBx6M IS:1239', target_code: 'NTPC-PIP-001', target_description: 'CS Pipe SCH40 100NB IS:1239 Seamless', overall_score: 0.95, semantic_score: 0.94, lexical_score: 0.93, numeric_score: 0.95, reranker_score: 0.95, match_type: 'exact', confidence_level: 'high', explanation: 'Same pipe spec', differences: [], status: 'approved' },
  { id: 5, source_material_id: 5, target_material_id: 19, source_code: 'IOCL-VLV-001', source_description: 'Gate Valve DN150 PN16 Flanged SS304', target_code: 'NTPC-VLV-001', target_description: 'Gate Valve 150mm PN16 Flanged SS304', overall_score: 0.94, semantic_score: 0.94, lexical_score: 0.93, numeric_score: 0.95, reranker_score: 0.94, match_type: 'exact', confidence_level: 'high', explanation: 'Same valve spec', differences: [], status: 'approved' },
  { id: 6, source_material_id: 6, target_material_id: 20, source_code: 'IOCL-CBL-001', source_description: 'XLPE Power Cable 3Cx70 Sqmm 1.1kV', target_code: 'NTPC-CBL-001', target_description: 'Power Cable 3Core 70mm 1.1kV XLPE', overall_score: 0.95, semantic_score: 0.94, lexical_score: 0.93, numeric_score: 0.95, reranker_score: 0.95, match_type: 'exact', confidence_level: 'high', explanation: 'Same cable', differences: [], status: 'approved' },
  { id: 7, source_material_id: 1, target_material_id: 25, source_code: 'IOCL-BLT-001', source_description: 'Hex Bolt M20x100 Grade 8.8 SS304', target_code: 'SAIL-BLT-001', target_description: 'Hex Bolt M20x100 SS304 Grade 8.8', overall_score: 0.97, semantic_score: 0.97, lexical_score: 0.96, numeric_score: 0.95, reranker_score: 0.97, match_type: 'exact', confidence_level: 'high', explanation: 'Cross-CPSE exact match', differences: [], status: 'pending' },
  { id: 8, source_material_id: 3, target_material_id: 26, source_code: 'IOCL-NUT-001', source_description: 'Hex Nut M20 Grade 8.8 SS304', target_code: 'SAIL-NUT-001', target_description: 'Hex Nut M20 SS304 Grade 8.8', overall_score: 0.96, semantic_score: 0.96, lexical_score: 0.95, numeric_score: 0.95, reranker_score: 0.96, match_type: 'exact', confidence_level: 'high', explanation: 'Exact match', differences: [], status: 'pending' },
  { id: 9, source_material_id: 4, target_material_id: 27, source_code: 'IOCL-PIP-001', source_description: 'Carbon Steel Pipe SCH40 100NBx6M IS:1239', target_code: 'SAIL-PIP-001', target_description: 'CS Seamless Pipe 100NB SCH40 IS:1239', overall_score: 0.96, semantic_score: 0.96, lexical_score: 0.95, numeric_score: 0.95, reranker_score: 0.96, match_type: 'exact', confidence_level: 'high', explanation: 'Exact pipe match', differences: [], status: 'pending' },
  { id: 10, source_material_id: 8, target_material_id: 29, source_code: 'IOCL-BRG-001', source_description: 'Deep Groove Ball Bearing 6205-2RS', target_code: 'SAIL-BRG-001', target_description: 'Deep Groove Ball Bearing 6205-2RS SKF', overall_score: 0.94, semantic_score: 0.93, lexical_score: 0.92, numeric_score: 0.95, reranker_score: 0.94, match_type: 'exact', confidence_level: 'high', explanation: 'Identical bearing', differences: [], status: 'approved' },
  { id: 11, source_material_id: 6, target_material_id: 30, source_code: 'IOCL-CBL-001', source_description: 'XLPE Power Cable 3Cx70 Sqmm 1.1kV', target_code: 'SAIL-CBL-001', target_description: 'XLPE Cable 3x70sqmm 1.1kV', overall_score: 0.93, semantic_score: 0.93, lexical_score: 0.92, numeric_score: 0.93, reranker_score: 0.93, match_type: 'exact', confidence_level: 'high', explanation: 'Same cable', differences: [], status: 'approved' },
  { id: 12, source_material_id: 7, target_material_id: 24, source_code: 'IOCL-HYO-001', source_description: 'Hydraulic Oil ISO VG 46 200L Drum', target_code: 'NTPC-HYO-001', target_description: 'Hydraulic Fluid VG 46 200L', overall_score: 0.93, semantic_score: 0.93, lexical_score: 0.90, numeric_score: 0.95, reranker_score: 0.93, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same hydraulic oil', differences: ['Brand difference'], status: 'pending' },
  { id: 13, source_material_id: 13, target_material_id: 23, source_code: 'IOCL-PMP-001', source_description: 'Centrifugal Pump 10HP SS316', target_code: 'NTPC-PMP-001', target_description: 'Centrifugal Pump 10 HP SS316 Body', overall_score: 0.94, semantic_score: 0.94, lexical_score: 0.93, numeric_score: 0.95, reranker_score: 0.94, match_type: 'exact', confidence_level: 'high', explanation: 'Same pump', differences: [], status: 'approved' },
  { id: 14, source_material_id: 5, target_material_id: 34, source_code: 'IOCL-VLV-001', source_description: 'Gate Valve DN150 PN16 Flanged SS304', target_code: 'CIL-VLV-001', target_description: 'Gate Valve DN150 PN16 Cast Steel', overall_score: 0.78, semantic_score: 0.78, lexical_score: 0.75, numeric_score: 0.80, reranker_score: 0.78, match_type: 'near_duplicate', confidence_level: 'medium', explanation: 'Same valve, different material', differences: ['Material: SS304 vs Cast Steel'], status: 'pending' },
  { id: 15, source_material_id: 9, target_material_id: 21, source_code: 'IOCL-PRG-001', source_description: 'Pressure Gauge 0-10 Bar 100mm Dial SS', target_code: 'NTPC-PRG-001', target_description: 'Pressure Gauge 0-10 Bar 100mm SS Case', overall_score: 0.93, semantic_score: 0.93, lexical_score: 0.92, numeric_score: 0.93, reranker_score: 0.93, match_type: 'exact', confidence_level: 'high', explanation: 'Same gauge', differences: [], status: 'approved' },
  { id: 16, source_material_id: 11, target_material_id: 32, source_code: 'IOCL-ELC-001', source_description: 'ERW Electrode E6013 3.15mm 5kg', target_code: 'SAIL-ELC-001', target_description: 'Welding Electrode E6013 3.15mm', overall_score: 0.95, semantic_score: 0.95, lexical_score: 0.94, numeric_score: 0.95, reranker_score: 0.95, match_type: 'exact', confidence_level: 'high', explanation: 'Same electrode', differences: [], status: 'approved' },
  { id: 17, source_material_id: 12, target_material_id: 22, source_code: 'IOCL-HLM-001', source_description: 'Safety Helmet White ISI Marked', target_code: 'NTPC-HLM-001', target_description: 'Safety Helmet Red ISI Marked', overall_score: 0.85, semantic_score: 0.85, lexical_score: 0.82, numeric_score: 0.88, reranker_score: 0.85, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same helmet, different color', differences: ['Color: white vs red'], status: 'rejected' },
  { id: 18, source_material_id: 19, target_material_id: 41, source_code: 'NTPC-VLV-001', source_description: 'Gate Valve 150mm PN16 Flanged SS304', target_code: 'NTPC-VLV-002', target_description: 'Ball Valve DN50 PN40 Threaded SS316', overall_score: 0.55, semantic_score: 0.55, lexical_score: 0.45, numeric_score: 0.60, reranker_score: 0.55, match_type: 'partial', confidence_level: 'low', explanation: 'Different valve types', differences: ['Type: gate vs ball', 'Size: 150mm vs 50mm'], status: 'rejected' },
  { id: 19, source_material_id: 10, target_material_id: 28, source_code: 'IOCL-ANG-001', source_description: 'MS Angle 50x50x6mm 6M', target_code: 'SAIL-ANG-001', target_description: 'MS Angle Equal 50x50x6mm 6mtr', overall_score: 0.95, semantic_score: 0.95, lexical_score: 0.94, numeric_score: 0.95, reranker_score: 0.95, match_type: 'exact', confidence_level: 'high', explanation: 'Same MS angle', differences: [], status: 'approved' },
  { id: 20, source_material_id: 15, target_material_id: 57, source_code: 'NTPC-BLT-001', source_description: 'Hexagonal Bolt M20x100 8.8 SS', target_code: 'NTPC-STU-001', target_description: 'Stud Bolt M20x80 Grade 8.8', overall_score: 0.78, semantic_score: 0.78, lexical_score: 0.75, numeric_score: 0.82, reranker_score: 0.78, match_type: 'near_duplicate', confidence_level: 'medium', explanation: 'Similar size, differs in type', differences: ['Type: hex bolt vs stud'], status: 'pending' },
  { id: 21, source_material_id: 11, target_material_id: 37, source_code: 'IOCL-ELC-001', source_description: 'ERW Electrode E6013 3.15mm 5kg', target_code: 'HEC-ELC-001', target_description: 'Electrode E7018 4mm 5kg', overall_score: 0.72, semantic_score: 0.72, lexical_score: 0.70, numeric_score: 0.75, reranker_score: 0.72, match_type: 'equivalent', confidence_level: 'medium', explanation: 'Different grade electrodes', differences: ['Grade: E6013 vs E7018', 'Diameter: 3.15mm vs 4mm'], status: 'pending' },
  { id: 22, source_material_id: 6, target_material_id: 33, source_code: 'IOCL-CBL-001', source_description: 'XLPE Power Cable 3Cx70 Sqmm 1.1kV', target_code: 'SAIL-MCB-001', target_description: 'MCB 32Amp Single Pole 6kA', overall_score: 0.42, semantic_score: 0.42, lexical_score: 0.35, numeric_score: 0.45, reranker_score: 0.42, match_type: 'partial', confidence_level: 'low', explanation: 'Different categories', differences: ['Type: cable vs breaker'], status: 'rejected' },
  { id: 23, source_material_id: 10, target_material_id: 50, source_code: 'IOCL-ANG-001', source_description: 'MS Angle 50x50x6mm 6M', target_code: 'SAIL-PLT-001', target_description: 'MS Plate 10mm 1x2M IS:2062', overall_score: 0.65, semantic_score: 0.65, lexical_score: 0.60, numeric_score: 0.70, reranker_score: 0.65, match_type: 'partial', confidence_level: 'medium', explanation: 'Different steel products', differences: ['Type: angle vs plate'], status: 'pending' },
  { id: 24, source_material_id: 44, target_material_id: 39, source_code: 'IOCL-CBL-002', source_description: 'Control Cable 4Cx2.5 Sqmm 1.1kV', target_code: 'NTPC-CBL-002', target_description: 'Control Cable 4x2.5mm 1.1kV', overall_score: 0.96, semantic_score: 0.96, lexical_score: 0.95, numeric_score: 0.95, reranker_score: 0.96, match_type: 'exact', confidence_level: 'high', explanation: 'Same control cable', differences: [], status: 'approved' },
  { id: 25, source_material_id: 12, target_material_id: 35, source_code: 'IOCL-HLM-001', source_description: 'Safety Helmet White ISI Marked', target_code: 'CIL-HLM-001', target_description: 'Safety Helmet Yellow ISI', overall_score: 0.85, semantic_score: 0.85, lexical_score: 0.82, numeric_score: 0.88, reranker_score: 0.85, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same helmet type', differences: ['Color: white vs yellow'], status: 'pending' },
  { id: 26, source_material_id: 42, target_material_id: 40, source_code: 'IOCL-GSK-001', source_description: 'Spiral Wound Gasket 150NB SS304 + Graphite', target_code: 'NTPC-GSK-001', target_description: 'Gasket Spiral Wound 150mm SS304', overall_score: 0.92, semantic_score: 0.92, lexical_score: 0.90, numeric_score: 0.93, reranker_score: 0.92, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same gasket', differences: [], status: 'pending' },
  { id: 27, source_material_id: 47, target_material_id: 59, source_code: 'IOCL-GRE-001', source_description: 'Grease Lithium EP2 180kg Drum', target_code: 'NTPC-GRE-001', target_description: 'Grease Lithium EP 2 180kg', overall_score: 0.95, semantic_score: 0.95, lexical_score: 0.94, numeric_score: 0.95, reranker_score: 0.95, match_type: 'exact', confidence_level: 'high', explanation: 'Same grease', differences: [], status: 'approved' },
  { id: 28, source_material_id: 13, target_material_id: 31, source_code: 'IOCL-PMP-001', source_description: 'Centrifugal Pump 10HP SS316', target_code: 'SAIL-PMP-001', target_description: 'Centrifugal Pump SS316 10HP', overall_score: 0.94, semantic_score: 0.94, lexical_score: 0.93, numeric_score: 0.95, reranker_score: 0.94, match_type: 'exact', confidence_level: 'high', explanation: 'Same pump', differences: [], status: 'pending' },
  { id: 29, source_material_id: 61, target_material_id: 21, source_code: 'IOCL-THG-001', source_description: 'Thermowell Assembly SS304 1/2 BSP', target_code: 'NTPC-THS-001', target_description: 'Temperature Transmitter RTD PT100', overall_score: 0.62, semantic_score: 0.62, lexical_score: 0.55, numeric_score: 0.65, reranker_score: 0.62, match_type: 'partial', confidence_level: 'low', explanation: 'Different instrument types', differences: ['Type: thermowell vs transmitter'], status: 'rejected' },
  { id: 30, source_material_id: 14, target_material_id: 67, source_code: 'IOCL-ACD-001', source_description: 'Sulphuric Acid 98% 50L Drum', target_code: 'NTPC-ACD-001', target_description: 'Sulphuric Acid 98%', overall_score: 0.94, semantic_score: 0.94, lexical_score: 0.93, numeric_score: 0.95, reranker_score: 0.94, match_type: 'exact', confidence_level: 'high', explanation: 'Same acid', differences: [], status: 'pending' },
  { id: 31, source_material_id: 14, target_material_id: 36, source_code: 'IOCL-ACD-001', source_description: 'Sulphuric Acid 98% 50L Drum', target_code: 'CIL-ACD-001', target_description: 'Hydrochloric Acid 30% 50L', overall_score: 0.68, semantic_score: 0.68, lexical_score: 0.62, numeric_score: 0.72, reranker_score: 0.68, match_type: 'equivalent', confidence_level: 'medium', explanation: 'Different acids', differences: ['Type: H2SO4 vs HCl'], status: 'pending' },
  { id: 32, source_material_id: 22, target_material_id: 35, source_code: 'NTPC-HLM-001', source_description: 'Safety Helmet Red ISI Marked', target_code: 'CIL-HLM-001', target_description: 'Safety Helmet Yellow ISI', overall_score: 0.85, semantic_score: 0.85, lexical_score: 0.82, numeric_score: 0.88, reranker_score: 0.85, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same helmet type', differences: ['Color: red vs yellow'], status: 'pending' },
  { id: 33, source_material_id: 20, target_material_id: 65, source_code: 'NTPC-CBL-001', source_description: 'Power Cable 3Core 70mm 1.1kV XLPE', target_code: 'NTPC-GAO-001', target_description: 'Gear Oil VG 220 210L Drum', overall_score: 0.45, semantic_score: 0.45, lexical_score: 0.35, numeric_score: 0.50, reranker_score: 0.45, match_type: 'partial', confidence_level: 'low', explanation: 'Different categories', differences: ['Category: electrical vs lubricant'], status: 'rejected' },
  { id: 34, source_material_id: 43, target_material_id: 52, source_code: 'IOCL-CPT-001', source_description: 'Copper Tube 15NBx5M Soft Annealed', target_code: 'SAIL-TUB-001', target_description: 'SS304 Tube 15NBx5M', overall_score: 0.88, semantic_score: 0.88, lexical_score: 0.85, numeric_score: 0.90, reranker_score: 0.88, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same tube family', differences: ['Material: copper vs SS304'], status: 'pending' },
  { id: 35, source_material_id: 25, target_material_id: 1, source_code: 'SAIL-BLT-001', source_description: 'Hex Bolt M20x100 SS304 Grade 8.8', target_code: 'IOCL-BLT-001', target_description: 'Hex Bolt M20x100 Grade 8.8 SS304', overall_score: 0.97, semantic_score: 0.97, lexical_score: 0.96, numeric_score: 0.95, reranker_score: 0.97, match_type: 'exact', confidence_level: 'high', explanation: 'Cross-CPSE exact match', differences: [], status: 'pending' },
  { id: 36, source_material_id: 33, target_material_id: 46, source_code: 'SAIL-MCB-001', source_description: 'MCB 32Amp Single Pole 6kA', target_code: 'IOCL-MCB-001', target_description: 'MCB 32A 1P 6kA', overall_score: 0.91, semantic_score: 0.91, lexical_score: 0.89, numeric_score: 0.92, reranker_score: 0.91, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same MCB rating', differences: [], status: 'pending' },
  { id: 37, source_material_id: 23, target_material_id: 31, source_code: 'NTPC-PMP-001', source_description: 'Centrifugal Pump 10 HP SS316 Body', target_code: 'SAIL-PMP-001', target_description: 'Centrifugal Pump SS316 10HP', overall_score: 0.94, semantic_score: 0.94, lexical_score: 0.93, numeric_score: 0.95, reranker_score: 0.94, match_type: 'exact', confidence_level: 'high', explanation: 'Same pump', differences: [], status: 'pending' },
  { id: 38, source_material_id: 12, target_material_id: 22, source_code: 'IOCL-HLM-001', source_description: 'Safety Helmet White ISI Marked', target_code: 'NTPC-HLM-001', target_description: 'Safety Helmet Red ISI Marked', overall_score: 0.85, semantic_score: 0.85, lexical_score: 0.82, numeric_score: 0.88, reranker_score: 0.85, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same helmet, different color', differences: ['Color: white vs red'], status: 'rejected' },
  { id: 39, source_material_id: 21, target_material_id: 9, source_code: 'NTPC-PRG-001', source_description: 'Pressure Gauge 0-10 Bar 100mm SS Case', target_code: 'IOCL-PRG-001', target_description: 'Pressure Gauge 0-10 Bar 100mm Dial SS', overall_score: 0.93, semantic_score: 0.93, lexical_score: 0.92, numeric_score: 0.93, reranker_score: 0.93, match_type: 'exact', confidence_level: 'high', explanation: 'Same gauge', differences: [], status: 'approved' },
  { id: 40, source_material_id: 11, target_material_id: 32, source_code: 'IOCL-ELC-001', source_description: 'ERW Electrode E6013 3.15mm 5kg', target_code: 'SAIL-ELC-001', target_description: 'Welding Electrode E6013 3.15mm', overall_score: 0.95, semantic_score: 0.95, lexical_score: 0.94, numeric_score: 0.95, reranker_score: 0.95, match_type: 'exact', confidence_level: 'high', explanation: 'Same electrode', differences: [], status: 'approved' },
  { id: 41, source_material_id: 15, target_material_id: 25, source_code: 'NTPC-BLT-001', source_description: 'Hexagonal Bolt M20x100 8.8 SS', target_code: 'SAIL-BLT-001', target_description: 'Hex Bolt M20x100 SS304 Grade 8.8', overall_score: 0.97, semantic_score: 0.97, lexical_score: 0.96, numeric_score: 0.95, reranker_score: 0.97, match_type: 'exact', confidence_level: 'high', explanation: 'Cross-CPSE exact match', differences: [], status: 'pending' },
  { id: 42, source_material_id: 47, target_material_id: 59, source_code: 'IOCL-GRE-001', source_description: 'Grease Lithium EP2 180kg Drum', target_code: 'NTPC-GRE-001', target_description: 'Grease Lithium EP 2 180kg', overall_score: 0.95, semantic_score: 0.95, lexical_score: 0.94, numeric_score: 0.95, reranker_score: 0.95, match_type: 'exact', confidence_level: 'high', explanation: 'Same grease spec', differences: [], status: 'approved' },
  { id: 43, source_material_id: 4, target_material_id: 45, source_code: 'IOCL-PIP-001', source_description: 'Carbon Steel Pipe SCH40 100NBx6M IS:1239', target_code: 'IOCL-PIP-002', target_description: 'Carbon Steel Pipe SCH80 50NBx6M', overall_score: 0.68, semantic_score: 0.68, lexical_score: 0.65, numeric_score: 0.72, reranker_score: 0.68, match_type: 'equivalent', confidence_level: 'medium', explanation: 'Different schedule and size', differences: ['Schedule: SCH40 vs SCH80'], status: 'pending' },
  { id: 44, source_material_id: 9, target_material_id: 61, source_code: 'IOCL-PRG-001', source_description: 'Pressure Gauge 0-10 Bar 100mm Dial SS', target_code: 'IOCL-THG-001', target_description: 'Thermowell Assembly SS304 1/2 BSP', overall_score: 0.62, semantic_score: 0.62, lexical_score: 0.55, numeric_score: 0.65, reranker_score: 0.62, match_type: 'partial', confidence_level: 'low', explanation: 'Different instrument types', differences: ['Type: pressure vs temperature'], status: 'rejected' },
  { id: 45, source_material_id: 42, target_material_id: 40, source_code: 'IOCL-GSK-001', source_description: 'Spiral Wound Gasket 150NB SS304 + Graphite', target_code: 'NTPC-GSK-001', target_description: 'Gasket Spiral Wound 150mm SS304', overall_score: 0.92, semantic_score: 0.92, lexical_score: 0.90, numeric_score: 0.93, reranker_score: 0.92, match_type: 'equivalent', confidence_level: 'high', explanation: 'Same gasket', differences: [], status: 'pending' },
  { id: 46, source_material_id: 49, target_material_id: 57, source_code: 'IOCL-ANB-001', source_description: 'Anchor Bolt M24x500 Grade 8.8', target_code: 'NTPC-STU-001', target_description: 'Stud Bolt M20x80 Grade 8.8', overall_score: 0.72, semantic_score: 0.72, lexical_score: 0.68, numeric_score: 0.76, reranker_score: 0.72, match_type: 'equivalent', confidence_level: 'medium', explanation: 'Different sizes and types', differences: ['Type: anchor vs stud', 'Size: M24x500 vs M20x80'], status: 'pending' },
  { id: 47, source_material_id: 48, target_material_id: 53, source_code: 'IOCL-WSH-001', source_description: 'Plain Washer M20 SS304', target_code: 'SAIL-RVT-001', target_description: 'Rivet 8mm SS304', overall_score: 0.58, semantic_score: 0.58, lexical_score: 0.52, numeric_score: 0.60, reranker_score: 0.58, match_type: 'partial', confidence_level: 'low', explanation: 'Different fastener types', differences: ['Type: washer vs rivet'], status: 'rejected' },
  { id: 48, source_material_id: 28, target_material_id: 51, source_code: 'SAIL-ANG-001', source_description: 'MS Angle Equal 50x50x6mm 6mtr', target_code: 'SAIL-BBM-001', target_description: 'MS Beam 150x75x6mm 6M', overall_score: 0.65, semantic_score: 0.65, lexical_score: 0.60, numeric_score: 0.70, reranker_score: 0.65, match_type: 'partial', confidence_level: 'medium', explanation: 'Different structural shapes', differences: ['Type: angle vs beam'], status: 'pending' },
  { id: 49, source_material_id: 56, target_material_id: 45, source_code: 'NTPC-PIP-003', source_description: 'GI Pipe 25NBx3M', target_code: 'IOCL-PIP-002', target_description: 'Carbon Steel Pipe SCH80 50NBx6M', overall_score: 0.70, semantic_score: 0.70, lexical_score: 0.65, numeric_score: 0.75, reranker_score: 0.70, match_type: 'equivalent', confidence_level: 'medium', explanation: 'Different pipe specs', differences: ['Material: GI vs CS', 'Size: 25NB vs 50NB'], status: 'pending' },
]

const demoDashboard = {
  kpis: { total_materials: 72, total_cpse: 5, duplicates_found: 6, match_proposals: 49, approved_mappings: 19, pending_reviews: 30, avg_confidence: 0.87 },
  by_family: [
    { family: 'fasteners', count: 14 }, { family: 'pipes_tubes', count: 9 }, { family: 'electrical', count: 9 },
    { family: 'valves_fittings', count: 7 }, { family: 'safety_ppe', count: 6 }, { family: 'instruments', count: 5 },
    { family: 'structural_steel', count: 5 }, { family: 'hydraulics_lubricants', count: 4 }, { family: 'pumps_comp', count: 3 },
    { family: 'welding', count: 3 }, { family: 'bearings', count: 3 }, { family: 'chemicals', count: 2 }, { family: 'packaging', count: 2 },
  ],
  by_cpse: [
    { name: 'Indian Oil Corporation Limited', count: 14 }, { name: 'NTPC Limited', count: 13 },
    { name: 'Steel Authority of India', count: 9 }, { name: 'Coal India Limited', count: 3 },
    { name: 'Heavy Engineering Corporation', count: 1 },
  ],
  matching: { total: 49, pending: 30, approved: 19, rejected: 12 },
}

const demoOrgs: Organization[] = [
  { id: 1, name: 'Indian Oil Corporation Limited', short_code: 'IOCL', sector: 'Oil & Gas', material_count: 1247 },
  { id: 2, name: 'NTPC Limited', short_code: 'NTPC', sector: 'Power Generation', material_count: 1089 },
  { id: 3, name: 'Steel Authority of India', short_code: 'SAIL', sector: 'Steel', material_count: 956 },
  { id: 4, name: 'Coal India Limited', short_code: 'CIL', sector: 'Mining', material_count: 823 },
  { id: 5, name: 'Heavy Engineering Corporation', short_code: 'HEC', sector: 'Engineering', material_count: 634 },
]

export const useAppStore = create<AppState>((set, get) => ({
  isDemo: IS_DEMO,

  auth: {
    user: null,
    isAuthenticated: false,
    login: async (username: string, _password: string) => {
      await new Promise(r => setTimeout(r, 800))
      const user = { id: 1, username, email: `${username}@nummf.gov.in`, full_name: 'Demo User', role: 'admin', is_active: true }
      localStorage.setItem('demo_token', 'demo-token-' + Date.now())
      localStorage.setItem('demo_user', JSON.stringify(user))
      set({ auth: { user, isAuthenticated: true, login: get().auth.login, logout: get().auth.logout } })
    },
    logout: () => {
      localStorage.removeItem('demo_token')
      localStorage.removeItem('demo_user')
      set({ auth: { user: null, isAuthenticated: false, login: get().auth.login, logout: get().auth.logout } })
    },
  },

  materials: {
    materials: [],
    loading: false,
    fetch: async () => {
      set({ materials: { ...get().materials, loading: true } })
      await new Promise(r => setTimeout(r, 600))
      set({ materials: { ...get().materials, materials: demoMaterials, loading: false } })
    },
    add: async (mat: any) => {
      const newMat = { ...mat, id: Date.now() }
      set(s => ({ materials: { ...s.materials, materials: [...s.materials.materials, newMat] } }))
    },
  },

  dashboard: {
    stats: null,
    loading: false,
    fetch: async () => {
      set({ dashboard: { ...get().dashboard, loading: true } })
      await new Promise(r => setTimeout(r, 700))
      set({ dashboard: { ...get().dashboard, stats: demoDashboard, loading: false } })
    },
  },

  matching: {
    proposals: [],
    summary: null,
    loading: false,
    fetchProposals: async () => {
      set({ matching: { ...get().matching, loading: true } })
      await new Promise(r => setTimeout(r, 500))
      set({ matching: { ...get().matching, proposals: demoProposals, loading: false } })
    },
    review: async (id: number, action: string, comment?: string) => {
      set(s => ({
        matching: {
          ...s.matching,
          proposals: s.matching.proposals.map(p => p.id === id ? {
            ...p, status: action === 'approve' ? 'approved' : 'rejected',
            review_comment: comment || (action === 'approve' ? 'Approved' : 'Rejected')
          } : p)
        }
      }))
    },
    detectDuplicates: async (_threshold?: number) => {
      await new Promise(r => setTimeout(r, 800))
      return { total_materials_scanned: 72, duplicate_pairs_found: 6, clusters_formed: 6, duplicates: [] }
    },
    matchQuery: async (desc: string) => {
      await new Promise(r => setTimeout(r, 600))
      const lower = desc.toLowerCase()
      const results = demoProposals.filter(p =>
        p.source_description?.toLowerCase().includes(lower) || p.target_description?.toLowerCase().includes(lower) ||
        lower.includes('bolt') || lower.includes('pipe') || lower.includes('valve') || lower.includes('cable') || lower.includes('pump') || lower.includes('bearing')
      ).slice(0, 5).map((r, i) => ({ ...r, candidate_idx: i, overall_score: r.overall_score, match_type: r.match_type, confidence_level: r.confidence_level, differences: r.differences }))
      return { results }
    },
    runPipeline: async (_sourceId: number, _targetId: number) => {
      const updateMatching = (partial: Partial<AppState['matching']>) => set({ matching: { ...get().matching, ...partial } })
      updateMatching({ pipelineRunning: true, pipelineProgress: 0 })
      await new Promise(r => setTimeout(r, 400)); updateMatching({ pipelineProgress: 15 })
      await new Promise(r => setTimeout(r, 500)); updateMatching({ pipelineProgress: 35 })
      await new Promise(r => setTimeout(r, 500)); updateMatching({ pipelineProgress: 60 })
      await new Promise(r => setTimeout(r, 400)); updateMatching({ pipelineProgress: 85 })
      await new Promise(r => setTimeout(r, 300))
      updateMatching({ pipelineRunning: false, pipelineProgress: 100, proposals: demoProposals })
      return demoProposals
    },
    pipelineRunning: false,
    pipelineProgress: 0,
  },

  organizations: {
    list: [],
    create: async (name: string, shortCode: string) => {
      const orgs = [...get().organizations.list, { id: Date.now(), name, short_code: shortCode.toUpperCase(), material_count: 0 }]
      set({ organizations: { ...get().organizations, list: orgs } })
    },
    fetch: async () => {
      set({ organizations: { ...get().organizations, list: demoOrgs } })
    },
  },
}))
