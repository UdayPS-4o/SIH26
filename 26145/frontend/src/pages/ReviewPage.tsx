/**
 * WATCHTOWER -- Review & Compliance Page
 * Brutal honest self-assessment for Smart India Hackathon 2026 PS-26145 NTRO
 */

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

/* ── Palette (theme-aware) ── */
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

const STATUS_META: Record<string, { c: string; bg: string; icon: typeof CheckCircle2 }> = {
  compliant: { c: C.green, bg: 'rgba(34,197,94,0.10)', icon: CheckCircle2 },
  partial: { c: C.amber, bg: 'rgba(234,179,8,0.10)', icon: AlertTriangle },
  missing: { c: C.red, bg: 'rgba(239,68,68,0.10)', icon: XCircle },
};

interface ComplianceItem {
  label: string;
  status: 'compliant' | 'partial' | 'missing';
  detail: string;
}

interface PageInfo {
  route: string;
  file: string;
  icon: string;
  title: string;
  whatItDoes: string;
  assessment: string;
}

interface MissingItem {
  rank: number;
  title: string;
  why: string;
}

const PAGES: PageInfo[] = [
  {
    route: '/', file: 'src/pages/Dashboard.tsx', icon: 'Dash',
    title: 'Dashboard (Home)',
    whatItDoes: 'Landing page. KPI grid (total flows, alerts, threats per type, avg confidence, flows/sec, active connections, uptime) plus threat breakdown chart, recent alerts table, pipeline status, and diode-mode read-only indicator. Pulls data from WebSocketContext or MockBackend. This is what a judge sees first.',
    assessment: 'Solid. Two Dashboard files exist (Dashboard.tsx is current, DashboardPage.tsx is dead code). KPIs are meaningful, threat chart uses Recharts, pipeline status shows 8 stages.',
  },
  {
    route: '/live-threats', file: 'src/pages/LiveThreats.tsx', icon: 'Threat',
    title: 'Live Threats',
    whatItDoes: 'Real-time alert feed with auto-scrolling entries. Filterable by severity (critical/high/medium/low) and searchable by IP, threat type, or port. Each alert shows timestamp, src/dst IP, port, protocol, threat class, confidence score, severity badge, expandable evidence. Simulates via setInterval at 2-second intervals.',
    assessment: 'Functional. Filtering and search work. Evidence is mock-generated but structured. At 2-second intervals this sells the demo well. Good severity color-coding.',
  },
  {
    route: '/network-map', file: 'src/pages/NetworkMap.tsx', icon: 'Net',
    title: 'Network Map',
    whatItDoes: 'Force-directed graph of network topology. Internal nodes (workstations, laptops, IoT, printers), servers (DC-FileServer-01, DC-WebServer-01, DC-DB-Primary), and external attacker nodes. Edges show connections with status coloring (normal/suspicious/attack). Nodes drift and pulse.',
    assessment: 'Visually impressive. Force simulation makes it feel alive. Node types are clearly distinguished. Topology regenerates on navigation -- fine for demo.',
  },
  {
    route: '/analytics', file: 'src/pages/Analytics.tsx', icon: 'Analytics',
    title: 'Analytics',
    whatItDoes: 'Charts: threat type breakdown bar chart, severity distribution (donut), 30-minute time-series of alert volume, top source IPs table, protocol distribution chart, radar/spider chart for multi-category risk (Network/Application/Host/Data/Identity). Uses Recharts.',
    assessment: 'Good data density. Multiple chart types keep it visually interesting. Radar chart for multi-domain risk shows breadth of thinking.',
  },
  {
    route: '/ai-analyzer', file: 'src/pages/AIAnalyzer.tsx', icon: 'AI',
    title: 'AI Analyzer',
    whatItDoes: 'ML Pipeline dashboard: model accuracy, false positive rate, avg detection time, threats blocked today. Feature importance analysis, model comparison (IsolationForest vs Logistic Regression vs Custom Rule Engine), per-IP threat analysis with kill chain assessment.',
    assessment: 'The AI credibility page. Model names look real. Feature importance and confidence histogram add weight. Kill chain assessment shows MITRE ATT&CK understanding. HOWEVER: the AI is template text generation in mockBackend.ts, not ML inference.',
  },
  {
    route: '/attack', file: 'src/components/AttackPanel.tsx', icon: 'Attack',
    title: 'Attack Simulation (Demo)',
    whatItDoes: 'Military-themed attack simulation panel. Launch attacks: DDoS, Port Scan, Beaconing, DGA, DNS Tunneling, TLS Anomaly, Brute Force, Data Exfiltration. Configurable parameters per attack. Shows detection results (rule, severity, confidence, time-to-detect), attack history, and a DIODE MODE toggle.',
    assessment: 'The most demo-y page by design. DIODE MODE toggle is a nice touch. Time-to-detect is a key differentiator. Military styling is distinctive.',
  },
  {
    route: '/materials', file: 'src/pages/MaterialsPage.tsx', icon: 'Evidence',
    title: 'Evidence (Materials)',
    whatItDoes: 'Displays threat materials/samples as a data grid with hash values, threat class, confidence, source, status (pending/imported/normalized/approved/rejected), severity. Includes similarity matching with structural+semantic+behavioral breakdown.',
    assessment: 'Sidebar says Evidence but file is MaterialsPage.tsx. Shows malware analysis workflows. Match scoring shows technical depth. BUT should show alert evidence, not malware samples.',
  },
  {
    route: '/activity', file: 'src/pages/ActivityPage.tsx', icon: 'Activity',
    title: 'Activity Log',
    whatItDoes: 'System event log filterable by type (alert/system/detection/performance). Mock messages reference TLS JA3 fingerprint match, DNS query entropy anomaly, IsolationForest anomaly score. Pipeline step visualization and audit trail.',
    assessment: 'Good for operational awareness. Pipeline steps (Ingest -> Feature Ext. -> Anomaly Det. -> Classifier -> Alert -> Export) reinforce the architecture story.',
  },
  {
    route: '/integrations', file: 'src/pages/IntegrationPage.tsx', icon: 'Integrations',
    title: 'Integrations',
    whatItDoes: 'External system connections: SOC Platform (SIEM), SIEM Emulator, REST API, Fluent Bit Forwarder, Windows Agent. Shows status, event counts, latency, heartbeat, outgoing event formats (OCSF, JSON, CEF, Syslog). Event feed with individual events.',
    assessment: 'Shows enterprise-readiness. OCSF support is the right call. Multiple integration points show breadth. Currently mock data but design is credible.',
  },
  {
    route: '/admin', file: 'src/pages/AdminPage.tsx', icon: 'Admin',
    title: 'Administration',
    whatItDoes: 'User management (admin/analyst/viewer roles) and pipeline management (8 stages with throughput, latency, CPU, memory). Model info (IsolationForest 94.2%, Logistic Regression 91.8%, Custom Rule Engine 97.1%).',
    assessment: 'Completes the real product illusion. Pipeline stages with throughput numbers tell a coherent story. Numbers are hardcoded strings, not measured.',
  },
];

const COMPLIANCE: ComplianceItem[] = [
  {
    label: 'a) Read-Only Ingest (No Return Path)',
    status: 'compliant',
    detail: 'DIODE badge in HUD bar shows DIODE READ-ONLY. AttackPanel has DIODE MODE toggle. WebSocket is one-directional (server -> client). No POST/PUT/DELETE from frontend.\n\nHOWEVER: This is UI theater. No actual unidirectional gateway exists. If a real backend were connected, nothing prevents two-way communication. The diode is a design pattern, not an implementation.',
  },
  {
    label: 'b) No Payload Decryption (JA3/JA4 Analysis)',
    status: 'partial',
    detail: 'TLS Anomaly detection with JA3 hash matching. Evidence includes ja3_hash, cipher_suite, cert_validity, sni_mismatch. AI Analyzer references TLS fingerprinting.\n\nPARTIAL because: No explicit statement that payload content is never decrypted. JA3 analysis is implicit, not communicated. No JA4 support. No architecture diagram showing the no-decryption boundary.',
  },
  {
    label: 'c) Streaming Not Batch',
    status: 'partial',
    detail: 'WebSocket push delivery for real-time alerts/flows. MockBackend produces flows incrementally. Header shows LIVE/DEMO status.\n\nPARTIAL because: Fallback uses setInterval at 2-second intervals -- polling that LOOKS like streaming. No backpressure handling, flow control, or graceful degradation.',
  },
  {
    label: 'd) Throughput Target (10K+ Flows/Sec)',
    status: 'partial',
    detail: 'Header displays flows/sec. AdminPage shows pipeline throughput: ~10K flows/s, ~9.8K flows/s, ~9.5K flows/s.\n\nPARTIAL because: These are hardcoded strings, not measured throughput. MockBackend caps at 500 flows/sec. Actual throughput is ~0.5 flows/second. A judge checking DevTools will see sub-1 flow/sec vs claimed 10K. This is the biggest technical credibility gap.',
  },
  {
    label: 'e) Standardized Alert Schema',
    status: 'compliant',
    detail: 'Every Alert has: id, timestamp, threat_type, confidence, severity, src_ip, dst_ip, src_port, dst_port, protocol, evidence, flow_count. Complete structured schema. Integrations page shows OCSF format support.\n\nMINOR GAP: evidence is Record<string, any> (untyped) -- different threat types have different evidence shapes.',
  },
  {
    label: 'f) Six Required Threat Categories',
    status: 'compliant',
    detail: 'All six PS-26145 categories implemented in mockBackend.ts:\n1. DDoS: SYN/UDP/ICMP/HTTP flood, packet counts, unique src IPs\n2. C2 Beaconing: Periodic callbacks, intervals, jitter\n3. DGA/DNS Tunneling: Entropy scoring, NXDOMAIN rates, tunnel encoding\n4. Encrypted Malware / TLS Anomaly: JA3 fingerprints, self-signed certs\n5. Port Scanning: Sequential probing, scan types, open port counts\n6. Data Exfiltration: Large outbound transfers, encoding analysis\n\nBonus: Brute Force, Phishing, Malware C2 also implemented.',
  },
];

const MISSING: MissingItem[] = [
  { rank: 1, title: 'Real ML Inference with Actual Detection Logic', why: 'The AI is a template text generator. generateAIAnalysis() in mockBackend.ts is if/else string concatenation, not ML inference. IsolationForest, Logistic Regression, and Custom Rule Engine are listed but never run. Replace with real ONNX-compiled IsolationForest. A judge asking "show me your model" should see weights, feature vectors, and actual predictions. This is the single biggest credibility gap.' },
  { rank: 2, title: 'Real Throughput Benchmark (Not Hardcoded Strings)', why: 'AdminPage hardcodes ~10K flows/s. MockBackend produces ~0.5 flows/second. If a judge checks DevTools Network tab, actual throughput is sub-1 flow/sec. Instrument to measure real processing time, show a live throughput counter. Even with mock detection, throughput measurement should be real.' },
  { rank: 3, title: 'Explicit "No Decryption" Statement with Architecture Diagram', why: 'JA3 analysis exists but is never framed as "we inspect TLS handshake metadata ONLY, never decrypt payload." A diagram: Network Tap -> Flow Exporter -> JA3 Fingerprinter (handshake only) -> ML Classifier -> Alert Output, with NO PAYLOAD DECRYPTION label. This directly addresses the core PS-26145 requirement.' },
  { rank: 4, title: 'Live Demo Video (60-90 seconds)', why: "SIH judges watch hundreds of projects. A 90-second video opening on NetworkMap, showing a DDoS alert in LiveThreats, switching to AttackPanel, and showing AI Analyzer results, sticks in a judge's mind. This is the #1 differentiator in a 500-entry hackathon." },
  { rank: 5, title: 'Performance Under Load', why: 'MockBackend uses randomInt(800, 2000) for flow intervals = ~0.5-1.2 flows/sec. A stress test mode ramping to 100+/sec would demonstrate scalability. Even with mock detection, showing the ingest pipeline handling high-frequency flows proves the architecture scales.' },
  { rank: 6, title: 'Evidence Page That Shows Actual Alert Evidence', why: 'MaterialsPage.tsx shows malware samples, not alert evidence. The sidebar says Evidence but shows threat intelligence materials. Create a real Evidence page showing: 5-tuple, JA3 hash, TLS cipher suite, DNS entropy score, packet histogram, flow duration.' },
  { rank: 7, title: 'Architecture Documentation', why: 'Create an architecture diagram: Data Diode -> Flow Exporter -> Feature Extractor -> ML Classifier -> Alert Generator -> SIEM Export. Label each component, show data flow direction, annotate PS-26145 compliance at each step.' },
  { rank: 8, title: 'Fix Dead Code: DashboardPage.tsx Duplicate', why: 'Both Dashboard.tsx and DashboardPage.tsx exist. App.tsx imports Dashboard only, so DashboardPage.tsx is dead code. A judge browsing the repo will see the duplicate. Delete DashboardPage.tsx.' },
  { rank: 9, title: 'Transparent Mock Data Fallback', why: "WebSocket connects to localhost:8000/ws. When it fails, falls back to setInterval mock data. Add a visible banner: 'Running in DEMO mode -- backend not connected. All data is simulated.' Build trust through transparency." },
  { rank: 10, title: 'AttackPanel in Sidebar Navigation', why: 'AttackPanel is routed as /attack in App.tsx but NOT in Sidebar.tsx NAV_ITEMS. You must know the URL to find it. Add to sidebar. Also: /materials is labeled "Evidence" in sidebar but file is MaterialsPage.tsx -- rename or relabel.' },
];

const SectionHeader = ({ label, subtitle }: { label: string; subtitle?: string }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '3px', color: C.accent, textTransform: 'uppercase', marginBottom: subtitle ? 4 : 0 }}>{label}</div>
    {subtitle && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.textSec }}>{subtitle}</div>}
    <div style={{ height: 1, background: 'linear-gradient(90deg, #00d4ff40, transparent)', marginTop: 8 }} />
  </div>
);

const Panel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.surface, border: '1px solid ' + C.border, borderRadius: 8, position: 'relative', overflow: 'hidden', ...style }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #00d4ff30, transparent)' }} />
    <div style={{ padding: '20px 22px', position: 'relative', zIndex: 1 }}>{children}</div>
  </div>
);

const StatusBadge = ({ status, label }: { status: 'compliant' | 'partial' | 'missing'; label?: string }) => {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: meta.c, background: meta.bg, border: '1px solid ' + meta.c + '30', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
      <Icon size={12} />{label || status.toUpperCase()}
    </span>
  );
};

const ComplianceRow = ({ item }: { item: ComplianceItem }) => (
  <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid ' + C.border }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>{item.label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.7, color: C.textSec, whiteSpace: 'pre-line' }}>{item.detail}</div>
    </div>
    <div style={{ flexShrink: 0, paddingTop: 4 }}><StatusBadge status={item.status} /></div>
  </div>
);

const VerdictBox = ({ title, children, color }: { title: string; children: React.ReactNode; color: string }) => (
  <div style={{ background: color + '08', border: '1px solid ' + color + '30', borderRadius: 8, padding: '24px', marginTop: 24 }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color, letterSpacing: '1px', marginBottom: 12 }}>{title}</div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.8, color: C.text, whiteSpace: 'pre-line' }}>{children}</div>
  </div>
);

const ReviewPage = () => {
  const compliantCount = COMPLIANCE.filter(c => c.status === 'compliant').length;
  const partialCount = COMPLIANCE.filter(c => c.status === 'partial').length;
  const missingCount = COMPLIANCE.filter(c => c.status === 'missing').length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px 64px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: C.accent, letterSpacing: '1px', marginBottom: 8 }}>SYSTEM REVIEW & COMPLIANCE AUDIT</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.textSec }}>WATCHTOWER v2.4 &middot; PS-26145 &middot; NTRO &middot; Smart India Hackathon 2026</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.textDim, marginTop: 4 }}>Generated: 2026-09-17 &middot; Internal use only &middot; Do not submit as-is</div>
        <div style={{ height: 1, background: 'linear-gradient(90deg, #00d4ff40, transparent)', marginTop: 16 }} />
      </div>

      {/* SECTION 1: WHAT THIS DOES */}
      <SectionHeader label="01 / WHAT THIS DOES" subtitle="Page-by-page breakdown of the entire platform" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
        {PAGES.map(page => (
          <Panel key={page.route}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: '#00d4ff10', border: '1px solid ' + C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.accent, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.5px' }}>{page.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: C.accent }}>{page.title}</span>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.textDim, background: '#00d4ff08', padding: '2px 8px', borderRadius: 3, border: '1px solid ' + C.border }}>{page.route}</code>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.textDim, opacity: 0.7 }}>{page.file}</code>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.7, color: C.textSec }}>{page.whatItDoes}</div>
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#00d4ff06', borderRadius: 4, border: '1px solid ' + C.border, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.textSec, lineHeight: 1.6 }}>
                  <span style={{ color: C.accent, fontWeight: 600 }}>ASSESSMENT: </span>{page.assessment}
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* SECTION 2: COMPLIANCE CHECK */}
      <SectionHeader label="02 / PS-26145 COMPLIANCE CHECK" subtitle="Requirement-by-requirement audit against the problem statement" />
      <Panel style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid ' + C.border, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.textSec, fontWeight: 600 }}>COMPLIANCE SUMMARY:</span>
          <StatusBadge status="compliant" label={compliantCount + ' COMPLIANT'} />
          <StatusBadge status="partial" label={partialCount + ' PARTIAL'} />
          <StatusBadge status="missing" label={missingCount + ' MISSING'} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.textDim, marginLeft: 'auto' }}>{COMPLIANCE.length} requirements checked</span>
        </div>
        {COMPLIANCE.map((item, i) => <ComplianceRow key={i} item={item} />)}
      </Panel>

      {/* SECTION 3: VISUAL QUALITY */}
      <SectionHeader label="03 / VISUAL QUALITY ASSESSMENT" subtitle="Would this stand out in a 500-entry hackathon?" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 }}>
        <Panel>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '1px', marginBottom: 12 }}>WOULD A JUDGE REMEMBER THIS?</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: C.green, marginBottom: 12 }}>YES -- with conditions</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.8, color: C.textSec }}>
            The dark ops-center theme with cyan accents, monospace typography, scanline overlay, radar grid background, and pulsing indicators is DISTINCTIVE. Most student projects use default white Bootstrap or generic blue Tailwind. This looks like a product. The force-directed network graph is a visual hook. The diode badge is a conversation starter.
            <br /><br />
            <span style={{ color: C.orange }}>BUT: If the demo crashes, mock data becomes obvious, or the judge asks "where is your backend?" and there is nothing to show, visual quality will not save you.</span>
          </div>
        </Panel>
        <Panel>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '1px', marginBottom: 12 }}>DOES IT LOOK VIBE-CODED?</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: C.amber, marginBottom: 12 }}>MOSTLY NO -- with caveats</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.8, color: C.textSec }}>
            The design system is coherent: locked color palette, consistent spacing, structured components, clear typography hierarchy. This is NOT vibe-coded.
            <br /><br />
            <span style={{ color: C.red }}>CAVEAT: Dashboard.tsx and DashboardPage.tsx have DUPLICATE component definitions. LiveThreats.tsx redefines its own constants. AttackPanel.tsx uses another color scheme (olive/military). The design system evolved, not enforced from the start.</span>
          </div>
        </Panel>
        <Panel>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '1px', marginBottom: 12 }}>THEME: DISTINCTIVE OR GENERIC?</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.8, color: C.textSec }}>
            <strong style={{ color: C.text }}>Distinctive:</strong> Tactical operations center aesthetic is intentional. Cyan-on-dark is consistent. Scanline overlay, grid background, and glow effects create atmosphere. JetBrains Mono signals technical precision.
            <br /><br />
            <strong style={{ color: C.text }}>Generic risk:</strong> "Dark theme with neon cyan" is common. If every team went dark-mode, you compete on execution, not concept. Execution quality is high, concept is not unique.
            <br /><br />
            <span style={{ color: C.teal }}>DIFFERENTIATOR: AttackPanel's military styling (olive, classified-doc) is genuinely unique. If the entire app used this aesthetic, it would be unforgettable.</span>
          </div>
        </Panel>
        <Panel>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '1px', marginBottom: 12 }}>STANDS OUT VS FORGETTABLE</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.8, color: C.textSec }}>
            <div style={{ marginBottom: 10 }}><span style={{ color: C.green }}>STANDS OUT:</span>
              <ul style={{ marginLeft: 16, marginTop: 4, lineHeight: 2 }}>
                <li>Force-directed network graph with live nodes</li>
                <li>Military attack simulation panel</li>
                <li>Pipeline visualization in Admin</li>
                <li>Kill chain assessment in AI Analyzer</li>
                <li>Diode-mode explicit demonstration</li>
                <li>Consistent monospace data display</li>
              </ul>
            </div>
            <div><span style={{ color: C.red }}>FORGETTABLE:</span>
              <ul style={{ marginLeft: 16, marginTop: 4, lineHeight: 2 }}>
                <li>Duplicate Dashboard files</li>
                <li>Evidence page shows materials, not evidence</li>
                <li>AttackPanel not in sidebar navigation</li>
                <li>Inconsistent constants across pages</li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>

      {/* SECTION 4: WHAT IS MISSING */}
      <SectionHeader label="04 / WHAT IS MISSING TO WIN" subtitle="Top 10 things that would make this unbeatable, in priority order" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 48 }}>
        {MISSING.map(item => (
          <Panel key={item.rank} style={{ borderLeft: '3px solid ' + (item.rank <= 3 ? C.red : item.rank <= 6 ? C.orange : C.amber) }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.rank <= 3 ? C.red + '20' : item.rank <= 6 ? C.orange + '20' : C.amber + '20', border: '1px solid ' + (item.rank <= 3 ? C.red + '40' : item.rank <= 6 ? C.orange + '40' : C.amber + '40'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: item.rank <= 3 ? C.red : item.rank <= 6 ? C.orange : C.amber }}>{item.rank}</div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.7, color: C.textSec }}>{item.why}</div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* SECTION 5: HONEST VERDICT */}
      <SectionHeader label="05 / HONEST VERDICT" subtitle="Can this win against 500 submissions right now?" />

      <VerdictBox title="VERDICT: MAYBE" color={C.amber}>
This project is above average for a hackathon submission. The visual design is polished, the architecture story is coherent, and the breadth of pages (10 different views) shows serious effort. The six required threat categories are all implemented, the standardized alert schema is complete, and the read-only diode concept is communicated clearly.

The gap between good and winning is the credibility gap: the AI is template text, the throughput numbers are hardcoded, and the streaming is setInterval under the hood. A technical judge will find these in 5 minutes. The fixes for items #1 (real ML) and #2 (real throughput measurement) alone would flip this from MAYBE to YES. Item #4 (demo video) is the biggest bang-for-buck: 2 hours of recording and editing will influence more judges than 20 hours of code.</VerdictBox>

      <VerdictBox title="THE PATH FROM MAYBE TO YES" color={C.accent}>
Priority 1: Fix the throughput. Replace hardcoded "10K flows/s" with real instrumentation. Even if detection is mock, measure actual processing speed and display it honestly.

Priority 2: Wire up a real model. Use ONNX Runtime or WASM-compiled IsolationForest. Train offline with scikit-learn, export to ONNX, load in browser. Inference happens client-side but weights are real. Takes ~8 hours of focused work.

Priority 3: Record the demo video. 90 seconds. Open on NetworkMap, fire a DDoS, show the alert, run the AI analysis. Polish the audio. Submit it.

These three changes take ~2 days of focused work. After that, this wins.</VerdictBox>

      <VerdictBox title="RISK FACTORS" color={C.red}>
HIGH RISK: The MockBackend is the foundation of every page. If a judge says "disable the mock data and show us the real backend," the app collapses. You need either a real backend (FastAPI/Python) or the ability to credibly say "this runs standalone because the architecture supports it."

MEDIUM RISK: The duplicate Dashboard files (Dashboard.tsx + DashboardPage.tsx) will confuse any judge who browses the source code. Clean it up before submission.

LOW RISK: Visual inconsistencies between pages (AttackPanel uses different colors, LiveThreats redefines constants). Noticed by technical judges, not by non-technical ones.</VerdictBox>

      {/* FOOTER */}
      <div style={{ marginTop: 48, padding: '16px 0', borderTop: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.textDim }}>WATCHTOWER Review Page &middot; PS-26145 &middot; Internal audit document</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.textDim }}>This is NOT the submission. This is the team's self-assessment.</div>
      </div>
    </div>
  );
};

export default ReviewPage;
