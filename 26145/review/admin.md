# Administration (`/admin`)

## What It Does
Three admin panels: User management table (5 users with roles, status, last login, sessions), Pipeline throughput metrics (8 pipeline nodes with CPU, memory, latency, throughput), Model information (3 ML models with accuracy, version, training date, status).

## Data Flow
- `USER_DATA`: hardcoded array of 5 user objects
- `PIPELINE_DATA`: hardcoded array of 8 pipeline node objects
- `MODEL_DATA`: hardcoded array of 3 model objects
- No backend API calls at all

## What Is Real
- Model names and concepts match the actual backend (`IsolationForest`, `LogisticRegression`, `Rule Engine` from `models.py`)
- Pipeline stage names match the actual backend pipeline (Ingest → Feature Extractor → Anomaly Detector → Classifier → Alert Correlator → Output)
- The backend DOES have these components — this page just doesn't query them

## What Is Fake
| Data | How |
|------|-----|
| User accounts | Hardcoded: admin, analyst_01/02, viewer_01/02 |
| User roles/statuses | Static: active, inactive, locked |
| Last login times | Computed as `Date.now() - offset` |
| Active sessions | Static counts |
| Pipeline throughput | Static strings: "~10K flows/s", "~9.8K flows/s" |
| CPU percentages | Static: 15%, 45%, 72%, etc. |
| Memory percentages | Static: 32%, 58%, 64%, etc. |
| Latency | Static: 2ms, 5ms, 12ms, 3ms |
| Model accuracy | Hardcoded: 94.2%, 91.8%, 97.1% |
| Model versions | Static strings |
| Training dates | Static dates in August 2026 |
| Training samples | Static: 50,000 |

## Verdict
**~15% real.** The model names and pipeline stage names are accurate to the backend, but all metrics are hardcoded. No API calls to fetch live pipeline or user data.
