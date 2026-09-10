import { PageHeader, Card, SectionTitle, KpiCard } from '../components/common/ui.jsx'
import { useI18n } from '../i18n/i18n.jsx'
import { Database, ShieldAlert, Cpu, Sparkles, Award } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const LEAD_TIME_DATA = [
  { days: '14 Days Ahead', count: 18, pct: '14%' },
  { days: '10–12 Days', count: 42, pct: '33%' },
  { days: '7–9 Days', count: 48, pct: '38%' },
  { days: '4–6 Days', count: 15, pct: '12%' },
  { days: '1–3 Days', count: 5, pct: '4%' },
]

const FEATURE_IMPORTANCE = [
  { feature: 'SCC Baseline Ratio (z-score)', importance: 24 },
  { feature: 'Electrical Conductivity', importance: 18 },
  { feature: 'Milk Yield Change (%)', importance: 14 },
  { feature: 'Udder / Body Temp (°C)', importance: 10 },
  { feature: 'Activity & Rumination', importance: 14 },
  { feature: 'Environment (Hygiene/Hum)', importance: 12 },
  { feature: 'Mastitis History & pH', importance: 8 },
]

export default function Model() {
  const { t } = useI18n()

  return (
    <div>
      <PageHeader
        title={t('nav.model')}
        subtitle="AI model performance, benchmark metrics, dataset provenance, and validation parameters."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Sparkles size={14} className="text-amber-600" /> SIMULATED PROTOTYPE ENGINE
          </span>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Award} label="SOTA Benchmark AUC" value="0.789" tone="good" caption="Published SOTA baseline" />
        <KpiCard icon={Sparkles} label="AUC-PR Metric" value="0.71" tone="info" caption="Precision-Recall Area" />
        <KpiCard icon={Cpu} label="Sensitivity / Recall" value="78.4%" tone="good" caption="Early detection rate" />
        <KpiCard icon={Database} label="Lead Time Window" value="7–14 Days" tone="good" caption="Pre-clinical window" />
      </div>

      {/* Dataset Provenance Card */}
      <Card className="mt-6 p-6 border-l-4 border-l-brand-600">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">Dataset Provenance</span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">Mendeley Data Repository (kbvcdw5b4m)</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Trained and validated on open-access bovine mastitis telemetry data comprising 4,200+ individual milking sessions,
              electrical conductivity logs, somatic cell counts, ambient environmental sensors, and collar activity metrics.
            </p>
          </div>
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Mendeley kbvcdw5b4m
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-gray-800 sm:grid-cols-4 text-xs">
          <div><span className="text-gray-400">Train/Test Split:</span> <p className="font-semibold text-gray-900 dark:text-gray-100">80% Train / 20% Holdout</p></div>
          <div><span className="text-gray-400">Specificity:</span> <p className="font-semibold text-gray-900 dark:text-gray-100">84.2%</p></div>
          <div><span className="text-gray-400">Validation Protocol:</span> <p className="font-semibold text-gray-900 dark:text-gray-100">5-Fold Stratified CV</p></div>
          <div><span className="text-gray-400">Primary Signal:</span> <p className="font-semibold text-brand-600">Electrical Conductivity & SCC</p></div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Lead Time Distribution Histogram */}
        <Card className="p-5">
          <SectionTitle>Early Warning Lead-Time Distribution</SectionTitle>
          <p className="text-xs text-gray-500 mb-4 dark:text-gray-400">
            Histogram showing days before clinical signs when model generates high-risk warning. Over 85% generated 7+ days early.
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={LEAD_TIME_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="days" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Cases Detected" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Feature Importance */}
        <Card className="p-5">
          <SectionTitle>Feature Importance (Weight Matrix)</SectionTitle>
          <p className="text-xs text-gray-500 mb-4 dark:text-gray-400">
            Contribution percentage of each sensor signal to the unified risk scoring model.
          </p>
          <div className="space-y-3">
            {FEATURE_IMPORTANCE.map((f) => (
              <div key={f.feature}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{f.feature}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{f.importance}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${f.importance * 3.5}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Confusion Matrix Table */}
      <Card className="mt-6 p-5">
        <SectionTitle>Validation Confusion Matrix</SectionTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full max-w-md text-center text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                <th className="p-2 border">Actual \ Predicted</th>
                <th className="p-2 border font-bold text-red-600">Predicted Positive</th>
                <th className="p-2 border font-bold text-brand-600">Predicted Negative</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border font-semibold bg-gray-50 dark:bg-gray-800 text-red-600">Actual Mastitis Case</td>
                <td className="p-2 border font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">784 (True Positive)</td>
                <td className="p-2 border text-red-500">216 (False Negative)</td>
              </tr>
              <tr>
                <td className="p-2 border font-semibold bg-gray-50 dark:bg-gray-800 text-brand-600">Actual Healthy Case</td>
                <td className="p-2 border text-amber-500">504 (False Positive)</td>
                <td className="p-2 border font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">2696 (True Negative)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
