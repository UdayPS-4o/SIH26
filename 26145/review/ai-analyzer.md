# AI Analyzer (`/ai-analyzer`)

## What It Does
ML pipeline overview: model cards for IsolationForest, Logistic Regression, and Custom Rule Engine. Feature importance visualization. Inference statistics. Model comparison table (accuracy, latency, throughput). Training data info.

## Data Flow
- Model definitions are hardcoded in `AIAnalyzer.tsx` as constant arrays
- Feature importance data: procedurally generated with `generateFeatureData()`
- Inference stats: computed from mock flow counts
- No backend API calls to model endpoints

## What Is Real
- Backend `models.py` exists and contains real `DetectionEnsemble` with IsolationForest, LogisticRegression, and rule-based detection
- Model names match (IsolationForest, LogisticRegression, Rule Engine)
- The backend `/api/models` endpoint may or may not exist (not called by this page)

## What Is Fake
| Data | How |
|------|-----|
| Model accuracy | Hardcoded: 94.2%, 91.8%, 97.1% |
| Model version | Static strings: "1.2.0", "1.1.0", "2.0.0" |
| Training samples | Static: 50,000 |
| Last trained date | Static: 2026-08-15, etc. |
| Feature importance | Procedurally generated bars with random heights |
| Throughput numbers | Static strings: "~9.5K flows/s" |
| Latency numbers | Static: 12ms, 3ms, 45ms |
| CPU/Memory percentages | Static hardcoded values |

## Verdict
**~20% real.** Model names and concept are real (matching the backend `models.py`), but all metrics, feature importance, and stats are hardcoded or procedurally generated. No API calls to fetch actual model performance.
