import { useMemo, useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { Icon } from './Icons.jsx';
import speechesData from '../data/speeches.json';

const FILTERS = [
  { key: 'all', label: 'All Speeches' },
  { key: 'constitutional', label: 'Constitutional' },
  { key: 'rights', label: 'Rights' },
  { key: 'movement', label: 'Movements' },
  { key: 'reform', label: 'Social Reform' },
  { key: 'philosophy', label: 'Philosophy' },
];

export default function Speeches() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const { speak, isSpeaking, stopSpeaking } = useSpeech();

  const list = useMemo(() => {
    const s = [...speechesData.speeches].sort((a, b) => a.year - b.year);
    return filter === 'all' ? s : s.filter((x) => x.category === filter);
  }, [filter]);

  const toggleListen = (text) => {
    if (isSpeaking) stopSpeaking();
    else speak(text, 'en-IN');
  };

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">The Spoken Word</div>
        <h1 className="page-title">Speeches &amp; Addresses</h1>
        <p className="page-subtitle">
          Landmark speeches, testimonies and constitutional interventions delivered by Dr. B. R.
          Ambedkar between 1919 and 1956.
        </p>
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card-grid">
        {list.map((sp) => (
          <article key={sp.id} className="tile" onClick={() => setSelected(sp)} style={{ cursor: 'pointer' }}>
            <span className="tile-tag">{sp.year}</span>
            <h3 className="tile-title">{sp.title}</h3>
            <div className="tile-meta">
              <span>{sp.venue}</span>
              <span>{sp.duration}</span>
            </div>
            <p className="tile-body">{sp.summary}</p>
            <blockquote className="tile-quote">{sp.excerpt}</blockquote>
            <div className="tile-foot">
              <Icon name="doc" size={14} /> {sp.source}
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => { stopSpeaking(); setSelected(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { stopSpeaking(); setSelected(null); }}>
              &times;
            </button>
            <div className="modal-year">{selected.year}</div>
            <h2 className="modal-title">{selected.title}</h2>
            <div className="modal-date">
              {selected.venue} &bull; {new Date(selected.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} &bull; {selected.duration}
            </div>
            <p className="modal-desc">{selected.summary}</p>
            <blockquote className="tile-quote" style={{ fontSize: '17px', marginBottom: '20px' }}>
              {selected.excerpt}
            </blockquote>
            <button
              className={`audio-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={() => toggleListen(`${selected.title}. ${selected.excerpt}`)}
            >
              <Icon name="speech" size={16} /> {isSpeaking ? 'Stop' : 'Listen'}
            </button>
            <div className="modal-source">Source: {selected.source}</div>
          </div>
        </div>
      )}
    </>
  );
}
