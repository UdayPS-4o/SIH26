#!/usr/bin/env python3
"""
Generate Samdarshi Architecture Diagram as PNG
Uses graphviz (pip install graphviz)
Requires: Graphviz binary installed (https://graphviz.org/download/)
"""

from graphviz import Digraph
import os

def create_architecture_diagram():
    dot = Digraph(comment='Samdarshi Architecture', format='png')
    dot.attr(rankdir='TB', size='40,30', dpi='150', bgcolor='#0f172a')

    # Global styles
    dot.attr('node', shape='box', style='rounded,filled', fontname='Segoe UI')
    dot.attr('edge', color='#64748b', penwidth='2')

    # Title
    with dot.subgraph(name='cluster_title') as c:
        c.attr(label='', style='invis')
        c.node('title', '🙏 Samdarshi — Digital Heritage Archive Architecture\nAI-Powered Institutional Archive for Dr. B.R. Ambedkar | SIH 2026 | Problem #26096',
               shape='none', fontsize='18', fontcolor='#f1f5f9', fontname='Segoe UI Bold')

    # ========== PRESENTATION LAYER ==========
    with dot.subgraph(name='cluster_presentation') as c:
        c.attr(label='PRESENTATION LAYER', style='rounded,filled', color='#1e293b',
               fillcolor='#1e293b', fontcolor='#ffffff', fontsize='14', fontname='Segoe UI Bold')

        c.node('kiosk', '🖐️ Interactive Kiosk\n24" Capacitive Touchscreen\nRaspberry Pi 5 (4GB)\nElectron + React + TypeScript\nVoice I/O + Audio Narration\nAuto-boot Kiosk Mode',
               fillcolor='#4f46e5', fontcolor='#ffffff', fontsize='11')

        c.node('display', '🖥️ Smart Display (Optional)\n65" Monitor / Smart TV\nDocumentary Loop\nPhoto Slideshow\nAmbient Content',
               fillcolor='#7c3aed', fontcolor='#ffffff', fontsize='10')

        c.node('ocr_scanner', '📄 OCR Scanner (Optional)\nA4 Flatbed / Document Cam\nAuto-digitization\nManuscript Processing',
               fillcolor='#7c3aed', fontcolor='#ffffff', fontsize='10')

        c.node('admin', '💻 Admin Panel\nLaptop / Workstation\nContent Management\nAnalytics Dashboard',
               fillcolor='#64748b', fontcolor='#ffffff', fontsize='10')

    # ========== NETWORK ==========
    dot.node('network', '🌐 LOCAL NETWORK — Gigabit Ethernet + WiFi 6\nDAIC Institutional Network',
             shape='box', style='rounded,filled', fillcolor='#f59e0b', fontcolor='#ffffff', fontsize='12', fontname='Segoe UI Bold')

    # ========== BACKEND ==========
    with dot.subgraph(name='cluster_backend') as c:
        c.attr(label='BACKEND SERVICES', style='rounded,filled', color='#0f172a',
               fillcolor='#0f172a', fontcolor='#ffffff', fontsize='14', fontname='Segoe UI Bold')

        c.node('api', '⚡ FastAPI Backend\nREST API + WebSocket\nJWT Auth + Streaming\nContent Management',
               fillcolor='#059669', fontcolor='#ffffff', fontsize='11')

        c.node('celery', '🔄 Celery Task Queue\nOCR Jobs\nEmbedding Generation\nTranscription Tasks',
               fillcolor='#059669', fontcolor='#ffffff', fontsize='10')

    # ========== DATABASE ==========
    with dot.subgraph(name='cluster_database') as c:
        c.attr(label='DATA LAYER', style='rounded,filled', color='#1e3a5f',
               fillcolor='#1e3a5f', fontcolor='#ffffff', fontsize='14', fontname='Segoe UI Bold')

        c.node('postgres', '🐘 PostgreSQL 16\nDocuments, Metadata\nUsers, Sessions, Analytics\nDublin Core Schema',
               shape='cylinder', fillcolor='#3b82f6', fontcolor='#ffffff', fontsize='11')

        c.node('pgvector', '🧮 pgvector\nEmbedding Storage\nHNSW Index\nSemantic Search',
               shape='cylinder', fillcolor='#3b82f6', fontcolor='#ffffff', fontsize='10')

        c.node('meili', '🔍 Meilisearch\nFull-Text Search\nTypo-Tolerant\nFaceted Filters',
               shape='cylinder', fillcolor='#3b82f6', fontcolor='#ffffff', fontsize='10')

        c.node('redis', '🟥 Redis 7\nSession Cache\nQuery Cache\nRate Limiting',
               shape='cylinder', fillcolor='#3b82f6', fontcolor='#ffffff', fontsize='10')

    # ========== STORAGE ==========
    with dot.subgraph(name='cluster_storage') as c:
        c.attr(label='FILE STORAGE', style='rounded,filled', color='#164e63',
               fillcolor='#164e63', fontcolor='#ffffff', fontsize='14', fontname='Segoe UI Bold')

        c.node('minio', '🪣 MinIO S3 Store\nPDFs, Scans, Images\nAudio Files (Speeches)\nVideo Files (Documentaries)\n10K+ Objects',
               shape='cylinder', fillcolor='#0891b2', fontcolor='#ffffff', fontsize='11')

    # ========== AI/ML ==========
    with dot.subgraph(name='cluster_ai') as c:
        c.attr(label='AI / ML SERVICES', style='rounded,filled', color='#581c87',
               fillcolor='#581c87', fontcolor='#ffffff', fontsize='14', fontname='Segoe UI Bold')

        c.node('rag', '📚 RAG Engine\nLlama 3 8B (Ollama)\nHybrid Retrieval\nCross-Encoder Rerank\nCitations + Sources',
               fillcolor='#a855f7', fontcolor='#ffffff', fontsize='11')

        c.node('embeddings', '🔢 Embeddings\nsentence-transformers\n384-dim vectors\nMultilingual',
               fillcolor='#a855f7', fontcolor='#ffffff', fontsize='10')

        c.node('ocr', '📄 OCR Engine\nTesseract 5 + EasyOCR\nDevanagari + English\nSanskrit Support',
               fillcolor='#ef4444', fontcolor='#ffffff', fontsize='10')

        c.node('tts', '🗣️ Text-to-Speech\nCoqui TTS + Indic TTS\nEnglish + Hindi + Marathi\nNatural Voices',
               fillcolor='#ef4444', fontcolor='#ffffff', fontsize='10')

        c.node('stt', '🎤 Speech-to-Text\nWhisper.cpp\nVoice Queries\nMultilingual',
               fillcolor='#ef4444', fontcolor='#ffffff', fontsize='10')

        c.node('preprocess', '🖼️ Image Preprocessing\nOpenCV\nDeskew, Denoise\nBinarize, Enhance',
               fillcolor='#ef4444', fontcolor='#ffffff', fontsize='10')

    # ========== INDIC NLP ==========
    with dot.subgraph(name='cluster_nlp') as c:
        c.attr(label='INDIC NLP SERVICES', style='rounded,filled', color='#991b1b',
               fillcolor='#991b1b', fontcolor='#ffffff', fontsize='12', fontname='Segoe UI Bold')

        c.node('lang_detect', 'Language Detection\nFastText\nScript Detection',
               fillcolor='#f97316', fontcolor='#ffffff', fontsize='9')

        c.node('transliteration', 'Transliteration\nSanskrit → Roman\nPhonetic Mapping',
               fillcolor='#f97316', fontcolor='#ffffff', fontsize='9')

        c.node('spellcheck', 'Spell Check\nCustom Dictionary\nAmbedkar Vocabulary',
               fillcolor='#f97316', fontcolor='#ffffff', fontsize='9')

        c.node('content_mgr', 'Content Manager\nMetadata Tagger\nAuto-Classification\nDublin Core',
               fillcolor='#f97316', fontcolor='#ffffff', fontsize='9')

        c.node('monitoring', 'Monitoring\nPrometheus + Grafana\nSystem Health\nUsage Analytics',
               fillcolor='#f97316', fontcolor='#ffffff', fontsize='9')

        c.node('docker_deploy', 'Docker Compose\nSingle-Command Deploy\nAll Services Containerized',
               fillcolor='#0ea5e9', fontcolor='#ffffff', fontsize='9')

    # ========== CONTENT SOURCES ==========
    with dot.subgraph(name='cluster_content') as c:
        c.attr(label='KNOWLEDGE BASE SOURCES (Public Domain)', style='rounded,filled', color='#334155',
               fillcolor='#334155', fontcolor='#ffffff', fontsize='12', fontname='Segoe UI Bold')

        c.node('src_baws', 'Dr. Ambedkar Writings\nBAWS Volumes 1-22\nambedkar.org, DAIC',
               fillcolor='#64748b', fontcolor='#ffffff', fontsize='10')

        c.node('src_cad', 'Constituent Assembly Debates\n165 Volumes\nloksabha.nic.in',
               fillcolor='#64748b', fontcolor='#ffffff', fontsize='10')

        c.node('src_constitution', 'Indian Constitution\nOriginal + Amendments\nlegislative.gov.in',
               fillcolor='#64748b', fontcolor='#ffffff', fontsize='10')

        c.node('src_audio', 'Speeches & Audio\nArchival Recordings\nDAIC Collection',
               fillcolor='#64748b', fontcolor='#ffffff', fontsize='10')

        c.node('src_manuscripts', 'Manuscripts & Letters\nDAIC Archives\nPhysical → Digital',
               fillcolor='#64748b', fontcolor='#ffffff', fontsize='10')

        c.node('src_wikimedia', 'Wikimedia Commons\n28+ Ambedkar Images\nCC BY-SA License',
               fillcolor='#64748b', fontcolor='#ffffff', fontsize='10')

        c.node('src_archive', 'Internet Archive\nBooks, Recordings\nPublic Domain',
               fillcolor='#64748b', fontcolor='#ffffff', fontsize='10')

    # ========== EDGES: Presentation to Network ==========
    dot.edge('kiosk', 'network', style='endArrow=classic')
    dot.edge('display', 'network', style='endArrow=classic')
    dot.edge('ocr_scanner', 'network', style='endArrow=classic')
    dot.edge('admin', 'network', style='endArrow=classic')

    # ========== EDGES: Network to Backend ==========
    dot.edge('network', 'api', style='endArrow=classic')

    # ========== EDGES: Backend to Data ==========
    dot.edge('api', 'postgres', style='endArrow=classic')
    dot.edge('api', 'pgvector', style='endArrow=classic')
    dot.edge('api', 'meili', style='endArrow=classic')
    dot.edge('api', 'redis', style='endArrow=classic')
    dot.edge('api', 'minio', style='endArrow=classic')
    dot.edge('api', 'rag', style='endArrow=classic')
    dot.edge('api', 'ocr', style='endArrow=classic')
    dot.edge('api', 'tts', style='endArrow=classic')
    dot.edge('api', 'stt', style='endArrow=classic')
    dot.edge('api', 'celery', style='endArrow=classic')

    # Celery to services
    dot.edge('celery', 'ocr', style='endArrow=classic;dashed')
    dot.edge('celery', 'embeddings', style='endArrow=classic;dashed')
    dot.edge('celery', 'minio', style='endArrow=classic;dashed')

    # RAG to databases
    dot.edge('rag', 'pgvector', style='endArrow=classic')
    dot.edge('rag', 'meili', style='endArrow=classic')

    # Embeddings to pgvector
    dot.edge('embeddings', 'pgvector', style='endArrow=classic')

    # Preprocessing to OCR
    dot.edge('preprocess', 'ocr', style='endArrow=classic')

    # ========== EDGES: Content to Processing ==========
    dot.edge('src_baws', 'preprocess', style='endArrow=classic;dashed')
    dot.edge('src_cad', 'preprocess', style='endArrow=classic;dashed')
    dot.edge('src_manuscripts', 'preprocess', style='endArrow=classic;dashed')

    # ========== KEY FEATURES ==========
    with dot.subgraph(name='cluster_features') as c:
        c.attr(label='', style='invis')
        c.node('features', 'KEY FEATURES: ✓ AI Q&A with verified citations | ✓ Multilingual (EN/HI/MR/SA) | ✓ OCR Digitization | ✓ TTS + STT (voice I/O) | ✓ Interactive Timeline (500+ events) | ✓ Audio-Visual Archive | ✓ Semantic Search | ✓ Offline-first | ✓ WCAG 2.1 AA accessible | ✓ Docker Compose deploy | ✓ Zero licensing costs',
               shape='box', style='rounded,filled', fillcolor='#f1f5f9', fontcolor='#0f172a',
               fontsize='10', fontname='Segoe UI')

    # ========== DEPLOYMENT NOTE ==========
    with dot.subgraph(name='cluster_deploy') as c:
        c.attr(label='', style='invis')
        c.node('deploy', 'DEPLOYMENT: Docker Compose (1 command) → DAIC server / any institutional server | Kiosk: Auto-boot Electron app | Offline-capable | No cloud dependency | Hardware: ~₹25,000/kiosk | Software: 100% open-source (MIT License)',
               shape='box', style='rounded,filled', fillcolor='#1e293b', fontcolor='#94a3b8',
               fontsize='9', fontname='Segoe UI')

    # Render
    output_path = dot.render('samdarshi_architecture', cleanup=True)
    print(f"Architecture diagram saved to: {output_path}")
    return output_path

if __name__ == '__main__':
    create_architecture_diagram()
