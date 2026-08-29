import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';
import { ReceiptScannerModal } from '../components/transactions/ReceiptScannerModal';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

export const Transactions = () => {
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState(false);
  const [recurringFilter, setRecurringFilter] = useState(false);
  const [page, setPage] = useState(1);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const categories = [
    'ALL',
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

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(search && { search }),
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
        ...(categoryFilter !== 'ALL' && { category: categoryFilter }),
        ...(anomalyFilter && { isAnomaly: 'true' }),
        ...(recurringFilter && { isRecurring: 'true' })
      };

      const res = await transactionAPI.list(params);
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      showToast('Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, categoryFilter, anomalyFilter, recurringFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionAPI.delete(id);
      showToast('Transaction deleted', 'info');
      fetchTransactions();
    } catch (err) {
      showToast('Failed to delete transaction', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, filter, and audit multi-channel financial outflows and inflows.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={transactionAPI.exportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scan Receipt</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search description, merchant, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Types (Income & Outflow)</option>
              <option value="EXPENSE">Expenses Only</option>
              <option value="INCOME">Income Only</option>
              <option value="INVESTMENT">Investments Only</option>
              <option value="TRANSFER">Transfers Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Toggle Chips */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setAnomalyFilter(!anomalyFilter); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              anomalyFilter
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>AI Anomalies Only</span>
          </button>

          <button
            type="button"
            onClick={() => { setRecurringFilter(!recurringFilter); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              recurringFilter
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recurring Subscriptions Only</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-950/60">
                <th className="py-3.5 px-4">Transaction / Merchant</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">AI Verification</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No transactions match your current filters.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {tx.description}
                      </div>
                      <div className="text-[10px] text-slate-400">{tx.merchant || 'Self'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : tx.type === 'INVESTMENT'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {tx.type}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{tx.category}</div>
                      {tx.subCategory && (
                        <div className="text-[10px] text-slate-400">{tx.subCategory}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {tx.isAnomaly ? (
                        <div className="text-rose-400 font-semibold flex items-center gap-1 text-[11px]" title={tx.anomalyReason}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Anomaly Flagged</span>
                        </div>
                      ) : (
                        <div className="text-indigo-400 flex items-center gap-1 text-[11px]">
                          <Sparkles className="w-3 h-3" />
                          <span>{Math.round(tx.aiCategoryConfidence * 100)}% Match</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {tx.paymentMethod}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    <td className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                      tx.type === 'INCOME'
                        ? 'text-emerald-400'
                        : tx.type === 'INVESTMENT'
                        ? 'text-purple-400'
                        : 'text-white'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchTransactions}
      />
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
};
