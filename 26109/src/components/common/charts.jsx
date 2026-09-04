import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts'
import { riskMeta } from '../../utils/riskUtils'
import { useI18n } from '../../i18n/i18n.jsx'

const axis = { fontSize: 11, fill: '#9ca3af' }
const grid = '#eef0f2'

export function TrendChart({ data, series, height = 260, threshold }) {
  const hasRight = series.some((s) => s.axis === 'right')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: hasRight ? 4 : 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={{ stroke: grid }} minTickGap={20} />
        <YAxis yAxisId="left" tick={axis} tickLine={false} axisLine={false} width={44} />
        {hasRight && (
          <YAxis yAxisId="right" orientation="right" tick={axis} tickLine={false} axisLine={false} width={44} />
        )}
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {threshold !== undefined && (
          <ReferenceLine yAxisId="left" y={threshold} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Threshold', fontSize: 10, fill: '#ef4444', position: 'right' }} />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            yAxisId={s.axis === 'right' ? 'right' : 'left'}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function AreaTrend({ data, dataKey, color = '#16a34a', height = 200, name }) {
  const id = `area-${dataKey}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={{ stroke: grid }} minTickGap={20} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={44} domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
        <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RiskDistribution({ data, centerLabel, centerSub }) {
  const { t } = useI18n()
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
      <div className="relative h-40 w-40 shrink-0 md:h-48 md:w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="65%" outerRadius="95%" paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={riskMeta(d.name).hex} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{centerLabel}</span>
            {centerSub && <span className="text-[11px] text-gray-400">{centerSub}</span>}
          </div>
        )}
      </div>
      <ul className="w-full flex-1 space-y-3 sm:max-w-[180px]">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: riskMeta(d.name).hex }} />
              <span className="text-gray-600">{t(`risk.${d.name}`)}</span>
            </span>
            <span className="whitespace-nowrap font-medium text-gray-900">
              {d.value} <span className="text-xs text-gray-400">({Math.round((d.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
