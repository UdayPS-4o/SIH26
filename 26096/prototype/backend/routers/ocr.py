"""OCR API routes for the Samdarshi backend.

In the prototype phase this returns a canned Ambedkar passage after a
fake processing delay.  The real Tesseract / EasyOCR pipeline replaces
this function body during Phase 1 (Day 2, Hours 0-6).
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger('samdarshi.ocr')

router = APIRouter(prefix="/ocr", tags=["ocr"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OCRScanRequest(BaseModel):
    """Request to OCR-scan a document."""
    document_id: int = Field(..., description="ID of the document to scan.")
    language: str = Field(default="en", description="Primary language of the document.")


class OCRScanResponse(BaseModel):
    """OCR extraction result."""
    text: str
    confidence: float
    pages: int
    processing_time: str
    document_id: int
    source: str


# ---------------------------------------------------------------------------
# Canned responses — replace with real OCR in Phase 1
# ---------------------------------------------------------------------------

_SAMPLE_TEXTS = [
    {
        "text": (
            "The problem of the rupee is essentially a problem of the "
            "stabilisation of its exchange value in terms of gold or sterling. "
            "The Indian currency system, as it exists today, is the result of "
            "historical accidents rather than of deliberate design. The rupee "
            "was originally a silver coin, and its value was tied to the value "
            "of silver in the London market. But the fall in the value of silver "
            "after 1873 made it necessary to find some method of stabilising the "
            "exchange value of the rupee.\n\n"
            "The solution adopted was the gold exchange standard, which made "
            "the rupee equivalent to a certain number of gold shillings. But "
            "this standard proved to be a costly expedient. The burden of "
            "maintaining gold reserves fell heavily on the Indian exchequer, "
            "and the standard was abandoned in 1926.\n\n"
            "The present system is a managed currency system. The Reserve Bank "
            "of India manages the currency with a view to maintaining exchange "
            "stability. But the problem of the rupee is not merely a problem of "
            "exchange stability. It is also a problem of internal price levels "
            "and of the balance of payments."
        ),
        "confidence": 0.91,
        "source": "The Problem of the Rupee, pp. 1-5",
    },
    {
        "text": (
            "Caste is not a division of labour. It is a division of labourers. "
            "This is an important distinction. A division of labour is a voluntary "
            "arrangement based on aptitude and training. A division of labourers "
            "is a forced arrangement based on birth. The former is efficient. "
            "The latter is inefficient and unjust.\n\n"
            "The caste system in India has produced the most unequal distribution "
            "of wealth and opportunity the world has ever seen. It has denied "
            "education to the majority of the population. It has condemned "
            "generations to menial and degrading occupations. It has perpetuated "
            "ignorance, poverty, and social degradation.\n\n"
            "No reform of the caste system can succeed unless it attacks the "
            "foundations of the system itself. Palliative measures — reservations, "
            "scholarships, welfare schemes — are necessary but insufficient. What "
            "is needed is a revolutionary change in the Hindu religion and social "
            "structure that has produced and sustained this system."
        ),
        "confidence": 0.88,
        "source": "Annihilation of Caste, pp. 56-60",
    },
    {
        "text": (
            "The Buddha was the greatest man who ever lived. He was not a God. "
            "He was a man who was enlightened. His Dhamma is a code of ethics, "
            "a philosophy of life, a religion without God.\n\n"
            "The Dhamma teaches that all beings are equal. There is no hierarchy "
            "based on birth. There is no priestly class. There is no caste. "
            "There is no untouchability. The Dhamma is a religion of the people, "
            "by the people, for the people.\n\n"
            "The Dhamma teaches the Middle Path — a path of moderation between "
            "the extremes of self-indulgence and self-mortification. It teaches "
            "the Four Noble Truths and the Eightfold Path. It teaches compassion, "
            "non-violence, and the sacredness of all life. It is the most rational "
            "and the most scientific religion in the world."
        ),
        "confidence": 0.92,
        "source": "The Buddha and His Dhamma, pp. 45-52",
    },
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post('/scan', response_model=dict)
async def scan_document(request: OCRScanRequest) -> dict:
    """Simulate scanning a manuscript and extracting text.

    In the prototype phase this returns a canned passage after a fake
    processing delay.  Replace with Tesseract + EasyOCR pipeline in
    Phase 1 (Day 2, Hours 0-6).

    Args:
        request: OCRScanRequest with document_id and language.

    Returns:
        OCRScanResponse with extracted text and metadata.
    """
    try:
        # Simulate processing time (Tesseract + layout analysis)
        await asyncio.sleep(2.5)

        # Pick a canned response based on document_id
        idx = (request.document_id or 1) % len(_SAMPLE_TEXTS)
        sample = _SAMPLE_TEXTS[idx]

        logger.info(
            'OCR scan complete: doc_id=%d, confidence=%.2f, time=2.5s',
            request.document_id,
            sample['confidence'],
        )

        return OCRScanResponse(
            text=sample['text'],
            confidence=sample['confidence'],
            pages=1,
            processing_time='2.5s',
            document_id=request.document_id,
            source=sample['source'],
        )

    except Exception as exc:  # noqa: BLE001
        logger.error('OCR error for doc_id=%d: %s', request.document_id, exc)
        raise HTTPException(
            status_code=500,
            detail="OCR processing failed. Please try again.",
        )


@router.get('/languages', response_model=dict)
def supported_languages() -> dict:
    """Return list of supported OCR languages.

    Returns:
        Dictionary with 'languages' list and 'total' count.
    """
    languages = [
        {"code": "en", "name": "English", "model": "Tesseract + EasyOCR"},
        {"code": "hi", "name": "Hindi (Devanagari)", "model": "Tesseract + EasyOCR"},
        {"code": "sa", "name": "Sanskrit", "model": "Tesseract"},
        {"code": "mr", "name": "Marathi", "model": "Tesseract + EasyOCR"},
    ]
    return {"languages": languages, "total": len(languages)}
