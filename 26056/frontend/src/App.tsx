import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { AuthProvider, ProtectedRoute } from '@/contexts/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
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
import { AnomalyPage } from '@/pages/AnomalyPage'
import ApiPage from '@/pages/ApiPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { DesignSystemPage } from '@/pages/DesignSystemPage'
import { SectorsPage } from '@/pages/SectorsPage'
import { ScraperConfigPage } from '@/pages/ScraperConfigPage'
import { ScraperArchPage } from '@/pages/ScraperArchPage'
import { ForecastPage } from '@/pages/ForecastPage'
import { ModelManagementPage } from '@/pages/ModelManagementPage'
import ProxyPoolPage from '@/pages/ProxyPoolPage'

export function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <OverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/heatmap"
            element={
              <ProtectedRoute>
                <HeatmapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elasticity"
            element={
              <ProtectedRoute>
                <ElasticityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cross-check"
            element={
              <ProtectedRoute>
                <CrossCheckPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decomposition"
            element={
              <ProtectedRoute>
                <DecompositionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/methodology"
            element={
              <ProtectedRoute>
                <MethodologyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/backtest"
            element={
              <ProtectedRoute>
                <BacktestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <CompliancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health"
            element={
              <ProtectedRoute>
                <HealthPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes"
            element={
              <ProtectedRoute>
                <QuotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anomaly"
            element={
              <ProtectedRoute>
                <AnomalyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api"
            element={
              <ProtectedRoute>
                <ApiPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forecast"
            element={
              <ProtectedRoute>
                <ForecastPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/design-system"
            element={
              <ProtectedRoute>
                <DesignSystemPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scraper"
            element={
              <ProtectedRoute>
                <ScraperArchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scraper-config"
            element={
              <ProtectedRoute>
                <ScraperConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sectors"
            element={
              <ProtectedRoute>
                <SectorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/model-management"
            element={
              <ProtectedRoute>
                <ModelManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proxy-pool"
            element={
              <ProtectedRoute>
                <ProxyPoolPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  )
}
