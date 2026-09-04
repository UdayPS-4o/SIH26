import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Skeleton } from '@/components/ui'
import { useService } from '@/store/service'

const OverviewPage = lazy(() => import('@/pages/OverviewPage'))
const ExplorerPage = lazy(() => import('@/pages/ExplorerPage'))
const DuplicatesPage = lazy(() => import('@/pages/DuplicatesPage'))
const SavingsPage = lazy(() => import('@/pages/SavingsPage'))
const RegistryPage = lazy(() => import('@/pages/RegistryPage'))
const ImportPage = lazy(() => import('@/pages/ImportPage'))
const NormalizePage = lazy(() => import('@/pages/NormalizePage'))
const ActivityPage = lazy(() => import('@/pages/ActivityPage'))
const EnginePage = lazy(() => import('@/pages/EnginePage'))

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
          {/* Wide on purpose. This is a records console, not an article: the
              tables carry eight to ten columns and at 1180px they were being
              horizontally scrolled on a 1920px screen, which put the national
              code, the column the whole product is about, off the right edge. */}
          <div className="mx-auto w-full max-w-[1600px] px-6 py-8 pb-20">
            <Suspense fallback={<Skeleton rows={6} />}>
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/explorer" element={<ExplorerPage />} />
                <Route path="/duplicates" element={<DuplicatesPage />} />
                <Route path="/savings" element={<SavingsPage />} />
                <Route path="/registry" element={<RegistryPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/normalize" element={<NormalizePage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/engine" element={<EnginePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
