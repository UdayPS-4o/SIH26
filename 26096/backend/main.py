"""
SAMDARSHI — AI-Powered Digital Heritage Archive
Backend: FastAPI + RAG engine with pre-loaded Ambedkar knowledge base
"""

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import random
import re
import time
from pathlib import Path

# ──────────────────────────────────────────────
# DATA — Ambedkar Knowledge Base
# ──────────────────────────────────────────────
KNOWLEDGE_BASE = {
    "poona_pact": {
        "id": "doc_001",
        "title": "The Poona Pact",
        "title_hi": "पूना पैक्ट (१९३२)",
        "title_mr": "पुणे पैक्ट (१९३२)",
        "category": "Political",
        "date": "1932-09-24",
        "content": (
            "The Poona Pact was an agreement signed on September 24, 1932, between Dr. B.R. Ambedkar "
            "representing the Depressed Classes and Mahatma Gandhi representing the Indian National Congress. "
            "The pact was negotiated at Yerwada Central Jail in Poona (now Pune) to resolve the issue of "
            "separate electorates for the Depressed Classes.\n\n"
            "Gandhaji had undertaken a fast-unto-death in protest against the British government's decision "
            "(Communal Award) to grant separate electorates to the Depressed Classes. Dr. Ambedkar agreed "
            "to abandon the demand for separate electorates in exchange for:\n"
            "1. Reserved seats for the Depressed Classes in provincial legislatures\n"
            "2. A higher percentage of reserved seats than originally proposed in the Communal Award\n"
            "3. A primary election system to allow the Depressed Classes to choose their own candidates\n"
            "4. A minimum representation in the Central Legislature\n\n"
            "The Poona Pact was a significant moment in Indian constitutional history, demonstrating "
            "Dr. Ambedkar's commitment to political compromise while fighting for the rights of the "
            "marginalized communities."
        ),
        "sources": ["BAWS Vol.9, p.234", "CAD Vol.2, p.456"],
        "keywords": ["poona", "pact", "1932", "gandhi", "fast", "separate electorates", "reserved seats",
                     "depressed classes", "yerwada", "communal award", "pune"]
    },
    "annihilation_of_caste": {
        "id": "doc_002",
        "title": "Annihilation of Caste",
        "title_hi": "जाति का विनाश",
        "title_mr": "जातीचा उद्धाव",
        "category": "Literary",
        "date": "1936-05-15",
        "content": (
            "Annihilation of Caste is Dr. Ambedkar's most famous and influential work, first published in 1936. "
            "It began as a speech prepared for the annual conference of the Jat-Pat Todak Mandal in Lahore, "
            "which was to be held in 1936. However, the organizers found the speech too radical and requested "
            "changes. Dr. Ambedkar refused to modify it, and the speech was instead published as a book.\n\n"
            "In this seminal work, Dr. Ambedkar:\n"
            "• Critiqued the Hindu varna system as inherently hierarchical and oppressive\n"
            "• Argued that caste was not merely a division of labor but a division of laborers\n"
            "• Dismissed attempts at social reform within Hinduism as insufficient\n"
            "• Called for the 'annihilation of caste' as the only solution\n"
            "• Analyzed the role of the Shudras and their degraded position in Hindu society\n"
            "• Criticized Hindu scriptures (especially the Manusmriti) as the foundation of caste oppression\n\n"
            "The book remains one of the most important texts on caste and social justice in India and continues "
            "to be widely read and debated."
        ),
        "sources": ["Annihilation of Caste, 1936", "BAWS Vol.1"],
        "keywords": ["annihilation", "caste", "1936", "lahore", "jat-pat", "varna", "shudras",
                     "manusmriti", "hinduism", "social reform", "dalit"]
    },
    "constitution_drafting": {
        "id": "doc_003",
        "title": "Drafting the Constitution of India",
        "title_hi": "भारत का संविधान तैयार करना",
        "title_mr": "भारतीय संविधान मांडणी",
        "category": "Constitutional",
        "date": "1947-11-29",
        "content": (
            "Dr. B.R. Ambedkar served as the Chairman of the Drafting Committee of the Indian Constitution "
            "and is widely regarded as the 'Architect of the Indian Constitution.'\n\n"
            "The Constituent Assembly first met on December 9, 1946. After India gained independence on "
            "August 15, 1947, the Assembly continued its work of framing the Constitution.\n\n"
            "Dr. Ambedkar's contributions to the Constitution include:\n"
            "• Fundamental Rights (Articles 12-35) — guaranteeing equality, freedom, and protection against exploitation\n"
            "• Directive Principles of State Policy (Articles 36-51) — guiding the state toward social justice\n"
            "• Abolition of Untouchability (Article 17) — making untouchability a punishable offense\n"
            "• Equality of opportunity (Article 16) — prohibiting discrimination in public employment\n"
            "• Reservation provisions for Scheduled Castes and Scheduled Tribes\n"
            "• A robust system of checks and balances between the three branches of government\n\n"
            "The Constitution was adopted on November 26, 1949, and came into effect on January 26, 1950. "
            "Dr. Ambedkar presented the final draft of the Constitution to the Assembly on November 25, 1949."
        ),
        "sources": ["CAD Vol.11, p.965", "BAWS Vol.13"],
        "keywords": ["constitution", "drafting", "1949", "fundamental rights", "directive principles",
                     "constituent assembly", "untouchability", "reservation", "articles", "framing"]
    },
    "buddha_and_his_dhamma": {
        "id": "doc_004",
        "title": "The Buddha and His Dhamma",
        "title_hi": "बुद्ध और उनका धर्म",
        "title_mr": "बुद्ध आणि त्यांचा धर्म",
        "category": "Literary",
        "date": "1957-05",
        "content": (
            "The Buddha and His Dhamma is Dr. Ambedkar's final and most important book, published posthumously in 1957. "
            "It is considered his magnum opus and represents the culmination of his philosophical and spiritual journey.\n\n"
            "The book provides a comprehensive account of the life of Gautama Buddha and his teachings (Dhamma). "
            "Dr. Ambedkar wrote this book after his conversion to Buddhism on October 14, 1956, along with "
            "hundreds of thousands of his followers in a historic ceremony at Deekshabhoomi, Nagpur.\n\n"
            "Key themes in the book:\n"
            "• The life of the Buddha from birth to parinirvana\n"
            "• The Dhamma as a way of life, not a religion\n"
            "• Critique of priestly Buddhism (after the Buddha's death)\n"
            "• Social equality as the core of Buddhist teaching\n"
            "• Rationalism and compassion as guiding principles\n\n"
            "Dr. Ambedkar considered Buddhism the path to achieving the social revolution he had been fighting for "
            "through political means. This book outlines his vision of Navayana Buddhism — a reformed Buddhism "
            "oriented toward social justice."
        ),
        "sources": ["BAWS Vol.8", "Buddha and His Dhamma, 1957"],
        "keywords": ["buddha", "buddhism", "dhamma", "1956", "nagpur", "deekshabhoomi", "navayana",
                     "conversion", "parinirvana", "social justice", "rationalism"]
    },
    "babasaheb_birth": {
        "id": "event_001",
        "title": "Birth of Dr. B.R. Ambedkar",
        "title_hi": "डॉ. बी.आर. अंबेडकर का जन्म",
        "title_mr": "डॉ. बी.आर. अंबेडकरचा जन्म",
        "category": "Personal",
        "date": "1891-04-14",
        "content": (
            "Dr. Bhimrao Ramji Ambedkar was born on April 14, 1891, in Mhow, Madhya Pradesh, then part of the "
            "Central Provinces of British India. His father, Ramji Maloji Sakpal, was a Subedar Major in the "
            "British Indian Army, and his mother was Bhimabai.\n\n"
            "Born into the Mahar (Dalit) caste, Dr. Ambedkar faced severe caste discrimination from an early age. "
            "Despite facing systemic barriers in education, he excelled academically and went on to become one of "
            "the most educated Indians of his time.\n\n"
            "His birth anniversary, April 14, is celebrated as Ambedkar Jayanti across India and is observed as "
            "a public holiday in many states."
        ),
        "sources": ["Dr. Ambedkar: Biography, DAIC"],
        "keywords": ["1891", "birth", "mhow", "madhya pradesh", "ambedkar jayanti", "april 14", "ramji sakpal"]
    },
    "deekshabhoomi": {
        "id": "event_002",
        "title": "Conversion to Buddhism — Deekshabhoomi",
        "title_hi": "बौद्ध धर्म में धर्मांतरण — दीक्षाभूमि",
        "title_mr": "बौद्ध धर्मात धर्मांतरण — दीक्षाभूमी",
        "category": "Political",
        "date": "1956-10-14",
        "content": (
            "On October 14, 1956, Dr. Ambedkar publicly converted to Buddhism along with approximately 500,000 of "
            "his followers in a historic ceremony at Deekshabhoomi in Nagpur, Maharashtra. This is considered one of "
            "the largest mass conversions in history.\n\n"
            "Dr. Ambedkar chose Buddhism because:\n"
            "• It rejects the caste system and upholds equality\n"
            "• It is a Dhamma (way of life) rather than a religion with rituals\n"
            "• It was originally a protest against Brahmanical dominance\n"
            "• It offers a rational, ethical framework for social organization\n\n"
            "He formally received the Three Refuges and Five Precepts from the Buddhist monk Mahasthavir Chandramani. "
            "The ceremony was attended by thousands, and it marked a defining moment in the Dalit Buddhist movement."
        ),
        "sources": ["BAWS Vol.17", "DAIC Archives"],
        "keywords": ["1956", "buddhism", "conversion", "deekshabhoomi", "nagpur", "october 14",
                     "mass conversion", "dalit buddhist", "chandramani"]
    },
    "waiting_for_visa": {
        "id": "doc_005",
        "title": "Waiting for a Visa (Autobiographical Fragment)",
        "title_hi": "वीसा का इंतज़ार (आत्मकथात्मक टुकड़ा)",
        "title_mr": "व्हिसा वाट पाहणे (आत्मकथा फragmenट)",
        "category": "Literary",
        "date": "1935",
        "content": (
            "Waiting for a Visa is an autobiographical fragment written by Dr. Ambedkar in 1935 during his stay "
            "in Bombay. It was first published much later, in the 1987 issue of the Government of Maharashtra's "
            "journal, Special Marathi Magazine.\n\n"
            "This short but powerful piece describes the humiliation and discrimination Dr. Ambedkar faced when "
            "trying to find accommodation in Baroda (now Vadodara) in 1918. After completing his doctorate at "
            "Columbia University in New York and London School of Economics, he returned to India and sought a "
            "position in the princely state of Baroda.\n\n"
            "The title refers to his struggle to find a place to stay — no Hindu or Parsi hotel would accept him "
            "as a guest. He was forced to stay in a squalid 'untouchables' quarter' or live in the open. "
            "This experience crystallized his understanding of the depth of caste discrimination in India and "
            "reinforced his resolve to fight against it."
        ),
        "sources": ["BAWS Vol.12", "Waiting for a Visa, 1935"],
        "keywords": ["visa", "autobiography", "baroda", "1918", "columbia", "discrimination",
                     "untouchable quarter", "housing", "caste prejudice"]
    }
}

# ──────────────────────────────────────────────
# TIMELINE DATA
# ──────────────────────────────────────────────
TIMELINE_EVENTS = [
    {"year": 1891, "month": 4, "day": 14, "title": "Birth of Dr. B.R. Ambedkar",
     "title_hi": "डॉ. बी.आर. अंबेडकर का जन्म", "category": "Personal",
     "desc": "Born in Mhow, Madhya Pradesh, into the Mahar (Dalit) caste.",
     "doc_id": "babasaheb_birth"},
    {"year": 1906, "month": 1, "day": 1, "title": "Enrollment at Satara School",
     "title_hi": "सातारा स्कूल में दाखिला", "category": "Personal",
     "desc": "Enrolled at Satara High School, facing caste-based discrimination."},
    {"year": 1907, "month": 1, "day": 1, "title": "Matriculation",
     "title_hi": "मैट्रिक", "category": "Personal",
     "desc": "Cleared matriculation from Elphinstone High School, Bombay."},
    {"year": 1908, "month": 1, "day": 1, "title": "Joined Elphinstone College",
     "title_hi": "एल्फिन्स्टन कॉलेज में प्रवेश", "category": "Personal",
     "desc": "First Mahar student to enroll at Elphinstone College, Bombay."},
    {"year": 1912, "month": 1, "day": 1, "title": "Graduation from Bombay University",
     "title_hi": "बॉम्बे विश्वविद्यालय से स्नातक", "category": "Personal",
     "desc": "Graduated in Economics and Political Science from Bombay University."},
    {"year": 1913, "month": 1, "day": 1, "title": "Scholarship to Columbia University",
     "title_hi": "कॉलम्बिया विश्वविद्यालय को छात्रवृत्ति", "category": "Personal",
     "desc": "Received a scholarship from the Gaekwad of Baroda to study at Columbia University, New York."},
    {"year": 1915, "month": 6, "day": 1, "title": "MA from Columbia University",
     "title_hi": "कॉलम्बिया विश्वविद्यालय से एमए", "category": "Personal",
     "desc": "Completed MA in Economics from Columbia University, New York. Thesis: 'Ancient Indian Commerce'."},
    {"year": 1916, "month": 1, "day": 1, "title": "PhD from Columbia University",
     "title_hi": "कॉलम्बिया विश्वविद्यालय से पीएचडी", "category": "Personal",
     "desc": "Completed PhD thesis on 'The Evolution of Provincial Finance in British India'."},
    {"year": 1916, "month": 6, "day": 1, "title": "D.Sc. from London School of Economics",
     "title_hi": "लंदन स्कूल ऑफ इकोनॉमिक्स से डी.एस.सी.", "category": "Personal",
     "desc": "Earned D.Sc. from LSE for his thesis on 'The Problem of the Rupee'."},
    {"year": 1923, "month": 1, "day": 1, "title": "Founded Bahishkrit Hitakarini Sabha",
     "title_hi": "बहिष्कृत हितकारिणी सभा की स्थापना", "category": "Political",
     "desc": "Founded the Bahishkrit Hitakarini Sabha (Outcastes' Welfare Association) in Bombay."},
    {"year": 1927, "month": 7, "day": 1, "title": "Kalaram Temple Satyagraha",
     "title_hi": "कालाराम मंदिर सत्याग्रह", "category": "Political",
     "desc": "Led the Kalaram Temple Satyagraha in Nashik, demanding entry for Dalits into the temple."},
    {"year": 1930, "month": 3, "day": 20, "title": "Mahad Satyagraha",
     "title_hi": "महाड सत्याग्रह", "category": "Political",
     "desc": "Led the Mahad Satyagraha to assert the right of Dalits to draw water from the Chavdar Tank."},
    {"year": 1932, "month": 9, "day": 24, "title": "The Poona Pact",
     "title_hi": "पूना पैक्ट", "category": "Constitutional",
     "desc": "Signed the Poona Pact with Mahatma Gandhi, accepting reserved seats over separate electorates.",
     "doc_id": "poona_pact"},
    {"year": 1935, "month": 1, "day": 1, "title": "Waiting for a Visa",
     "title_hi": "वीसा का इंतज़ार", "category": "Literary",
     "desc": "Wrote the autobiographical fragment 'Waiting for a Visa' in Bombay.",
     "doc_id": "waiting_for_visa"},
    {"year": 1936, "month": 5, "day": 15, "title": "Annihilation of Caste Published",
     "title_hi": "जाति का विनाश प्रकाशित", "category": "Literary",
     "desc": "Published Annihilation of Caste, his most famous critique of the caste system.",
     "doc_id": "annihilation_of_caste"},
    {"year": 1936, "month": 10, "day": 1, "title": "Founded Independent Labour Party",
     "title_hi": "स्वतंत्र श्रमिक पार्टी की स्थापना", "category": "Political",
     "desc": "Founded the Independent Labour Party (ILP) to represent the interests of workers and the oppressed."},
    {"year": 1942, "month": 8, "day": 1, "title": "Published Who Were the Shudras?",
     "title_hi": "शूद्र कौन थे?", "category": "Literary",
     "desc": "Published his book 'Who Were the Shudras?' examining the origin of the Shudra caste."},
    {"year": 1946, "month": 7, "day": 1, "title": "Elected to Constituent Assembly",
     "title_hi": "संविधान सभा में निर्वाचित", "category": "Constitutional",
     "desc": "Elected to the Constituent Assembly from Bengal as a member of the Scheduled Castes."},
    {"year": 1947, "month": 8, "day": 15, "title": "First Law Minister of India",
     "title_hi": "भारत के पहले विधि मंत्री", "category": "Political",
     "desc": "Appointed as the first Law Minister of independent India by Prime Minister Jawaharlal Nehru."},
    {"year": 1947, "month": 11, "day": 29, "title": "Chairman, Drafting Committee",
     "title_hi": "ड्राफ्टिंग कमेटी के अध्यक्ष", "category": "Constitutional",
     "desc": "Appointed Chairman of the Drafting Committee for the Constitution of India."},
    {"year": 1949, "month": 11, "day": 25, "title": "Final Draft of the Constitution",
     "title_hi": "संविधान का अंतिम मसौदा", "category": "Constitutional",
     "desc": "Presented the final draft of the Constitution of India to the Constituent Assembly.",
     "doc_id": "constitution_drafting"},
    {"year": 1950, "month": 1, "day": 26, "title": "Constitution of India Comes into Force",
     "title_hi": "भारत का संविधान लागू", "category": "Constitutional",
     "desc": "The Constitution of India came into effect. Dr. Ambedkar's vision became the law of the land."},
    {"year": 1951, "month": 1, "day": 1, "title": "Resigned from Cabinet",
     "title_hi": "कैबिनेट से इस्तीफा", "category": "Political",
     "desc": "Resigned from Nehru's cabinet over the delay in passing the Hindu Code Bill."},
    {"year": 1956, "month": 10, "day": 14, "title": "Conversion to Buddhism",
     "title_hi": "बौद्ध धर्म में धर्मांतरण", "category": "Religious",
     "desc": "Embraced Buddhism at Deekshabhoomi, Nagpur, along with ~500,000 followers.",
     "doc_id": "deekshabhoomi"},
    {"year": 1956, "month": 12, "day": 6, "title": "Mahaparinirvana",
     "title_hi": "महापरिनिर्वाण", "category": "Personal",
     "desc": "Dr. B.R. Ambedkar passed away in Delhi. The nation mourned the loss of its greatest champion of social justice."},
]

# ──────────────────────────────────────────────
# RETRIEVAL ENGINE (rule-based for demo)
# ──────────────────────────────────────────────
def detect_language(text: str) -> str:
    """Detect if text is Hindi/Devanagari, Marathi, or English."""
    devanagari = len(re.findall(r'[ऀ-ॿ]', text))
    marathi_modifiers = len(re.findall(r'[०-९]', text))
    if devanagari > 5:
        # Check for Marathi-specific words
        marathi_words = ['हे', 'ते', 'आहे', 'आहेत', 'काय', 'कोण', 'कुठे', 'कधी']
        text_lower = text.lower()
        marathi_score = sum(1 for w in marathi_words if w in text_lower)
        if marathi_score >= 2:
            return 'mr'
        return 'hi'
    return 'en'

def search_kb(query: str) -> list:
    """Search knowledge base for relevant documents."""
    query_lower = query.lower()
    query_words = set(re.findall(r'\w+', query_lower))
    results = []

    for doc_id, doc in KNOWLEDGE_BASE.items():
        score = 0
        # Keyword matching
        for kw in doc["keywords"]:
            if kw in query_lower:
                score += 3
        # Word overlap
        content_words = set(re.findall(r'\w+', doc["content"].lower()))
        overlap = len(query_words & content_words)
        score += overlap * 0.5
        # Title match bonus
        if any(w in doc["title"].lower() for w in query_words):
            score += 5

        if score > 0:
            results.append((score, doc))

    results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in results[:3]]

def generate_answer(query: str, docs: list) -> dict:
    """Generate an answer from retrieved documents."""
    lang = detect_language(query)

    if not docs:
        if lang == 'hi':
            answer = "मुझे खेद है, मैं इस प्रश्न का उत्तर नहीं ढूंढ सका। कृपया कोई अन्य प्रश्न पूछें।"
        elif lang == 'mr':
            answer = "मला माफ करा, मी या प्रश्नाचे उत्तर शोधू शकलो नाही। कृपया दुसरे प्रश्न विचारा."
        else:
            answer = ("I apologize, I couldn't find relevant information for that query. "
                      "Could you please try asking about another aspect of Dr. Ambedkar's life or works? "
                      "You can ask about the Poona Pact, Annihilation of Caste, the Constitution of India, "
                      "Buddhism, or his biography.")
        return {
            "answer": answer,
            "sources": [],
            "confidence": 0.0,
            "language": lang
        }

    top_doc = docs[0]
    content = top_doc["content"]
    sources = top_doc.get("sources", [])
    confidence = min(0.95, 0.6 + len(docs) * 0.1 + (3 if top_doc["id"] == docs[0]["id"] else 0) * 0.05)

    # Build answer based on language
    if lang == 'hi':
        title = top_doc.get("title_hi", top_doc["title"])
        answer = f"**{title}**\n\n"
        # Simple answer from the document
        first_para = content.split('\n\n')[0]
        answer += f"{first_para}\n\n"
        if len(docs) > 1:
            answer += "संबंधित जानकारी के लिए कृपया संदर्भ देखें।"
    elif lang == 'mr':
        title = top_doc.get("title_mr", top_doc["title"])
        answer = f"**{title}**\n\n"
        first_para = content.split('\n\n')[0]
        answer += f"{first_para}\n\n"
    else:
        title = top_doc["title"]
        # Smart answer — extract most relevant part
        first_para = content.split('\n\n')[0]
        second_para = content.split('\n\n')[1] if len(content.split('\n\n')) > 1 else ""
        answer = f"**{title}**\n\n{first_para}\n\n{second_para}\n\n"
        if len(docs) > 1:
            answer += "*(Additional related sources available — see citations below.)*"

    return {
        "answer": answer,
        "sources": sources + [d.get("title", "") for d in docs[1:]],
        "confidence": round(confidence, 2),
        "language": lang,
        "doc_id": top_doc["id"]
    }

# ──────────────────────────────────────────────
# OCR SIMULATION
# ──────────────────────────────────────────────
OCR_SAMPLES = {
    "manuscript_1": {
        "original": "माझी जात महार आहे. आम्ही सामाजिक रूपाने शोषित आहोत...",
        "translated": "My caste is Mahar. We are socially oppressed...",
        "source": "Unknown Manuscript, c. 1920s"
    },
    "manuscript_2": {
        "original": "The annihilation of caste is the only solution to the problem of the depressed classes.",
        "translated": "",
        "source": "Annihilation of Caste Manuscript, 1936"
    }
}

def simulate_ocr(text_type: str = "auto") -> dict:
    """Simulate OCR processing with realistic delay."""
    sample = OCR_SAMPLES["manuscript_1"]
    if text_type == "english":
        sample = OCR_SAMPLES["manuscript_2"]
    return {
        "status": "success",
        "original_text": sample["original"],
        "translated_text": sample["translated"],
        "confidence": round(random.uniform(0.78, 0.92), 2),
        "processing_time_ms": random.randint(2500, 5000),
        "source": sample["source"],
        "language": "hi" if text_type != "english" else "en"
    }

# ──────────────────────────────────────────────
# FASTAPI APP
# ──────────────────────────────────────────────
app = FastAPI(
    title="Samdarshi API",
    description="AI-Powered Digital Heritage Archive for Dr. B.R. Ambedkar",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_kiosk():
    """Serve the kiosk frontend."""
    return HTMLResponse(open(static_dir / "index.html").read())

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "samdarshi", "version": "1.0.0"}

@app.get("/api/knowledge-base")
async def get_knowledge_base():
    """Get list of all documents in the knowledge base."""
    docs = []
    for doc_id, doc in KNOWLEDGE_BASE.items():
        if "date" in doc and len(doc["date"]) == 10:
            docs.append({
                "id": doc_id,
                "title": doc["title"],
                "category": doc["category"],
                "date": doc["date"]
            })
    return {"documents": docs, "total": len(docs)}

@app.get("/api/timeline")
async def get_timeline():
    """Get timeline events."""
    events = []
    for e in TIMELINE_EVENTS:
        events.append({
            "id": e.get("doc_id", f"event_{e['year']}"),
            "year": e["year"],
            "month": e["month"],
            "day": e["day"],
            "title": e["title"],
            "title_hi": e.get("title_hi", ""),
            "title_mr": e.get("title_mr", ""),
            "category": e["category"],
            "desc": e["desc"],
            "date": f"{e['year']}-{e['month']:02d}-{e['day']:02d}"
        })
    return {"events": events, "total": len(events)}

@app.post("/api/ask")
async def ask_question(request: dict):
    """Main RAG endpoint — ask a question about Dr. Ambedkar."""
    query = request.get("question", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Question is required")

    # Simulate processing time
    time.sleep(random.uniform(0.5, 1.5))

    docs = search_kb(query)
    response = generate_answer(query, docs)

    return JSONResponse({
        "query": query,
        "language": response["language"],
        "answer": response["answer"],
        "sources": response["sources"],
        "confidence": response["confidence"],
        "doc_id": response.get("doc_id", ""),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

@app.post("/api/ocr")
async def ocr_scan(request: dict = None):
    """Simulate OCR document scanning."""
    text_type = request.get("text_type", "auto") if request else "auto"
    time.sleep(1)  # Simulate processing
    return simulate_ocr(text_type)

@app.get("/api/document/{doc_id}")
async def get_document(doc_id: str):
    """Get a specific document."""
    doc = KNOWLEDGE_BASE.get(doc_id)
    if not doc:
        # Check timeline events
        for event in TIMELINE_EVENTS:
            if event.get("doc_id") == doc_id:
                return {
                    "id": event["doc_id"],
                    "title": event["title"],
                    "category": event["category"],
                    "date": event["date"],
                    "content": event["desc"]
                }
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@app.get("/api/stats")
async def get_stats():
    """Get system statistics."""
    return {
        "documents": len(KNOWLEDGE_BASE),
        "timeline_events": len(TIMELINE_EVENTS),
        "categories": ["Personal", "Political", "Literary", "Constitutional", "Religious"],
        "languages": ["English", "Hindi", "Marathi"],
        "uptime": "0 days 0 hours"
    }

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket for streaming chat responses."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            query = json.loads(data).get("question", "")
            docs = search_kb(query)
            response = generate_answer(query, docs)

            # Stream word by word
            words = response["answer"].split()
            full_text = ""
            for word in words:
                full_text += word + " "
                await websocket.send_text(json.dumps({
                    "type": "stream",
                    "text": full_text.strip(),
                    "done": False
                }))
                time.sleep(0.03)

            await websocket.send_text(json.dumps({
                "type": "complete",
                "answer": response["answer"],
                "sources": response["sources"],
                "confidence": response["confidence"],
                "language": response["language"],
                "done": True
            }))
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    print("🙏 SAMDARSHI — AI-Powered Digital Heritage Archive")
    print("   Serving at http://localhost:8000")
    print("   Kiosk: http://localhost:8000")
    print("   API docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
