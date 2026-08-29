import React from 'react';
import { ShieldCheck, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

export const HealthScoreGauge = ({ healthData }) => {
  if (!healthData) return null;

  const { score = 82, status = 'Excellent', badgeColor = 'emerald', breakdown = [] } = healthData;

  // SVG Gauge calculations
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (score / 100) * circumference;

  const getColorHex = () => {
    if (score >= 80) return '#10B981'; // Emerald
    if (score >= 65) return '#06B6D4'; // Cyan
    if (score >= 45) return '#F59E0B'; // Amber
    return '#F43F5E'; // Rose
  };

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-slate-800">
      {/* Background glow accent */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: getColorHex() }}
      />

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">Financial Health Score</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              AI Multi-Factor
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Computed across 4 wealth & stability pillars
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${getColorHex()}20`,
            color: getColorHex(),
            border: `1px solid ${getColorHex()}40`
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Gauge Visual */}
        <div className="md:col-span-4 flex flex-col items-center justify-center relative">
          <div className="relative w-[180px] h-[180px] flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
              {/* Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#1E293B"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Value Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={getColorHex()}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>

            {/* Score Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold tracking-tight text-white">
                {score}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                out of 100
              </span>
            </div>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div className="md:col-span-8 space-y-3">
          {breakdown.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{item.pillar}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                    {item.status}
                  </span>
                </div>
                <span className="font-bold text-slate-300">
                  {item.score}/{item.maxScore} pts ({item.percentage}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, item.percentage)}%`,
                    backgroundColor:
                      item.percentage >= 80 ? '#10B981' : item.percentage >= 60 ? '#06B6D4' : '#F59E0B'
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
