import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './components/Icons.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import Timeline from './components/Timeline.jsx';
import ManuscriptViewer from './components/ManuscriptViewer.jsx';
import Speeches from './components/Speeches.jsx';
import BooksWritings from './components/BooksWritings.jsx';
import MediaGallery from './components/MediaGallery.jsx';
import AboutAmbedkar from './components/AboutAmbedkar.jsx';
import AboutArchive from './components/AboutArchive.jsx';

const NAV = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/chat', icon: 'chat', label: 'Chat with AI' },
  { to: '/timeline', icon: 'timeline', label: 'Timeline' },
  { to: '/manuscripts', icon: 'manuscript', label: 'Manuscripts' },
  { to: '/speeches', icon: 'speech', label: 'Speeches' },
  { to: '/books', icon: 'book', label: 'Books & Writings' },
  { to: '/media', icon: 'media', label: 'Media Gallery' },
  { to: '/ambedkar', icon: 'person', label: 'About Dr. Ambedkar' },
  { to: '/about', icon: 'info', label: 'About Archive' },
];

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('samdarshi-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('samdarshi-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

function Topbar({ onToggleSidebar, sidebarOpen }) {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  const [q, setQ] = useState('');

  const submit = () => {
    if (q.trim()) navigate('/chat', { state: { query: q.trim() } });
  };

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Icon name="search" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Search the archive..."
        />
      </div>
      <div className="topbar-spacer" />
      <button className="btn-assistant" onClick={() => navigate('/chat')}>
        <Icon name="sparkles" size={16} />
        <span>Ask AI Assistant</span>
      </button>
      <button
        className="icon-btn"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle theme"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
      </button>
      <button
        className="icon-btn"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Hide menu' : 'Show menu'}
        aria-pressed={!sidebarOpen}
        title={sidebarOpen ? 'Hide menu' : 'Show menu'}
      >
        <Icon name="menu" size={19} />
      </button>
    </header>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('samdarshi-sidebar') !== 'closed';
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setSidebarOpen((open) => {
      const next = !open;
      try {
        localStorage.setItem('samdarshi-sidebar', next ? 'open' : 'closed');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'nav-collapsed'}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div className="brand-text">
            <div className="brand-name">Samdarshi</div>
            <div className="brand-sub">Heritage Archive</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="lang-select">
            <Icon name="globe" size={17} />
            <span>English</span>
            <Icon name="chevron-down" size={15} className="chev" />
          </button>
          <div className="sidebar-meta">
            <div>
              <span className="dot" />
              <strong>DAIC Digital Archive v1.0</strong>
            </div>
            <div>Preserving Legacy, Inspiring Future.</div>
          </div>
        </div>

        <div className="sidebar-lotus" aria-hidden="true">
          <svg viewBox="0 0 128 92" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M64 82 C55 60 55 28 64 8 C73 28 73 60 64 82 Z" />
              <path d="M64 82 C52 66 34 44 34 20 C50 28 60 56 64 82 Z" />
              <path d="M64 82 C76 66 94 44 94 20 C78 28 68 56 64 82 Z" />
              <path d="M64 82 C48 72 20 62 8 40 C30 44 54 62 64 82 Z" />
              <path d="M64 82 C80 72 108 62 120 40 C98 44 74 62 64 82 Z" />
              <path d="M40 80 C48 88 80 88 88 80" strokeWidth="1.6" />
              <path d="M18 82 C34 76 50 76 64 81 C78 76 94 76 110 82" strokeWidth="1.4" opacity="0.7" />
            </g>
          </svg>
        </div>
      </aside>

      <div className="main">
        <Topbar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="content">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/manuscripts" element={<ManuscriptViewer />} />
            <Route path="/speeches" element={<Speeches />} />
            <Route path="/books" element={<BooksWritings />} />
            <Route path="/media" element={<MediaGallery />} />
            <Route path="/ambedkar" element={<AboutAmbedkar />} />
            <Route path="/about" element={<AboutArchive />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
