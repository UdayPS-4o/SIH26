import { Routes, Route, NavLink } from 'react-router-dom';
import HomeScreen from './components/HomeScreen.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import Timeline from './components/Timeline.jsx';
import ManuscriptViewer from './components/ManuscriptViewer.jsx';
import About from './components/About.jsx';

const NAV_ITEMS = [
  { path: '/', icon: '⌂', label: 'Home' },
  { path: '/chat', icon: '💬', label: 'Chat' },
  { path: '/timeline', icon: '📅', label: 'Timeline' },
  { path: '/manuscripts', icon: '📚', label: 'Manuscripts' },
  { path: '/about', icon: 'ℹ️', label: 'About' },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <div className="brand-icon">S</div>
            <div className="brand-text">
              <h1>Samdarshi</h1>
              <p className="tagline">Heritage Archive</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot"></span>
          DAIC Digital Archive v1.0
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/manuscripts" element={<ManuscriptViewer />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
