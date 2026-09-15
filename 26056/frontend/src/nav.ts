import type { Icon } from '@phosphor-icons/react'
import {
  ChartLineUp,
  ChartScatter,
  CheckCircle,
  FileText,
  Function as FunctionIcon,
  Gauge,
  Gear,
  GridFour,
  Lightning,
  PlugsConnected,
  Robot,
  ShieldCheck,
  Sparkle,
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
      { to: '/forecast', label: 'Fare forecast', icon: Sparkle, blurb: 'LSTM + seasonal ARIMA, 14 and 30 days ahead' },
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
      { to: '/anomaly', label: 'Anomaly detection', icon: Lightning, blurb: 'AI-powered fare movement alerts' },
    ],
  },
  {
    id: 'api',
    label: 'API & Integration',
    items: [
      { to: '/api', label: 'API Explorer', icon: PlugsConnected, blurb: '37 endpoints, live requests, SDMX-JSON feed for NSO & RBI' },
      { to: '/reports', label: 'Reports', icon: FileText, blurb: 'Daily briefs, weekly summaries, monthly releases' },
    ],
  },
  {
    id: 'scraper',
    label: 'Scraper',
    items: [
      { to: '/scraper', label: 'Architecture', icon: Robot, blurb: 'Multi-source engine, collectors, pipeline' },
      { to: '/scraper-config', label: 'Config', icon: Gear, blurb: 'Rate limits, schedule, kill-switches, per-source overrides' },
      { to: '/proxy-pool', label: 'Proxy pool', icon: PlugsConnected, blurb: 'Rotating IP pool, cooldown, sticky domain' },
      { to: '/quotes', label: 'Quote explorer', icon: Table, blurb: 'The cleaned panel, row by row' },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV.flatMap((g) => g.items)
