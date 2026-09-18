# Match (`/match`)

## What It Does
Similarity matching results table. Columns: match ID, material A, material B, match type (Exact/Partial/Similar), score, algorithm, status, date. Similarity breakdown (structural, semantic, behavioral scores). Algorithm performance metrics (precision, recall, F1).

## Data Flow
- `generateMockMatches(count)` in `MatchPage.tsx` creates entries with random data
- Algorithm metrics: hardcoded arrays of `{name, precision, recall, f1}`
- No backend API calls

## What Is Real
- Nothing. Zero API calls.
- Algorithm names are real concepts (Exact Match, Fuzzy Match, Similarity Hash, ML Embedding)

## What Is Fake
| Data | How |
|------|-----|
| Match IDs | Sequential: MATCH-0001 through MATCH-0025 |
| Material IDs | Random from predefined prefixes (MAL, C2, DDOS, DNS, etc.) |
| Match type | Determined by score: ≥0.85 = Exact, ≥0.5 = Partial, else Similar |
| Match score | Random between 0.05-0.98 |
| Algorithm | Random from 4 predefined names |
| Status | First 8 verified, next 8 pending, rest rejected |
| Dates | Random within last 90 days |
| Similarity breakdown | Random scores for structural/semantic/behavioral |
| Precision/Recall/F1 | Hardcoded per algorithm |

## Verdict
**0% real data.** Entirely procedural generation. No backend connection. This is a concept page for the material matching feature described in PS-26145.
