/**
 * Legacy code migration mapping.
 *
 * Per-CPSE row view: each company's existing material code next to the national
 * standard it resolves to. Three verdicts - MAP, MERGE, HOLD - with the counts
 * that feed the progress bar. All data is fabricated for the demo.
 */

import { useMemo, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import {
  Button,
  Chip,
  Mono,
  PageHead,
  Panel,
  PanelHead,
  Segmented,
  Stat,
  StatCell,
  StatRow,
  Table,
  Td,
  Th,
} from '@/components/ui'
import { useCopy } from '@/copy'
import { ByMode } from '@/components/Gate'

type Action = 'MAP' | 'MERGE' | 'HOLD'
type Filter = 'all' | 'IOCL' | 'NTPC' | 'SAIL' | 'CIL'

interface MappingRow {
  cpse: string
  localCode: string
  localDesc: string
  localUom: string
  nationalCode: string
  standardDesc: string
  family: string
  action: Action
}

const MOCK_ROWS: MappingRow[] = [
  { cpse: 'IOCL', localCode: '410082400', localDesc: 'BRG BALL DG 6205 2RS SKF', localUom: 'NOS', nationalCode: 'CNMC-BE-73AE', standardDesc: 'BEARING, BALL, DEEP GROOVE, 6205', family: 'Bearings', action: 'MAP' },
  { cpse: 'IOCL', localCode: '410082548', localDesc: 'BRG BALL DG 6206 2RS', localUom: 'NOS', nationalCode: 'CNMC-BE-73AE', standardDesc: 'BEARING, BALL, DEEP GROOVE, 6206', family: 'Bearings', action: 'MAP' },
  { cpse: 'NTPC', localCode: '1024100561', localDesc: 'BALL BEARING 6205 2RS', localUom: 'NOS', nationalCode: 'CNMC-BE-73AE', standardDesc: 'BEARING, BALL, DEEP GROOVE, 6205', family: 'Bearings', action: 'MAP' },
  { cpse: 'SAIL', localCode: 'SL-MO-48546', localDesc: 'BRG BALL DG 6205 2RS FAG', localUom: 'NOS', nationalCode: 'CNMC-BE-73AE', standardDesc: 'BEARING, BALL, DEEP GROOVE, 6205', family: 'Bearings', action: 'MERGE' },
  { cpse: 'IOCL', localCode: '410082773', localDesc: 'BRG SPHERICAL ROLLER 22228', localUom: 'NOS', nationalCode: 'CNMC-SR-2B91', standardDesc: 'BEARING, SPHERICAL ROLLER, 22228', family: 'Bearings', action: 'MAP' },
  { cpse: 'NTPC', localCode: '1024100888', localDesc: 'TAPER ROLLER BEARING 30206', localUom: 'NOS', nationalCode: 'CNMC-TR-4C72', standardDesc: 'BEARING, TAPER ROLLER, 30206', family: 'Bearings', action: 'MAP' },
  { cpse: 'SAIL', localCode: 'SL-MO-48722', localDesc: 'THRUST BALL BEARING 51110', localUom: 'NOS', nationalCode: 'CNMC-TB-9D43', standardDesc: 'BEARING, THRUST BALL, 51110', family: 'Bearings', action: 'MAP' },
  { cpse: 'CIL', localCode: 'CIL-PP-0001', localDesc: 'PERSONAL PROTECTIVE GEAR', localUom: 'NOS', nationalCode: 'CNMC-SP-F8CD', standardDesc: 'SHOES, LEATHER, IS 15298', family: 'Safety and PPE', action: 'HOLD' },
  { cpse: 'IOCL', localCode: '410082950', localDesc: 'GLV HAND HOLD 11KV', localUom: 'NOS', nationalCode: 'CNMC-GL-3E22', standardDesc: 'GLOVES, ELECTRICAL, 11KV, LARGE', family: 'Safety and PPE', action: 'MAP' },
  { cpse: 'NTPC', localCode: '1024101024', localDesc: 'SAFETY HELMET WHITE', localUom: 'NOS', nationalCode: 'CNMC-SP-637C', standardDesc: 'HELMET, SAFETY, WHITE, ISI 2925', family: 'Safety and PPE', action: 'MAP' },
]

const ACTION_TONE: Record<Action, 'positive' | 'attention' | 'negative'> = {
  MAP: 'positive',
  MERGE: 'attention',
  HOLD: 'negative',
}

export default function MigrationPage() {
  const c = useCopy()
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const map: Record<Action, number> = { MAP: 0, MERGE: 0, HOLD: 0 }
    for (const r of MOCK_ROWS) map[r.action]++
    return map
  }, [])

  const rows = useMemo(
    () => (filter === 'all' ? MOCK_ROWS : MOCK_ROWS.filter(r => r.cpse === filter)),
    [filter],
  )

  const downloadCsv = () => {
    const header = 'cpse,local_code,local_description,local_uom,national_code,standard_description,family,action\n'
    const body = rows.map(r => `${r.cpse},${r.localCode},"${r.localDesc}",${r.localUom},${r.nationalCode},"${r.standardDesc}",${r.family},${r.action}`).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codeone-legacy-mapping.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHead title={c('migrationTitle')} lead={c('migrationLead')} />

      <StatRow className="mt-6">
        <StatCell>
          <Stat label="Total mappings" value={MOCK_ROWS.length} />
        </StatCell>
        <StatCell>
          <Stat label="Ready to migrate" value={counts.MAP} tone="positive" />
        </StatCell>
        <StatCell>
          <Stat label="Needs merge" value={counts.MERGE} tone="attention" />
        </StatCell>
        <StatCell>
          <Stat label="Held for review" value={counts.HOLD} tone="negative" />
        </StatCell>
      </StatRow>

      <Panel flush className="mt-6">
        <PanelHead
          title={<ByMode simple="Company filter" technical="Per-CPSE filter" />}
          action={
            <Segmented
              value={filter}
              onChange={v => setFilter(v as Filter)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'IOCL', label: 'IOCL' },
                { value: 'NTPC', label: 'NTPC' },
                { value: 'SAIL', label: 'SAIL' },
                { value: 'CIL', label: 'CIL' },
              ]}
            />
          }
        />
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Local code</Th>
                <Th>Local description</Th>
                <Th>UOM</Th>
                <Th>National code</Th>
                <Th>Standard description</Th>
                <Th>Family</Th>
                <Th align="right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}>
                  <Td><span className="font-medium text-ink">{row.cpse}</span></Td>
                  <Td><Mono>{row.localCode}</Mono></Td>
                  <Td>{row.localDesc}</Td>
                  <Td>{row.localUom}</Td>
                  <Td><Mono>{row.nationalCode}</Mono></Td>
                  <Td>{row.standardDesc}</Td>
                  <Td>{row.family}</Td>
                  <Td align="right">
                    <Chip tone={ACTION_TONE[row.action]}>
                      {row.action}
                    </Chip>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Panel>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-[13px] text-ink-2">
          {counts.MAP} of {MOCK_ROWS.length} mappings confirmed &middot; {counts.HOLD} awaiting steward review
        </p>
        <Button variant="secondary" icon={<DownloadSimple size={16} />} onClick={downloadCsv}>
          Download migration package
        </Button>
      </div>
    </>
  )
}
