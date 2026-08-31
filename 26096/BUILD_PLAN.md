# BUILD PLAN — Samdarshi
## SIH 2026 | 36-Hour Sprint | Problem #26096

---

## PHASE 0: PRE-HACKATHON (Do Before Day 1)

```
□ Create GitHub repo: "samdarshi" with professional README
□ Install Docker Desktop on dev machine
□ Clone all OSS tools listed in MASTER_PLAN
□ Pre-download Llama 3 8B GGUF model (~5GB)
□ Pre-download Ambedkar's key texts from public sources
□ Create Ollama account / set up local runtime
□ Register Telegram bot for demo alerts
□ Create DAIC / ambedkar.org bookmarks for content
□ Prepare presentation template
□ Buy USB microphone (if not available)
```

---

## DAY 1: HOURS 0-12 — Foundation

### Hour 0-2: Infrastructure Setup

```
□ docker-compose up -d (PostgreSQL, Redis, MinIO, Meilisearch)
□ Verify all services running: PG, Redis, MinIO, Meili
□ Run database migrations (schema.sql)
□ Create .env file with all credentials
□ Verify: API health check returns 200
□ Set up project structure (folders, __init__.py files)
□ Git commit: "Day 1: Infrastructure setup complete"
```

### Hour 2-5: Backend + Database

```
□ FastAPI project scaffolded
□ Pydantic models: Document, Chunk, Embedding, Query, User
□ Database schema:
  - documents (id, title, source, language, date, metadata)
  - chunks (id, doc_id, text, page_num, embedding, metadata)
  - queries (id, question, answer, timestamp, user_agent)
  - users (id, name, role, preferences)
□ CRUD endpoints for documents
□ Document ingestion endpoint (POST /api/documents/ingest)
□ Search endpoint (POST /api/search)
□ Q&A endpoint (POST /api/ask)
□ MinIO bucket creation + file upload
□ Meilisearch index creation + document indexing
□ Git commit: "Day 1: Backend API complete"
```

### Hour 5-8: AI Pipeline (RAG)

```
□ Ollama running with Llama 3 8B Instruct
□ Test basic Q&A: "Who was Dr. Ambedkar?"
□ sentence-transformers: load all-MiniLM-L12-v2
□ Test embedding: "Annihilation of Caste" → 384-dim vector
□ pgvector: create HNSW index, test similarity search
□ Hybrid search: vector + BM25 → RRF fusion
□ Cross-encoder reranking (top 10 → top 5)
□ Full RAG pipeline: query → retrieve → rerank → generate → answer
□ Add citation formatting: [Source: Title, p.X]
□ Test with 10 Ambedkar Q&A pairs
□ Git commit: "Day 1: RAG pipeline functional"
```

### Hour 8-12: Content Ingestion

```
□ Download Annihilation of Caste (PDF/text)
□ Download key CAD sections (constitutional debates)
□ Download Ambedkar biography content
□ Build text extraction: PDF → text (PyPDF2 / pdfplumber)
□ Build chunking: text → 512-token chunks with overlap
□ Build embedding pipeline: chunks → vectors → pgvector
□ Index in Meilisearch for keyword search
□ Process 5+ documents end-to-end
□ Verify: search for "Poona Pact" returns relevant results
□ Verify: Q&A "What was the Poona Pact?" returns sourced answer
□ Git commit: "Day 1: Knowledge base populated"
```

---

## DAY 1: HOURS 12-18 — Kiosk UI

### Hour 12-15: Electron + React Scaffold

```
□ npm create electron-app samdarshi-kiosk --template=webpack-typescript
□ Install dependencies: React, TypeScript, Tailwind CSS
□ Install kiosk-specific: electron-builder, electron-store
□ Basic Electron main: kiosk mode, auto-fullscreen, auto-relaunch
□ IPC bridge: renderer <-> main process
□ React Router: Home, Chat, Timeline, Manuscript, About
□ Basic layout: sidebar + content area
□ Theme: dark blue + gold (constitutional colors)
□ Git commit: "Day 1: Kiosk app scaffolded"
```

### Hour 15-18: Core UI Components

```
□ HomeScreen: Logo, search bar, feature cards
□ ChatInterface: Message list, input, streaming responses
□   - Connect to backend /api/ask
□   - Display citations as clickable chips
□   - "Listen" button per message
□ TimelineComponent: Horizontal scrollable timeline
□   - D3.js or vis-timeline
□   - 50+ key events with dates
□   - Category filters
□ Navigation: Bottom bar or side menu
□ AudioPlayer: Play/pause, speed control, waveform
□ Git commit: "Day 1: Kiosk UI components built"
```

---

## DAY 2: HOURS 18-26 — Advanced Features

### Hour 18-21: OCR Pipeline

```
□ Install Tesseract 5 + Hindi/Sanskrit language packs
□ Install EasyOCR (Hindi, English)
□ Build preprocessing: OpenCV deskew, denoise, binarize
□ Test on sample documents (Ambedkar's writings)
□ Build post-processing: spell-check, layout preservation
□ Build API endpoint: POST /api/ocr/scan
□ Connect OCR → chunking → embedding → pgvector
□ Test: scan document → searchable in 30 seconds
□ Accuracy check: 85%+ on clean text, 70%+ on degraded
□ Git commit: "Day 2: OCR pipeline complete"
```

### Hour 21-24: Multilingual + TTS/STT

```
□ Install Whisper.cpp for speech-to-text
□ Install Coqui TTS for text-to-speech
□ Install Indic TTS for Hindi/Marathi
□ Build TTS API: POST /api/tts (text → audio)
□ Build STT API: POST /api/stt (audio → text)
□ Language detection: FastText lid.176.bin
□ Connect TTS to kiosk ChatInterface
□ Connect STT to kiosk voice input
□ Test: ask question in Hindi → get answer in Hindi + Hindi TTS
□ Git commit: "Day 2: Multilingual support complete"
```

### Hour 24-26: Timeline + Manuscript Viewer

```
□ Build ManuscriptViewer component
□   - Display scanned document (image)
□   - Overlay OCR extracted text
□   - Side-by-side: scan + text
□   - Zoom, pan, page navigation
□ Populate timeline: 100+ events with metadata
□ Add 20+ photographs from Wikimedia Commons
□ Link timeline events to documents and speeches
□ Build MemorialTour component (storytelling mode)
□ Git commit: "Day 2: Timeline + Manuscript viewer complete"
```

---

## DAY 2: HOURS 26-34 — Hardware + Polish

### Hour 26-30: Hardware Integration

```
□ Set up Raspberry Pi 5 (if available)
□   - Flash Raspberry Pi OS (64-bit)
□   - Install Node.js, Electron dependencies
□   - Copy kiosk app to Pi
□ Configure kiosk mode:
□   - Auto-login (default user)
□   - Auto-start Electron app on boot
□   - Disable screen saver / power management
□   - Chromium/Electron kiosk flags
□ Connect touchscreen display
□ Test touch input: all buttons clickable
□ Test audio: speakers + microphone working
□ Configure WiFi (auto-connect to DAIC network)
□ Git commit: "Day 2: Hardware kiosk configured"
```

### Hour 30-34: Content + Polish

```
□ Populate with 10+ full documents (complete texts)
□ Add 200+ timeline events with descriptions
□ Add 50+ photographs with captions
□ Add 5+ speeches with audio links
□ Add metadata tags to all content
□ Responsive design: test on 24" touchscreen
□ Accessibility: high contrast mode, font size options
□ Error handling: offline mode, retry logic
□ Loading states: spinners, skeleton screens
□ Polish UI: animations, transitions, hover effects
□ Test on laptop screen (not just kiosk)
□ Git commit: "Day 2: Content populated, UI polished"
```

---

## DAY 2: HOURS 34-36 — Demo + Presentation

### Hour 34-36: Final Preparation

```
□ Prepare 3 demo scenarios (scripted)
□ Test full demo flow 5+ times
□ Record demo video (3-minute backup)
□ Design presentation slides
□ Full system test: search → answer → audio → timeline
□ Final git commit: "SIH 2026 — Ready for presentation"
□ Laptop charged + charger + HDMI cable
□ Kiosk packed and protected (if bringing hardware)
□ Team rehearses presentation 2+ times
```

---

## CRITICAL PATH (If Running Out of Time)

```
PRIORITY 1 (Must Have):
  □ Backend API working (FastAPI + PostgreSQL)
  □ RAG pipeline with 5+ documents
  □ Basic kiosk UI (search + chat + timeline)
  □ 3 demo scenarios working

PRIORITY 2 (Should Have):
  □ OCR on at least 1 document
  □ TTS playback working
  □ 50+ timeline events
  □ Proper presentation slides

PRIORITY 3 (Nice to Have):
  □ Full multilingual (all 3 languages)
  □ Speech-to-text
  □ 500+ timeline events
  □ Hardware kiosk (vs laptop demo)
```

---

## TEAM ROLES

| Role | Name | Day 1 Focus | Day 2 Focus |
|---|---|---|---|
| **Team Lead** | [Name] | Backend + RAG | Integration + Demo |
| **ML Engineer** | [Name] | RAG + embeddings | OCR + TTS/STT |
| **Full-Stack Dev** | [Name] | Kiosk UI | Hardware + Polish |
| **Backend Dev** | [Name] | API + Database | Content + Testing |

---

## DEMO SCRIPT (7-8 minutes)

```
MINUTE 0-1: INTRO
  "Good morning. We're [Team]. We present Samdarshi — an AI-powered
   digital heritage archive for Dr. B.R. Ambedkar. A system that
   preserves, digitizes, and makes accessible the legacy of the
   architect of our Constitution."

MINUTE 1-2: THE PROBLEM
  "Dr. Ambedkar's 32 books, 4000+ speeches, and countless manuscripts
   are scattered across 50+ institutions. No intelligent search.
   No multilingual access. No AI assistance. No interactive experience.
   DAIC gets 500,000 visitors a year. They deserve better."

MINUTE 2-3: THE SOLUTION
  "Samdarshi has three pillars: interactive kiosks with touch and voice,
   an AI engine that answers questions with verified citations, and an
   archival pipeline that digitizes old manuscripts. Six key features:
   AI Research Assistant, Multilingual access, Audio Narration, OCR,
   Interactive Timeline, and Semantic Search."

MINUTE 3-5: LIVE DEMO
  [Walk to kiosk]
  "Let me show you. I'll ask Dr. Ambedkar a question."
  [Type on kiosk: "What was the Poona Pact?"]
  [Wait for answer — ~3 seconds]
  "Within 3 seconds, a sourced answer with clickable references."
  [Tap 'Listen'] "Audio narration plays. Now in Hindi."
  [Switch to Hindi, ask same question]
  [Show Timeline] "Navigate through his life — 1891 to 1956."
  [Show Manuscript viewer] "Original scan with OCR text overlay."

MINUTE 5-6: TECHNOLOGY
  "Llama 3 for AI. pgvector for semantic search. Tesseract for OCR.
   Electron for kiosk. Every component open-source. Zero licensing.
   Deployable at DAIC tomorrow with one Docker command."

MINUTE 6-7: IMPACT
  "Phase 1: 10 kiosks at DAIC. Phase 2: national across memorials.
   Phase 3: open-source platform for all Indian heritage.
   Per kiosk: ₹25,000. Ten kiosks: ₹2.5 lakh. Zero licensing."

MINUTE 7-8: CLOSE
  "Dr. Ambedkar believed in liberty, equality, fraternity.
   Samdarshi embodies that: free knowledge, accessible to all.
   Thank you. We're happy to answer your questions."
```

---

## FALLBACK PLAN (If Things Go Wrong)

| Problem | Fallback |
|---|---|
| Kiosk hardware not working | Demo on laptop (same UI, just bigger screen) |
| AI gives wrong answer | "We're implementing confidence thresholds — let me show you a verified answer" |
| OCR too slow | "For demo, we pre-processed — live scan takes 10 seconds" |
| Network issues | System is offline-first — no dependency needed |
| Llama 3 too slow | Switch to smaller model (Phi-3), use pre-generated answers |
| Demo crashes | Play backup video, continue with architecture walkthrough |
