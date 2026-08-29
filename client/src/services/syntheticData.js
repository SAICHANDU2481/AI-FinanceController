export const SYNTHETIC_USER = {
  id: 'alex-mercer-pro-id',
  name: 'Alex Mercer',
  email: 'alex.fintech@aifinance.io',
  role: 'ADMIN',
  currency: 'INR',
  monthlyIncome: 125000,
  riskProfile: 'MODERATE',
  tier: 'PRO'
};

export const SYNTHETIC_HEALTH_SCORE = {
  score: 86,
  rating: 'EXCELLENT',
  status: 'OPTIMAL',
  pillars: {
    savingsRate: { score: 28, max: 30, percentage: '44.5%', status: 'Optimal' },
    spendingVelocity: { score: 24, max: 25, percentage: '58.0%', status: 'Disciplined' },
    budgetDiscipline: { score: 21, max: 25, adherence: '84.0%', status: 'Healthy' },
    emergencyBuffer: { score: 13, max: 20, months: '3.0 months', status: 'Growing' }
  },
  metrics: {
    monthlyIncome: 125000,
    monthlyExpense: 69400,
    netSavings: 55600,
    savingsRate: 44.48,
    totalLiquidBalance: 248500
  },
  aiInsight: 'Your 44.5% savings rate exceeds the benchmark 25% target. Emergency reserve currently covers 3.0 months of mandatory living expenses.'
};

export const SYNTHETIC_CASHFLOW = [
  { month: 'Oct 2025', income: 125000, expense: 78500, savings: 46500, netFlow: 46500 },
  { month: 'Nov 2025', income: 145000, expense: 82100, savings: 62900, netFlow: 62900 },
  { month: 'Dec 2025', income: 160000, expense: 91400, savings: 68600, netFlow: 68600 },
  { month: 'Jan 2026', income: 125000, expense: 64200, savings: 60800, netFlow: 60800 },
  { month: 'Feb 2026', income: 155000, expense: 71800, savings: 83200, netFlow: 83200 },
  { month: 'Mar 2026', income: 160000, expense: 69400, savings: 90600, netFlow: 90600 }
];

export const SYNTHETIC_CATEGORY_BREAKDOWN = [
  { name: 'Housing & Rent', value: 28000, percentage: 40.3, color: '#6366F1' },
  { name: 'Investment', value: 20000, percentage: 28.8, color: '#10B981' },
  { name: 'Groceries', value: 6280, percentage: 9.0, color: '#06B6D4' },
  { name: 'Utilities', value: 4419, percentage: 6.4, color: '#F59E0B' },
  { name: 'Food & Dining', value: 3450, percentage: 5.0, color: '#EC4899' },
  { name: 'Transportation', value: 3250, percentage: 4.7, color: '#8B5CF6' },
  { name: 'Healthcare', value: 1499, percentage: 2.2, color: '#14B8A6' },
  { name: 'Entertainment', value: 798, percentage: 1.1, color: '#F43F5E' }
];

export const SYNTHETIC_TRANSACTIONS = [
  { id: 'tx-1', amount: 125000, type: 'INCOME', category: 'Salary', description: 'Apex Technologies Monthly Salary', merchant: 'Apex Tech Pvt Ltd', date: new Date().toISOString(), paymentMethod: 'NETBANKING', aiCategoryConfidence: 0.99, isAnomaly: false },
  { id: 'tx-2', amount: 35000, type: 'INCOME', category: 'Freelance', description: 'Fintech UI & AI Retainer Consulting', merchant: 'HyperScale Labs Client', date: new Date(Date.now() - 86400000).toISOString(), paymentMethod: 'UPI', aiCategoryConfidence: 0.96, isAnomaly: false },
  { id: 'tx-3', amount: 28000, type: 'EXPENSE', category: 'Housing & Rent', description: '2BHK Apartment Rent Lease', merchant: 'Greenfield Residency RWA', date: new Date(Date.now() - 2 * 86400000).toISOString(), paymentMethod: 'NETBANKING', aiCategoryConfidence: 0.99, isRecurring: true },
  { id: 'tx-4', amount: 20000, type: 'INVESTMENT', category: 'Investment', description: 'Nifty 50 Index Fund SIP', merchant: 'Zerodha Broking', date: new Date(Date.now() - 3 * 86400000).toISOString(), paymentMethod: 'NETBANKING', aiCategoryConfidence: 0.99, isRecurring: true },
  { id: 'tx-5', amount: 4250, type: 'EXPENSE', category: 'Groceries', description: 'Monthly Bulk Grocery & Staples', merchant: 'D-Mart Supercenter', date: new Date(Date.now() - 4 * 86400000).toISOString(), paymentMethod: 'CARD', aiCategoryConfidence: 0.96 },
  { id: 'tx-6', amount: 3240, type: 'EXPENSE', category: 'Utilities', description: 'Tata Power Electricity Bill', merchant: 'Tata Power BillDesk', date: new Date(Date.now() - 5 * 86400000).toISOString(), paymentMethod: 'UPI', aiCategoryConfidence: 0.98 },
  { id: 'tx-7', amount: 1850, type: 'EXPENSE', category: 'Food & Dining', description: 'Weekend Dinner & Artisanal Cocktails', merchant: 'Smoke House Deli', date: new Date(Date.now() - 6 * 86400000).toISOString(), paymentMethod: 'CARD', aiCategoryConfidence: 0.98 },
  { id: 'tx-8', amount: 1499, type: 'EXPENSE', category: 'Healthcare', description: 'Cult.fit Monthly Gym & Swimming Pass', merchant: 'Cult.fit Centers', date: new Date(Date.now() - 7 * 86400000).toISOString(), paymentMethod: 'UPI', aiCategoryConfidence: 0.96, isRecurring: true },
  { id: 'tx-9', amount: 1179, type: 'EXPENSE', category: 'Utilities', description: 'JioFiber 300 Mbps Broadband', merchant: 'Reliance Jio', date: new Date(Date.now() - 8 * 86400000).toISOString(), paymentMethod: 'UPI', aiCategoryConfidence: 0.98, isRecurring: true },
  { id: 'tx-10', amount: 649, type: 'EXPENSE', category: 'Entertainment', description: 'Netflix 4K UHD Subscription', merchant: 'Netflix India', date: new Date(Date.now() - 9 * 86400000).toISOString(), paymentMethod: 'CARD', aiCategoryConfidence: 0.99, isRecurring: true },
  { id: 'tx-11', amount: 38500, type: 'EXPENSE', category: 'Shopping', description: 'Bose Noise Cancelling Ultra Headphones', merchant: 'Amazon Premium Store', date: new Date(Date.now() - 10 * 86400000).toISOString(), paymentMethod: 'CARD', aiCategoryConfidence: 0.94, isAnomaly: true, anomalyReason: 'Outflow spike: ₹38,500 is 3.1x standard deviation above average shopping spend.' }
];

export const SYNTHETIC_BUDGETS = [
  { id: 'b-1', category: 'Housing & Rent', limitAmount: 30000, spent: 28000, utilization: 93.3, projectedPace: 'On Track', status: 'HEALTHY' },
  { id: 'b-2', category: 'Food & Dining', limitAmount: 18000, spent: 8450, utilization: 46.9, projectedPace: 'Under Budget', status: 'HEALTHY' },
  { id: 'b-3', category: 'Groceries', limitAmount: 12000, spent: 6280, utilization: 52.3, projectedPace: 'On Track', status: 'HEALTHY' },
  { id: 'b-4', category: 'Shopping', limitAmount: 15000, spent: 12400, utilization: 82.7, projectedPace: 'Approaching Limit', status: 'WARNING' },
  { id: 'b-5', category: 'Utilities', limitAmount: 7000, spent: 4419, utilization: 63.1, projectedPace: 'On Track', status: 'HEALTHY' },
  { id: 'b-6', category: 'Transportation', limitAmount: 8000, spent: 3250, utilization: 40.6, projectedPace: 'Under Budget', status: 'HEALTHY' },
  { id: 'b-7', category: 'Entertainment', limitAmount: 6000, spent: 2450, utilization: 40.8, projectedPace: 'Under Budget', status: 'HEALTHY' },
  { id: 'b-8', category: 'Investment', limitAmount: 40000, spent: 40000, utilization: 100.0, projectedPace: '100% Target Met', status: 'OPTIMAL' }
];

export const SYNTHETIC_GOALS = [
  { id: 'g-1', name: 'Emergency Reserve (6 Months)', targetAmount: 300000, currentAmount: 215000, category: 'EMERGENCY', colorHex: '#10B981', status: 'IN_PROGRESS' },
  { id: 'g-2', name: 'Japan Autumn Expedition 2026', targetAmount: 180000, currentAmount: 125000, category: 'TRAVEL', colorHex: '#6366F1', status: 'IN_PROGRESS' },
  { id: 'g-3', name: 'Apple MacBook Pro M4 Max', targetAmount: 199900, currentAmount: 178000, category: 'GADGETS', colorHex: '#06B6D4', status: 'IN_PROGRESS' },
  { id: 'g-4', name: 'EV Down Payment Fund', targetAmount: 450000, currentAmount: 140000, category: 'WEALTH', colorHex: '#8B5CF6', status: 'IN_PROGRESS' }
];

export const SYNTHETIC_RECURRING = [
  { id: 'r-1', name: 'House Rent to Landlord', amount: 28000, billingCycle: 'MONTHLY', category: 'Housing & Rent', nextDueDate: new Date(Date.now() + 5 * 86400000).toISOString(), autoPay: true, merchant: 'Property Management' },
  { id: 'r-2', name: 'Nifty 50 Index Fund SIP', amount: 20000, billingCycle: 'MONTHLY', category: 'Investment', nextDueDate: new Date(Date.now() + 10 * 86400000).toISOString(), autoPay: true, merchant: 'Zerodha Coin' },
  { id: 'r-3', name: 'Cult.fit Gym & Wellness', amount: 1499, billingCycle: 'MONTHLY', category: 'Healthcare', nextDueDate: new Date(Date.now() + 12 * 86400000).toISOString(), autoPay: true, merchant: 'Cult.fit' },
  { id: 'r-4', name: 'Netflix Premium 4K UHD', amount: 649, billingCycle: 'MONTHLY', category: 'Entertainment', nextDueDate: new Date(Date.now() + 8 * 86400000).toISOString(), autoPay: true, merchant: 'Netflix India' },
  { id: 'r-5', name: 'JioFiber 300 Mbps Wifi', amount: 1179, billingCycle: 'MONTHLY', category: 'Utilities', nextDueDate: new Date(Date.now() + 15 * 86400000).toISOString(), autoPay: true, merchant: 'Reliance Jio' },
  { id: 'r-6', name: 'Spotify Premium Duo', amount: 149, billingCycle: 'MONTHLY', category: 'Entertainment', nextDueDate: new Date(Date.now() + 18 * 86400000).toISOString(), autoPay: true, merchant: 'Spotify' },
  { id: 'r-7', name: 'AWS Cloud Infrastructure', amount: 2650, billingCycle: 'MONTHLY', category: 'Utilities', nextDueDate: new Date(Date.now() + 22 * 86400000).toISOString(), autoPay: true, merchant: 'Amazon Web Services' }
];

export const SYNTHETIC_ANOMALIES = [
  {
    id: 'anom-1',
    title: 'High Outflow Surge Detected',
    description: '₹38,500 on Amazon Premium Store is 3.1x standard deviation above your median shopping outlay.',
    severity: 'HIGH',
    status: 'UNRESOLVED',
    detectedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export const SYNTHETIC_ADMIN_STATS = {
  totalUsers: 1420,
  activeUsers: 894,
  proUsers: 342,
  totalTransactions: 48920,
  gmvProcessed: 28450000,
  mrr: 170658,
  systemHealth: {
    status: 'OPERATIONAL',
    uptime: '99.98%',
    dbLatencyMs: 14,
    aiInferenceLatencyMs: 240,
    razorpayWebhookStatus: 'ACTIVE'
  }
};
