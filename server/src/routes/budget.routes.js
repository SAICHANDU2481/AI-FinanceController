import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get Budgets with Live Spending Calculation
router.get('/', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [budgets, monthlyExpenses] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: req.user.id }
      }),
      prisma.transaction.findMany({
        where: {
          userId: req.user.id,
          type: 'EXPENSE',
          date: { gte: monthStart, lte: monthEnd }
        }
      })
    ]);

    // Aggregate spend per category
    const spendMap = {};
    monthlyExpenses.forEach(t => {
      const cat = t.category.toLowerCase();
      spendMap[cat] = (spendMap[cat] || 0) + t.amount;
    });

    const enrichedBudgets = budgets.map(b => {
      const spent = spendMap[b.category.toLowerCase()] || 0;
      const remaining = Math.max(0, b.limitAmount - spent);
      const percentage = Number(((spent / b.limitAmount) * 100).toFixed(1));
      const isOverBudget = spent > b.limitAmount;
      const isNearLimit = percentage >= b.alertThreshold;

      // Projected month-end burn rate
      const daysInMonth = monthEnd.getDate();
      const currentDay = now.getDate();
      const dailyRate = spent / Math.max(1, currentDay);
      const projectedMonthEnd = Math.round(dailyRate * daysInMonth);

      return {
        ...b,
        spent,
        remaining,
        percentage,
        isOverBudget,
        isNearLimit,
        projectedMonthEnd,
        daysRemaining: daysInMonth - currentDay
      };
    });

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalSpent = enrichedBudgets.reduce((sum, b) => sum + b.spent, 0);

    res.json({
      budgets: enrichedBudgets,
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining: Math.max(0, totalBudgeted - totalSpent),
        overallPercentage: totalBudgeted > 0 ? Number(((totalSpent / totalBudgeted) * 100).toFixed(1)) : 0
      }
    });
  } catch (error) {
    console.error('Fetch budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create Budget
router.post('/', authenticate, async (req, res) => {
  try {
    const { category, limitAmount, alertThreshold = 80, rollover = false } = req.body;
    if (!category || !limitAmount) {
      return res.status(400).json({ error: 'Category and limitAmount are required' });
    }

    const existing = await prisma.budget.findFirst({
      where: { userId: req.user.id, category }
    });

    if (existing) {
      return res.status(409).json({ error: `A budget for ${category} already exists. Update it instead.` });
    }

    const budget = await prisma.budget.create({
      data: {
        userId: req.user.id,
        category,
        limitAmount: parseFloat(limitAmount),
        alertThreshold: parseFloat(alertThreshold),
        rollover: Boolean(rollover)
      }
    });

    res.status(201).json({ message: 'Budget created successfully', budget });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Update Budget
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limitAmount, alertThreshold, rollover } = req.body;

    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        ...(limitAmount !== undefined && { limitAmount: parseFloat(limitAmount) }),
        ...(alertThreshold !== undefined && { alertThreshold: parseFloat(alertThreshold) }),
        ...(rollover !== undefined && { rollover: Boolean(rollover) })
      }
    });

    res.json({ message: 'Budget updated successfully', budget: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Delete Budget
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budget.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router;
