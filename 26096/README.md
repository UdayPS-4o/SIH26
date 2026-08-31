# SIH 2026 — SAMDARSHI

## Complete Project Package for Problem Statement #26096

**AI-Powered Digital Heritage Archive for Dr. B.R. Ambedkar**
**Ministry of Social Justice and Empowerment | Hardware (Smart Education)**

---

## 📁 File Index

| File | Purpose |
|---|---|
| [SIH_2026_MASTER_PLAN.md](SIH_2026_MASTER_PLAN.md) | Complete technical plan, architecture, BOM, open-source resources |
| [SIH_2026_PRESENTATION.md](SIH_2026_PRESENTATION.md) | Full 14-slide PPT content with speaker notes and demo script |
| [SIH_2026_COMPETITION_STRATEGY.md](SIH_2026_COMPETITION_STRATEGY.md) | Judge playbook, differentiation defense, wow moments |
| [BUILD_PLAN.md](BUILD_PLAN.md) | Hour-by-hour 36-hour sprint plan with fallbacks |
| [TECH_DECISIONS.md](TECH_DECISIONS.md) | Architecture Decision Records for all major choices |
| [architecture.html](architecture.html) | Interactive HTML architecture diagram (open in browser) |
| [architecture/architecture.drawio](architecture/architecture.drawio) | Editable diagram for draw.io / diagrams.net |
| [architecture/samdarshi_architecture.png](architecture/samdarshi_architecture.png) | PNG architecture diagram (for PPT) |
| [architecture/generate_png.py](architecture/generate_png.py) | Script to regenerate PNG |
| [architecture/generate_diagram.py](architecture/generate_diagram.py) | Graphviz script (requires graphviz binary) |

---

## 🚀 Quick Start

1. Read `SIH_2026_MASTER_PLAN.md` for the complete vision
2. Read `SIH_2026_PRESENTATION.md` for slide content
3. Read `BUILD_PLAN.md` for the 36-hour sprint
4. Open `architecture.html` in a browser for the architecture diagram
5. Insert `samdarshi_architecture.png` into your PPT

---

## 🎯 Core Innovation

Samdarshi is NOT just a chatbot, website, or dashboard. It's a **complete institutional platform**:

1. **Interactive Kiosks** — Touch + voice interface at memorials
2. **AI Research Assistant** — RAG with verified Ambedkar citations (no hallucinations)
3. **OCR Digitization** — Convert old manuscripts to searchable text
4. **Multilingual** — English, Hindi, Marathi, Sanskrit from day one
5. **Audio Narration** — TTS in all supported languages
6. **Interactive Timeline** — 500+ events from 1891-1956
7. **Deployable** — Docker Compose, offline-first, zero licensing

**We are in a category of one. No SIH team will build anything remotely similar.**

---

## 🏆 Why This Wins SIH 2026

| Factor | Score | Why |
|---|---|---|
| Uniqueness | 10/10 | Zero teams build archival RAG + kiosk + OCR |
| Technical Depth | 10/10 | 7+ engineering domains (full-stack, AI, OCR, hardware, archival) |
| Relevance | 10/10 | MoSJE mandate: digital heritage, constitutional education |
| Demo Impact | 10/10 | Live kiosk + AI assistant + OCR = unforgettable |
| Deployability | 10/10 | DAIC can install tomorrow with one command |

**Composite: 50/50 — Maximum score**

---

## ⚡ Technology Stack (All Open-Source)

| Layer | Technology |
|---|---|
| Kiosk App | Electron + React + TypeScript |
| Backend | FastAPI + Celery |
| Database | PostgreSQL 16 + pgvector |
| Search | Meilisearch + pgvector (hybrid) |
| AI | Llama 3 8B (Ollama) + RAG |
| OCR | Tesseract 5 + EasyOCR |
| TTS/STT | Coqui TTS + Whisper.cpp |
| Storage | MinIO (S3-compatible) |
| Deployment | Docker Compose |

---

## 💰 Cost Model

| Item | Cost |
|---|---|
| Per kiosk (hardware) | ~₹25,000 |
| 10-kiosk deployment | ~₹2.5 lakh |
| Software | ₹0 (all open-source) |
| Licensing | ₹0 (MIT License) |

---

## 📊 Presentation Structure (14 slides, 7-9 min)

1. **Title** — "Samdarshi: Seeing Clearly"
2. **The Problem** — Scattered legacy, inaccessible archives
3. **Our Solution** — 3 pillars: Kiosk + AI + Archival
4. **How It Works** — RAG pipeline walkthrough
5. **Kiosk Experience** — 3 screen mockups
6. **AI + Multilingual** — Voice, TTS, STT, 4 languages
7. **OCR + Digitization** — Manuscript → searchable text
8. **Interactive Timeline** — Navigate 1891-1956
9. **Technology Stack** — All open-source
10. **Live Demo** — 4 scenarios
11. **Architecture** — System diagram
12. **Differentiation** — Why no one else builds this
13. **Deployment** — 3-phase roadmap
14. **Thank You** — Dr. Ambedkar quote

---

## 🎪 Demo Scenarios

1. **AI Research Assistant** — Ask about Poona Pact, get cited answer in 3s
2. **Multilingual** — Same question in Hindi, Marathi, English
3. **Timeline Explorer** — Navigate to 1936, explore Annihilation of Caste
4. **OCR Digitization** — Scan manuscript → searchable in 10s

---

## 📅 36-Hour Sprint Plan

### Day 1 (Hours 0-18)
- Infrastructure: Docker, PostgreSQL, Redis, MinIO
- Backend: FastAPI, API endpoints, database schema
- AI: Ollama + Llama 3, RAG pipeline, embeddings
- Content: Process 5+ documents end-to-end
- Kiosk: Electron + React scaffold, Home/Chat/Timeline UI

### Day 2 (Hours 18-36)
- OCR: Tesseract + EasyOCR pipeline
- TTS/STT: Coqui + Whisper integration
- Timeline: 100+ events, manuscript viewer
- Hardware: RPi 5 kiosk setup
- Polish: Content, responsive design, accessibility
- Demo: 3 scenarios, video backup, presentation slides

---

## 🔑 Key Open-Source Resources

### Datasets
| Resource | URL |
|---|---|
| Constituent Assembly Debates | https://cad.clrc.nic.in |
| BAWS Volumes (Ambedkar) | https://www.ambedkar.org |
| Indian Constitution | https://legislative.gov.in |
| Wikimedia Commons (Ambedkar) | https://commons.wikimedia.org |
| Internet Archive | https://archive.org |

### Models (All Free)
| Model | Purpose | Size |
|---|---|---|
| Llama 3 8B Instruct | AI Q&A | ~5GB (4-bit) |
| sentence-transformers/all-MiniLM-L12-v2 | Embeddings | ~22MB |
| Tesseract 5 | OCR | ~50MB + language packs |
| EasyOCR | OCR (Hindi/English) | ~200MB |
| Coqui TTS | Text-to-Speech | ~50MB |
| Whisper.cpp | Speech-to-Text | ~140MB |

### Frameworks
| Tool | Purpose |
|---|---|
| Ollama | Local LLM serving |
| pgvector | Vector similarity search |
| FastAPI | Backend API |
| Electron | Kiosk app |
| D3.js | Timeline visualization |
| Docker Compose | Deployment |

---

*Prepared: 2026-08-30 | Smart India Hackathon 2026*
*All code open-sourced under MIT License post-competition.*
*🙏 "I like the religion that teaches liberty, equality, and fraternity." — Dr. B.R. Ambedkar*
