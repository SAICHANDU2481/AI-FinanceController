import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const Analytics = () => {
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [forecastData, setForecastData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [cashflowData, setCashflowData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [forecastRes, anomalyRes, cashflowRes] = await Promise.all([
        analyticsAPI.getForecast(),
        analyticsAPI.getAnomalies(),
        analyticsAPI.getCashflowHistory()
      ]);

      setForecastData(forecastRes.data);
      setAnomalies(anomalyRes.data?.anomalies || []);
      setCashflowData(cashflowRes.data || []);
    } catch (err) {
      showToast('Failed to load predictive analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDismissAnomaly = async (id) => {
    try {
      await analyticsAPI.dismissAnomaly(id);
      setAnomalies(prev => prev.filter(a => a.id !== id));
      showToast('Anomaly marked as expected and resolved', 'success');
    } catch (err) {
      showToast('Failed to dismiss anomaly', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Computing 30-Day Predictive Models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            AI Analytics & Predictive Cockpit
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Linear Regression + Seasonality
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          30-day cumulative cash flow projections, statistical Z-score outlier detection, and velocity monitors.
        </p>
      </div>

      {/* 30-Day Forecast Main Hero Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">30-Day Cumulative Expense Forecast</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Projected daily burn rate with upper & lower 90% confidence bounds
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Avg Daily Burn</span>
              <span className="font-bold text-white">{formatCurrency(forecastData?.avgDailySpend || 0)}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Projected 30-Day Spend</span>
              <span className="font-bold text-rose-400">{formatCurrency(forecastData?.projected30DaySpend || 0)}</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Projected Surplus</span>
              <span className="font-bold text-emerald-400">{formatCurrency(forecastData?.projectedSurplus || 0)}</span>
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData?.forecast || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                formatter={(val, name) => [
                  formatCurrency(val),
                  name === 'cumulativeSpend' ? 'Expected Spend' : name === 'upperBound' ? 'Upper Bound' : 'Lower Bound'
                ]}
              />
              <Area type="monotone" dataKey="upperBound" stroke="#4F46E5" fillOpacity={1} fill="url(#colorUpper)" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="cumulativeSpend" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
              <Area type="monotone" dataKey="lowerBound" stroke="#10B981" fillOpacity={0} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Forecast Insights */}
        {forecastData?.insights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
            {forecastData.insights.map((insight, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Anomaly & Unusual Spending Radar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Unusual Spending & Anomaly Radar</h3>
              <p className="text-xs text-slate-400">Statistical outlier detection using 60-day moving Z-scores</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {anomalies.length} Flagged Incidents
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <span>No unresolved spending spikes detected. All charges align with baseline models.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map(a => (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-slate-900"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      a.severity === 'CRITICAL' || a.severity === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      {a.severity} SEVERITY
                    </span>
                    <span className="text-xs font-bold text-white">{a.merchant || a.category}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-mono font-bold text-rose-400">{formatCurrency(a.amount)}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {a.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDismissAnomaly(a.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Mark as Expected
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
