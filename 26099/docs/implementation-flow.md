# NUMMF — Implementation Flow (PS 26099)

## Slide version (use this one in the PPT)

![Implementation Flow](implementation-flow.png)

Twelve nodes, near-square, readable at slide size. Vector copy: [`implementation-flow.svg`](implementation-flow.svg).

## Stage notes

| Stage | What runs | Where in code |
|---|---|---|
| Inputs | SAP/ERP export, CSV upload, manual entry | `app/routers/materials.py`, `app/routers/admin.py` |
| Normalize | lowercase, IS-code strip, grade + UOM normalization, abbreviation expansion | `app/services/normalizer.py` |
| Lexical 30% | RapidFuzz `token_sort_ratio` | `app/services/matching_engine.py` |
| Semantic 40% | bi-encoder `all-MiniLM-L6-v2` cosine similarity | `app/ml/embeddings.py` |
| Attribute 30% | family / material type / UOM compatibility | `app/services/matching_engine.py` |
| Fusion + rerank | blended score at threshold 0.65, top-K shortlist, then `ms-marco-MiniLM-L-6-v2` cross-encoder (sigmoid-normalized, blended 0.6/0.4) | `_candidate_selection`, `app/ml/reranker.py` |
| Decision | exact >=0.85 auto-propose, near/equivalent >=0.65 to steward review, low confidence loops back for re-evaluation | `app/routers/matching.py` |
| CNMC minting | `CNMC-{SEGMENT}-{MD5[:6]}` semantic hash, plus per-CPSE legacy code mapping and migration export | `app/services/cnmc_generator.py`, `app/routers/mapping.py` |
| Audit / dashboard / ERP API | every AI suggestion and human action logged; analytics and review queue served over FastAPI | `app/models/audit.py`, `app/routers/analytics.py` |

## Detailed version

The full-fidelity chart with every branch broken out lives in [`implementation-flow-detailed.png`](implementation-flow-detailed.png) (source: [`implementation-flow-detailed.mmd`](implementation-flow-detailed.mmd)). It is roughly 1:2 portrait, so it suits an appendix slide or the report rather than a main slide.

## Regenerate

```bash
npx -y @mermaid-js/mermaid-cli@11 -i implementation-flow.mmd -o implementation-flow.png -b white -s 3
```

## Source

```mermaid
flowchart TD
    subgraph INPUTS[" Inputs "]
        direction LR
        I1["SAP export"]
        I2["ERP / CSV upload"]
        I3["Manual entry"]
    end

    PRE["Normalize — clean · expand abbrev · UOM"]

    subgraph FEATURES[" Features "]
        direction LR
        F1["Lexical · RapidFuzz 30%"]
        F2["Semantic · MiniLM 40%"]
        F3["Attribute · family/UOM 30%"]
    end

    I1 --> PRE
    I2 --> PRE
    I3 --> PRE
    PRE --> F1
    PRE --> F2
    PRE --> F3

    F1 --> FUSE["Fusion + cross-encoder rerank"]
    F2 --> FUSE
    F3 --> FUSE

    FUSE --> DEC{"Decision"}
    DEC -->|"Exact ≥0.85"| B1["Auto-propose"]
    DEC -->|"Near / equivalent"| B2["Steward review · human-in-the-loop"]
    DEC -->|"Low conf"| B3["Re-evaluate"]
    B3 --> FUSE

    B1 --> CNMC["CNMC minting + legacy code mapping"]
    B2 --> CNMC
    CNMC --> OUT["Audit log · dashboard · ERP API"]

    classDef input fill:#cfe2f3,stroke:#6fa8dc,color:#1f2937;
    classDef pre fill:#e8dfc8,stroke:#bfa76a,color:#1f2937;
    classDef feat fill:#d9ead3,stroke:#8fbc8f,color:#1f2937;
    classDef score fill:#f4cccc,stroke:#cc6666,color:#1f2937;
    classDef dec fill:#b4a7d6,stroke:#7b68a6,color:#1f2937;
    classDef act fill:#e6e6e6,stroke:#999999,color:#1f2937;

    class I1,I2,I3 input;
    class PRE pre;
    class F1,F2,F3 feat;
    class FUSE score;
    class DEC dec;
    class B1,B2,B3,CNMC,OUT act;

    style INPUTS fill:#f4f4f4,stroke:#d0d0d0,color:#1f2937;
    style FEATURES fill:#f4f4f4,stroke:#d0d0d0,color:#1f2937;
```
