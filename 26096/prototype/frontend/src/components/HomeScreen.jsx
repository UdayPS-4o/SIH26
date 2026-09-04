import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icons.jsx';
import heroImg from '../assets/hero-ambedkar.png';
import imgTimeline from '../assets/card-timeline.jpg';
import imgManuscripts from '../assets/card-manuscripts.jpg';
import imgSpeeches from '../assets/card-speeches.jpg';
import imgBooks from '../assets/card-books.jpg';
import imgChat from '../assets/card-chat.jpg';
import imgMedia from '../assets/portrait-ambedkar.png';

const CARDS = [
  { icon: 'timeline', title: 'Timeline', desc: 'Explore key events from 1891 to 1956.', to: '/timeline', accent: 'var(--a-blue)', cta: 'Explore', img: imgTimeline },
  { icon: 'manuscript', title: 'Manuscripts', desc: 'Discover rare manuscripts and letters.', to: '/manuscripts', accent: 'var(--a-purple)', cta: 'Explore', img: imgManuscripts },
  { icon: 'speech', title: 'Speeches', desc: 'Read iconic speeches and debates.', to: '/speeches', accent: 'var(--a-green)', cta: 'Explore', img: imgSpeeches },
  { icon: 'book', title: 'Books & Writings', desc: 'Read books and writings by Dr. Ambedkar.', to: '/books', accent: 'var(--a-amber)', cta: 'Explore', img: imgBooks },
  { icon: 'media', title: 'Media Gallery', desc: 'Watch documentaries, interviews and more.', to: '/media', accent: 'var(--a-magenta)', cta: 'Explore', img: imgMedia },
  { icon: 'sparkles', title: 'Chat with AI', desc: "Ask anything about Dr. Ambedkar's life, works and ideas.", to: '/chat', accent: 'var(--a-cyan)', cta: 'Ask Now', img: imgChat },
];

const STATS = [
  { icon: 'doc', num: '12,500+', label: 'Documents', accent: 'var(--a-blue)' },
  { icon: 'speech', num: '1,200+', label: 'Speeches', accent: 'var(--a-green)' },
  { icon: 'book', num: '300+', label: 'Books', accent: 'var(--a-amber)' },
  { icon: 'image', num: '2,000+', label: 'Images', accent: 'var(--a-magenta)' },
  { icon: 'media', num: '150+', label: 'Videos', accent: 'var(--a-purple)' },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const submit = () => {
    if (q.trim()) navigate('/chat', { state: { query: q.trim() } });
  };

  return (
    <>
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${heroImg})` }} />
        <div className="hero-chakra" />
        <div className="hero-inner">
          <div className="hero-eyebrow">Digital Heritage Archive</div>
          <h1 className="hero-name">Samdarshi</h1>
          <div className="hero-life">Dr. B. R. Ambedkar &bull; 1891 &ndash; 1956</div>
          <div className="hero-divider">
            <span>&#10022;</span>
          </div>
          <p className="hero-desc">
            An AI-powered digital archive dedicated to preserving and sharing the life, works, and
            legacy of Bharat Ratna Dr. Bhimrao Ramji Ambedkar &mdash; Chief Architect of the Indian
            Constitution.
          </p>
          <div className="hero-search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Search the archive &mdash; ask any question..."
            />
            <button onClick={submit} aria-label="Search">
              <Icon name="search" size={20} />
            </button>
          </div>
        </div>
      </section>

      <div className="explore-grid">
        {CARDS.map((c) => (
          <div
            key={c.title}
            className="explore-card"
            style={{ '--card-accent': c.accent }}
            onClick={() => navigate(c.to)}
          >
            <div className="explore-media" style={{ backgroundImage: `url(${c.img})` }} />
            <div className="explore-body">
              <div className="explore-badge">
                <Icon name={c.icon} size={22} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <span className="explore-link">
                {c.cta} <Icon name="arrow-right" size={15} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="quote-bar">
        <div className="quote-block">
          <Icon name="quote" size={30} className="q-mark" />
          <div>
            <p className="quote-text">
              I measure the progress of a community by the degree of progress which women have
              achieved.
            </p>
            <div className="quote-attr">&mdash; Dr. B. R. Ambedkar</div>
          </div>
        </div>
        <div className="stats-row">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <div className="stat-ico" style={{ '--stat-accent': s.accent }}>
                <Icon name={s.icon} size={19} />
              </div>
              <div>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
