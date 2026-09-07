import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { OverviewPage } from '@/pages/OverviewPage'
import { HeatmapPage } from '@/pages/HeatmapPage'
import { ElasticityPage } from '@/pages/ElasticityPage'
import { CrossCheckPage } from '@/pages/CrossCheckPage'
import { DecompositionPage } from '@/pages/DecompositionPage'
import { MethodologyPage } from '@/pages/MethodologyPage'
import { BacktestPage } from '@/pages/BacktestPage'
import { CompliancePage } from '@/pages/CompliancePage'
import { HealthPage } from '@/pages/HealthPage'
import { QuotesPage } from '@/pages/QuotesPage'
import { ApiPage } from '@/pages/ApiPage'
import { DesignSystemPage } from '@/pages/DesignSystemPage'

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/elasticity" element={<ElasticityPage />} />
        <Route path="/cross-check" element={<CrossCheckPage />} />
        <Route path="/decomposition" element={<DecompositionPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/backtest" element={<BacktestPage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="/design-system" element={<DesignSystemPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
