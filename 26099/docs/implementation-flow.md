# NUMMF — Implementation Flow (PS 26099)

![Implementation Flow](implementation-flow.png)

> Renders on GitHub / Mermaid Live. PNG + SVG regenerate with:
> `npx -y @mermaid-js/mermaid-cli@11 -i implementation-flow.mmd -o implementation-flow.png -b white -s 3`

## Stage notes

| Stage | What runs | Where in code |
|---|---|---|
| Inputs | SAP/ERP export, CSV upload, manual entry | `app/routers/materials.py`, `app/routers/admin.py` |
| Preprocess | lowercase, IS-code strip, grade + UOM normalization, abbreviation expansion | `app/services/normalizer.py` |
| Lexical Feat. | RapidFuzz `token_sort_ratio` (weight 0.30) | `app/services/matching_engine.py` |
| Semantic Feat. | bi-encoder `all-MiniLM-L6-v2` cosine similarity (weight 0.40) | `app/ml/embeddings.py` |
| Attribute Feat. | family / material type / UOM compatibility (weight 0.30) | `app/services/matching_engine.py` |
| Fusion + Score | blended score, threshold 0.65, top-K shortlist | `_candidate_selection` |
| Cross-Encoder Rerank | `ms-marco-MiniLM-L-6-v2`, sigmoid-normalized, blended 0.6/0.4 | `app/ml/reranker.py` |
| Match State | exact ≥0.85, near-duplicate ≥0.78, equivalent ≥0.65, else partial | `_classify_match_type` |
| Decision | routes to auto-propose / steward review / merge-reject / re-evaluate loop | `app/routers/matching.py` |
| CNMC Minting | `CNMC-{SEGMENT}-{MD5[:6]}` semantic hash | `app/services/cnmc_generator.py` |
| Legacy Code Mapping | golden record + per-CPSE legacy code mapping, migration export | `app/routers/mapping.py` |
| Audit Log + Report | every AI suggestion and human action logged | `app/models/audit.py` |
| Runtime / UI | FastAPI service, React dashboard, analytics + review queue | `app/routers/analytics.py`, `frontend/` |

## Source

```mermaid
flowchart TD
    subgraph INPUTS[" Inputs "]
        I1["SAP Export"]
        I2["ERP / CSV"]
        I3["Manual Entry"]
    end

    I1 --> PRE
    I2 --> PRE
    I3 --> PRE

    PRE["Preprocess<br/>clean · expand · UOM"]

    subgraph FEATURES[" Features "]
        F1["Lexical Feat."]
        F2["Semantic Feat."]
        F3["Attribute Feat."]
    end

    PRE --> F1
    PRE --> F2
    PRE --> F3

    F1 --> FUSE["Fusion + Score"]
    F2 --> FUSE
    F3 --> FUSE

    FUSE --> RERANK["Cross-Encoder Rerank"]
    RERANK --> STATE["Match State"]
    STATE --> DEC{"Decision"}

    DEC -->|"Exact ≥0.85"| B1["Auto-Propose"]
    DEC -->|"Near dup ≥0.78"| B2["Steward Review"]
    DEC -->|"Equivalent ≥0.65"| B3["Merge / Reject"]
    DEC -->|"Low conf"| B4["Re-evaluate"]
    B4 --> FUSE

    B1 --> MINT["CNMC Minting"]
    B2 --> MINT
    B3 --> MAPPING

    MINT --> MAPPING["Legacy Code Mapping"]
    MAPPING --> LOGS["Audit Log + Report"]
    LOGS --> RUNTIME["FastAPI Runtime"]
    RUNTIME --> UI["Dashboard / API"]
    UI --> USER["CPSE Procurement"]

    classDef input fill:#cfe2f3,stroke:#6fa8dc,color:#1f2937;
    classDef pre fill:#e8dfc8,stroke:#bfa76a,color:#1f2937;
    classDef feat fill:#d9ead3,stroke:#8fbc8f,color:#1f2937;
    classDef score fill:#f4cccc,stroke:#cc6666,color:#1f2937;
    classDef dec fill:#b4a7d6,stroke:#7b68a6,color:#1f2937;
    classDef act fill:#e6e6e6,stroke:#999999,color:#1f2937;

    class I1,I2,I3 input;
    class PRE pre;
    class F1,F2,F3 feat;
    class FUSE,RERANK,STATE score;
    class DEC dec;
    class B1,B2,B3,B4,MINT,MAPPING,LOGS,RUNTIME,UI,USER act;

    style INPUTS fill:#f4f4f4,stroke:#d0d0d0,color:#1f2937;
    style FEATURES fill:#f4f4f4,stroke:#d0d0d0,color:#1f2937;
```
