import React, { useState, useEffect } from 'react';
import { budgetAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Sliders,
  Trash2,
  X,
  Sparkles
} from 'lucide-react';

export const Budgets = () => {
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({ totalBudgeted: 0, totalSpent: 0, overallPercentage: 0 });
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formCategory, setFormCategory] = useState('Food & Dining');
  const [formLimit, setFormLimit] = useState('');
  const [formThreshold, setFormThreshold] = useState(80);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Food & Dining',
    'Groceries',
    'Shopping',
    'Housing & Rent',
    'Utilities',
    'Transportation',
    'Entertainment',
    'Healthcare',
    'Investment',
    'Other'
  ];

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await budgetAPI.list();
      setBudgets(res.data.budgets || []);
      setSummary(res.data.summary || { totalBudgeted: 0, totalSpent: 0, overallPercentage: 0 });
    } catch (err) {
      showToast('Failed to fetch budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setFormCategory('Food & Dining');
    setFormLimit('');
    setFormThreshold(80);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budget) => {
    setEditingBudget(budget);
    setFormCategory(budget.category);
    setFormLimit(budget.limitAmount);
    setFormThreshold(budget.alertThreshold || 80);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!formLimit || parseFloat(formLimit) <= 0) {
      showToast('Please enter a valid budget limit', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBudget) {
        await budgetAPI.update(editingBudget.id, {
          limitAmount: parseFloat(formLimit),
          alertThreshold: parseFloat(formThreshold)
        });
        showToast('Budget updated successfully', 'success');
      } else {
        await budgetAPI.create({
          category: formCategory,
          limitAmount: parseFloat(formLimit),
          alertThreshold: parseFloat(formThreshold)
        });
        showToast('Budget limit created', 'success');
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save budget', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this category budget?')) return;
    try {
      await budgetAPI.delete(id);
      showToast('Budget removed', 'info');
      fetchBudgets();
    } catch (err) {
      showToast('Failed to delete budget', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Budget Management & Spending Limits
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic threshold tracking with projected burn-rate pace analytics.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Overall Budget Progress Hero */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Monthly Budget Utilization
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(summary.totalSpent)} <span className="text-sm font-sans font-normal text-slate-400">of {formatCurrency(summary.totalBudgeted)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400">Remaining Cushion</span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {formatCurrency(summary.totalRemaining)}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-xl text-xs font-bold ${
              summary.overallPercentage > 90
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
            }`}>
              {summary.overallPercentage}% Used
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              summary.overallPercentage > 100
                ? 'bg-rose-500 shadow-lg glow-rose'
                : summary.overallPercentage > 80
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
            }`}
            style={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Category Budget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map(b => {
          const isDanger = b.percentage >= 100;
          const isWarning = b.percentage >= b.alertThreshold && !isDanger;

          return (
            <div
              key={b.id}
              className={`glass-card rounded-2xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                isDanger
                  ? 'border-rose-500/40 shadow-lg glow-rose'
                  : isWarning
                  ? 'border-amber-500/40'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{b.category}</h3>
                    {isDanger && (
                      <span className="px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Over Limit
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Budget"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2 font-mono">
                  <span className="text-lg font-extrabold text-white">
                    {formatCurrency(b.spent)}
                  </span>
                  <span className="text-xs text-slate-400">
                    Limit: {formatCurrency(b.limitAmount)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mb-3 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDanger
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>
              </div>

              {/* Burn Rate projection footer */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{b.percentage}% utilized</span>
                <span className="text-slate-300">
                  Projected: <strong>{formatCurrency(b.projectedMonthEnd)}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-white text-base">
                {editingBudget ? `Edit ${editingBudget.category} Budget` : 'Set New Category Budget'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              {!editingBudget && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monthly Limit ({symbol}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 15000"
                  value={formLimit}
                  onChange={e => setFormLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alert Trigger Threshold: <strong>{formThreshold}%</strong>
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={formThreshold}
                  onChange={e => setFormThreshold(e.target.value)}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  FinAdvisor will alert you once spending exceeds {formThreshold}% of the limit.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
