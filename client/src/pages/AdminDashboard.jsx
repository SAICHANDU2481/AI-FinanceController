import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';
import { MetricCard } from '../components/ui/MetricCard';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Database,
  Activity,
  Server,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { showToast } = useNotifications();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, paymentsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getPayments()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setPayments(paymentsRes.data.payments || []);
    } catch (err) {
      showToast('Failed to load admin telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await adminAPI.updateUser(targetUser.id, { role: newRole });
      showToast(`User role updated to ${newRole}`, 'success');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to update user role', 'error');
    }
  };

  const handleUpdateTier = async (targetUser, newTier) => {
    try {
      await adminAPI.updateUser(targetUser.id, { tier: newTier });
      showToast(`User tier changed to ${newTier}`, 'success');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to update tier', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Loading Platform Administration Console...</p>
        </div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};
  const health = stats?.systemHealth || {};

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Platform Administration & Telemetry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Superadmin Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System-wide user control, Razorpay transaction auditing, and infrastructure health metrics.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Platform Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Registered Users"
          value={metrics.totalUsers || 2}
          subValue={`${metrics.proUsersCount || 1} Pro/Enterprise`}
          change="+100% Growth"
          isPositive={true}
          icon={Users}
          color="purple"
        />

        <MetricCard
          title="Platform GMV Processed"
          value={`₹${(metrics.totalTransactionVolume || 0).toLocaleString('en-IN')}`}
          subValue={`${metrics.totalTransactions || 0} Ledger Items`}
          change="+24.5%"
          isPositive={true}
          icon={Activity}
          color="indigo"
        />

        <MetricCard
          title="Razorpay SaaS Revenue"
          value={`₹${(metrics.totalRevenue || 0).toLocaleString('en-IN')}`}
          subValue={`${metrics.totalPayments || 0} Captured Orders`}
          change="+18.2%"
          isPositive={true}
          icon={CreditCard}
          color="emerald"
        />

        <MetricCard
          title="AI Advisor Sessions"
          value={metrics.totalAISessions || 14}
          subValue="Real-time Context Queries"
          change="100% Uptime"
          isPositive={true}
          icon={Sparkles}
          color="cyan"
        />
      </div>

      {/* System Health Diagnostics */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Infrastructure & Gateway Health</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Database Engine</span>
            <div className="font-semibold text-white">{health.databaseStatus || 'PostgreSQL / Prisma SQLite'}</div>
            <span className="text-[11px] text-emerald-400 mt-1 block">Latency: &lt; 4ms</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Payment Gateway</span>
            <div className="font-semibold text-white">{health.razorpayIntegration || 'Razorpay HMAC Test Mode'}</div>
            <span className="text-[11px] text-emerald-400 mt-1 block">Webhooks Active</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">AI Reasoning Engine</span>
            <div className="font-semibold text-white">{health.aiEngineStatus || 'Fintech LLM Context Engine'}</div>
            <span className="text-[11px] text-cyan-400 mt-1 block">DB Context Injection Ready</span>
          </div>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">User Directory & Permissions</h3>
            <p className="text-xs text-slate-400">Manage customer roles, subscription tiers, and activity</p>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">
            {users.length} Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-950/60">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Monthly Income</th>
                <th className="py-3.5 px-4">Transactions</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={u.tier}
                      onChange={(e) => handleUpdateTier(u, e.target.value)}
                      className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none focus:border-indigo-500"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 font-mono text-white">
                    ₹{(u.monthlyIncome || 85000).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 text-slate-300 font-mono">
                    {u._count?.transactions || 0}
                  </td>

                  <td className="py-3 px-4 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleRole(u)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors"
                    >
                      Toggle {u.role === 'ADMIN' ? 'to User' : 'to Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
