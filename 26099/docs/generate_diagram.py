"""Generate CodeOne architecture diagram as PNG."""

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe

COLORS = {
    'bg': '#0f172a', 'box': '#1e3a5f', 'external': '#334155',
    'ai1': '#3b82f6', 'ai2': '#8b5cf6', 'ai3': '#d946ef', 'ai4': '#10b981',
    'ml': '#6366f1', 'db': '#1e3a8a',
    'text': '#e2e8f0', 'subtext': '#94a3b8',
    'arrow': '#475569', 'accent': '#d946ef',
}

fig, ax = plt.subplots(figsize=(20, 13))
fig.patch.set_facecolor(COLORS['bg'])
ax.set_facecolor(COLORS['bg'])
ax.set_xlim(-10, 10)
ax.set_ylim(-6, 7)
ax.axis('off')

def draw_box(ax, x, y, w, h, text, sub='', color='#1e3a5f', text_color='white'):
    b = FancyBboxPatch((x - w/2, y - h/2), w, h,
                      boxstyle="round,pad=0.02,rounding_size=0.15",
                      facecolor=color, edgecolor='#475569', linewidth=1.5, alpha=0.95)
    ax.add_patch(b)
    if sub:
        ax.text(x, y + 0.03, text, ha='center', va='center', fontsize=8, fontweight='bold', color=text_color)
        ax.text(x, y - 0.03, sub, ha='center', va='center', fontsize=6.5, color=COLORS['subtext'])
    else:
        ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=text_color)

def draw_arrow(ax, x1, y1, x2, y2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=COLORS['arrow'], lw=1.2))

# Title
ax.text(0, 6.5, 'CodeOne - System Architecture', ha='center', fontsize=20, fontweight='bold', color='white',
        path_effects=[pe.withStroke(linewidth=1, foreground=COLORS['accent'])])
ax.text(0, 6.1, 'AI-Driven National Unified Material Master Framework', ha='center', fontsize=12, color=COLORS['subtext'])

# External systems
for lbl, sub, x in [('CPSE-SAP (IOCL)', 'SAP IDocs', -6), ('CPSE-ERP (NTPC)', 'REST API', 0), ('CSV/Excel Import', 'Manual', 6)]:
    draw_box(ax, x, 5, 2.5, 0.8, lbl, sub, COLORS['external'])

# Ingestion
for lbl, x in [('SAP IDoc Adapter', -6), ('REST Ingest', 0), ('CSV Importer', 6)]:
    draw_box(ax, x, 3.5, 2.5, 0.7, lbl, '', COLORS['external'])

# Normalizer
draw_box(ax, 0, 2.3, 5, 0.7, 'Normalization Engine', 'IS codes · Grades · UOMs', COLORS['ai1'])

# Backend APIs
for lbl, sub, x in [('Auth', 'JWT', -7), ('Materials', 'CRUD', -4.5), ('Matching', 'AI Engine', -2), ('CNMC', 'Codes', 0.5), ('Analytics', 'Charts', 3), ('Admin', 'CPSE', 5.5)]:
    draw_box(ax, x, 1, 2.2, 0.5, lbl, sub, COLORS['external'])

# AI Pipeline
for lbl, color, x in [('Stage 1: Normalizer', COLORS['ai1'], -4.5),
                        ('Stage 2: Lexical + Semantic', COLORS['ai2'], -1.5),
                        ('Stage 3: Cross-Encoder', COLORS['ai3'], 1.5),
                        ('Stage 4: Classification', COLORS['ai4'], 4.5)]:
    draw_box(ax, x, -0.5, 2.5, 0.7, lbl, '', color)

for i in range(3):
    draw_arrow(ax, -4.5 + i * 3 + 1.25, -0.5, -4.5 + (i+1) * 3 - 1.25, -0.5)

# ML Models
draw_box(ax, 8, 1, 3.5, 4.5, '', '', COLORS['external'])
draw_box(ax, 8, 2.5, 3, 0.5, 'Bi-Encoder', 'all-MiniLM-L6-v2', COLORS['ml'])
draw_box(ax, 8, 1.5, 3, 0.5, 'Cross-Encoder', 'ms-marco-MiniLM', COLORS['ml'])
draw_box(ax, 8, 0.5, 3, 0.5, 'RapidFuzz', 'Lexical similarity', COLORS['ml'])
draw_box(ax, 8, -0.5, 3, 0.5, 'Scikit-learn', 'Numeric features', COLORS['ml'])
draw_arrow(ax, -1.5, -0.85, 6.5, 2.5)
draw_arrow(ax, 1.5, -0.85, 6.5, 1.5)
draw_arrow(ax, -4.5, -0.85, 6.5, 0.5)

# Database
draw_box(ax, 0, -2.3, 8, 1.2, 'PostgreSQL Database', '', COLORS['external'])
for i, (lbl, sub) in enumerate([('Materials', 'Normalized'), ('MatchProposals', 'AI results'), ('CNMCCodes', 'Hashed'), ('AuditLogs', 'Traceability'), ('Users', 'Auth')]):
    draw_box(ax, -3.5 + i * 1.75, -2.3, 1.5, 0.5, lbl, sub, COLORS['db'])

# Frontend
draw_box(ax, 0, -4.2, 9, 1.4, 'Frontend - React + TypeScript + Tailwind', '', COLORS['external'])
for i, (lbl, sub) in enumerate([('Login', 'JWT'), ('Dashboard', 'KPIs'), ('Materials', 'Explorer'), ('Matching', 'AI'), ('Review', 'Queue'), ('Analytics', 'Charts'), ('Admin', 'CPSE')]):
    draw_box(ax, -4 + i * 1.33, -4.2, 1.1, 0.5, lbl, sub, COLORS['box'])

# Connections
for x1, y1, x2, y2 in [
    (-6, 4.6, -6, 3.85), (0, 4.6, 0, 3.85), (6, 4.6, 6, 3.85),
    (-6, 3.15, -2, 2.65), (0, 3.15, 0, 2.65), (6, 3.15, 2, 2.65),
    (0, 1.95, -7, 1.3), (0, 1.95, -4.5, 1.3), (0, 1.95, -2, 1.3),
    (0, 1.95, 0.5, 1.3), (0, 1.95, 3, 1.3), (0, 1.95, 5.5, 1.3),
]:
    draw_arrow(ax, x1, y1, x2, y2)

for x in [-3.5, -1.75, 0, 1.75, 3.5]:
    draw_arrow(ax, x, -0.15, x, -1.7)
for x in [-4, -2.67, -1.33, 0, 1.33, 2.67, 4]:
    draw_arrow(ax, x, -3.5, x, -3.95)

# Docker badge
ax.text(0, -5.7, 'Docker Compose: docker-compose up --build', ha='center',
        fontsize=11, color=COLORS['accent'], fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.5', facecolor=COLORS['box'], edgecolor=COLORS['accent']))

plt.tight_layout()
plt.savefig('docs/architecture.png', dpi=150, bbox_inches='tight', facecolor=COLORS['bg'])
print("Saved: docs/architecture.png")
