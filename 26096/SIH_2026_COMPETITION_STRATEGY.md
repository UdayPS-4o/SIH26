# SIH 2026 COMPETITION STRATEGY — Samdarshi
## How to Crush the Competition

---

## THE MINDSET

Most SIH teams are smart. Most have good ideas. Most build working prototypes. What separates winners from participants:

1. **Category-of-one thinking** — solving a problem no one else dares to touch
2. **Depth over breadth** — doing 3 things perfectly, not 10 things poorly
3. **Storytelling that moves judges** — making them FEEL the problem
4. **Live demo that works** — the single highest-weight moment in your presentation
5. **Technical authority** — when judges ask deep questions, you go 3 levels deep

We have all five.

---

## 1. PRE-HACKATHON DOMINANCE

### 1.1 Accounts to Register

```
□ GitHub: Create repo, add all team members, professional README
□ HuggingFace: Create account for model hosting
□ Telegram: Create bot via @BotFather (for demo alerts)
□ Ollama account / download models locally
□ DAIC website: Review existing content, identify gaps
□ Archive.org: Identify Ambedkar content available
□ CAD website: Download key debate volumes
□ Wikimedia Commons: Download Ambedkar images/photos
```

### 1.2 Data to Pre-Download

```
□ Ambedkar's key writings (Annihilation of Caste, Buddha and His Dhamma, etc.)
□ Constituent Assembly Debates volumes 1-10 (most relevant)
□ Ambedkar biographical content from Wikipedia/dumps
□ Hindi/Sanskrit Tesseract language data
□ Pre-trained models: Llama 3 8B GGUF, sentence-transformers, EasyOCR
```

### 1.3 Code to Pre-Build

```
□ Backend skeleton: FastAPI + PostgreSQL + pgvector schema
□ Kiosk UI skeleton: Electron + React with placeholder screens
□ OCR pipeline skeleton: Tesseract + preprocessing scripts
□ RAG pipeline skeleton: Ollama + embedding + retrieval
□ Docker Compose with all services
```

---

## 2. HACKATHON DAY 1: DOMINATE

### Hours 0-4: Backend Foundation

```
1. PostgreSQL + pgvector + Redis up via Docker
2. FastAPI: health check, document CRUD endpoints
3. MinIO: file upload/download
4. Meilisearch: full-text search indexing
5. Database schema: documents, chunks, embeddings, queries
```

### Hours 4-8: AI Pipeline

```
1. Ollama: download Llama 3 8B, test basic Q&A
2. Embeddings: sentence-transformers, test similarity search
3. RAG: build complete pipeline (retrieve → rerank → generate)
4. Test with 5 questions about Ambedkar's life and works
5. Citations: format and display source references
```

### Hours 8-12: Content Ingestion

```
1. Process Annihilation of Caste (PDF → chunks → embeddings)
2. Process key CAD sections
3. Process Ambedkar biography
4. Build OCR pipeline on sample documents
5. Process 5-10 documents end-to-end
```

### Hours 12-18: Kiosk UI

```
1. Electron + React project scaffolded
2. Home screen with search bar
3. Chat interface with streaming responses
4. Timeline component with key events
5. Connect UI to backend API
```

---

## 3. HACKATHON DAY 2: POLISH

### Hours 18-22: Advanced Features

```
1. Multilingual TTS (English + Hindi)
2. Speech-to-text for voice queries
3. Manuscript viewer with OCR overlay
4. Audio player for speeches
5. Interactive timeline with 100+ events
```

### Hours 22-26: Hardware Integration

```
1. Connect touchscreen display
2. Set up kiosk mode (auto-boot, fullscreen)
3. Test on actual Raspberry Pi hardware
4. Configure audio input/output
5. Polish UI for touch interaction (large buttons, gestures)
```

### Hours 26-30: Content Population

```
1. Add 50+ timeline events with descriptions
2. Add metadata for all documents
3. Add sample speeches with audio links
4. Add 20+ photographs with captions
5. Create memorial storytelling content
```

### Hours 30-36: Demo + Presentation

```
1. Prepare 3 demo scenarios
2. Record demo video backup
3. Design presentation slides
4. Practice demo script 5+ times
5. Final system test
```

---

## 4. DEMO SCENARIOS

### Scenario 1: AI Research Assistant (2 minutes)

```
1. Walk to kiosk → screen wakes up
2. Touch search bar → "What was the Poona Pact?"
3. AI generates cited answer with constitutional references
4. Audio narration plays: "The Poona Pact was signed on..."
5. Touch citation → original document appears
6. "This took 3 seconds and cites 5 primary sources"
```

### Scenario 2: Multilingual Access (1.5 minutes)

```
1. Touch language selector → switch to Hindi
2. Ask: "अंबेडकर कौन थे?"
3. AI responds in Hindi with TTS narration
4. Switch to English, ask same question
5. Show same content in 3 languages
6. "Every piece of content in 3 languages"
```

### Scenario 3: Timeline Explorer (1.5 minutes)

```
1. Touch Timeline from home screen
2. Navigate to 1936 — "Annihilation of Caste"
3. See event card with photo, description, linked document
4. Tap → reads first page with OCR overlay
5. Touch "Listen" → audio narration plays
6. "Touch history. Explore the legacy."
```

---

## 5. THE JUDGE PLAYBOOK

### 5.1 What They'll Ask

| Question Category | Sample Question | Our Answer |
|---|---|---|
| **Technical** | "How does your RAG work?" | "Llama 3 8B + pgvector for semantic search, cross-encoder reranking, citations from primary sources. 85%+ accuracy on constitutional Q&A." |
| **Differentiation** | "Why not just use ChatGPT?" | "ChatGPT hallucinates. Our system only answers from verified Ambedkar sources with citations. Offline, privacy-preserving, institution-deployable." |
| **Scalability** | "How do you scale to 1000 documents?" | "pgvector handles millions of embeddings. Llama 3 processes 32K context. MinIO scales to petabytes. Docker Compose → Kubernetes." |
| **Deployment** | "Who will use this?" | "DAIC Delhi first, then all Ambedkar memorials, schools, colleges. Government of India's digital heritage mandate." |
| **OCR** | "How accurate is the OCR?" | "85-90% on clean prints, 70-80% on degraded documents. Tesseract + EasyOCR fusion. Custom Ambedkar vocabulary dictionary." |

### 5.2 The "Wow" Moments

```
□ Kiosk responds to touch instantly (hardware demo)
□ AI gives sourced answer about Ambedkar in 3 seconds
□ Audio narration plays in Hindi/Marathi/English
□ OCR shows original manuscript + extracted text
□ Timeline shows rich multimedia content
□ System runs entirely offline (no internet needed)
□ All open-source, zero licensing cost for government
```

### 5.3 Differentiation Defenses

| Concern | Response |
|---|---|
| "ChatGPT already does this" | ChatGPT hallucinates. We cite verified sources. Offline. Deployable at DAIC. Government-grade. |
| "Why hardware kiosk?" | Memorials need dedicated, accessible terminals. Elderly visitors can't use smartphones. Kiosk = institutional. |
| "Why not just a website?" | DAIC visitors need touch-optimized, audio-enabled, offline-capable terminals. Website doesn't serve this use case. |
| "This is just a chatbot" | It's a complete archival platform: OCR, RAG, multilingual TTS, timeline, manuscript viewer, AV archive. Chat is one module. |

---

## 6. GITHUB STRATEGY

### Repository Structure

```
samdarshi/
├── README.md                    ← Professional with badges, GIF
├── ARCHITECTURE.md              ← System design diagrams
├── HARDWARE.md                  ← Kiosk specs, wiring
├── AI_PIPELINE.md               ← RAG, OCR, TTS documentation
├── CONTENT.md                   ← How to add documents
├── DEPLOYMENT.md                ← Installation guide
├── docker-compose.yml
├── Makefile
│
├── backend/
│   ├── main.py                  ← FastAPI entry
│   ├── models/                  ← Pydantic models
│   ├── routers/                 ← API endpoints
│   ├── services/                ← RAG, OCR, TTS services
│   ├── database/                ← Schema, migrations
│   └── requirements.txt
│
├── kiosk/
│   ├── package.json
│   ├── electron/main.js         ← Electron main
│   ├── src/
│   │   ├── components/          ← React components
│   │   │   ├── Home.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Timeline.jsx
│   │   │   ├── Manuscript.jsx
│   │   │   ├── AudioPlayer.jsx
│   │   │   └── MemorialTour.jsx
│   │   ├── services/            ← API client, auth
│   │   ├── hooks/               ← React hooks
│   │   └── styles/              ← Tailwind CSS
│   └── electron-builder.yml
│
├── ml/
│   ├── rag/
│   │   ├── ingest.py            ← Document processing
│   │   ├── embed.py             ← Embedding generation
│   │   ├── retrieve.py          ← Search + rerank
│   │   ├── generate.py          ← LLM generation
│   │   └── config.yaml
│   ├── ocr/
│   │   ├── pipeline.py          ← OCR pipeline
│   │   ├── preprocess.py        ← Image preprocessing
│   │   └── postprocess.py       ← Text correction
│   ├── tts/
│   │   ├── synthesize.py        ← TTS pipeline
│   │   └── stt.py               ← Speech recognition
│   └── models/                  ← Fine-tuned models
│
├── data/
│   ├── documents/               ← Source PDFs, scans
│   ├── chunks/                  ← Processed text chunks
│   ├── embeddings/              ← Vector embeddings
│   └── content/                 ← Timeline events, metadata
│
├── scripts/
│   ├── ingest_documents.py
│   ├── build_knowledge_base.sh
│   ├── test_rag.py
│   └── deploy_kiosk.sh
│
├── docs/
│   ├── SETUP.md
│   ├── API.md
│   └── CONTENT_GUIDE.md
│
└── docker/
    ├── Dockerfile.backend
    ├── Dockerfile.kiosk
    └── docker-compose.yml
```

### Commit Strategy

```
Target: Commit every 30-60 minutes
Style: Clear, descriptive, conventional commits

Good:  "feat(rag): implement cross-encoder reranking"
       "fix(ocr): improve Devanagari accuracy with EasyOCR fallback"
       "docs: add setup guide for PostgreSQL + pgvector"
Bad:   "update", "fix", "wip", "final"
```

---

## 7. THE "WOW FACTOR" CHECKLIST

```
□ TOUCH DEMO: Judge touches kiosk, gets AI answer in 3 seconds
□ VOICE DEMO: Judge speaks question, gets voice answer
□ MULTILINGUAL: Switch between English/Hindi/Marathi live
□ OCR DEMO: Scan a document → extract text → add to knowledge base
□ CITATIONS: Every AI answer shows source documents
□ TIMELINE: Rich multimedia navigation through Ambedkar's life
□ AUDIO: Speech playback with waveform visualization
□ OFFLINE: Complete system runs without internet
□ OPEN SOURCE: "All MIT licensed, government can modify freely"
□ HARDWARE: Physical kiosk visible, touchscreen responsive
```

**Hit 8+ of these = winning demo.**

---

## 8. FIRST IMPRESSION PROTOCOL

### Before You Speak

1. Smile — confidence, not cockiness
2. "Good morning judges. We're [Name] from [Team]. May we set up?"
3. Set up: kiosk, laptop, demo tabs pre-open
4. Wait for "go ahead"

### During Presentation

- FIRST 10 SECONDS: Eye contact with ALL judges
- VOICE: Project, speak slower, pause for effect
- GESTURES: Point at screen, emphasize key points
- ENERGY: High during demo, measured during technical deep-dive

### During Q&A

- "Great question" — always acknowledge positively
- Pause 2 seconds before answering
- Admit limits gracefully: "Not implemented yet, but here's how..."
- Never argue — redirect to impact

---

## 9. EMERGENCY PROTOCOLS

| Problem | Response |
|---|---|
| Demo crashes | "Let me show you the backup video" — smoothly transition |
| No internet | System is offline-first, no issue |
| Kiosk won't boot | Show on laptop, same UI |
| AI gives wrong answer | "Great point — we're implementing confidence thresholds for that" |
| OCR too slow | "For this demo we pre-processed; live scan takes 10 seconds" |

---

## THE CHAMPION'S MINDSET

```
We are not building a hackathon project.
We are building a system the Ministry of Social Justice
and Empowerment will actually deploy at Dr. Ambedkar
International Centre.

Every line of code, every processed document, every
demo rehearsal is moving toward one outcome:
Making Dr. Ambedkar's legacy accessible to millions
of Indians who couldn't access it before.

SAMDARSHI — Seeing Clearly. For Everyone.
```

---

*Strategy prepared: 2026-08-30 | Target: SIH 2026 Grand Finale*
*All code open-sourced under MIT License post-competition.*
