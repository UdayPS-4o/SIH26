import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Alert } from '../types';

interface ThreatChartProps {
  alerts: Alert[];
  darkMode: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const ThreatChart: React.FC<ThreatChartProps> = ({ alerts, darkMode }) => {
  const timeSeriesData = useMemo(() => {
    const buckets: Record<string, number> = {};
    alerts.forEach((alert) => {
      const date = new Date(alert.timestamp);
      const key = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([time, count]) => ({ time, count }))
      .slice(-20);
  }, [alerts]);

  const threatTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((alert) => {
      counts[alert.threat_type] = (counts[alert.threat_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [alerts]);

  const severityData = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((alert) => {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [alerts]);

  const axisColor = darkMode ? '#94a3b8' : '#475569';
  const gridColor = darkMode ? '#1e293b' : '#e2e8f0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Time Series */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Alert Timeline</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: axisColor }}
              stroke={gridColor}
            />
            <YAxis
              tick={{ fontSize: 11, fill: axisColor }}
              stroke={gridColor}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#111827' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Severity Donut */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Severity Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={severityData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {severityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#111827' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => (
                <span style={{ color: axisColor }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const ThreatTypeChart: React.FC<{ alerts: Alert[]; darkMode: boolean }> = ({ alerts, darkMode }) => {
  const threatTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((alert) => {
      counts[alert.threat_type] = (counts[alert.threat_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [alerts]);

  const axisColor = darkMode ? '#94a3b8' : '#475569';
  const gridColor = darkMode ? '#1e293b' : '#e2e8f0';

  return (
    <div className="card p-4 h-full">
      <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Threat Types</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={threatTypeData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} stroke={gridColor} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: axisColor }}
            stroke={gridColor}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? '#111827' : '#ffffff',
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ThreatChart;
