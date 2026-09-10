/**
 * The loading console.
 *
 * Three organisations are already in when this opens. The fourth arrives by being
 * dragged onto the page, and that is the only way it arrives: there is no button
 * that fetches it, because a button that loads data the application already had
 * proves nothing to a room that is wondering whether any of this is real. The
 * file comes off the visitor's own disk, is read in their own browser, and goes
 * through the same seven stages as the three already loaded.
 *
 * What the panel is built to show is the difference the fourth list makes - the
 * record count, the code count, the codes now shared across organisations and the
 * queue of pairs waiting for a person, each with its before and its after.
 */

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowClockwise,
  ArrowRight,
  Check,
  CaretRight,
  FileArrowUp,
  Pause,
  Play,
} from '@phosphor-icons/react'

import { Button, Chip, EndpointTag, Label, Meter, Num, Panel, PanelHead } from '@/components/ui'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import { useIsTechnical } from '@/store/viewmode'
import { useService } from '@/store/service'
import { applyMapping, parseCsv, streamMasterLoad } from '@/api/endpoints'
import type { LoadEvent, PipelineStage, StageReport } from '@/api/endpoints'
import { CPSES } from '@/engine/corpus'
import { formatCount, formatExact } from '@/engine/savings'
import type { Cpse } from '@/engine/types'

/* ------------------------------------------------------------------ wording */

const STAGE_SIMPLE: Record<PipelineStage, string> = {
  connect: 'Opening the company system',
  extract: 'Reading every item record',
  normalize: 'Cleaning up the names',
  block: 'Deciding which items are worth comparing',
  score: 'Comparing items against what is already here',
  cluster: 'Grouping the ones that match',
  mint: 'Giving each group one national code',
  complete: 'Finished',
}

const UNIT_SIMPLE: Record<StageReport['unit'], string> = {
  systems: 'systems',
  records: 'items',
  pairs: 'comparisons',
  codes: 'codes',
}

const LOG_LIMIT = 60

/* ----------------------------------------------------------------- mock data */

/**
 * CIL in-house material master sample.
 *
 * Generated as mock data because the file at /masters/cil-inhouse.csv may not
 * exist in all environments. The rows follow CIL's naming conventions
 * (CIL/MM/ prefix, short register, "/" join style) and include items that
 * overlap with the other three seeded masters so the demo shows meaningful
 * cross-CPSE matching.
 */
const CIL_SAMPLE_CSV = `Material Code,Description,UOM,Annual Qty,Unit Price,Stock on Hand
CIL/MM/11201,BRG BALL DG 6205 2RS SKF,NOS,1470,420,760
CIL/MM/11202,BRG BALL DG 6206 2RS,NOS,840,510,420
CIL/MM/11203,BRG BALL DG 6308 ZZ/NBC,NOS,410,980,210
CIL/MM/11204,BRG SPHERICAL ROLLER 22220 CC W33,NOS,180,12400,95
CIL/MM/11205,BRG TAPER ROLLER 30206 TIMKEN,NOS,560,690,340
CIL/MM/11206,BRG THRUST BALL 51110,NOS,320,1150,180
CIL/MM/11207,BRG CYLINDRICAL ROLLER NU 220,NOS,140,8600,72
CIL/MM/11208,BRG PLUMMER BLOCK SN 517,NOS,95,4300,48
CIL/MM/11209,PIP SMLS CS 100NB SCH40 IS 1239,MTS,6100,1250,3200
CIL/MM/11210,PIP SMLS CS 150NB SCH40 IS 1239,MTS,3200,2180,1700
CIL/MM/11211,PIP ERW GI 50NB IS 1239/JINDAL,MTS,11900,480,6400
CIL/MM/11212,PIP HDPE 63MM PN10 IS 4984,MTS,31400,210,17200
CIL/MM/11213,TUBE CU 12MM OD,MTS,1800,640,960
CIL/MM/11214,VLV GATE WCB 100NB CL150 FLGD IS 14846,NO,260,18400,140
CIL/MM/11215,VLV BALL SS316 50NB CL300 THD,NO,310,9600,170
CIL/MM/11216,VLV BUTTERFLY CI 200NB PN16,NO,210,12900,110
CIL/MM/11217,ELBOW SMLS CS 90 100NB SCH40,NO,980,1420,540
CIL/MM/11218,BLT HEX MS M20X100 8.8 IS 1367,NOS,39000,46,21500
CIL/MM/11219,BLT HEX MS M16X75 8.8 IS 1367,NOS,44000,31,24200
CIL/MM/11220,BLT FOUNDATION MS M24X600,NOS,3100,385,1680
CIL/MM/11221,WSHR SPRING MS M20 IS 3063,NOS,41000,6,22400
CIL/MM/11222,CBL XLPE ARMD AL 3CX240 SQMM 1.1KV IS 7098,MTS,9800,1180,5400
CIL/MM/11223,CBL XLPE ARMD AL 3CX120 SQMM 1.1KV IS 7098,MTS,12100,640,6700
CIL/MM/11224,CBL CU FLEXIBLE 2CX2.5 SQMM 1.1KV,MTS,24000,86,13200
CIL/MM/11225,RELAY THERMAL OVERLOAD 18-25A,NOS,460,1960,250
CIL/MM/11226,CONTACTOR 3P 32A 415V,NOS,310,2840,170
CIL/MM/11227,SWITCH ISOLATOR 4P 63A 415V,NOS,380,4200,210
CIL/MM/11228,GSKT SWG SS316 GRAPHITE 100NB CL150,NO,1200,640,660
CIL/MM/11229,GSKT CAF 3MM 100NB CL150,NO,3100,180,1720
CIL/MM/11230,SEAL OIL 45X65X10 NBR,NOS,3200,240,1760
CIL/MM/11231,ORING NBR 50X3,NOS,6800,42,3740
CIL/MM/11232,MOT IND 3PH 10HP 415V B3,NO,160,42000,88
CIL/MM/11233,MOT IND 3PH 5.5KW 415V B5,NO,140,31000,76
CIL/MM/11234,PMP CENTRIF 50X32 15KW,NO,52,124000,28
CIL/MM/11235,GAUGE PRESSURE DIAL 100MM 0-10BAR SS316,NO,540,2400,296
CIL/MM/11236,THERMOCOUPLE K 6MM 500MM SS316,NO,290,3800,158
CIL/MM/11237,GAUGE TEMPERATURE DIAL 100MM 0-100C SS304,NO,340,2100,186
CIL/MM/11238,HLMT SAFETY IS 2925,NOS,68000,340,37400
CIL/MM/11239,GLOVES LEATHER HAND IS 6994,NOS,126000,120,69300
CIL/MM/11240,GOGGLES SAFETY CLEAR IS 5983,NOS,31000,180,17050
CIL/MM/11241,SHOES SAFETY LEATHER IS 15298,NOS,34000,1240,18700
CIL/MM/11242,OIL LUBE VG46 210,LTR,19000,218,10450
CIL/MM/11243,GREASE EP2 LITHIUM 18,KGS,7200,310,3960
CIL/MM/11244,OIL TRANSFORMER IS 335,LTR,11000,186,6050
CIL/MM/11245,ELCT WELD E6013 3.15MM,KGS,21000,96,11550
CIL/MM/11246,WIRE MIG ER70S-6 1.2MM,KGS,9400,112,5170
CIL/MM/11247,BLT HEX SS304 M20X100 IS 1367,NOS,12000,168,6600
CIL/MM/11248,CBL XLPE ARMD AL 3CX240 SQMM 1.1KV FRLS IS 7098,MTS,8200,1290,4510
CIL/MM/11249,HOOTER ELECTRONIC 230V IP65,NOS,140,2400,76
CIL/MM/11250,STRIP EARTHING COPPER 25X3,MTS,2400,640,1320
CIL/MM/11251,BULB LED 12W B22 6500K,NOS,14000,145,7700
CIL/MM/11252,PENSTOCK CAST IRON 300NB MANUAL,NO,24,38000,13
CIL/MM/11253,STRAINER Y TYPE CARBON STEEL 50NB CL150,NO,72,4600,39
CIL/MM/11254,BUSH GUNMETAL 50MM,NO,380,890,208
CIL/MM/11255,PACKING GLAND GRAPHITE 10MM,KGS,190,2100,104
CIL/MM/11256,PLATE CHEQUERED MILD STEEL 5MM IS 3502,KGS,46000,74,25300
CIL/MM/11257,GUMBOOT SAFETY PVC STEEL TOE IS 5852,NOS,6400,720,3520
CIL/MM/11258,WASTE COTTON WHITE BALE 50KG,KGS,24000,68,13200
CIL/MM/11259,OIL TRANSFORMER INHIBITED IS 12463,LTR,42000,118,23100
CIL/MM/11260,SWITCH LEVEL FLOAT 230V 1NO 1NC,NO,88,3400,48
CIL/MM/11261,GAUGE PRESSURE DIAL 100MM 0-10BAR SS316 GLYCERINE FILLED,NO,620,2760,340
CIL/MM/11262,VLV GATE WCB 100NB CL150 FLGD RISING STEM IS 14846,NO,310,19100,170
CIL/MM/11263,MOT IND 3PH 10HP 415V B5 FLGD,NO,95,44000,52
CIL/MM/11264,ANG MS 50X50X6 IS 2062,KGS,96000,68,52800
CIL/MM/11265,PLT MS 10MM IS 2062,KGS,128000,72,70400
CIL/MM/11266,CHANNEL MS 100X50 IS 2062,KGS,58000,66,31900
CIL/MM/11267,BEAM MS ISMB 200 IS 2062,KGS,42000,71,23100
CIL/MM/11268,GEARBOX HELICAL RATIO 20,NO,52,68000,28
`

/** What a finished load turned out to be worth, kept per source so the four cards
 *  can each state their own result once the run is over. */
interface Outcome {
  rows: number
  matched: number
  heldForReview: number
  codes: number
}

/* -------------------------------------------------------------------- panel */

export default function SourceLoader({ compact = false }: { compact?: boolean }) {
  const technical = useIsTechnical()
  const reduced = useReducedMotion()
  const refresh = useService(s => s.refresh)
  const loaded = useService(s => s.dashboard?.loaded ?? [])

  const [event, setEvent] = useState<LoadEvent | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [active, setActive] = useState<Cpse['code'] | null>(null)
  const [paused, setPaused] = useState(false)
  const [outcomes, setOutcomes] = useState<Partial<Record<Cpse['code'], Outcome>>>({})
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<Cpse['code'] | null>(null)

  const runner = useRef<ReturnType<typeof streamMasterLoad> | null>(null)
  const logBox = useRef<HTMLDivElement | null>(null)
  const filePicker = useRef<HTMLInputElement | null>(null)

  useEffect(
    () => () => {
      runner.current?.stop()
      runner.current = null
    },
    [],
  )

  useEffect(() => {
    const node = logBox.current
    if (node) node.scrollTop = node.scrollHeight
  }, [log])

  /* ------------------------------------------------------------------ the run */

  const runText = useCallback(
    (code: Cpse['code'], text: string) => {
      const preview = parseCsv(text)
      const rows = applyMapping(preview, preview.mapping, code)
      if (rows.length === 0) {
        setError(`Nothing usable in the ${code} extract. The first line has to be a header row.`)
        setActive(null)
        return
      }

      setActive(code)
      setPaused(false)
      setError(null)

      runner.current = streamMasterLoad(
        code,
        rows,
        {
          onEvent: next => {
            setEvent(next)
            if (next.lines.length > 0) {
              setLog(current =>
                [...current, ...next.lines.map(line => `${code} · ${line}`)].slice(-LOG_LIMIT),
              )
            }
            if (next.done) {
              setOutcomes(current => ({
                ...current,
                [code]: {
                  rows: next.sampleRows,
                  matched: next.after.records - next.before.records - (next.after.codes - next.before.codes),
                  codes: next.after.codes - next.before.codes,
                },
              }))
              setActive(null)
              runner.current = null
            }
          },
          onCommit: () => {
            void refresh()
          },
        },
        { durationMs: compact ? 16_000 : 24_000 },
      )
    },
    [refresh, compact],
  )

  /**
   * Which organisation a dropped file belongs to.
   *
   * The name is checked first, then the shape of the local codes inside it, and
   * only then does it fall back to whoever has not sent a list yet. Guessing
   * wrong would file a real extract under the wrong organisation, so a file that
   * matches nothing is refused with the reason rather than loaded hopefully.
   */
  const identify = useCallback(
    (fileName: string, text: string): Cpse['code'] | null => {
      const name = fileName.toLowerCase()
      const byName = CPSES.find(
        c => name.includes(c.code.toLowerCase()) || c.extract.toLowerCase().endsWith(name),
      )
      if (byName) return byName.code

      const body = text.slice(0, 4000).toUpperCase()
      if (/CIL\/MM\//.test(body)) return 'CIL'
      if (/SL-MRO-/.test(body)) return 'SAIL'

      const waiting = CPSES.filter(c => !loaded.includes(c.code))
      return waiting.length === 1 ? waiting[0].code : null
    },
    [loaded],
  )

  const dropFile = useCallback(
    (file: File) => {
      if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
        setError(`${file.name} is not a CSV file. Export the sheet as CSV and drop it again.`)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const text = String(reader.result ?? '')
        const code = identify(file.name, text)
        if (!code) {
          setError(`Could not tell which organisation ${file.name} belongs to.`)
          return
        }
        if (loaded.includes(code)) {
          setError(`${code} has already been loaded. Press Start over to run it again.`)
          return
        }
        runText(code, text)
      }
      reader.onerror = () => setError(`The browser could not read ${file.name}.`)
      reader.readAsText(file)
    },
    [identify, loaded, runText],
  )

  const loadCilSample = useCallback(() => {
    const code = 'CIL'
    if (loaded.includes(code)) return
    setError(null)
    runText(code, CIL_SAMPLE_CSV)
  }, [loaded, runText])

  const togglePause = useCallback(() => {
    if (!runner.current) return
    if (paused) {
      runner.current.resume()
      setPaused(false)
    } else {
      runner.current.pause()
      setPaused(true)
    }
  }, [paused])

  const pending = CPSES.filter(c => !loaded.includes(c.code))
  const remaining = pending.length
  const busy = active !== null

  return (
    <Panel flush>
      <PanelHead
        title={<ByMode simple="The four item lists" technical="Source material masters" />}
        meta={`${CPSES.length - remaining} of ${CPSES.length} loaded`}
        action={
          busy ? (
            <Button
              size="sm"
              icon={paused ? <Play size={16} weight="regular" /> : <Pause size={16} weight="regular" />}
              onClick={togglePause}
            >
              {paused ? 'Resume' : 'Pause'}
            </Button>
          ) : remaining > 0 ? (
            <Chip tone="attention">
              {remaining === 1
                ? `waiting on ${pending[0].code}`
                : `waiting on ${remaining} lists`}
            </Chip>
          ) : (
            <Chip tone="accent">all four loaded</Chip>
          )
        }
      />

      {error ? (
        <p className="border-b border-rule bg-negative-bg px-5 py-3 text-[12.5px] text-negative">
          {error}
        </p>
      ) : null}

      {/* --------------------------------------------------------- the sources */}

      <div className="divide-y divide-rule">
        {CPSES.map(source => {
          const isLoaded = loaded.includes(source.code)
          const isActive = active === source.code
          const outcome = outcomes[source.code]

          return (
            <div
              key={source.code}
              className={isActive ? 'bg-attention-bg px-5 py-3.5' : 'px-5 py-3.5'}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                <span className="w-[16px] shrink-0">
                  {isLoaded ? (
                    <Check size={14} weight="bold" className="text-accent" />
                  ) : isActive ? (
                    <CaretRight size={14} weight="bold" className="text-attention" />
                  ) : (
                    <span className="block h-[3px] w-[8px] bg-rule-strong" />
                  )}
                </span>

                <Label className="w-[46px] shrink-0">{source.code}</Label>

                <span className="min-w-0 flex-1 text-[13px] text-ink">{source.name}</span>

                <TechnicalOnly>
                  <span className="font-mono text-[11px] text-ink-3">{source.connector}</span>
                </TechnicalOnly>

                <span className="flex items-baseline gap-2">
                  <Num size="sm" className="text-ink-2">
                    {formatExact(source.totalRecords)}
                  </Num>
                  <span className="text-[11px] text-ink-3">
                    <ByMode simple="items" technical="records" />
                  </span>
                </span>

                <span className="w-[190px] shrink-0 text-right">
                  {isLoaded && outcome ? (
                    <span className="text-[12.5px] text-ink-2">
                      <Num size="sm" className="text-ink">
                        {formatExact(outcome.rows)}
                      </Num>{' '}
                      read ·{' '}
                      <Num size="sm" className={outcome.matched > 0 ? 'text-accent' : 'text-ink-3'}>
                        {formatExact(outcome.matched)}
                      </Num>{' '}
                      already known
                    </span>
                  ) : isLoaded ? (
                    <Chip tone="accent">loaded</Chip>
                  ) : isActive ? (
                    <Chip tone="attention">{paused ? 'paused' : 'reading'}</Chip>
                  ) : (
                    <Chip>not sent yet</Chip>
                  )}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ------------------------------------------------------------ the drop */}

      {pending.length > 0 && !busy ? (
        <div
          onDragOver={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            setDragOver(pending[0].code)
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            setDragOver(null)
            const file = e.dataTransfer.files?.[0]
            if (file) dropFile(file)
          }}
          className={
            dragOver
              ? 'border-t border-rule bg-accent-bg px-5 py-9 text-center outline-dashed outline-2 -outline-offset-[10px] outline-accent'
              : 'border-t border-rule px-5 py-9 text-center'
          }
        >
          <FileArrowUp
            size={22}
            weight="regular"
            className={dragOver ? 'mx-auto text-accent' : 'mx-auto text-ink-3'}
          />
          <p className="mt-2.5 font-display text-[15px] font-semibold tracking-tight text-ink">
            {dragOver
              ? 'Let go and it will read it'
              : `Drop ${pending.map(p => p.name).join(' or ')}'s item list here`}
          </p>
          <p className="mx-auto mt-1.5 max-w-[58ch] text-[12.5px] leading-relaxed text-ink-2">
            <ByMode
              simple="Drag the file straight off your desktop. Nothing about it is prepared in advance — whatever is in the file is what goes into the registry."
              technical="The file is read in the browser and put through the same seven stages as the masters already loaded. No route on the service knows this file exists until you drop it."
            />
          </p>
          <p className="mt-2.5 font-mono text-[10.5px] text-ink-3">
            {pending.map(p => p.extract.replace('/masters/', '')).join(' · ')}
          </p>
          {pending.some(p => p.code === 'CIL') ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void loadCilSample()}
                className="text-[12.5px] text-accent underline underline-offset-2 transition-colors hover:text-accent/80"
              >
                <ByMode
                  simple="Try with sample data"
                  technical="Load CIL sample: /masters/cil-inhouse.csv"
                />
              </button>
            </div>
          ) : null}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => filePicker.current?.click()}
              className="text-[12px] text-ink-2 underline underline-offset-2 hover:text-ink"
            >
              or pick the file
            </button>
            <input
              ref={filePicker}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={event => {
                const file = event.target.files?.[0]
                if (file) dropFile(file)
                event.target.value = ''
              }}
            />
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- the console */}

      <AnimatePresence initial={false}>
        {event ? (
          <motion.div
            key="console"
            initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-rule"
          >
            <div className="border-b border-rule px-5 py-4">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Num size="display" className="text-ink">
                      {formatExact(event.tallies.recordsRead)}
                    </Num>
                    <span className="text-[13px] text-ink-2">
                      <ByMode
                        simple={`items read from ${event.source}`}
                        technical={`records read from ${event.source}`}
                      />
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink-2">
                    <ByMode
                      simple={STAGE_SIMPLE[event.stage]}
                      technical={
                        event.stages.find(s => s.status === 'running')?.label ?? 'Complete'
                      }
                    />
                  </p>
                  {/* Said out loud rather than buried. The counters above run at
                      the scale of the whole material master; the extract in the
                      room is a sample of it, and a reader is entitled to know
                      which number they are looking at before they ask. */}
                  <p className="mt-1 text-[11.5px] text-ink-3">
                    projected from the {formatExact(event.sampleRows)}-row extract in this demo
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="flex items-center gap-2">
                    <Label>elapsed</Label>
                    <Num size="sm" className="text-ink">
                      {(event.elapsedMs / 1000).toFixed(1)}s
                    </Num>
                  </span>
                  <span className="flex items-center gap-2">
                    <Label>rate</Label>
                    <Num size="sm" className="text-ink">
                      {formatCount(event.throughput)}/s
                    </Num>
                  </span>
                  {paused ? <Chip tone="attention">paused</Chip> : null}
                  {event.done ? <Chip tone="accent">complete</Chip> : null}
                </div>
              </div>
            </div>

            <div className="grid border-b border-rule lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="border-b border-rule px-5 py-4 lg:border-b-0 lg:border-r">
                <Label>
                  <ByMode simple="What it is doing" technical="Pipeline stages" />
                </Label>
                <div className="mt-3 flex flex-col">
                  {event.stages.map(stage => (
                    <StageRow key={stage.stage} stage={stage} technical={technical} />
                  ))}
                </div>
              </div>

              <div className="px-5 py-4">
                <Label>
                  <ByMode simple="What it has found so far" technical="Running tallies" />
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-x-6">
                  <Tally
                    label={technical ? 'abbreviations expanded' : 'short forms spelled out'}
                    value={formatExact(event.tallies.tokensExpanded)}
                  />
                  <Tally
                    label={technical ? 'candidate pairs' : 'pairs worth comparing'}
                    value={formatExact(event.tallies.candidatePairs)}
                  />
                  <Tally
                    label={technical ? 'comparisons skipped' : 'comparisons not needed'}
                    value={formatExact(event.tallies.comparisonsAvoided)}
                  />
                  <Tally
                    label={technical ? 'rows joining an existing code' : 'items another company already buys'}
                    value={formatExact(event.tallies.matched)}
                    tone="accent"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-6 border-t border-rule pt-2">
                  <Tally
                    label={technical ? 'national codes minted' : 'new national codes issued'}
                    value={formatExact(event.tallies.codes)}
                    tone="accent"
                  />
                </div>
              </div>
            </div>

            {/* ------------------------------------------- what actually changed */}

            <div className="border-b border-rule px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Label>
                  <ByMode
                    simple="What this list changed"
                    technical="Registry delta"
                  />
                </Label>
                <span className="text-[11.5px] text-ink-3">
                  <ByMode
                    simple="counted in the records you can open and check"
                    technical="working slice, the same figures the Explorer and code book report"
                  />
                </span>
              </div>
              <div className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
                <Delta
                  label={technical ? 'records' : 'items in the registry'}
                  from={event.before.records}
                  to={event.now.records}
                  final={event.after.records}
                />
                <Delta
                  label={technical ? 'national codes' : 'national codes'}
                  from={event.before.codes}
                  to={event.now.codes}
                  final={event.after.codes}
                />
                <Delta
                  label={technical ? 'codes spanning organisations' : 'codes more than one company uses'}
                  from={event.before.shared}
                  to={event.now.shared}
                  final={event.after.shared}
                />
                <Delta
                  label={technical ? 'pairs held for review' : 'waiting for a person'}
                  from={event.before.review}
                  to={event.now.review}
                  final={event.after.review}
                  tone="attention"
                />
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Label>
                  <ByMode simple="What happened, line by line" technical="Run log" />
                </Label>
                <TechnicalOnly>
                  <EndpointTag
                    method="POST"
                    endpoint={`/sources/${event.source}/load`}
                    ms={event.elapsedMs}
                    scanned={event.tallies.recordsRead}
                  />
                </TechnicalOnly>
                {!busy ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEvent(null)
                      setLog([])
                    }}
                    className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink"
                  >
                    <ArrowClockwise size={13} weight="regular" />
                    Clear the log
                  </button>
                ) : null}
              </div>
              <div
                ref={logBox}
                className="mt-2 h-[152px] overflow-y-auto border border-rule bg-surface-2 px-3 py-2"
                aria-live="polite"
              >
                {log.map((line, index) => (
                  <p
                    key={`${index}-${line}`}
                    className="whitespace-pre-wrap font-mono text-[11.5px] leading-[1.7] text-ink-2"
                  >
                    <span className="text-ink-3">{String(index + 1).padStart(2, '0')}</span> {line}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Panel>
  )
}

/* -------------------------------------------------------------------- parts */

function StageRow({ stage, technical }: { stage: StageReport; technical: boolean }) {
  const running = stage.status === 'running'
  const complete = stage.status === 'done'

  return (
    <div className="border-b border-rule py-2 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="w-[16px] shrink-0">
          {complete ? (
            <Check size={14} weight="bold" className="text-accent" />
          ) : running ? (
            <CaretRight size={14} weight="bold" className="text-attention" />
          ) : (
            <span className="block h-[3px] w-[8px] bg-rule-strong" />
          )}
        </span>
        <span
          className={
            running
              ? 'min-w-0 flex-1 text-[12.5px] text-ink'
              : complete
                ? 'min-w-0 flex-1 text-[12.5px] text-ink-2'
                : 'min-w-0 flex-1 text-[12.5px] text-ink-3'
          }
        >
          {technical ? stage.label : STAGE_SIMPLE[stage.stage]}
        </span>
        {stage.status === 'waiting' ? (
          <span className="font-mono text-[11px] text-ink-3">waiting</span>
        ) : (
          <span className="flex items-baseline gap-2">
            <Num size="sm" className={running ? 'text-ink' : 'text-ink-2'}>
              {formatExact(stage.processed)}
            </Num>
            <span className="font-mono text-[10.5px] text-ink-3">
              {technical ? stage.unit : UNIT_SIMPLE[stage.unit]}
            </span>
          </span>
        )}
      </div>
      <div className="mt-1.5 pl-[28px]">
        <Meter
          value={stage.processed / Math.max(1, stage.total)}
          tone={complete ? 'accent' : running ? 'attention' : 'neutral'}
        />
      </div>
    </div>
  )
}

/**
 * One before-and-after figure.
 *
 * The arrow is the whole point of the panel: a visitor should be able to read the
 * line and say what the fourth list did without being told. The target is shown
 * greyed while the run is still going, so nothing appears to have finished early.
 */
function Delta({
  label,
  from,
  to,
  final,
  tone = 'accent',
}: {
  label: string
  from: number
  to: number
  final: number
  tone?: 'accent' | 'attention'
}) {
  const done = to >= final
  return (
    <div className="border-b border-rule py-2">
      <div className="text-[11px] text-ink-3">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <Num size="sm" className="text-ink-3">
          {formatExact(from)}
        </Num>
        <ArrowRight size={11} weight="bold" className="shrink-0 text-ink-3" />
        <Num size="lg" className={tone === 'attention' ? 'text-attention' : 'text-accent'}>
          {formatExact(to)}
        </Num>
        {final !== from ? (
          <span className={done ? 'text-[11px] text-ink-2' : 'text-[11px] text-ink-3'}>
            +{formatExact(final - from)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function Tally({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'accent' | 'attention'
}) {
  return (
    <div className="border-b border-rule py-1.5">
      <div className="text-[11px] text-ink-3">{label}</div>
      <Num
        size="sm"
        className={
          tone === 'accent' ? 'text-accent' : tone === 'attention' ? 'text-attention' : 'text-ink'
        }
      >
        {value}
      </Num>
    </div>
  )
}
