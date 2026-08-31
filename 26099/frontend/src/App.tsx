import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import LoginPage from '@/pages/LoginPage'
import { useDemoEngine } from '@/store/demo'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const MaterialsPage = lazy(() => import('@/pages/MaterialsPage'))
const MatchingPage = lazy(() => import('@/pages/MatchingPage'))
const ReviewsPage = lazy(() => import('@/pages/ReviewsPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))

export default function App() {
  const { isLoggedIn, login } = useDemoEngine()

  if (!isLoggedIn) {
    return <LoginPage onLogin={login} />
  }

  return (
    <div className="h-screen w-screen flex bg-dark-950 text-slate-100 overflow-hidden font-sans antialiased">
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
