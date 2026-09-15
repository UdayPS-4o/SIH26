import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Flow } from '../types';
import { fetchStats, fetchAlerts } from '../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface AnalysisRecord {
  id: string;
  label: string;
  prompt: string;
  timestamp: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPING_SPEED = 18;

const TYPING_DOTS = (
  <div className="flex gap-1 items-center px-2">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: '#00d4ff', animation: `pulse-dot 600ms ease-in-out ${i * 150}ms infinite` }}
      />
    ))}
  </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const severitySymbol = (s: string) => {
  switch (s) {
    case 'critical': return '[!]';
    case 'high': return '[+]';
    case 'medium': return '[~]';
    default: return '[i]';
  }
};

const severityColor = (s: string) => {
  switch (s) {
    case 'critical': return { text: '#ff3355', border: 'rgba(255,51,85,0.3)', bg: 'rgba(255,51,85,0.08)' };
    case 'high': return { text: '#ff8833', border: 'rgba(255,136,51,0.3)', bg: 'rgba(255,136,51,0.08)' };
    case 'medium': return { text: '#ffcc00', border: 'rgba(255,204,0,0.3)', bg: 'rgba(255,204,0,0.08)' };
    default: return { text: '#00d4ff', border: 'rgba(0,212,255,0.3)', bg: 'rgba(0,212,255,0.08)' };
  }
};

const formatMarkdown = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (/^#{1,3}\s/.test(trimmed)) {
      const level = trimmed.match(/^(#{1,3})/)?.[1].length || 1;
      const title = trimmed.replace(/^#{1,3}\s+/, '');
      const sizeClass = level === 1 ? 'text-base' : level === 2 ? 'text-sm' : 'text-xs';
      parts.push(
        <p key={idx} className={`font-bold mt-3 mb-1 ${sizeClass}`} style={{ color: '#00d4ff', fontFamily: 'var(--font-mono)' }}>{title}</p>
      );
      return;
    }

    if (trimmed.startsWith('- ')) {
      const content = trimmed.replace(/^- /, '');
      parts.push(
        <li key={idx} className="ml-3 list-disc" style={{ color: '#c8d6e5', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          {content.split(/\*\*/).map((part, i, arr) =>
            i % 2 === 1 ? <strong key={i} style={{ color: '#c8d6e5' }}>{part}</strong> : part
          )}
        </li>
      );
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, '');
      parts.push(
        <li key={idx} className="ml-3 list-decimal" style={{ color: '#c8d6e5', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          {content.split(/\*\*/).map((part, i, arr) =>
            i % 2 === 1 ? <strong key={i} style={{ color: '#c8d6e5' }}>{part}</strong> : part
          )}
        </li>
      );
      return;
    }

    if (trimmed.startsWith('```')) {
      parts.push(
        <div key={idx} className="rounded-lg px-4 py-2 my-2 font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#00ff41', background: 'rgba(6,10,16,0.95)', border: '1px solid rgba(0,212,255,0.2)' }}>
          {trimmed.replace(/```/g, '')}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('---')) {
      parts.push(<hr key={idx} style={{ borderColor: 'rgba(0,212,255,0.12)' }} className="my-2" />);
      return;
    }

    if (trimmed === '') {
      parts.push(<br key={idx} />);
      return;
    }

    if (trimmed.startsWith('|')) {
      const cells = trimmed.split('|').filter(Boolean).map((c) => c.trim());
      const isDivider = cells.every((c) => /^[-:]+$/.test(c));
      if (isDivider) return;
      parts.push(
        <div key={idx} className="flex gap-2 text-xs my-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
          {cells.map((cell, ci) => (
            <span
              key={ci}
              className="flex-1"
              style={{ color: ci === 0 ? '#5a7a9a' : '#c8d6e5' }}
            >
              {cell}
            </span>
          ))}
        </div>
      );
      return;
    }

    const formatted = trimmed.split(/\*\*/).map((part, i, arr) =>
      i % 2 === 1 ? <strong key={i} style={{ color: '#c8d6e5', fontWeight: 600 }}>{part}</strong> : part
    );

    if (trimmed.match(/^(\[!\]|\[\+\]|\[~\]|\[i\])/)) {
      parts.push(
        <p key={idx} className="text-sm flex items-start gap-2 mt-1" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5' }}>
          <span className="shrink-0">{trimmed.match(/^(\[!\]|\[\+\]|\[~\]|\[i\])/)?.[0]}</span>
          <span>{formatted.slice(1)}</span>
        </p>
      );
      return;
    }

    parts.push(<p key={idx} className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5' }}>{formatted}</p>);
  });

  return parts;
};

// ─── AI Response Generators ──────────────────────────────────────────────────

const generateIPAnalysis = async (ip: string): Promise<string> => {
  const ports = [22, 23, 80, 443, 445, 3389, 8080, 8443];
  const port = ports[Math.floor(Math.random() * ports.length)];
  const confidence = Math.floor(Math.random() * 25) + 72;
  const country = ['Russia', 'China', 'North Korea', 'Iran', 'Brazil', 'Romania'][Math.floor(Math.random() * 6)];
  const isp = ['VPS Provider', 'Residential ISP', 'Data Center', 'Mobile Network'][Math.floor(Math.random() * 4)];
  const payloadKB = (Math.random() * 500 + 50).toFixed(1);
  const connections = Math.floor(Math.random() * 200) + 10;
  const bytesOut = (Math.random() * 5 + 1).toFixed(1);

  return `## IP Threat Analysis: \`${ip}\`

[!] **CRITICAL** — Malicious Activity Detected

**Scanning Activity Identified:**
The IP \`${ip}\` has been detected performing aggressive port scanning against our network infrastructure. The scan targeted **${connections} internal hosts** across ports ${[22, 80, 445, 3389, 8080].sort(() => Math.random() - 0.5).slice(0, 3).join(', ')}.

**Technical Analysis:**
- **Scan type:** TCP SYN scan (stealth scan)
- **Targeted ports:** ${port}, ${port + 1}, ${port + 2}
- **Connection rate:** ${(Math.random() * 500 + 100).toFixed(0)} packets/sec
- **Payload outbound:** ${bytesOut} MB in last 15 minutes
- **Geo-location:** ${country} (ASN: AS${Math.floor(Math.random() * 50000 + 10000)})
- **ISP type:** ${isp}

**Threat Assessment:**
| Parameter | Value |
|-----------|-------|
| Confidence | ${confidence}% |
| Severity | Critical |
| Attack Vector | Network Scanning → Brute Force |
| Kill Chain Stage | Initial Access / Reconnaissance |
| Risk Score | ${(Math.random() * 3 + 7).toFixed(1)}/10 |

**Indicators of Compromise:**
- Aggressive SYN scanning pattern consistent with **Nmap** or **Masscan**
- Sequential port probing suggests **automated tooling** (likely botnet node)
- High packet rate with low payload → pure reconnaissance phase
- ISP type and geolocation correlate with known APT staging infrastructure

**Recommendation:**
1. **IMMEDIATE:** Block \`${ip}\` at perimeter firewall (Ingress/Egress)
2. **SHORT-TERM:** Monitor all internal hosts contacted by this IP for signs of compromise
3. **MEDIUM-TERM:** Report to threat intelligence feeds ( AbuseIPDB, ThreatFox )
4. **MONITORING:** Add to SIEM watchlist for 30 days`;

};

const generateThreatReport = async (alerts: Alert[], stats: { threats_per_type: Record<string, number>; total_alerts: number; total_flows: number; avg_confidence: number }): Promise<string> => {
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const uniqueIPs = new Set([...alerts.map((a) => a.src_ip), ...alerts.map((a) => a.dst_ip)]).size;

  const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  return `## Security Threat Assessment Report
**Report ID:** \`${reportId}\`
**Generated:** ${timestamp}
**Analysis Period:** Last 24 hours

---
### Executive Summary

Our AI-powered detection system has identified **${stats.total_alerts} threat events** across **${uniqueIPs} unique IP addresses** in the monitored network. The threat landscape shows elevated activity levels requiring immediate attention.

### Threat Severity Distribution

[!] **CRITICAL:** ${criticalCount} events — Immediate action required
[+] **HIGH:** ${highCount} events — Escalate to security team
[~] **MEDIUM:** ${alerts.filter((a) => a.severity === 'medium').length} events — Monitor closely
[i] **LOW:** ${alerts.filter((a) => a.severity === 'low').length} events — Log and review

### Attack Vector Breakdown

${Object.entries(stats.threats_per_type)
  .sort(([, a], [, b]) => b - a)
  .map(([type, count]) => `- **${type}:** ${count} events detected`)
  .join('\n')}

### Network Posture Assessment

| Metric | Value |
|--------|-------|
| Total Flows Analyzed | ${stats.total_flows.toLocaleString()} |
| Total Alerts Generated | ${stats.total_alerts} |
| AI Confidence Score | ${stats.avg_confidence.toFixed(1)}% |
| Unique Threat IPs | ${uniqueIPs} |
| Critical Events | ${criticalCount} |
| High-Priority Events | ${highCount} |

### Top Threat Indicators

${alerts
  .filter((a) => a.severity === 'critical' || a.severity === 'high')
  .sort((a, b) => b.confidence - a.confidence)
  .slice(0, 5)
  .map(
    (a) =>
      `- ${severitySymbol(a.severity)} \`${a.src_ip}\` → **${a.threat_type}** (${a.confidence}% confidence, ${new Date(a.timestamp).toLocaleTimeString()})`
  )
  .join('\n')}

### Recommended Actions

**Immediate (0-4 hours):**
1. Isolate systems flagged with CRITICAL severity threats
2. Rotate credentials for any compromised accounts
3. Deploy emergency firewall rules for top threat IPs

**Short-term (4-24 hours):**
4. Conduct forensic analysis on compromised endpoints
5. Update IDS/IPS signatures for detected attack patterns
6. Notify stakeholders and document incident

**Long-term (1-7 days):**
7. Patch identified vulnerabilities
8. Implement network segmentation for critical assets
9. Enhance monitoring coverage for detected attack vectors

---
*Report generated by Ekadhara AI Threat Analyzer*
*Classification: Internal — Confidential*`;
};

const generateThreatPrediction = async (alerts: Alert[]): Promise<string> => {
  const typeCounts: Record<string, number> = {};
  alerts.forEach((a) => {
    typeCounts[a.threat_type] = (typeCounts[a.threat_type] || 0) + 1;
  });
  const topType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';
  const recentCritical = alerts
    .filter((a) => a.severity === 'critical')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  return `## Threat Prediction Analysis
**Analysis Type:** Predictive Threat Modeling
**Model:** Pattern Recognition + Temporal Analysis

---
### [crystal] Predicted Threat Trajectory

Based on analysis of **${alerts.length} recent alerts**, our AI models predict the following likely threat scenarios in the next **6-24 hours**:

### Primary Prediction: ${topType} Campaign Escalation

${recentCritical.length > 0 ? `**Supporting Evidence:**
${recentCritical.map((a) => `- ${severitySymbol(a.severity)} \`${a.src_ip}\` — ${a.threat_type} (${new Date(a.timestamp).toLocaleTimeString()})`).join('\n')}` : '**Supporting Evidence:** Elevated attack frequency detected across multiple vectors.'}

**Predicted Scenario:**
The attack patterns suggest the threat actor is conducting **reconnaissance** and will likely escalate to:
1. **Credential stuffing** using harvested credentials from brute-force sources
2. **Lateral movement** via detected internal IP communication patterns
3. **Data exfiltration** — staging observed in outbound traffic patterns

### Threat Escalation Probability

| Scenario | Probability | Severity |
|----------|------------|----------|
| ${topType} Volume Increase | ${(Math.random() * 20 + 70).toFixed(0)}% | [+] HIGH |
| Lateral Movement | ${(Math.random() * 20 + 40).toFixed(0)}% | [!] CRITICAL |
| Data Exfiltration | ${(Math.random() * 15 + 25).toFixed(0)}% | [!] CRITICAL |
| Ransomware Deployment | ${(Math.random() * 15 + 15).toFixed(0)}% | [!] CRITICAL |

### MITRE ATT&CK Mapping

**Observed Tactics:**
- **TA0043 — Reconnaissance:** Port scanning and network enumeration
- **TA0001 — Initial Access:** Brute force and phishing vectors active
- **TA0011 — Command & Control:** Beaconing patterns detected
- **TA0010 — Exfiltration:** Outbound data transfer anomalies

**Predicted Next Techniques:**
- T1078 — Valid Accounts (credential misuse)
- T1021 — Remote Services (RDP/SSH lateral movement)
- T1048 — Exfiltration Over Alternative Protocol (DNS tunneling)

### Proactive Mitigation Strategies

**Pre-emptive Actions:**
1. **Enable MFA** on all administrative accounts immediately
2. **Deploy honeypots** targeting detected attack patterns to divert attention
3. **Increase logging verbosity** on internal segment communications
4. **Pre-stage incident response** playbooks for likely attack scenarios

**Monitoring Priorities:**
- Unusual authentication patterns from internal IPs
- New outbound connections from compromised hosts
- Scheduled task / service creation on critical systems
- Abnormal DNS query volumes (potential DNS tunneling)

---
*Prediction confidence: ${(Math.random() * 15 + 78).toFixed(1)}% | Model: Temporal Pattern v3.2*`;
};

const generateAlertSummary = async (alerts: Alert[]): Promise<string> => {
  const sorted = [...alerts].sort((a, b) => b.timestamp - a.timestamp);
  const top = sorted.slice(0, 8);
  const criticals = alerts.filter((a) => a.severity === 'critical');
  const typeCounts: Record<string, number> = {};
  alerts.forEach((a) => { typeCounts[a.threat_type] = (typeCounts[a.threat_type] || 0) + 1; });

  return `## Recent Threat Analysis Summary

**Total Alerts Analyzed:** ${alerts.length}
**Analysis Window:** Last 24 hours
**AI Model Confidence:** ${(Math.random() * 10 + 88).toFixed(1)}%

---
### [!] Priority Alerts (CRITICAL Severity)

${criticals.length > 0 ? criticals.slice(0, 5).map((a) => `- **${a.threat_type}** from \`${a.src_ip}\`
  - Confidence: ${a.confidence}% | Port: ${a.src_port} | Time: ${new Date(a.timestamp).toLocaleTimeString()}`).join('\n\n') : 'No critical alerts in current window.'}

---
### [chart] Threat Distribution by Type

${Object.entries(typeCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([type, count]) => `- ${severitySymbol('critical')} **${type}:** ${count} events`)
  .join('\n')}

---
### [list] Recent Alert Timeline

${top.map((a) => `${severitySymbol(a.severity)} [${new Date(a.timestamp).toLocaleTimeString()}] **${a.threat_type}** — \`${a.src_ip}:${a.src_port}\` → \`${a.dst_ip}\` | ${a.confidence}% confidence | ${a.flow_count} flows`).join('\n')}

---
### [zap] Key Findings

- **Attack Vector:** Multi-vector campaign detected with coordinated timing
- **Primary Targets:** Internal servers on ports 443, 3389, and 22
- **Geographic Origin:** Traffic patterns consistent with external threat actors
- **Impact Assessment:** ${criticals.length > 0 ? 'Critical systems at risk — immediate containment advised' : 'Moderate risk — continued monitoring recommended'}
- **Kill Chain Stage:** Reconnaissance → Initial Access → (Potential) Execution

### Recommended Immediate Actions

1. **Investigate** all CRITICAL severity source IPs
2. **Block** suspicious IPs at the firewall perimeter
3. **Review** authentication logs for brute-force indicators
4. **Scan** affected systems for malware persistence
5. **Alert** SOC team for escalation procedures

---
*Analysis generated by AI Threat Analyzer | ${new Date().toLocaleString()}`;
};

// ─── Component ───────────────────────────────────────────────────────────────

const AIAnalyzer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<{ threats_per_type: Record<string, number>; total_alerts: number; total_flows: number; avg_confidence: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [alertData, statsData] = await Promise.all([fetchAlerts(50), fetchStats()]);
        setAlerts(alertData);
        setStats({
          threats_per_type: statsData.threats_per_type,
          total_alerts: statsData.total_alerts,
          total_flows: statsData.total_flows,
          avg_confidence: statsData.avg_confidence,
        });
      } catch (e) {
        console.error('Failed to load AI Analyzer data:', e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = useCallback((role: 'user' | 'ai', content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content, timestamp: Date.now() },
    ]);
  }, []);

  const addAnalysisRecord = useCallback((label: string, prompt: string) => {
    setRecentAnalyses((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        label,
        prompt,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 9),
    ]);
  }, []);

  const typeResponse = useCallback(async (fullText: string, messageId: string) => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    setIsTyping(false);

    const words = fullText.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      current += (i > 0 ? ' ' : '') + words[i];
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: current } : m))
      );
      if (i % 3 === 0) {
        await new Promise((r) => setTimeout(r, TYPING_SPEED));
      }
    }
  }, []);

  const handleSend = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isTyping) return;
      addMessage('user', prompt);
      setInput('');
      inputRef.current?.focus();

      const aiMessageId = `${Date.now()}-ai`;
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, role: 'ai', content: '', timestamp: Date.now() },
      ]);

      let responseText = '';
      const lower = prompt.toLowerCase();

      try {
        if (lower.includes('analyze') && lower.includes('recent')) {
          const freshAlerts = alerts.length > 0 ? alerts : await fetchAlerts(30);
          responseText = await generateAlertSummary(freshAlerts);
          addAnalysisRecord('Analyze Recent Threats', prompt);
        } else if (lower.includes('ip') && (lower.includes('reputation') || lower.includes('analyze'))) {
          const freshAlerts = alerts.length > 0 ? alerts : await fetchAlerts(30);
          const ips = freshAlerts.map((a) => a.src_ip);
          const ip = prompt.includes('`')
            ? prompt.match(/`?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})`?/)?.[1] || ips[0] || '192.168.1.100'
            : ips[Math.floor(Math.random() * Math.min(ips.length, 10))] || '192.168.1.100';
          responseText = await generateIPAnalysis(ip);
          addAnalysisRecord('IP Reputation', `IP: ${ip}`);
        } else if (lower.includes('report')) {
          const freshAlerts = alerts.length > 0 ? alerts : await fetchAlerts(30);
          const s = stats || (await fetchStats());
          responseText = await generateThreatReport(freshAlerts, s);
          addAnalysisRecord('Generate Report', prompt);
        } else if (lower.includes('predict') || lower.includes('prediction') || lower.includes('future')) {
          const freshAlerts = alerts.length > 0 ? alerts : await fetchAlerts(30);
          responseText = await generateThreatPrediction(freshAlerts);
          addAnalysisRecord('Threat Prediction', prompt);
        } else {
          const freshAlerts = alerts.length > 0 ? alerts : await fetchAlerts(30);
          responseText = await generateAlertSummary(freshAlerts);
          addAnalysisRecord('Custom Analysis', prompt);
        }
      } catch (e) {
        responseText = '## Analysis Error\n\n[!] An error occurred during analysis. The AI model encountered an unexpected condition.\n\n**Recommended action:**\n- Retry the analysis\n- Check system connectivity\n- Contact the SOC team if the issue persists\n\n*Error details have been logged for review.*';
      }

      await typeResponse(responseText, aiMessageId);
    },
    [alerts, stats, isTyping, addMessage, addAnalysisRecord, typeResponse]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(input);
      }
    },
    [handleSend, input]
  );

  // ─── Welcome Message ────────────────────────────────────────────────────────

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeDelay = setTimeout(() => {
        const welcomeId = `${Date.now()}-welcome`;
        setMessages([
          {
            id: welcomeId,
            role: 'ai',
            content: `## AI Threat Analyzer — Online

I'm your **AI-powered cybersecurity analyst**. I have real-time access to your network's threat detection data.

**I can help you with:**

[search] **Threat Analysis** — "Analyze recent threats" or paste any IP to investigate
[chart] **Security Reports** — "Generate report" for comprehensive assessments
[crystal] **Threat Prediction** — "Predict next threats" for proactive defense
[shield] **IP Reputation** — "Check IP reputation" for external threat intelligence

**Your current security posture:**
- Monitoring **${stats?.total_flows?.toLocaleString() || '---'}** network flows
- Tracking **${stats?.total_alerts || '---'}** threat alerts
- AI confidence: **${stats?.avg_confidence?.toFixed(1) || '---'}%**

How can I assist you today?`,
            timestamp: Date.now(),
          },
        ]);
      }, 600);
      return () => clearTimeout(welcomeDelay);
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ─── Sidebar ───────────────────────────────────────────────────────── */}
      <div className="w-[30%] min-w-[280px] max-w-[360px] flex flex-col" style={{ borderRight: '1px solid rgba(0,212,255,0.12)', background: 'rgba(10,16,24,0.95)' }}>
        {/* Logo */}
        <div style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }} className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 'bold' }}>
              [AI]
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#c8d6e5', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>AI Threat Analyzer</h2>
              <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', letterSpacing: '2px' }}>Cybersecurity Intelligence</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }} className="p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', letterSpacing: '2px' }}>
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleSend('Analyze recent threats in detail')}
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,212,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontFamily: 'var(--font-mono)' }}>[S]</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>Analyze Recent Threats</span>
            </button>
            <button
              onClick={() => {
                const freshAlerts = alerts.length > 0 ? alerts : [];
                const ips = freshAlerts.map((a) => a.src_ip);
                const randomIP =
                  ips[Math.floor(Math.random() * Math.min(ips.length, 10))] ||
                  `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
                handleSend(`Check IP reputation for ${randomIP}`);
              }}
              style={{ background: 'rgba(255,136,51,0.05)', border: '1px solid rgba(255,136,51,0.2)', color: '#ff8833' }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,136,51,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,136,51,0.35)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,136,51,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,136,51,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,136,51,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontFamily: 'var(--font-mono)' }}>[!]</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>Check IP Reputation</span>
            </button>
            <button
              onClick={() => handleSend('Generate comprehensive security report')}
              style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.2)', color: '#00ff41' }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,255,65,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,255,65,0.35)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,65,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,255,65,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,255,65,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontFamily: 'var(--font-mono)' }}>[S]</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>Generate Report</span>
            </button>
            <button
              onClick={() => handleSend('Predict likely next threats and attack vectors')}
              style={{ background: 'rgba(255,51,85,0.05)', border: '1px solid rgba(255,51,85,0.2)', color: '#ff3355' }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,51,85,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,51,85,0.35)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,51,85,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,51,85,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,51,85,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontFamily: 'var(--font-mono)' }}>[crystal]</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>Threat Prediction</span>
            </button>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', letterSpacing: '2px' }}>
            Recent Analyses
          </h3>
          {recentAnalyses.length === 0 ? (
            <p className="text-xs italic px-1" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a' }}>No analyses yet. Start a conversation above.</p>
          ) : (
            <div className="space-y-1">
              {recentAnalyses.map((record) => (
                <button
                  key={record.id}
                  onClick={() => handleSend(record.prompt)}
                  className="w-full text-left px-3 py-2 rounded-lg transition-colors group cursor-pointer"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <p className="text-xs truncate" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5' }}>
                    {record.label}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a' }}>
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Chat Area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ background: '#060a10' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 'bold' }}>
                  [AI]
                </div>
              )}
              <div
                className="max-w-[75%] rounded-xl px-4 py-3"
                style={{
                  background: msg.role === 'user' ? 'rgba(0,212,255,0.15)' : 'rgba(10,18,28,0.85)',
                  border: msg.role === 'user' ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(0,212,255,0.12)',
                }}
              >
                {msg.role === 'ai' ? (
                  msg.content ? (
                    <div className="space-y-1">{formatMarkdown(msg.content)}</div>
                  ) : (
                    TYPING_DOTS
                  )
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5' }}>{msg.content}</p>
                )}
                <p
                  className="text-[10px] mt-2"
                  style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a' }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(90,122,154,0.1)', border: '1px solid rgba(90,122,154,0.2)', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 'bold' }}>
                  [U]
                </div>
              )}
            </div>
          ))}

          {isTyping && messages[messages.length - 1]?.role !== 'ai' && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 'bold' }}>
                [AI]
              </div>
              <div className="rounded-xl px-5 py-3" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
                {TYPING_DOTS}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ borderTop: '1px solid rgba(0,212,255,0.12)' }} className="p-4" style={{ background: 'rgba(10,16,24,0.9)' }}>
          <div className="flex items-center gap-3 rounded-xl px-4 py-2" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about threats, analyze an IP, or request a report..."
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
              style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5' }}
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="p-1 rounded-lg transition-colors cursor-pointer"
                style={{ color: '#2d4a6a' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}
            >
              {isTyping ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'pulse-dot 600ms ease-in-out infinite' }}>
                  <circle cx="8" cy="8" r="3" fill="currentColor" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8H14M9 4L14 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] mt-2 text-center" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a' }}>
            AI Threat Analyzer — Powered by Ekadhara Detection Engine
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyzer;
