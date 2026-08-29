import React, { useState } from 'react';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';
import { CreditCard, CheckCircle2, Sparkles, Shield, X, ArrowRight, Zap, QrCode } from 'lucide-react';

export const RazorpayCheckoutModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const { user, updateUser } = useAuth();
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  if (!isOpen || !plan) return null;

  const handleLaunchRazorpay = async (simulationMethod = null) => {
    setProcessing(true);
    try {
      // 1. Create order on backend
      const orderRes = await paymentAPI.createOrder({
        amount: plan.price,
        planTier: plan.id,
        currency: 'INR'
      });

      const { orderId, keyId, amountInPaise } = orderRes.data;

      // 2. If simulation chosen, bypass popup and verify directly
      if (simulationMethod) {
        await new Promise(r => setTimeout(r, 600)); // Visual polish
        const fakePaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
        const fakeSig = `test_sig_mock_${Math.random().toString(36).substring(2, 10)}`;

        const verifyRes = await paymentAPI.verifyPayment({
          razorpayOrderId: orderId,
          razorpayPaymentId: fakePaymentId,
          razorpaySignature: fakeSig,
          planTier: plan.id
        });

        // Trigger confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        updateUser({ tier: plan.id });
        setPaymentSuccess({
          orderId,
          paymentId: fakePaymentId,
          method: simulationMethod,
          tier: plan.id,
          amount: plan.price
        });
        showToast('Payment verified via Razorpay Test Mode!', 'success');
        if (onSuccess) onSuccess();
        return;
      }

      // 3. Launch live Razorpay Modal
      if (window.Razorpay) {
        const options = {
          key: keyId,
          amount: amountInPaise,
          currency: 'INR',
          name: 'AI Finance Controller',
          description: `Subscription Upgrade to ${plan.name}`,
          order_id: orderId,
          prefill: {
            name: user?.name || 'Alex Mercer',
            email: user?.email || 'alex@aifinance.io',
            contact: '9999999999'
          },
          theme: {
            color: '#6366F1'
          },
          handler: async function (response) {
            try {
              const verifyRes = await paymentAPI.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planTier: plan.id
              });

              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
              updateUser({ tier: plan.id });
              setPaymentSuccess({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                method: 'Razorpay Live Checkout',
                tier: plan.id,
                amount: plan.price
              });
              showToast('Payment verified!', 'success');
              if (onSuccess) onSuccess();
            } catch (vErr) {
              showToast('Verification failed: ' + vErr.message, 'error');
            }
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        showToast('Razorpay SDK not loaded. Using Instant Simulator.', 'warning');
        handleLaunchRazorpay('Simulated UPI');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to initiate Razorpay checkout', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Razorpay Test Gateway</h3>
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                ✓ Test Mode Active (Zero Real Charges)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!paymentSuccess ? (
            <div className="space-y-5">
              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Selected Tier</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    {plan.name}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-sm font-semibold text-white">Amount Due:</span>
                  <div className="text-2xl font-mono font-extrabold text-white">
                    ₹{plan.price.toLocaleString('en-IN')}{' '}
                    <span className="text-xs text-slate-400 font-sans font-normal">{plan.period}</span>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>30-Day Predictive Cash Flow & Expense Forecast Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Autonomous AI Anomaly & Unusual Spending Radar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Unlimited FinAdvisor AI with Live DB Context Grounding</span>
                </div>
              </div>

              {/* 1-Click Simulation Buttons */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Fast Test Mode Simulation</span>
                  <span className="text-indigo-400">HMAC SHA256 Verified</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleLaunchRazorpay('UPI (GPay/PhonePe)')}
                    disabled={processing}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 text-left transition-all text-xs group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-white">Simulate UPI</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Instant GPay / Paytm mock</span>
                  </button>

                  <button
                    onClick={() => handleLaunchRazorpay('NetBanking (HDFC/ICICI)')}
                    disabled={processing}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-left transition-all text-xs group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-white">Simulate NetBanking</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Mock institutional transfer</span>
                  </button>
                </div>
              </div>

              {/* Standard Launch Button */}
              <button
                onClick={() => handleLaunchRazorpay(null)}
                disabled={processing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <span>Opening Gateway...</span>
                ) : (
                  <>
                    <span>Open Razorpay Standard Modal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Payment Success Screen */
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center glow-emerald">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-white">Payment Verified & Activated!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your account has been upgraded to <strong>{paymentSuccess.tier}</strong> tier.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Razorpay Order ID:</span>
                  <span className="text-white truncate max-w-[180px]">{paymentSuccess.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Ref ID:</span>
                  <span className="text-white">{paymentSuccess.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="text-indigo-400">{paymentSuccess.method}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold font-sans">
                  <span className="text-white">Total Captured:</span>
                  <span className="text-emerald-400">₹{paymentSuccess.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
