import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get Goals
router.get('/', authenticate, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedGoals = goals.map(g => {
      const percentage = g.targetAmount > 0 ? Number(((g.currentAmount / g.targetAmount) * 100).toFixed(1)) : 0;
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      const isCompleted = g.currentAmount >= g.targetAmount;

      return {
        ...g,
        percentage: Math.min(100, percentage),
        remainingAmount,
        isCompleted
      };
    });

    res.json({ goals: enrichedGoals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create Goal
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, targetAmount, currentAmount = 0, deadline, colorHex = '#6366F1', category = 'SAVINGS' } = req.body;
    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Name and targetAmount are required' });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline ? new Date(deadline) : null,
        colorHex,
        category,
        status: parseFloat(currentAmount) >= parseFloat(targetAmount) ? 'COMPLETED' : 'IN_PROGRESS'
      }
    });

    res.status(201).json({ message: 'Goal created successfully', goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Add Funds to Goal / Update Goal
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, currentAmount, addAmount, deadline, colorHex, status } = req.body;

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    let newCurrent = existing.currentAmount;
    if (addAmount !== undefined) {
      newCurrent += parseFloat(addAmount);
    } else if (currentAmount !== undefined) {
      newCurrent = parseFloat(currentAmount);
    }

    const newTarget = targetAmount !== undefined ? parseFloat(targetAmount) : existing.targetAmount;
    const newStatus = status || (newCurrent >= newTarget ? 'COMPLETED' : 'IN_PROGRESS');

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...(name && { name }),
        targetAmount: newTarget,
        currentAmount: newCurrent,
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(colorHex && { colorHex }),
        status: newStatus
      }
    });

    // If completed now, emit celebratory notification
    if (newStatus === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          title: `Goal Achieved: ${updated.name}! 🎯`,
          message: `Congratulations! You have reached your savings target of ₹${updated.targetAmount.toLocaleString('en-IN')}.`,
          type: 'SUCCESS'
        }
      });
    }

    res.json({ message: 'Goal updated successfully', goal: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete Goal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.goal.delete({ where: { id } });
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
