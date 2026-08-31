# TECH DECISIONS — Samdarshi
## SIH 2026 | Architecture Decision Records

---

## ADR-001: Why Llama 3 8B for the AI Engine

**Decision**: Use Llama 3 8B Instruct (4-bit quantized) via Ollama

**Alternatives Considered**:
- GPT-4 API (cloud) — requires internet, costs money, privacy concerns
- Mistral 7B — slightly worse reasoning, similar size
- Phi-3 Mini — too small for constitutional Q&A
- Falcon 7B — inferior to Llama 3 benchmarks

**Reasoning**:
- **Offline-first**: No internet required, essential for institutional deployment
- **Zero cost**: No API fees for government deployment
- **Privacy**: Data never leaves the institution
- **Quality**: Llama 3 8B is state-of-the-art for its size class
- **Quantization**: 4-bit GGUF reduces from 40GB to ~5GB, fits on consumer GPU
- **Ollama**: Simplest local LLM serving, one-command setup

**Tradeoff**: Slower than cloud APIs (~10-20 tokens/sec vs instant). Acceptable for kiosk use.

---

## ADR-002: Why pgvector for Semantic Search

**Decision**: Use PostgreSQL + pgvector extension for vector storage and search

**Alternatives Considered**:
- Pinecone (managed vector DB) — requires cloud, costs money, vendor lock-in
- Weaviate — heavier deployment, more complex
- ChromaDB — good for prototyping, less mature for production
- Qdrant — Rust-based, less ecosystem integration

**Reasoning**:
- **Unified**: One database for structured data + vectors
- **Open-source**: Zero licensing, no vendor lock-in
- **Performance**: HNSW index provides sub-millisecond similarity search
- **Ecosystem**: Works with all Python ML tools (sentence-transformers, LangChain)
- **Proven**: Used by production systems at scale
- **Government-friendly**: Can be self-hosted, no data leaves premises

**Tradeoff**: Slightly slower than Pinecone at massive scale. Fine for institutional use (<100K documents).

---

## ADR-003: Why Electron for Kiosk App

**Decision**: Use Electron + React + TypeScript for the kiosk application

**Alternatives Considered**:
- Native (Qt/C++) — too complex, long development time
- Flutter — good but smaller ecosystem for kiosk-specific features
- PWA (browser-only) — no offline capability, limited hardware access
- Python (PyQt/Tkinter) — poor UI quality, slow development
- JavaFX — dated look, verbose

**Reasoning**:
- **Web tech**: React ecosystem (largest component library)
- **Cross-platform**: Runs on Windows, Linux, macOS
- **Kiosk mode**: Electron has built-in kiosk mode
- **Hardware access**: USB mic, touchscreen, audio all accessible
- **Development speed**: Fastest path to polished UI
- **Offline**: Works completely offline with Service Workers
- **Team skills**: Most teams know JavaScript/React

**Tradeoff**: Higher memory usage (~500MB). Fine for Raspberry Pi 5 (4GB RAM).

---

## ADR-004: Why Tesseract + EasyOCR (Dual Engine)

**Decision**: Use Tesseract 5 as primary OCR, EasyOCR as fallback

**Alternatives Considered**:
- EasyOCR only — slower, larger model
- Tesseract only — poor on degraded documents
- Google Cloud Vision API — requires internet, costs money
- PaddleOCR — good but less mature Indic language support

**Reasoning**:
- **Tesseract**: Fast, lightweight, excellent on clean prints, great Devanagari support
- **EasyOCR**: Better on degraded/low-quality text, handles rotations better
- **Fusion**: Best result per word selected from both engines
- **Open-source**: Both free, no API costs
- **Languages**: Combined support for English, Hindi, Marathi, Sanskrit
- **Offline**: Both run locally

**Tradeoff**: Running both engines doubles processing time. Mitigated by async processing (Celery).

---

## ADR-005: Why FastAPI over Flask/Django

**Decision**: Use FastAPI for backend API

**Alternatives Considered**:
- Flask — synchronous, less modern, manual validation
- Django — too heavy, includes ORM we don't need
- Express.js — Node.js ecosystem, but Python is better for ML integration

**Reasoning**:
- **Async**: Native async/await for concurrent I/O
- **Auto-docs**: OpenAPI docs generated automatically
- **Type validation**: Pydantic models prevent bad data
- **Performance**: 2-3x faster than Flask
- **Python-native**: Integrates seamlessly with ML libraries
- **WebSocket**: Built-in support for streaming AI responses

**Tradeoff**: Smaller ecosystem than Flask/Django. Fine for our use case.

---

## ADR-006: Why Docker Compose for Deployment

**Decision**: Use Docker Compose for all services

**Alternatives Considered**:
- Kubernetes — overkill for single-server deployment
- Manual installation — error-prone, not reproducible
- Ansible — more complex for team unfamiliar with it
- Podman — less ecosystem support

**Reasoning**:
- **Simplicity**: One command deploys everything
- **Reproducibility**: Same environment everywhere
- **Government-friendly**: Easy for institution IT to manage
- **Documentation**: docker-compose.yml IS the setup guide
- **Scaling**: Can migrate to Kubernetes later if needed

**Tradeoff**: Slightly higher resource usage. Negligible for server-class hardware.

---

## ADR-007: RAG Design: Hybrid Search + Reranking

**Decision**: Use hybrid search (vector + BM25) with cross-encoder reranking

**Alternatives Considered**:
- Vector-only search — misses exact keyword matches
- Keyword-only search — misses semantic similarity
- Vector-only + no reranking — lower precision
- LLM-only (no retrieval) — hallucinations, no citations

**Reasoning**:
- **Hybrid**: Vector search finds conceptually similar content; keyword search finds exact matches
- **RRF**: Reciprocal Rank Fusion combines both result sets effectively
- **Reranking**: Cross-encoder (ms-marco-MiniLM) improves precision by 15-20%
- **Citations**: RAG with verified sources = no hallucinations
- **Performance**: Total pipeline <3 seconds for constitutional Q&A

**Tradeoff**: More complex than single search. Worth it for accuracy.

---

## ADR-008: Content Chunking Strategy

**Decision**: Chunk by section/chapter with 200-token overlap, 512-token chunks

**Alternatives Considered**:
- Fixed-size chunks — breaks sentences, loses context
- Sentence-level — too many small chunks, retrieval noise
- Paragraph-level — good but inconsistent sizes
- Semantic chunking (AI-based) — expensive, slow

**Reasoning**:
- **Section-based**: Respects document structure (chapters, speeches, articles)
- **512 tokens**: Optimal for both retrieval precision and context window
- **200 overlap**: Ensures context continuity between chunks
- **Metadata per chunk**: Source, page, date, topic tags for filtering

**Tradeoff**: Some chunks may be slightly long. Acceptable for constitutional text.

---

## SECURITY & PRIVACY DECISIONS

| Decision | Choice | Rationale |
|---|---|---|
| Data residency | On-premise only | Government data never leaves institution |
| LLM data | Not sent to cloud | Llama 3 runs locally via Ollama |
| User queries | Logged locally | Analytics, no external sharing |
| Content licensing | MIT for code, Public Domain for content | Government-friendly |
| Authentication | JWT tokens | Stateless, works with kiosk sessions |
| Access control | Role-based (visitor, admin) | Simple but effective |
