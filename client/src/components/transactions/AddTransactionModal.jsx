import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { Sparkles, X, AlertTriangle, CheckCircle, Tag, Calendar, CreditCard, DollarSign } from 'lucide-react';

export const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const { symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    merchant: '',
    category: 'Auto',
    subCategory: '',
    paymentMethod: 'UPI',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false
  });

  const [aiPrediction, setAiPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Categories list
  const categories = [
    'Auto (AI Selected)',
    'Food & Dining',
    'Groceries',
    'Shopping',
    'Housing & Rent',
    'Utilities',
    'Transportation',
    'Entertainment',
    'Healthcare',
    'Investment',
    'Salary',
    'Freelance',
    'Other'
  ];

  // Trigger AI auto-categorization when description or merchant changes
  useEffect(() => {
    const text = `${formData.description} ${formData.merchant}`.trim();
    if (text.length >= 3 && formData.type === 'EXPENSE') {
      const timer = setTimeout(async () => {
        setIsPredicting(true);
        try {
          const res = await transactionAPI.aiCategorize({
            description: formData.description,
            amount: parseFloat(formData.amount) || 0,
            merchant: formData.merchant
          });
          setAiPrediction(res.data);
          if (formData.category === 'Auto' || formData.category === 'Auto (AI Selected)') {
            setFormData(prev => ({ ...prev, subCategory: res.data.subCategory || '' }));
          }
        } catch (e) {
          console.warn('AI Categorize preview error:', e);
        } finally {
          setIsPredicting(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setAiPrediction(null);
    }
  }, [formData.description, formData.merchant, formData.amount, formData.type]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      showToast('Please enter both amount and description', 'error');
      return;
    }

    setLoading(true);
    try {
      const finalCategory = formData.category.includes('Auto')
        ? (aiPrediction?.category || 'Shopping')
        : formData.category;

      await transactionAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
        category: finalCategory,
        subCategory: formData.subCategory || aiPrediction?.subCategory
      });

      showToast('Transaction logged successfully', 'success', 'Ledger Updated');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  const parsedAmount = parseFloat(formData.amount) || 0;
  const isHighSpend = formData.type === 'EXPENSE' && parsedAmount > 25000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Log New Transaction</h3>
              <p className="text-[11px] text-slate-400">AI auto-categorization enabled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Type Selector Pills */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'EXPENSE', label: 'Expense' },
              { id: 'INCOME', label: 'Income' },
              { id: 'INVESTMENT', label: 'Invest' },
              { id: 'TRANSFER', label: 'Transfer' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: t.id })}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  formData.type === t.id
                    ? t.id === 'INCOME'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : t.id === 'INVESTMENT'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Amount & Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Amount ({symbol}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                {symbol}
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* High Spend Anomaly Notice */}
          {isHighSpend && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>High-Value Outflow:</strong> Spending {symbol}{parsedAmount.toLocaleString()} exceeds average transaction benchmarks. AI will monitor for budget variance.
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy Gourmet Burger, Amazon Monitor, Salary"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Merchant & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Merchant / Payee
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Uber, Tata Power"
                value={formData.merchant}
                onChange={e => setFormData({ ...formData, merchant: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="NETBANKING">Net Banking / IMPS</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          {/* Category with AI Auto-fill badge */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Category
              </label>
              {aiPrediction && (
                <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium animate-fade-in">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>AI Match: <strong>{aiPrediction.category}</strong> ({Math.round(aiPrediction.confidence * 100)}% conf)</span>
                </div>
              )}
            </div>

            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {aiPrediction?.explanation && (
              <p className="text-[11px] text-slate-400 mt-1 italic">
                ℹ️ {aiPrediction.explanation}
              </p>
            )}
          </div>

          {/* Date & Recurring Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0"
              />
              <label htmlFor="isRecurring" className="text-xs text-slate-300 cursor-pointer">
                Mark as Recurring Subscription
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Transaction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
