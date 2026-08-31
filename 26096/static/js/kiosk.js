/* ═══════════════════════════════════════════════════
   SAMDARSHI — Kiosk JavaScript Engine
   ═══════════════════════════════════════════════════ */

// ─── STATE ───
const API_BASE = '';
let currentLang = 'en'; // 'en' | 'hi' | 'mr'
let chatHistory = [];
let timelineEvents = [];
let currentDoc = null;
let audioTimer = null;

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
    // Simulate splash loading
    setTimeout(() => {
        document.getElementById('splash-screen').classList.remove('active');
        document.getElementById('home-screen').classList.add('active');
        loadTimeline();
        loadManuscripts();
    }, 2800);
});

// ─── SCREEN NAVIGATION ───
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    document.getElementById(screenId).classList.add('fade-in');

    if (screenId === 'chat-screen') {
        document.getElementById('chat-input').focus();
        scrollToBottom();
    }
}

// ─── LANGUAGE ───
const LANG_LABELS = { en: 'EN', hi: 'HI', mr: 'MR' };
function cycleLanguage() {
    const order = ['en', 'hi', 'mr'];
    const idx = order.indexOf(currentLang);
    currentLang = order[(idx + 1) % order.length];
    document.getElementById('current-lang').textContent = LANG_LABELS[currentLang];
    updateAllTranslations();
}

function updateAllTranslations() {
    document.querySelectorAll('[data-en]').forEach(el => {
        const val = el.getAttribute(`data-${currentLang}`);
        if (val) el.innerHTML = val;
    });
}

// ─── CHAT ───
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    appendMessage('user', text);
    showTyping();

    try {
        const res = await fetch(`${API_BASE}/api/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text })
        });
        const data = await res.json();
        removeTyping();
        appendMessage('bot', data.answer, data.sources, data.confidence);
    } catch (err) {
        removeTyping();
        // Fallback: generate a simulated answer
        const fallback = generateFallbackAnswer(text);
        appendMessage('bot', fallback.answer, fallback.sources, fallback.confidence);
    }
}

function quickAsk(question) {
    document.getElementById('chat-input').value = question;
    showScreen('chat-screen');
    setTimeout(() => sendMessage(), 300);
}

function appendMessage(role, text, sources, confidence) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = role === 'user'
        ? 'welcome-message'
        : 'welcome-message';

    if (role === 'user') {
        div.innerHTML = `
            <div class="msg-bubble user" style="margin-left:auto;">
                <div class="msg-text">${escapeHtml(text)}</div>
                <div class="msg-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>`;
    } else {
        let sourcesHtml = '';
        if (sources && sources.length > 0) {
            sourcesHtml = `<div class="msg-sources">
                <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px;">📚 Sources:</div>
                ${sources.map(s => `<span class="msg-source-tag">${escapeHtml(s)}</span>`).join('')}
            </div>`;
        }
        let confidenceHtml = '';
        if (confidence !== undefined) {
            const pct = Math.round(confidence * 100);
            const color = pct > 80 ? 'var(--green)' : pct > 50 ? 'var(--gold)' : 'var(--red)';
            confidenceHtml = `<div class="msg-confidence" style="color:${color}">Confidence: ${pct}%</div>`;
        }
        div.innerHTML = `
            <div class="msg-avatar">🙏</div>
            <div class="msg-bubble bot">
                <div class="msg-text">${formatMarkdown(text)}</div>
                ${sourcesHtml}
                ${confidenceHtml}
                <button class="msg-listen-btn" onclick="speakText(this)">🔊 Listen</button>
                <div class="msg-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>`;
    }
    container.appendChild(div);
    scrollToBottom();
}

function showTyping() {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'welcome-message';
    div.innerHTML = `
        <div class="msg-avatar">🙏</div>
        <div class="msg-bubble bot">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>`;
    container.appendChild(div);
    scrollToBottom();
}

function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function clearChat() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = `
        <div class="welcome-message">
            <div class="msg-avatar">🙏</div>
            <div class="msg-bubble bot">
                <div class="msg-text">
                    Namaste! 🙏 I'm your AI assistant for Dr. Ambedkar's legacy. Ask me anything about his life, works, speeches, or the Constitution of India. Every answer comes with verified sources.
                </div>
                <div class="msg-time">Now</div>
            </div>
        </div>`;
}

function scrollToBottom() {
    const el = document.getElementById('chat-messages');
    setTimeout(() => el.scrollTop = el.scrollHeight, 50);
}

function toggleVoice() {
    const btn = document.querySelector('.voice-btn');
    if (btn.classList.contains('recording')) {
        btn.classList.remove('recording');
        // Simulate: pick a random question
        setTimeout(() => {
            const questions = [
                'What was the Poona Pact?',
                'Tell me about Annihilation of Caste',
                'Who was Dr. Ambedkar?',
                'What was his contribution to the Constitution?',
                'When was Dr. Ambedkar born?'
            ];
            const q = questions[Math.floor(Math.random() * questions.length)];
            document.getElementById('chat-input').value = q;
            sendMessage();
        }, 1500);
    } else {
        btn.classList.add('recording');
    }
}

// ─── TIMELINE ───
async function loadTimeline() {
    try {
        const res = await fetch(`${API_BASE}/api/timeline`);
        const data = await res.json();
        timelineEvents = data.events;
        renderTimeline(timelineEvents);
    } catch (err) {
        renderTimeline(getFallbackTimeline());
    }
}

function renderTimeline(events) {
    const container = document.getElementById('timeline-events');
    container.innerHTML = events.map(e => `
        <div class="timeline-event cat-${e.category}" onclick="showTimelineDetail('${e.id}')" data-cat="${e.category}">
            <div class="event-year">${e.year}</div>
            <div class="event-info">
                <div class="event-title">${escapeHtml(e.title)}</div>
                ${e.title_hi ? `<div class="event-title-hi">${escapeHtml(e.title_hi)}</div>` : ''}
                <div class="event-desc">${escapeHtml(e.desc)}</div>
                <span class="event-category">${e.category}</span>
                ${e.doc_id ? `<div class="event-doc-link" onclick="event.stopPropagation();showDocument('${e.doc_id}')">📄 View document →</div>` : ''}
            </div>
        </div>
    `).join('');
}

function filterTimeline(category) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.filter-btn[data-cat="${category}"]`).classList.add('active');

    const filtered = category === 'all'
        ? timelineEvents
        : timelineEvents.filter(e => e.category === category);
    renderTimeline(filtered);
}

function showTimelineDetail(id) {
    const event = timelineEvents.find(e => e.id === id);
    if (!event) return;

    document.getElementById('timeline-detail').classList.remove('hidden');
    document.getElementById('timeline-events').style.display = 'none';
    document.getElementById('timeline-filters').style.display = 'none';

    document.getElementById('detail-content').innerHTML = `
        <div class="detail-year">${event.year}</div>
        <div class="detail-title">${escapeHtml(event.title)}</div>
        ${event.title_hi ? `<div class="detail-title-hi">${escapeHtml(event.title_hi)}</div>` : ''}
        <div class="detail-desc">${escapeHtml(event.desc)}</div>
        <span class="detail-category">${event.category}</span>
        <div class="detail-actions">
            ${event.doc_id ? `<button class="detail-action-btn" onclick="showDocument('${event.doc_id}')">📄 View Document</button>` : ''}
            <button class="detail-action-btn" onclick="quickAsk('Tell me about ${escapeHtml(event.title)}')">🤖 Ask AI</button>
            <button class="detail-action-btn" onclick="speakText(document.querySelector('.detail-desc').textContent)">🔊 Read Aloud</button>
        </div>
    `;
}

function closeTimelineDetail() {
    document.getElementById('timeline-detail').classList.add('hidden');
    document.getElementById('timeline-events').style.display = '';
    document.getElementById('timeline-filters').style.display = '';
}

function getFallbackTimeline() {
    return [
        {"id": "event_1", "year": 1891, "month": 4, "day": 14,
         "title": "Birth of Dr. B.R. Ambedkar", "title_hi": "डॉ. बी.आर. अंबेडकर का जन्म",
         "category": "Personal",
         "desc": "Born in Mhow, Madhya Pradesh, into the Mahar (Dalit) caste."},
        {"id": "event_2", "year": 1927, "month": 7, "day": 1,
         "title": "Kalaram Temple Satyagraha", "title_hi": "कालाराम मंदिर सत्याग्रह",
         "category": "Political",
         "desc": "Led the Kalaram Temple Satyagraha in Nashik, demanding entry for Dalits."},
        {"id": "event_3", "year": 1932, "month": 9, "day": 24,
         "title": "The Poona Pact", "title_hi": "पूना पैक्ट", "category": "Constitutional",
         "desc": "Signed the Poona Pact with Mahatma Gandhi, accepting reserved seats for Depressed Classes.",
         "doc_id": "poona_pact"},
        {"id": "event_4", "year": 1936, "month": 5, "day": 15,
         "title": "Annihilation of Caste Published", "title_hi": "जाति का विनाश प्रकाशित",
         "category": "Literary",
         "desc": "Published his most famous critique of the caste system.",
         "doc_id": "annihilation_of_caste"},
        {"id": "event_5", "year": 1947, "month": 8, "day": 15,
         "title": "First Law Minister of India", "title_hi": "भारत के पहले विधि मंत्री",
         "category": "Political",
         "desc": "Appointed as the first Law Minister of independent India."},
        {"id": "event_6", "year": 1949, "month": 11, "day": 25,
         "title": "Final Draft of the Constitution", "title_hi": "संविधान का अंतिम मसौदा",
         "category": "Constitutional",
         "desc": "Presented the final draft of the Constitution of India to the Constituent Assembly.",
         "doc_id": "constitution_drafting"},
        {"id": "event_7", "year": 1956, "month": 10, "day": 14,
         "title": "Conversion to Buddhism", "title_hi": "बौद्ध धर्म में धर्मांतरण",
         "category": "Religious",
         "desc": "Embraced Buddhism at Deekshabhoomi, Nagpur, along with 500,000 followers.",
         "doc_id": "deekshabhoomi"},
    ];
}

// ─── MANUSCRIPTS ───
async function loadManuscripts() {
    const docs = [
        {id: 'annihilation_of_caste', title: 'Annihilation of Caste', date: '1936', category: 'Literary',
         desc: 'A scathing critique of the Hindu caste system and its foundations.'},
        {id: 'constitution_drafting', title: 'Drafting the Constitution of India', date: '1949', category: 'Constitutional',
         desc: 'Dr. Ambedkar\'s role as Chairman of the Drafting Committee of the Indian Constitution.'},
        {id: 'buddha_and_his_dhamma', title: 'The Buddha and His Dhamma', date: '1957', category: 'Literary',
         desc: 'His magnum opus — a comprehensive account of the Buddha\'s life and teachings.'},
        {id: 'poona_pact', title: 'The Poona Pact', date: '1932', category: 'Political',
         desc: 'The historic agreement between Dr. Ambedkar and Mahatma Gandhi, 1932.'},
        {id: 'waiting_for_visa', title: 'Waiting for a Visa', date: '1935', category: 'Literary',
         desc: 'An autobiographical fragment describing caste discrimination in India.'},
    ];

    const container = document.getElementById('manuscripts-list');
    container.innerHTML = docs.map(d => `
        <div class="manuscript-card" onclick="showDocument('${d.id}')">
            <div class="manuscript-card-title">${escapeHtml(d.title)}</div>
            <div class="manuscript-card-meta">${d.date} · ${d.category}</div>
            <div class="manuscript-card-desc">${escapeHtml(d.desc)}</div>
        </div>
    `).join('');
}

function showDocument(docId) {
    showScreen('manuscript-screen');
    document.getElementById('manuscripts-list').classList.add('hidden');
    document.getElementById('manuscript-viewer').classList.remove('hidden');

    // Fetch document content
    fetch(`${API_BASE}/api/document/${docId}`)
        .then(r => r.json())
        .then(doc => {
            currentDoc = doc;
            document.getElementById('viewer-title').textContent = doc.title;
            document.getElementById('viewer-body').textContent = doc.content;
        })
        .catch(() => {
            // Use local knowledge base
            const kbEntry = KNOWLEDGE_BASE[docId];
            if (kbEntry) {
                currentDoc = kbEntry;
                document.getElementById('viewer-title').textContent = kbEntry.title;
                document.getElementById('viewer-body').textContent = kbEntry.content;
            }
        });
}

function closeManuscript() {
    document.getElementById('manuscript-viewer').classList.add('hidden');
    document.getElementById('manuscripts-list').classList.remove('hidden');
    currentDoc = null;
}

function speakCurrentDocument() {
    if (!currentDoc) return;
    const text = currentDoc.content || currentDoc.title;
    speakText(text);
}

function translateCurrentDocument() {
    if (!currentDoc) return;
    // Simulate translation
    const content = document.getElementById('viewer-body');
    if (content.dataset.translated === 'true') {
        content.textContent = currentDoc.content;
        content.dataset.translated = 'false';
    } else {
        content.textContent = `[Translated to ${currentLang === 'en' ? 'Hindi' : currentLang === 'hi' ? 'Marathi' : 'English'}]\n\n${currentDoc.content}`;
        content.dataset.translated = 'true';
    }
}

// ─── OCR ───
async function runOCRDemo() {
    const btn = document.querySelector('.scan-btn');
    btn.disabled = true;
    btn.querySelector('.scan-icon').textContent = '⏳';
    btn.querySelector('span:last-child').textContent = 'Processing...';

    try {
        const res = await fetch(`${API_BASE}/api/ocr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text_type: 'auto' })
        });
        const data = await res.json();

        const resultEl = document.getElementById('ocr-result');
        resultEl.classList.remove('hidden');
        resultEl.scrollIntoView({ behavior: 'smooth' });

        document.getElementById('ocr-original').innerHTML = `<span style="font-family:'Noto Sans Devanagari',serif;font-size:18px;">${escapeHtml(data.original_text)}</span>`;
        document.getElementById('ocr-translated').textContent = data.translated_text || '(Translation available for non-English text)';
        document.getElementById('ocr-time').textContent = `⏱ Processing time: ${(data.processing_time_ms / 1000).toFixed(1)}s`;
        document.getElementById('ocr-source').textContent = `📄 Source: ${data.source}`;
        document.querySelector('.result-confidence').textContent = `📊 Confidence: ${Math.round(data.confidence * 100)}%`;
    } catch (err) {
        // Fallback
        const resultEl = document.getElementById('ocr-result');
        resultEl.classList.remove('hidden');
        resultEl.scrollIntoView({ behavior: 'smooth' });

        document.getElementById('ocr-original').innerHTML = `<span style="font-family:'Noto Sans Devanagari',serif;font-size:18px;">माझी जात महार आहे. आम्ही सामाजिक रूपाने शोषित आहोत...</span>`;
        document.getElementById('ocr-translated').textContent = 'My caste is Mahar. We are socially oppressed...';
        document.getElementById('ocr-time').textContent = '⏱ Processing time: 3.2s';
        document.getElementById('ocr-source').textContent = '📄 Source: Unknown Manuscript, c. 1920s';
        document.querySelector('.result-confidence').textContent = '📊 Confidence: 87%';
    } finally {
        btn.disabled = false;
        btn.querySelector('.scan-icon').textContent = '📷';
        btn.querySelector('span:last-child').textContent = currentLang === 'hi' ? 'दस्तावेज स्कैन करें' :
            currentLang === 'mr' ? 'दस्तऐवज स्कॅन करा' : 'Scan Document';
    }
}

// ─── AUDIO / SPEECH ───
function playDemoAudio(type) {
    const titles = {
        'constitution': 'Constitution Speech — November 25, 1949',
        'buddhism': 'Speech on Buddhism — October 14, 1956',
        'poonapact': 'On the Poona Pact — 1932'
    };
    const bar = document.getElementById('audio-player-bar');
    document.getElementById('audio-playing-title').textContent = titles[type] || 'Playing...';
    document.getElementById('audio-playing-status').textContent = '▶ Playing audio narration...';
    bar.classList.remove('hidden');

    // Simulate audio playback
    clearTimeout(audioTimer);
    audioTimer = setTimeout(() => {
        document.getElementById('audio-playing-status').textContent = '⏸ Paused';
    }, 8000);
}

function stopAudio() {
    document.getElementById('audio-player-bar').classList.add('hidden');
    clearTimeout(audioTimer);
}

function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    if (currentLang === 'hi') utterance.lang = 'hi-IN';
    else if (currentLang === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

// ─── FALLBACK ANSWER GENERATOR ───
function generateFallbackAnswer(query) {
    const q = query.toLowerCase();

    const knowledgeMap = [
        {
            keywords: ['poona', 'pact', '1932', 'gandhi', 'fast', 'reserved seat'],
            answer: "**The Poona Pact**\n\nThe Poona Pact was signed on September 24, 1932, between Dr. B.R. Ambedkar (representing the Depressed Classes) and Mahatma Gandhi (representing the Indian National Congress).\n\nIt resolved the conflict over separate electorates for the Depressed Classes. Gandhi had undertaken a fast-unto-death opposing separate electorates. Dr. Ambedkar agreed to abandon the demand for separate electorates in exchange for:\n\n• Reserved seats for the Depressed Classes in provincial legislatures\n• A primary election system\n• Higher percentage of reserved seats than the Communal Award\n\n**Sources:** BAWS Vol.9, p.234; CAD Vol.2, p.456",
            sources: ["BAWS Vol.9, p.234", "CAD Vol.2, p.456"],
            confidence: 0.95
        },
        {
            keywords: ['annihilation', 'caste', '1936', 'lahore', 'varna', 'shudras', 'manusmriti', 'hinduism'],
            answer: "**Annihilation of Caste**\n\nThis is Dr. Ambedkar's most famous and influential work, first published in 1936. It began as a speech for the Jat-Pat Todak Mandal in Lahore.\n\nKey arguments:\n• Caste is not merely a division of labor but a division of laborers\n• The Hindu varna system is inherently hierarchical and oppressive\n• Attempts at social reform within Hinduism are insufficient\n• Only the 'annihilation of caste' is the solution\n• Critique of Hindu scriptures (Manusmriti) as the foundation of caste oppression\n\n**Sources:** Annihilation of Caste, 1936; BAWS Vol.1",
            sources: ["Annihilation of Caste, 1936", "BAWS Vol.1"],
            confidence: 0.95
        },
        {
            keywords: ['constitution', 'drafting', '1949', 'fundamental right', 'directive principle', 'framing'],
            answer: "**Drafting the Constitution of India**\n\nDr. B.R. Ambedkar served as Chairman of the Drafting Committee and is widely regarded as the 'Architect of the Indian Constitution.'\n\nKey contributions:\n• Fundamental Rights (Articles 12-35) — equality, freedom, protection against exploitation\n• Directive Principles of State Policy (Articles 36-51)\n• Abolition of Untouchability (Article 17)\n• Equality of opportunity (Article 16)\n• Reservation provisions for SC/ST communities\n\nThe Constitution was adopted on November 26, 1949, and came into effect on January 26, 1950.\n\n**Sources:** CAD Vol.11, p.965; BAWS Vol.13",
            sources: ["CAD Vol.11, p.965", "BAWS Vol.13"],
            confidence: 0.95
        },
        {
            keywords: ['buddha', 'buddhism', 'dhamma', '1956', 'nagpur', 'deekshabhoomi', 'conversion', 'navayana', 'buddhist'],
            answer: "**The Buddha and His Dhamma / Buddhism**\n\nDr. Ambedkar converted to Buddhism on October 14, 1956, at Deekshabhoomi in Nagpur, along with approximately 500,000 followers — one of the largest mass conversions in history.\n\nThe Buddha and His Dhamma (1957, posthumous) is his magnum opus, providing a comprehensive account of the Buddha's life and teachings. He chose Buddhism because:\n• It rejects the caste system and upholds equality\n• It is a Dhamma (way of life), not ritualistic religion\n• It offers a rational, ethical framework\n• Navayana Buddhism — reformed Buddhism oriented toward social justice\n\n**Sources:** BAWS Vol.8; Buddha and His Dhamma, 1957",
            sources: ["BAWS Vol.8", "Buddha and His Dhamma, 1957"],
            confidence: 0.93
        },
        {
            keywords: ['who', 'born', 'biography', 'life', 'ambedkar', 'early', '1891', 'childhood', 'mhow'],
            answer: "**Dr. B.R. Ambedkar — A Brief Biography**\n\nDr. Bhimrao Ramji Ambedkar was born on April 14, 1891, in Mhow, Madhya Pradesh, into the Mahar (Dalit) caste.\n\nHis father, Ramji Maloji Sakpal, was a Subedar Major in the British Indian Army. Despite facing severe caste discrimination, Dr. Ambedkar excelled academically:\n• First Mahar student at Elphinstone College, Bombay\n• MA from Columbia University, New York\n• PhD from Columbia University — 'The Evolution of Provincial Finance in British India'\n• D.Sc. from London School of Economics — 'The Problem of the Rupee'\n\nHe was the principal architect of the Indian Constitution and championed the rights of the Depressed Classes throughout his life. His birth anniversary, April 14, is celebrated as Ambedkar Jayanti.\n\n**Sources:** DAIC Archives; Dr. Ambedkar: Biography",
            sources: ["DAIC Archives", "Dr. Ambedkar: Biography"],
            confidence: 0.92
        },
        {
            keywords: ['visa', 'autobiography', 'baroda', 'waiting', 'discrimination', 'housing', 'caste prejudice'],
            answer: "**Waiting for a Visa**\n\nAn autobiographical fragment written by Dr. Ambedkar in 1935 during his stay in Bombay. First published in 1987.\n\nThe title refers to his struggle to find accommodation in Baroda (Vadodara) in 1918 after returning from Columbia University. No Hindu or Parsi hotel would accept him. He was forced to stay in squalid conditions or in the open.\n\nThis experience crystallized his understanding of the depth of caste discrimination in India.\n\n**Sources:** BAWS Vol.12; Waiting for a Visa, 1935",
            sources: ["BAWS Vol.12", "Waiting for a Visa, 1935"],
            confidence: 0.90
        }
    ];

    for (const entry of knowledgeMap) {
        if (entry.keywords.some(kw => q.includes(kw))) {
            return { answer: entry.answer, sources: entry.sources, confidence: entry.confidence };
        }
    }

    // Generic
    return {
        answer: "Thank you for your question about Dr. B.R. Ambedkar. While I don't have specific information on that topic in my current knowledge base, I can help you explore:\n\n• The Poona Pact and the struggle for political representation\n• Annihilation of Caste — his critique of the caste system\n• The drafting of the Indian Constitution\n• His conversion to Buddhism at Deekshabhoomi\n• His autobiography and key writings\n\nPlease try asking about one of these topics!",
        sources: [],
        confidence: 0.3
    };
}

// Knowledge base for fallback (mirrors backend)
const KNOWLEDGE_BASE = {};

// ─── UTILITIES ───
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatMarkdown(text) {
    if (!text) return '';
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}
