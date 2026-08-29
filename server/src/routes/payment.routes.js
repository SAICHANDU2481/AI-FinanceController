import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createPaymentOrder, verifyPayment, processWebhook, getPaymentRecords } from '../services/payment.service.js';

const router = express.Router();

// Pricing Plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'FREE',
      name: 'Starter Cockpit',
      price: 0,
      period: 'Forever Free',
      description: 'Essential financial logging and basic analytics',
      features: [
        'Up to 100 Transactions/mo',
        'Basic Category Breakdown',
        'Manual Budget Limits',
        '5 AI Advisor queries/day',
        'Standard Export'
      ],
      ctaText: 'Current Plan',
      isPopular: false
    },
    {
      id: 'PRO',
      name: 'AI Controller Pro',
      price: 999,
      period: 'per year',
      description: 'Full autonomous intelligence, anomaly detection, and predictive cash flow',
      features: [
        'Unlimited Transactions',
        '30-Day Predictive Expense Forecast',
        'Automated AI Anomaly & Spike Detection',
        'Autonomous Recurring Bill Monitor',
        'Unlimited FinAdvisor AI with Live DB Context',
        'Smart Receipt OCR Scanner',
        'Custom Financial Health Alerts',
        'Multi-Currency Support (₹, $, €, £)'
      ],
      ctaText: 'Upgrade to Pro (Razorpay)',
      isPopular: true
    },
    {
      id: 'ENTERPRISE',
      name: 'Family & Wealth Office',
      price: 3999,
      period: 'per year',
      description: 'Institutional-grade wealth planning with multi-account consolidation',
      features: [
        'Everything in Pro Tier',
        'Multi-User Family Management',
        'Dedicated AI Wealth Strategist Prompting',
        'Custom Scenario Simulations & EMI Planners',
        'Direct Webhook Integration',
        'Priority 24/7 Concierge Support'
      ],
      ctaText: 'Get Enterprise Tier',
      isPopular: false
    }
  ];

  res.json({ plans });
});

// Create Razorpay Order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount, planTier = 'PRO', currency = 'INR' } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const orderData = await createPaymentOrder(
      req.user.id,
      parseFloat(amount),
      planTier,
      currency
    );

    res.json(orderData);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment order' });
  }
});

// Verify Razorpay Payment Signature
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planTier } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ error: 'Missing orderId or paymentId' });
    }

    const result = await verifyPayment(req.user.id, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      planTier: planTier || 'PRO'
    });

    res.json(result);
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message || 'Payment verification failed' });
  }
});

// Razorpay Webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;

    const result = await processWebhook(payload, signature);
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payment History
router.get('/history', authenticate, async (req, res) => {
  try {
    const records = await getPaymentRecords(req.user.id);
    res.json({ records });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

export default router;
