import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export const MetricCard = ({
  title,
  value,
  subValue,
  change,
  isPositive = true,
  icon: Icon,
  color = 'indigo',
  badge
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-950/30',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
      glow: 'glow-indigo'
    },
    emerald: {
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'glow-emerald'
    },
    rose: {
      bg: 'bg-rose-950/30',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      glow: 'glow-rose'
    },
    cyan: {
      bg: 'bg-cyan-950/30',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'glow-cyan'
    },
    purple: {
      bg: 'bg-purple-950/30',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'glow-indigo'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden border ${scheme.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          {badge && (
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
              {badge}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${scheme.bg} border ${scheme.border} flex items-center justify-center ${scheme.text} shadow-sm`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mb-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </h2>
      </div>

      <div className="flex items-center justify-between text-xs">
        {change !== undefined ? (
          <div className={`flex items-center gap-1 font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        ) : (
          <span className="text-slate-400">{subValue || 'Real-time live ledger'}</span>
        )}

        {subValue && change !== undefined && (
          <span className="text-slate-400 text-[11px]">{subValue}</span>
        )}
      </div>
    </div>
  );
};
