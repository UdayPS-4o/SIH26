import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldAlert,
  Zap,
  Globe,
  Network,
  Activity,
  X,
  RefreshCw,
  AlertTriangle,
  Shield,
  Server,
} from 'lucide-react';
import { Alert } from '../types';
import { mockBackend } from '../lib/mockBackend';

const THREAT_ICONS: Record<string, typeof ShieldAlert> = {
  DDoS: Zap,
  'Port Scan': Network,
  'Data Exfiltration': Globe,
  DGA: Globe,
  Beaconing: Activity,
  'Brute Force': Shield,
  Malware: AlertTriangle,
  Phishing: Shield,
};

const severityConfig = {
  critical: {
    bg: 'rgba(255,51,85,0.08)',
    text: '#ff3355',
    border: 'rgba(255,51,85,0.45)',
    dot: '#ff3355',
    label: 'CRITICAL',
    glow: '0 0 8px rgba(255,51,85,0.5)',
  },
  high: {
    bg: 'rgba(255,140,50,0.08)',
    text: '#ff8c32',
    border: 'rgba(255,140,50,0.4)',
    dot: '#ff8c32',
    label: 'HIGH',
    glow: '0 0 8px rgba(255,140,50,0.45)',
  },
  medium: {
    bg: 'rgba(255,200,50,0.08)',
    text: '#ffc832',
    border: 'rgba(255,200,50,0.35)',
    dot: '#ffc832',
    label: 'MEDIUM',
    glow: '0 0 6px rgba(255,200,50,0.4)',
  },
  low: {
    bg: 'rgba(0,212,255,0.08)',
    text: '#00d4ff',
    border: 'rgba(0,212,255,0.35)',
    dot: '#00d4ff',
    label: 'LOW',
    glow: '0 0 6px rgba(0,212,255,0.4)',
  },
};

const confidenceColor = (c: number) => {
  if (c >= 85) return { bar: '#00ff41', text: '#00ff41', label: 'HIGH' };
  if (c >= 70) return { bar: '#ffc832', text: '#ffc832', label: 'MEDIUM' };
  if (c >= 50) return { bar: '#ff8c32', text: '#ff8c32', label: 'LOW' };
  return { bar: '#5a7a9a', text: '#5a7a9a', label: 'UNKNOWN' };
};

const formatTimestamp = (ts: number) => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

const LiveThreats: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [searchIp, setSearchIp] = useState('');
  const [activeSeverities, setActiveSeverities] = useState<Set<string>>(
    new Set(['critical', 'high', 'medium', 'low'])
  );
  const [threatTypeFilter, setThreatTypeFilter] = useState('all');
  const [minConfidence, setMinConfidence] = useState(0);
  const [sortField, setSortField] = useState<'timestamp' | 'confidence' | 'severity'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const perPage = 12;

  const backendRef = useRef(mockBackend);
  const onAlertRef = useRef<((alert: Alert) => void) | null>(null);

  // Initialize backend on mount
  useEffect(() => {
    const backend = backendRef.current;
    backend.start();
    const onAlert = (alert: Alert) => {
      if (isLive) {
        setAlerts((prev) => [alert, ...prev]);
        setLiveCount((c) => c + 1);
      }
    };
    onAlertRef.current = onAlert;
    backend.onAlert(onAlert);

    backend.getAlerts(35).then((initial) => setAlerts(initial));

    return () => {
      backend.stop();
    };
  }, [isLive]);

  const toggleSeverity = (sev: string) => {
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) {
        next.delete(sev);
      } else {
        next.add(sev);
      }
      return next;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchIp('');
    setActiveSeverities(new Set(['critical', 'high', 'medium', 'low']));
    setThreatTypeFilter('all');
    setMinConfidence(0);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchIp !== '' ||
    activeSeverities.size < 4 ||
    threatTypeFilter !== 'all' ||
    minConfidence > 0;

  const filtered = useMemo(() => {
    let result = [...alerts];

    if (searchIp) {
      const q = searchIp.toLowerCase();
      result = result.filter(
        (a) => a.src_ip.includes(q) || a.dst_ip.includes(q)
      );
    }

    if (activeSeverities.size > 0 && activeSeverities.size < 4) {
      result = result.filter((a) => activeSeverities.has(a.severity));
    }

    if (threatTypeFilter !== 'all') {
      result = result.filter((a) => a.threat_type === threatTypeFilter);
    }

    if (minConfidence > 0) {
      result = result.filter((a) => a.confidence >= minConfidence);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'timestamp') {
        cmp = a.timestamp - b.timestamp;
      } else if (sortField === 'confidence') {
        cmp = a.confidence - b.confidence;
      } else {
        cmp = severityOrder[a.severity] - severityOrder[b.severity];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [alerts, searchIp, activeSeverities, threatTypeFilter, minConfidence, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * perPage, safePage * perPage),
    [filtered, safePage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchIp, activeSeverities, threatTypeFilter, minConfidence, sortField, sortDir]);

  const handleSort = (field: 'timestamp' | 'confidence' | 'severity') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'timestamp' | 'confidence' | 'severity' }) => {
    if (sortField !== field) {
      return <span style={{ color: '#5a7a9a' }}><ChevronUp size={10} /></span>;
    }
    return sortDir === 'asc'
      ? <ChevronUp size={14} style={{ color: '#00d4ff' }} />
      : <ChevronDown size={14} style={{ color: '#00d4ff' }} />;
  };

  const exportCSV = () => {
    const headers = [
      'Alert ID', 'Timestamp', 'Threat Type', 'Severity', 'Confidence',
      'Source IP', 'Destination IP', 'Protocol', 'Src Port', 'Dst Port',
      'Packet Count', 'Anomaly Score', 'Flow Count',
    ];
    const rows = filtered.map((a) => {
      const e = a.evidence;
      return [
        a.id,
        new Date(a.timestamp).toISOString(),
        a.threat_type,
        a.severity,
        `${a.confidence}%`,
        a.src_ip,
        a.dst_ip,
        e?.protocol ?? '',
        e?.src_port ?? '',
        e?.dst_port ?? '',
        e?.packet_count ?? '',
        e?.anomaly_score ?? '',
        a.flow_count,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `live-threats-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of alerts) {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    }
    return counts;
  }, [alerts]);

  const uniqueThreatTypes = useMemo(() => {
    const types = new Set(alerts.map((a) => a.threat_type));
    return Array.from(types).sort();
  }, [alerts]);

  // Terminal/ops-center styles
  const styles: Record<string, React.CSSProperties> = {
    page: {
      backgroundColor: '#060a10',
      minHeight: '100vh',
      padding: '16px 20px',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      color: '#c8d6e5',
    },
    headerRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
    },
    titleBlock: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    titleIcon: {
      padding: '8px',
      borderRadius: '6px',
      background: 'rgba(255,51,85,0.12)',
      border: '1px solid rgba(255,51,85,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#00d4ff',
      letterSpacing: '3px',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      textTransform: 'uppercase' as const,
      margin: 0,
      lineHeight: 1.1,
    },
    subtitle: {
      fontSize: '11px',
      color: '#5a7a9a',
      margin: '4px 0 0',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    liveBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginLeft: '10px',
      color: '#00ff41',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '1px',
    },
    liveDot: {
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      backgroundColor: '#00ff41',
      boxShadow: '0 0 6px #00ff41, 0 0 12px rgba(0,255,65,0.5)',
      animation: 'livePulse 1.4s ease-in-out infinite',
    },
    buttonGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
    },
    btnBase: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      border: '1px solid',
      cursor: 'pointer',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      transition: 'all 0.15s ease',
      background: 'rgba(10,18,28,0.9)',
    },
    liveToggleActive: {
      color: '#00ff41',
      borderColor: 'rgba(0,255,65,0.4)',
      boxShadow: '0 0 8px rgba(0,255,65,0.2)',
    },
    liveTogglePaused: {
      color: '#5a7a9a',
      borderColor: 'rgba(90,122,154,0.3)',
    },
    exportBtn: {
      color: '#c8d6e5',
      borderColor: 'rgba(0,212,255,0.25)',
      boxShadow: '0 0 4px rgba(0,212,255,0.1)',
    },
    severityGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '10px',
    },
    severityCard: (cfg: typeof severityConfig.critical, active: boolean) => ({
      padding: '12px 14px',
      borderRadius: '6px',
      textAlign: 'left' as const,
      border: `1px solid ${active ? cfg.border : 'rgba(90,122,154,0.15)'}`,
      background: active ? cfg.bg : 'rgba(10,18,28,0.6)',
      cursor: 'pointer',
      opacity: active ? 1 : 0.4,
      transition: 'all 0.2s ease',
      boxShadow: active ? cfg.glow : 'none',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    }),
    severityLabel: (cfg: typeof severityConfig.critical) => ({
      fontSize: '10px',
      fontWeight: 700,
      color: cfg.text,
      letterSpacing: '1.5px',
    }),
    severityDot: (cfg: typeof severityConfig.critical, active: boolean) => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: cfg.dot,
      boxShadow: active ? cfg.glow : 'none',
      animation: active ? 'livePulse 1.4s ease-in-out infinite' : 'none',
    }),
    severityCount: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#c8d6e5',
      marginTop: '6px',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      textShadow: '0 0 6px rgba(0,212,255,0.3)',
    },
    filterCard: {
      background: 'rgba(10,18,28,0.85)',
      border: '1px solid rgba(0,212,255,0.12)',
      borderRadius: '6px',
      padding: '14px 16px',
      marginTop: '14px',
    },
    filterHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
      marginBottom: '12px',
    },
    filterTitleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    filterTitle: {
      fontSize: '10px',
      fontWeight: 700,
      color: '#c8d6e5',
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    filterCount: {
      fontSize: '11px',
      color: '#5a7a9a',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    filterCountNum: {
      color: '#c8d6e5',
      fontWeight: 600,
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    clearLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '10px',
      color: '#5a7a9a',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      padding: 0,
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      transition: 'color 0.15s ease',
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '10px',
    },
    searchWrapper: {
      position: 'relative' as const,
      gridColumn: 'span 2',
    },
    searchInput: {
      width: '100%',
      padding: '8px 10px 8px 30px',
      borderRadius: '4px',
      fontSize: '12px',
      background: 'rgba(10,18,28,0.9)',
      border: '1px solid rgba(0,212,255,0.3)',
      color: '#c8d6e5',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      outline: 'none',
      boxShadow: '0 0 6px rgba(0,212,255,0.08) inset',
      transition: 'all 0.15s ease',
    },
    select: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: '4px',
      fontSize: '12px',
      background: 'rgba(10,18,28,0.9)',
      border: '1px solid rgba(0,212,255,0.2)',
      color: '#c8d6e5',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      outline: 'none',
      cursor: 'pointer',
      appearance: 'none' as const,
    },
    rangeContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    rangeLabel: {
      fontSize: '10px',
      color: '#5a7a9a',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    rangeValue: {
      fontSize: '10px',
      color: '#00d4ff',
      fontWeight: 600,
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    rangeInput: {
      width: '100%',
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(10,18,28,0.8)',
      appearance: 'none' as const,
      cursor: 'pointer',
      accentColor: '#00d4ff',
    },
    sevToggleBtn: (cfg: typeof severityConfig.critical, active: boolean) => ({
      flex: 1,
      padding: '5px 0',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 700,
      border: `1px solid ${active ? cfg.border : 'rgba(90,122,154,0.15)'}`,
      background: active ? cfg.bg : 'rgba(10,18,28,0.6)',
      color: active ? cfg.text : '#5a7a9a',
      cursor: 'pointer',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      letterSpacing: '1px',
      transition: 'all 0.15s ease',
      textAlign: 'center' as const,
    }),
    resetBtn: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      background: 'rgba(10,18,28,0.7)',
      border: '1px solid rgba(0,212,255,0.2)',
      color: '#5a7a9a',
      cursor: 'pointer',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      transition: 'all 0.15s ease',
    },
    tableCard: {
      background: 'rgba(10,18,28,0.85)',
      border: '1px solid rgba(0,212,255,0.12)',
      borderRadius: '6px',
      overflow: 'hidden',
      marginTop: '14px',
    },
    tableHeadRow: {
      background: 'rgba(10,18,28,0.95)',
      borderBottom: '1px solid rgba(0,212,255,0.15)',
    },
    th: {
      padding: '10px 14px',
      fontSize: '10px',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '1.5px',
      color: '#5a7a9a',
      cursor: 'pointer',
      userSelect: 'none' as const,
      transition: 'color 0.15s ease',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      whiteSpace: 'nowrap' as const,
    },
    thActive: {
      color: '#00d4ff',
    },
    tableRowEven: {
      background: 'rgba(10,18,28,0.4)',
      borderBottom: '1px solid rgba(0,212,255,0.04)',
      transition: 'background 0.15s ease',
    },
    tableRowOdd: {
      background: 'transparent',
      borderBottom: '1px solid rgba(0,212,255,0.04)',
      transition: 'background 0.15s ease',
    },
    tableRowExpanded: {
      background: 'rgba(0,212,255,0.04)',
      borderBottom: '1px solid rgba(0,212,255,0.1)',
    },
    td: {
      padding: '9px 14px',
      fontSize: '12px',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    severityBadge: (cfg: typeof severityConfig.critical) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '3px',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '1.2px',
      background: cfg.bg,
      color: cfg.text,
      border: `1px solid ${cfg.border}`,
      boxShadow: cfg.glow,
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    }),
    confidenceTrack: {
      width: '56px',
      height: '6px',
      borderRadius: '3px',
      background: 'rgba(10,18,28,0.8)',
      border: '1px solid rgba(0,212,255,0.08)',
      overflow: 'hidden',
    },
    confidenceFill: (color: string) => ({
      height: '100%',
      borderRadius: '2px',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      transition: 'width 0.5s ease',
    }),
    confidenceText: (color: string) => ({
      fontSize: '11px',
      fontWeight: 600,
      color,
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      textShadow: `0 0 4px ${color}40`,
      width: '34px',
      textAlign: 'right' as const,
    }),
    ipText: (color: string) => ({
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      fontSize: '11px',
      color,
      textShadow: `0 0 4px ${color}30`,
    }),
    protocolBadge: {
      padding: '1px 6px',
      borderRadius: '3px',
      fontSize: '10px',
      fontWeight: 600,
      background: 'rgba(10,18,28,0.7)',
      color: '#c8d6e5',
      border: '1px solid rgba(0,212,255,0.2)',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    portsText: {
      fontSize: '10px',
      color: '#5a7a9a',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    evidenceText: {
      fontSize: '10px',
      color: '#5a7a9a',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    viewBtn: (active: boolean) => ({
      padding: '4px',
      borderRadius: '3px',
      background: active ? 'rgba(0,212,255,0.15)' : 'transparent',
      color: active ? '#00d4ff' : '#5a7a9a',
      border: `1px solid ${active ? 'rgba(0,212,255,0.3)' : 'transparent'}`,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    expandedSection: {
      background: 'rgba(0,212,255,0.03)',
      borderTop: '1px solid rgba(0,212,255,0.08)',
    },
    expandedHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
    },
    expandedTitle: {
      fontSize: '10px',
      fontWeight: 700,
      color: '#c8d6e5',
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    evidenceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '8px',
    },
    evidenceTile: {
      background: 'rgba(10,18,28,0.6)',
      border: '1px solid rgba(0,212,255,0.1)',
      borderRadius: '4px',
      padding: '10px 12px',
    },
    evidenceKey: {
      fontSize: '9px',
      color: '#5a7a9a',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      fontWeight: 600,
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      display: 'block',
      marginBottom: '2px',
    },
    evidenceValue: {
      fontSize: '12px',
      color: '#c8d6e5',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      wordBreak: 'break-all' as const,
      textShadow: '0 0 4px rgba(0,212,255,0.15)',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      color: '#5a7a9a',
    },
    paginationBar: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '10px 14px',
      borderTop: '1px solid rgba(0,212,255,0.1)',
      flexWrap: 'wrap' as const,
    },
    paginationText: {
      fontSize: '10px',
      color: '#5a7a9a',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    paginationPageNum: {
      color: '#c8d6e5',
      fontWeight: 600,
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
    },
    pageBtnBase: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      cursor: 'pointer',
      border: '1px solid transparent',
      background: 'transparent',
      color: '#5a7a9a',
      transition: 'all 0.15s ease',
    },
    pageBtnActive: {
      background: 'rgba(0,212,255,0.12)',
      color: '#00d4ff',
      border: '1px solid rgba(0,212,255,0.3)',
      boxShadow: '0 0 6px rgba(0,212,255,0.2)',
    },
    clearFiltersBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      background: 'rgba(10,18,28,0.7)',
      border: '1px solid rgba(0,212,255,0.2)',
      color: '#5a7a9a',
      cursor: 'pointer',
      fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
      transition: 'all 0.15s ease',
      marginTop: '12px',
    },
  };

  const getRowStyle = (isEven: boolean, isExpanded: boolean): React.CSSProperties => {
    if (isExpanded) return styles.tableRowExpanded;
    if (isEven) return styles.tableRowEven;
    return styles.tableRowOdd;
  };

  return (
    <div style={styles.page}>
      {/* Inject keyframes for live pulse */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor, 0 0 12px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 2px currentColor, 0 0 4px currentColor; }
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00d4ff;
          cursor: pointer;
          box-shadow: 0 0 6px #00d4ff;
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00d4ff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 6px #00d4ff;
        }
      `}</style>

      {/* Header */}
      <div style={styles.headerRow}>
        <div style={styles.titleBlock}>
          <div style={styles.titleIcon}>
            <ShieldAlert size={22} style={{ color: '#ff3355' }} />
          </div>
          <div>
            <h1 style={styles.title}>LIVE THREATS</h1>
            <p style={styles.subtitle}>
              Real-time threat intelligence monitoring
              {isLive && (
                <span style={styles.liveBadge}>
                  <span style={styles.liveDot} />
                  LIVE
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => {
              setIsLive((v) => !v);
              setLiveCount(0);
            }}
            style={{
              ...styles.btnBase,
              ...(isLive ? styles.liveToggleActive : styles.liveTogglePaused),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              if (isLive) {
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,65,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (isLive) {
                e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,65,0.2)';
              }
            }}
          >
            <RefreshCw size={13} style={{ animation: isLive ? 'spin 1.2s linear infinite' : 'none' }} />
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
          <button
            onClick={exportCSV}
            style={styles.btnBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0,212,255,0.25)';
              e.currentTarget.style.color = '#00d4ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 4px rgba(0,212,255,0.1)';
              e.currentTarget.style.color = '#c8d6e5';
            }}
          >
            <Download size={13} />
            EXPORT
          </button>
        </div>
      </div>

      {/* Severity Summary Bar */}
      <div style={{ ...styles.severityGrid, marginTop: '16px' }}>
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
          const cfg = severityConfig[sev];
          const count = severityCounts[sev];
          return (
            <button
              key={sev}
              onClick={() => toggleSeverity(sev)}
              style={styles.severityCard(cfg, activeSeverities.has(sev))}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                if (activeSeverities.has(sev)) {
                  e.currentTarget.style.boxShadow = cfg.glow;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = activeSeverities.has(sev) ? cfg.glow : 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={styles.severityLabel(cfg)}>{cfg.label}</span>
                <span style={styles.severityDot(cfg, activeSeverities.has(sev))} />
              </div>
              <p style={styles.severityCount}>{String(count).padStart(3, '0')}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={styles.filterCard}>
        <div style={styles.filterHeader}>
          <div style={styles.filterTitleRow}>
            <Filter size={15} style={{ color: '#00d4ff' }} />
            <span style={styles.filterTitle}>// FILTERS</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={styles.clearLink}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#c8d6e5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#5a7a9a'; }}
              >
                <X size={11} />
                CLEAR ALL
              </button>
            )}
          </div>
          <p style={styles.filterCount}>
            Showing <span style={{ ...styles.filterCountNum, color: '#00d4ff' }}>{filtered.length}</span> of{' '}
            <span style={styles.filterCountNum}>{alerts.length}</span> alerts
            {isLive && liveCount > 0 && (
              <span style={{ color: '#00ff41', marginLeft: '6px', textShadow: '0 0 6px rgba(0,255,65,0.4)' }}>
                +{liveCount} new
              </span>
            )}
          </p>
        </div>

        <div style={styles.filterGrid}>
          {/* IP Search */}
          <div style={styles.searchWrapper}>
            <Search size={14} style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#5a7a9a',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="> SEARCH_IP ..."
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              style={styles.searchInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,212,255,0.6)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0,212,255,0.15) inset';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)';
                e.currentTarget.style.boxShadow = '0 0 6px rgba(0,212,255,0.08) inset';
              }}
            />
          </div>

          {/* Threat Type */}
          <div>
            <select
              value={threatTypeFilter}
              onChange={(e) => setThreatTypeFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">ALL_TYPES</option>
              {uniqueThreatTypes.map((type) => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Confidence Slider */}
          <div style={styles.rangeContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={styles.rangeLabel}>MIN_CONF</span>
              <span style={styles.rangeValue}>{minConfidence}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              style={styles.rangeInput}
            />
          </div>

          {/* Severity Quick Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
            {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
              const cfg = severityConfig[sev];
              const active = activeSeverities.has(sev);
              return (
                <button
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  title={`${cfg.label} (${severityCounts[sev]})`}
                  style={styles.sevToggleBtn(cfg, active)}
                  onMouseEnter={(e) => {
                    if (active) {
                      e.currentTarget.style.boxShadow = cfg.glow;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {sev === 'critical' ? 'C' : sev === 'high' ? 'H' : sev === 'medium' ? 'M' : 'L'}
                </button>
              );
            })}
          </div>

          {/* Clear filters button */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={styles.resetBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#c8d6e5';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)';
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(0,212,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#5a7a9a';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <X size={12} />
                RESET
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' as const, fontSize: '12px' }}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={{ ...styles.th, width: '36px', padding: '10px 8px' }}>
                  <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#5a7a9a' }} />
                </th>
                <th
                  style={{ ...styles.th, ...(sortField === 'timestamp' ? styles.thActive : {}) }}
                  onClick={() => handleSort('timestamp')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    TIME
                    <SortIcon field="timestamp" />
                  </span>
                </th>
                <th
                  style={{ ...styles.th, ...(sortField === 'severity' ? styles.thActive : {}) }}
                  onClick={() => handleSort('severity')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    SEVERITY
                    <SortIcon field="severity" />
                  </span>
                </th>
                <th style={styles.th}>THREAT_TYPE</th>
                <th
                  style={{ ...styles.th, ...(sortField === 'confidence' ? styles.thActive : {}) }}
                  onClick={() => handleSort('confidence')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    CONFIDENCE
                    <SortIcon field="confidence" />
                  </span>
                </th>
                <th style={styles.th}>SRC_IP</th>
                <th style={styles.th}>DST_IP</th>
                <th style={styles.th}>PROTO / PORTS</th>
                <th style={styles.th}>METRICS</th>
                <th style={{ ...styles.th, width: '44px', padding: '10px 8px' }}>
                  <Eye size={12} style={{ color: '#5a7a9a' }} />
                </th>
              </tr>
            </thead>
            <tbody style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
              {paginated.map((alert, idx) => {
                const cfg = severityConfig[alert.severity];
                const isExpanded = expandedId === alert.id;
                const conf = confidenceColor(alert.confidence);
                const ThreatIcon = THREAT_ICONS[alert.threat_type] ?? ShieldAlert;
                const proto = (alert.evidence?.protocol as string | undefined) ?? '--';
                const srcPort = (alert.evidence?.src_port as number | undefined) ?? 0;
                const dstPort = (alert.evidence?.dst_port as number | undefined) ?? 0;
                const packetCount = (alert.evidence?.packet_count as number | undefined) ?? 0;
                const anomalyScore = (alert.evidence?.anomaly_score as number | undefined) ?? 0;
                const isEven = idx % 2 === 0;

                return (
                  <Fragment key={alert.id}>
                    <tr
                      style={getRowStyle(isEven, isExpanded)}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.background = 'rgba(0,212,255,0.04)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isExpanded
                          ? 'rgba(0,212,255,0.04)'
                          : isEven
                            ? 'rgba(10,18,28,0.4)'
                            : 'transparent';
                      }}
                    >
                      <td style={{ ...styles.td, padding: '9px 8px' }}>
                        <span style={{
                          display: 'block',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: cfg.dot,
                          boxShadow: cfg.glow,
                          animation: 'livePulse 2s ease-in-out infinite',
                        }} title={cfg.label} />
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace", fontSize: '11px', color: '#c8d6e5' }}>
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          <span style={{ fontSize: '9px', color: '#5a7a9a' }}>
                            {formatDate(alert.timestamp)}
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.severityBadge(cfg)}>
                          {cfg.label}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ThreatIcon size={14} style={{ color: '#5a7a9a', flexShrink: 0 }} />
                          <span style={{
                            fontSize: '12px',
                            color: '#c8d6e5',
                            fontWeight: 600,
                            whiteSpace: 'nowrap' as const,
                            fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.5px',
                          }}>
                            {alert.threat_type}
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={styles.confidenceTrack}>
                            <div
                              style={{ ...styles.confidenceFill(conf.bar), width: `${alert.confidence}%` }}
                            />
                          </div>
                          <span style={styles.confidenceText(conf.text)}>
                            {alert.confidence}%
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.ipText('#00d4ff')}>
                          {alert.src_ip}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.ipText('#00d4ff')}>
                          {alert.dst_ip}
                        </span>
                      </td>

                      <td style={{ ...styles.td, whiteSpace: 'nowrap' as const }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={styles.protocolBadge}>
                            {proto}
                          </span>
                          {srcPort > 0 && dstPort > 0 && (
                            <span style={styles.portsText}>
                              {srcPort} &rarr; {dstPort}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ ...styles.evidenceText, color: '#5a7a9a' }}>
                            <Activity size={11} style={{ color: '#5a7a9a' }} />
                            {packetCount.toLocaleString()} pkts
                          </span>
                          <span style={{ ...styles.evidenceText, color: '#5a7a9a' }}>
                            <Server size={11} style={{ color: '#5a7a9a' }} />
                            {Number(anomalyScore).toFixed(2)}
                          </span>
                        </div>
                      </td>

                      <td style={{ ...styles.td, padding: '9px 8px' }}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                          style={styles.viewBtn(isExpanded)}
                          onMouseEnter={(e) => {
                            if (!isExpanded) {
                              e.currentTarget.style.color = '#00d4ff';
                              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)';
                              e.currentTarget.style.background = 'rgba(0,212,255,0.08)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) {
                              e.currentTarget.style.color = '#5a7a9a';
                              e.currentTarget.style.borderColor = 'transparent';
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                          title="View evidence details"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr style={styles.expandedSection}>
                        <td colSpan={10} style={{ padding: '16px 14px' }}>
                          <div>
                            <div style={styles.expandedHeader}>
                              <ShieldAlert size={14} style={{ color: '#ffc832' }} />
                              <span style={styles.expandedTitle}>Full Evidence Report</span>
                              <span style={{
                                fontSize: '9px',
                                color: '#5a7a9a',
                                fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
                              }}>
                                Alert ID: {alert.id}
                              </span>
                            </div>
                            <div style={styles.evidenceGrid}>
                              {(alert.threat_type === 'TLS Anomaly' || alert.threat_type === 'tls_anomaly') && alert.evidence?.tls_fingerprint && (
                                <div style={{
                                  ...styles.evidenceTile,
                                  gridColumn: 'span 2',
                                  border: '1px solid rgba(0,212,255,0.3)',
                                  boxShadow: '0 0 8px rgba(0,212,255,0.1)',
                                }}>
                                  <span style={{
                                    fontSize: '9px',
                                    color: '#00d4ff',
                                    textTransform: 'uppercase' as const,
                                    letterSpacing: '1px',
                                    fontWeight: 600,
                                    fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
                                    display: 'block',
                                    marginBottom: '4px',
                                  }}>
                                    JA3 Fingerprint
                                  </span>
                                  <p style={{
                                    fontSize: '12px',
                                    color: '#00d4ff',
                                    fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
                                    wordBreak: 'break-all' as const,
                                    textShadow: '0 0 6px rgba(0,212,255,0.3)',
                                    margin: 0,
                                  }}>
                                    {String(alert.evidence.tls_fingerprint)}
                                  </p>
                                  <span style={{
                                    fontSize: '8px',
                                    color: 'rgba(0,212,255,0.5)',
                                    marginTop: '4px',
                                    display: 'block',
                                    fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
                                  }}>
                                    [ METADATA ONLY - NO DECRYPTION ]
                                  </span>
                                </div>
                              )}
                              {Object.entries(alert.evidence).map(([key, value]) => {
                                const displayValue = typeof value === 'number' ? value.toLocaleString() : String(value ?? '--');
                                const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                                return (
                                  <div key={key} style={styles.evidenceTile}>
                                    <span style={styles.evidenceKey}>{displayKey}</span>
                                    <p style={{
                                      ...styles.evidenceValue,
                                      color: '#c8d6e5',
                                      textShadow: '0 0 4px rgba(0,212,255,0.12)',
                                    }}>
                                      {displayValue}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              marginTop: '14px',
                              fontSize: '11px',
                              color: '#5a7a9a',
                              fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace",
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Activity size={12} style={{ color: '#5a7a9a' }} />
                                Flow Count: {alert.flow_count}
                              </span>
                              <span style={{ color: 'rgba(0,212,255,0.2)' }}>|</span>
                              <span>
                                {formatTimestamp(alert.timestamp)} &mdash; {formatDate(alert.timestamp)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {paginated.length === 0 && (
          <div style={styles.emptyState}>
            <AlertTriangle size={48} style={{ opacity: 0.35, marginBottom: '12px' }} />
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#c8d6e5', fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace" }}>
              NO_ALERTS_MATCH_FILTERS
            </p>
            <p style={{ fontSize: '11px', color: '#5a7a9a', marginTop: '6px', fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace" }}>
              Try adjusting your search criteria or clearing filters
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={styles.clearFiltersBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#c8d6e5';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#5a7a9a';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)';
                }}
              >
                <X size={12} />
                CLEAR ALL FILTERS
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {paginated.length > 0 && (
          <div style={styles.paginationBar}>
            <p style={styles.paginationText}>
              Page <span style={styles.paginationPageNum}>{safePage}</span> of{' '}
              <span style={styles.paginationPageNum}>{totalPages}</span>
              <span style={{ marginLeft: '8px' }}>({filtered.length} total)</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{
                  ...styles.pageBtnBase,
                  opacity: safePage === 1 ? 0.3 : 1,
                  cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (safePage !== 1) {
                    e.currentTarget.style.color = '#00d4ff';
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (safePage !== 1) {
                    e.currentTarget.style.color = '#5a7a9a';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <ChevronLeft size={15} />
              </button>

              {(() => {
                const pages: (number | string)[] = [];
                const maxVisible = 5;
                let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
                const end = Math.min(totalPages, start + maxVisible - 1);
                if (end - start < maxVisible - 1) {
                  start = Math.max(1, end - maxVisible + 1);
                }
                if (start > 1) {
                  pages.push(1);
                  if (start > 2) pages.push('...');
                }
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push('...');
                  pages.push(totalPages);
                }
                return pages;
              })().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} style={{ padding: '0 4px', fontSize: '11px', color: '#5a7a9a', fontFamily: "'Courier New', 'Fira Code', 'Consolas', monospace" }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(Number(p))}
                    style={{
                      ...styles.pageBtnBase,
                      width: '30px',
                      height: '30px',
                      ...(safePage === p ? styles.pageBtnActive : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (safePage !== p) {
                        e.currentTarget.style.color = '#00d4ff';
                        e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)';
                        e.currentTarget.style.background = 'rgba(0,212,255,0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (safePage !== p) {
                        e.currentTarget.style.color = '#5a7a9a';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{
                  ...styles.pageBtnBase,
                  opacity: safePage === totalPages ? 0.3 : 1,
                  cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (safePage !== totalPages) {
                    e.currentTarget.style.color = '#00d4ff';
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (safePage !== totalPages) {
                    e.currentTarget.style.color = '#5a7a9a';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveThreats;
