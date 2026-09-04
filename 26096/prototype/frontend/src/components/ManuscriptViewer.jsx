import { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import documentsData from '../data/documents.json';

const TYPE_ICONS = {
  book: '📖',
  constitution: '📜',
  debates: '🎤',
  thesis: '🎓',
  policy: '📋',
};

const SAMPLE_OCR = {
  1: "\"ANIHILATION OF CASTE\"\n\nAn undelivered speech written for the\nJat-Pat Todak Mandal of Lahore.\n\nYou cannot build a nation on\nfoundations of caste.\n\nCaste is not a division of labor,\nit is a division of laborers.",
  2: "\"THE CONSTITUTION OF INDIA\"\n\nPREAMBLE\n\nWe, the people of India,\nhaving solemnly resolved to\nconstitute India into a\nSovereign Democratic Republic\nand to secure to all its citizens:\n\nJUSTICE — social, economic,\nand political.",
  3: "\"WHO WERE THE SHUDRAS?\"\n\nCHAPTER I — THE THEORY OF\nARYAN INVASION\n\nThe Shudras were one of the\nAryan communities of the solar\nrace. They were originally Aryans.",
};

export default function ManuscriptViewer() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const { speak, isSpeaking } = useSpeech();

  const handleScan = (doc) => {
    setScanning(true);
    setShowOcr(false);
    setTimeout(() => {
      setScanning(false);
      setShowOcr(true);
      setSelectedDoc(doc);
    }, 2500);
  };

  const handleListen = (text) => {
    if (isSpeaking) return;
    speak(text, 'en-IN');
  };

  const getOcrText = (doc) => {
    return SAMPLE_OCR[doc.id] || `${doc.title}\n\n${doc.excerpt}\n\n[OCR text would appear here for\ndemonstration purposes.]`;
  };

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Digitised Collection</div>
        <h1 className="page-title">Manuscripts</h1>
        <p className="page-subtitle">
          {documentsData.documents.length} digitised works and documents from the DAIC archives.
          Scan any item to preview its OCR text.
        </p>
      </div>

      <div className="manifold-grid">
        {documentsData.documents.map((doc) => (
          <div key={doc.id} className="manifold-card">
            {scanning && selectedDoc?.id === doc.id && (
              <div className="ocr-scan-overlay">
                <div className="scan-line" />
                <div className="scan-text">Scanning document...</div>
              </div>
            )}
            <span className="manifold-type">
              {TYPE_ICONS[doc.type] || '📄'} {doc.type}
            </span>
            <h3 className="manifold-title">{doc.title}</h3>
            <div className="manifold-author">by {doc.author} &bull; {doc.date}</div>
            <p className="manifold-desc">{doc.description}</p>
            <div className="manifold-meta">
              <span>{doc.pages} pages &bull; {doc.source}</span>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button className="scan-btn" onClick={() => handleScan(doc)}>
                🔍 Scan Document
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedDoc && showOcr && (
        <div className="timeline-modal" onClick={() => { setSelectedDoc(null); setShowOcr(false); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => { setSelectedDoc(null); setShowOcr(false); }}
            >
              ✕
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: '24px' }}>{selectedDoc.title}</h3>
                <div className="modal-date">{selectedDoc.author} &bull; {selectedDoc.date} &bull; {selectedDoc.pages} pages</div>
              </div>
              <button
                className={`audio-btn ${isSpeaking ? 'speaking' : ''}`}
                onClick={() => handleListen(getOcrText(selectedDoc))}
              >
                🔊 {isSpeaking ? 'Stop' : 'Listen'}
              </button>
            </div>
            <div className="manifold-viewer">
              <div>
                <p style={{ marginBottom: '12px', color: 'var(--color-text-muted)' }}>
                  {selectedDoc.description}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--color-text-dim)' }}>
                  <strong>Excerpt:</strong> "{selectedDoc.excerpt}"
                </p>
                <div className="scan-actions">
                  <span className="citation-chip">📄 Source: {selectedDoc.source}</span>
                  {selectedDoc.url && (
                    <span className="citation-chip">🔗 {selectedDoc.url}</span>
                  )}
                </div>
              </div>
              <div className="scan-preview">
                <div className="scan-page">
                  <div className="scan-page-header">{selectedDoc.title}</div>
                  <div className="scan-page-text">{getOcrText(selectedDoc)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}