import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURED = [
  { question: 'What was the Poona Pact?', route: '/chat' },
  { question: 'Tell me about the Constitution', route: '/chat' },
  { question: 'Who was Dr. Ambedkar?', route: '/chat' },
  { question: 'What is Annihilation of Caste?', route: '/chat' },
  { question: 'Explore his life timeline', route: '/timeline' },
  { question: 'Browse digital manuscripts', route: '/manuscripts' },
];

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <>
      <div className="home-hero">
        <div className="hero-content">
          <span className="hero-eyebrow">Digital Heritage Archive</span>
          <h2 className="hero-title">Samdarshi</h2>
          <p className="hero-subtitle">Dr. B.R. Ambedkar &bull; 1891 — 1956</p>
          <p className="hero-desc">
            An AI-powered digital archive dedicated to preserving and sharing the life, works, and legacy
            of Bharat Ratna Dr. Bhimrao Ramji Ambedkar — Chief Architect of the Indian Constitution.
          </p>
          <div className="search-bar">
            <input
              className="search-input"
              type="text"
              placeholder="Search the archive — ask any question..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  navigate('/chat', { state: { query: e.target.value.trim() } });
                }
              }}
            />
            <button className="search-btn" onClick={() => {}}>
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="featured-questions">
        <p className="section-label">Try asking</p>
        <div className="question-chips">
          {FEATURED.map((item, i) => (
            <button
              key={i}
              className="question-chip"
              onClick={() => navigate(item.route)}
            >
              {item.question}
            </button>
          ))}
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-card" onClick={() => navigate('/chat')}>
          <span className="feature-icon">💬</span>
          <h3 className="feature-title">AI Chat</h3>
          <p className="feature-desc">
            Ask any question about Dr. Ambedkar. Our AI answers with verified citations from 500+ archival documents.
          </p>
        </div>
        <div className="feature-card" onClick={() => navigate('/timeline')}>
          <span className="feature-icon">📅</span>
          <h3 className="feature-title">Interactive Timeline</h3>
          <p className="feature-desc">
            Explore 65 years of Dr. Ambedkar's life through an interactive timeline with 34 key events.
          </p>
        </div>
        <div className="feature-card" onClick={() => navigate('/manuscripts')}>
          <span className="feature-icon">📚</span>
          <h3 className="feature-title">Digital Library</h3>
          <p className="feature-desc">
            Browse digitized manuscripts, books, and historical documents from the DAIC collection.
          </p>
        </div>
        <div className="feature-card" onClick={() => navigate('/about')}>
          <span className="feature-icon">🏛️</span>
          <h3 className="feature-title">About Samdarshi</h3>
          <p className="feature-desc">
            Learn about the mission, technology stack, and the team building this digital heritage archive.
          </p>
        </div>
      </div>
    </>
  );
}