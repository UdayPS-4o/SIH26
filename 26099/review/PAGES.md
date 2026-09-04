# NUMMF (26099) — Page-by-Page Review

Setup used for this review:
- Backend: FastAPI + SQLite, run locally on `http://localhost:8001` (port 8000 was occupied by an unrelated process on this machine, so it was moved — see `frontend/vite.config.ts` proxy target).
- Frontend: Vite dev server on `http://localhost:5173`.
- Seeded an `admin` user (`admin` / `admin123`) and demo CPSE/material data via `backend/scripts/create_admin.py` (new script added for this review — no bootstrap admin/seed path existed previously, since `POST /api/v1/admin/*` routes all require an existing admin user).
- All screenshots below are full-page captures at 1440×900, saved in this folder (`01_dashboard.png` … `10_registry.png`).

The UI currently runs largely on **frontend-side demo/mock data** (organizations, matches, audit entries shown are richer than the actual seeded DB rows), independent of whether the backend calls succeed — so it renders fully even without a real corpus of matched data.

---

## 01. Dashboard — `/dashboard` ([01_dashboard.png](01_dashboard.png))
Executive landing page ("Harmonization Dashboard"). Shows top-line KPIs (connected CPSEs, total materials, duplicates detected, estimated procurement savings), a 4-stage pipeline visual (Ingest & Validate → Normalization → AI Matching → CNMC Code Gen), per-CPSE connector cards (IOCL/NTPC/SAIL/CIL) with import counts and duplicate rates, and a live "Pipeline Audit Log" side panel streaming system events. Entry point for the "Run AI Pipeline" action (top right).

## 02. Material Explorer — `/materials` ([02_materials.png](02_materials.png))
Searchable/filterable catalogue of ingested CPSE materials ("Indexed CPSE Catalog"). Table columns: CPSE source, internal material code, technical description, material family, applicable technical standard (IS/ASTM), unified CNMC code, and harmonization status (Harmonized / Duplicate / Active). Filters by CPSE org and status; free-text search by description, code, standard, or CNMC.

## 03. AI Matching Matrix — `/matching` ([03_matching.png](03_matching.png))
Displays candidate material-pair matches produced by the AI pipeline (bi-encoder semantic + lexical + numeric scoring, per the README's 4-stage design). Each card shows the two CPSE material records being compared, a combined similarity score with a Sem/Lex/Num breakdown, confidence bucket (HIGH/MEDIUM/LOW), match type (EXACT/NEAR_DUPLICATE/EQUIVALENT), the proposed CNMC code, and Approve/Reject actions. Filterable by confidence level.

## 04. Review Queue — `/reviews` ([04_reviews.png](04_reviews.png))
Human-in-the-loop queue for approving/rejecting AI-proposed material matches before they're finalized into the CNMC registry. Shows pending/approved/rejected/all counts, side-by-side comparison of the two CPSE material masters per proposal, proposed CNMC code, and batch approve/reject controls with select-all.

## 05. Analytics & Savings — `/analytics` ([05_analytics.png](05_analytics.png))
Aggregate metrics dashboard: harmonization coverage %, redundancy reduction %, estimated annual procurement savings, and count of unified CNMC codes. Includes charts for material volume by industrial family, AI matching confidence distribution, per-CPSE ingestion/duplicate-rate breakdown, and a "Projected Savings Model" panel estimating bulk-rate synergy across CPSEs.

## 06. CPSE Connectors / Admin — `/admin` ([06_admin.png](06_admin.png))
Administration page for two things: (1) calibrating the AI scoring pipeline's weight formula (Semantic/Lexical/Numeric sliders, must total 100%), and (2) registering new CPSE ERP connectors (org name, short code, ERP system type) to onboard additional PSUs into the platform. Also has a light/dark theme switcher.

## 07. Upload CSV Data — `/upload` ([07_upload.png](07_upload.png))
CSV ingestion tool for bringing a CPSE's material master data into NUMMF. Lets the user pick a target CPSE organization, load one of several bundled sample datasets (ONGC/SAIL/NTPC CSVs) for a quick demo, or drag-and-drop/upload a real CSV (expects Material Code, Description, UOM, Organization columns).

## 08. Normalization — `/normalize` ([08_normalize.png](08_normalize.png))
Interactive demo of the description-normalization engine (spaCy EntityRuler + regex + MRO abbreviation dictionary). User selects a raw material record, sees the raw ERP description and detected abbreviations (e.g. "BRG"→"BEARING", "ID"→"BORE (INNER DIAMETER)"), then runs normalization to see the structured, CNMC-standard output.

## 09. Audit Trail — `/audit` ([09_audit.png](09_audit.png))
Immutable, filterable log of all system and user actions (imports, normalization runs, AI match runs, approvals, rejections, system events), with timestamp, action type, organization/user, detail text, and associated CNMC code where applicable. Supports CSV export and search.

## 10. CNMC Registry — `/registry` ([10_registry.png](10_registry.png))
Browsable directory of finalized Common National Material Codes (the "golden records"). Left panel lists CNMC codes with family/category filters and search; right panel shows the selected code's standard description, UNSPSC code, applicable Indian Standard, unit of measure, estimated annual savings, and the list of legacy CPSE material codes mapped to it.
