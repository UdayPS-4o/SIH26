# Samdarshi — Implementation Flow (PS 26096)

![Implementation Flow](implementation-flow.png)

> Renders on GitHub / Mermaid Live. PNG + SVG regenerate with:
> `npx -y @mermaid-js/mermaid-cli@11 -i implementation-flow.mmd -o implementation-flow.png -b white -s 3`

## Stage notes

| Stage | What runs | Reference |
|---|---|---|
| Inputs | kiosk touch query, mic voice query, scanned manuscript page | Master Plan §5.1 |
| Preprocess | Whisper.cpp STT, language/script detection (EN/HI/MR/SA), deskew + denoise + binarize for scans | Master Plan §5.2 step 1, §5.3 |
| Semantic Feat. | sentence-transformers embeddings, pgvector similarity search | Master Plan §5.2 step 2 |
| Keyword Feat. | Meilisearch full-text search for exact terms and names | Master Plan §5.2 step 2 |
| OCR / Archive Feat. | Tesseract 5 + EasyOCR text, layout and metadata, chunked and embedded back into the index | Master Plan §5.3 |
| Hybrid Fusion + Score | Reciprocal Rank Fusion over semantic + keyword hits, top-10 | Master Plan §5.2 step 2 |
| Cross-Encoder Rerank | top-10 → top-5, relevance filter > 0.7 | Master Plan §5.2 step 3 |
| Evidence State | how much verified archive evidence backs the query | — |
| Decision | grounded → cited answer; partial → clarify + offer sources; no evidence → curator escalation instead of a guess; low confidence → query expansion loop | anti-hallucination guarantee |
| LLM + Citation Engine | Llama 3 8B via Ollama, temperature 0.3, streaming, citations formatted as `[Book, p.NN]` | Master Plan §5.2 steps 4-6 |
| Logs + Provenance | query analytics, source links back to the original scan | Master Plan §5.2 step 6 |
| Edge Runtime | on-prem AI server + Raspberry Pi kiosk, fully offline | Master Plan §4 |
| Voice / Kiosk UI | Coqui / Indic TTS narration, touch UI, waveform + playback controls | Master Plan §5.4 |

## Source

```mermaid
flowchart TD
    subgraph INPUTS[" Inputs "]
        I1["Touch Query"]
        I2["Voice / Mic"]
        I3["Scanned Page"]
    end

    I1 --> PRE
    I2 --> PRE
    I3 --> PRE

    PRE["Preprocess<br/>STT · lang detect · deskew"]

    subgraph FEATURES[" Features "]
        F1["Semantic Feat."]
        F2["Keyword Feat."]
        F3["OCR / Archive Feat."]
    end

    PRE --> F1
    PRE --> F2
    PRE --> F3

    F1 --> FUSE["Hybrid Fusion + Score"]
    F2 --> FUSE
    F3 --> FUSE

    FUSE --> RERANK["Cross-Encoder Rerank"]
    RERANK --> STATE["Evidence State"]
    STATE --> DEC{"Decision"}

    DEC -->|"Grounded ≥0.7"| B1["Cited Answer"]
    DEC -->|"Partial"| B2["Clarify + Sources"]
    DEC -->|"No evidence"| B3["Escalate → Curator"]
    DEC -->|"Low conf"| B4["Re-query Expand"]
    B4 --> FUSE

    B1 --> GEN["LLM + Citation Engine"]
    B2 --> GEN
    B3 --> LOGS

    GEN --> LOGS["Logs + Provenance"]
    LOGS --> RUNTIME["Edge Runtime"]
    RUNTIME --> VOICE["Voice / Kiosk UI"]
    VOICE --> USER["Visitor / Researcher"]

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
    class B1,B2,B3,B4,GEN,LOGS,RUNTIME,VOICE,USER act;

    style INPUTS fill:#f4f4f4,stroke:#d0d0d0,color:#1f2937;
    style FEATURES fill:#f4f4f4,stroke:#d0d0d0,color:#1f2937;
```
