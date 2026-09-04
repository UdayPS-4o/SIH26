/**
 * Ingestion.
 *
 * A fifth organisation arrives with a spreadsheet and wants one question answered:
 * how much of this does the country already have a code for? Four ways in, a column
 * mapping the visitor can correct, and three groups of results.
 *
 * Every incoming row is scored against the existing corpus by the service, never
 * against the other rows in the same upload, so two new items that happen to look
 * alike each mint their own code rather than being folded together.
 */

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CaretDown,
  CaretRight,
  ClipboardText,
  FileArrowUp,
  FileCsv,
  TextAa,
} from '@phosphor-icons/react'

import {
  Button,
  Chip,
  EmptyState,
  EndpointTag,
  ErrorState,
  Label,
  Meter,
  Mono,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Segmented,
  Select,
  Skeleton,
  Table,
  Td,
  Th,
  Textarea,
  TextInput,
} from '@/components/ui'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { previewUpload, applyMapping, type ColumnMapping, type IngestPreview, type IngestRowResult, type IngestRunResponse } from '@/api/endpoints'
import type { RequestMeta } from '@/api/client'
import { formatExact } from '@/engine/savings'

/* ------------------------------------------------------------------ constants */

type Source = 'paste' | 'upload' | 'line' | 'sample'

const SOURCES: { value: Source; label: string }[] = [
  { value: 'paste', label: 'Paste rows' },
  { value: 'upload', label: 'Upload a file' },
  { value: 'line', label: 'One item' },
  { value: 'sample', label: 'Sample lists' },
]

/** Labelled by what each one demonstrates, not by its filename. */
const SAMPLES: { path: string; label: string; detail: string }[] = [
  {
    path: '/samples/bhel-materials.csv',
    label: 'A tidy list with a high overlap',
    detail: 'Clean headers. Most rows should already carry a national code.',
  },
  {
    path: '/samples/gail-materials.csv',
    label: 'A pipeline list with genuinely new items',
    detail: 'A mix: some repeats of what four organisations already buy, some not.',
  },
  {
    path: '/samples/hal-messy.csv',
    label: 'A messy export with ragged rows',
    detail: 'Odd header names and rows with the wrong number of values.',
  },
  {
    path: '/samples/single-item.csv',
    label: 'A single line',
    detail: 'One item, for when the point is the answer and not the volume.',
  },
]

/** Units the normalizer already collapses to a canonical value. */
const UOM_OPTIONS = [
  { value: 'NOS', label: 'NOS (number, each)' },
  { value: 'EA', label: 'EA (each)' },
  { value: 'PCS', label: 'PCS (pieces)' },
  { value: 'SET', label: 'SET' },
  { value: 'MTR', label: 'MTR (metre)' },
  { value: 'M', label: 'M (metre)' },
  { value: 'RMT', label: 'RMT (running metre)' },
  { value: 'KG', label: 'KG (kilogram)' },
  { value: 'LTR', label: 'LTR (litre)' },
  { value: 'SQM', label: 'SQM (square metre)' },
]

const MAP_FIELDS: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
  { key: 'description', label: 'Item description', required: true },
  { key: 'code', label: 'The local code the company uses' },
  { key: 'uom', label: 'Unit' },
  { key: 'org', label: 'Organisation' },
  { key: 'annualQty', label: 'Annual quantity' },
  { key: 'unitPrice', label: 'Unit price' },
  { key: 'stockOnHand', label: 'Stock on hand' },
]

const PASTE_PLACEHOLDER =
  'Material Code,Description,UOM,Annual Qty,Unit Price\nBH-100241,BALL BRG 6205 2RS SKF,NOS,240,410\nBH-100242,"HEX BOLT M12X50 SS304, IS 1364",NOS,4800,18'

/* ------------------------------------------------------------------ the page */

export default function ImportPage() {
  const c = useCopy()
  const reduced = useReducedMotion()

  const ready = useService(s => s.ready)
  const storeError = useService(s => s.error)
  const refresh = useService(s => s.refresh)
  const accept = useService(s => s.accept)
  const reviewThreshold = useService(s => s.review)
  const corpusSize = useService(s => s.records.length)
  const importRows = useService(s => s.importRows)
  const ingestMeta = useService(s => s.lastCall.ingest)

  const [source, setSource] = useState<Source>('paste')
  const [org, setOrg] = useState('BHEL')

  const [pasted, setPasted] = useState('')
  const [dragging, setDragging] = useState(false)
  const [lineText, setLineText] = useState('')
  const [lineUom, setLineUom] = useState('NOS')

  const [preview, setPreview] = useState<IngestPreview | null>(null)
  const [previewMeta, setPreviewMeta] = useState<RequestMeta | null>(null)
  const [previewFrom, setPreviewFrom] = useState('')
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [retry, setRetry] = useState<(() => void) | null>(null)

  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [result, setResult] = useState<IngestRunResponse | null>(null)
  // The registry grows by the rows just accepted, so a live corpus count would
  // report the run as having been scored against records it created itself.
  const [matchedAgainst, setMatchedAgainst] = useState<number | null>(null)

  const fileInput = useRef<HTMLInputElement>(null)

  /* --------------------------------------------------------------- reading in */

  const readCsv = useCallback(async (text: string, from: string) => {
    setReading(true)
    setReadError(null)
    setRetry(null)
    setResult(null)
    setMatchedAgainst(null)
    setRunError(null)
    try {
      const response = await previewUpload(text)
      setPreview(response.data)
      setPreviewMeta(response.meta)
      setMapping(response.data.mapping)
      setPreviewFrom(from)
    } catch {
      setPreview(null)
      setMapping(null)
      setReadError('The service could not read that text as a table.')
    } finally {
      setReading(false)
    }
  }, [])

  const readFile = useCallback(
    (file: File) => {
      if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
        setPreview(null)
        setMapping(null)
        setReadError(`${file.name} is not a CSV file. Save the sheet as CSV and try again.`)
        setRetry(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => void readCsv(String(reader.result ?? ''), file.name)
      reader.onerror = () => {
        setReadError(`The browser could not read ${file.name}.`)
        setRetry(null)
      }
      reader.readAsText(file)
    },
    [readCsv],
  )

  const loadSample = useCallback(
    async (path: string) => {
      setReading(true)
      setReadError(null)
      setRetry(null)
      try {
        const response = await fetch(path, { headers: { Accept: 'text/csv' } })
        if (!response.ok) {
          throw new Error(`${path} is not on the server (HTTP ${response.status}).`)
        }
        const text = await response.text()
        if (/^\s*<(!doctype|html)/i.test(text)) {
          throw new Error(`${path} came back as a web page rather than a CSV file.`)
        }
        await readCsv(text, path.split('/').pop() ?? path)
      } catch (error) {
        setPreview(null)
        setMapping(null)
        setReadError(error instanceof Error ? error.message : `Could not fetch ${path}.`)
        setRetry(() => () => void loadSample(path))
        setReading(false)
      }
    },
    [readCsv],
  )

  const submitLine = useCallback(() => {
    const description = lineText.trim()
    if (!description) return
    const escaped = description.replace(/"/g, '""')
    const csv = `Material Code,Description,UOM\nLINE-1,"${escaped}",${lineUom}`
    void readCsv(csv, 'one typed line')
  }, [lineText, lineUom, readCsv])

  /* ------------------------------------------------------------------ running */

  const parsedRows = useMemo(
    () => (preview && mapping ? applyMapping(preview, mapping, org || 'NEW ORG') : []),
    [preview, mapping, org],
  )

  const run = useCallback(async () => {
    if (parsedRows.length === 0) return
    setRunning(true)
    setMatchedAgainst(corpusSize)
    setRunError(null)
    try {
      const data = await importRows(parsedRows, org || 'NEW ORG')
      setResult(data)
    } catch {
      setRunError('The harmonization service did not complete the run. Nothing was written.')
    } finally {
      setRunning(false)
    }
  }, [parsedRows, importRows, org, corpusSize])

  const startOver = useCallback(() => {
    setPreview(null)
    setPreviewMeta(null)
    setMapping(null)
    setPreviewFrom('')
    setResult(null)
    setReadError(null)
    setRunError(null)
    setMatchedAgainst(null)
    setRetry(null)
  }, [])

  /* ------------------------------------------------------------------ grouping */

  const groups = useMemo(() => {
    if (!result) return null
    const coded: IngestRowResult[] = []
    const undecided: IngestRowResult[] = []
    const fresh: IngestRowResult[] = []
    for (const row of result.results) {
      if (row.match && row.match.breakdown.combined >= accept) coded.push(row)
      else if (row.match) undecided.push(row)
      else fresh.push(row)
    }
    return { coded, undecided, fresh, total: result.results.length }
  }, [result, accept])

  /* ------------------------------------------------------------------ shell */

  const head = <PageHead title={c('importTitle')} lead={c('importLead')} />

  if (storeError) {
    return (
      <>
        {head}
        <ErrorState message={c('errorGeneric')} onRetry={() => void refresh()} />
      </>
    )
  }

  if (!ready) {
    return (
      <>
        {head}
        <Panel>
          <Skeleton rows={6} />
        </Panel>
      </>
    )
  }

  if (corpusSize === 0) {
    return (
      <>
        {head}
        <NothingLoaded what="This page is for a fifth organisation arriving with its own spreadsheet: it answers how much of that list the country already has a code for. It needs a registry to compare against first." />
      </>
    )
  }

  const descriptionMapped = mapping ? mapping.description >= 0 : false

  return (
    <>
      {head}

      {/* ------------------------------------------------------------- source */}

      <Panel flush>
        <PanelHead
          title="Where the list comes from"
          meta={`${formatExact(corpusSize)} records to match against`}
          action={
            <Segmented
              size="sm"
              value={source}
              options={SOURCES}
              onChange={next => setSource(next)}
            />
          }
        />

        <div className="px-5 py-4">
          <div className="mb-4 flex flex-wrap items-end gap-4 border-b border-rule pb-4">
            <div className="flex w-full max-w-[280px] flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink" htmlFor="import-org">
                Whose list is this
              </label>
              <TextInput
                id="import-org"
                value={org}
                onChange={event => setOrg(event.target.value.toUpperCase())}
                placeholder="BHEL"
              />
            </div>
            <p className="max-w-[46ch] pb-1 text-[12.5px] leading-snug text-ink-2">
              <ByMode
                simple="Rows are compared against the four lists already loaded, never against each other."
                technical="Each row is scored against the existing corpus only. Intra-batch pairs are not considered."
              />
            </p>
          </div>

          {source === 'paste' ? (
            <div className="flex flex-col gap-3">
              <label className="text-[12px] font-medium text-ink" htmlFor="import-paste">
                Paste comma separated rows, first line being the header
              </label>
              <Textarea
                id="import-paste"
                rows={8}
                spellCheck={false}
                value={pasted}
                placeholder={PASTE_PLACEHOLDER}
                onChange={event => setPasted(event.target.value)}
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  icon={<ClipboardText size={16} weight="regular" />}
                  disabled={pasted.trim().length === 0 || reading}
                  onClick={() => void readCsv(pasted, 'pasted text')}
                >
                  Read these rows
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasted(PASTE_PLACEHOLDER)}
                  disabled={reading}
                >
                  Fill in an example
                </Button>
              </div>
            </div>
          ) : null}

          {source === 'upload' ? (
            <div className="flex flex-col gap-3">
              <div
                onDragOver={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault()
                  setDragging(false)
                  const file = event.dataTransfer.files?.[0]
                  if (file) readFile(file)
                }}
                className={
                  dragging
                    ? 'flex flex-col items-center gap-2 border border-dashed border-accent bg-accent-bg px-6 py-10 text-center'
                    : 'flex flex-col items-center gap-2 border border-dashed border-rule-strong px-6 py-10 text-center'
                }
              >
                <FileArrowUp size={16} weight="regular" />
                <p className="text-[13px] text-ink">
                  {dragging ? 'Let go to read this file' : 'Drop a CSV file here'}
                </p>
                <p className="text-[12.5px] text-ink-2">
                  Nothing leaves this browser except the request to the harmonization service.
                </p>
                <div className="mt-2">
                  <Button size="sm" onClick={() => fileInput.current?.click()} disabled={reading}>
                    Choose a file
                  </Button>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0]
                    if (file) readFile(file)
                    event.target.value = ''
                  }}
                />
              </div>
            </div>
          ) : null}

          {source === 'line' ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink" htmlFor="import-line">
                    Describe one item, in whatever short form your engineers use
                  </label>
                  <TextInput
                    id="import-line"
                    value={lineText}
                    spellCheck={false}
                    placeholder="BALL BRG 6205 2RS SKF"
                    onChange={event => setLineText(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') submitLine()
                    }}
                  />
                </div>
                <div className="flex w-[200px] flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink" htmlFor="import-uom">
                    Unit
                  </label>
                  <Select
                    id="import-uom"
                    value={lineUom}
                    onChange={event => setLineUom(event.target.value)}
                  >
                    {UOM_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Button
                  variant="primary"
                  icon={<TextAa size={16} weight="regular" />}
                  disabled={lineText.trim().length === 0 || reading}
                  onClick={submitLine}
                >
                  Check this one item
                </Button>
              </div>
            </div>
          ) : null}

          {source === 'sample' ? (
            <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
              {SAMPLES.map(sample => (
                <div key={sample.path} className="flex flex-col gap-2 bg-surface px-4 py-4">
                  <p className="text-[13px] font-medium text-ink">{sample.label}</p>
                  <p className="text-[12.5px] leading-snug text-ink-2">{sample.detail}</p>
                  <TechnicalOnly>
                    <Mono className="self-start">{sample.path}</Mono>
                  </TechnicalOnly>
                  <div className="mt-1">
                    <Button
                      size="sm"
                      icon={<FileCsv size={16} weight="regular" />}
                      disabled={reading}
                      onClick={() => void loadSample(sample.path)}
                    >
                      Load this list
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Panel>

      {/* ------------------------------------------------------- read problems */}

      {readError ? (
        <div className="mt-4">
          <ErrorState message={readError} onRetry={retry ?? undefined} />
        </div>
      ) : null}

      {reading ? (
        <Panel className="mt-4">
          <Label>Reading</Label>
          <div className="mt-3">
            <Skeleton rows={3} />
          </div>
        </Panel>
      ) : null}

      {/* -------------------------------------------------------------- mapping */}

      {preview && mapping && !reading ? (
        preview.headers.length === 0 ? (
          <div className="mt-4">
            <ErrorState message={`There was nothing readable in ${previewFrom}. The first line has to be a header row.`} />
          </div>
        ) : (
          <Panel flush className="mt-4">
            <PanelHead
              title="What each column holds"
              meta={previewFrom}
              action={
                <>
                  <TechnicalOnly>
                    {previewMeta ? (
                      <EndpointTag
                        method={previewMeta.method}
                        endpoint={previewMeta.endpoint}
                        ms={previewMeta.ms}
                        scanned={previewMeta.scanned}
                      />
                    ) : null}
                  </TechnicalOnly>
                  <Button size="sm" variant="ghost" onClick={startOver}>
                    Start over
                  </Button>
                </>
              }
            />

            <div className="border-b border-rule px-5 py-4">
              <p className="text-[13px] text-ink-2">
                The guesses below come from the header names. Correct any of them before matching.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {MAP_FIELDS.map(field => {
                  const index = mapping[field.key]
                  const confidence = preview.confidence[field.key]
                  return (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <label
                          className="text-[12px] font-medium text-ink"
                          htmlFor={`map-${field.key}`}
                        >
                          {field.label}
                        </label>
                        {index < 0 && field.required ? (
                          <Chip tone="attention">Pick one</Chip>
                        ) : index < 0 ? (
                          <Chip>Not in this file</Chip>
                        ) : confidence < 1 ? (
                          <Chip tone="attention">Guessed</Chip>
                        ) : null}
                      </div>
                      <Select
                        id={`map-${field.key}`}
                        value={String(index)}
                        onChange={event =>
                          setMapping({ ...mapping, [field.key]: Number(event.target.value) })
                        }
                      >
                        <option value="-1">Not in this file</option>
                        {preview.headers.map((header, headerIndex) => (
                          <option key={`${header}-${headerIndex}`} value={String(headerIndex)}>
                            {header || `Column ${headerIndex + 1}`}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-rule px-5 py-3">
              <span className="text-[12.5px] text-ink-2">
                <Num size="sm">{formatExact(preview.rows.length)}</Num> rows read
              </span>
              <span className="text-[12.5px] text-ink-2">
                <Num size="sm">{formatExact(parsedRows.length)}</Num> rows usable
              </span>
              {preview.problems.length > 0 ? (
                <span className="text-[12.5px] text-attention">
                  <Num size="sm">{formatExact(preview.problems.length)}</Num> lines malformed
                </span>
              ) : (
                <span className="text-[12.5px] text-ink-3">No malformed lines</span>
              )}
            </div>

            {preview.problems.length > 0 ? (
              <div className="border-b border-rule bg-attention-bg px-5 py-3">
                <p className="text-[12.5px] text-attention">
                  These lines do not line up with the header. Read them in the preview below before
                  matching, and correct the file if they are wrong.
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {preview.problems.slice(0, 5).map(problem => (
                    <li key={`${problem.line}-${problem.reason}`} className="text-[12.5px] text-ink-2">
                      <Num size="sm" className="text-ink">
                        Line {problem.line}:
                      </Num>
                      <span className="ml-2">{problem.reason}</span>
                    </li>
                  ))}
                </ul>
                {preview.problems.length > 5 ? (
                  <p className="mt-1 text-[12px] text-ink-3">
                    and <Num size="xs">{formatExact(preview.problems.length - 5)}</Num> more
                  </p>
                ) : null}
              </div>
            ) : null}

            <Table>
              <thead>
                <tr>
                  {preview.headers.map((header, headerIndex) => (
                    <Th
                      key={`${header}-${headerIndex}`}
                      className={headerIndex === mapping.description ? 'text-accent' : undefined}
                    >
                      {header || `Column ${headerIndex + 1}`}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 8).map((cells, rowIndex) => (
                  <tr key={rowIndex}>
                    {preview.headers.map((_, cellIndex) => (
                      <Td key={cellIndex} className="font-mono text-[12px] text-ink-2">
                        {cells[cellIndex] ?? ''}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="flex flex-wrap items-center gap-3 border-t border-rule px-5 py-4">
              <Button
                variant="primary"
                disabled={!descriptionMapped || parsedRows.length === 0 || running}
                onClick={() => void run()}
              >
                Match against the national registry
              </Button>
              {!descriptionMapped ? (
                <span className="text-[12.5px] text-attention">
                  Choose the column that holds the item description first.
                </span>
              ) : (
                <span className="text-[12.5px] text-ink-2">
                  <Num size="sm">{formatExact(parsedRows.length)}</Num> rows against{' '}
                  <Num size="sm">{formatExact(matchedAgainst ?? corpusSize)}</Num> records.
                </span>
              )}
            </div>
          </Panel>
        )
      ) : null}

      {/* -------------------------------------------------------------- running */}

      {running ? (
        <Panel className="mt-4">
          <Label>Matching</Label>
          <p className="mt-2 text-[13px] text-ink">
            Scoring <Num size="sm">{formatExact(parsedRows.length)}</Num> rows against{' '}
            <Num size="sm">{formatExact(matchedAgainst ?? corpusSize)}</Num> records already in the
            registry.
          </p>
          <div className="mt-3 h-[3px] w-full overflow-hidden bg-rule">
            {reduced ? (
              <div className="h-full w-1/3 bg-accent" />
            ) : (
              <motion.div
                className="h-full w-1/3 bg-accent"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
          <TechnicalOnly>
            <p className="mt-3 font-mono text-[10.5px] text-ink-3">
              POST /ingest/run{' '}
              {formatExact(parsedRows.length * corpusSize)} candidate comparisons
            </p>
          </TechnicalOnly>
        </Panel>
      ) : null}

      {runError ? (
        <div className="mt-4">
          <ErrorState message={runError} onRetry={() => void run()} />
        </div>
      ) : null}

      {/* -------------------------------------------------------------- results */}

      {groups && !running ? (
        <section className="mt-6">
          <p className="max-w-[62ch] text-[17px] leading-snug text-ink">
            <Num size="lg" className="text-ink">
              {formatExact(groups.coded.length)}
            </Num>{' '}
            of{' '}
            <Num size="lg" className="text-ink">
              {formatExact(groups.total)}
            </Num>{' '}
            items you sent already exist under a national code.
          </p>
          <p className="mt-2 max-w-[62ch] text-[13px] text-ink-2">
            <Num size="sm">{formatExact(groups.undecided.length)}</Num> need a person to decide, and{' '}
            <Num size="sm">{formatExact(groups.fresh.length)}</Num> are new to the registry and were
            given a fresh code.
          </p>
          <TechnicalOnly>
            <p className="mt-2 font-mono text-[10.5px] text-ink-3">
              accept {accept.toFixed(2)} / review {reviewThreshold.toFixed(2)} on the combined score
            </p>
          </TechnicalOnly>

          <div className="mt-4 flex flex-col gap-4">
            <ResultGroup
              title="Already has a code"
              tone="accent"
              count={groups.coded.length}
              rows={groups.coded}
              meta={ingestMeta}
              kind="matched"
              defaultOpen
            />
            <ResultGroup
              title="Needs a decision"
              tone="attention"
              count={groups.undecided.length}
              rows={groups.undecided}
              meta={ingestMeta}
              kind="matched"
              note={
                <>
                  These scored between the two thresholds. They join the{' '}
                  <Link to="/duplicates" className="text-accent underline underline-offset-2">
                    duplicates queue
                  </Link>{' '}
                  for a person to confirm or reject.
                </>
              }
            />
            <ResultGroup
              title="New to the registry"
              tone="neutral"
              count={groups.fresh.length}
              rows={groups.fresh}
              meta={ingestMeta}
              kind="minted"
            />
          </div>
        </section>
      ) : null}

      {!preview && !reading && !readError ? (
        <div className="mt-4">
          <EmptyState
            title="Nothing read yet"
            detail="Paste a few rows, drop a CSV file, type a single item, or load one of the sample lists. The result is the same either way: which of your items the country already has a code for."
          />
        </div>
      ) : null}
    </>
  )
}

/* ------------------------------------------------------------------- groups */

function ResultGroup({
  title,
  tone,
  count,
  rows,
  meta,
  kind,
  note,
  defaultOpen,
}: {
  title: string
  tone: 'accent' | 'attention' | 'neutral'
  count: number
  rows: IngestRowResult[]
  meta?: RequestMeta
  kind: 'matched' | 'minted'
  note?: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  const reduced = useReducedMotion()

  return (
    <Panel flush>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          aria-expanded={open}
          disabled={count === 0}
          className="inline-flex items-center gap-2 text-left disabled:cursor-default"
        >
          {open ? (
            <CaretDown size={16} weight="regular" />
          ) : (
            <CaretRight size={16} weight="regular" />
          )}
          <span className="font-display text-[13px] font-semibold tracking-tight text-ink">
            {title}
          </span>
          <Chip tone={tone}>{formatExact(count)}</Chip>
        </button>
        <TechnicalOnly>
          {meta ? (
            <span className="ml-auto">
              <EndpointTag
                method={meta.method}
                endpoint={meta.endpoint}
                ms={meta.ms}
                scanned={meta.scanned}
              />
            </span>
          ) : null}
        </TechnicalOnly>
      </div>

      {note ? (
        <p className="border-b border-rule px-5 py-3 text-[12.5px] leading-snug text-ink-2">{note}</p>
      ) : null}

      {count === 0 ? (
        <p className="px-5 py-4 text-[12.5px] text-ink-3">No rows landed in this group.</p>
      ) : open ? (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16 }}
        >
          {kind === 'matched' ? <MatchedTable rows={rows} /> : <MintedTable rows={rows} />}
        </motion.div>
      ) : null}
    </Panel>
  )
}

function MatchedTable({ rows }: { rows: IngestRowResult[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>What you sent</Th>
          <Th>National code</Th>
          <Th>Already in the registry</Th>
          <Th align="right">Score</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const match = row.match
          if (!match) return null
          return (
            <RowPair key={row.row.code}>
              <tr>
                <Td>
                  <span className="text-ink">{row.row.description}</span>
                  <span className="mt-1 block">
                    <Num size="xs" className="text-ink-3">
                      {row.row.code}
                    </Num>
                  </span>
                </Td>
                <Td>
                  <Mono>{match.code}</Mono>
                </Td>
                <Td>
                  <span className="text-ink-2">{match.record.rawDescription}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <Chip>{match.record.cpse}</Chip>
                    <Num size="xs" className="text-ink-3">
                      {match.record.localCode}
                    </Num>
                  </span>
                </Td>
                <Td align="right" className="w-[92px]">
                  <Num size="sm">{match.breakdown.combined.toFixed(3)}</Num>
                  <span className="mt-1.5 block">
                    <Meter value={match.breakdown.combined} />
                  </span>
                </Td>
              </tr>
              <TechnicalOnly>
                <tr className="bg-surface-2">
                  <WideTd span={4}>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] text-ink-2">
                      <span>
                        lexical <span className="tabular-nums text-ink">{match.breakdown.lexical.toFixed(3)}</span>
                      </span>
                      <span>
                        attribute{' '}
                        <span className="tabular-nums text-ink">{match.breakdown.attribute.toFixed(3)}</span>
                      </span>
                      <span>
                        numeric <span className="tabular-nums text-ink">{match.breakdown.numeric.toFixed(3)}</span>
                      </span>
                      <span className="text-ink-3">{match.expression}</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-ink-3">
                      signature {row.normalized.signature || 'none extracted'}
                    </div>
                  </WideTd>
                </tr>
              </TechnicalOnly>
            </RowPair>
          )
        })}
      </tbody>
    </Table>
  )
}

function MintedTable({ rows }: { rows: IngestRowResult[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>What you sent</Th>
          <Th>New code</Th>
          <Th>Signature it was built from</Th>
          <Th align="right">Unit</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <RowPair key={row.row.code}>
            <tr>
              <Td>
                <span className="text-ink">{row.row.description}</span>
                <span className="mt-1 block">
                  <Num size="xs" className="text-ink-3">
                    {row.row.code}
                  </Num>
                </span>
              </Td>
              <Td>
                <Mono>{row.mintedCode ?? ''}</Mono>
              </Td>
              <Td className="font-mono text-[12px] text-ink-2">
                {row.normalized.signature || 'no attributes extracted'}
              </Td>
              <Td align="right">
                <Num size="sm" className="text-ink-2">
                  {row.normalized.uom}
                </Num>
              </Td>
            </tr>
            <TechnicalOnly>
              <tr className="bg-surface-2">
                <WideTd span={4}>
                  <div className="font-mono text-[11px] text-ink-2">
                    nothing in the corpus scored above the review threshold, so a code was minted
                    from the signature
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-ink-3">
                    tokens {row.normalized.normalizedTokens.join(' ')}
                  </div>
                </WideTd>
              </tr>
            </TechnicalOnly>
          </RowPair>
        ))}
      </tbody>
    </Table>
  )
}

/** Two <tr> elements have to arrive in a tbody without a wrapping element. */
function RowPair({ children }: { children: ReactNode }) {
  return <>{children}</>
}

/**
 * A full-width cell under a row. `Td` deliberately does not take colSpan, so this
 * composes the same border and padding rather than widening the primitive.
 */
function WideTd({ children, span }: { children: ReactNode; span: number }) {
  return (
    <td colSpan={span} className="border-b border-rule px-3 py-2 align-top text-left">
      {children}
    </td>
  )
}
