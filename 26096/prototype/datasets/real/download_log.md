# Download Log - Real Ambedkar Dataset

**Date:** 2026-08-30
**Purpose:** SIH 2026 Samdarshi Prototype - Real public domain content for development testing
**Target Directory:** `C:\Users\udayps\Desktop\sih\am\prototype\datasets\real\`
**Size Limit:** 1 GB max

---

## Summary

**Total files downloaded:** 9 files
**Total size:** 2.1 MB
**Sources used:**
- Project Gutenberg (primary - reliable, legal public domain)
- Wikipedia (CC BY-SA 3.0)
- jina.ai (Wikipedia text extraction)

**Sources attempted but failed:**
- Internet Archive (404 errors on direct downloads)
- ambedkar.org (server unreachable)
- cad.clrc.nic.in (server unreachable)

---

## Download Attempts

### 1. Project Gutenberg

#### eBook #63231 - "Castes In India" by B.R. Ambedkar
- **Status:** SUCCESS
- **URL:** https://www.gutenberg.org/files/63231/63231-0.txt
- **File:** `gutenberg_63231_castes_in_india.txt`
- **Size:** 77,419 bytes (~77 KB)
- **Content type:** Plain text
- **Language:** English
- **License:** Public Domain (USA)
- **Notes:** Paper presented in 1916, published 1917

#### eBook #63132 - "The Problem of the Rupee" by B.R. Ambedkar
- **Status:** SUCCESS
- **URL:** https://www.gutenberg.org/files/63132/63132-0.txt
- **File:** `gutenberg_63132_problem_of_rupee.txt`
- **Size:** 1,026,280 bytes (~1 MB)
- **Content type:** Plain text
- **Language:** English
- **License:** Public Domain (USA)
- **Notes:** 1923 thesis on Indian currency

#### eBook #63132 - EPUB format
- **Status:** SUCCESS
- **URL:** https://www.gutenberg.org/ebooks/63132.epub.noimages
- **File:** `gutenberg_63132_problem_of_rupee.epub`
- **Size:** 393,660 bytes (~384 KB)
- **Content type:** EPUB ebook
- **Language:** English
- **License:** Public Domain (USA)

---

### 2. Wikipedia Articles

#### B.R. Ambedkar article (text version)
- **Status:** SUCCESS
- **URL:** https://r.jina.ai/http://en.wikipedia.org/wiki/B._R._Ambedkar
- **File:** `wikipedia_ambedkar.txt`
- **Size:** 200,359 bytes (~200 KB)
- **Content type:** Plain text
- **Language:** English
- **License:** CC BY-SA 3.0

#### B.R. Ambedkar article (raw wikitext)
- **Status:** SUCCESS
- **URL:** https://en.wikipedia.org/wiki/B._R._Ambedkar?action=raw
- **File:** `wikipedia_ambedkar.html`
- **Size:** 142,196 bytes (~142 KB)
- **Content type:** HTML/Markup
- **Language:** English
- **License:** CC BY-SA 3.0

#### Annihilation of Caste article
- **Status:** SUCCESS
- **URL:** https://r.jina.ai/http://en.wikipedia.org/wiki/Annihilation_of_Caste
- **File:** `wikipedia_annihilation_of_caste.txt`
- **Size:** 18,943 bytes (~19 KB)
- **Content type:** Plain text
- **Language:** English
- **License:** CC BY-SA 3.0

#### Castes in India article
- **Status:** SUCCESS
- **URL:** https://r.jina.ai/http://en.wikipedia.org/wiki/Castes_in_India%3A_Their_Mechanism,_Genesis_and_Development
- **File:** `wikipedia_castes_in_india.txt`
- **Size:** 17,546 bytes (~18 KB)
- **Content type:** Plain text
- **Language:** English
- **License:** CC BY-SA 3.0

#### Dalit Buddhist movement article
- **Status:** SUCCESS
- **URL:** https://r.jina.ai/http://en.wikipedia.org/wiki/Dalit_Buddhist_movement
- **File:** `wikipedia_buddhism_in_india.txt`
- **Size:** 98,676 bytes (~99 KB)
- **Content type:** Plain text
- **Language:** English
- **License:** CC BY-SA 3.0

#### Constitution of India article
- **Status:** SUCCESS
- **URL:** https://r.jina.ai/http://en.wikipedia.org/wiki/Constitution_of_India
- **File:** `wikipedia_constitution_of_india.txt`
- **Size:** 197,141 bytes (~197 KB)
- **Content type:** Plain text
- **Language:** English
- **License:** CC BY-SA 3.0

---

## Failed Attempts

### 1. Internet Archive - Multiple files

#### Attempt: `in.ernet.dli.2015.84521` (The Problem of the Rupee)
- **Status:** FAILED
- **URL:** https://archive.org/download/in.ernet.dli.2015.84521/in.ernet.dli.2015.84521.pdf
- **HTTP Code:** 404
- **File size downloaded:** 146 bytes (error page)
- **Reason:** File not found at expected URL
- **Alternative:** Used Project Gutenberg version instead

#### Attempt: `dli.ernet.1802` (Thoughts on Pakistan)
- **Status:** FAILED
- **URL:** https://archive.org/download/dli.ernet.1802/dli.ernet.1802_text.pdf
- **HTTP Code:** 404
- **File size downloaded:** 146 bytes (error page)
- **Reason:** File not found at expected URL
- **Alternative:** Not pursued; total download size already acceptable

#### Attempt: Direct search of Internet Archive
- **Status:** PARTIAL SUCCESS
- **URL:** https://archive.org/details/@ambedkar
- **Issue:** Interface requires JavaScript; metadata accessible via API but direct downloads fail
- **Note:** API returned 14 results but file download URLs didn't work

---

### 2. BAWS (ambedkar.org)

#### Attempt: Main BAWS website
- **Status:** FAILED
- **URL:** https://www.ambedkar.org/ambedkar.html
- **HTTP Code:** Connection timeout / 403 (forbidden)
- **Reason:** Server unreachable or blocking requests
- **Alternative:** Content from this source would be public domain but site is inaccessible

#### Attempt: Root domain
- **Status:** FAILED
- **URL:** https://www.ambedkar.org/
- **Issue:** No response / connection timeout

---

### 3. Constituent Assembly Debates (CLRC)

#### Attempt: Main website
- **Status:** FAILED
- **URL:** https://cad.clrc.nic.in/
- **Issue:** Connection timeout / no response
- **Reason:** Server unreachable
- **Alternative:** Would be government documents (public domain) but inaccessible

---

## Size Tracking

| Phase | Total Size | Files | % of 1GB Limit |
|-------|-----------|-------|----------------|
| Start | 0 MB | 0 | 0% |
| After Gutenberg #63231 | 77 KB | 1 | 0.0075% |
| After Gutenberg #63132 .txt | 1.07 MB | 2 | 0.107% |
| After Gutenberg #63132 .epub | 1.45 MB | 3 | 0.145% |
| After Wikipedia B.R. Ambedkar .txt | 1.65 MB | 4 | 0.165% |
| After Wikipedia B.R. Ambedkar .html | 1.78 MB | 5 | 0.178% |
| After Wikipedia Castes article | 1.80 MB | 6 | 0.180% |
| After Wikipedia Annihilation of Caste | 1.82 MB | 7 | 0.182% |
| After Wikipedia Dalit Buddhist | 1.91 MB | 8 | 0.191% |
| After Wikipedia Constitution | 2.10 MB | 9 | 0.210% |
| **Final** | **2.1 MB** | **9** | **0.21%** |

**Note:** Downloaded content uses only 0.21% of the 1GB limit. Significant room for expansion if needed.

---

## Recommendations for Future Downloads

### High Priority (Easy to Add)
1. **More Project Gutenberg eBooks** - If more Ambedkar works are added
2. **More Wikipedia articles** - Very low cost (1-200 KB each)
3. **Constituent Assembly Debates** - If CLRC site becomes accessible

### Medium Priority
1. **BAWS volumes** - Large multi-volume works if accessible
2. **Internet Archive PDFs** - If direct download URLs can be found
3. **Other authors' works about Ambedkar** - Academic papers, biographies

### Low Priority (Requires More Work)
1. **Audio transcripts** - Would need speech-to-text processing
2. **Scanned PDFs** - Would need OCR processing
3. **Hindi/Marathi content** - Would need language-specific sources

---

## Technical Notes

### Download Tools Used
- `curl` - Primary download tool with `--max-filesize` and `--max-time` flags
- `WebFetch` (mcp__fetch__fetch_txt, mcp__fetch__fetch_readable) - For verifying URLs and reading metadata
- `jina.ai` (https://r.jina.ai/http://...) - For converting Wikipedia HTML to clean text

### Download Flags
- `-L` - Follow redirects
- `-o filename` - Output to specific file
- `--max-filesize 10M` - Maximum file size (10 MB limit)
- `--max-time 60` - Maximum download time (60 seconds)
- `-w` - Write HTTP info to stderr

### Challenges Encountered
1. **Internet Archive download URLs** - Return 404 even though API shows files exist
2. **ambedkar.org** - Completely unreachable
3. **cad.clrc.nic.in** - Server timeout
4. **Wikipedia raw format** - Works but produces HTML markup, not clean text

---

## Conclusion

Successfully downloaded 9 real, public domain files about Dr. B.R. Ambedkar totaling 2.1 MB. The content covers:
- Biographical information
- Major works (Castes in India, Problem of the Rupee)
- His role in the Indian Constitution
- Social reform and Buddhism conversion
- Annihilation of Caste speech

All content is legally usable for prototype development and testing.

---

*Generated on: 2026-08-30*
