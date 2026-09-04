import { useMemo, useState } from 'react';
import { Icon } from './Icons.jsx';
import mediaData from '../data/media.json';

const FILTERS = ['all', 'video', 'photograph', 'audio'];
const LABELS = { all: 'All Media', video: 'Videos', photograph: 'Photographs', audio: 'Audio' };
const TYPE_ICON = { video: 'play', photograph: 'image', audio: 'speech' };
const TYPE_ACCENT = {
  video: 'var(--a-purple)',
  photograph: 'var(--a-magenta)',
  audio: 'var(--a-green)',
};

const ytThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const ytEmbed = (id) => `https://www.youtube.com/embed/${id}`;

export default function MediaGallery() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const list = useMemo(() => {
    const m = [...mediaData.media].sort((a, b) => a.year - b.year);
    return filter === 'all' ? m : m.filter((x) => x.type === filter);
  }, [filter]);

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Archive Gallery</div>
        <h1 className="page-title">Media Gallery</h1>
        <p className="page-subtitle">
          Documentaries, restored audio and public-domain photographs of Dr. B. R. Ambedkar, drawn
          from national broadcasters and open archives.
        </p>
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {LABELS[f]}
          </button>
        ))}
      </div>

      <div className="media-grid">
        {list.map((m) => (
          <div
            key={m.id}
            className="media-card"
            onClick={() => setSelected(m)}
            style={{ '--m-accent': TYPE_ACCENT[m.type] }}
          >
            <div className="media-thumb">
              {m.image && <img src={m.image} alt={m.title} loading="lazy" />}
              {m.youtubeId && <img src={ytThumb(m.youtubeId)} alt={m.title} loading="lazy" />}
              <span className="m-type">{m.type}</span>
              {(m.type === 'video' || m.type === 'audio') && (
                <span className="media-play">
                  <Icon name="play" size={26} />
                </span>
              )}
            </div>
            <div className="media-body">
              <h3>{m.title}</h3>
              <div className="m-meta">{m.year} &bull; {m.collection}</div>
              <p>{m.description}</p>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>

            {selected.youtubeId ? (
              <div className="media-embed">
                <iframe
                  src={ytEmbed(selected.youtubeId)}
                  title={selected.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <img className="media-full" src={selected.image} alt={selected.title} />
            )}

            <div className="modal-date" style={{ margin: '18px 0 8px' }}>
              {selected.type} &bull; {selected.year} &bull; {selected.collection}
            </div>
            <h2 className="modal-title">{selected.title}</h2>
            <p className="modal-desc">{selected.description}</p>
          </div>
        </div>
      )}
    </>
  );
}
