/**
 * Savings.
 *
 * A savings page that presents one confident number is a savings page nobody
 * believes. So the number is presented as what it is: the last line of a four step
 * chain, three of whose steps are assumptions the reader can move. Move one and the
 * service recomputes; the headline follows.
 *
 * Every rupee figure on this page comes from one of two places, and the page says
 * which: the modelled chain returned by POST /analytics/savings, or annualQty x
 * unitPrice summed over the members of a real cluster. There are no display-only
 * constants here.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretDown, CaretRight } from '@phosphor-icons/react'
import {
  AnimatedNumber,
  Button,
  EmptyState,
  EndpointTag,
  ErrorState,
  Field,
  Label,
  Meter,
  Mono,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Skeleton,
  Slider,
  Table,
  Td,
  TextInput,
  Th,
} from '@/components/ui'
import { CategoryBarChart, FunnelChart, type FunnelStep } from '@/components/ui/charts'
import { ByMode, SimpleOnly, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { DEFAULT_SAVINGS, formatExact, formatRupees } from '@/engine/savings'
import type { SavingsInputs } from '@/engine/types'

/* -------------------------------------------------------------- disclosure */

function Disclosure({
  open,
  onToggle,
  label,
}: {
  open: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="inline-flex items-center gap-1.5 text-[12.5px] text-accent transition-colors hover:text-ink"
    >
      {open ? <CaretDown size={16} weight="regular" /> : <CaretRight size={16} weight="regular" />}
      {label}
    </button>
  )
}

/* -------------------------------------------------------------------- page */

function percent(value: number, places = 1): string {
  return `${(value * 100).toFixed(places)}%`
}

const SAME = (a: SavingsInputs, b: SavingsInputs) =>
  a.consolidatableShare === b.consolidatableShare &&
  a.avgAnnualSpendPerItem === b.avgAnnualSpendPerItem &&
  a.bulkDiscount === b.bulkDiscount

export default function SavingsPage() {
  const c = useCopy()

  const savings = useService(s => s.savings)
  const storeInputs = useService(s => s.savingsInputs)
  const setSavings = useService(s => s.setSavings)
  const clusters = useService(s => s.clusters)
  const dashboard = useService(s => s.dashboard)
  const health = useService(s => s.health)
  const error = useService(s => s.error)
  const refresh = useService(s => s.refresh)
  const lastCall = useService(s => s.lastCall)

  /* The controls hold a draft so a drag reads instantly. The draft is sent to the
   * service on a short trailing timer, which also keeps one call in flight at a
   * time and so keeps responses in order. */
  const [draft, setDraft] = useState<SavingsInputs>(storeInputs)
  const [spendText, setSpendText] = useState(() => String(storeInputs.avgAnnualSpendPerItem))
  const dirty = useRef(false)

  const [showAssumptions, setShowAssumptions] = useState(false)
  const [showControls, setShowControls] = useState(false)

  useEffect(() => {
    if (!dirty.current) return
    const timer = setTimeout(() => {
      void setSavings(draft)
    }, 50)
    return () => clearTimeout(timer)
  }, [draft, setSavings])

  function update(patch: Partial<SavingsInputs>) {
    dirty.current = true
    setDraft(previous => ({ ...previous, ...patch }))
  }

  function resetInputs() {
    dirty.current = true
    setDraft({ ...DEFAULT_SAVINGS })
    setSpendText(String(DEFAULT_SAVINGS.avgAnnualSpendPerItem))
  }

  const atDefaults = SAME(draft, DEFAULT_SAVINGS)

  /* Bars are scaled inside their own unit. A bar comparing a count of line items
   * against a rupee figure would be a shape with no meaning. */
  const stepMax = useMemo(() => {
    const max = { count: 0, rupees: 0 }
    for (const step of savings?.steps ?? []) {
      if (step.value > max[step.unit]) max[step.unit] = step.value
    }
    return max
  }, [savings])

  const topClusters = useMemo(
    () =>
      clusters
        .filter(cluster => cluster.members.length > 1)
        .sort((a, b) => b.annualSpend - a.annualSpend)
        .slice(0, 15),
    [clusters],
  )

  const clusterMax = topClusters.length > 0 ? topClusters[0].annualSpend : 0
  const clusterTotal = topClusters.reduce((sum, cluster) => sum + cluster.annualSpend, 0)

  const savingsCall = lastCall.savings
  const registryCall = lastCall.registry

  if (error) {
    return (
      <>
        <PageHead title={c('savingsTitle')} lead={c('savingsLead')} />
        <ErrorState message={error} onRetry={() => void refresh()} />
      </>
    )
  }

  if (dashboard && dashboard.loaded.length === 0) {
    return (
      <>
        <PageHead title={c('savingsTitle')} lead={c('savingsLead')} />
        <NothingLoaded what="This page works out what the duplicate codes cost each year, one step at a time, with every assumption editable." />
      </>
    )
  }

  if (!savings || !dashboard || !health) {
    return (
      <>
        <PageHead title={c('savingsTitle')} lead={c('savingsLead')} />
        <div className="flex flex-col gap-5">
          <Panel>
            <Skeleton rows={3} />
          </Panel>
          <Panel>
            <Skeleton rows={6} />
          </Panel>
        </div>
      </>
    )
  }

  /* Ratios read back out of the result rather than off the draft, so the arithmetic
   * shown is always the arithmetic that produced the figures shown. */
  const derived = {
    share: savings.duplicateLineItems > 0 ? savings.consolidatableItems / savings.duplicateLineItems : 0,
    perItem: savings.consolidatableItems > 0 ? savings.addressableSpend / savings.consolidatableItems : 0,
    discount: savings.addressableSpend > 0 ? savings.annualSaving / savings.addressableSpend : 0,
  }
  const sliceRate = dashboard.sampleSize > 0 ? health.duplicateRecords / dashboard.sampleSize : 0

  /* Same four live step values that feed the per-step Meter below, reshaped for
   * the funnel chart. These are not additive deltas in one unit (two steps are
   * item counts, two are rupee figures), so each bar is normalized against
   * stepMax for its own unit rather than stacked into a running total - see
   * the stepMax comment above for why. The last step (the saving itself) is
   * the one figure this chain exists to produce, so it alone reads as positive. */
  const funnelSteps: FunnelStep[] = savings.steps.map((step, index) => {
    const max = stepMax[step.unit]
    const format = step.unit === 'rupees' ? formatRupees : formatExact
    return {
      label: step.label,
      fraction: max > 0 ? step.value / max : 0,
      display: format(step.value),
      tone: index === savings.steps.length - 1 ? 'positive' : 'primary',
    }
  })

  const clusterChartData = topClusters.map(cluster => ({
    name: cluster.standardDescription,
    value: cluster.annualSpend,
  }))

  return (
    <>
      <PageHead title={c('savingsTitle')} lead={c('savingsLead')} />

      {/* ------------------------------------------------------------ headline */}

      <Panel className="px-5 py-6">
        <Label>
          <ByMode
            simple="What buying together would save every year"
            technical="annualSaving, rupees per year"
          />
        </Label>

        <div className="mt-2.5">
          <Num size="display" className="text-ink">
            <AnimatedNumber value={savings.annualSaving} format={formatRupees} />
          </Num>
        </div>

        <p className="mt-3.5 max-w-[64ch] text-[14px] leading-relaxed text-ink-2">
          <ByMode
            simple="This is not a measurement. It is what falls out in a year if the repeated purchases across the four government companies are tendered together, at the discount stated below. Every step from the duplicates we found down to this figure is shown underneath, and all three assumptions can be moved."
            technical="Conditional, not observed. The figure holds only if the duplicate lines identified by the matcher are tendered as consolidated volume at the stated discount. The full chain is below; all three assumptions are editable and the service recomputes on every change."
          />
        </p>

        <TechnicalOnly>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-3">
            {savingsCall ? (
              <EndpointTag
                method={savingsCall.method}
                endpoint={savingsCall.endpoint}
                ms={savingsCall.ms}
              />
            ) : (
              <span className="font-mono text-[10.5px] text-ink-3">
                POST /analytics/savings, not yet re-issued this session
              </span>
            )}
            <span className="font-mono text-[10.5px] text-ink-3">
              exact {formatExact(savings.annualSaving)}
            </span>
          </div>
        </TechnicalOnly>
      </Panel>

      {/* ------------------------------------------------- waterfall + controls */}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel flush>
          <PanelHead
            title={<ByMode simple="How the number is built" technical="Consolidation waterfall" />}
            meta={<ByMode simple="four steps" technical={`${savings.steps.length} steps`} />}
            action={
              <SimpleOnly>
                <Disclosure
                  open={showAssumptions}
                  onToggle={() => setShowAssumptions(v => !v)}
                  label={showAssumptions ? 'Hide what each step assumes' : 'What does each step assume?'}
                />
              </SimpleOnly>
            }
          />

          {/* Provenance. The first step is itself an extrapolation, and saying so
              here is what makes the rest of the chain readable as arithmetic. */}
          <div className="border-b border-rule bg-surface-2 px-5 py-3">
            <p className="max-w-[70ch] text-[12.5px] leading-relaxed text-ink-2">
              <ByMode
                simple={`In the slice of data you can inspect on this site, ${formatExact(
                  health.duplicateRecords,
                )} of ${formatExact(
                  dashboard.sampleSize,
                )} items sit in a group with at least one other company's version of the same thing. Applying that same rate across all ${formatExact(
                  dashboard.totalRecords,
                )} records gives the first line below.`}
                technical={`sampleDuplicateRate = ${formatExact(health.duplicateRecords)} / ${formatExact(
                  dashboard.sampleSize,
                )} = ${sliceRate.toFixed(4)}. duplicateLineItems = round(${formatExact(
                  dashboard.totalRecords,
                )} x ${sliceRate.toFixed(4)}) = ${formatExact(savings.duplicateLineItems)}.`}
              />
            </p>
          </div>

          <div className="border-b border-rule px-5 py-4">
            <FunnelChart steps={funnelSteps} height={220} />
          </div>

          <ol>
            {savings.steps.map((step, index) => {
              const max = stepMax[step.unit]
              const relative = max > 0 ? step.value / max : 0
              const format = step.unit === 'rupees' ? formatRupees : formatExact
              return (
                <li key={step.label} className="border-t border-rule px-5 py-4 first:border-t-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="flex min-w-0 items-baseline gap-2.5">
                      <Num size="xs" className="text-ink-3">
                        {index + 1}
                      </Num>
                      <span className="text-[13.5px] text-ink">{step.label}</span>
                    </div>
                    <Num size="lg" className="text-ink">
                      <AnimatedNumber value={step.value} format={format} />
                    </Num>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <TechnicalOnly>
                      <p className="max-w-[62ch] text-[12.5px] leading-snug text-ink-2">
                        {step.assumption}
                      </p>
                    </TechnicalOnly>
                    <SimpleOnly>
                      {showAssumptions ? (
                        <p className="max-w-[62ch] text-[12.5px] leading-snug text-ink-2">
                          {step.assumption}
                        </p>
                      ) : null}
                    </SimpleOnly>
                    <TechnicalOnly>
                      <span className="font-mono text-[10.5px] text-ink-3">
                        {percent(relative, 1)} of largest {step.unit} step
                        {step.unit === 'rupees' ? `, exact ${formatExact(step.value)}` : ''}
                      </span>
                    </TechnicalOnly>
                  </div>
                </li>
              )
            })}
          </ol>

          <TechnicalOnly>
            <div className="border-t border-rule bg-surface-2 px-5 py-3">
              <Label>Step to step</Label>
              <div className="mt-2 flex flex-col gap-1 font-mono text-[11.5px] leading-relaxed text-ink-2">
                <span>duplicateLineItems = {formatExact(savings.duplicateLineItems)}</span>
                <span>
                  x consolidatableShare {derived.share.toFixed(4)} = {formatExact(savings.consolidatableItems)}
                </span>
                <span>
                  x avgAnnualSpendPerItem {formatExact(derived.perItem)} ={' '}
                  {formatExact(savings.addressableSpend)}
                </span>
                <span>
                  x bulkDiscount {derived.discount.toFixed(4)} = {formatExact(savings.annualSaving)}
                </span>
              </div>
            </div>
          </TechnicalOnly>
        </Panel>

        {/* ------------------------------------------------------- assumptions */}

        <Panel flush className="self-start">
          <PanelHead
            title={<ByMode simple="The three assumptions" technical="SavingsInputs" />}
            meta={atDefaults ? undefined : <ByMode simple="edited" technical="modified" />}
          />

          <SimpleOnly>
            <div className="border-b border-rule px-5 py-3">
              <Disclosure
                open={showControls}
                onToggle={() => setShowControls(v => !v)}
                label={showControls ? 'Hide the assumptions' : 'Change the assumptions and watch the number move'}
              />
            </div>
          </SimpleOnly>

          <ByMode
            simple={
              showControls ? (
                <div className="flex flex-col gap-5 px-5 py-4">
                  <Slider
                    label="How much of the overlap we can actually buy together"
                    value={draft.consolidatableShare}
                    onChange={value => update({ consolidatableShare: value })}
                    min={0}
                    max={1}
                    step={0.01}
                    format={value => percent(value, 0)}
                    hint="Contracts already running and plant-approved suppliers mean not every repeat can be merged."
                  />

                  <Field
                    label="What one repeated item costs a year"
                    helper={`Read as ${formatRupees(draft.avgAnnualSpendPerItem)} per item, per year.`}
                  >
                    <TextInput
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      value={spendText}
                      onChange={event => {
                        const text = event.target.value
                        setSpendText(text)
                        const parsed = Number(text)
                        if (text.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) {
                          update({ avgAnnualSpendPerItem: parsed })
                        }
                      }}
                      className="font-mono tabular-nums"
                    />
                  </Field>

                  <Slider
                    label="The discount from buying as one order"
                    value={draft.bulkDiscount}
                    onChange={value => update({ bulkDiscount: value })}
                    min={0}
                    max={1}
                    step={0.005}
                    format={value => percent(value, 1)}
                    hint="What four buyers negotiating as one would expect to take off the price."
                  />

                  <div className="border-t border-rule pt-3">
                    <Button variant="ghost" size="sm" onClick={resetInputs} disabled={atDefaults}>
                      Reset to the stated assumptions
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4">
                  <dl className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-[12.5px] text-ink-2">Overlap we can buy together</dt>
                      <dd>
                        <Num size="sm">{percent(draft.consolidatableShare, 0)}</Num>
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-[12.5px] text-ink-2">Cost of one repeated item a year</dt>
                      <dd>
                        <Num size="sm">{formatRupees(draft.avgAnnualSpendPerItem)}</Num>
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-[12.5px] text-ink-2">Discount from one order</dt>
                      <dd>
                        <Num size="sm">{percent(draft.bulkDiscount, 1)}</Num>
                      </dd>
                    </div>
                  </dl>
                </div>
              )
            }
            technical={
              <div className="flex flex-col gap-5 px-5 py-4">
                <Slider
                  label="consolidatableShare"
                  value={draft.consolidatableShare}
                  onChange={value => update({ consolidatableShare: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  format={value => value.toFixed(2)}
                  hint="Share of duplicate line items that survive running contracts and vendor qualification."
                />

                <Field
                  label="avgAnnualSpendPerItem"
                  helper={`Rupees per item per year. ${formatRupees(draft.avgAnnualSpendPerItem)}.`}
                >
                  <TextInput
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    value={spendText}
                    onChange={event => {
                      const text = event.target.value
                      setSpendText(text)
                      const parsed = Number(text)
                      if (text.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) {
                        update({ avgAnnualSpendPerItem: parsed })
                      }
                    }}
                    className="font-mono tabular-nums"
                  />
                </Field>

                <Slider
                  label="bulkDiscount"
                  value={draft.bulkDiscount}
                  onChange={value => update({ bulkDiscount: value })}
                  min={0}
                  max={1}
                  step={0.005}
                  format={value => value.toFixed(3)}
                  hint="Discount applied to the consolidated volume in a single tender."
                />

                <div className="flex flex-col gap-2 border-t border-rule pt-3">
                  <div className="font-mono text-[11px] leading-relaxed text-ink-3">
                    <div>
                      stated {DEFAULT_SAVINGS.consolidatableShare.toFixed(2)} /{' '}
                      {formatExact(DEFAULT_SAVINGS.avgAnnualSpendPerItem)} /{' '}
                      {DEFAULT_SAVINGS.bulkDiscount.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <Button variant="ghost" size="sm" onClick={resetInputs} disabled={atDefaults}>
                      Reset to the stated assumptions
                    </Button>
                  </div>
                </div>
              </div>
            }
          />
        </Panel>
      </div>

      {/* ------------------------------------------- where the money actually is */}

      <Panel flush className="mt-5">
        <PanelHead
          title={<ByMode simple="Where the money actually is" technical="Cluster spend, measured" />}
          meta={
            <ByMode
              simple={`${topClusters.length} largest groups`}
              technical={`top ${topClusters.length} by annualSpend`}
            />
          }
          action={
            <TechnicalOnly>
              {registryCall ? (
                <EndpointTag
                  method={registryCall.method}
                  endpoint={registryCall.endpoint}
                  ms={registryCall.ms}
                  scanned={registryCall.scanned}
                />
              ) : null}
            </TechnicalOnly>
          }
        />

        <div className="border-b border-rule px-5 py-3">
          <p className="max-w-[78ch] text-[12.5px] leading-relaxed text-ink-2">
            <ByMode
              simple="These rupee figures are added up from the real quantities and prices on the records shown on this site. They are counted, not projected. The large number at the top of this page is a projection built on the three assumptions above; these are not."
              technical="annualSpend is the sum of annualQty x unitPrice over every member of the cluster, taken from the inspectable slice. Measured, not modelled. The headline extrapolates across the full corpus; this table does not."
            />
          </p>
        </div>

        {topClusters.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState
              title="No group has more than one member yet"
              detail="Nothing here is bought twice under two names, so there is no overlap to price. Approve some duplicate pairs and the groups will form."
            />
          </div>
        ) : (
          <>
            <div className="border-b border-rule px-5 py-4">
              <CategoryBarChart data={clusterChartData} format={formatRupees} barSize={14} />
            </div>

            <Table>
              <thead>
                <tr>
                  <Th>
                    <ByMode simple="National code" technical="CNMC code" />
                  </Th>
                  <Th>
                    <ByMode simple="Agreed description" technical="Standard description" />
                  </Th>
                  <Th align="right">
                    <ByMode simple="Records" technical="Members" />
                  </Th>
                  <Th>
                    <ByMode simple="Companies" technical="CPSEs" />
                  </Th>
                  <Th align="right">
                    <ByMode simple="Spent a year" technical="annualSpend" />
                  </Th>
                </tr>
              </thead>
              <tbody>
                {topClusters.map(cluster => (
                  <tr key={cluster.code}>
                    <Td>
                      <Mono>{cluster.code}</Mono>
                    </Td>
                    <Td>
                      <span className="text-[13px] text-ink">{cluster.standardDescription}</span>
                    </Td>
                    <Td align="right">
                      <Num size="sm" className="text-ink-2">
                        {cluster.members.length}
                      </Num>
                    </Td>
                    <Td>
                      <Num size="xs" className="text-ink-2">
                        {cluster.cpses.join(' ')}
                      </Num>
                    </Td>
                    <Td align="right">
                      <div className="ml-auto w-[150px]">
                        <Num size="sm" className="text-ink">
                          {formatRupees(cluster.annualSpend)}
                        </Num>
                        <div className="mt-1.5">
                          <Meter value={clusterMax > 0 ? cluster.annualSpend / clusterMax : 0} />
                        </div>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-5 py-3">
              <span className="text-[12.5px] text-ink-2">
                <ByMode
                  simple={`These ${topClusters.length} groups alone account for`}
                  technical={`sum of annualSpend over the ${topClusters.length} rows above`}
                />
              </span>
              <Num size="base" className="text-ink">
                {formatRupees(clusterTotal)}
              </Num>
            </div>
          </>
        )}
      </Panel>
    </>
  )
}
