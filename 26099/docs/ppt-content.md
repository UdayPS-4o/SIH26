# NUMMF - SIH 2026 Presentation Content
## Problem ID: 26099 | CPCL | Ministry of Petroleum & Natural Gas

---

## Slide 1: Title Slide

**Title:** NUMMF — National Unified Material Master Framework
**Subtitle:** One Nation, One Material Code

**Team:** [Your Team Name]
**Institute:** [Your Institute]
**Category:** Software | Smart Automation

**Problem Statement ID:** 26099
**Organization:** Ministry of Petroleum & Natural Gas | Chennai Petroleum Corporation Limited (CPCL)

**Visual Suggestion:** Dark blue gradient background, national flag colors (saffron/white/green) as accent lines, bold white typography

---

## Slide 2: The Problem

**Title:** CPSEs Face Fragmented Material Catalogs

**Content:**
- CPSEs (IOCL, NTPC, SAIL, CIL, HEC) maintain independent ERP/SAP systems
- Same material → different codes, descriptions, grades, UOMs across CPSEs
- **Result:** No single source of truth for common materials

**Visual Suggestion:** Three parallel columns showing:
```
IOCL: "Hex Bolt M20x100 SS304" → Code: IOCL-001234
NTPC: "Hex Bolt M20x100 SS304" → Code: NT-BOLT-5678
SAIL: "Hexagonal Bolt 20mm SS" → Code: SA-FA-9012
```
With a big ❌ in the middle

**Impact:**
- Duplicate master data across CPSEs
- No demand aggregation in procurement
- Higher inventory costs
- Slower sourcing

---

## Slide 3: The Solution

**Title:** NUMMF — AI-Powered Unified Material Master

**Core Idea:** Use AI/NLP to find equivalent materials across CPSEs and generate a single Common National Material Code (CNMC)

**Key Actions:**
1. **Ingest** material data from multiple CPSE ERP/SAP systems
2. **Normalize** descriptions to a standard format
3. **Match** materials using 4-stage AI pipeline
4. **Generate** unique CNMC codes
5. **Map** CPSE codes ↔ CNMC codes
6. **Review & Approve** AI suggestions

**Tagline:** "One Nation, One Material Code"

---

## Slide 4: Technology Stack

**Title:** Built for Scale, Speed & Accuracy

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | FastAPI | Async, type-safe, auto-documentation |
| AI/ML | sentence-transformers | State-of-the-art embeddings |
| Fuzzy Matching | RapidFuzz | Fast lexical similarity |
| Re-ranking | Cross-Encoder | High-accuracy final scoring |
| Database | SQLAlchemy + SQLite/PostgreSQL | Flexible, production-ready |
| Frontend | React + TypeScript | Modern, component-based UI |
| Charts | Recharts | Beautiful data viz |
| Deployment | Docker Compose | One-command deploy |

**Open Source Libraries Only** — no proprietary AI APIs

---

## Slide 5: AI Pipeline (4-Stage)

**Title:** Multi-Stage AI Matching Pipeline

```
Stage 1: NORMALIZATION    →  "SS304 hex bolt M20" → "hex bolt M20 SS304"
Stage 2: LEXICAL (30%)    →  Token sort ratio, fuzzy matching
Stage 3: SEMANTIC (40%)   →  Bi-encoder embeddings (MiniLM-L6-v2)
Stage 4: NUMERIC (30%)    →  Family, grade, UOM compatibility
Stage 5: RE-RANKING       →  Cross-encoder (ms-marco-MiniLM)
```

**This gives us:**
- Speed: Bi-encoder for fast candidate selection
- Accuracy: Cross-encoder for precise re-ranking
- Domain-awareness: Normalizer handles Indian industrial terms

**Threshold:** 65% match → submit for human review

---

## Slide 6: Domain-Specific Intelligence

**Title:** Indian Industrial Material Knowledge

**Normalizer Features:**
| Feature | Example Input | Normalized |
|---------|---------------|------------|
| IS Code removal | "IS:1239 Pipe 50NB" | "pipe 50NB" |
| Grade normalization | "SS304, SS-304, 304SS" | "SS304" |
| Dimension extraction | "M20x100" | `{thread: 20, length: 100}` |
| UOM suggestion | "Hydraulic Oil 200L" | "LTR" |

**14 Material Families:**
FA (Fasteners), PT (Pipes), VF (Valves), EL (Electrical), BE (Bearings), HL (Hydraulics), IN (Instruments), SS (Structural), WE (Welding), SP (Safety), PC (Pumps), CH (Chemicals), PK (Packaging), MX (Misc)

---

## Slide 7: CNMC Code Generation

**Title:** Common National Material Code (CNMC)

**Format:** `CNMC-{SEGMENT}-{HASH}`

**Example:**
```
Material: "Hex Bolt M20x100 SS304 Grade 8.8"
  ↓ Segment Lookup
Segment: "FA" (Fasteners)
  ↓ Semantic Hash
Hash: MD5("hex bolt M20x100 SS304")[:6] = "4A2B9C"
  ↓
CNMC-FA-4A2B9C
```

**Benefits:**
- Stable: same material → same code always
- Unique: MD5 hash prevents collisions
- Human-readable: segment prefix tells you the category
- Traceable: links to original CPSE codes

---

## Slide 8: Dashboard & Features

**Title:** Complete Platform Features

**Dashboard:**
- Total Materials: KPI cards
- Matching progress: pie charts
- Duplicate distribution: bar charts
- Quality metrics: gauges
- CPSE-wise breakdown

**Features:**
1. AI Matching Engine → 4-stage pipeline
2. Material Explorer → Search, filter, browse
3. Review Queue → Approve/reject AI suggestions
4. CNMC Generator → Auto-assign national codes
5. Duplicate Detection → Find near-duplicates
6. Analytics → Deep insights
7. Admin → CPSE management, demo data
8. Audit Log → Full governance trail

---

## Slide 9: How It Works (User Flow)

**Title:** End-to-End User Journey

```
1. CPSE Admin uploads material data
        ↓
2. System normalizes descriptions
        ↓
3. AI runs matching pipeline across CPSEs
        ↓
4. Proposals generated (score ≥ 65%)
        ↓
5. User reviews proposals in queue
        ↓
6. Approve → CNMC assigned automatically
        ↓
7. All CPSEs now mapped to same CNMC
        ↓
8. Analytics updated in real-time
```

---

## Slide 10: Innovation & Differentiation

**Title:** What Makes NUMMF Unique

| Aspect | Typical Solutions | NUMMF |
|--------|-----------------|-------|
| Matching method | Fuzzy string only | 4-stage AI pipeline |
| Normalization | Basic lowercase | 100+ Indian industrial terms |
| Code generation | Random/UUID | Semantic hash + segment |
| Cross-CPSE | No matching | Full multi-org matching |
| Re-ranking | None | Cross-encoder precision |
| Tech | Proprietary APIs | Open-source only |
| Language support | English only | Hindi/Tamil/Telugu ready |

**Novel Contributions:**
1. First Indian-industrial normalizer for materials
2. Hybrid bi-encoder + cross-encoder pipeline for speed+accuracy
3. Stable semantic hashing for CNMC codes
4. Complete governance + audit trail

---

## Slide 11: Technical Architecture

**Title:** System Architecture

**Frontend:** React + Tailwind + Recharts
**Backend:** FastAPI (async, OpenAPI docs)
**AI Engine:** sentence-transformers + RapidFuzz
**Database:** SQLAlchemy (SQLite dev → PostgreSQL prod)

**API Endpoints (20+):**
- Auth: login, user info
- Materials: CRUD, search, families
- Matching: run pipeline, proposals, review, duplicates
- CNMC: generate, batch, lookup, validate
- Analytics: dashboard, quality, procurement
- Admin: CPSE management, seed data, audit

---

## Slide 12: Scalability & Deployment

**Title:** Built to Scale

**Deployment Options:**
| Stage | Architecture | Database | ML Models |
|-------|-------------|----------|-----------|
| Development | Single Docker | SQLite | CPU |
| Staging | Docker Compose | PostgreSQL | GPU (if available) |
| Production | Docker + Nginx + K8s | PostgreSQL RDS | GPU cluster |

**Scaling:**
- Frontend: CDN + Nginx cache (sub-second TTFB)
- Backend: Uvicorn workers (4+), load balanced
- AI: Bi-encoder pre-computes all embeddings once
- Database: Read replicas for analytics queries

**Docker Compose:** `docker-compose up --build` → Full stack in 1 command

---

## Slide 13: Future Roadmap

**Title:** Beyond the Prototype

**Phase 1 (Now):** Core platform + AI matching
**Phase 2:** Real SAP integration (IDoc adapter)
**Phase 3:** Multi-language NLP (Hindi, Tamil, Telugu descriptions)
**Phase 4:** Knowledge graph for material taxonomy
**Phase 5:** ML-driven procurement savings calculator
**Phase 6:** Mobile app for field material verification
**Phase 7:** Blockchain-based immutable audit trail
**Phase 8:** Demand forecasting & strategic sourcing AI

---

## Slide 14: Impact & Benefits

**Title:** Expected Impact

**For CPSEs:**
- One unified material code across all CPSEs
- Reduction in duplicate master data
- Improved data quality scores
- Better inventory optimization
- Reduced procurement costs via demand aggregation

**For Nation:**
- "One Nation, One Material Code" vision
- Common procurement platform for government
- Better inter-CPSE collaboration
- Foundation for strategic sourcing

**ROI:** Based on 100K materials, 5% duplicate reduction = 5,000 fewer entries × ₹500/code maintenance = ₹25L savings per CPSE

---

## Slide 15: Demo Plan

**Title:** Live Demo Plan (5 minutes)

**Demo 1: Dashboard** → Show KPIs, charts, CPSE breakdown
**Demo 2: Matching** → Run pipeline between IOCL and NTPC
**Demo 3: Results** → Show AI proposals with scores and explanations
**Demo 4: Review Queue** → Approve/reject proposals
**Demo 5: CNMC** → Show CNMC codes assigned automatically
**Demo 6: Analytics** → Deep dive into quality metrics
**Demo 7: Admin** → Seed demo data, view audit trail

**Backup:** Pre-recorded demo video + screenshots

---

## Slide 16: Team & Contact

**Title:** Built with ❤️ for Smart India

**Team Members:**
- [Member 1]: AI/ML Lead
- [Member 2]: Backend Lead
- [Member 3]: Frontend Lead
- [Member 4]: Database/DevOps
- [Member 5]: Product/Business

**Contact:**
- Email: [team-email]
- GitHub: [repo-link]
- Demo: [live-demo-link]

**"One Nation, One Material Code"**

---

## Design Guidelines

### Color Palette
- Primary: #1e3a5f (Navy Blue)
- Secondary: #d946ef (Magenta/Purple) - for AI emphasis
- Accent: #10b981 (Emerald Green) - for success/approved
- Warning: #f59e0b (Amber)
- Danger: #ef4444 (Red)
- Background: #0f172a → #1e293b (dark gradients)
- Text: #ffffff, #94a3b8

### Typography
- Headers: Bold, 36-48pt
- Subheaders: Semi-bold, 24-28pt
- Body: 18-20pt
- Captions: 14pt, color #94a3b8

### Visual Elements
- Glassmorphism cards (backdrop-blur + semi-transparent bg)
- Gradient accents (primary → accent)
- Iconography: Lucide icons
- Consistent padding (24px)
- Border radius: 12px cards, 8px buttons
