import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Animals from './pages/Animals.jsx'
import AnimalDetails from './pages/AnimalDetails.jsx'
import Alerts from './pages/Alerts.jsx'
import HerdIntelligence from './pages/HerdIntelligence.jsx'
import MilkQuality from './pages/MilkQuality.jsx'
import Environment from './pages/Environment.jsx'
import Simulator from './pages/Simulator.jsx'
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
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
