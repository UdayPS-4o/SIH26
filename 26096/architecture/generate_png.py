#!/usr/bin/env python3
"""
Generate Samdarshi Architecture Diagram as PNG using matplotlib
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# Set up the figure
fig, ax = plt.subplots(1, 1, figsize=(28, 22))
ax.set_xlim(0, 28)
ax.set_ylim(0, 22)
ax.axis('off')
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

# Color definitions
COLORS = {
    'title': '#f1f5f9',
    'presentation': '#4f46e5',
    'backend': '#059669',
    'database': '#2563eb',
    'storage': '#0891b2',
    'ai': '#7c3aed',
    'nlp': '#dc2626',
    'content': '#475569',
    'infra': '#f59e0b',
    'text_dark': '#0f172a',
    'text_light': '#ffffff',
    'text_muted': '#94a3b8',
    'accent_gold': '#c9a227',
    'feature_bg': '#f1f5f9',
}

def draw_box(ax, x, y, w, h, label, sublabel='', color='#4f46e5', text_color='#ffffff', fontsize=9):
    """Draw a rounded rectangle box with text"""
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.3",
                          facecolor=color, edgecolor='white', linewidth=1.5, alpha=0.9)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, label, ha='center', va='center',
            color=text_color, fontsize=fontsize, fontweight='bold', wrap=True)
    if sublabel:
        ax.text(x + w/2, y + h/2 - 0.3, sublabel, ha='center', va='center',
                color=text_color, fontsize=fontsize-2, alpha=0.8, wrap=True)

def draw_cylinder(ax, x, y, w, h, label, color='#3b82f6'):
    """Draw a database cylinder"""
    # Cylinder body
    rect = FancyBboxPatch((x, y + h*0.15), w, h*0.7, boxstyle="round,pad=0.01",
                          facecolor=color, edgecolor='white', linewidth=1.5, alpha=0.9)
    ax.add_patch(rect)
    # Top ellipse
    ell = plt.matplotlib.patches.Ellipse((x + w/2, y + h*0.85), w, h*0.15,
                                          facecolor=color, edgecolor='white', linewidth=1.5, alpha=0.9)
    ax.add_patch(ell)
    # Bottom ellipse
    ell2 = plt.matplotlib.patches.Ellipse((x + w/2, y + h*0.15), w, h*0.15,
                                           facecolor=color, edgecolor='white', linewidth=1.5, alpha=0.9)
    ax.add_patch(ell2)
    ax.text(x + w/2, y + h/2, label, ha='center', va='center',
            color='#ffffff', fontsize=8, fontweight='bold')

def draw_arrow(ax, x1, y1, x2, y2, color='#64748b', style='->', dashed=False):
    """Draw an arrow between two points"""
    kwargs = dict(arrowstyle=style, color=color, lw=1.5,
                  connectionstyle='arc3,rad=0')
    if dashed:
        kwargs['linestyle'] = 'dashed'
    arrow = FancyArrowPatch((x1, y1), (x2, y2), **kwargs)
    ax.add_patch(arrow)

def draw_layer_header(ax, x, y, w, h, label, color='#1e293b'):
    """Draw a layer header bar"""
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.01",
                          facecolor=color, edgecolor=color, linewidth=0)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, label, ha='center', va='center',
            color='#ffffff', fontsize=11, fontweight='bold')

# ===== TITLE =====
ax.text(14, 21.2, '* SAMDARSHI - Digital Heritage Archive Architecture *',
        ha='center', va='center', color=COLORS['title'], fontsize=22, fontweight='bold')
ax.text(14, 20.6, 'AI-Powered Institutional Archive for Dr. B.R. Ambedkar  |  SIH 2026  |  Problem #26096  |  Hardware + Software Integration',
        ha='center', va='center', color=COLORS['text_muted'], fontsize=11)

# ===== PRESENTATION LAYER =====
draw_layer_header(ax, 1, 19.5, 26, 0.6, 'PRESENTATION LAYER  [Kiosks + Displays + Admin]')
draw_box(ax, 1.5, 17.8, 5, 1.5, '[KIOSK] Interactive Kiosk\n24" Touchscreen | RPi 5\nElectron + React\nVoice I/O + Audio',
         color=COLORS['presentation'], fontsize=9)
draw_box(ax, 7.5, 18.2, 3.5, 1.0, '[DISPLAY] Smart Display\n65" TV | Ambient\nDocumentary Loop',
         color=COLORS['ai'], fontsize=8)
draw_box(ax, 11.5, 18.2, 3.5, 1.0, '[SCANNER] OCR Scanner\nFlatbed / Doc Cam\nAuto-digitization',
         color=COLORS['ai'], fontsize=8)
draw_box(ax, 15.5, 18.2, 3, 0.9, '[ADMIN] Admin Panel\nContent Mgmt\nAnalytics',
         color=COLORS['content'], fontsize=8)

# ===== NETWORK =====
draw_layer_header(ax, 1, 16.8, 26, 0.5, ' LOCAL NETWORK — Gigabit Ethernet + WiFi 6  |  DAIC Institutional Network', color='#b45309')

# Arrows: Presentation → Network
for i, (bx, by) in enumerate([(4, 17.8), (9.25, 18.2), (13.25, 18.2), (17, 18.2)]):
    draw_arrow(ax, bx, by, bx, 16.8, color=COLORS['presentation'] if i == 0 else COLORS['ai'])

# ===== BACKEND SERVICES =====
draw_layer_header(ax, 1, 15.8, 26, 0.5, ' AI SERVER — Backend Services + AI/ML', color='#064e3b')
draw_box(ax, 1.5, 13.8, 4.5, 1.5, 'FastAPI Backend\nREST API + WebSocket\nJWT Auth | Streaming',
         color=COLORS['backend'], fontsize=9)
draw_box(ax, 1.5, 12.2, 3.5, 1.2, 'Celery Queue\nOCR Jobs\nEmbeddings\nTranscription',
         color=COLORS['backend'], fontsize=8)

# Arrows: Network → Backend
draw_arrow(ax, 8, 16.8, 8, 15.8, color=COLORS['infra'])

# ===== DATABASE LAYER =====
draw_layer_header(ax, 7, 15.8, 12.5, 0.5, '💾  DATA LAYER', color='#1e3a5f')
draw_cylinder(ax, 8, 13.8, 3, 1.2, 'PostgreSQL 16\nDocuments | Metadata\nDublin Core Schema')
draw_cylinder(ax, 12, 14.0, 2.8, 1.0, 'pgvector\nEmbeddings\nHNSW Index')
draw_cylinder(ax, 15.5, 14.0, 2.8, 1.0, 'Meilisearch\nFull-Text Search\nTypo-Tolerant')
draw_cylinder(ax, 19, 14.0, 2.5, 1.0, 'Redis 7\nSession Cache\nRate Limiting')

# Arrows: Backend → Database
for i, (bx, by) in enumerate([(6, 14.5), (6, 13.8), (6, 13.0), (6, 12.8)]):
    targets = [(11.5, 14.5), (13.4, 14.5), (16.9, 14.5), (20.25, 14.5)]
    draw_arrow(ax, bx, by, targets[i][0], targets[i][1], color=COLORS['backend'])

# ===== FILE STORAGE =====
draw_layer_header(ax, 22.5, 15.8, 4.5, 0.5, '📁 STORAGE', color='#164e63')
draw_cylinder(ax, 23, 14.0, 3, 1.2, 'MinIO S3\nPDFs, Images\nAudio, Video')
draw_arrow(ax, 21, 14.5, 23, 14.5, color=COLORS['backend'])

# ===== AI/ML LAYER =====
draw_layer_header(ax, 1, 11.8, 26, 0.5, ' AI / ML SERVICES', color='#581c87')
draw_box(ax, 1.5, 9.8, 4.5, 1.6, 'RAG Engine\nLlama 3 8B (Ollama)\nHybrid Search + Rerank\nCitations + Sources',
         color=COLORS['ai'], fontsize=9)
draw_box(ax, 6.5, 10.0, 3.5, 1.2, 'Embeddings\nsentence-transformers\n384-dim vectors\nMultilingual',
         color=COLORS['ai'], fontsize=9)
draw_box(ax, 10.5, 10.0, 3.5, 1.2, 'OCR Engine\nTesseract 5 + EasyOCR\nDevanagari + English\nSanskrit Support',
         color='#ef4444', fontsize=9)
draw_box(ax, 14.5, 10.0, 3.5, 1.2, 'Text-to-Speech\nCoqui TTS + Indic TTS\nEN + HI + MR\nNatural Voices',
         color='#ef4444', fontsize=9)
draw_box(ax, 18.5, 10.0, 3.2, 1.2, 'Speech-to-Text\nWhisper.cpp\nVoice Queries\nMultilingual',
         color='#ef4444', fontsize=9)
draw_box(ax, 22.5, 10.0, 3.2, 1.2, 'Image Preprocessing\nOpenCV\nDeskew, Denoise\nBinarize',
         color='#ef4444', fontsize=9)

# Arrows: Backend → AI
ai_targets = [(4, 10.6), (8.25, 10.6), (12.25, 10.6), (16.25, 10.6), (20, 10.6), (24, 10.6)]
for i, by in enumerate([13.5, 12.5, 12.5, 12.5, 12.5, 12.5]):
    draw_arrow(ax, 4, by, ai_targets[i][0], ai_targets[i][1], color=COLORS['ai'] if i < 2 else '#ef4444')

# RAG to DB connections
draw_arrow(ax, 4, 10.2, 9, 14.5, color=COLORS['ai'])
draw_arrow(ax, 4, 10.2, 14, 14.5, color=COLORS['ai'])
draw_arrow(ax, 8, 10.6, 13.4, 14.5, color=COLORS['ai'])

# Preprocess to OCR
draw_arrow(ax, 24, 10.6, 12.25, 10.0, color='#ef4444')

# ===== INDIC NLP =====
draw_layer_header(ax, 1, 9.2, 26, 0.4, 'INDIC NLP SERVICES', color='#991b1b')
draw_box(ax, 1.5, 8.0, 3.5, 0.9, 'Language Detection\nFastText\nScript Detection', color='#f97316', fontsize=8)
draw_box(ax, 5.5, 8.0, 3.5, 0.9, 'Transliteration\nSanskrit → Roman\nPhonetic Mapping', color='#f97316', fontsize=8)
draw_box(ax, 9.5, 8.0, 3.5, 0.9, 'Spell Check\nCustom Dictionary\nAmbedkar Vocabulary', color='#f97316', fontsize=8)
draw_box(ax, 13.5, 8.0, 3.5, 0.9, 'Content Manager\nMetadata Tagger\nAuto-Classification', color='#f97316', fontsize=8)
draw_box(ax, 17.5, 8.0, 3.5, 0.9, 'Monitoring\nPrometheus\nGrafana', color='#f97316', fontsize=8)
draw_box(ax, 21.5, 8.0, 3.5, 0.9, 'Docker Compose\nSingle-Command\nAll Services', color='#0ea5e9', fontsize=8)

# ===== CONTENT SOURCES =====
draw_layer_header(ax, 1, 7.0, 26, 0.4, ' KNOWLEDGE BASE SOURCES (Public Domain)', color='#334155')

sources = [
    (1.5, 5.5, 3.5, 1.2, 'Dr. Ambedkar Writings\nBAWS Volumes 1-22\nambedkar.org, DAIC'),
    (5.5, 5.5, 3.5, 1.2, 'Constituent Assembly\nDebates (CAD)\n165 Volumes'),
    (9.5, 5.5, 3.5, 1.2, 'Indian Constitution\nOriginal + Amendments\nlegislative.gov.in'),
    (13.5, 5.5, 3.5, 1.2, 'Speeches & Audio\nArchival Recordings\nDAIC Collection'),
    (17.5, 5.5, 3.5, 1.2, 'Manuscripts & Letters\nDAIC Archives\nPhysical → Digital'),
    (21.5, 5.5, 3.5, 1.2, 'Wikimedia Commons\n28+ Ambedkar Images\nCC BY-SA License'),
]
for x, y, w, h, label in sources:
    draw_box(ax, x, y, w, h, label, color=COLORS['content'], fontsize=8)

# Arrows: Content → Preprocessing
for i, (x, y, w, h, label) in enumerate(sources):
    draw_arrow(ax, x + w/2, y, x + w/2, 9.2, color=COLORS['content'], style='->')

# ===== KEY FEATURES =====
features_text = ('KEY FEATURES:  ✓ AI Q&A with verified citations  ✓ Multilingual (EN/HI/MR/SA)  '
                 '✓ OCR Digitization  ✓ TTS + STT (voice I/O)  ✓ Interactive Timeline (500+ events)  '
                 '✓ Audio-Visual Archive  ✓ Semantic Search  ✓ Offline-first  '
                 '✓ WCAG 2.1 AA accessible  ✓ Docker Compose deploy  ✓ Zero licensing costs')
ax.text(14, 4.0, features_text, ha='center', va='center', fontsize=9,
        color=COLORS['text_dark'], fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.5', facecolor=COLORS['feature_bg'], edgecolor='#475569', linewidth=1))

# ===== DEPLOYMENT INFO =====
deploy_text = ('DEPLOYMENT: Docker Compose (1 command) → DAIC server / any institutional server  |  '
               'Kiosk: Auto-boot Electron app  |  Offline-capable  |  No cloud dependency  |  '
               'Hardware: ~₹25,000/kiosk  |  Software: 100% open-source (MIT License)')
ax.text(14, 2.5, deploy_text, ha='center', va='center', fontsize=8,
        color=COLORS['text_muted'],
        bbox=dict(boxstyle='round,pad=0.4', facecolor='#1e293b', edgecolor='#475569', linewidth=1))

# ===== TECH STACK LEGEND =====
legend_items = [
    ('#4f46e5', 'Presentation: Electron + React + RPi 5'),
    ('#059669', 'Backend: FastAPI + Celery + Docker'),
    ('#3b82f6', 'Data: PostgreSQL + pgvector + Meilisearch + Redis'),
    ('#0891b2', 'Storage: MinIO S3-compatible'),
    ('#7c3aed', 'AI: Llama 3 8B + RAG + Embeddings'),
    ('#ef4444', 'NLP: Tesseract + EasyOCR + Coqui TTS + Whisper'),
    ('#f97316', 'Indic: Language Detection + Transliteration + Spell Check'),
]
y_start = 1.2
for i, (color, text) in enumerate(legend_items):
    ax.add_patch(plt.Rectangle((1 + i * 4, y_start), 0.3, 0.3, facecolor=color, edgecolor='white', linewidth=1))
    ax.text(1.4 + i * 4, y_start + 0.15, text, ha='left', va='center',
            color=COLORS['text_muted'], fontsize=7)

plt.tight_layout(pad=0.5)
output_path = 'C:/Users/udayps/Desktop/sih/am/architecture/samdarshi_architecture.png'
plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='#0f172a', edgecolor='none')
print(f"Architecture PNG saved to: {output_path}")
plt.close()
