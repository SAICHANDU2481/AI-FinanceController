import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  calculateFinancialHealthScore,
  getMonthlyCashFlowSummary,
  getCategoryBreakdown,
  generate30DayForecast,
  detectAnomalies,
  detectRecurringSubscriptions
} from '../services/analytics.service.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

// Financial Health Score
router.get('/health-score', authenticate, async (req, res) => {
  try {
    const healthData = await calculateFinancialHealthScore(req.user.id);
    if (!healthData) {
      return res.status(404).json({ error: 'Health score could not be calculated' });
    }
    res.json(healthData);
  } catch (error) {
    console.error('Health score error:', error);
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
});

// 6-Month Cash Flow Trend
router.get('/cashflow-history', authenticate, async (req, res) => {
  try {
    const data = await getMonthlyCashFlowSummary(req.user.id);
    res.json(data);
  } catch (error) {
    console.error('Cash flow history error:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow history' });
  }
});

// Category Distribution
router.get('/category-breakdown', authenticate, async (req, res) => {
  try {
    const data = await getCategoryBreakdown(req.user.id);
    res.json(data);
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({ error: 'Failed to fetch category breakdown' });
  }
});

// 30-Day Predictive Cash Flow & Expense Forecast
router.get('/forecast', authenticate, async (req, res) => {
  try {
    const data = await generate30DayForecast(req.user.id);
    res.json(data);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: 'Failed to generate 30-day forecast' });
  }
});

// Anomaly Detection
router.get('/anomalies', authenticate, async (req, res) => {
  try {
    const anomalies = await detectAnomalies(req.user.id);
    res.json({ anomalies, count: anomalies.length });
  } catch (error) {
    console.error('Anomalies error:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// Dismiss Anomaly
router.put('/anomalies/:id/dismiss', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transaction.updateMany({
      where: { id, userId: req.user.id },
      data: { isAnomaly: false }
    });
    res.json({ message: 'Anomaly dismissed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dismiss anomaly' });
  }
});

// Recurring Subscriptions
router.get('/recurring', authenticate, async (req, res) => {
  try {
    const data = await detectRecurringSubscriptions(req.user.id);
    res.json(data);
  } catch (error) {
    console.error('Recurring error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring subscriptions' });
  }
});

export default router;
