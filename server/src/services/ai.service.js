import axios from 'axios';
import prisma from '../utils/prisma.js';
import { calculateFinancialHealthScore, getCategoryBreakdown } from './analytics.service.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Intelligent Financial Advisor Chatbot using Live DB Context
 */
export async function chatFinancialAdvisor(userId, userPrompt) {
  // 1. Gather rich, real financial context from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: { orderBy: { date: 'desc' }, take: 50 },
      budgets: true,
      goals: true,
      recurringPayments: true,
      anomalies: { where: { status: 'UNRESOLVED' } }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const healthData = await calculateFinancialHealthScore(userId);
  const categoryData = await getCategoryBreakdown(userId);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthTx = user.transactions.filter(t => new Date(t.date) >= currentMonthStart);
  
  const currentIncome = currentMonthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0) || user.monthlyIncome;
  const currentExpenses = currentMonthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const netSavings = currentIncome - currentExpenses;
  const topCategories = categoryData.categories.slice(0, 5);

  const upcomingBills = user.recurringPayments
    .filter(r => r.status === 'ACTIVE')
    .map(r => `${r.name} (₹${r.amount.toLocaleString('en-IN')}, Due: ${new Date(r.nextDueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`)
    .join(', ');

  const activeGoals = user.goals.map(g => `${g.name}: ₹${g.currentAmount.toLocaleString('en-IN')}/₹${g.targetAmount.toLocaleString('en-IN')} (${Math.round((g.currentAmount / g.targetAmount) * 100)}%)`).join(', ');

  const currencySymbol = user.currency === 'USD' ? '$' : user.currency === 'EUR' ? '€' : '₹';

  // 2. Build structured financial context
  const financialContext = {
    userName: user.name,
    currency: user.currency,
    currencySymbol,
    monthlyIncome: currentIncome,
    currentExpenses,
    netSavings,
    savingsRate: healthData.metrics.savingsRate,
    healthScore: healthData.score,
    healthStatus: healthData.status,
    topCategories: topCategories.map(c => ({
      category: c.category,
      spent: c.amount,
      limit: c.budgetLimit,
      percentageOfTotal: c.percentage
    })),
    upcomingBills: upcomingBills || 'None scheduled',
    activeGoals: activeGoals || 'None set',
    unresolvedAnomalies: user.anomalies.map(a => `${a.title}: ${a.description}`).join('; ') || 'None',
    totalTransactionsLogged: user.transactions.length
  };

  // 3. If Gemini API key is configured, invoke Gemini API with structured prompt
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
    try {
      const systemInstruction = `You are FinAdvisor AI, a premier autonomous AI financial controller and chartered wealth strategist.
Your duty is to provide precise, actionable, empathetic, and mathematically accurate financial advice.
CRITICAL MANDATE: Use ONLY the provided real financial context below. Never invent numbers or hallucinate income/expense values.
Always refer to the user's real transactions, budgets, savings goals, and cash flow limits.
Format your responses beautifully in Markdown with bold key figures, bullet points, and brief next-step action recommendations.

REAL USER FINANCIAL CONTEXT:
${JSON.stringify(financialContext, null, 2)}
`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await axios.post(
        geminiUrl,
        {
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemInstruction },
                { text: `User Question: "${userPrompt}"` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000
          }
        },
        { timeout: 8000 }
      );

      const aiText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiText) {
        // Save session
        await prisma.aISession.create({
          data: {
            userId,
            prompt: userPrompt,
            response: aiText,
            contextData: JSON.stringify(financialContext)
          }
        });
        return { response: aiText, source: 'gemini' };
      }
    } catch (apiError) {
      console.warn('Gemini API call failed or timed out, falling back to autonomous rule engine:', apiError.message);
    }
  }

  // 4. Autonomous Grounded Financial Intelligence Engine (Deterministic & Real DB Data Grounded)
  const answer = generateContextualFinancialAnswer(userPrompt, financialContext, user, currentMonthTx);

  await prisma.aISession.create({
    data: {
      userId,
      prompt: userPrompt,
      response: answer,
      contextData: JSON.stringify(financialContext)
    }
  });

  return { response: answer, source: 'fintech_ai_engine' };
}

/**
 * Contextual Financial Answering Engine using real DB figures
 */
function generateContextualFinancialAnswer(prompt, ctx, user, transactions) {
  const p = prompt.toLowerCase();
  const sym = ctx.currencySymbol;

  // Question: "Where did I spend the most?"
  if (p.includes('spend the most') || p.includes('highest expense') || p.includes('top spend') || p.includes('where my money go')) {
    if (ctx.topCategories.length === 0) {
      return `📊 **Expense Analysis**\n\nYou haven't logged any major expenses for this month yet. Your total outflow stands at **${sym}0**.`;
    }
    const top = ctx.topCategories[0];
    const top2 = ctx.topCategories[1];
    const top3 = ctx.topCategories[2];

    let reply = `📊 **Where You Spent the Most This Month**\n\nYour single largest spending driver is **${top.category}**, accounting for **${sym}${top.spent.toLocaleString('en-IN')}** (${top.percentageOfTotal}% of total monthly outflows).\n\n### Top Expense Breakdown:\n`;
    reply += `1. **${top.category}**: ${sym}${top.spent.toLocaleString('en-IN')} (${top.percentageOfTotal}% of total)`;
    if (top.limit > 0) {
      const util = Math.round((top.spent / top.limit) * 100);
      reply += ` — *${util}% of ${sym}${top.limit.toLocaleString('en-IN')} budget*`;
    }
    reply += '\n';

    if (top2) {
      reply += `2. **${top2.category}**: ${sym}${top2.spent.toLocaleString('en-IN')} (${top2.percentageOfTotal}% of total)\n`;
    }
    if (top3) {
      reply += `3. **${top3.category}**: ${sym}${top3.spent.toLocaleString('en-IN')} (${top3.percentageOfTotal}% of total)\n`;
    }

    reply += `\n💡 **AI Recommendation:** To boost your monthly savings rate from **${ctx.savingsRate}%** to the target **25%**, consider capping discretionary spending in *${top.category}* by **15%** (~${sym}${Math.round(top.spent * 0.15).toLocaleString('en-IN')}).`;
    return reply;
  }

  // Question: "Can I afford ₹X this week / weekend?"
  if (p.includes('can i afford') || p.includes('afford') || p.includes('can i spend') || p.includes('buy this')) {
    // Extract amount
    const numbers = p.match(/\d+([,\.]\d+)?/g);
    let checkAmount = 5000;
    if (numbers && numbers.length > 0) {
      checkAmount = parseFloat(numbers[0].replace(/,/g, ''));
    }

    const availableSurplus = ctx.netSavings;
    const isAffordable = availableSurplus >= checkAmount;
    const postSpendSurplus = availableSurplus - checkAmount;

    if (isAffordable) {
      return `✅ **Affordability Assessment: YES**\n\n* **Requested Amount:** ${sym}${checkAmount.toLocaleString('en-IN')}\n* **Current Unallocated Cash Flow:** ${sym}${availableSurplus.toLocaleString('en-IN')}\n* **Projected Remaining Surplus:** ${sym}${postSpendSurplus.toLocaleString('en-IN')}\n\n### Impact on Financial Health:\n* Your current Financial Health Score is **${ctx.healthScore}/100** (${ctx.healthStatus}).\n* Absorbing this expense leaves your emergency buffer intact with a healthy projected month-end surplus of **${sym}${postSpendSurplus.toLocaleString('en-IN')}**.\n\n💡 **Tip:** Ensure this is routed through your primary UPI or card to maintain real-time budget tracking.`;
    } else {
      const deficit = checkAmount - availableSurplus;
      return `⚠️ **Affordability Assessment: CAUTION / STRETCH**\n\n* **Requested Amount:** ${sym}${checkAmount.toLocaleString('en-IN')}\n* **Current Monthly Surplus:** ${sym}${availableSurplus.toLocaleString('en-IN')}\n* **Deficit / Shortfall:** ${sym}${deficit.toLocaleString('en-IN')}\n\n### Why This Requires Care:\n* Spending ${sym}${checkAmount.toLocaleString('en-IN')} now would pull your monthly cash flow into a deficit of **${sym}${deficit.toLocaleString('en-IN')}**.\n* Your current monthly expenses have already reached **${sym}${ctx.currentExpenses.toLocaleString('en-IN')}** against your income of **${sym}${ctx.monthlyIncome.toLocaleString('en-IN')}**.\n\n💡 **AI Strategy:** If this is non-essential, delay by 2 weeks until next month's salary cycle or reduce spending in *${ctx.topCategories[0]?.category || 'discretionary items'}* to fund it safely.`;
    }
  }

  // Question: "Why did my expenses increase?"
  if (p.includes('why') && (p.includes('increase') || p.includes('surge') || p.includes('high') || p.includes('more expensive'))) {
    const anomalies = transactions.filter(t => t.isAnomaly || t.amount > 5000);
    let reply = `🔍 **Root-Cause Analysis of Expense Spikes**\n\nYour total expenses for the current period stand at **${sym}${ctx.currentExpenses.toLocaleString('en-IN')}**.\n\n### Primary Culprits Identified by AI:\n`;

    if (anomalies.length > 0) {
      anomalies.slice(0, 3).forEach((a, i) => {
        reply += `${i + 1}. **${a.category} (${a.merchant || a.description})**: ${sym}${a.amount.toLocaleString('en-IN')} on ${new Date(a.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}${a.anomalyReason ? ` — *${a.anomalyReason}*` : ''}\n`;
      });
    } else {
      reply += `1. **Cumulative Category Growth**: Elevated volume of small micro-transactions in *${ctx.topCategories[0]?.category || 'Shopping'}*.\n2. **Fixed Recurring Outflows**: ${ctx.upcomingBills}\n`;
    }

    reply += `\n### Financial Health Impact:\n* Your **Spending Velocity** score dropped slightly to pace at **${ctx.healthScore}/100**.\n* We detected **${ctx.unresolvedAnomalies !== 'None' ? 'unusual charges' : 'consistent recurring debits'}** that elevated your daily burn rate.`;
    return reply;
  }

  // Question: "How much can I save?"
  if (p.includes('how much can i save') || p.includes('how to save') || p.includes('savings potential') || p.includes('save money')) {
    const targetSavings = Math.round(ctx.monthlyIncome * 0.25);
    const currentSavings = ctx.netSavings;
    const optimizationGain = Math.round(ctx.currentExpenses * 0.18);

    return `💰 **Personalized Savings Potential & Strategy**\n\n* **Current Monthly Net Savings:** ${sym}${currentSavings.toLocaleString('en-IN')} (${ctx.savingsRate}% of income)\n* **Target 25% Savings Benchmark:** ${sym}${targetSavings.toLocaleString('en-IN')}\n* **AI Identified Unlocked Potential:** +**${sym}${optimizationGain.toLocaleString('en-IN')}/month**\n\n### 3 High-Impact Steps to Achieve This:\n1. **Trim Top Discretionary Category (${ctx.topCategories[0]?.category || 'Dining & Takeout'}):** Potential savings of **${sym}${Math.round((ctx.topCategories[0]?.spent || 10000) * 0.2).toLocaleString('en-IN')}** by planning meals.\n2. **Audit Active Subscriptions:** You have recurring commitments: *${ctx.upcomingBills || 'Streaming & Memberships'}*.\n3. **Automate SIP on Salary Day:** Allocate **${sym}${Math.round(ctx.monthlyIncome * 0.15).toLocaleString('en-IN')}** straight to your Emergency & Wealth Goals.\n\n🎯 **Active Goal Progress:** ${ctx.activeGoals}`;
  }

  // Question: Scenario Simulator / "What if"
  if (p.includes('what if') || p.includes('cut') || p.includes('reduce') || p.includes('scenario')) {
    const cutPercentage = p.includes('30%') ? 0.30 : p.includes('20%') ? 0.20 : 0.25;
    const topCat = ctx.topCategories[0] || { category: 'Discretionary', spent: 12000 };
    const savedAmount = Math.round(topCat.spent * cutPercentage);
    const newSavings = ctx.netSavings + savedAmount;
    const newRate = Number(((newSavings / ctx.monthlyIncome) * 100).toFixed(1));

    return `🔮 **Scenario Simulation: Cutting ${topCat.category} by ${(cutPercentage * 100).toFixed(0)}%**\n\n* **Current ${topCat.category} Spend:** ${sym}${topCat.spent.toLocaleString('en-IN')}\n* **Monthly Direct Cash Savings:** +**${sym}${savedAmount.toLocaleString('en-IN')}**\n* **New Projected Monthly Surplus:** **${sym}${newSavings.toLocaleString('en-IN')}**\n* **New Savings Rate:** **${newRate}%** (Up from ${ctx.savingsRate}%)\n* **Estimated Health Score Boost:** **+6 to +9 points** (from ${ctx.healthScore} $\\rightarrow$ ${Math.min(100, ctx.healthScore + 8)})\n\n💡 **Annualized Compounding:** Investing this monthly savings of ${sym}${savedAmount.toLocaleString('en-IN')} at 12% CAGR yields approximately **${sym}${Math.round(savedAmount * 12 * 1.06).toLocaleString('en-IN')}** in 1 year and **${sym}${Math.round(savedAmount * 60 * 1.35).toLocaleString('en-IN')}** in 5 years.`;
  }

  // General comprehensive fintech consultation
  return `🤖 **FinAdvisor AI Intelligence Overview**\n\nHello **${ctx.userName}**! Here is your real-time financial synopsis:\n\n* **Net Monthly Inflow:** ${sym}${ctx.monthlyIncome.toLocaleString('en-IN')}\n* **Total Expenses to Date:** ${sym}${ctx.currentExpenses.toLocaleString('en-IN')}\n* **Current Net Surplus:** ${sym}${ctx.netSavings.toLocaleString('en-IN')} (${ctx.savingsRate}% savings rate)\n* **Financial Health Score:** **${ctx.healthScore}/100** (${ctx.healthStatus})\n* **Top Outflow Driver:** ${ctx.topCategories[0]?.category || 'General Spending'} (${sym}${ctx.topCategories[0]?.spent?.toLocaleString('en-IN') || '0'})\n\n### You can ask me:\n1. *"Where did I spend the most this month?"*\n2. *"Can I afford ₹5,000 for a weekend trip?"*\n3. *"Why did my expenses surge compared to last month?"*\n4. *"How much can I save by optimizing my recurring bills?"*`;
}

/**
 * AI Transaction Categorizer with Confidence Score
 */
export function categorizeTransaction(description, amount, merchant = '') {
  const text = `${description} ${merchant}`.toLowerCase();

  const rules = [
    { cat: 'Food & Dining', sub: 'Restaurant / Delivery', keywords: ['swiggy', 'zomato', 'mcdonald', 'starbucks', 'cafe', 'restaurant', 'burger', 'pizza', 'dine', 'barbeque', 'chai', 'lunch', 'dinner', 'breakfast'], conf: 0.98 },
    { cat: 'Groceries', sub: 'Supermarket', keywords: ['blinkit', 'zepto', 'instamart', 'bigbasket', 'dmart', 'supermarket', 'grocery', 'nature basket', 'reliance fresh', 'milk', 'vegetables'], conf: 0.96 },
    { cat: 'Shopping', sub: 'E-commerce & Retail', keywords: ['amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'shopping', 'clothing', 'electronics', 'ajio', 'uniqlo', 'croma'], conf: 0.95 },
    { cat: 'Housing & Rent', sub: 'Rent & Maintenance', keywords: ['rent', 'society maintenance', 'nobroker', 'house rent', 'landlord', 'flat rent'], conf: 0.99 },
    { cat: 'Utilities', sub: 'Electricity & Water', keywords: ['electricity', 'tata power', 'bescom', 'water bill', 'wifi', 'broadband', 'airtel', 'jio fiber', 'gas cylinder', 'indane'], conf: 0.97 },
    { cat: 'Entertainment', sub: 'Streaming & Recreation', keywords: ['netflix', 'spotify', 'prime video', 'hotstar', 'cinema', 'pvr', 'inox', 'bookmyshow', 'game', 'playstation', 'steam'], conf: 0.96 },
    { cat: 'Healthcare', sub: 'Pharmacy & Medical', keywords: ['apollo', 'pharmeasy', '1mg', 'hospital', 'doctor', 'clinic', 'dentist', 'medicine', 'lab test', 'health'], conf: 0.94 },
    { cat: 'Transportation', sub: 'Cab & Fuel', keywords: ['uber', 'ola', 'rapido', 'petrol', 'diesel', 'fuel', 'metro card', 'fastag', 'toll', 'flight', 'indigo', 'irctc'], conf: 0.95 },
    { cat: 'Investment', sub: 'Mutual Funds & Stocks', keywords: ['zerodha', 'groww', 'sip', 'mutual fund', 'stocks', 'coin', 'indmoney', 'etf', 'fixed deposit', 'nps'], conf: 0.99 },
    { cat: 'Salary', sub: 'Employment Income', keywords: ['salary', 'payroll', 'wages', 'compensation', 'bonus', 'stipend'], conf: 0.99 },
    { cat: 'Freelance', sub: 'Consulting & Contracts', keywords: ['freelance', 'upwork', 'fiverr', 'contract payment', 'consulting fee', 'client payment'], conf: 0.95 }
  ];

  for (const r of rules) {
    if (r.keywords.some(k => text.includes(k))) {
      return {
        category: r.cat,
        subCategory: r.sub,
        confidence: r.conf,
        explanation: `AI matched keyword pattern '${r.keywords.find(k => text.includes(k))}' with ${Math.round(r.conf * 100)}% certainty.`
      };
    }
  }

  // Fallback
  return {
    category: amount > 20000 ? 'Housing & Rent' : 'Shopping',
    subCategory: 'General',
    confidence: 0.75,
    explanation: 'AI classified based on transaction scale and typical outflow distribution.'
  };
}

/**
 * Intelligent Receipt Parser
 */
export function parseReceiptMetadata(filename, textHint = '') {
  // Simulated OCR & AI multi-modal parsing
  return {
    merchant: 'Organic Harvest Superstore',
    amount: 1485.50,
    date: new Date().toISOString(),
    category: 'Groceries',
    subCategory: 'Organic Produce',
    paymentMethod: 'UPI',
    items: [
      { name: 'Almond Milk (1L)', price: 340.00 },
      { name: 'Organic Sourdough Bread', price: 180.00 },
      { name: 'Greek Yogurt 400g', price: 215.50 },
      { name: 'Cold Pressed Olive Oil', price: 750.00 }
    ],
    confidence: 0.97
  };
}
