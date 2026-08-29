import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { chatFinancialAdvisor } from '../services/ai.service.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

// Chat with FinAdvisor AI
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await chatFinancialAdvisor(req.user.id, prompt.trim());
    res.json(result);
  } catch (error) {
    console.error('AI Advisor error:', error);
    res.status(500).json({ error: 'AI advisor failed to generate response' });
  }
});

// Quick Prompt Suggestions
router.get('/quick-prompts', authenticate, async (req, res) => {
  const prompts = [
    {
      id: 'top-spending',
      title: 'Where did I spend the most?',
      description: 'Find your largest expense categories and leaks this month',
      prompt: 'Where did I spend the most this month?'
    },
    {
      id: 'affordability',
      title: 'Can I afford ₹5,000 this week?',
      description: 'Simulate the impact of a ₹5,000 discretionary spend',
      prompt: 'Can I afford ₹5,000 this week without hurting my savings goal?'
    },
    {
      id: 'expense-increase',
      title: 'Why did my expenses increase?',
      description: 'Analyze root causes, anomalies, and recurring debits',
      prompt: 'Why did my expenses increase compared to last month?'
    },
    {
      id: 'savings-potential',
      title: 'How much can I save?',
      description: 'Get an actionable blueprint to boost your savings rate to 25%',
      prompt: 'How much can I save next month and where should I cut back?'
    },
    {
      id: 'cut-dining',
      title: 'Scenario: Cut Dining by 30%',
      description: 'Simulate cash flow growth if takeout & dining is trimmed',
      prompt: 'What if I cut dining out by 30%?'
    }
  ];

  res.json({ prompts });
});

// AI Chat History
router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await prisma.aISession.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI history' });
  }
});

export default router;
