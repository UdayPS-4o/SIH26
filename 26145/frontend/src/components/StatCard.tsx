import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  sparkline?: number[];
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColor = 'text-brand-blue',
  sparkline,
  subtitle,
}) => {
  const getChangeColor = (changeVal: number) => {
    if (changeVal > 0) return 'text-brand-green';
    if (changeVal < 0) return 'text-brand-red';
    return 'text-slate-400';
  };

  const getChangeIcon = (changeVal: number) => {
    if (changeVal > 0) return <TrendingUp size={14} />;
    if (changeVal < 0) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const maxSpark = sparkline ? Math.max(...sparkline) : 0;
  const minSpark = sparkline ? Math.min(...sparkline) : 0;
  const sparkRange = maxSpark - minSpark || 1;

  return (
    <div className="card p-5 hover:border-brand-blue/30 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${iconColor}`}>{icon}</span>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${getChangeColor(change)}`}>
            {getChangeIcon(change)}
            <span className="text-xs font-semibold">{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 h-10 w-full">
          <svg viewBox={`0 0 ${sparkline.length - 1} 10`} className="w-full h-full overflow-visible">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-blue"
              points={sparkline
                .map((val, i) => `${i},${10 - ((val - minSpark) / sparkRange) * 10}`)
                .join(' ')}
            />
          </svg>
        </div>
      )}

      {changeLabel && (
        <p className="text-xs text-slate-500 mt-2">{changeLabel}</p>
      )}
    </div>
  );
};

export default StatCard;
