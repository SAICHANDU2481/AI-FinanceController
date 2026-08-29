import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fintech_jwt_token_key_998877';

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, currency, monthlyIncome } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        currency: currency || 'INR',
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : 85000,
        role: 'USER',
        tier: 'FREE'
      }
    });

    // Create default starter budgets
    const defaultBudgets = [
      { category: 'Food & Dining', limitAmount: 15000 },
      { category: 'Shopping', limitAmount: 12000 },
      { category: 'Groceries', limitAmount: 10000 },
      { category: 'Utilities', limitAmount: 6000 },
      { category: 'Entertainment', limitAmount: 5000 },
      { category: 'Transportation', limitAmount: 7000 }
    ];

    for (const b of defaultBudgets) {
      await prisma.budget.create({
        data: {
          userId: user.id,
          category: b.category,
          limitAmount: b.limitAmount
        }
      });
    }

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to AI Finance Controller!',
        message: 'Your autonomous financial cockpit is initialized. Try asking FinAdvisor AI for a spending checkup.',
        type: 'SUCCESS'
      }
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        currency: user.currency,
        monthlyIncome: user.monthlyIncome,
        tier: user.tier
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed due to server error' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please register by clicking "Create one now" below, or use the 1-Click Demo buttons.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again or use 1-Click Demo login.' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        currency: user.currency,
        monthlyIncome: user.monthlyIncome,
        tier: user.tier
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: `Authentication service notice: ${error.message || 'Database initialization required'}` });
  }
});

// 1-Click Demo Login (for rapid testing of standard user or admin)
router.post('/demo-login', async (req, res) => {
  try {
    const { role = 'USER' } = req.body;
    const targetEmail = role === 'ADMIN' ? 'admin@aifinance.io' : 'alex.fintech@aifinance.io';

    let user = await prisma.user.findUnique({ where: { email: targetEmail } });
    
    // If user doesn't exist, pick the first user or create
    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: role === 'ADMIN' ? 'ADMIN' : 'USER' }
      });
    }

    if (!user) {
      // Fallback create demo user
      const passwordHash = await bcrypt.hash('demo12345', 10);
      user = await prisma.user.create({
        data: {
          name: role === 'ADMIN' ? 'Chief Risk Officer (Admin)' : 'Alex Mercer',
          email: targetEmail,
          passwordHash,
          role: role === 'ADMIN' ? 'ADMIN' : 'USER',
          currency: 'INR',
          monthlyIncome: 125000,
          tier: 'PRO'
        }
      });
    }

    const token = generateToken(user);
    res.json({
      message: `Logged in as ${role === 'ADMIN' ? 'Demo Admin' : 'Demo User'}`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        currency: user.currency,
        monthlyIncome: user.monthlyIncome,
        tier: user.tier
      }
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// Get Current User Profile
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Update Profile Settings
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, currency, monthlyIncome, riskProfile } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(currency && { currency }),
        ...(monthlyIncome && { monthlyIncome: parseFloat(monthlyIncome) }),
        ...(riskProfile && { riskProfile })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        currency: true,
        monthlyIncome: true,
        riskProfile: true,
        tier: true
      }
    });
    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
