import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Sparkles,
  User,
  LogOut,
  Shield,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  Globe,
  Sliders
} from 'lucide-react';

export const Navbar = ({ onOpenAddTransaction, onOpenAIAdvisor }) => {
  const { user, logout, isAdmin, isPro, demoLogin } = useAuth();
  const { currency, changeCurrency, availableCurrencies } = useCurrency();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const currRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (currRef.current && !currRef.current.contains(event.target)) {
        setShowCurrencyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#05070E]/70 backdrop-blur-2xl border-b border-white/[0.07] px-4 sm:px-6 flex items-center justify-between shadow-lg">
      {/* Left branding (mobile) / quick status */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 group md:hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-extrabold tracking-tight text-white text-base">AI Finance</span>
        </Link>

        {/* Pro Active Tag */}
        <div className="hidden sm:flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/30 rounded-full px-3 py-1 text-xs text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>AI Engine: <strong className="text-white">Active (v2.4)</strong></span>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action: Ask FinAdvisor */}
        <button
          onClick={() => navigate('/ai-advisor')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ask FinAdvisor AI</span>
        </button>

        {/* Currency Switcher */}
        <div className="relative" ref={currRef}>
          <button
            onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-colors"
            title="Change Currency"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{currency}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showCurrencyMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Display Currency
              </div>
              {availableCurrencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => {
                    changeCurrency(c.code);
                    setShowCurrencyMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    currency === c.code ? 'text-indigo-400 font-semibold bg-indigo-950/30' : 'text-slate-300'
                  }`}
                >
                  <span>{c.label}</span>
                  {currency === c.code && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
            title="Notifications & Insights"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700 shadow-2xl overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-sm text-white">Notifications & Insights</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 ${
                        !n.read ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === 'ALERT' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        ) : n.type === 'SUCCESS' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : n.type === 'REMINDER' ? (
                          <CreditCard className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Info className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-white mb-0.5">{n.title}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1"></span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                <span>{user?.name || 'Fintech User'}</span>
                {isPro && (
                  <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-indigo-500 text-black font-extrabold text-[9px] rounded">
                    PRO
                  </span>
                )}
                {isAdmin && (
                  <span className="px-1.5 py-0.2 bg-purple-600 text-white font-bold text-[9px] rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">{user?.email}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-50 animate-fade-in divide-y divide-slate-800">
              <div className="px-4 py-2.5">
                <div className="text-xs font-semibold text-white">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-indigo-400">
                  <Shield className="w-3 h-3" />
                  <span>Role: {user?.role}</span>
                  <span>•</span>
                  <span>Tier: {user?.tier}</span>
                </div>
              </div>

              {/* Quick 1-Click Role Switcher */}
              <div className="py-1 px-2">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  1-Click Role Switcher
                </div>
                <button
                  onClick={async () => {
                    await demoLogin('USER');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Switch to Regular User</span>
                </button>
                <button
                  onClick={async () => {
                    await demoLogin('ADMIN');
                    setShowUserMenu(false);
                    navigate('/admin');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Switch to Admin User</span>
                </button>
              </div>

              <div className="py-1">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-4 py-2 text-xs text-purple-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <Link
                  to="/pricing"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upgrade / Razorpay</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
