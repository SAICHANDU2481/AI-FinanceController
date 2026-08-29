import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { aiAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  TrendingUp,
  HelpCircle,
  ShieldCheck,
  RotateCcw,
  Sliders,
  DollarSign
} from 'lucide-react';

export const AIAdvisor = () => {
  const location = useLocation();
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `👋 **Hello! I am your FinAdvisor AI Controller.**\n\nI have real-time access to your database ledger, category budgets, recurring subscriptions, and health score.\n\n### You can ask me:\n* *"Where did I spend the most this month?"*\n* *"Can I afford ₹5,000 this weekend?"*\n* *"Why did my expenses increase?"*\n* *"How much can I save next month?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [scenarioCut, setScenarioCut] = useState(25);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const res = await aiAPI.getQuickPrompts();
        setQuickPrompts(res.data.prompts || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadPrompts();

    // Check if initial prompt was passed from navigation state
    if (location.state?.initialPrompt) {
      handleSendMessage(location.state.initialPrompt);
    }
  }, []);

  const handleSendMessage = async (customPrompt = null) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setLoading(true);

    try {
      const res = await aiAPI.chat(promptToSend);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data.response,
        source: res.data.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      showToast('AI Advisor encountered an issue processing your request', 'error');
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: '⚠️ I encountered an error connecting to the financial intelligence service. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScenario = () => {
    handleSendMessage(`What if I cut dining out by ${scenarioCut}%?`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              FinAdvisor AI Controller
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live DB Grounded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero hallucination AI grounded in your live transactions, budgets, and cash flow limits.
          </p>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Clear Chat History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Interactive Chat Window (8 Cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl border border-slate-800 flex flex-col h-[680px] overflow-hidden shadow-2xl">
          {/* Chat Header Bar */}
          <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">FinAdvisor Strategic Engine</h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Grounded with PostgreSQL/SQLite Live Context
                </span>
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md font-medium'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none prose prose-invert prose-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div className="text-[10px] opacity-60 mt-2 text-right">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[11px] text-slate-400 ml-1">Analyzing database records & cash flow limits...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Carousel Pills */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
            {quickPrompts.map(p => (
              <button
                key={p.id}
                onClick={() => handleSendMessage(p.prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 text-slate-300 text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>{p.title}</span>
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Ask a question (e.g. Can I afford ₹5,000 this week? Where did I spend the most?)..."
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Sidebar: Scenario Simulator & Affordability Widget (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Scenario Simulator Widget */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Scenario Simulator</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Test what happens to your cash flow runway and health score if you trim discretionary spending.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Cut Dining & Takeout by:</span>
                  <span className="font-bold text-indigo-400 font-mono">{scenarioCut}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={scenarioCut}
                  onChange={e => setScenarioCut(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <button
                onClick={handleRunScenario}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulate Impact with AI</span>
              </button>
            </div>
          </div>

          {/* Quick Affordability Checker */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Affordability Check</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Evaluate real-time impact on surplus before making non-essential purchases.
            </p>

            <div className="space-y-2">
              {[
                { amount: 3000, label: 'Weekend Outing (₹3,000)' },
                { amount: 5000, label: 'Gadget / Apparel (₹5,000)' },
                { amount: 15000, label: 'Flight Tickets (₹15,000)' }
              ].map(item => (
                <button
                  key={item.amount}
                  onClick={() => handleSendMessage(`Can I afford ₹${item.amount.toLocaleString()} this week?`)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs text-slate-200 transition-colors flex items-center justify-between group"
                >
                  <span>{item.label}</span>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform text-xs">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
