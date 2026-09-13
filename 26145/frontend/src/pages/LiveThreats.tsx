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
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    label: 'CRITICAL',
  },
  high: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    label: 'HIGH',
  },
  medium: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    label: 'MEDIUM',
  },
  low: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
    label: 'LOW',
  },
};

const confidenceColor = (c: number) => {
  if (c >= 85) return { bar: 'bg-red-500', text: 'text-red-400' };
  if (c >= 70) return { bar: 'bg-orange-500', text: 'text-orange-400' };
  if (c >= 50) return { bar: 'bg-amber-500', text: 'text-amber-400' };
  return { bar: 'bg-brand-blue', text: 'text-brand-blue' };
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
      return <span className="text-slate-600"><ChevronUp size={10} /></span>;
    }
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-brand-blue" />
      : <ChevronDown size={14} className="text-brand-blue" />;
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

  return (
    <div className="space-y-4 p-4 lg:p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/20">
            <ShieldAlert size={22} className="text-brand-red" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Live Threats</h1>
            <p className="text-xs text-slate-400">
              Real-time threat intelligence monitoring
              {isLive && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLive((v) => !v);
              setLiveCount(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-navy-700 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <RefreshCw size={13} className={isLive ? 'animate-spin' : ''} />
            {isLive ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-700 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600 transition-all"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Severity Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
          const cfg = severityConfig[sev];
          const count = severityCounts[sev];
          return (
            <button
              key={sev}
              onClick={() => toggleSeverity(sev)}
              className={`card p-3 text-left border transition-all ${
                activeSeverities.has(sev)
                  ? `${cfg.bg} ${cfg.border}`
                  : 'opacity-50 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                <span className={`w-2 h-2 rounded-full ${cfg.dot} ${activeSeverities.has(sev) ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-lg font-bold text-white mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-brand-blue" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors ml-2"
              >
                <X size={11} />
                Clear all
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Showing <span className="text-slate-300 font-mono font-medium">{filtered.length}</span> of{' '}
            <span className="text-slate-300 font-mono font-medium">{alerts.length}</span> alerts
            {isLive && liveCount > 0 && (
              <span className="text-emerald-400 ml-1">(+{liveCount} new)</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* IP Search */}
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search source or destination IP..."
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-navy-900/60 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/20 transition-all"
            />
          </div>

          {/* Threat Type */}
          <div>
            <select
              value={threatTypeFilter}
              onChange={(e) => setThreatTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-navy-900/60 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/20 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Threat Types</option>
              {uniqueThreatTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Confidence Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-500">Min Confidence</span>
              <span className="text-[11px] font-mono text-brand-blue font-medium">{minConfidence}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full h-1.5 bg-navy-800 rounded-full appearance-none cursor-pointer accent-brand-blue"
            />
          </div>

          {/* Severity Quick Toggle */}
          <div className="flex items-center gap-1.5">
            {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
              const cfg = severityConfig[sev];
              const active = activeSeverities.has(sev);
              return (
                <button
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  title={`${cfg.label} (${severityCounts[sev]})`}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold border transition-all ${
                    active
                      ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                      : 'bg-navy-800/50 text-slate-600 border-slate-800/50'
                  }`}
                >
                  {sev === 'critical' ? 'C' : sev === 'high' ? 'H' : sev === 'medium' ? 'M' : 'L'}
                </button>
              );
            })}
          </div>

          {/* Clear filters button */}
          <div className="flex items-center">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-navy-700/50 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600 transition-all"
              >
                <X size={12} />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-navy-700/40 border-b border-slate-800">
                <th className="px-4 py-3" style={{ width: '40px' }}>
                  <span className="block w-2.5 h-2.5 rounded-full bg-slate-600" />
                </th>
                <th
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-white transition-colors select-none"
                  onClick={() => handleSort('timestamp')}
                >
                  <span className="flex items-center gap-1">Time <SortIcon field="timestamp" /></span>
                </th>
                <th
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-white transition-colors select-none"
                  onClick={() => handleSort('severity')}
                >
                  <span className="flex items-center gap-1">Severity <SortIcon field="severity" /></span>
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Threat</th>
                <th
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-white transition-colors select-none"
                  onClick={() => handleSort('confidence')}
                >
                  <span className="flex items-center gap-1">Confidence <SortIcon field="confidence" /></span>
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Source</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Destination</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Protocol / Ports</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Evidence</th>
                <th className="px-4 py-3" style={{ width: '50px' }}>
                  <Eye size={12} className="text-slate-600" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
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
                      className={`transition-colors group ${
                        isExpanded
                          ? 'bg-navy-700/25'
                          : isEven
                            ? 'bg-navy-800/20 hover:bg-navy-700/30'
                            : 'bg-transparent hover:bg-navy-700/25'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className={`block w-2.5 h-2.5 rounded-full ${cfg.dot} shadow-sm`} title={cfg.label} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-slate-300">{formatTimestamp(alert.timestamp)}</span>
                          <span className="text-[10px] text-slate-600">{formatDate(alert.timestamp)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ThreatIcon size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-white font-medium whitespace-nowrap">{alert.threat_type}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${conf.bar}`}
                              style={{ width: `${alert.confidence}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono font-medium w-9 text-right ${conf.text}`}>
                            {alert.confidence}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-brand-blue">{alert.src_ip}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-brand-amber">{alert.dst_ip}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-navy-700 text-slate-300 border border-slate-700 font-mono">
                            {proto}
                          </span>
                          {srcPort > 0 && dstPort > 0 && (
                            <span className="text-[11px] font-mono text-slate-500">
                              {srcPort} &rarr; {dstPort}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Activity size={11} className="text-slate-500" />
                            {packetCount.toLocaleString()} pkts
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Server size={11} className="text-slate-500" />
                            {anomalyScore.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                          className={`p-1 rounded transition-all ${
                            isExpanded
                              ? 'bg-brand-blue/20 text-brand-blue'
                              : 'text-slate-500 hover:text-white hover:bg-navy-700'
                          }`}
                          title="View evidence details"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-navy-700/15">
                        <td colSpan={10} className="px-4 py-0">
                          <div className="py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <ShieldAlert size={14} className="text-brand-amber" />
                              <span className="text-xs font-semibold text-white uppercase tracking-wider">Full Evidence Report</span>
                              <span className="text-[10px] text-slate-500 font-mono">Alert ID: {alert.id}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                              {Object.entries(alert.evidence).map(([key, value]) => {
                                const displayValue = typeof value === 'number' ? value.toLocaleString() : String(value ?? '--');
                                const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                                return (
                                  <div key={key} className="bg-navy-800/40 border border-slate-700/50 rounded-lg px-3 py-2.5">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium block">{displayKey}</span>
                                    <p className="text-sm text-slate-200 font-mono mt-0.5 break-all">{displayValue}</p>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Activity size={12} />
                                Flow Count: {alert.flow_count}
                              </span>
                              <span className="text-slate-700">|</span>
                              <span>{formatTimestamp(alert.timestamp)} &mdash; {formatDate(alert.timestamp)}</span>
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
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <AlertTriangle size={48} className="mb-3 opacity-40" />
            <p className="text-sm font-medium text-slate-400">No alerts match your filters</p>
            <p className="text-xs text-slate-600 mt-1">Try adjusting your search criteria or clearing filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-navy-700 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600 transition-all"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {paginated.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-800">
            <p className="text-[11px] text-slate-500">
              Page <span className="text-slate-300 font-mono">{safePage}</span> of{' '}
              <span className="text-slate-300 font-mono">{totalPages}</span>
              <span className="ml-2">({filtered.length} total)</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-md hover:bg-navy-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
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
                  <span key={`ellipsis-${i}`} className="px-2 text-xs text-slate-600">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(Number(p))}
                    className={`w-8 h-8 rounded-md text-xs font-mono transition-all ${
                      safePage === p
                        ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30'
                        : 'text-slate-400 hover:text-white hover:bg-navy-700 border border-transparent'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-md hover:bg-navy-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
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
