/**
 * EKADHARA — Review & Compliance Page
 * Brutal honest self-assessment for Smart India Hackathon 2026 PS-26145 NTRO
 */

import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, FileText, ArrowUpRight } from 'lucide-react';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:        'var(--bg-primary)',
  surface:   'var(--bg-secondary)',
  surfaceHi: 'var(--bg-card-hover)',
  border:    'var(--border-color)',
  borderHi:  'var(--border-active)',
  text:      'var(--text-primary)',
  textSec:   'var(--text-secondary)',
  textDim:   'var(--text-muted)',
  accent:    'var(--accent-cyan)',
  red:       'var(--accent-red)',
  orange:    'var(--accent-orange)',
  amber:     'var(--accent-yellow)',
  green:     'var(--accent-green)',
  purple:    'var(--accent-purple)',
  pink:      'var(--accent-pink)',
  teal:      'var(--accent-teal)',
};

const STATUS_META: Record<string, { c: string; bg: string; border: string; label: string }> = {
  compliant: { c: C.green, bg: 'var(--color-success-dim)', border: 'var(--color-success-dim)', label: 'Functional' },
  partial:   { c: C.amber, bg: 'var(--chip-estimated-bg)', border: 'var(--chip-estimated-border)', label: 'Needs Work' },
  missing:   { c: C.red,   bg: 'var(--chip-unverified-bg)', border: 'var(--chip-unverified-border)', label: 'Incomplete' },
};

interface PageInfo {
  route: string;
  file: string;
  title: string;
  description: string;
  assessment: string;
}

interface MissingItem {
  rank: number;
  title: string;
  why: string;
}

const PAGES: PageInfo[] = [
  { route: '/', file: 'Dashboard.tsx', title: 'Dashboard (Home)', description: 'Landing page with KPI grid, threat breakdown chart, recent alerts, and pipeline status. Shows total flows, alerts, threats per type, and uptime.', assessment: 'Functional' },
  { route: '/live-threats', file: 'LiveThreats.tsx', title: 'Live Threat Feed', description: 'Real-time alert stream with severity filtering, search, and expandable evidence entries. Auto-refreshes every 2 seconds.', assessment: 'Functional' },
  { route: '/network-map', file: 'NetworkMap.tsx', title: 'Network Topology', description: 'Force-directed graph visualization of network nodes, connections, and attack paths with node drift animation.', assessment: 'Functional' },
  { route: '/analytics', file: 'Analytics.tsx', title: 'Analytics', description: 'Severity distribution donut chart, alert timeline, protocol breakdown bars, and multi-category risk radar chart.', assessment: 'Functional' },
  { route: '/ai-analyzer', file: 'AIAnalyzer.tsx', title: 'AI Threat Analyzer', description: 'ML pipeline dashboard, inference engine stats, model comparison (IsolationForest vs Logistic Regression vs Rule Engine), and feature importance.', assessment: 'Needs Work' },
  { route: '/attack', file: 'AttackPanel.tsx', title: 'Attack Simulation', description: 'Launch 8 attack types with configurable parameters, real-time detection results, time-to-detect metrics, and DIODE MODE toggle.', assessment: 'Functional' },
  { route: '/materials', file: 'MaterialsPage.tsx', title: 'Evidence & Materials', description: 'Threat evidence/samples data grid with hash values, threat class, confidence, and similarity matching analysis.', assessment: 'Functional' },
  { route: '/activity', file: 'ActivityPage.tsx', title: 'Activity Log', description: 'System event log with filtering by type, pipeline step visualization, and full audit trail.', assessment: 'Functional' },
  { route: '/integrations', file: 'IntegrationPage.tsx', title: 'Integrations', description: 'External system connections: SIEM, SOC, Fluent Bit, REST API, Windows Agent. OCSF format support.', assessment: 'Needs Work' },
  { route: '/admin', file: 'AdminPage.tsx', title: 'Administration', description: 'User management, pipeline throughput metrics, and model information across three ML classifiers.', assessment: 'Functional' },
];

const MISSING: MissingItem[] = [
  { rank: 1, title: 'Real ML Inference with Actual Detection Logic', why: 'The AI is template text generation, not ML inference. Replace with ONNX-compiled IsolationForest.' },
  { rank: 2, title: 'Real Throughput Benchmark', why: 'Hardcoded strings show ~10K flows/s. Actual throughput is sub-1 flow/sec. Measure real processing time.' },
  { rank: 3, title: '"No Decryption" Architecture Diagram', why: 'JA3 analysis exists but is never framed as metadata-only inspection. Add a labeled architecture diagram.' },
  { rank: 4, title: 'Live Demo Video (60-90s)', why: 'The #1 differentiator for hackathon judges. Walk through the platform showing detection in action.' },
  { rank: 5, title: 'Transparent Demo Mode Banner', why: 'Add a visible banner: "Running in DEMO mode — backend not connected. All data simulated." Build trust through transparency.' },
];

// ── Styles ───────────────────────────────────────────────────────────────────
const MONO = '"JetBrains Mono", "Fira Code", monospace';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const cardStyle: React.CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
  boxShadow: '0 1px 3px var(--shadow-sm)',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, fontFamily: MONO,
  letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
  paddingBottom: 8, marginBottom: 16,
  borderBottom: `1px solid ${C.border}`,
};

// ── Components ───────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string; count?: { c: number; p: number; m: number } }> = ({ label, count }) => (
  <div style={{ marginBottom: 20, marginTop: 40, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap: 12 }}>
    <div style={sectionTitle}>{label}</div>
    {count && (
      <div style={{ display:'flex', gap: 8 }}>
        {count.c > 0 && <span style={{ fontFamily:MONO, fontSize:10, fontWeight:600, color:C.green, background:'var(--color-success-dim)', padding:'3px 10px', borderRadius:4, border:`1px solid rgba(34,197,94,0.15)` }}>{count.c} Functional</span>}
        {count.p > 0 && <span style={{ fontFamily:MONO, fontSize:10, fontWeight:600, color:C.amber, background:'var(--chip-estimated-bg)', padding:'3px 10px', borderRadius:4, border:`1px solid rgba(234,179,8,0.15)` }}>{count.p} Needs Work</span>}
        {count.m > 0 && <span style={{ fontFamily:MONO, fontSize:10, fontWeight:600, color:C.red, background:'var(--chip-unverified-bg)', padding:'3px 10px', borderRadius:4, border:`1px solid rgba(239,68,68,0.15)` }}>{count.m} Incomplete</span>}
      </div>
    )}
  </div>
);

const PageCard: React.FC<{ page: PageInfo }> = ({ page }) => (
  <div style={{
    ...cardStyle,
    display:'flex', gap: 16, padding: 16,
  }}>
    {/* Route icon */}
    <div style={{
      width: 42, height: 42, borderRadius: 8,
      background: `${C.accent}08`, border: `1px solid ${C.accent}20`,
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0,
    }}>
      <FileText size={18} color={C.accent} strokeWidth={1.5} />
    </div>

    {/* Content */}
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 6, flexWrap:'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{page.title}</span>
        <span style={{
          fontFamily: MONO, fontSize: 10, color: C.textDim,
          background: `${C.accent}06`, padding: '2px 8px', borderRadius: 4,
          border: `1px solid ${C.border}`, fontVariantNumeric: 'tabular-nums',
        }}>{page.route}</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.textDim, opacity: 0.6 }}>{page.file}</span>
      </div>

      <p style={{ fontSize: 12, lineHeight: 1.7, color: C.textSec, margin: 0, marginBottom: 10 }}>{page.description}</p>

      <div style={{
        display:'inline-flex', alignItems:'center', gap: 6,
        padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 600,
        background: page.assessment === 'Functional' ? 'var(--color-success-dim)' : 'var(--chip-estimated-bg)',
        color: page.assessment === 'Functional' ? C.green : C.amber,
        border: `1px solid ${page.assessment === 'Functional' ? 'var(--color-success-dim)' : 'var(--chip-estimated-border)'}`,
        fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {page.assessment === 'Functional' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
        {page.assessment}
      </div>
    </div>
  </div>
);

const ComplianceRow: React.FC<{ item: { label: string; detail: string; status: string } }> = ({ item }) => {
  const meta = STATUS_META[item.status];
  const Icon = item.status === 'compliant' ? CheckCircle2 : item.status === 'partial' ? AlertTriangle : XCircle;
  return (
    <div style={{
      display:'flex', gap: 16, alignItems:'flex-start',
      padding: '16px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>{item.label}</div>
        <div style={{ fontSize: 12, lineHeight: 1.7, color: C.textSec, whiteSpace: 'pre-line' }}>{item.detail}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap: 6, padding: '4px 12px', borderRadius: 5,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
          background: meta.bg, color: meta.c, border: `1px solid ${meta.border}`,
          fontFamily: MONO, textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          <Icon size={12} />{meta.label}
        </span>
      </div>
    </div>
  );
};

const PriorityItem: React.FC<{ item: MissingItem; index: number }> = ({ item, index }) => (
  <div style={{
    display:'flex', gap: 16, alignItems:'flex-start',
    padding: '14px 0',
    borderBottom: index < MISSING.length - 1 ? `1px solid ${C.border}` : 'none',
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: `${C.red}08`, border: `1px solid ${C.red}20`,
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0,
      fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.red,
    }}>{item.rank}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.7, color: C.textSec }}>{item.why}</div>
    </div>
  </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const ReviewPage = () => {
  const compliantCount = 3;
  const partialCount = 3;
  const missingCount = 0;

  return (
    <div style={{ minHeight:'100%', background: C.bg, color: C.text, fontFamily: '"Inter",system-ui,sans-serif', fontSize: 13, lineHeight: 1.6 }}>
      <style>{`::selection{background:var(--accent-cyan);color:${C.text}}:focus-visible{outline:1.5px solid var(--border-active);outline-offset:2px;border-radius:3px}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}`}</style>

      {/* HEADER */}
      <header style={{
        position:'sticky', top:0, zIndex:40,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', display:'flex', alignItems:'center', height: 52, gap: 14 }}>
          <ShieldCheck size={18} color={C.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '3px', color: C.text }}>EKADHARA</span>
          <div style={{ width:1, height:16, background: C.border }} />
          <span style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.8px' }}>PS-26145 · REVIEW & COMPLIANCE</span>
          <div style={{ flex:1 }} />
          <span style={{ fontSize: 10, color: C.textDim, fontFamily: MONO }}>v2.4 · 2026-09-17</span>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 28px 64px' }}>

        {/* Title block */}
        <section style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: C.text, marginBottom: 4 }}>
            System Review & Compliance
          </h1>
          <p style={{ fontSize: 13, color: C.textSec, maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
            Page-by-page breakdown and requirement-by-requirement audit against the PS-26145 problem statement
          </p>
        </section>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 40 }}>
          {[
            { label: 'Pages Assessed', value: PAGES.length.toString(), color: C.accent, sub: '10 total' },
            { label: 'Functional', value: compliantCount.toString(), color: C.green, sub: 'passing' },
            { label: 'Needs Work', value: partialCount.toString(), color: C.amber, sub: 'partial' },
            { label: 'Top Gap', value: MISSING[0].title.slice(0, 25) + '...', color: C.red, sub: 'priority #1' },
          ].map((s, i) => (
            <div key={i} style={{
              ...cardStyle, padding: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, fontFamily: MONO, letterSpacing: '1px', color: C.textDim, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: MONO }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* SECTION 1: Pages */}
        <SectionHeader label="01 / Page Breakdown" />

        <div style={{ display:'flex', flexDirection:'column', gap: 8, marginBottom: 48 }}>
          {PAGES.map((page) => (
            <div key={page.route} style={{
              ...cardStyle,
              display:'flex', gap: 16, padding: 16,
            }}>
              {/* Icon */}
              <div style={{
                width: 42, height: 42, borderRadius: 8,
                background: `${C.accent}06`, border: `1px solid ${C.border}`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0,
                fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.accent,
                letterSpacing: '0.5px',
              }}>
                {page.title.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 6, flexWrap:'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{page.title}</span>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, color: C.textDim,
                    background: `${C.accent}04`, padding: '2px 8px', borderRadius: 4,
                    border: `1px solid ${C.border}`, fontVariantNumeric: 'tabular-nums',
                  }}>{page.route}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: C.textDim, opacity: 0.5 }}>{page.file}</span>
                </div>

                <p style={{ fontSize: 12, lineHeight: 1.7, color: C.textSec, margin: 0, marginBottom: 10 }}>{page.description}</p>

                <span style={{
                  display:'inline-flex', alignItems:'center', gap: 6,
                  padding: '4px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.5px',
                  background: page.assessment === 'Functional' ? 'var(--color-success-dim)' : 'var(--chip-estimated-bg)',
                  color: page.assessment === 'Functional' ? C.green : C.amber,
                  border: `1px solid ${page.assessment === 'Functional' ? 'var(--color-success-dim)' : 'var(--chip-estimated-border)'}`,
                }}>
                  {page.assessment === 'Functional' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                  {page.assessment}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION 2: Compliance */}
        <SectionHeader label="02 / PS-26145 Compliance" />

        <div style={{ ...cardStyle, padding: '20px 24px', marginBottom: 48 }}>
          {[
            { label: 'a) Read-Only Ingest (No Return Path)', detail: 'DIODE badge in HUD bar shows READ-ONLY mode. WebSocket is one-directional (server to client). DIODE MODE toggle in AttackPanel.\n\nGAP: This is UI-level design only. No actual unidirectional gateway exists. If a real backend connected, nothing prevents two-way communication.', status: 'partial' },
            { label: 'b) No Payload Decryption (JA3/JA4 Analysis)', detail: 'TLS anomaly detection with JA3 hash matching in evidence. References TLS fingerprinting in AI Analyzer.\n\nGAP: No explicit statement that payload content is never decrypted. No JA4 support. No architecture diagram showing the no-decryption boundary.', status: 'partial' },
            { label: 'c) Streaming Not Batch Processing', detail: 'WebSocket push delivery for real-time alerts and flows. Incremental flow production. LIVE/DEMO status in header.\n\nGAP: Falls back to setInterval at 2-second intervals — polling that looks like streaming. No backpressure handling.', status: 'partial' },
            { label: 'd) Throughput Target (10K+ Flows/Sec)', detail: 'Header shows flows/sec. Pipeline throughput displays ~10K flows/s in AdminPage.\n\nGAP: Hardcoded strings, not measured throughput. MockBackend caps at ~0.5 flows/second. A judge in DevTools will see the discrepancy.', status: 'partial' },
            { label: 'e) Standardized Alert Schema', detail: 'Complete structured schema: id, timestamp, threat_type, confidence, severity, src/dst IP, ports, protocol, evidence, flow_count.', status: 'compliant' },
            { label: 'f) Six Required Threat Categories', detail: 'DDoS (SYN/UDP/ICMP floods), C2 Beaconing (periodic callbacks), DGA/DNS Tunneling (entropy scoring), TLS Anomaly (JA3 fingerprints), Port Scanning (sequential probing), Data Exfiltration (outbound transfers).', status: 'compliant' },
          ].map((item, i) => (
            <ComplianceRow key={i} item={item} />
          ))}
        </div>

        {/* SECTION 3: Top Gaps */}
        <SectionHeader label="03 / Priority Improvements" />

        <div style={{ ...cardStyle, padding: '20px 24px', marginBottom: 48 }}>
          {MISSING.map((item, i) => (
            <PriorityItem key={item.rank} item={item} index={i} />
          ))}
        </div>

        {/* SECTION 4: Threat Categories Detail */}
        <SectionHeader label="04 / Threat Categories Implemented" />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap: 12, marginBottom: 48 }}>
          {[
            { name: 'DDoS', desc: 'SYN/UDP/ICMP flood detection', status: 'Functional', color: C.red },
            { name: 'C2 Beaconing', desc: 'Periodic callback analysis', status: 'Functional', color: C.orange },
            { name: 'DGA / DNS Tunneling', desc: 'Entropy scoring, NXDOMAIN rates', status: 'Functional', color: C.amber },
            { name: 'TLS Anomaly', desc: 'JA3 fingerprint matching', status: 'Needs Work', color: C.teal },
            { name: 'Port Scanning', desc: 'Sequential probe detection', status: 'Functional', color: C.purple },
            { name: 'Data Exfiltration', desc: 'Bulk transfer analysis', status: 'Functional', color: C.pink },
          ].map((cat, i) => (
            <div key={i} style={{
              ...cardStyle, padding: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: cat.color, marginBottom: 4, fontFamily: MONO, letterSpacing:'0.5px' }}>{cat.name}</div>
              <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.6, marginBottom: 8 }}>{cat.desc}</div>
              <span style={{
                fontSize: 10, fontWeight: 600, fontFamily: MONO, textTransform:'uppercase', letterSpacing:'0.5px',
                color: cat.status === 'Functional' ? C.green : C.amber,
              }}>
                {cat.status}
              </span>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default ReviewPage;
