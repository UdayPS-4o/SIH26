import { Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketContext';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import LiveThreats from './pages/LiveThreats';
import NetworkMap from './pages/NetworkMap';
import AIAnalyzer from './pages/AIAnalyzer';
import DiodeLab from './pages/DiodeLab';
import OperationsTab from './pages/OperationsTab';
import Analytics from './pages/Analytics';
import MaterialsPage from './pages/MaterialsPage';
import ActivityPage from './pages/ActivityPage';
import AdminPage from './pages/AdminPage';
import IntegrationPage from './pages/IntegrationPage';
import AttackConsole from './pages/AttackConsole';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <WebSocketProvider>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<OperationsTab />} />
              <Route path="/live-threats" element={<LiveThreats />} />
              <Route path="/network-map" element={<NetworkMap />} />
              <Route path="/ai-analyzer" element={<AIAnalyzer />} />
              <Route path="/diode-lab" element={<DiodeLab />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/attack-console" element={<AttackConsole />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/integrations" element={<IntegrationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </WebSocketProvider>
    </ErrorBoundary>
  );
};

export default App;
