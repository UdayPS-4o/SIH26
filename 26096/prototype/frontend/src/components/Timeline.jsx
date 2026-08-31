import { useState, useMemo } from 'react';
import timelineData from '../data/timeline.json';

const CATEGORIES = ['all', 'education', 'political', 'literary', 'career', 'birth', 'personal', 'death'];

export default function Timeline() {
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return timelineData.timelines;
    return timelineData.timelines.filter(e => e.category === filter);
  }, [filter]);

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Timeline</h2>
        <p className="page-subtitle">
          34 key events from 1891 to 1956 — the life of Dr. B.R. Ambedkar
        </p>
      </div>

      <div className="timeline-controls">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All Events' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="timeline-wrapper">
        <div className="timeline-track">
          <div className="timeline-line" />
          <div className="timeline-events" style={{ minWidth: `${filteredEvents.length * 220}px` }}>
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`timeline-event`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="event-card">
                  <div className="event-year">{event.year}</div>
                  <div className="event-title">{event.title}</div>
                  <div className="event-desc">{event.description}</div>
                </div>
                <div className="event-connector" />
                <div className={`event-dot cat-${event.category}`} />
                <div className="event-year" style={{ marginTop: '12px', marginBottom: '4px' }}>
                  {event.year}
                </div>
                <div className="event-title" style={{ maxWidth: '180px' }}>
                  {event.title.length > 30 ? event.title.slice(0, 30) + '…' : event.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="timeline-modal" onClick={() => setSelectedEvent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
            <div className="modal-year">{selectedEvent.year}</div>
            <h3 className="modal-title">{selectedEvent.title}</h3>
            <div className="modal-date">{selectedEvent.date} &bull; {selectedEvent.category}</div>
            <p className="modal-desc">{selectedEvent.description}</p>
            <div className="modal-source">Source: {selectedEvent.source}</div>
          </div>
        </div>
      )}
    </>
  );
}