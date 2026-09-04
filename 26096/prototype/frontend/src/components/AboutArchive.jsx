import { Icon } from './Icons.jsx';

const TECH = [
  { icon: 'sparkles', name: 'AI Engine', desc: 'Large language model with retrieval-augmented generation over 500+ indexed documents.' },
  { icon: 'speech', name: 'Speech & Voice', desc: 'Speech-to-text for voice questions and text-to-speech for listening in Hindi and English.' },
  { icon: 'media', name: 'Frontend', desc: 'React 18, deployable as a web app or an Electron kiosk for touchscreen terminals.' },
  { icon: 'timeline', name: 'Backend', desc: 'FastAPI with real-time streaming, a document ingestion pipeline and OCR.' },
  { icon: 'doc', name: 'Search', desc: 'Vector search with source citations so every answer is traceable to an archival document.' },
  { icon: 'globe', name: 'Deployment', desc: 'Multi-platform &mdash; desktop kiosk, responsive web and mobile.' },
];

export default function AboutArchive() {
  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">About the Project</div>
        <h1 className="page-title">About the Archive</h1>
        <p className="page-subtitle">
          Building an AI-powered digital archive of the complete works and life story of Dr. B. R.
          Ambedkar.
        </p>
      </div>

      <div className="quote-bar" style={{ gridTemplateColumns: '1fr', marginTop: 0, marginBottom: '40px' }}>
        <div className="quote-block">
          <Icon name="quote" size={30} className="q-mark" />
          <div>
            <p className="quote-text">
              I like the religion that teaches liberty, equality and fraternity.
            </p>
            <div className="quote-attr">&mdash; Dr. B. R. Ambedkar</div>
          </div>
        </div>
      </div>

      <div className="prose">
        <section>
          <h2>Our mission</h2>
          <p>
            Samdarshi is a digital heritage archive built for the Smart India Hackathon 2026. Its
            goal is an AI-powered, multimodal platform that preserves, digitises and makes accessible
            the complete works and life story of Bharat Ratna Dr. Bhimrao Ramji Ambedkar.
          </p>
          <p>
            By combining retrieval-augmented AI with archival scholarship, we aim to make Dr.
            Ambedkar&rsquo;s body of work &mdash; books, speeches, constitutional debates and
            correspondence &mdash; searchable and understandable for students, researchers and
            citizens.
          </p>
          <p>
            The name <em>Samdarshi</em> comes from Sanskrit: <em>sama</em> (equal) + <em>darshi</em>{' '}
            (vision). It reflects Dr. Ambedkar&rsquo;s vision of an equal society and our commitment
            to making that vision accessible to all.
          </p>
        </section>

        <section>
          <h2>Technology</h2>
          <div className="pillars">
            {TECH.map((t) => (
              <div className="pillar" key={t.name}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name={t.icon} size={18} /> {t.name}
                </h3>
                <p dangerouslySetInnerHTML={{ __html: t.desc }} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>DAIC partnership</h2>
          <p>
            Samdarshi is developed in collaboration with the Dr. Ambedkar International Centre, which
            maintains extensive digital archives and supports research and education focused on
            social justice and equality.
          </p>
        </section>

        <section>
          <h2>Smart India Hackathon 2026</h2>
          <p>
            This project is submitted under the problem statement for Digital Heritage and Cultural
            Preservation. The prototype showcases the core features; the production system will add a
            full AI Q&amp;A pipeline over 500+ indexed documents, advanced OCR for historical
            manuscripts, multilingual support and a public web portal.
          </p>
        </section>
      </div>

      <footer className="footer">
        <p>Built for Smart India Hackathon 2026</p>
        <p>
          <span className="accent">Samdarshi</span> &bull; Digital Heritage Archive of Dr. B. R.
          Ambedkar &bull; in partnership with <span className="accent">DAIC</span>
        </p>
      </footer>
    </>
  );
}
