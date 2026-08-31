# NUMMF Demo Guide

## How to Run the Demo

### Quick Start (30 seconds)

```bash
cd frontend
npm install
npm run dev
```

Then open browser:
- **Normal mode:** `http://localhost:5173` (needs backend at port 8000)
- **Demo mode:** `http://localhost:5173/?demo` (no backend needed — all data is client-side)

### Demo Mode Login

Any username/password works in demo mode. Click **"Start Demo Mode"** on the login page.

## What Works in Demo Mode

### 1. Dashboard (Instant, animated)
- 72 materials across 5 CPSEs (IOCL, NTPC, SAIL, CIL, HEC)
- Animated KPI counters
- Family distribution bar chart
- Matching status overview
- Real data fetched on first load

### 2. Materials Explorer
- 72 curated materials across 14 families
- Search by description or code
- Filter by family
- Sortable table with pagination
- Shows CNMC codes where assigned

### 3. AI Matching
- **Run Pipeline button** — select two CPSEs, animated 4-stage pipeline with progress bar
- Pre-computed 49 match proposals across CPSEs
- Score breakdown: Lexical (30%) + Semantic (40%) + Numeric (30%)
- Match types: EXACT, NEAR_DUPLICATE, EQUIVALENT, PARTIAL
- Approve/Reject with one click

### 4. Review Queue
- All proposals shown with filter tabs (Pending/Approved/Rejected/All)
- Animated status badges
- One-click approve/reject

### 5. Analytics
- Matching distribution pie chart
- AI performance bar chart
- Data quality metrics (94% completeness, 72% CNMC coverage)
- Estimated savings: ₹25 Lakhs per CPSE

### 6. Admin
- View all 5 CPSE organizations
- Add new organization
- Demo data already loaded

## Data Summary

| Metric | Value |
|--------|-------|
| Total Materials | 72 |
| CPSE Organizations | 5 |
| Material Families | 14 |
| Match Proposals | 49 |
| Exact Matches | 24 |
| Near Duplicates | 8 |
| Equivalent | 12 |
| Partial | 5 |
| Data Quality | 94% |
| CNMC Coverage | 72% |

## Video Demo Script (5 min)

1. **Open** `http://localhost:5173/?demo`
2. **Click** "Start Demo Mode" — animated login
3. **Dashboard** — show 72 materials, 5 CPSEs, animated charts
4. **Materials** — search "hex bolt", show cross-CPSE data
5. **Matching** — run pipeline between IOCL and NTPC (animated 4-stage progress)
6. **Review Queue** — show proposals with scores, approve a few
7. **Analytics** — show ₹25L savings, quality metrics
8. **Switch to `/demo` route** for the full cinematic intro

## Screenshot Tips for PPT

- Dashboard: Shows the full overview with glassmorphism UI
- Matching: Shows the AI pipeline in action
- Review Queue: Shows human-in-the-loop approval
- Analytics: Shows savings and quality metrics

## Tech Stack (Real Working Code)

- Backend: FastAPI + SQLAlchemy 2.0 + Pydantic V2
- AI: sentence-transformers + RapidFuzz + scikit-learn
- Frontend: React 18 + TypeScript + Tailwind + Zustand + Recharts
- ML Models: all-MiniLM-L6-v2 + ms-marco-MiniLM-L-6-v2
- Deployment: Docker Compose

## Files Created

```
frontend/src/
├── App.tsx                           # Updated with demo route
├── store/index.ts                    # Demo-aware store
├── components/
│   ├── DemoShowcase.tsx              # Cinematic auto-play demo
│   └── Sidebar.tsx                   # Navigation
├── pages/
│   ├── LoginPage.tsx                 # Animated login + demo button
│   ├── DashboardPage.tsx             # KPI cards + charts
│   ├── MaterialsPage.tsx             # Table with search/filter
│   ├── MatchingPage.tsx              # AI pipeline + proposals
│   ├── ReviewsPage.tsx               # Review queue
│   ├── AnalyticsPage.tsx             # Charts + metrics
│   └── AdminPage.tsx                 # CPSE management
└── demo/
    └── data.ts                       # All mock data
```
