import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import LoginPage from '@/pages/LoginPage'
import { useDemoEngine } from '@/store/demo'
import { useThemeStore } from '@/store/theme'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const MaterialsPage = lazy(() => import('@/pages/MaterialsPage'))
const MatchingPage = lazy(() => import('@/pages/MatchingPage'))
const ReviewsPage = lazy(() => import('@/pages/ReviewsPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const NormalizePage = lazy(() => import('@/pages/NormalizePage'))
const AuditPage = lazy(() => import('@/pages/AuditPage'))
const CnmcRegistryPage = lazy(() => import('@/pages/CnmcRegistryPage'))
const UploadPage = lazy(() => import('@/pages/UploadPage'))

export default function App() {
  const { isLoggedIn, login } = useDemoEngine()
  useThemeStore() // Ensure theme store is active and synced

  if (!isLoggedIn) {
    return <LoginPage onLogin={login} />
  }

  return (
    <div className="h-screen w-screen flex bg-dark-950 text-dark-200 overflow-hidden font-sans antialiased">
      {/* Fixed-width left sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-dark-950">
        <Header />
        <main className="flex-1 overflow-hidden relative">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/matching" element={<MatchingPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/normalize" element={<NormalizePage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/registry" element={<CnmcRegistryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
