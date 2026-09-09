/* ═══════════════════════════════════════════════════════════════
   EKADHARA — AlertDetail Component
   Detailed alert view with timeline, related alerts,
   evidence breakdown, and export functionality.
   ═══════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react'
import { formatTimestamp, generateId, cn } from '../utils/helpers'

const THREAT_TYPES = {
  ddos: { name: 'Volumetric DDoS', icon: '🌊', color: '#ef4444', description: 'High-volume network flood targeting availability' },
  beaconing: { name: 'C2 Beaconing', icon: '📡', color: '#f59e0b', description: 'Periodic communication with command & control server' },
  dga: { name: 'DGA / DNS Tunnel', icon: '🔤', color: '#8b5cf6', description: 'Domain generation algorithm or DNS exfiltration' },
  malware: { name: 'Encrypted Malware', icon: '🔒', color: '#3b82f6', description: 'Malicious traffic with encrypted payload' },
  scan: { name: 'Port Scanning', icon: '🔍', color: '#10b981', description: 'Reconnaissance port scanning activity' },
  exfil: { name: 'Data Exfiltration', icon: '📤', color: '#ef4444', description: 'Unauthorized data transfer out of the network' },
}

const FEATURE_NAMES = {
  packet_rate: { name: 'Packet Rate', description: 'Packets per second during the event window' },
  byte_ratio: { name: 'Byte Ratio', description: 'Ratio of outbound to inbound bytes' },
  interval_variance: { name: 'Interval Variance', description: 'Statistical variance in packet timing intervals' },
  dst_port_entropy: { name: 'Destination Port Entropy', description: 'Shannon entropy across destination ports' },
  payload_entropy: { name: 'Payload Entropy', description: 'Shannon entropy of packet payload data' },
  flow_duration: { name: 'Flow Duration', description: 'Average duration of network flows' },
  ttl_variance: { name: 'TTL Variance', description: 'Statistical variance in TTL values' },
  syn_ratio: { name: 'SYN Ratio', description: 'Ratio of SYN to total packets' },
}

// Generate mock timeline events
function generateTimeline(alert) {
  const events = []
  const ts = alert.timestamp
  const duration = 5 + Math.random() * 45 // 5-50 minutes of activity

  events.push({
    time: ts,
    type: 'detected',
    title: 'Threat Detected',
    description: `AI model classified traffic as ${THREAT_TYPES[alert.threat]?.name || alert.threat}`,
  })

  events.push({
    time: ts - 60000,
    type: 'first_seen',
    title: 'First Anomalous Packet',
    description: `Initial anomaly score: ${(Math.random() * 0.3 + 0.7).toFixed(3)}`,
  })

  if (alert.threat === 'ddos') {
    events.push({
      time: ts - 120000,
      type: 'recon',
      title: 'Pre-Attack Reconnaissance',
      description: 'Port scanning detected from same source IP 2 minutes before attack',
    })
  }

  if (alert.threat === 'beaconing') {
    events.push({
      time: ts - 300000,
      type: 'first_beacon',
      title: 'Initial Beacon',
      description: `First beacon observed at ${new Date(ts - 300000).toLocaleTimeString()}`,
    })
  }

  events.push({
    time: ts + 30000 + Math.random() * 60000,
    type: 'response',
    title: 'Response Dispatched',
    description: 'Automated response: connection rate limiting enabled',
  })

  events.push({
    time: ts + 120000,
    type: 'classified',
    title: 'Alert Classified',
    description: `Severity: ${alert.severity.toUpperCase()} | Confidence: ${Math.round(alert.confidence * 100)}%`,
  })

  events.sort((a, b) => a.time - b.time)
  return events
}

// Generate related alerts
function generateRelatedAlerts(alert, allAlerts) {
  if (!allAlerts || !alert) return []

  const srcThreats = new Set()
  const dstThreats = new Set()

  return allAlerts
    .filter((a) =>
      a.id !== alert.id &&
      (a.srcIp === alert.srcIp || a.dstIp === alert.dstIp ||
        a.srcIp === alert.dstIp || a.dstIp === alert.srcIp)
    )
    .slice(0, 5)
}

/* ═══════════════════════════════════════════════════════════════
   TIMELINE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function AlertTimeline({ events }) {
  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <div key={idx} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full border-2" style={{
              borderColor: event.type === 'detected' || event.type === 'classified' ? '#ef4444'
                : event.type === 'response' ? '#10b981'
                  : '#00d4ff',
              backgroundColor: event.type === 'detected' || event.type === 'classified' ? '#ef4444'
                : event.type === 'response' ? '#10b981'
                  : '#00d4ff',
            }} />
            {idx < events.length - 1 && (
              <div className="w-0.5 h-8 bg-ek-border" />
            )}
          </div>

          {/* Event content */}
          <div className="pb-4 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-ek-text-primary">{event.title}</p>
              <span className="text-[10px] font-mono text-ek-text-muted">
                {formatTimestamp(event.time)}
              </span>
            </div>
            <p className="text-xs text-ek-text-secondary">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FEATURE IMPORTANCE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function FeatureImportance({ features }) {
  if (!features || !features.length) return null

  const items = features.map((f) => ({
    ...f,
    importance: 0.5 + Math.random() * 0.5,
    featureInfo: FEATURE_NAMES[f] || { name: f, description: 'ML feature' },
  })).sort((a, b) => b.importance - a.importance)

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="p-2 bg-ek-bg-elevated rounded-lg border border-ek-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-ek-text-secondary">{item.featureInfo.name}</span>
            <span className="text-xs font-mono" style={{
              color: item.importance > 0.8 ? '#ef4444' : item.importance > 0.6 ? '#f59e0b' : '#00d4ff',
            }}>
              {(item.importance * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-ek-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${item.importance * 100}%`,
                backgroundColor: item.importance > 0.8 ? '#ef4444' : item.importance > 0.6 ? '#f59e0b' : '#00d4ff',
              }}
            />
          </div>
          <p className="text-[10px] text-ek-text-muted mt-1">{item.featureInfo.description}</p>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ALERT DETAIL MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AlertDetail({ alert, allAlerts = [], onClose }) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  if (!alert) return null

  const threatInfo = THREAT_TYPES[alert.threat] || { name: alert.threat, icon: '⚠️', color: '#ef4444', description: '' }
  const timeline = useMemo(() => generateTimeline(alert), [alert])
  const relatedAlerts = useMemo(() => generateRelatedAlerts(alert, allAlerts), [alert, allAlerts])

  // Generate mock feature evidence
  const features = useMemo(() => {
    const allFeatures = Object.keys(FEATURE_NAMES)
    return allFeatures.slice(0, 3 + Math.floor(Math.random() * 3)).map((f) => ({
      name: f,
    }))
  }, [alert?.id])

  // Export alert as JSON
  const handleExport = async () => {
    const exportData = {
      alertId: alert.id,
      timestamp: new Date(alert.timestamp).toISOString(),
      threat: alert.threat,
      threatName: threatInfo.name,
      severity: alert.severity,
      confidence: parseFloat(alert.confidence),
      sourceIp: alert.srcIp,
      destinationIp: alert.dstIp,
      evidence: alert.evidence,
      validity: alert.validity,
      exportedAt: new Date().toISOString(),
      exportedBy: 'EKADHARA v1.0',
    }

    const json = JSON.stringify(exportData, null, 2)
    const success = await copyToClipboard(json)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'related', label: 'Related' },
  ]

  const severityConfig = {
    critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
    high: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
    medium: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
    low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
    info: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)' },
  }
  const sev = severityConfig[alert.severity] || severityConfig.info

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="ek-card w-full max-w-3xl max-h-[85vh] overflow-y-auto relative"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-ek-bg-elevated border border-ek-border hover:border-ek-accent transition-colors z-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Alert Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl text-3xl border" style={{
            backgroundColor: threatInfo.color + '15',
            borderColor: threatInfo.color + '30',
          }}>
            {threatInfo.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-display font-bold text-lg text-ek-text-primary">
                {threatInfo.name}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{
                color: sev.color,
                backgroundColor: sev.bg,
                border: `1px solid ${sev.border}`,
              }}>
                {alert.severity}
              </span>
            </div>
            <p className="text-xs text-ek-text-muted">{threatInfo.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-xs text-ek-text-secondary">{alert.srcIp}</span>
              <span className="text-ek-text-muted">→</span>
              <span className="font-mono text-xs text-ek-text-secondary">{alert.dstIp}</span>
            </div>
          </div>
        </div>

        {/* Confidence & Meta */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-ek-bg-elevated rounded-lg border border-ek-border">
            <p className="text-[10px] text-ek-text-muted uppercase tracking-wider mb-1">Confidence</p>
            <p className="font-mono text-lg font-bold text-ek-text-primary">
              {Math.round(parseFloat(alert.confidence) * 100)}%
            </p>
            <div className="h-1 bg-ek-border rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${parseFloat(alert.confidence) * 100}%`,
                  backgroundColor: parseFloat(alert.confidence) > 0.8 ? '#10b981' : parseFloat(alert.confidence) > 0.6 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>
          <div className="p-3 bg-ek-bg-elevated rounded-lg border border-ek-border">
            <p className="text-[10px] text-ek-text-muted uppercase tracking-wider mb-1">Detected At</p>
            <p className="text-xs font-mono text-ek-text-primary">
              {formatTimestamp(alert.timestamp)}
            </p>
          </div>
          <div className="p-3 bg-ek-bg-elevated rounded-lg border border-ek-border">
            <p className="text-[10px] text-ek-text-muted uppercase tracking-wider mb-1">Alert ID</p>
            <p className="text-xs font-mono text-ek-text-primary">{alert.id}</p>
          </div>
          <div className="p-3 bg-ek-bg-elevated rounded-lg border border-ek-border">
            <p className="text-[10px] text-ek-text-muted uppercase tracking-wider mb-1">Validity</p>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{
              color: alert.validity === 'MEASURED' ? '#10b981' : alert.validity === 'ESTIMATED' ? '#f59e0b' : '#ef4444',
              backgroundColor: alert.validity === 'MEASURED' ? 'rgba(16, 185, 129, 0.15)' : alert.validity === 'ESTIMATED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${alert.validity === 'MEASURED' ? 'rgba(16, 185, 129, 0.3)' : alert.validity === 'ESTIMATED' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}>
              {alert.validity}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-ek-border pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold transition-all duration-200 border-b-2 -mb-[1px] ${
                activeTab === tab.id
                  ? 'text-ek-accent border-ek-accent'
                  : 'text-ek-text-muted border-transparent hover:text-ek-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-ek-bg-elevated rounded-lg border border-ek-border">
                <h4 className="text-xs font-semibold text-ek-text-primary uppercase tracking-wider mb-3">
                  Key Detected Features
                </h4>
                <FeatureImportance features={features} />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-ek-text-primary uppercase tracking-wider mb-3">
                  Evidence Hash (SHA-256)
                </h4>
                <div className="p-3 bg-ek-bg-elevated rounded-lg border border-ek-border font-mono text-xs text-ek-accent break-all">
                  {alert.evidence.hash}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-4 bg-ek-bg-elevated rounded-lg border border-ek-border">
              <h4 className="text-xs font-semibold text-ek-text-primary uppercase tracking-wider mb-4">
                Attack Timeline
              </h4>
              <AlertTimeline events={timeline} />
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="p-4 bg-ek-bg-elevated rounded-lg border border-ek-border">
                <h4 className="text-xs font-semibold text-ek-text-primary uppercase tracking-wider mb-3">
                  Feature Importance
                </h4>
                <FeatureImportance features={features} />
              </div>

              <div className="p-4 bg-ek-bg-elevated rounded-lg border border-ek-border">
                <h4 className="text-xs font-semibold text-ek-text-primary uppercase tracking-wider mb-3">
                  Evidence Hash
                </h4>
                <div className="p-3 bg-ek-bg-base rounded-lg border border-ek-border font-mono text-xs text-ek-accent break-all">
                  {alert.evidence.hash}
                </div>
              </div>

              <div className="p-4 bg-ek-bg-elevated rounded-lg border border-ek-border">
                <h4 className="text-xs font-semibold text-ek-text-primary uppercase tracking-wider mb-3">
                  Data Validity
                </h4>
                <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider" style={{
                  color: alert.validity === 'MEASURED' ? '#10b981' : alert.validity === 'ESTIMATED' ? '#f59e0b' : '#ef4444',
                  backgroundColor: alert.validity === 'MEASURED' ? 'rgba(16, 185, 129, 0.15)' : alert.validity === 'ESTIMATED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${alert.validity === 'MEASURED' ? 'rgba(16, 185, 129, 0.3)' : alert.validity === 'ESTIMATED' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}>
                  {alert.validity}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'related' && (
            <div className="space-y-2">
              {relatedAlerts.length === 0 ? (
                <div className="text-center py-8 text-ek-text-muted">
                  <p className="text-sm">No related alerts found</p>
                  <p className="text-xs mt-1">No other alerts share this source or destination IP</p>
                </div>
              ) : (
                relatedAlerts.map((related) => {
                  const relatedThreat = THREAT_TYPES[related.threat] || { name: related.threat, icon: '⚠️', color: '#ef4444' }
                  const relatedSev = severityConfig[related.severity] || severityConfig.info
                  return (
                    <div key={related.id} className="p-3 bg-ek-bg-elevated rounded-lg border border-ek-border flex items-center gap-3">
                      <span className="text-xl">{relatedThreat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ek-text-primary truncate">
                            {relatedThreat.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{
                            color: relatedSev.color,
                            backgroundColor: relatedSev.bg,
                          }}>
                            {related.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-ek-text-secondary">
                          <span className="font-mono">{related.srcIp}</span>
                          <span className="text-ek-text-muted">→</span>
                          <span className="font-mono">{related.dstIp}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-ek-text-muted flex-shrink-0">
                        {formatTimestamp(related.timestamp)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-ek-border">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ek-accent/10 border border-ek-accent/30 text-ek-accent text-xs font-semibold hover:bg-ek-accent/20 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {copied ? 'Copied!' : 'Export JSON'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-ek-bg-elevated border border-ek-border text-ek-text-secondary text-xs font-semibold hover:text-ek-text-primary hover:border-ek-text-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
