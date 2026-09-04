import { useMemo, useState } from 'react';
import { Icon } from './Icons.jsx';
import booksData from '../data/books.json';

const CATEGORIES = ['All', 'Social Reform', 'Economics', 'History', 'Politics', 'Constitutional', 'Philosophy'];

export default function BooksWritings() {
  const [cat, setCat] = useState('All');
  const [selected, setSelected] = useState(null);

  const list = useMemo(() => {
    const b = [...booksData.books].sort((a, b2) => a.year - b2.year);
    return cat === 'All' ? b : b.filter((x) => x.category === cat);
  }, [cat]);

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Collected Works</div>
        <h1 className="page-title">Books &amp; Writings</h1>
        <p className="page-subtitle">
          The major books, theses and memoranda authored by Dr. B. R. Ambedkar &mdash; from currency
          economics to the annihilation of caste and the Dhamma.
        </p>
      </div>

      <div className="filter-row">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`filter-chip ${cat === c ? 'active' : ''}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="card-grid">
        {list.map((b) => (
          <article key={b.id} className="tile" onClick={() => setSelected(b)} style={{ cursor: 'pointer' }}>
            <span className="tile-tag">{b.category}</span>
            <h3 className="tile-title">{b.title}</h3>
            <div className="tile-meta">
              <span>{b.year}</span>
              <span>{b.pages} pages</span>
              <span>{b.language}</span>
            </div>
            <p className="tile-body">{b.summary}</p>
            <ul className="tile-list">
              {b.keyIdeas.slice(0, 3).map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
            <div className="tile-foot">
              <Icon name="book" size={14} /> {b.source}
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            <div className="modal-year">{selected.year}</div>
            <h2 className="modal-title">{selected.title}</h2>
            <div className="modal-date">
              {selected.category} &bull; {selected.pages} pages &bull; {selected.language}
            </div>
            <p className="modal-desc">{selected.summary}</p>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '18px', marginBottom: '10px' }}>
              Key ideas
            </h3>
            <ul className="tile-list" style={{ marginBottom: '20px' }}>
              {selected.keyIdeas.map((k, i) => (
                <li key={i} style={{ fontSize: '14.5px' }}>{k}</li>
              ))}
            </ul>
            <div className="modal-source">Source: {selected.source}</div>
          </div>
        </div>
      )}
    </>
  );
}
