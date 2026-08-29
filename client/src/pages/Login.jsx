import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  Zap,
  ArrowRight,
  Shield,
  User,
  CheckCircle2
} from 'lucide-react';

export const Login = () => {
  const { login, demoLogin } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back to AI Finance Controller!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.error || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    try {
      await demoLogin(role);
      showToast(`Signed in as ${role === 'ADMIN' ? 'Chief Admin' : 'Alex Mercer (Demo User)'}`, 'success');
      navigate(role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      showToast('Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070E] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden text-slate-100">
      {/* Top luminous accent beam */}
      <div className="fintech-accent-beam" />

      {/* Layered ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-indigo-500/20 via-purple-600/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-10 right-[-100px] w-[500px] h-[500px] bg-cyan-500/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-100px] left-[10%] w-[600px] h-[500px] bg-violet-600/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 fintech-bg-grid opacity-70" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 mx-auto flex items-center justify-center text-white shadow-xl glow-indigo">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Finance Controller
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous financial intelligence & cash flow management
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          {/* 1-Click Fast Evaluation Buttons */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Fast 1-Click Demo Evaluation
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('USER')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-left transition-all text-xs group"
              >
                <div className="flex items-center gap-1.5 font-bold text-indigo-200">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Demo User</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Alex (Pro Tier)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('ADMIN')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-left transition-all text-xs group"
              >
                <div className="flex items-center gap-1.5 font-bold text-purple-200">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Demo Admin</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Full Superadmin</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-[#111726] px-3 text-[10px] uppercase font-bold text-slate-500 absolute">
              Or sign in with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="alex.fintech@aifinance.io"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Cockpit'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch to Register */}
          <div className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
