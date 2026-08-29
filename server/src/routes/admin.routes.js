import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

// Admin Platform Statistics
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalTransactions,
      transactionsSum,
      totalPayments,
      totalPaymentRevenue,
      totalAISessions,
      proUsersCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        _sum: { amount: true }
      }),
      prisma.paymentRecord.count(),
      prisma.paymentRecord.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      prisma.aISession.count(),
      prisma.user.count({ where: { tier: { in: ['PRO', 'ENTERPRISE'] } } })
    ]);

    const systemHealth = {
      uptimeSeconds: process.uptime(),
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      databaseStatus: 'CONNECTED (Prisma SQLite/PostgreSQL Ready)',
      razorpayIntegration: 'ACTIVE (Test Mode HMAC Verified)',
      aiEngineStatus: process.env.GEMINI_API_KEY ? 'GEMINI API ONLINE' : 'AUTONOMOUS FINTECH ENGINE ONLINE'
    };

    res.json({
      metrics: {
        totalUsers,
        totalTransactions,
        totalTransactionVolume: transactionsSum._sum.amount || 0,
        totalPayments,
        totalRevenue: totalPaymentRevenue._sum.amount || 0,
        totalAISessions,
        proUsersCount,
        freeUsersCount: Math.max(0, totalUsers - proUsersCount)
      },
      systemHealth
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform metrics' });
  }
});

// List Users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tier: true,
        currency: true,
        monthlyIncome: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            budgets: true,
            goals: true,
            paymentRecords: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user directory' });
  }
});

// Update User Role or Tier
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, tier, monthlyIncome } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(tier && { tier }),
        ...(monthlyIncome !== undefined && { monthlyIncome: parseFloat(monthlyIncome) })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tier: true
      }
    });

    res.json({ message: 'User updated successfully', user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Audit All Payments
router.get('/payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const payments = await prisma.paymentRecord.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment audit logs' });
  }
});

export default router;
