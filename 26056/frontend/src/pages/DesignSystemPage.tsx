import { useState } from 'react'
import {
  CheckCircle,
  CirclesThreePlus,
  Palette,
  Prohibit,
  Ruler,
  Sparkle,
  Swatches,
  TextAa,
  Timer,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Callout,
  ChartSkeleton,
  DataTable,
  EmptyState,
  Formula,
  KeyValue,
  Legend,
  Meter,
  PageHeader,
  Panel,
  SegmentedControl,
  Select,
  Slider,
  StatTile,
  StatusChip,
  Toggle,
  divergingScale,
  sequentialScale,
  seriesScale,
  useChartTokens,
  useTheme,
} from '@/ds'

interface TokenRow {
  name: string
  role: string
}

const SURFACE_TOKENS: TokenRow[] = [
  { name: '--vm-bg', role: 'Page plane, behind every panel' },
  { name: '--vm-surface', role: 'Panel and card surface' },
  { name: '--vm-surface-2', role: 'Raised control, table header, tooltip' },
  { name: '--vm-surface-3', role: 'Hover and pressed states' },
  { name: '--vm-surface-inset', role: 'Recessed wells: formulas, code, meters' },
]

const INK_TOKENS: TokenRow[] = [
  { name: '--vm-ink', role: 'Primary text and numbers' },
  { name: '--vm-ink-2', role: 'Body copy and secondary values' },
  { name: '--vm-ink-3', role: 'Axis labels, captions, metadata' },
  { name: '--vm-line', role: 'Hairline borders and dividers' },
  { name: '--vm-line-strong', role: 'Emphasised edges and scrollbars' },
]

const SEMANTIC_TOKENS: TokenRow[] = [
  { name: '--vm-accent', role: 'The single product accent. Azure.' },
  { name: '--vm-gate', role: 'The compliance layer, and only that layer' },
  { name: '--vm-good', role: 'Passing state' },
  { name: '--vm-warn', role: 'Needs attention' },
  { name: '--vm-serious', role: 'Degraded' },
  { name: '--vm-critical', role: 'Blocked or failing' },
]

const VALIDATOR_ROWS = [
  { check: 'Lightness band', dark: 'PASS, all six inside L 0.48 to 0.67', light: 'PASS, all six inside L 0.43 to 0.77' },
  { check: 'Chroma floor', dark: 'PASS, none reads grey', light: 'PASS, none reads grey' },
  { check: 'CVD separation', dark: 'PASS, worst adjacent pair ΔE 10.1 (protan)', light: 'PASS, worst adjacent pair ΔE 8.7 (deutan)' },
  { check: 'Normal-vision floor', dark: 'PASS, worst adjacent pair ΔE 23.8', light: 'PASS, worst adjacent pair ΔE 18.1' },
  { check: 'Contrast against surface', dark: 'PASS, all six clear 3:1 on #0b1220', light: 'PASS, all six clear 3:1 on #f6f8fb' },
]

function Swatch({ token, label, role }: { token: string; label: string; role: string }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span
        className="h-9 w-9 shrink-0 rounded-control ring-1 ring-line"
        style={{ background: `var(${token})` }}
      />
      <span className="min-w-0 flex-1">
        <span className="vm-num block truncate text-[11.5px] font-medium text-ink">{label}</span>
        <span className="block truncate text-[11px] text-ink-3">{role}</span>
      </span>
    </li>
  )
}

export function DesignSystemPage() {
  const t = useChartTokens()
  const { mode } = useTheme()
  const [demoSeg, setDemoSeg] = useState('a')
  const [demoToggle, setDemoToggle] = useState(true)
  const [demoSlider, setDemoSlider] = useState(3)
  const [demoSelect, setDemoSelect] = useState('one')

  const seriesRoles = [
    'Slot 1 · base fare, primary sector, APIx',
    'Slot 2 · taxes and fees, comparison sector',
    'Slot 3 · UDF, coverage',
    'Slot 4 · convenience charge',
    'Slot 5 · fifth category',
    'Slot 6 · sixth category',
  ]

  return (
    <div>
      <PageHeader
        kicker="VIMAAN design system"
        title="One token set, two authored modes, six validated series colours"
        lede="Every surface, number and chart in this product is drawn from the tokens below. Nothing hard-codes a hex value, which is why the mode switch is a single attribute flip rather than a second stylesheet."
        actions={
          <Badge tone="accent" icon={Palette}>
            Currently rendering in {mode} mode
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel icon={Swatches} title="Surfaces" meta="Five steps from the page plane to a recessed well">
          <ul className="divide-y divide-line">
            {SURFACE_TOKENS.map((s) => (
              <Swatch key={s.name} token={s.name} label={s.name} role={s.role} />
            ))}
          </ul>
        </Panel>

        <Panel icon={TextAa} title="Ink and lines" meta="Three text weights, two border strengths">
          <ul className="divide-y divide-line">
            {INK_TOKENS.map((s) => (
              <Swatch key={s.name} token={s.name} label={s.name} role={s.role} />
            ))}
          </ul>
        </Panel>

        <Panel
          icon={Sparkle}
          title="Semantic colour"
          meta="One accent, one compliance colour, four reserved status colours"
          footnote="Status colours are never reused as a chart series, and never carry meaning alone: each ships with an icon and a label."
        >
          <ul className="divide-y divide-line">
            {SEMANTIC_TOKENS.map((s) => (
              <Swatch key={s.name} token={s.name} label={s.name} role={s.role} />
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        className="mt-3"
        icon={CirclesThreePlus}
        title="Categorical series palette"
        meta="Six slots, assigned in fixed order and never cycled. A seventh category folds into Other."
        footnote="Both modes were run through the data-visualisation six-check validator against this app's actual surfaces. Six is the ceiling that clears every gate in both modes, so the palette stops at six rather than generating a hue."
      >
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {seriesScale(t).map((c, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-control bg-surface-inset p-2.5 ring-1 ring-line"
            >
              <span className="h-10 w-10 shrink-0 rounded-control" style={{ background: c }} />
              <span className="min-w-0">
                <span className="vm-num block text-[11.5px] font-semibold text-ink">
                  --vm-s{i + 1} · {c}
                </span>
                <span className="block truncate text-[11px] text-ink-3">{seriesRoles[i]}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <DataTable
            rowKey={(r) => r.check}
            columns={[
              {
                key: 'check',
                header: 'Validator check',
                cell: (r) => <span className="font-medium text-ink">{r.check}</span>,
              },
              {
                key: 'dark',
                header: 'Dark surface',
                cell: (r) => (
                  <span className="flex items-start gap-1.5">
                    <CheckCircle size={13} weight="bold" className="mt-0.5 shrink-0 text-good" />
                    <span className="text-ink-2">{r.dark}</span>
                  </span>
                ),
              },
              {
                key: 'light',
                header: 'Light surface',
                cell: (r) => (
                  <span className="flex items-start gap-1.5">
                    <CheckCircle size={13} weight="bold" className="mt-0.5 shrink-0 text-good" />
                    <span className="text-ink-2">{r.light}</span>
                  </span>
                ),
              },
            ]}
            rows={VALIDATOR_ROWS}
          />
        </div>
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel
          icon={Swatches}
          title="Value ramps"
          meta="Sequential for magnitude, diverging for polarity. Never a rainbow, never a hue at the diverging midpoint."
        >
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Sequential, one hue
          </p>
          <div className="flex overflow-hidden rounded-control">
            {sequentialScale(t).map((c, i) => (
              <span key={i} className="h-9 flex-1" style={{ background: c }} />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-3">
            Used for coverage, yield and any quantity where zero should recede toward the surface.
          </p>

          <p className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Diverging, two hues with a neutral midpoint
          </p>
          <div className="flex overflow-hidden rounded-control">
            {divergingScale(t).map((c, i) => (
              <span key={i} className="h-9 flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="mt-2">
            <Legend
              items={[
                { label: 'Fares fell', color: t['div-n3'] },
                { label: 'No material change', color: t['div-mid'] },
                { label: 'Fares rose', color: t['div-p3'] },
              ]}
            />
          </div>
        </Panel>

        <Panel icon={TextAa} title="Type and rhythm" meta="Three families, each with one job">
          <div className="space-y-4">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Display · Space Grotesk
              </p>
              <p className="font-display text-2xl font-semibold tracking-tight text-ink">
                APIx stands at 118.42
              </p>
              <p className="mt-0.5 text-[11px] text-ink-3">
                Page titles, panel headings, the headline figure.
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Body · IBM Plex Sans
              </p>
              <p className="max-w-[60ch] text-[13px] leading-relaxed text-ink-2">
                An airfare is not a fixed basket item. Holding the lead time constant holds quality
                constant, which is what makes two nights comparable at all.
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Numeric and formulas · IBM Plex Mono
              </p>
              <Formula caption="Tabular figures everywhere a number sits in a column, so digits align down the page.">
                {`  I_c  =  ∏ ( p_i,t / p_i,t-1 ) ^ (1/n)`}
              </Formula>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Radius, one system
              </p>
              <ul className="space-y-1.5">
                {[
                  { label: 'Panels, 14px', cls: 'rounded-panel' },
                  { label: 'Controls, 10px', cls: 'rounded-control' },
                  { label: 'Chips, full', cls: 'rounded-chip' },
                ].map((r) => (
                  <li key={r.cls} className="flex items-center gap-2">
                    <span className={`h-7 w-12 bg-surface-3 ring-1 ring-line ${r.cls}`} />
                    <span className="text-[11.5px] text-ink-2">{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Motion
              </p>
              <KeyValue
                dense
                rows={[
                  { k: 'Fast', v: '120ms' },
                  { k: 'Default', v: '220ms' },
                  { k: 'Entrance', v: '420ms' },
                  { k: 'Easing', v: 'cubic-bezier(.16,1,.3,1)' },
                ]}
              />
              <p className="mt-2 text-[11px] leading-snug text-ink-3">
                Everything collapses to static under a reduced-motion request.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-3"
        icon={Ruler}
        title="Component gallery"
        meta="Every piece the dashboard is assembled from, in its real states"
        bleed
      >
        <div className="grid grid-cols-1 gap-px bg-[var(--vm-line)] lg:grid-cols-2">
          <div className="bg-surface p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Buttons
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" icon={Sparkle}>
                Primary
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>

            <p className="mb-3 mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Badges and publication status
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent" icon={Sparkle}>
                accent
              </Badge>
              <Badge tone="good" icon={CheckCircle}>
                good
              </Badge>
              <Badge tone="warn" icon={Warning}>
                warn
              </Badge>
              <Badge tone="critical" icon={Prohibit}>
                critical
              </Badge>
              <Badge tone="gate" icon={Warning}>
                gate
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusChip status="PROVISIONAL" />
              <StatusChip status="REVISED" />
              <StatusChip status="FROZEN" />
              <StatusChip status="SUPPRESSED" />
            </div>
          </div>

          <div className="bg-surface p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Controls
            </p>
            <div className="space-y-4">
              <SegmentedControl
                label="Segmented"
                value={demoSeg}
                onChange={setDemoSeg}
                options={[
                  { value: 'a', label: 'Daily' },
                  { value: 'b', label: 'Weekly' },
                  { value: 'c', label: 'Monthly' },
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Select"
                  value={demoSelect}
                  onChange={setDemoSelect}
                  options={[
                    { value: 'one', label: 'DEL-BOM' },
                    { value: 'two', label: 'DEL-BLR' },
                  ]}
                />
                <Toggle
                  checked={demoToggle}
                  onChange={setDemoToggle}
                  label="Confidence band"
                  hint="Labelled switch, never a bare icon"
                />
              </div>
              <Slider
                label="Tukey fence, k"
                min={1}
                max={5}
                step={0.1}
                value={demoSlider}
                onChange={setDemoSlider}
                readout={`k = ${demoSlider.toFixed(1)}`}
              />
              <div>
                <p className="mb-1.5 text-[11.5px] text-ink-2">Meter with a threshold marker</p>
                <Meter value={83} threshold={70} thresholdLabel="70% gate" tone="good" height={10} />
              </div>
            </div>
          </div>

          <div className="bg-surface p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Stat tiles
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="With a delta and a spark"
                value="118.42"
                icon={Sparkle}
                tone="accent"
                delta={{ value: '+1.8%', direction: 'up', good: false }}
                note="30-day movement"
                spark={[3, 5, 4, 7, 6, 9, 8, 11, 10, 13]}
              />
              <StatTile
                label="With a warning tone"
                value="2"
                unit="of 90"
                icon={Warning}
                tone="warn"
                note="Nights suppressed for low coverage"
              />
            </div>

            <p className="mb-3 mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Callouts
            </p>
            <div className="space-y-2">
              <Callout tone="accent" title="Accent">
                Explains a method choice in place, next to the thing it governs.
              </Callout>
              <Callout tone="gate" title="Compliance">
                Reserved for the collection gate, so the eye learns the colour.
              </Callout>
            </div>
          </div>

          <div className="bg-surface p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Loading and empty states
            </p>
            <ChartSkeleton height={140} />
            <div className="mt-3">
              <EmptyState
                title="Nothing matches these filters"
                hint="Loosen a filter, or clear them all."
                action={<Button variant="secondary">Clear filters</Button>}
              />
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel icon={CheckCircle} title="Rules this system holds itself to">
          <ul className="space-y-2.5 text-[12px] leading-relaxed text-ink-2">
            <li>
              <strong className="text-ink">One accent for the whole product.</strong> Azure, in both
              modes. Amber belongs to the compliance layer and appears nowhere else.
            </li>
            <li>
              <strong className="text-ink">Colour follows the entity, never its rank.</strong>{' '}
              Filtering a chart does not repaint the series that survive.
            </li>
            <li>
              <strong className="text-ink">Never two vertical scales on one chart.</strong> Two
              measures of different magnitude get indexed to a common base or split into two charts.
            </li>
            <li>
              <strong className="text-ink">A legend whenever two or more series share a plot.</strong>{' '}
              Identity is never carried by colour alone.
            </li>
            <li>
              <strong className="text-ink">Both modes are authored.</strong> Light is not an
              inverted dark theme; each mode has its own steps from the same ramps.
            </li>
          </ul>
        </Panel>

        <Panel icon={Timer} title="How to extend it">
          <Formula caption="Add the role to tokens.css in both mode blocks, expose it through the Tailwind theme, then consume it by name. A component that reaches for a raw hex is the bug.">
            {`:root[data-theme='dark']  { --vm-s7: <hex>; }
:root[data-theme='light'] { --vm-s7: <hex>; }

// tailwind.config.js
colors: { s7: 'var(--vm-s7)' }`}
          </Formula>
          <div className="mt-3">
            <Callout tone="warn" title="Before adding a seventh series colour">
              Run the palette validator against both surfaces first. If the new hue cannot clear the
              adjacent-pair gates, the right answer is to fold the seventh category into Other or to
              facet the chart, not to ship a colour readers cannot separate.
            </Callout>
          </div>
        </Panel>
      </div>
    </div>
  )
}
