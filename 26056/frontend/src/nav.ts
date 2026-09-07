import type { Icon } from '@phosphor-icons/react'
import {
  ChartLineUp,
  ChartScatter,
  CheckCircle,
  Function as FunctionIcon,
  Gauge,
  GridFour,
  Palette,
  PlugsConnected,
  ShieldCheck,
  StackSimple,
  Table,
  TrendDown,
} from '@phosphor-icons/react'

export interface NavItem {
  to: string
  label: string
  icon: Icon
  blurb: string
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    id: 'index',
    label: 'The index',
    items: [
      {
        to: '/',
        label: 'APIx headline',
        icon: ChartLineUp,
        blurb: 'Published index, confidence band, what moved it',
      },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    items: [
      { to: '/heatmap', label: 'Sector heatmap', icon: GridFour, blurb: '20 sectors by 5 lead windows' },
      { to: '/elasticity', label: 'Lead-time curve', icon: TrendDown, blurb: 'Fare against days to departure' },
      { to: '/cross-check', label: 'Aggregator cross-check', icon: CheckCircle, blurb: 'One flight, priced on eight sites' },
      { to: '/decomposition', label: 'Fare decomposition', icon: StackSimple, blurb: 'Base, taxes, UDF, convenience' },
    ],
  },
  {
    id: 'method',
    label: 'Method',
    items: [
      { to: '/methodology', label: 'Methodology console', icon: FunctionIcon, blurb: 'Jevons against Dutot and Carli, live' },
      { to: '/backtest', label: 'Back-test', icon: ChartScatter, blurb: '30 days against reference series' },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    items: [
      { to: '/compliance', label: 'Compliance gate', icon: ShieldCheck, blurb: 'Posture, caps, audit log, kill-switch' },
      { to: '/health', label: 'Collection health', icon: Gauge, blurb: 'Yield, coverage, block rate, latency' },
      { to: '/quotes', label: 'Quote explorer', icon: Table, blurb: 'The cleaned panel, row by row' },
    ],
  },
  {
    id: 'publish',
    label: 'Publish',
    items: [
      { to: '/api', label: 'API and SDMX', icon: PlugsConnected, blurb: 'What NSO and RBI actually consume' },
      { to: '/design-system', label: 'Design system', icon: Palette, blurb: 'Tokens, components, palette gates' },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items)
