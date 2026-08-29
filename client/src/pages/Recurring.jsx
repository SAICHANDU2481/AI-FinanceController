import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Repeat,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Zap,
  TrendingDown
} from 'lucide-react';

export const Recurring = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [recurringData, setRecurringData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getRecurring();
      setRecurringData(res.data);
    } catch (err) {
      showToast('Failed to load recurring subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Auditing Recurring Subscriptions & Bills...</p>
        </div>
      </div>
    );
  }

  const active = recurringData?.activeSubscriptions || [];
  const detected = recurringData?.detectedSubscriptions || [];
  const total = recurringData?.totalMonthlyRecurring || 0;
  const burden = recurringData?.subscriptionBurdenPercentage || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Recurring Bills & Subscriptions Detector
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Cadence Monitor
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Automated subscription tracking, renewal calendars, and leak elimination.
        </p>
      </div>

      {/* Summary Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Monthly Recurring Commitments
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {formatCurrency(total)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Across {active.length} active service subscriptions
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Monthly Income Burden
          </span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-2">
            {burden}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Target benchmark: &le; 40% of net salary
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-gradient-to-br from-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">AI Optimization Insight</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2">
            Eliminating duplicate streaming tiers can unlock ~<strong>₹800/mo</strong> in free cash flow.
          </p>
        </div>
      </div>

      {/* Active Subscriptions List */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Active Monitored Subscriptions</h3>
            <p className="text-xs text-slate-400">Scheduled auto-debits and recurring billing cycles</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            {active.length} Monitored
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {active.map(sub => (
            <div
              key={sub.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-sm shadow-sm">
                  {sub.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{sub.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                      {sub.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Next Due: {new Date(sub.nextDueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right font-mono">
                  <div className="text-base font-extrabold text-white">
                    {formatCurrency(sub.amount)}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-sans">
                    {sub.billingCycle}
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Pay
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
