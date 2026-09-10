import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Skeleton } from '@/components/ui'
import { useService } from '@/store/service'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const OverviewPage = lazy(() => import('@/pages/OverviewPage'))
const ExplorerPage = lazy(() => import('@/pages/ExplorerPage'))
const DuplicatesPage = lazy(() => import('@/pages/DuplicatesPage'))
const SavingsPage = lazy(() => import('@/pages/SavingsPage'))
const RegistryPage = lazy(() => import('@/pages/RegistryPage'))
const ImportPage = lazy(() => import('@/pages/ImportPage'))
const NormalizePage = lazy(() => import('@/pages/NormalizePage'))
const ActivityPage = lazy(() => import('@/pages/ActivityPage'))
const EnginePage = lazy(() => import('@/pages/EnginePage'))
const MigrationPage = lazy(() => import('@/pages/MigrationPage'))
const IntegrationPage = lazy(() => import('@/pages/IntegrationPage'))

function RedirectIfEmpty({ children }: { children: JSX.Element }) {
  const loaded = useService(s => s.ready)
  const loadedCount = useService(s => s.records?.length ?? 0)

  // While the service is still loading, show the skeleton (original behaviour).
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

  // Once loaded, if no data has been imported, redirect to Overview so the user
  // can load item lists rather than staring at an empty queue.
  if (loadedCount === 0) {
    return <Navigate to="/overview" replace />
  }

  return children
}

export default function App() {
  const bootstrap = useService(s => s.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-paper text-ink antialiased">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-6 py-8 pb-20">
            <Suspense fallback={<Skeleton rows={6} />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/explorer" element={<ExplorerPage />} />
                <Route path="/duplicates" element={
                  <RedirectIfEmpty><DuplicatesPage /></RedirectIfEmpty>
                } />
                <Route path="/savings" element={
                  <RedirectIfEmpty><SavingsPage /></RedirectIfEmpty>
                } />
                <Route path="/registry" element={
                  <RedirectIfEmpty><RegistryPage /></RedirectIfEmpty>
                } />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/normalize" element={
                  <RedirectIfEmpty><NormalizePage /></RedirectIfEmpty>
                } />
                <Route path="/activity" element={
                  <RedirectIfEmpty><ActivityPage /></RedirectIfEmpty>
                } />
                <Route path="/engine" element={<EnginePage />} />
                <Route path="/integration" element={<IntegrationPage />} />
                <Route path="/migration" element={<MigrationPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
