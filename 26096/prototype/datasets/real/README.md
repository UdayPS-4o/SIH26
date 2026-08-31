# Real Ambedkar Dataset - Samdarshi Prototype

This folder contains **real public domain content** about Dr. B.R. Ambedkar for testing the SIH 2026 Samdarshi prototype during development.

---

## What's in this folder?

### Downloaded Files (9 files, ~2.1 MB total)

1. **`wikipedia_ambedkar.txt`** (200 KB) - Comprehensive biographical article from Wikipedia
2. **`wikipedia_ambedkar.html`** (142 KB) - Raw Wikipedia wikitext/markup for the same article
3. **`wikipedia_annihilation_of_caste.txt`** (19 KB) - Summary of Ambedkar's famous 1936 speech
4. **`wikipedia_castes_in_india.txt`** (18 KB) - Summary of Ambedkar's 1916 paper
5. **`wikipedia_buddhism_in_india.txt`** (99 KB) - Dalit Buddhist movement article
6. **`wikipedia_constitution_of_india.txt`** (197 KB) - Constitution of India article
7. **`gutenberg_63231_castes_in_india.txt`** (77 KB) - Full text of "Castes In India"
8. **`gutenberg_63132_problem_of_rupee.txt`** (1 MB) - Full text of "The Problem of the Rupee"
9. **`gutenberg_63132_problem_of_rupee.epub`** (384 KB) - EPUB version of "The Problem of the Rupee"

---

## How were these files obtained?

### Project Gutenberg (Primary Source)
- **URL:** https://www.gutenberg.org
- **Method:** Direct download of plain text and EPUB files
- **Works downloaded:**
  - eBook #63231: "Castes In India" by B.R. Ambedkar
  - eBook #63132: "The Problem of the Rupee, Its Origin and Its Solution"
- **Why Project Gutenberg?**
  - Reliable, legal public domain content
  - Well-formatted text files
  - No rate limiting or access restrictions

### Wikipedia Articles
- **URLs:**
  - https://en.wikipedia.org/wiki/B._R._Ambedkar
  - https://en.wikipedia.org/wiki/Annihilation_of_Caste
  - https://en.wikipedia.org/wiki/Castes_in_India%3A_Their_Mechanism,_Genesis_and_Development
  - https://en.wikipedia.org/wiki/Dalit_Buddhist_movement
  - https://en.wikipedia.org/wiki/Constitution_of_India
- **Method:** Extracted text via jina.ai summarizer (r.jina.ai/http://...)
- **Format:** Plain text (cleaned of HTML/markup)

### Attempted but Failed Sources
- **Internet Archive:** https://archive.org/details/@ambedkar
  - API returned metadata but direct downloads returned 404
  - Use Project Gutenberg or search Internet Archive manually for alternatives
- **BAWS (ambedkar.org):** Site unreachable (connection timeout)
- **Constituent Assembly Debates (cad.clrc.nic.in):** Site unreachable

---

## Legal Status

### Project Gutenberg Content
- **License:** Public Domain (USA)
- **Status:** Works published before 1929, copyright has expired
- **Usage:** Free for any purpose including commercial use

### Wikipedia Content
- **License:** Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)
- **URL:** https://creativecommons.org/licenses/by-sa/3.0/
- **Requirements:**
  - Attribution to Wikipedia authors
  - Share-alike (derivative works must use same license)
- **Usage:** Free for educational, research, and prototype development

### Important Notes
- This content is for **prototype development and testing only**
- For production deployment, you may need:
  - Proper attribution
  - Verification of local copyright laws
  - Consideration of specific licensing requirements
- All files here are under 1 GB total, well within reasonable limits

---

## Using This Data in the Prototype

### Recommended Chunking Strategy

#### For Plain Text Files (.txt)
```python
# Example chunking approach
def chunk_text(text, chunk_size=1000, overlap=200):
    """
    Split text into overlapping chunks for embedding
    - chunk_size: ~1000 characters (~250 words) per chunk
    - overlap: 200 characters to preserve context
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks
```

#### For Wikipedia Articles
- Use section headers as natural chunk boundaries
- Each section becomes a separate chunk
- Smaller chunks (500-800 chars) for detailed sections
- Larger chunks (1000-1500 chars) for overview sections

#### For EPUB Files
- Extract text using ebook libraries (ebooklib, epub2txt)
- Apply same chunking strategy as plain text
- Preserve chapter/part information as metadata

### Recommended Embedding Strategy

#### 1. Text Embedding
```python
# Example using sentence-transformers
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings for chunks
embeddings = model.encode(chunks)
```

#### 2. Metadata to Track
For each chunk, store:
- **source_file:** Which file the chunk came from
- **source_section:** Wikipedia section or book chapter
- **chunk_id:** Sequential ID within the file
- **char_range:** (start_char, end_char) in original text
- **language:** English
- **topic:** Biographical, Constitutional, Economic, Social Reform, etc.

#### 3. Index Structure
```
{
  "chunk_id": "amb_001",
  "text": "Ambedkar was born on April 14, 1891...",
  "embedding": [0.123, -0.456, ...],
  "metadata": {
    "source": "wikipedia_ambedkar.txt",
    "section": "Early life and education",
    "char_range": [0, 500],
    "language": "en",
    "topic": "biography"
  }
}
```

### Testing the Prototype

#### Sample Queries to Test
1. **Biographical queries:**
   - "When was Dr. Ambedkar born?"
   - "Where did he study?"
   - "What were his major contributions?"

2. **Constitutional queries:**
   - "What was Dr. Ambedkar's role in drafting the Constitution?"
   - "What is the Preamble to the Indian Constitution?"

3. **Social reform queries:**
   - "What is Annihilation of Caste?"
   - "Why did Ambedkar convert to Buddhism?"
   - "What did he say about the caste system?"

4. **Economic queries:**
   - "What was The Problem of the Rupee about?"
   - "What were Ambedkar's economic theories?"

#### Evaluation Metrics
- **Retrieval accuracy:** Are relevant chunks returned?
- **Response quality:** Are answers accurate and contextual?
- **Performance:** Embedding and retrieval speed
- **Coverage:** How well does the dataset cover different aspects of Ambedkar's life?

---

## Extending the Dataset

### Additional Sources to Try
1. **Internet Archive:** Search manually at https://archive.org for "Ambedkar"
   - Many BAWS volumes available
   - Look for: "BAWS Vol 1", "BAWS Vol 2", etc.

2. **Constituent Assembly Debates:** https://cad.clrc.nic.in/
   - Official parliamentary debates
   - Contains Ambedkar's speeches during constitution drafting

3. **Books by Ambedkar:**
   - "Annihilation of Caste" (full text - not just Wikipedia summary)
   - "The Buddha and His Dhamma"
   - "Riddles in Hinduism"
   - "Who Were the Shudras?"

4. **Speeches and Interviews:**
   - Look for audio transcripts
   - Check official government archives

### Legal Considerations for Expansion
- Works published before 1927 are likely public domain (95+ years)
- Works published 1927-1977: Copyright may have expired (depends on renewal)
- Works published after 1977: Likely still under copyright
- Government documents (like Constituent Assembly Debates): Usually public domain

### Storage Budget
- **Current usage:** ~2.1 MB
- **Budget:** 1 GB
- **Remaining:** ~998 MB for additional content
- **Recommendation:**
  - Add 5-10 more books (~50-100 MB each)
  - Add 10-20 Wikipedia articles (~20 KB each)
  - Add Constituent Assembly Debates (select speeches only, ~5-10 MB each)
  - Total target: 200-300 MB

---

## File Organization

```
real/
├── README.md (this file)
├── MANIFEST.md (detailed file listing and metadata)
├── wikipedia_ambedkar.txt
├── wikipedia_ambedkar.html
├── wikipedia_annihilation_of_caste.txt
├── wikipedia_castes_in_india.txt
├── wikipedia_buddhism_in_india.txt
├── wikipedia_constitution_of_india.txt
├── gutenberg_63231_castes_in_india.txt
├── gutenberg_63132_problem_of_rupee.txt
└── gutenberg_63132_problem_of_rupee.epub
```

---

## Quick Start

```bash
# View file sizes
ls -lh

# Count total words
wc -w *.txt

# Search for a topic
grep -i "constitution" *.txt | head -20

# Extract text from EPUB
# (Requires ebooklib or similar tool)
```

---

## Contact & Attribution

**Dataset created for:** SIH 2026 - Samdarshi Prototype
**Date:** 2026-08-30
**Content sources:**
- Project Gutenberg (https://www.gutenberg.org)
- Wikipedia (https://en.wikipedia.org)
- License: See MANIFEST.md for detailed copyright information

**Note:** This is a prototype dataset for development purposes only. For production use, verify licensing and provide proper attribution.

---

*Last updated: 2026-08-30*
