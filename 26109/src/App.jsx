import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Animals from './pages/Animals.jsx'
import AnimalDetails from './pages/AnimalDetails.jsx'
import Alerts from './pages/Alerts.jsx'
import HerdIntelligence from './pages/HerdIntelligence.jsx'
import MilkQuality from './pages/MilkQuality.jsx'
import Environment from './pages/Environment.jsx'
import WorkerHygiene from './pages/WorkerHygiene.jsx'
import Simulator from './pages/Simulator.jsx'
import Analytics from './pages/Analytics.jsx'
import Detection from './pages/Detection.jsx'
import Devices from './pages/Devices.jsx'
import Model from './pages/Model.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/animals" element={<Animals />} />
        <Route path="/animals/:id" element={<AnimalDetails />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/herd" element={<HerdIntelligence />} />
        <Route path="/milk-quality" element={<MilkQuality />} />
        <Route path="/environment" element={<Environment />} />
        <Route path="/worker-hygiene" element={<WorkerHygiene />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/model" element={<Model />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/detection" element={<Detection />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

