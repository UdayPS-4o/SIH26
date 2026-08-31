export default function About() {
  return (
    <>
      <div className="page-header">
        <h2 className="page-title">About Samdarshi</h2>
        <p className="page-subtitle">
          Building the world's most comprehensive digital archive of Dr. B.R. Ambedkar
        </p>
      </div>

      <div className="about-content">
        <div className="mission-card">
          <div className="brand-icon" style={{ width: '64px', height: '64px', fontSize: '32px', margin: '0 auto 24px' }}>S</div>
          <p className="mission-quote">
            "I like the religion that teaches liberty, equality, and fraternity."
          </p>
          <div className="mission-attr">— Dr. B.R. Ambedkar</div>
        </div>

        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            Samdarshi is a digital heritage archive project developed for the Smart India Hackathon 2026.
            Our goal is to create an AI-powered, multimodal platform that preserves, digitizes, and
            makes accessible the complete works and life story of Bharat Ratna Dr. Bhimrao Ramji Ambedkar —
            one of the greatest social reformers, scholars, and architects of modern India.
          </p>
          <p>
            By combining advanced AI (RAG, LLMs) with traditional archival scholarship, we aim to make
            Dr. Ambedkar's vast body of work — spanning books, speeches, constitutional debates, and
            correspondence — accessible to students, researchers, and citizens across India and the world.
          </p>
          <p>
            The name "Samdarshi" comes from Sanskrit — "sama" (equal) + "darshi" (vision/seer).
            It reflects Dr. Ambedkar's vision of an equal society and our commitment to making this
            vision accessible to all.
          </p>
        </div>

        <div className="about-section">
          <h2>Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-icon">🧠</div>
              <div className="tech-name">AI Engine</div>
              <div className="tech-desc">Llama 3 8B with RAG over 500+ indexed documents using ChromaDB</div>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🗣️</div>
              <div className="tech-name">Speech & Voice</div>
              <div className="tech-desc">STT (Whisper) for voice input, TTS for listening to responses in Hindi & English</div>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🖥️</div>
              <div className="tech-name">Frontend</div>
              <div className="tech-desc">React 18 with Electron for desktop kiosk deployment on touchscreen terminals</div>
            </div>
            <div className="tech-item">
              <div className="tech-icon">⚡</div>
              <div className="tech-name">Backend</div>
              <div className="tech-desc">FastAPI with real-time streaming, document ingestion pipeline, and OCR</div>
            </div>
            <div className="tech-item">
              <div className="tech-icon">📊</div>
              <div className="tech-name">Analytics</div>
              <div className="tech-desc">Insight engine tracking user queries, document views, and engagement metrics</div>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🌐</div>
              <div className="tech-name">Deployment</div>
              <div className="tech-desc">Multi-platform — desktop kiosk, web app, and mobile responsive</div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>About Dr. B.R. Ambedkar</h2>
          <p>
            Dr. Bhimrao Ramji Ambedkar (1891–1956) was an Indian jurist, economist, politician, and social
            reformer. He is best known as the chief architect of the Indian Constitution and a champion of
            the rights of the Depressed Classes (now Scheduled Castes and Scheduled Tribes).
          </p>
          <p>
            Born into the Mahar community, which was considered "untouchable," Ambedkar faced severe
            discrimination from an early age. Despite these obstacles, he went on to earn doctorates in
            Economics from both Columbia University and the London School of Economics, and qualified as
            a barrister from Gray's Inn, London.
          </p>
          <p>
            He was the first Law Minister of independent India, led the Drafting Committee of the
            Constituent Assembly, and authored seminal works including "Annihilation of Caste," "Who Were
            the Shudras?", and "The Buddha and His Dhamma." In 1956, he converted to Buddhism along with
            hundreds of thousands of followers, rejecting the caste-based Hindu religion.
          </p>
          <p>
            In 1990, he was posthumously awarded India's highest civilian honor, the Bharat Ratna.
          </p>
        </div>

        <div className="about-section">
          <h2>DAIC Partnership</h2>
          <div className="partnership">
            <div className="partner-logo">DAIC</div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', marginBottom: '8px' }}>
                Dr. Ambedkar International Center
              </h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
                Samdarshi is developed in collaboration with DAIC, dedicated to spreading the message
                and teachings of Dr. Ambedkar worldwide. The DAIC maintains extensive digital archives
                and supports research and education initiatives focused on social justice and equality.
              </p>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>Smart India Hackathon 2026</h2>
          <p>
            This project is submitted for the Smart India Hackathon 2026, under the problem statement
            for Digital Heritage and Cultural Preservation. The goal is to demonstrate how modern
            technology — AI, speech recognition, and interactive visualization — can make historical
            archives accessible, engaging, and impactful for future generations.
          </p>
          <p>
            The prototype showcases the core features. The full production system will include a
            complete AI-powered Q&A system with 500+ indexed documents, advanced OCR for historical
            manuscripts, multilingual support, and a public-facing web portal.
          </p>
        </div>
      </div>

      <footer className="footer">
        <p>Built with 💛 for SIH 2026</p>
        <p>
          <span className="accent">Samdarshi</span> &bull; Digital Heritage Archive of Dr. B.R. Ambedkar
          &bull; <span className="accent">DAIC</span>
        </p>
        <p style={{ marginTop: '8px', fontSize: '12px' }}>
          Dr. B.R. Ambedkar was posthumously awarded the <span className="accent">Bharat Ratna</span> in 1990
        </p>
      </footer>
    </>
  );
}