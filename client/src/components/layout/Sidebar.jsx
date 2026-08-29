import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  Sparkles,
  Target,
  Repeat,
  CreditCard,
  ShieldAlert,
  Zap,
  ChevronRight
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin, isPro } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { to: '/budgets', label: 'Budgets & Limits', icon: PieChart },
    { to: '/analytics', label: 'Analytics & Forecast', icon: TrendingUp, badge: 'AI' },
    { to: '/ai-advisor', label: 'FinAdvisor AI', icon: Sparkles, highlight: true },
    { to: '/goals', label: 'Savings Goals', icon: Target },
    { to: '/recurring', label: 'Recurring Bills', icon: Repeat },
    { to: '/pricing', label: 'Plans & Razorpay', icon: CreditCard }
  ];

  return (
    <aside className="w-64 bg-[#05070E]/85 backdrop-blur-2xl border-r border-white/[0.07] flex flex-col flex-shrink-0 h-screen sticky top-0 shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-white/[0.07]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg glow-indigo">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-base text-white tracking-tight leading-tight">
            AI Finance
          </h1>
          <span className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase">
            Controller Cockpit
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Financial Hub
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/40 shadow-lg glow-indigo'
                      : 'bg-slate-800/90 text-indigo-400 border border-slate-700/80 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${item.highlight ? 'text-indigo-400' : ''}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[9px] border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Admin Navigation Section */}
        {isAdmin && (
          <>
            <div className="pt-4 px-3 py-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
              <span>Administration</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40 shadow-lg'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/20'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-purple-400 transition-transform group-hover:scale-110" />
                <span>Admin Dashboard</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </NavLink>
          </>
        )}
      </div>

      {/* Pro Tier Upgrade Card in Sidebar Footer */}
      <div className="p-3.5 border-t border-white/[0.07] bg-[#05070E]/60">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
              {isPro ? 'Pro Subscription' : 'Upgrade Cockpit'}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-300 leading-tight mb-2.5">
            {isPro
              ? 'Autonomous AI models & Razorpay enabled'
              : 'Unlock 30-day predictive cash flow & anomaly radar.'}
          </p>
          <Link
            to="/pricing"
            className="block w-full py-1.5 text-center text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
          >
            {isPro ? 'Manage Tier' : 'Upgrade to Pro'}
          </Link>
        </div>
      </div>
    </aside>
  );
};
