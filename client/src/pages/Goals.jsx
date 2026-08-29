import React, { useState, useEffect } from 'react';
import { goalAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles,
  DollarSign,
  X,
  Trophy
} from 'lucide-react';

export const Goals = () => {
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form states
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [colorHex, setColorHex] = useState('#6366F1');
  const [depositAmount, setDepositAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalAPI.list();
      setGoals(res.data.goals || []);
    } catch (err) {
      showToast('Failed to fetch savings goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount) {
      showToast('Please enter both goal title and target amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await goalAPI.create({
        name: goalName,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline || null,
        colorHex
      });
      showToast('Savings goal established', 'success');
      setIsCreateOpen(false);
      fetchGoals();
    } catch (err) {
      showToast('Failed to create goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositFunds = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showToast('Please enter a valid deposit amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const added = parseFloat(depositAmount);
      const newTotal = selectedGoal.currentAmount + added;
      const willComplete = newTotal >= selectedGoal.targetAmount;

      await goalAPI.update(selectedGoal.id, {
        addAmount: added
      });

      if (willComplete) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast(`🎉 Goal achieved! Congratulations on reaching ${selectedGoal.name}!`, 'success', 'Milestone Unlocked');
      } else {
        showToast(`Added ${symbol}${added.toLocaleString()} to ${selectedGoal.name}`, 'success');
      }

      setIsDepositOpen(false);
      setDepositAmount('');
      fetchGoals();
    } catch (err) {
      showToast('Failed to add funds', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Savings Goals & Milestone Vaults
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated funding projections, velocity tracking, and milestone rewards.
          </p>
        </div>

        <button
          onClick={() => {
            setGoalName('');
            setTargetAmount('');
            setCurrentAmount('0');
            setDeadline('');
            setIsCreateOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {goals.map(goal => {
          const isDone = goal.isCompleted || goal.status === 'COMPLETED';

          return (
            <div
              key={goal.id}
              className={`glass-card rounded-2xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
                isDone ? 'border-emerald-500/40 shadow-lg glow-emerald' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                      style={{ background: goal.colorHex || '#6366F1' }}
                    >
                      {isDone ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{goal.name}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {goal.category}
                      </span>
                    </div>
                  </div>

                  {isDone ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Achieved
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                      {goal.percentage}%
                    </span>
                  )}
                </div>

                {/* Amount Progress */}
                <div className="my-4">
                  <div className="flex items-baseline justify-between mb-2 font-mono">
                    <span className="text-xl font-extrabold text-white">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Target: {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, goal.percentage)}%`,
                        background: isDone ? '#10B981' : goal.colorHex || '#6366F1'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Goal Footer with Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-slate-400">
                  {isDone ? (
                    <span className="text-emerald-400 font-semibold">Ready for deployment! 🚀</span>
                  ) : (
                    <span>Needed: <strong className="text-white">{formatCurrency(goal.remainingAmount)}</strong></span>
                  )}
                </div>

                {!isDone && (
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setDepositAmount('');
                      setIsDepositOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Deposit</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deposit Modal */}
      {isDepositOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-white text-sm">
                Add Funds to {selectedGoal.name}
              </h3>
              <button onClick={() => setIsDepositOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositFunds} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deposit Amount ({symbol}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 5000"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDepositOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  {submitting ? 'Depositing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-white text-base">Create New Savings Goal</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, Japan Trip, Apple Vision Pro"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Amount ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="200000"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Starting ({symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
