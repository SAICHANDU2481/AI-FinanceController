import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';
import { RazorpayCheckoutModal } from '../components/payments/RazorpayCheckoutModal';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Receipt,
  FileCheck
} from 'lucide-react';

export const Payments = () => {
  const { user, isPro } = useAuth();
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const [plansRes, historyRes] = await Promise.all([
        paymentAPI.getPlans(),
        paymentAPI.getHistory()
      ]);
      setPlans(plansRes.data.plans || []);
      setHistory(historyRes.data.records || []);
    } catch (err) {
      showToast('Failed to fetch pricing plans and history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const handleSelectPlan = (plan) => {
    if (plan.id === 'FREE') {
      showToast('You are already on the Starter plan', 'info');
      return;
    }
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Razorpay Test Mode Integration</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Upgrade Your Financial Intelligence
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Unlock autonomous predictive modeling, anomaly radars, and full-spectrum AI consultation.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map(plan => {
          const isCurrent = user?.tier === plan.id;
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative transition-all ${
                isPopular
                  ? 'border-indigo-500/60 shadow-2xl glow-indigo bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-lg text-white">{plan.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                      Active Plan
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-5 min-h-[32px]">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-800">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/{plan.period}</span>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    What's included:
                  </span>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-slate-800 text-slate-400 cursor-default'
                    : isPopular
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                <span>{isCurrent ? 'Current Tier' : plan.ctaText}</span>
                {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment History Audit Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-white text-base">Razorpay Billing & Payment History</h3>
              <p className="text-xs text-slate-400">Cryptographically verified payment audit trail</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">
            {history.length} Invoices
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
            No payments logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-950/60">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Payment ID</th>
                  <th className="py-3 px-3">Tier</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.map(record => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-300 truncate max-w-[140px] font-sans">
                      {record.razorpayOrderId}
                    </td>
                    <td className="py-3 px-3 text-slate-400 truncate max-w-[140px]">
                      {record.razorpayPaymentId || 'N/A'}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                        {record.planTier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans text-[11px]">
                      {record.paymentMethod || 'Razorpay Test Gateway'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      {new Date(record.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      ₹{record.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Razorpay Checkout Modal */}
      {isCheckoutOpen && selectedPlan && (
        <RazorpayCheckoutModal
          isOpen={isCheckoutOpen}
          plan={selectedPlan}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={fetchPaymentData}
        />
      )}
    </div>
  );
};
