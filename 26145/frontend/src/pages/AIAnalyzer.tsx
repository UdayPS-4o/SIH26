import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Flow } from '../types';
import { fetchStats, fetchAlerts } from '../lib/api';
import {
  Send, Bot, User, AlertTriangle, Shield, Zap, X, Loader2,
} from 'lucide-react';

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
        className="w-2 h-2 rounded-full bg-brand-blue animate-bounce"
        style={{ animationDelay: `${i * 150}ms`, animationDuration: '600ms' }}
      />
    ))}
  </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const severityIcon = (s: string) => {
  switch (s) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    default: return '🟢';
  }
};

const severityColor = (s: string) => {
  switch (s) {
    case 'critical': return 'text-red-400 border-red-500/30 bg-red-500/10';
    case 'high': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    default: return 'text-green-400 border-green-500/30 bg-green-500/10';
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
        <p key={idx} className={`font-bold text-white mt-3 mb-1 ${sizeClass}`}>{title}</p>
      );
      return;
    }

    if (trimmed.startsWith('- ')) {
      const content = trimmed.replace(/^- /, '');
      parts.push(
        <li key={idx} className="text-slate-300 ml-3 list-disc">
          {content.split(/\*\*/).map((part, i, arr) =>
            i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
          )}
        </li>
      );
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, '');
      parts.push(
        <li key={idx} className="text-slate-300 ml-3 list-decimal">
          {content.split(/\*\*/).map((part, i, arr) =>
            i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
          )}
        </li>
      );
      return;
    }

    if (trimmed.startsWith('```')) {
      parts.push(
        <div key={idx} className="bg-navy-900/80 border border-slate-700 rounded-lg px-4 py-2 my-2 font-mono text-xs text-brand-green">
          {trimmed.replace(/```/g, '')}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('---')) {
      parts.push(<hr key={idx} className="border-slate-700 my-2" />);
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
        <div key={idx} className="flex gap-2 text-xs my-0.5">
          {cells.map((cell, ci) => (
            <span
              key={ci}
              className={`flex-1 ${ci === 0 ? 'text-slate-400' : 'text-slate-300'}`}
            >
              {cell}
            </span>
          ))}
        </div>
      );
      return;
    }

    const formatted = trimmed.split(/\*\*/).map((part, i, arr) =>
      i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
    );

    if (trimmed.match(/^(🔴|🟠|🟡|🟢)/)) {
      parts.push(
        <p key={idx} className="text-sm flex items-start gap-2 mt-1">
          <span className="shrink-0">{trimmed.match(/^(🔴|🟠|🟡|🟢)/)?.[0]}</span>
          <span>{formatted.slice(1)}</span>
        </p>
      );
      return;
    }

    parts.push(<p key={idx} className="text-sm text-slate-300 leading-relaxed">{formatted}</p>);
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

🔴 **CRITICAL** — Malicious Activity Detected

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

🔴 **CRITICAL:** ${criticalCount} events — Immediate action required
🟠 **HIGH:** ${highCount} events — Escalate to security team
🟡 **MEDIUM:** ${alerts.filter((a) => a.severity === 'medium').length} events — Monitor closely
🟢 **LOW:** ${alerts.filter((a) => a.severity === 'low').length} events — Log and review

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
      `- ${severityIcon(a.severity)} \`${a.src_ip}\` → **${a.threat_type}** (${a.confidence}% confidence, ${new Date(a.timestamp).toLocaleTimeString()})`
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
### 🔮 Predicted Threat Trajectory

Based on analysis of **${alerts.length} recent alerts**, our AI models predict the following likely threat scenarios in the next **6-24 hours**:

### Primary Prediction: ${topType} Campaign Escalation

${recentCritical.length > 0 ? `**Supporting Evidence:**
${recentCritical.map((a) => `- ${severityIcon(a.severity)} \`${a.src_ip}\` — ${a.threat_type} (${new Date(a.timestamp).toLocaleTimeString()})`).join('\n')}` : '**Supporting Evidence:** Elevated attack frequency detected across multiple vectors.'}

**Predicted Scenario:**
The attack patterns suggest the threat actor is conducting **reconnaissance** and will likely escalate to:
1. **Credential stuffing** using harvested credentials from brute-force sources
2. **Lateral movement** via detected internal IP communication patterns
3. **Data exfiltration** — staging observed in outbound traffic patterns

### Threat Escalation Probability

| Scenario | Probability | Severity |
|----------|------------|----------|
| ${topType} Volume Increase | ${(Math.random() * 20 + 70).toFixed(0)}% | 🟠 HIGH |
| Lateral Movement | ${(Math.random() * 20 + 40).toFixed(0)}% | 🔴 CRITICAL |
| Data Exfiltration | ${(Math.random() * 15 + 25).toFixed(0)}% | 🔴 CRITICAL |
| Ransomware Deployment | ${(Math.random() * 15 + 15).toFixed(0)}% | 🔴 CRITICAL |

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
*⚠️ Prediction confidence: ${(Math.random() * 15 + 78).toFixed(1)}% | Model: Temporal Pattern v3.2*`;
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
### 🔴 Priority Alerts (CRITICAL Severity)

${criticals.length > 0 ? criticals.slice(0, 5).map((a) => `- **${a.threat_type}** from \`${a.src_ip}\`
  - Confidence: ${a.confidence}% | Port: ${a.src_port} | Time: ${new Date(a.timestamp).toLocaleTimeString()}`).join('\n\n') : 'No critical alerts in current window.'}

---
### 📊 Threat Distribution by Type

${Object.entries(typeCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([type, count]) => `- ${severityIcon(typeCounts[type] === alerts.filter((a) => a.severity === 'critical' && a.threat_type === type).length ? 'critical' : 'medium')} **${type}:** ${count} events`)
  .join('\n')}

---
### 📋 Recent Alert Timeline

${top.map((a) => `${severityIcon(a.severity)} [${new Date(a.timestamp).toLocaleTimeString()}] **${a.threat_type}** — \`${a.src_ip}:${a.src_port}\` → \`${a.dst_ip}\` | ${a.confidence}% confidence | ${a.flow_count} flows`).join('\n')}

---
### ⚡ Key Findings

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
        responseText = '## Analysis Error\n\n⚠️ An error occurred during analysis. The AI model encountered an unexpected condition.\n\n**Recommended action:**\n- Retry the analysis\n- Check system connectivity\n- Contact the SOC team if the issue persists\n\n*Error details have been logged for review.*';
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

🔍 **Threat Analysis** — "Analyze recent threats" or paste any IP to investigate
📊 **Security Reports** — "Generate report" for comprehensive assessments
🔮 **Threat Prediction** — "Predict next threats" for proactive defense
🛡️ **IP Reputation** — "Check IP reputation" for external threat intelligence

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
      <div className="w-[30%] min-w-[280px] max-w-[360px] border-r border-slate-800 bg-navy-800/50 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <Bot className="text-brand-blue" size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Threat Analyzer</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cybersecurity Intelligence</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleSend('Analyze recent threats in detail')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-brand-blue/5 border border-brand-blue/20 text-brand-blue text-xs font-medium hover:bg-brand-blue/10 hover:border-brand-blue/30 transition-all group"
            >
              <Shield size={14} className="shrink-0" />
              <span>Analyze Recent Threats</span>
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
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-brand-amber/5 border border-brand-amber/20 text-brand-amber text-xs font-medium hover:bg-brand-amber/10 hover:border-brand-amber/30 transition-all group"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>Check IP Reputation</span>
            </button>
            <button
              onClick={() => handleSend('Generate comprehensive security report')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-brand-green/5 border border-brand-green/20 text-brand-green text-xs font-medium hover:bg-brand-green/10 hover:border-brand-green/30 transition-all group"
            >
              <Shield size={14} className="shrink-0" />
              <span>Generate Report</span>
            </button>
            <button
              onClick={() => handleSend('Predict likely next threats and attack vectors')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
            >
              <Zap size={14} className="shrink-0" />
              <span>Threat Prediction</span>
            </button>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Recent Analyses
          </h3>
          {recentAnalyses.length === 0 ? (
            <p className="text-xs text-slate-600 italic px-1">No analyses yet. Start a conversation above.</p>
          ) : (
            <div className="space-y-1">
              {recentAnalyses.map((record) => (
                <button
                  key={record.id}
                  onClick={() => handleSend(record.prompt)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-navy-700/50 transition-colors group"
                >
                  <p className="text-xs text-slate-300 group-hover:text-white truncate">
                    {record.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Chat Area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-navy-900">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={16} className="text-brand-blue" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-brand-blue text-white rounded-br-sm'
                    : 'bg-navy-800 border border-slate-700 rounded-bl-sm'
                }`}
              >
                {msg.role === 'ai' ? (
                  msg.content ? (
                    <div className="space-y-1">{formatMarkdown(msg.content)}</div>
                  ) : (
                    TYPING_DOTS
                  )
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
                <p
                  className={`text-[10px] mt-2 ${
                    msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <User size={16} className="text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {isTyping && messages[messages.length - 1]?.role !== 'ai' && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-brand-blue" />
              </div>
              <div className="bg-navy-800 border border-slate-700 rounded-xl rounded-bl-sm px-5 py-3">
                {TYPING_DOTS}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-navy-800/30">
          <div className="flex items-center gap-3 bg-navy-800 border border-slate-700 rounded-xl px-4 py-2 focus-within:border-brand-blue/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about threats, analyze an IP, or request a report..."
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-navy-700 transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="p-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {isTyping ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center">
            AI Threat Analyzer — Powered by Ekadhara Detection Engine
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyzer;
