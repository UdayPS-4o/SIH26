# Samdarshi — Fake-to-Real Replacement Map
## Detailed tracking document for hackathon progress

---

## PART 1: Component-Level Fake vs Real

| # | Component | Fake Implementation | Real Implementation (Target) | Effort | Priority | Status |
|---|---|---|---|---|---|---|
| 1 | Chat AI responses | Keyword → pre-written response (12 topics) | Llama 3 8B + RAG pipeline | 6-8 hrs | P0 | ⚠️ FAKE |
| 2 | OCR text extraction | Fake 3s animation → pre-written text | Tesseract 5 + EasyOCR | 4-5 hrs | P1 | ⚠️ FAKE |
| 3 | Hindi translations | Pre-translated 12 responses | Google Translate / LibreTranslate | 2-3 hrs | P2 | ⚠️ FAKE |
| 4 | Marathi translations | Pre-translated 12 responses | Google Translate / LibreTranslate | 2-3 hrs | P2 | ⚠️ FAKE |
| 5 | Language detection | Keyword matching | FastText lid.176.bin | 1 hr | P2 | ⚠️ FAKE |
| 6 | Embeddings | None (skipped) | sentence-transformers + pgvector | 2-3 hrs | P3 | ⏭️ SKIP |
| 7 | Vector search | None (skipped) | pgvector HNSW index | 2 hrs | P3 | ⏭️ SKIP |
| 8 | Cross-encoder reranking | None (skipped) | ms-marco-MiniLM-L12-v2 | 1-2 hrs | P3 | ⏭️ SKIP |
| 9 | User authentication | Not implemented | None | — | P4 | ⏭️ SKIP |
| 10 | Admin panel | UI shell only | Full backend | 4-5 hrs | P4 | ⏭️ SKIP |
| 11 | Analytics dashboard | Empty charts | Real data + metrics | 3-4 hrs | P4 | ⏭️ SKIP |
| 12 | Video playback | Thumbnail placeholder | Full video player | 2-3 hrs | P4 | ⏭️ SKIP |
| 13 | Export to PDF | Button only | Real PDF generation | 1-2 hrs | P4 | ⏭️ SKIP |
| 14 | Electron kiosk mode | Basic Electron shell | Full kiosk setup | 3-4 hrs | P0 | ✅ REAL |
| 15 | React frontend UI | Full implementation | Polish + animations | 4-5 hrs | P0 | ✅ REAL |
| 16 | FastAPI backend | Full implementation | Error handling | 2-3 hrs | P0 | ✅ REAL |
| 17 | Database (SQLite) | Full schema + seed | Migration to PostgreSQL | 2-3 hrs | P0 | ✅ REAL |
| 18 | Static content | 8 docs + 34 events | Expand to 50+ events | 1-2 hrs | P0 | ✅ REAL |
| 19 | Keyword search | String matching | Meilisearch integration | 2-3 hrs | P0 | ✅ REAL |
| 20 | Docker Compose | Full stack | Monitoring (Prometheus) | 2-3 hrs | P0 | ✅ REAL |
| 21 | Browser TTS | Web Speech API (REAL) | None needed | — | P0 | ✅ REAL |
| 22 | Browser STT | Web Speech API (REAL) | None needed | — | P0 | ✅ REAL |

---

## PART 2: API Endpoint Status

### Fully Real Endpoints

| Endpoint | Method | Handler | Database | Response |
|---|---|---|---|---|
| `/api/health` | GET | `health()` | None | JSON status |
| `/api/documents` | GET | `list_documents()` | SELECT * FROM documents | JSON array |
| `/api/documents/{id}` | GET | `get_document(id)` | SELECT WHERE id | JSON object |
| `/api/documents/search?q=...` | GET | `search_documents(q)` | SELECT WHERE title LIKE/description LIKE | JSON array with scores |
| `/api/timeline` | GET | `list_events()` | SELECT * FROM timeline_events | JSON array |
| `/api/timeline?year=X` | GET | `filter_by_year(year)` | SELECT WHERE year | JSON array |
| `/api/timeline?category=X` | GET | `filter_by_category(cat)` | SELECT WHERE category | JSON array |

### Fake Endpoints

| Endpoint | Method | Current Behavior | Target Behavior | File |
|---|---|---|---|---|
| `/api/chat` | POST | `fake_ai.py` keyword match → returns pre-written response | RAG pipeline: embed → search → rerank → generate | `routers/chat.py` |
| `/api/ocr/scan` | POST | `asyncio.sleep(3)` → return `{"text": "..."}` | Tesseract/EasyOCR processing → return real extracted text | `routers/ocr.py` |

### Skipped Endpoints

| Endpoint | Status | Notes |
|---|---|---|
| `/api/auth/login` | ⏭️ SKIP | Not needed for demo |
| `/api/auth/logout` | ⏭️ SKIP | Not needed for demo |
| `/api/admin/dashboard` | ⏭️ SKIP | UI only |
| `/api/admin/upload` | ⏭️ SKIP | UI only |
| `/api/users` | ⏭️ SKIP | Not needed for demo |
| `/api/export/pdf` | ⏭️ SKIP | Not needed for demo |

---

## PART 3: Phase-by-Phase Checklist

### PRE-HACKATHON (Complete Before Day 1)

```
Environment Setup:
  □ Install Docker Desktop (test with `docker run hello-world`)
  □ Install Node.js 18+ (`node --version`)
  □ Install Python 3.11+ (`python --version`)
  □ Install VS Code with extensions: Python, ESLint, Prettier

Project Setup:
  □ Create GitHub repo: "samdarshi" (public, MIT license)
  □ Clone repo to local machine
  □ Create folder structure:
    □ backend/
    □ frontend/
    □ datasets/
    □ architecture/
    □ prototype/ ← THIS WORK
  □ Add team members as collaborators

Content Preparation:
  □ Download timeline.json (34 events) ✓ DONE
  □ Download documents.json (8 docs) ✓ DONE
  □ Download fakeResponses.json (12 responses) ✓ DONE
  □ Research additional Ambedkar content (speeches, writings)
  □ Prepare 5-10 "wow moment" demo scenarios

Tools Preparation:
  □ Pre-download any large models (Llama 3 GGUF, ~5GB)
  □ Bookmark key URLs: CAD, BAWS, legislative.gov.in
  □ Create Telegram bot (for demo alerts) OPTIONAL
  □ Prepare presentation template (14 slides)
  □ Create demo video script (3-minute backup)
```

### DAY 1: HOURS 0-12 — Build Real Infrastructure

```
Hour 0-2: Backend Setup
  □ Create `backend/main.py` with FastAPI
  □ Create `backend/database.py` with SQLAlchemy
  □ Create `backend/models.py` with Document and TimelineEvent
  □ Create `backend/schemas.py` with Pydantic schemas
  □ Create `backend/seed_data.py`
  □ Test: `uvicorn main:app --reload` works
  □ Create `backend/requirements.txt`
  □ Create `backend/Dockerfile`
  □ Git commit: "Backend scaffolded"

Hour 2-4: Database + Seed Data
  □ Verify all tables created
  □ Seed documents.json into database
  □ Seed timeline.json into database
  □ Test GET /api/documents returns 8 documents
  □ Test GET /api/timeline returns 34 events
  □ Verify dates and content are accurate
  □ Git commit: "Database seeded with real content"

Hour 4-6: Search + Chat Endpoints
  □ Implement GET /api/documents/search
  □ Implement POST /api/chat
  □ Implement fake_ai.py with 12 keyword-response pairs
  □ Test all 12 responses work correctly
  □ Add fallback response for unknown questions
  □ Git commit: "Search and chat endpoints complete"

Hour 6-8: OCR Endpoint
  □ Implement POST /api/ocr/scan
  □ Add fake 3s delay
  □ Return pre-written passage
  □ Git commit: "Fake OCR endpoint complete"

Hour 8-10: Frontend Setup
  □ Initialize React project with Vite
  □ Install dependencies (react-router-dom, axios)
  □ Set up routing (Home, Chat, Timeline, Manuscripts, About)
  □ Create index.css with dark theme
  □ Create basic App.jsx layout
  □ Git commit: "Frontend scaffolded"

Hour 10-12: Core UI Components
  □ HomeScreen.jsx (hero, search bar, feature cards)
  □ ChatInterface.jsx (message bubbles, input)
  □ Timeline.jsx (horizontal scroll)
  □ ManuscriptViewer.jsx (grid + modal)
  □ About.jsx
  □ Connect all to backend API
  □ Git commit: "Core UI complete"
```

### DAY 1: HOURS 12-18 — Polish + Integration

```
Hour 12-14: UI Polish
  □ Add animations (transitions, hover effects)
  □ Add loading states (spinners, skeletons)
  □ Add error handling (empty states, retry)
  □ Test on different screen sizes
  □ Ensure minimum 60px tap targets for kiosk
  □ Add accessibility (high contrast, keyboard nav)

Hour 14-16: TTS/STT Integration
  □ Create useSpeech.js hook
  □ Integrate TTS into ChatInterface
  □ Add "Listen" button to responses
  □ Add voice input button
  □ Test in browser (Chrome/Edge)
  □ Add language support for TTS (en, hi)

Hour 16-18: Docker + Testing
  □ Create docker-compose.yml
  □ Create nginx.conf
  □ Test: `docker-compose up -d`
  □ Test: Access at http://localhost:8080
  □ Test all demo scenarios
  □ Fix bugs found during testing
  □ Record backup demo video (3 min)
  □ Git commit: "Day 1 complete — demo ready"
```

### DAY 2: HOURS 0-6 — Replace OCR (Priority P1)

```
Hour 0-2: OCR Setup
  □ Install Tesseract 5
  □ Install Hindi/Sanskrit language packs
  □ Install EasyOCR
  □ Install OpenCV
  □ Test basic OCR on sample image

Hour 2-4: OCR Pipeline
  □ Build preprocessing (deskew, denoise, binarize)
  □ Build Tesseract wrapper
  □ Build EasyOCR wrapper
  □ Build post-processing (spell check, layout)
  □ Test on Ambedkar document samples
  □ Verify accuracy >85% on clean text

Hour 4-6: Integration
  □ Replace fake OCR endpoint with real
  □ Add OCR results to search index
  □ Test end-to-end scan → search
  □ Update seed_data.py to include OCR'd content
  □ Git commit: "Real OCR pipeline"
```

### DAY 2: HOURS 6-12 — Replace AI (Priority P0, MOST IMPORTANT)

```
Hour 6-8: LLM Setup
  □ Install Ollama
  □ Download Llama 3 8B Instruct GGUF (4-bit)
  □ Verify Ollama loads model
  □ Test basic Q&A: "Who is Ambedkar?"
  □ Optimize for speed (batch size, threads)

Hour 8-10: RAG Pipeline
  □ Install sentence-transformers
  □ Generate embeddings for all document chunks
  □ Set up pgvector extension in PostgreSQL
  □ Create HNSW index for vector search
  □ Implement hybrid search (vector + BM25)
  □ Implement RRF fusion

Hour 10-11: Reranking + Generation
  □ Install cross-encoder (ms-marco-MiniLM-L12-v2)
  □ Implement reranking (top 10 → top 5)
  □ Implement RAG pipeline: embed → search → rerank → context → generate
  □ Add citation formatting: [Source: Title, p.X]
  □ Test with 10 Q&A pairs

Hour 11-12: Integration
  □ Replace fake_ai.py with real RAG
  □ Add streaming responses (token-by-token)
  □ Test latency (target: <5s end-to-end)
  □ Test all 12 demo questions
  □ Git commit: "Real AI engine (RAG + Llama 3)"
```

### DAY 2: HOURS 12-18 — Replace Multilingual + Hardware

```
Hour 12-14: Multilingual Setup
  □ Install LibreTranslate (or Google Translate API)
  □ Implement real-time translation in chat
  □ Install FastText for language detection
  □ Implement automatic language detection
  □ Add TTS in Hindi/Marathi (Coqui TTS or browser)
  □ Test all 4 languages (English, Hindi, Marathi, Sanskrit)

Hour 14-16: Hardware Integration (if RPi available)
  □ Flash Raspberry Pi OS (64-bit)
  □ Install Node.js, Electron dependencies
  □ Copy kiosk app to Pi
  □ Configure kiosk mode (auto-login, auto-start)
  □ Connect touchscreen display
  □ Test touch input
  □ Test audio (speakers + microphone)
  □ Configure WiFi (auto-connect)

Hour 16-18: Final Polish + Hardware (if no RPi)
  □ Populate timeline with 50+ events
  □ Add 20+ photographs (Wikimedia Commons)
  □ Add 5+ speeches with audio
  □ Responsive design testing
  □ Accessibility improvements
  □ Full system test
  □ Git commit: "Multilingual + polish complete"
```

### DAY 2: HOURS 18-24 — Final Preparation

```
Hour 18-20: Demo Perfection
  □ Practice 3 demo scenarios (10+ times each)
  □ Time each scenario (target 7-8 min total)
  □ Prepare fallback responses for edge cases
  □ Test demo on presentation laptop
  □ Test demo on presentation projector/display

Hour 20-22: Presentation
  □ Finalize 14 slides (from SIH_2026_PRESENTATION.md)
  □ Insert architecture diagram PNG
  □ Add demo video to slides
  □ Add BOM and cost slides
  □ Review all slides for consistency
  □ Print handout (optional)

Hour 22-24: Final Testing + Pack
  □ Full system test (all features)
  □ Network test (offline mode)
  □ Battery check (if laptop)
  □ Backup demo video on USB
  □ HDMI cables, adapters ready
  □ Team rehearses presentation 2x
  □ Sleep (if time permits!)
```

---

## PART 4: API Endpoint Implementation Details

### POST /api/chat — CURRENT (FAKE)

```python
@router.post("/chat")
async def chat(request: ChatRequest):
    # Load fake responses
    fake_ai = load_fake_ai()
    # Match keywords
    result = match_keywords(request.question, fake_ai)
    # Return response
    return ChatResponse(
        answer=result["answer"],
        sources=[result["source"]],
        confidence=result["confidence"],
        language=result["language"]
    )
```

**To Replace With (REAL)**:
```python
@router.post("/chat")
async def chat(request: ChatRequest):
    # 1. Embed the query
    query_embedding = embed_model.encode(request.question)
    
    # 2. Hybrid search
    vector_results = await vector_search(query_embedding, top_k=20)
    keyword_results = await keyword_search(request.question, top_k=20)
    
    # 3. RRF Fusion
    fused_results = reciprocal_rank_fusion(vector_results, keyword_results)
    
    # 4. Rerank
    reranked = await cross_encoder.rerank(request.question, fused_results, top_k=5)
    
    # 5. Assemble context
    context = assemble_context(reranked)
    
    # 6. Generate
    response = await llm.generate(
        question=request.question,
        context=context,
        citations=True
    )
    
    # 7. Return
    return ChatResponse(
        answer=response.text,
        sources=response.citations,
        confidence=response.confidence,
        language=request.language
    )
```

### POST /api/ocr/scan — CURRENT (FAKE)

```python
@router.post("/ocr/scan")
async def scan_document(request: OCRScanRequest):
    # FAKE: Just wait 3 seconds and return pre-written text
    await asyncio.sleep(3)
    return {
        "text": "The problem of the rupee is essentially a problem of...",
        "confidence": 0.92,
        "pages": 1,
        "processing_time": "3.0s"
    }
```

**To Replace With (REAL)**:
```python
@router.post("/ocr/scan")
async def scan_document(file: UploadFile):
    # 1. Read image
    image_data = await file.read()
    image = preprocess_image(image_data)
    
    # 2. OCR with Tesseract
    tesseract_text = tesseract_ocr(image, lang="eng+hin+san")
    
    # 3. OCR with EasyOCR (fallback)
    easyocr_text = easyocr_ocr(image, lang=["en", "hi", "sa"])
    
    # 4. Fuse results (best per word)
    fused_text = fuse_ocr_results(tesseract_text, easyocr_text)
    
    # 5. Post-process
    cleaned_text = post_process(fused_text)
    
    # 6. Chunk and embed
    chunks = chunk_text(cleaned_text)
    embeddings = embed_model.encode(chunks)
    
    # 7. Store in database
    await store_document(cleaned_text, chunks, embeddings)
    
    return {
        "text": cleaned_text[:500] + "...",
        "confidence": 0.85,
        "pages": count_pages(image_data),
        "processing_time": "12.5s"
    }
```

---

## PART 5: Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|
| Fake AI not convincing | Medium | High | Add streaming, citations, confidence | Frontend Lead | Mitigated |
| UI crashes during demo | Low | High | Backup video, laptop demo | Backend Lead | Mitigated |
| Llama 3 too slow | High | Medium | Use 4-bit quantization, fallback | ML Engineer | Known |
| Judges ask edge case question | Medium | Medium | Prepare 20+ Q&A, acknowledge limits | All | Mitigated |
| OCR not working in time | Medium | High | Keep fake OCR as fallback | ML Engineer | Mitigated |
| Hardware kiosk fails | Medium | Medium | Demo on laptop instead | Hardware Lead | Mitigated |
| Network issues at venue | Medium | Medium | System is offline-first | All | Mitigated |
| Competition has similar project | Low | High | Category of one — unique | Team Lead | Mitigated |

---

## PART 6: Daily Standup Template

### Day 1, Hour 12 Check-in
```
1. What I completed:
   □
2. What I'm working on:
   □
3. Blockers:
   □
4. Demo readiness: [ ] Y / [ ] N
5. Questions for judges:
   □
```

### Day 2, Hour 12 Check-in
```
1. What I completed:
   □
2. What I'm working on:
   □
3. Blockers:
   □
4. Real AI working: [ ] Y / [ ] N
   Real OCR working: [ ] Y / [ ] N
5. Final prep:
   □
```

---

## PART 7: Ownership Matrix

| Area | Owner | Backup | Deadlines |
|---|---|---|---|
| Backend API | [Name] | [Name] | Day 1, Hour 6 |
| Frontend UI | [Name] | [Name] | Day 1, Hour 12 |
| AI/RAG | [Name] | [Name] | Day 2, Hour 12 |
| OCR | [Name] | [Name] | Day 2, Hour 6 |
| Multilingual | [Name] | [Name] | Day 2, Hour 14 |
| Hardware | [Name] | [Name] | Day 2, Hour 16 |
| Presentation | [Name] | [Name] | Day 2, Hour 22 |
| Demo Practice | All | — | Day 2, Hour 24 |

---

*Created: 2026-08-30 | Samdarshi Prototype Plan*
*Track all changes here. Cross off ✅ when replaced with real implementation.*
