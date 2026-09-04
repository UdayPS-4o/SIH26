# CodeOne - National Unified Material Master Framework
## SIH 2026 | Problem ID: 26099

**"One Nation, One Material Code"**

AI-Driven Standardization and Harmonization of Material Codes Across CPSEs

Ministry of Petroleum & Natural Gas | CPCL | Software | Smart Automation

---

## Table of Contents

1. [Problem Statement & Solution](#problem-statement)
2. [Differentiators](#differentiators)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [AI Pipeline](#ai-pipeline)
6. [APIs](#apis)
7. [Frontend](#frontend)
8. [Database Schema](#database-schema)
9. [Build Timeline](#build-timeline)
10. [How to Run](#how-to-run)

---

## Problem Statement

Central Public Sector Enterprises (CPSEs) operating in Oil & Gas, Power, Steel, Mining and Heavy Engineering assign **different material codes, descriptions, specifications and classifications** to the same materials. This causes:

- Duplication of material masters
- Inconsistent descriptions
- Fragmented procurement data
- Higher inventory levels
- No collaborative procurement opportunity

### Expected Solution

An AI-powered platform that:
1. AI-based matching of descriptions across CPSEs
2. Duplicate/near-duplicate detection
3. Automated standardization of descriptions
4. CNMC (Common National Material Code) generation
5. CPSE code mapping & migration support
6. Dashboard for analytics and duplicate detection
7. Audit trail and governance
8. SAP/ERP integration capability

---

## Differentiators (Why We Win)

### 1. Multi-Stage AI Pipeline (Unique)
Unlike simple fuzzy matching, our 4-stage pipeline:
```
Lexical (30%) → Semantic (40%) → Numeric (30%) → Cross-Encoder Reranker
```

| Feature | Simple Solutions | CodeOne |
|---------|-----------------|-------|
| Lexical matching | 1 algorithm | RapidFuzz token_sort + partial |
| Semantic understanding | Word count only | sentence-transformers embeddings |
| Multi-modal scoring | Description only | Desc + grade + UOM + family |
| Re-ranking | None | Cross-encoder re-ranking |
| Normalization | None | Domain-specific normalizer |

### 2. Domain-Specific Normalizer
- Removes Indian industrial jargon (IS codes, grade notations)
- Normalizes "304SS", "SS304", "SS-304" → consistent representation
- Handles dimension extraction ("M20x100" → `{thread_size: 20}`)
- 100+ Indian industrial grade mappings

### 3. CNMC Code Generation with Semantic Hashing
```
CNMC-{SEGMENT}-{MD5_HASH_6CHARS}
```
- Stable codes (same material → same code across CPSEs)
- Human-readable segment prefix (EL, BE, PT, FA...)
- Globally unique via MD5 hash

### 4. Multi-Model Architecture
```
Bi-Encoder (all-MiniLM-L6-v2)  →  Fast candidate selection
Cross-Encoder (ms-marco-MiniLM) →  Accurate re-ranking
```
- 100x faster than full cross-encoder for large catalogs
- Same accuracy as state-of-the-art models

### 5. Complete SIH-Ready Stack
| Component | Technology |
|-----------|-----------|
| Backend | FastAPI + SQLAlchemy |
| AI/ML | sentence-transformers + RapidFuzz |
| Database | SQLite → PostgreSQL (production) |
| Frontend | React + TypeScript + Tailwind |
| Charts | Recharts |
| Auth | JWT-based |
| Containerization | Docker + Docker Compose |

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CodeOne - SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────────────────┐  │
│  │   CPSE-SAP   │    │   CPSE-ERP       │    │   CPSE-Manual/CSV        │  │
│  │   System 1   │    │   System 2       │    │   System 3               │  │
│  └──────┬───────┘    └────────┬─────────┘    └───────────┬───────────────┘  │
│         │                    │                          │                   │
│         └────────────────────┼──────────────────────────┘                   │
│                              ▼                                               │
│              ┌─────────────────────────┐                                     │
│              │   Data Ingestion Layer  │                                     │
│              │  • SAP IDoc Adapter     │                                     │
│              │  • REST API Ingestion   │                                     │
│              │  • CSV/Excel Import     │                                     │
│              │  • Normalization Engine │                                     │
│              └────────────┬────────────┘                                     │
│                           ▼                                                  │
│         ┌─────────────────────────────┐                                       │
│         │   FastAPI Backend (Port 8000)│                                       │
│         │  ┌────────────────────────┐  │                                       │
│         │  │ Auth Router (JWT)       │  │                                       │
│         │  ├────────────────────────┤  │                                       │
│         │  │ Materials Router       │  │                                       │
│         │  ├────────────────────────┤  │                                       │
│         │  │ Matching Router        │  │                                       │
│         │  │  ┌──────────────────┐   │  │                                       │
│         │  │  │ AI Matching Engine│   │  │                                       │
│         │  │  │  ┌─────────────┐ │   │  │                                       │
│         │  │  │  │ Stage 1:    │ │   │  │                                       │
│         │  │  │  │ Lexical     │ │   │  │                                       │
│         │  │  │  │ (RapidFuzz) │ │   │  │                                       │
│         │  │  │  ├─────────────┤ │   │  │                                       │
│         │  │  │  │ Stage 2:    │ │   │  │                                       │
│         │  │  │  │ Semantic    │ │   │  │                                       │
│         │  │  │  │ (Embeddings)│ │   │  │                                       │
│         │  │  │  ├─────────────┤ │   │  │                                       │
│         │  │  │  │ Stage 3:    │ │   │  │                                       │
│         │  │  │  │ Numeric     │ │   │  │                                       │
│         │  │  │  │ (Features)  │ │   │  │                                       │
│         │  │  │  ├─────────────┤ │   │  │                                       │
│         │  │  │  │ Stage 4:    │ │   │  │                                       │
│         │  │  │  │ Reranker    │ │   │  │                                       │
│         │  │  │  │ (Cross-Enc) │ │   │  │                                       │
│         │  │  │  └─────────────┘ │   │  │                                       │
│         │  │  └──────────────────┘   │  │                                       │
│         │  ├────────────────────────┤  │                                       │
│         │  │ Mapping Router (CNMC)  │  │                                       │
│         │  ├────────────────────────┤  │                                       │
│         │  │ Analytics Router       │  │                                       │
│         │  └────────────────────────┘  │                                       │
│         └───────────────────────────────┘                                       │
│                            ▲                                                   │
│                            │                                                   │
│              ┌─────────────────────────────┐                                     │
│              │    PostgreSQL / SQLite      │                                     │
│              │  • Materials (normalized)   │                                     │
│              │  • MatchProposals (AI)      │                                     │
│              │  • CNMCCodes (hashed)       │                                     │
│              │  • AuditLogs (traceability) │                                     │
│              │  • Users & Organizations    │                                     │
│              └─────────────────────────────┘                                     │
│                            ▲                                                   │
│                            │                                                   │
│         ┌──────────────────────────────┐                                        │
│         │   React Frontend (Port 3000) │                                        │
│         │  ┌─────────────────────────┐ │                                        │
│         │  │ • Dashboard (KPIs)      │ │                                        │
│         │  │ • Material Explorer     │ │                                        │
│         │  │ • AI Matching Engine    │ │                                        │
│         │  │ • Review Queue           │ │                                        │
│         │  │ • Analytics              │ │                                        │
│         │  │ • Admin (CNMC/CPSE)      │ │                                        │
│         │  └─────────────────────────┘ │                                        │
│         └──────────────────────────────┘                                        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AI Pipeline Architecture

```
Input: "Hex Bolt M20x100 SS304 Grade 8.8"

  ┌──────────────────────────────────────────────────────────────────────────┐
  │                    STAGE 1: DESCRIPTION NORMALIZER                        │
  │                                                                             │
  │  Input: "Hex Bolt M20x100 SS304 Grade 8.8"                                │
  │     ↓                                                                        │
  │  Lowercase → Remove punctuation → Remove stop words → Normalize grades     │
  │     ↓                                                                        │
  │  Output: "hex bolt M20 SS304 8.8"                                           │
  │  Attrs: {thread_size: 20, grade: "8.8"}                                    │
  └────────────────────────────────┬───────────────────────────────────────────┘
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                    STAGE 2: CANDIDATE SELECTION (Lexical + Semantic)      │
  │                                                                             │
  │  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐                  │
  │  │ Lexical     │    │ Semantic     │    │ Numeric      │                  │
  │  │ Score       │    │ Score        │    │ Score        │                  │
  │  │             │    │              │    │              │                  │
  │  │ Token Sort  │    │ Bi-Encoder   │    │ Family match │                  │
  │  │ Ratio       │    │ (MiniLM-L6)  │    │ Grade match  │                  │
  │  │ 30% weight  │    │ 40% weight   │    │ 30% weight   │                  │
  │  └──────┬──────┘    └──────┬───────┘    └──────┬───────┘                  │
  │         │                  │                    │                          │
  │         └──────────────────┼────────────────────┘                          │
  │                            ▼                                                │
  │              Combined Score = 0.3*Lex + 0.4*Sem + 0.3*Num                  │
  │              Threshold: ≥ 0.65                                              │
  │              Top-K candidates selected (e.g., top 10)                       │
  └────────────────────────────────┬───────────────────────────────────────────┘
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                    STAGE 3: CROSS-ENCODER RE-RANKING                       │
  │                                                                             │
  │  Top-K candidates → Cross-Encoder (ms-marco-MiniLM-L-6-v2) → Re-ranked    │
  │                                                                             │
  │  Cross-encoder sees (query, candidate) pairs together → more accurate     │
  └────────────────────────────────┬───────────────────────────────────────────┘
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                    STAGE 4: CLASSIFICATION & OUTPUT                        │
  │                                                                             │
  │  Score ≥ 0.85 → EXACT match (HIGH confidence)                               │
  │  Score ≥ 0.78 → NEAR DUPLICATE (HIGH confidence)                            │
  │  Score ≥ 0.65 → EQUIVALENT (MEDIUM confidence)                              │
  │  Score < 0.65 → PARTIAL (LOW confidence)                                    │
  │                                                                             │
  │  Output: MatchProposal → User Review Queue → Approved/Rejected             │
  └──────────────────────────────────────────────────────────────────────────┘
```

### CNMC Code Generation

```
Material: "Hex Bolt M20x100 SS304 Grade 8.8"
                │
                ▼
  ┌─────────────────────────┐
  │ Segment Lookup          │
  │ "fasteners" → "FA"      │
  └───────────┬─────────────┘
              ▼
  ┌─────────────────────────┐
  │ Semantic Hash           │
  │ MD5(description) =      │
  │ "4a2b9c" → "4A2B9C"     │
  └───────────┬─────────────┘
              ▼
  ┌─────────────────────────┐
  │ Final CNMC Code         │
  │ CNMC-FA-4A2B9C          │
  │                         │
  │ Unique + Stable +       │
  │ Human-readable          │
  └─────────────────────────┘
```

### CNMC Segments

| Segment Code | Category | Examples |
|-------------|----------|---------|
| FA | Fasteners | Bolts, nuts, screws, washers |
| PT | Pipes & Tubes | Seamless pipes, ERW tubes |
| VF | Valves & Fittings | Flanges, elbows, valves |
| EL | Electrical | Cables, switches, motors |
| BE | Bearings | Ball, roller, thrust bearings |
| HL | Hydraulics & Lubricants | Oils, greases, fluids |
| IN | Instruments | Gauges, transmitters, controllers |
| SS | Structural Steel | Angles, channels, plates |
| WE | Welding | Electrodes, wires, fluxes |
| SP | Safety & PPE | Helmets, gloves, masks |
| PC | Pumps & Compressors | Pumps, blowers, fans |
| CH | Chemicals | Acids, solvents, reagents |
| PK | Packaging | Drums, barrels, bags |
| MX | Miscellaneous | Others |

---

## Technology Stack

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | FastAPI | REST API server |
| ORM | SQLAlchemy 2.0 | Database ORM |
| Auth | python-jose (JWT) | Authentication |
| AI/ML | sentence-transformers | Semantic embeddings |
| Fuzzy | RapidFuzz | Lexical matching |
| ML Pipeline | scikit-learn | Numeric features |
| Validation | Pydantic V2 | Request/Response validation |
| Config | pydantic-settings | Environment config |
| Server | Uvicorn | ASGI server |

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 + TypeScript | UI framework |
| Styling | Tailwind CSS v3 | Styling |
| Routing | React Router v6 | Navigation |
| State | Zustand | Global state management |
| Data Fetching | TanStack Query v5 | Server state |
| Charts | Recharts | Data visualization |
| Notifications | React Hot Toast | User feedback |
| Icons | Lucide React | Icon set |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Containerization | Docker + Docker Compose |
| Database (prod) | PostgreSQL |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |
| Deployment | Docker / K8s |

---

## Database Schema

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  CPSEOrganization│     │      Material    │     │    CNMCCode     │
│─────────────────│     │──────────────────│     │─────────────────│
│ id (PK)         │◄────┤ cpse_org_id (FK) │     │ id (PK)         │
│ name            │     │ id (PK)          │────►│ code (UNIQUE)   │
│ short_code      │     │ cpse_material_code│    │ segment         │
│ sector          │     │ description      │     │ family          │
│ sap_client      │     │ family           │     │ description     │
│ contact_email   │     │ sub_family       │     │ sequence        │
│ is_active       │     │ material_type    │     │ status          │
│ created_at      │     │ grade            │     │ created_at      │
└─────────────────┘     │ standard_code    │     └─────────────────┘
                        │ dimensions       │
                        │ uom              │
                        │ is_duplicate     │
                        │ duplicate_of_id  │
                        │ cnmc_id (FK)     │
                        │ confidence_score │
                        │ created_at       │
                        └──────────────────┘

┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   MatchProposal  │     │ MaterialAttr    │     │    AuditLog      │
│──────────────────│     │─────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)         │     │ id (PK)          │
│ source_mat_id(FK)│     │ material_id(FK) │     │ entity_type      │
│ target_mat_id(FK)│     │ key             │     │ entity_id        │
│ semantic_score   │     │ value           │     │ action           │
│ lexical_score    │     │ source          │     │ old_value        │
│ numeric_score    │     │ created_at      │     │ new_value        │
│ reranker_score   │     └─────────────────┘     │ user_id          │
│ overall_score    │                               │ timestamp        │
│ match_type       │                               │ ip_address       │
│ confidence_level │                               └──────────────────┘
│ status           │
│ explanation      │
│ differences      │
│ review_comment   │
│ reviewed_by_id   │
│ created_at       │
│ reviewed_at      │
└──────────────────┘

┌──────────────────────┐
│  CNMCGenerationLog   │
│──────────────────────│
│ id (PK)              │
│ material_id (FK)     │
│ cnmc_code_id (FK)    │
│ generation_method    │
│ generation_params    │
│ created_at           │
└──────────────────────┘
```

---

## Build Timeline (Week-wise)

### Week 1: Backend Foundation (Parallel Streams)

| Days | Task | Files |
|------|------|-------|
| 1-2 | Database models + migrations | material.py, user.py, matching.py, audit.py |
| 1-2 | FastAPI setup + routers | main.py, database.py, config.py |
| 1-2 | Auth system (JWT) | auth.py, user.py |
| 3-4 | AI pipeline (normalizer + embeddings) | normalizer.py, embeddings.py, reranker.py |
| 3-4 | Matching engine | matching_engine.py |
| 3-4 | CNMC generator + classifier | cnmc_generator.py, classifier.py |
| 5-7 | Material + matching + mapping + analytics routers | routers/*.py |
| 5-7 | Schemas + seed data | schemas/*.py, scripts/seed_data.py |

### Week 2: Frontend Foundation (Parallel with Backend)

| Days | Task | Files |
|------|------|-------|
| 1-2 | React + Tailwind + Router setup | package.json, vite.config.ts, tailwind.config.js |
| 1-2 | Auth pages + routing | LoginPage, App.tsx, Sidebar |
| 3-4 | Zustand store + API client | store/index.ts, lib/api.ts |
| 3-4 | Dashboard page with charts | DashboardPage.tsx |
| 5-7 | Materials explorer + Admin page | MaterialsPage, AdminPage |
| 5-7 | Matching page + Review queue | MatchingPage, ReviewsPage |

### Week 3: Integration + Polish

| Days | Task |
|------|------|
| 1-2 | Docker + docker-compose |
| 2-3 | End-to-end testing |
| 3-4 | Demo data script + CI/CD |
| 4-5 | PPT creation + demo preparation |
| 5-7 | Buffer for fixes and edge cases |

---

## Quick Start

### Prerequisites
```bash
Python 3.10+
Node.js 18+
Docker (optional)
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up --build
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login (OAuth2 form)
- `GET /api/v1/auth/me` - Current user info

### Materials
- `GET /api/v1/materials` - List materials (paginated, filterable)
- `POST /api/v1/materials` - Create material
- `GET /api/v1/materials/{id}` - Get single material
- `GET /api/v1/materials/families` - Get all families

### AI Matching
- `POST /api/v1/matching/` - Run matching pipeline
- `GET /api/v1/matching/proposals` - List proposals
- `POST /api/v1/matching/review` - Approve/reject proposal
- `POST /api/v1/matching/detect-duplicates` - Detect duplicates
- `GET /api/v1/matching/summary` - Matching statistics
- `POST /api/v1/matching/match` - Natural language search

### CNMC Mapping
- `POST /api/v1/mapping/material/{id}/cnmc` - Generate CNMC for material
- `POST /api/v1/mapping/cnmc/batch` - Batch CNMC generation
- `GET /api/v1/mapping/cnmc/{code}` - Lookup CNMC code
- `GET /api/v1/mapping/mapping/cpse/{code}` - Get CPSE mapping

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard KPIs
- `GET /api/v1/analytics/duplicates` - Duplicate stats
- `GET /api/v1/analytics/quality` - Data quality metrics

### Admin
- `POST /api/v1/admin/organizations` - Add CPSE
- `GET /api/v1/admin/organizations` - List CPSEs
- `POST /api/v1/admin/seed-demo-data` - Seed demo data

---

## Demo Scenarios

### Scenario 1: Cross-CPSE Matching
```
Input: IOCL Material "Hex Bolt M20x100 SS304 Grade 8.8"
Output: NTPC Material "Hexagonal Bolt M20x100 Stainless Steel 304 Grade 8.8"
Match Score: 94%
Type: EXACT
```

### Scenario 2: Duplicate Detection
```
Within IOCL:
"SAW Pipe API 5L X60" (12" wall 12.7)
"SAW Pipe API 5L X60" (12" wall 12.7)
→ Detected as DUPLICATE (score: 98%)
```

### Scenario 3: CNMC Assignment
```
Material: "Hex Bolt M20x100 SS304"
→ Segment: FA (Fasteners)
→ Hash: MD5("hex bolt M20 SS304")[:6]
→ CNMC: CNMC-FA-A1B2C3
```

---

## Future Extensions

1. **Real SAP Integration** - IDoc/OCI adapters for live SAP ERP
2. **Multi-language Support** - Match across Hindi, Tamil, etc. descriptions
3. **Knowledge Graph** - Material taxonomy with similarity chains
4. **Advanced Analytics** - Procurement savings calculator, demand forecasting
5. **Mobile App** - Field inspector for material verification
6. **Blockchain Audit** - Immutable audit trail for material changes

---

## License

MIT License | Built for SIH 2026
