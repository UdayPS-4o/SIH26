import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Skeleton, Toasts } from '@/components/ui'
import { useService } from '@/store/service'
import { useRole } from '@/store/role'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const OverviewPage = lazy(() => import('@/pages/OverviewPage'))
const ExplorerPage = lazy(() => import('@/pages/ExplorerPage'))
const MatchPage = lazy(() => import('@/pages/MatchPage'))
const DuplicatesPage = lazy(() => import('@/pages/DuplicatesPage'))
const SavingsPage = lazy(() => import('@/pages/SavingsPage'))
const RegistryPage = lazy(() => import('@/pages/RegistryPage'))
const MigrationPage = lazy(() => import('@/pages/MigrationPage'))
const IntegrationPage = lazy(() => import('@/pages/IntegrationPage'))
const ImportPage = lazy(() => import('@/pages/ImportPage'))
const NormalizePage = lazy(() => import('@/pages/NormalizePage'))
const ActivityPage = lazy(() => import('@/pages/ActivityPage'))
const EnginePage = lazy(() => import('@/pages/EnginePage'))

function RedirectIfEmpty({ children }: { children: ReactNode }) {
  const loaded = useService(s => s.ready)
  const loadedCount = useService(s => s.records?.length ?? 0)

  if (!loaded) {
    return (
      <div className="flex h-[100dvh] w-full overflow-hidden bg-paper text-ink antialiased">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] px-6 py-8 pb-20">
              <Skeleton rows={8} />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (loadedCount === 0) {
    return <Navigate to="/overview" replace />
  }

  return children
}

export default function App() {
  const bootstrap = useService(s => s.bootstrap)
  const role = useRole()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = mainRef.current
    if (el) el.scrollTop = 0
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const isLoggedIn = role.name !== 'Guest'

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<Skeleton rows={4} />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-paper text-ink antialiased">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-6 py-8 pb-20">
            <Suspense fallback={<Skeleton rows={6} />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/explorer" element={<ExplorerPage />} />
                <Route path="/matching" element={<MatchPage />} />
                <Route path="/duplicates" element={
                  <RedirectIfEmpty><DuplicatesPage /></RedirectIfEmpty>
                } />
                <Route path="/savings" element={
                  <RedirectIfEmpty><SavingsPage /></RedirectIfEmpty>
                } />
                <Route path="/registry" element={
                  <RedirectIfEmpty><RegistryPage /></RedirectIfEmpty>
                } />
                <Route path="/migration" element={<MigrationPage />} />
                <Route path="/integration" element={<IntegrationPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/normalize" element={
                  <RedirectIfEmpty><NormalizePage /></RedirectIfEmpty>
                } />
                <Route path="/activity" element={
                  <RedirectIfEmpty><ActivityPage /></RedirectIfEmpty>
                } />
                <Route path="/engine" element={<EnginePage />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
      <Toasts />
    </div>
  )
}
