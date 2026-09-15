import { useState, useEffect, useMemo } from 'react';
import { Activity, Shield, AlertTriangle, TrendingUp, Globe, Zap, HardDrive } from 'lucide-react';
import StatCard from '../components/StatCard';
import ThreatChart from '../components/ThreatChart';
import LiveFeed from '../components/LiveFeed';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../context/ThemeContext';
import { fetchStats, fetchHealth } from '../lib/api';

const DashboardPage: React.FC = () => {
  const { alerts, flows } = useWebSocketContext();
  const { isDark } = useTheme();
  const [stats, setStats] = useState<{
    total_flows: number;
    total_alerts: number;
    avg_confidence: number;
    flows_per_sec: number;
    active_connections: number;
  } | null>(null);
  const [health, setHealth] = useState<{ status: string; uptime: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [statsData, healthData] = await Promise.all([fetchStats(), fetchHealth()]);
        setStats(statsData);
        setHealth(healthData);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      }
      setLoading(false);
    };
    loadInitialData();
  }, []);

  const attackFlows = useMemo(() => flows.filter((f) => f.isAttack), [flows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Flows"
          value={stats ? stats.total_flows.toLocaleString() : '---'}
          change={12}
          changeLabel="vs last hour"
          icon={<Activity size={20} className="text-brand-blue" />}
          iconColor="text-brand-blue"
          sparkline={[45, 52, 49, 63, 58, 72, 68, 75, 82, 78, 85, 91]}
        />
        <StatCard
          title="Active Threats"
          value={stats ? stats.total_alerts.toString() : '---'}
          change={-8}
          changeLabel="vs last hour"
          icon={<Shield size={20} className="text-brand-amber" />}
          iconColor="text-brand-amber"
          sparkline={[120, 115, 118, 108, 112, 105, 98, 102, 95, 88, 92, 87]}
        />
        <StatCard
          title="Avg Confidence"
          value={stats ? stats.avg_confidence.toFixed(1) + '%' : '---'}
          change={3}
          changeLabel="model accuracy"
          icon={<AlertTriangle size={20} className="text-brand-green" />}
          iconColor="text-brand-green"
          sparkline={[72, 74, 73, 76, 75, 77, 78, 79, 77, 80, 78, 79]}
        />
        <StatCard
          title="Threat Level"
          value={
            stats && stats.total_alerts > 200 ? 'CRITICAL' : stats && stats.total_alerts > 100 ? 'ELEVATED' : 'NORMAL'
          }
          change={15}
          changeLabel="above baseline"
          icon={<TrendingUp size={20} className="text-brand-red" />}
          iconColor="text-brand-red"
          subtitle={health ? `Uptime: ${Math.floor(health.uptime / 3600)}h` : 'Monitor closely'}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Flows Per Second"
          value={stats ? stats.flows_per_sec.toString() : '---'}
          subtitle="current throughput"
          icon={<Zap size={20} className="text-brand-blue" />}
          iconColor="text-brand-blue"
        />
        <StatCard
          title="Active Connections"
          value={stats ? stats.active_connections.toLocaleString() : '---'}
          subtitle="simultaneous sessions"
          icon={<Globe size={20} className="text-brand-green" />}
          iconColor="text-brand-green"
        />
        <StatCard
          title="Attack Flows"
          value={attackFlows.length.toString()}
          subtitle="flagged in current window"
          icon={<HardDrive size={20} className="text-brand-red" />}
          iconColor="text-brand-red"
        />
      </div>

      {/* Real-Time Flows Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Real-Time Flows</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-700/50 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Source IP</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Dest IP</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Protocol</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Bytes</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {flows.slice(0, 10).map((flow) => (
                <tr key={flow.id} className="hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                    {new Date(flow.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-brand-blue">
                    {flow.src_ip}:{flow.src_port}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-brand-amber">
                    {flow.dst_ip}:{flow.dst_port}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-300">{flow.protocol}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                    {((flow.bytes_sent + flow.bytes_recv) / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-2.5">
                    {flow.isAttack ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        THREAT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-green/10 text-brand-green border border-brand-green/20">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {flows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Waiting for flow data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts and Live Feed Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <ThreatChart alerts={alerts} darkMode={isDark} />
        </div>
        <div className="xl:col-span-1">
          <LiveFeed alerts={alerts} maxVisible={20} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
