# NUMMF — Complete Build Plan
**SIH 2026 · Problem Statement #26099 · Ministry of Petroleum & Natural Gas / CPCL**
> *"AI-Driven Standardization and Harmonization of Material Codes Across CPSEs"*

---

## Table of Contents

1. [Part 1 — The Problem, The Solution, The Approach (Plain English)](#part-1)
2. [Part 2 — Detailed Technical Guide](#part-2)
3. [Part 3 — Research, Datasets & Reusable Codebases](#part-3)
4. [Part 4 — Week-by-Week Execution Plan](#part-4)
5. [Part 5 — Docker & Deployment](#part-5)

---

## Part 1 — The Problem, The Solution, The Approach (Plain English)

### 1.1 What the Problem Actually Is

Imagine five government companies — IOCL (oil), NTPC (power), SAIL (steel), CIL (coal), HEC (heavy engineering) — each buying similar things but calling them by different names and coding them differently.

| What it is | IOCL calls it | NTPC calls it | SAIL calls it |
|---|---|---|---|
| Mild steel plate, 10mm thick | MS-PL-10MM | PL-MS-10 | PL-ST-10 |
| Hydraulic pump, 50 L/min | HYD-PMP-50L | P-HYD-50L | PMP-HYD-50L |
| Electrical cable, 4mm², copper | CAB-EL-4SQMM | CB-CU-4 | CAB-CU-4SQ |

**This is the problem:** every CPSE has its own naming convention. When the government wants to consolidate procurement (buy in bulk across all CPSEs), nobody knows what matches what. Manual reconciliation takes months and still has errors. The Ministry of Petroleum & Natural Gas wants a single "National Material Code" so every CPSE can speak the same language.

### 1.2 What We Are Building

We are building **NUMMF (National Unified Material Master Framework)** — a full-stack AI web application that:

1. **Ingests** material catalogs from any CPSE (CSV, Excel, JSON, or live ERP API)
2. **Normalizes** messy descriptions — fixes abbreviations, expands Indian industrial jargon, standardizes units
3. **Matches** materials across CPSEs using a 4-stage AI pipeline (not just keyword search — actual intelligence)
4. **Proposes** a unified "CNMC" (Common National Material Code) like `CNMC-FA-4A2B9C` for each unique material
5. **Lets human experts review** the AI suggestions in a queue-based interface (approve/reject/edit)
6. **Generates analytics** — how much duplication exists, how much money can be saved, quality of matches over time
7. **Exports** everything in standard formats for ERP integration (SAP, Oracle, custom)

### 1.3 How We Are Doing It — The 4-Stage AI Pipeline (Simple)

When two material descriptions come in (say from IOCL and NTPC), here's what happens:

```
Stage 1: NORMALIZE
"MS plate 10mm thick IS:2062" → "mild steel plate thickness 10mm grade IS2062"
(Fixes abbreviations, expands terms, standardizes format)

Stage 2: MATCH (Three Scores)
- Lexical score (30%): How similar do the words look? → RapidFuzz
- Semantic score (40%): How similar is the MEANING? → AI embeddings (all-MiniLM-L6-v2)
- Numeric score (30%): Do the dimensions match exactly? → Regex extraction
→ Combined score out of 100

Stage 3: RERANK
Top 20 candidates from Stage 2 → Cross-Encoder re-scores each pair
→ Most accurate top-5 matches

Stage 4: CLASSIFY
Final decision: EXACT MATCH / NEAR DUPLICATE / EQUIVALENT / PARTIAL
Confidence: HIGH / MEDIUM / LOW
```

**Why this beats normal search:** Google-style search only looks at words. Our pipeline looks at MEANING + NUMBERS + DOMAIN KNOWLEDGE. A bi-encoder (fast) narrows candidates, then a cross-encoder (slow but accurate) picks the best match. This is the same architecture used by production search engines — we're applying it to industrial materials.

### 1.4 What We Are NOT Building

- ❌ Not a full ERP system (we integrate with existing ERPs)
- ❌ Not a chatbot (it's a structured web application)
- ❌ Not using any proprietary/paid AI APIs (everything runs locally)
- ❌ Not a research prototype (it's a deployable product with Docker)

### 1.5 Why This Will Win at SIH

| Criterion | What Judges Look For | What NUMMF Delivers |
|-----------|---------------------|-------------------|
| **Problem Understanding** | Deep grasp of the domain pain | Built around Indian CPSE procurement workflows |
| **Technical Depth** | Smart architecture, not just CRUD | 4-stage AI pipeline with bi+cross encoder |
| **Completeness** | Full product, not a demo | Auth, CRUD, ML, Analytics, Docker, all wired up |
| **Differentiation** | Something no other team will have | Indian material normalizer + domain-specific CNMC codes |
| **Feasibility** | Can actually be built in 36 hours | Parallel streams, reusable components, open-source stack |
| **Scalability** | Goes beyond the hackathon | ERP integration roadmap, multi-tenant design |

---

## Part 2 — Detailed Technical Guide

### 2.1 Technology Choices and Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend Framework** | FastAPI (Python) | Async, auto-documentation, type-safe, native Python ML ecosystem |
| **Database** | PostgreSQL 15 | JSON support, full-text search, reliable, free |
| **ORM** | SQLAlchemy 2.0 | Modern async, Alembic migrations, clean separation |
| **API Schema** | Pydantic V2 | Validation, serialization, works with FastAPI natively |
| **Auth** | JWT (python-jose) + bcrypt (passlib) | Stateless, standard, no session headaches |
| **ML — Bi-Encoder** | sentence-transformers / all-MiniLM-L6-v2 | Fast (50ms per query), 384-dim embeddings, great quality |
| **ML — Cross-Encoder** | cross-encoder/ms-marco-MiniLM-L-6-v2 | Accurate re-ranking, trained on MS MARCO |
| **Fuzzy Matching** | RapidFuzz 3.x | Python fuzzy matching, faster than fuzzywuzzy |
| **Frontend Framework** | React 18 + TypeScript | Type safety, huge ecosystem, industry standard |
| **UI Framework** | Tailwind CSS 3 | Rapid styling, no custom CSS files, consistent design |
| **State Management** | Zustand | Lightweight (1KB), simple API, perfect for this scale |
| **Charts** | Recharts | React-native, composable, good-looking defaults |
| **Icons** | Lucide React | Consistent, tree-shakeable, modern |
| **Build Tool** | Vite | 10-100x faster than CRA, instant HMR |
| **Containerization** | Docker Compose | One-command deploy, PostgreSQL + Backend + Frontend |
| **Reverse Proxy** | Nginx Alpine | SPA routing, gzip, static caching, /api/ proxying |

### 2.2 Backend Architecture

```
backend/
├── app/
│   ├── main.py                    # FastAPI app, CORS, lifespan, router registration
│   ├── config.py                  # Pydantic Settings (env vars with defaults)
│   ├── database.py                # SQLAlchemy engine, session, Base, init_db()
│   ├── schemas/                   # Pydantic schemas (API contracts)
│   │   ├── user.py                # User, Token, Login
│   │   ├── material.py            # Material CRUD, CNMC, Attribute schemas
│   │   ├── matching.py            # Match proposal, review, dedup, summary
│   │   ├── cnmc.py                # CNMC generation log schemas
│   │   └── analytics.py           # Dashboard stats, quality metrics
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── base.py                # DeclarativeBase, mixins (id, timestamps)
│   │   ├── user.py                # User table
│   │   ├── material.py            # Material, CPSEOrganization, CNMCCode, MaterialAttribute
│   │   ├── matching.py            # MatchProposal (MatchType, MatchStatus, ConfidenceLevel enums)
│   │   └── audit.py               # AuditLog
│   ├── routers/                   # API route handlers
│   │   ├── __init__.py            # Package init
│   │   ├── auth.py                # POST /login, GET /me, password hashing
│   │   ├── materials.py           # CRUD + families list + search
│   │   ├── matching.py            # 4-stage pipeline trigger, proposals, review, dedup
│   │   ├── mapping.py             # CNMC assignment, batch mapping, lookups
│   │   ├── analytics.py           # Dashboard, duplicates, quality, procurement
│   │   └── admin.py               # Org management, seed data, audit, legacy migration
│   ├── services/                  # Business logic layer
│   │   ├── __init__.py
│   │   ├── normalizer.py          # Indian industrial term normalization
│   │   ├── matching_engine.py     # 4-stage pipeline orchestration
│   │   ├── cnmc_generator.py      # Semantic hash → CNMC code
│   │   └── classifier.py          # Match classification (EXACT/NEAR_DUPLICATE/etc.)
│   └── ml/                        # ML components
│       ├── __init__.py
│       ├── embeddings.py          # Bi-encoder wrapper + TF-IDF fallback
│       └── reranker.py            # Cross-encoder wrapper + heuristic fallback
├── scripts/
│   └── seed_data.py               # 40 realistic sample materials across CPSEs
├── requirements.txt
├── Dockerfile
└── .env.example
```

### 2.3 Database Schema

```sql
-- Users table
users (id, email, hashed_password, full_name, role, is_active, created_at)

-- CPSE Organizations
cpse_organizations (id, name, short_code, is_active, created_at)

-- Materials (master catalog)
materials (
    id, cpse_organization_id, cpse_material_code,
    description, family, sub_family, material_type,
    grade, standard_code, dimensions, unit_of_measure,
    is_duplicate, cnmc_code_id, created_at, updated_at
)

-- CNMC Codes (unified codes)
cnmc_codes (
    id, code, segment, hash_value,
    description, family, standard_code, grade,
    dimensions, is_active, created_at, updated_at
)

-- Match Proposals
match_proposals (
    id, source_material_id, target_material_id,
    match_type (EXACT/NEAR_DUPLICATE/EQUIVALENT/PARTIAL),
    status (PENDING/APPROVED/REJECTED/MERGED),
    confidence (HIGH/MEDIUM/LOW),
    lexical_score, semantic_score, numeric_score, combined_score,
    proposed_cnmc_code_id, review_notes,
    reviewed_by_id, reviewed_at, created_at
)

-- Audit Logs
audit_logs (id, action, entity_type, entity_id, user_id, details, created_at)
```

### 2.4 Frontend Architecture

```
frontend/
├── src/
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Router setup, protected routes, sidebar
│   ├── index.css                  # Tailwind directives, custom animations
│   ├── vite-env.d.ts
│   ├── store/
│   │   └── index.ts               # Zustand store (auth, materials, matching, dashboard, orgs)
│   ├── components/
│   │   ├── Sidebar.tsx            # Navigation sidebar with icons
│   │   ├── Loading.tsx            # Spinner component
│   │   ├── PageHeader.tsx         # Reusable page header
│   │   └── StatCard.tsx           # KPI stat card
│   └── pages/
│       ├── LoginPage.tsx          # JWT login form
│       ├── DashboardPage.tsx      # KPIs, charts, recent activity
│       ├── MaterialsPage.tsx      # Material list, filters, search
│       ├── MatchingPage.tsx       # CPSE selector → trigger pipeline → results
│       ├── ReviewsPage.tsx        # Approval queue with approve/reject
│       ├── AnalyticsPage.tsx      # Charts: match distribution, AI performance, trends
│       └── AdminPage.tsx          # Org management, seed data, migration
├── public/
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
└── index.html
```

### 2.5 API Endpoint Reference

All endpoints prefixed with `/api/v1`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** |
| POST | `/auth/login` | JWT login, returns access token |
| GET | `/auth/me` | Get current user info |
| **Materials** |
| GET | `/materials` | List materials (paginated, filterable) |
| POST | `/materials` | Create new material entry |
| GET | `/materials/{id}` | Get single material |
| GET | `/materials/families` | List 14 material families |
| **Matching** |
| POST | `/matching/run` | Trigger 4-stage matching pipeline |
| POST | `/matching/match` | Match a single material against a target CPSE |
| GET | `/matching/proposals` | List match proposals (filterable by status) |
| POST | `/matching/review` | Approve/reject a match proposal |
| POST | `/matching/detect-duplicates` | Find duplicates within a single CPSE |
| GET | `/matching/summary` | Matching statistics |
| **CNMC Mapping** |
| POST | `/mapping/material/{id}/cnmc` | Assign CNMC code to a material |
| POST | `/mapping/cnmc/batch` | Batch CNMC assignment |
| GET | `/mapping/cnmc/{code}` | Look up CNMC code details |
| GET | `/mapping/cpse/{cpse_code}/{material_code}` | Map CPSE-specific code → CNMC |
| **Analytics** |
| GET | `/analytics/dashboard` | Dashboard KPIs and stats |
| GET | `/analytics/duplicates` | Duplicate detection stats |
| GET | `/analytics/quality` | AI matching quality metrics |
| GET | `/analytics/procurement/consolidate` | Procurement consolidation opportunities |
| **Admin** |
| POST | `/admin/organizations` | Add CPSE organization |
| GET | `/admin/organizations` | List all organizations |
| PUT | `/admin/organizations/{id}` | Update organization |
| POST | `/admin/seed-demo` | Generate 40 demo materials |
| GET | `/admin/audit-log` | System audit trail |
| POST | `/admin/migrate/legacy` | Bulk import from legacy format |

### 2.6 AI Pipeline — Implementation Details

#### Stage 1: Normalizer (`services/normalizer.py`)

```python
class IndianMaterialNormalizer:
    ABBREVIATIONS = {
        "ms": "mild steel", "ss": "stainless steel", "cu": "copper",
        "al": "aluminum", "pmp": "pump", "hyd": "hydraulic",
        "el": "electrical", "cab": "cable", "plt": "plate",
        "brg": "bearing", "gasket": "gasket", "bolt": "bolt",
        "nut": "nut", "wel": "weld", "pipe": "pipe",
        "mm": "millimeter", "sqmm": "square millimeter",
        "lpm": "liters per minute", "bar": "bar pressure",
        "kg": "kilogram", "ton": "tonne", "nos": "number",
        "is": "IS", "astm": "ASTM", "bis": "BIS",
    }

    GRADE_MAPPINGS = {
        "IS2062": "IS 2062 Gr B",
        "250": "IS 2062 Gr B",
        "316": "AISI 316",
        "304": "AISI 304",
    }

    def normalize(self, raw_text: str) -> str:
        # 1. Lowercase, strip
        # 2. Tokenize, expand abbreviations
        # 3. Map grade codes → standard notation
        # 4. Standardize unit formats
        # 5. Reconstruct clean string
```

#### Stage 2: Matching Engine (`services/matching_engine.py`)

```python
async def run_pipeline(self, source_id: int, target_cpse_id: int) -> MatchSummary:
    # Load source material
    # Get all candidates from target CPSE
    # Stage 2a: Lexical (30%) via RapidFuzz
    # Stage 2b: Semantic (40%) via embeddings cosine similarity
    # Stage 2c: Numeric (30%) via regex dimension matching
    # Combine weighted scores
    # Filter threshold > 40
    # Stage 3: Cross-Encoder rerank top 20
    # Stage 4: Classify + confidence
    # Save MatchProposal records
    # Return summary
```

#### Stage 3: Reranker (`ml/reranker.py`)

```python
class MatchReranker:
    model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

    def rerank(self, query: str, candidates: list[str], top_k=5):
        pairs = [(query, c) for c in candidates]
        scores = self.model.predict(pairs)
        ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
        return ranked[:top_k]
```

#### Stage 4: Classifier (`services/classifier.py`)

```python
def classify_match(self, score: float, lexical: float, semantic: float, numeric: float) -> tuple:
    if score >= 90 and numeric >= 85:
        return MatchType.EXACT, Confidence.HIGH
    elif score >= 75:
        return MatchType.NEAR_DUPLICATE, Confidence.HIGH
    elif score >= 55:
        return MatchType.EQUIVALENT, Confidence.MEDIUM
    else:
        return MatchType.PARTIAL, Confidence.LOW
```

### 2.7 CNMC Code Generation

Format: `CNMC-{SEGMENT}-{HASH}`

- **SEGMENT:** 2-letter family code (FA, PT, VF, EL, BE, HL, IN, SS, WE, SP, PC, CH, PK, MX)
- **HASH:** 6-char semantic hash derived from normalized description + family

```python
def generate_cnmc(description: str, family: str) -> str:
    # Hash the normalized description
    # Deterministic: same input → same code
    # Format: CNMC-FA-4A2B9C
```

### 2.8 Frontend State Management (Zustand)

```typescript
interface AppState {
  // Auth
  token: string | null;
  user: User | null;
  login: (email, password) => Promise<void>;
  logout: () => void;

  // Materials
  materials: Material[];
  fetchMaterials: () => Promise<void>;
  createMaterial: (data) => Promise<void>;

  // Matching
  proposals: MatchProposal[];
  triggerMatching: (sourceId, targetCpseId) => Promise<void>;
  reviewProposal: (id, action) => Promise<void>;

  // Dashboard
  stats: DashboardStats;
  fetchDashboard: () => Promise<void>;

  // Organizations
  organizations: CPSEOrganization[];
  addOrganization: (data) => Promise<void>;
  seedDemoData: () => Promise<void>;
}
```

### 2.9 Docker Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Host Machine                       │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Nginx     │  │  Backend   │  │  PostgreSQL   │  │
│  │  :3000     │──│  :8000     │──│  :5432        │  │
│  │  (SPA +   │  │  (FastAPI) │  │  (Database)   │  │
│  │   proxy)   │  │            │  │               │  │
│  └────────────┘  └────────────┘  └───────────────┘  │
│         │              │                  │          │
│         └──────────────┴──────────────────┘          │
│                    Docker Network                    │
└──────────────────────────────────────────────────────┘

Volumes:
  postgres_data → Persistent database
  model_cache   → Pre-downloaded ML models (saves time)
```

### 2.10 Security & Authentication

- JWT tokens with 30-minute expiry
- bcrypt password hashing (cost factor 12)
- Protected routes on frontend (redirect to login)
- Bearer token in Authorization header
- CORS restricted to frontend origin
- SQL injection prevention via SQLAlchemy ORM
- Input validation via Pydantic schemas

---

## Part 3 — Research, Datasets & Reusable Codebases

### 3.1 ML Models (Free, Open-Source)

| Model | Purpose | Source | Size | Speed |
|-------|---------|--------|------|-------|
| `all-MiniLM-L6-v2` | Bi-encoder embeddings (semantic similarity) | [HuggingFace](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) | 80MB | ~50ms/query |
| `cross-encoder/ms-marco-MiniLM-L-6-v2` | Re-ranking (pairwise scoring) | [HuggingFace](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2) | 100MB | ~200ms/pair |
| `tf-idf` (sklearn) | Lexical fallback | Built-in scikit-learn | N/A | Instant |

**How to use:**
```python
# Install
pip install sentence-transformers

# Bi-encoder
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(["mild steel plate 10mm", "MS plate thickness 10"])
similarity = util.cos_sim(embeddings[0], embeddings[1])

# Cross-encoder
from sentence_transformers import CrossEncoder
model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
score = model.predict([("mild steel plate 10mm", "MS plate thickness 10")])
```

### 3.2 Fuzzy Matching

| Library | Purpose | Source | Speed |
|---------|---------|--------|-------|
| RapidFuzz | Fuzzy string matching (C++ backend) | [GitHub](https://github.com/maxbachmann/RapidFuzz) | 100x faster than fuzzywuzzy |
| python-Levenshtein | Edit distance | [PyPI](https://pypi.org/project/python-Levenshtein/) | Fast |

```python
from rapidfuzz import fuzz
score = fuzz.ratio("mild steel plate", "m.s. plate")  # → 65
score = fuzz.token_sort_ratio("MS PLATE 10MM", "10mm plate MS")  # → 92
```

### 3.3 Datasets (For Training / Validation)

| Dataset | Purpose | Source |
|---------|---------|--------|
| MS MARCO | Cross-encoder training data (already fine-tuned model uses this) | [Microsoft](https://microsoft.github.io/msmarco/) |
| SNLI / MultiNLI | Natural language inference for embedding models | [HuggingFace](https://huggingface.co/datasets/snli) |
| IS Codes Reference | Indian Standard material specifications | [BIS官网](https://bis.gov.in/) (manual reference) |
| CPSE Procurement Data | Real material codes (would need MoPNG access for production) | CPSE portals |

### 3.4 Reusable Codebases & Libraries

| Component | What to Reuse | Source |
|-----------|--------------|--------|
| **Sentence Transformers** | Embedding models + utilities | [SBERT.Net](https://www.sbert.net/) |
| **Cross-Encoder** | Re-ranking pipeline | [SBERT Cross-Encoder](https://www.sbert.net/docs/usage/cross-encoder.html) |
| **FastAPI boilerplate** | Auth, CRUD, pagination | [FastAPI Official Template](https://github.com/tiangolo/full-stack-fastapi-postgresql) |
| **React Admin Template** | Dashboard layout, tables, forms | [MUI Dashboard](https://github.com/mui/material-ui) |
| **Recharts** | Charting library | [Recharts](https://recharts.org/) |
| **Tailwind UI** | Component patterns | [Tailwind UI](https://tailwindui.com/) (free patterns) |
| **Docker Compose template** | Multi-service setup | [Compose Spec](https://docs.docker.com/compose/) |

### 3.5 Indian Industrial Reference Data

| Resource | What It Contains | How We Use It |
|----------|-----------------|---------------|
| IS Codes Handbook | 18,000+ Indian Standards (IS 2062, IS 5504, etc.) | Normalizer abbreviation mapping |
| CPSE Annual Reports | Procurement data, material codes | Demo data generation |
| DGS&D Rate Contracts | Common item descriptions | Validation set for matching |
| CGEA (Central Government E-Marketplace) | Item master data | Reference for grading |

### 3.6 Open-Source Alternatives We Evaluated

| Tool | Why We Didn't Choose It | Notes |
|------|------------------------|-------|
| Elasticsearch | Overkill for 10K-100K items; our pipeline handles scale | Good for production scale > 1M items |
| spaCy | Good for NER but less domain-specific | Could replace normalizer for general NLP |
| OpenAI Embeddings API | Requires API key, costs money, sends data externally | We need offline/air-gapped deployment |
| Redis | Adds complexity; not needed at demo scale | Good for caching at production |
| Neo4j | Graph DB for knowledge graph (Phase 2) | Overkill for Phase 1 |

---

## Part 4 — Week-by-Week Execution Plan

### Sprint 0: Preparation (Before Hackathon Starts)

**Day -2:**
- [x] Clone repository, set up dev environment
- [x] Create project structure
- [x] Write all backend models and schemas
- [x] Write all frontend pages (static)
- [x] Generate architecture diagram

**Day -1:**
- [x] Write all routers (endpoints)
- [x] Write all services (business logic)
- [x] Write ML components (embeddings, reranker)
- [x] Write Docker Compose + Dockerfiles
- [x] Write seed data script

### Day 1 — Backend Core (Parallel Tracks)

**Track A: Database + Auth (2 devs)**
```
Priority 1:
  [x] models/base.py — Base class, mixins
  [x] models/user.py — User table
  [x] models/material.py — Material, CPSEOrg, CNMC, Attribute tables
  [x] models/matching.py — MatchProposal with enums
  [x] models/audit.py — AuditLog
  [x] routers/auth.py — Login, get_current_user, password hashing
  [x] config.py — Settings with env var defaults
  [x] database.py — Engine, session, init_db()

Priority 2:
  [x] routers/materials.py — CRUD, families, search
  [x] routers/admin.py — Org management, seed data, audit
  [x] seed_data.py — 40 sample materials
```

**Track B: AI Pipeline (2 devs)**
```
Priority 1:
  [x] ml/embeddings.py — Bi-encoder + cosine similarity + TF-IDF fallback
  [x] ml/reranker.py — Cross-encoder + heuristic fallback
  [x] services/normalizer.py — Indian industrial abbreviations, grade mappings

Priority 2:
  [x] services/matching_engine.py — run_pipeline(), _candidate_selection()
  [x] services/cnmc_generator.py — Semantic hash → CNMC code
  [x] services/classifier.py — Match type + confidence classification
  [x] routers/matching.py — Pipeline trigger, proposals, review, dedup
```

**Track C: Frontend Shell (1 dev)**
```
Priority 1:
  [x] package.json + dependencies
  [x] vite.config.ts + tsconfig
  [x] tailwind.config.js + index.css
  [x] main.tsx + App.tsx with routing
  [x] Sidebar component
  [x] store/index.ts — Zustand with all slices

Priority 2:
  [x] LoginPage.tsx
  [x] DashboardPage.tsx (KPI cards)
```

**Milestone: Backend running on :8000, Frontend on :3000**

### Day 2 — Frontend Pages + Integration

**Track A: Feature Pages (2 devs)**
```
Priority 1:
  [x] MaterialsPage.tsx — List, filters, search, create
  [x] MatchingPage.tsx — CPSE selector, trigger, results display
  [x] ReviewsPage.tsx — Approval queue, approve/reject

Priority 2:
  [x] AnalyticsPage.tsx — Charts (pie, bar, line)
  [x] AdminPage.tsx — Org management, seed data, audit log
```

**Track B: API Integration (1 dev)**
```
Priority 1:
  [x] Wire all pages to Zustand store
  [x] Axios interceptor for JWT
  [x] Error handling + loading states
  [x] API service functions

Priority 2:
  [ ] Toast notifications
  [ ] Form validation
  [ ] Responsive design tweaks
```

**Milestone: Full-stack app working end-to-end**

### Day 3 — Docker + Polish + PPT

**Track A: Docker + Testing (1 dev)**
```
Priority 1:
  [x] docker-compose.yml (backend, postgres, frontend)
  [x] backend/Dockerfile
  [x] frontend/Dockerfile + nginx.conf
  [ ] Test docker-compose up --build
  [ ] Verify all services start correctly
  [ ] Test database migrations (init_db)
```

**Track B: Polish + Demo (1 dev)**
```
Priority 1:
  [ ] UI polish (transitions, hover effects, loading skeletons)
  [ ] Error states and empty states
  [ ] Mobile responsive check
  [ ] Demo data verification (40 materials across 5 CPSEs)

Priority 2:
  [ ] Run full demo flow: login → seed data → match → review → CNMC
  [ ] Screenshot demo screenshots
  [ ] Record demo video
```

**Track C: PPT + Documentation (1 dev)**
```
Priority 1:
  [x] docs/ppt-content.md — 16 slides with speaker notes
  [ ] Create actual PPTX from ppt-content.md
  [ ] Add screenshots to slides
  [ ] Architecture diagram PNG

Priority 2:
  [x] README.md — Complete documentation
  [ ] Update README with final screenshots
  [ ] Write demo script
```

**Milestone: Docker-compatible, demo-ready, PPT complete**

---

## Part 5 — Docker & Deployment

### 5.1 Quick Start (Development)

```bash
# 1. Clone and navigate
cd sih-2026-material-harmonization

# 2. Start everything
docker-compose up --build

# 3. Access
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
# Database:  localhost:5432 (postgres/postgres)
```

### 5.2 Production Deployment

```bash
# 1. Environment variables
cp .env.example .env
# Edit .env with production values

# 2. Build and start
docker-compose -f docker-compose.prod.yml up -d

# 3. Seed data (one-time)
curl -X POST http://localhost:8000/api/v1/admin/seed-demo \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 5.3 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql://postgres:postgres@postgres:5432/nummf | PostgreSQL connection |
| SECRET_KEY | (auto-generated) | JWT signing key |
| ALGORITHM | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | 30 | Token expiry |
| DEBUG | true | Enable debug mode |
| APP_NAME | NUMMF | Application name |
| VERSION | 1.0.0 | Application version |

---

## Appendix A: Common Pitfalls & Solutions

| Problem | Solution |
|---------|----------|
| sentence-transformers download fails | Pre-cache in Docker build, use model_cache volume |
| Cross-encoder too slow for 1000+ candidates | Bi-encoder filters to top 50 before cross-encoder |
| React router + Nginx 404 | `try_files $uri $uri/ /index.html` in nginx.conf |
| CORS errors | Verify backend CORS allows frontend origin |
| JWT expiry during demo | Set long expiry during development, or use refresh tokens |
| PostgreSQL connection refused | Ensure postgres healthcheck passes before backend starts |
| ML models not loading | Check model_cache volume, verify internet during build |

---

## Appendix B: Demo Script (5-Minute Presentation)

1. **Open browser** → http://localhost:3000 → Login page (0:00-0:15)
2. **Login** → admin@nummf.gov.in / admin123 → Dashboard (0:15-0:30)
3. **Click "Materials"** → Show material list, explain "different codes for same thing" (0:30-0:45)
4. **Click "Matching"** → Select IOCL → NTPC → Click "Run AI Pipeline" → Show 4-stage animation (0:45-1:30)
5. **Show match results** → 94% match score, proposed CNMC code (1:30-2:00)
6. **Click "Reviews"** → Show approval queue → Approve a match (2:00-2:30)
7. **Click "Analytics"** → Show charts: match distribution, quality metrics, savings estimate (2:30-3:00)
8. **Click "Admin"** → Show seed data, add new CPSE organization (3:00-3:15)
9. **Explain architecture** → Show architecture.png diagram (3:15-3:30)
10. **Impact statement** → "One nation, one material code. ₹25L savings per CPSE." (3:30-3:45)
11. **Q&A** → Technical deep-dive on AI pipeline (3:45-5:00)

---

## Appendix C: Resources & References

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Docs](https://docs.sqlalchemy.org/en/20/)
- [Sentence-Transformers Docs](https://www.sbert.net/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

### Datasets & Models
- [all-MiniLM-L6-v2 on HuggingFace](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [ms-marco-MiniLM-L-6-v2 on HuggingFace](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2)
- [MS MARCO Dataset](https://microsoft.github.io/msmarco/)
- [SNLI Dataset](https://huggingface.co/datasets/snli)
- [BIS IS Codes](https://bis.gov.in/)

### Tools & Libraries
- [RapidFuzz](https://github.com/maxbachmann/RapidFuzz)
- [Recharts](https://recharts.org/)
- [Zustand](https://docs.pmnd.rs/zustand)
- [Lucide Icons](https://lucide.dev/)
- [Vite](https://vitejs.dev/)

### Related Projects
- [FastAPI Full-Stack Template](https://github.com/tiangolo/full-stack-fastapi-postgresql)
- [Material Master Data Management](https://en.wikipedia.org/wiki/Material_master)
- [Procurement Harmonization EU](https://ec.europa.eu/growth/single-market/public-procurement_en)

---

*Built for SIH 2026 · NUMMF · One Nation, One Material Code*
