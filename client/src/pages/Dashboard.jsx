import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { analyticsAPI, transactionAPI, aiAPI } from '../services/api';
import { MetricCard } from '../components/ui/MetricCard';
import { HealthScoreGauge } from '../components/ui/HealthScoreGauge';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';
import { ReceiptScannerModal } from '../components/transactions/ReceiptScannerModal';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Sparkles,
  PlusCircle,
  Camera,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  CreditCard,
  CheckCircle
} from 'lucide-react';

const DONUT_COLORS = ['#6366F1', '#10B981', '#F43F5E', '#F59E0B', '#06B6D4', '#8B5CF6', '#EC4899', '#64748B'];

export const Dashboard = () => {
  const { user } = useAuth();
  const { formatCurrency, symbol } = useCurrency();
  const navigate = useNavigate();

  const [healthData, setHealthData] = useState(null);
  const [cashflowData, setCashflowData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [healthRes, cashflowRes, categoryRes, txRes, anomalyRes, promptRes] = await Promise.all([
        analyticsAPI.getHealthScore(),
        analyticsAPI.getCashflowHistory(),
        analyticsAPI.getCategoryBreakdown(),
        transactionAPI.list({ limit: 6 }),
        analyticsAPI.getAnomalies(),
        aiAPI.getQuickPrompts()
      ]);

      setHealthData(healthRes.data);
      setCashflowData(cashflowRes.data || []);
      setCategoryData(categoryRes.data?.categories || []);
      setRecentTransactions(txRes.data?.transactions || []);
      setAnomalies(anomalyRes.data?.anomalies || []);
      setQuickPrompts(promptRes.data?.prompts || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Loading AI Financial Intelligence...</p>
        </div>
      </div>
    );
  }

  const metrics = healthData?.metrics || {
    totalBalance: 185000,
    currentIncome: 125000,
    currentExpenses: 68450,
    netSavings: 56550,
    savingsRate: 45.2
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.name?.split(' ')[0] || 'Alex'} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Autonomous Cockpit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time portfolio intelligence, automated anomaly checks, and live AI guidance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all shadow-sm"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Scan Receipt</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Transaction</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net Liquid Balance"
          value={formatCurrency(metrics.totalBalance)}
          subValue={`${metrics.runwayMonths || 3.8} mo liquid runway`}
          change="+12.4% MoM"
          isPositive={true}
          icon={Wallet}
          color="indigo"
          badge="Live"
        />

        <MetricCard
          title="Monthly Inflow"
          value={formatCurrency(metrics.currentIncome)}
          subValue="Salary + Consulting"
          change="+4.2%"
          isPositive={true}
          icon={ArrowUpRight}
          color="emerald"
        />

        <MetricCard
          title="Monthly Outflow"
          value={formatCurrency(metrics.currentExpenses)}
          subValue="Active month spending"
          change="-8.1%"
          isPositive={true} // Decreased expenses is positive
          icon={ArrowDownRight}
          color="rose"
        />

        <MetricCard
          title="Net Savings Rate"
          value={`${metrics.savingsRate}%`}
          subValue={`Surplus: ${formatCurrency(metrics.netSavings)}`}
          change={metrics.savingsRate >= 25 ? 'Target Met (≥25%)' : 'Below Target'}
          isPositive={metrics.savingsRate >= 20}
          icon={PiggyBank}
          color="cyan"
        />
      </div>

      {/* Anomaly Alert Spotlight (If detected) */}
      {anomalies.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">AI Anomaly Radar</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 text-[10px] font-bold">
                  {anomalies.length} Flagged
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {anomalies[0]?.description}
              </p>
            </div>
          </div>

          <Link
            to="/analytics"
            className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span>Review Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Row 2: Financial Health Score Gauge & AI Quick Action Pills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Health Score Gauge (7 Cols) */}
        <div className="lg:col-span-7">
          <HealthScoreGauge healthData={healthData} />
        </div>

        {/* AI FinAdvisor Grounded Context Card (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">FinAdvisor AI</h3>
                  <span className="text-[10px] text-indigo-400 font-semibold">Grounded in your real DB ledger</span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Ask deep questions about your spending leaks, affordability for upcoming purchases, or scenario simulations.
            </p>

            <div className="space-y-2">
              {quickPrompts.slice(0, 3).map(qp => (
                <button
                  key={qp.id}
                  onClick={() => navigate('/ai-advisor', { state: { initialPrompt: qp.prompt } })}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-200 transition-all flex items-center justify-between group"
                >
                  <span className="font-medium text-slate-300 group-hover:text-white truncate">
                    💬 {qp.title}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link
              to="/ai-advisor"
              className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Launch Full AI Chat Session</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: 6-Month Cash Flow Trend & Category Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cash Flow History Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Cash Flow Trend</h3>
              <p className="text-xs text-slate-400">Income vs Expenses over the last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-3 h-3 rounded bg-indigo-500 inline-block"></span> Income
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span> Outflow
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
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
                    fontSize: '12px',
                    color: '#fff'
                  }}
                  formatter={(val) => [formatCurrency(val), '']}
                />
                <Bar dataKey="income" name="Income" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Donut (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white text-base">Expense Breakdown</h3>
              <span className="text-xs text-slate-400 font-mono">This Month</span>
            </div>

            <div className="h-52 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [formatCurrency(val), 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Top Category</span>
                <span className="text-sm font-bold text-white truncate max-w-[100px]">
                  {categoryData[0]?.category || 'None'}
                </span>
              </div>
            </div>

            {/* Category mini-legend */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categoryData.slice(0, 4).map((c, i) => (
                <div key={c.category} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}></span>
                    <span className="text-slate-300 truncate">{c.category}</span>
                  </div>
                  <span className="font-semibold text-slate-200">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Transactions Table with AI Confidence */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base">Recent Ledger Activity</h3>
            <p className="text-xs text-slate-400">Transactions with real-time AI classification tags</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Transaction</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">AI Tag</th>
                <th className="pb-3 px-3">Channel</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {tx.description}
                    </div>
                    {tx.merchant && <div className="text-[10px] text-slate-400">{tx.merchant}</div>}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {tx.isAnomaly ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold text-[10px] flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3 text-rose-400" /> Anomaly
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold flex items-center gap-1 w-fit">
                        <Sparkles className="w-3 h-3 text-indigo-400" /> {Math.round(tx.aiCategoryConfidence * 100)}% Match
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {tx.paymentMethod}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono font-bold text-sm ${
                    tx.type === 'INCOME'
                      ? 'text-emerald-400'
                      : tx.type === 'INVESTMENT'
                      ? 'text-purple-400'
                      : 'text-white'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadDashboardData}
      />
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};
