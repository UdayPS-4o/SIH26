# Samdarshi — Implementation Flow (PS 26096)

## Slide version (use this one in the PPT)

![Implementation Flow](implementation-flow.png)

Twelve nodes, near-square, readable at slide size. Vector copy: [`implementation-flow.svg`](implementation-flow.svg).

## Stage notes

| Stage | What runs | Reference |
|---|---|---|
| Inputs | kiosk touch query, mic voice query, scanned manuscript page | Master Plan 5.1 |
| Preprocess | Whisper.cpp STT, language/script detection (EN/HI/MR/SA), deskew + denoise + binarize for scans | Master Plan 5.2 step 1, 5.3 |
| Semantic | sentence-transformers embeddings, pgvector similarity search | Master Plan 5.2 step 2 |
| Keyword | Meilisearch full-text search for exact terms and names | Master Plan 5.2 step 2 |
| OCR text + metadata | Tesseract 5 + EasyOCR output, chunked and embedded back into the index | Master Plan 5.3 |
| RRF fusion + rerank | Reciprocal Rank Fusion over semantic + keyword hits (top-10), cross-encoder to top-5 at relevance > 0.7 | Master Plan 5.2 steps 2-3 |
| Decision | grounded -> cited answer; no evidence -> curator escalation instead of a guess; low confidence -> query expansion loop | anti-hallucination guarantee |
| Llama 3 + citation engine | Llama 3 8B via Ollama, temperature 0.3, streaming, citations formatted as `[Book, p.NN]` | Master Plan 5.2 steps 4-6 |
| TTS / kiosk UI / provenance | Coqui + Indic TTS narration, touch UI with playback controls, query log with source links back to the original scan | Master Plan 5.2 step 6, 5.4 |

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
        I1["Touch query"]
        I2["Voice query · mic"]
        I3["Scanned manuscript"]
    end

    PRE["Preprocess — STT · language detect · deskew"]

    subgraph FEATURES[" Features "]
        direction LR
        F1["Semantic · pgvector"]
        F2["Keyword · Meilisearch"]
        F3["OCR text + metadata"]
    end

    I1 --> PRE
    I2 --> PRE
    I3 --> PRE
    PRE --> F1
    PRE --> F2
    PRE --> F3

    F1 --> FUSE["RRF fusion + cross-encoder rerank"]
    F2 --> FUSE
    F3 --> FUSE

    FUSE --> DEC{"Decision"}
    DEC -->|"Grounded ≥0.7"| B1["Cited answer"]
    DEC -->|"No evidence"| B2["Escalate to curator · no guessing"]
    DEC -->|"Low conf"| B3["Re-query expand"]
    B3 --> FUSE

    B1 --> GEN["Llama 3 + citation engine"]
    B2 --> GEN
    GEN --> OUT["TTS · kiosk UI · provenance log"]

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
    class B1,B2,B3,GEN,OUT act;

    style INPUTS fill:#f4f4f4,stroke:#d0d0d0,color:#1f2937;
    style FEATURES fill:#f4f4f4,stroke:#d0d0d0,color:#1f2937;
```
