import prisma from '../utils/prisma.js';

/**
 * Calculates a multi-factor Financial Health Score (0 - 100)
 */
export async function calculateFinancialHealthScore(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: true,
      budgets: true,
      goals: true,
      recurringPayments: true
    }
  });

  if (!user) return null;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const daysInMonth = currentMonthEnd.getDate();
  const currentDay = now.getDate();
  const monthProgress = currentDay / daysInMonth;

  // Monthly transactions
  const currentMonthTx = user.transactions.filter(t => new Date(t.date) >= currentMonthStart && new Date(t.date) <= currentMonthEnd);
  
  const currentIncome = currentMonthTx
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0) || user.monthlyIncome || 85000;

  const currentExpenses = currentMonthTx
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = currentIncome - currentExpenses;
  const savingsRate = currentIncome > 0 ? (netSavings / currentIncome) * 100 : 0;

  // 1. Savings Rate Score (Max 30 pts)
  // Target: >= 25% savings rate = 30 pts, >= 15% = 22 pts, >= 5% = 14 pts, < 0% = 0 pts
  let savingsScore = 0;
  if (savingsRate >= 25) {
    savingsScore = 30;
  } else if (savingsRate >= 15) {
    savingsScore = 20 + ((savingsRate - 15) / 10) * 10;
  } else if (savingsRate >= 0) {
    savingsScore = 8 + (savingsRate / 15) * 12;
  } else {
    savingsScore = Math.max(0, 8 + (savingsRate / 10)); // Deficit penalty
  }

  // 2. Spending Velocity / Burn Rate Score (Max 25 pts)
  // Expected spend at current day vs total income
  const expectedSpendRatio = monthProgress; // e.g. 0.5 at mid-month
  const actualSpendRatio = currentIncome > 0 ? currentExpenses / currentIncome : 1;
  let velocityScore = 25;
  if (actualSpendRatio > expectedSpendRatio * 1.3) {
    // Spending much faster than month progress
    const overVelocity = actualSpendRatio - expectedSpendRatio;
    velocityScore = Math.max(5, 25 - (overVelocity * 50));
  } else if (actualSpendRatio <= expectedSpendRatio) {
    velocityScore = 25;
  } else {
    velocityScore = 20;
  }

  // 3. Budget Discipline Score (Max 25 pts)
  let budgetScore = 25;
  if (user.budgets.length > 0) {
    let overBudgetCount = 0;
    user.budgets.forEach(b => {
      const categorySpent = currentMonthTx
        .filter(t => t.type === 'EXPENSE' && t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      if (categorySpent > b.limitAmount) {
        overBudgetCount++;
      } else if (categorySpent > b.limitAmount * 0.9) {
        overBudgetCount += 0.5;
      }
    });
    const violationRatio = overBudgetCount / user.budgets.length;
    budgetScore = Math.max(0, Math.round(25 * (1 - violationRatio)));
  }

  // 4. Emergency Runway & Liquid Buffer Score (Max 20 pts)
  const allInflow = user.transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const allOutflow = user.transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const totalAccumulatedBalance = Math.max(0, allInflow - allOutflow);
  const monthlyBurn = currentExpenses > 0 ? currentExpenses : (user.monthlyIncome * 0.7);
  const runwayMonths = monthlyBurn > 0 ? (totalAccumulatedBalance / monthlyBurn) : 1;

  let emergencyScore = 0;
  if (runwayMonths >= 6) emergencyScore = 20;
  else if (runwayMonths >= 3) emergencyScore = 16;
  else if (runwayMonths >= 1) emergencyScore = 11;
  else emergencyScore = Math.max(2, Math.round(runwayMonths * 10));

  const totalScore = Math.min(100, Math.max(10, Math.round(savingsScore + velocityScore + budgetScore + emergencyScore)));

  let status = 'Fair';
  let badgeColor = 'amber';
  if (totalScore >= 80) {
    status = 'Excellent';
    badgeColor = 'emerald';
  } else if (totalScore >= 65) {
    status = 'Good';
    badgeColor = 'cyan';
  } else if (totalScore >= 45) {
    status = 'Fair';
    badgeColor = 'amber';
  } else {
    status = 'Needs Attention';
    badgeColor = 'rose';
  }

  return {
    score: totalScore,
    status,
    badgeColor,
    metrics: {
      currentIncome,
      currentExpenses,
      netSavings,
      savingsRate: Number(savingsRate.toFixed(1)),
      runwayMonths: Number(runwayMonths.toFixed(1)),
      totalBalance: totalAccumulatedBalance
    },
    breakdown: [
      {
        pillar: 'Savings Rate',
        score: Math.round(savingsScore),
        maxScore: 30,
        percentage: Number(((savingsScore / 30) * 100).toFixed(0)),
        status: savingsRate >= 20 ? 'Optimal' : savingsRate >= 10 ? 'Moderate' : 'Low',
        description: `You are saving ${savingsRate.toFixed(1)}% of your monthly income (Target: ≥ 25%).`
      },
      {
        pillar: 'Spending Velocity',
        score: Math.round(velocityScore),
        maxScore: 25,
        percentage: Number(((velocityScore / 25) * 100).toFixed(0)),
        status: velocityScore >= 20 ? 'Controlled' : 'Accelerating',
        description: `Expenses are pacing at ${(actualSpendRatio * 100).toFixed(0)}% against ${Math.round(monthProgress * 100)}% of the month elapsed.`
      },
      {
        pillar: 'Budget Discipline',
        score: Math.round(budgetScore),
        maxScore: 25,
        percentage: Number(((budgetScore / 25) * 100).toFixed(0)),
        status: budgetScore >= 20 ? 'Strong' : 'At Risk',
        description: `${user.budgets.length} category budgets tracked with ${Math.round((budgetScore / 25) * 100)}% adherence.`
      },
      {
        pillar: 'Emergency Buffer',
        score: Math.round(emergencyScore),
        maxScore: 20,
        percentage: Number(((emergencyScore / 20) * 100).toFixed(0)),
        status: runwayMonths >= 3 ? 'Resilient' : 'Building',
        description: `Current liquid reserves cover approx ${runwayMonths.toFixed(1)} months of expenses.`
      }
    ]
  };
}

/**
 * 6-Month Cash Flow Historical Aggregation
 */
export async function getMonthlyCashFlowSummary(userId) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });

  const monthsMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Initialize last 6 calendar months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthsMap[key] = {
      month: monthNames[d.getMonth()],
      fullDate: key,
      income: 0,
      expenses: 0,
      savings: 0,
      savingsRate: 0,
      investments: 0
    };
  }

  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (monthsMap[key]) {
      if (t.type === 'INCOME') {
        monthsMap[key].income += t.amount;
      } else if (t.type === 'EXPENSE') {
        monthsMap[key].expenses += t.amount;
      } else if (t.type === 'INVESTMENT') {
        monthsMap[key].investments += t.amount;
      }
    }
  });

  const result = Object.values(monthsMap).map(m => {
    m.savings = Math.max(0, m.income - m.expenses);
    m.savingsRate = m.income > 0 ? Number(((m.savings / m.income) * 100).toFixed(1)) : 0;
    return m;
  });

  return result;
}

/**
 * Category Breakdown with Budget Comparison
 */
export async function getCategoryBreakdown(userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [transactions, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: monthStart }
      }
    }),
    prisma.budget.findMany({
      where: { userId }
    })
  ]);

  const categoryMap = {};
  let totalExpenses = 0;

  transactions.forEach(t => {
    const cat = t.category || 'Other';
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        category: cat,
        amount: 0,
        count: 0,
        budgetLimit: 0,
        percentage: 0
      };
    }
    categoryMap[cat].amount += t.amount;
    categoryMap[cat].count += 1;
    totalExpenses += t.amount;
  });

  // Attach budget limits
  budgets.forEach(b => {
    if (categoryMap[b.category]) {
      categoryMap[b.category].budgetLimit = b.limitAmount;
    } else {
      categoryMap[b.category] = {
        category: b.category,
        amount: 0,
        count: 0,
        budgetLimit: b.limitAmount,
        percentage: 0
      };
    }
  });

  const result = Object.values(categoryMap).map(c => {
    c.percentage = totalExpenses > 0 ? Number(((c.amount / totalExpenses) * 100).toFixed(1)) : 0;
    c.utilization = c.budgetLimit > 0 ? Number(((c.amount / c.budgetLimit) * 100).toFixed(1)) : null;
    return c;
  }).sort((a, b) => b.amount - a.amount);

  return {
    categories: result,
    totalExpenses
  };
}

/**
 * 30-Day Predictive Cash Flow and Expense Forecast Engine
 */
export async function generate30DayForecast(userId) {
  const [transactions, recurring, user] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE' },
      orderBy: { date: 'desc' },
      take: 120
    }),
    prisma.recurringPayment.findMany({
      where: { userId, status: 'ACTIVE' }
    }),
    prisma.user.findUnique({
      where: { id: userId }
    })
  ]);

  // Compute daily baseline spend over last 60 days
  const now = new Date();
  const past60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const recentExpenses = transactions.filter(t => new Date(t.date) >= past60Days);
  
  const totalRecentSpend = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
  const avgDailySpend = recentExpenses.length > 0 ? (totalRecentSpend / 60) : 1200;

  // Day-of-week multiplier (weekends typically have higher spending)
  const weekendMultiplier = 1.35;
  const weekdayMultiplier = 0.90;

  // 30 days forecast trajectory
  const forecast = [];
  let cumulativeProjectedSpend = 0;
  let cumulativeLowerBound = 0;
  let cumulativeUpperBound = 0;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 1; i <= 30; i++) {
    const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayOfWeek = futureDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let baseDaily = avgDailySpend * (isWeekend ? weekendMultiplier : weekdayMultiplier);

    // Check if any recurring bills fall on this day of month
    const matchingBills = recurring.filter(r => {
      const due = new Date(r.nextDueDate);
      return due.getDate() === futureDate.getDate();
    });

    const recurringAddition = matchingBills.reduce((s, r) => s + r.amount, 0);
    const projectedDaily = Math.round(baseDaily + recurringAddition);

    cumulativeProjectedSpend += projectedDaily;
    cumulativeLowerBound += Math.round(projectedDaily * 0.88);
    cumulativeUpperBound += Math.round(projectedDaily * 1.15);

    forecast.push({
      day: `Day ${i}`,
      date: `${futureDate.getDate()} ${monthNames[futureDate.getMonth()]}`,
      dailyProjected: projectedDaily,
      cumulativeSpend: cumulativeProjectedSpend,
      lowerBound: cumulativeLowerBound,
      upperBound: cumulativeUpperBound,
      recurringBillsCount: matchingBills.length,
      isWeekend
    });
  }

  // Monthly expected total
  const estimatedMonthTotalSpend = cumulativeProjectedSpend;
  const monthlyIncome = user?.monthlyIncome || 85000;
  const projectedSurplus = Math.max(0, monthlyIncome - estimatedMonthTotalSpend);

  return {
    forecast,
    avgDailySpend: Math.round(avgDailySpend),
    projected30DaySpend: estimatedMonthTotalSpend,
    projectedSurplus,
    confidenceScore: 92,
    insights: [
      `Estimated daily baseline expense is ₹${Math.round(avgDailySpend).toLocaleString('en-IN')}.`,
      `Upcoming ${recurring.length} recurring subscriptions add ₹${recurring.reduce((s,r) => s+r.amount, 0).toLocaleString('en-IN')} to next month's forecast.`,
      projectedSurplus > 0
        ? `Projected surplus of ₹${projectedSurplus.toLocaleString('en-IN')} available for savings and investment.`
        : `Caution: Spending is trending near or above monthly income limits.`
    ]
  };
}

/**
 * AI Anomaly & Unusual Spending Detection
 */
export async function detectAnomalies(userId) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const monthlyIncome = user?.monthlyIncome || 85000;

  // Group by category to calculate mean and standard deviation
  const catStats = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    if (!catStats[t.category]) catStats[t.category] = [];
    catStats[t.category].push(t.amount);
  });

  const categoryZScores = {};
  for (const cat in catStats) {
    const amounts = catStats[cat];
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (amounts.length || 1);
    const stdDev = Math.sqrt(variance) || (mean * 0.2);
    categoryZScores[cat] = { mean, stdDev };
  }

  const detectedAnomalies = [];

  // Check each recent transaction
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (t.type !== 'EXPENSE') continue;

    const stats = categoryZScores[t.category];
    const zScore = stats && stats.stdDev > 0 ? (t.amount - stats.mean) / stats.stdDev : 0;

    let anomalyReason = null;
    let severity = 'MEDIUM';

    // 1. Z-Score Outlier (Spike)
    if (zScore > 2.2 && t.amount > 2000) {
      anomalyReason = `Unusual surge: ₹${t.amount.toLocaleString('en-IN')} is ${zScore.toFixed(1)}x standard deviation above average for ${t.category}.`;
      severity = zScore > 3.0 ? 'HIGH' : 'MEDIUM';
    }
    // 2. High single transaction relative to income
    else if (t.amount > monthlyIncome * 0.25) {
      anomalyReason = `High-value expense: ₹${t.amount.toLocaleString('en-IN')} constitutes ${( (t.amount / monthlyIncome) * 100 ).toFixed(0)}% of your monthly income.`;
      severity = 'CRITICAL';
    }
    // 3. Potential Duplicate Charge Check (same amount, merchant within 48 hours)
    for (let j = 0; j < transactions.length; j++) {
      if (i !== j) {
        const other = transactions[j];
        if (
          other.merchant &&
          t.merchant &&
          other.merchant.toLowerCase() === t.merchant.toLowerCase() &&
          Math.abs(other.amount - t.amount) < 0.01 &&
          Math.abs(new Date(other.date) - new Date(t.date)) < 48 * 60 * 60 * 1000
        ) {
          anomalyReason = `Possible duplicate charge: identical charge of ₹${t.amount} detected at ${t.merchant} within 48 hours.`;
          severity = 'HIGH';
          break;
        }
      }
    }

    if (anomalyReason || t.isAnomaly) {
      detectedAnomalies.push({
        id: t.id,
        transactionId: t.id,
        title: `Spike in ${t.category}`,
        description: anomalyReason || t.anomalyReason || 'Flagged by AI spending monitor',
        amount: t.amount,
        merchant: t.merchant || t.description,
        category: t.category,
        date: t.date,
        severity: severity,
        status: 'UNRESOLVED'
      });
    }
  }

  return detectedAnomalies;
}

/**
 * Detect Recurring Payments & Subscriptions
 */
export async function detectRecurringSubscriptions(userId) {
  const transactions = await prisma.transaction.findMany({
    where: { userId, type: 'EXPENSE' },
    orderBy: { date: 'desc' }
  });

  const existingRecurring = await prisma.recurringPayment.findMany({
    where: { userId }
  });

  // Group by merchant and amount
  const merchantGroups = {};
  transactions.forEach(t => {
    const key = `${(t.merchant || t.description).trim().toLowerCase()}_${Math.round(t.amount)}`;
    if (!merchantGroups[key]) {
      merchantGroups[key] = {
        name: t.merchant || t.description,
        amount: t.amount,
        category: t.category,
        dates: []
      };
    }
    merchantGroups[key].dates.push(new Date(t.date));
  });

  const detected = [];

  for (const key in merchantGroups) {
    const group = merchantGroups[key];
    // Check if at least 2 charges with roughly 25-35 days interval
    if (group.dates.length >= 2) {
      group.dates.sort((a, b) => b - a);
      const diffDays = Math.round((group.dates[0] - group.dates[1]) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 24 && diffDays <= 36) {
        const nextDue = new Date(group.dates[0].getTime() + 30 * 24 * 60 * 60 * 1000);
        detected.push({
          name: group.name,
          amount: group.amount,
          category: group.category,
          billingCycle: 'MONTHLY',
          nextDueDate: nextDue,
          autoPay: true,
          confidence: 96
        });
      }
    }
  }

  const totalMonthlyRecurring = existingRecurring.reduce((sum, r) => sum + r.amount, 0);

  return {
    detectedSubscriptions: detected,
    activeSubscriptions: existingRecurring,
    totalMonthlyRecurring,
    subscriptionBurdenPercentage: userSubscriptionBurden(totalMonthlyRecurring)
  };
}

function userSubscriptionBurden(total) {
  return total > 0 ? Number(((total / 85000) * 100).toFixed(1)) : 0;
}
