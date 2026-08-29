import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AI Finance Controller Database...');

  // Clean existing records
  await prisma.aISession.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.recurringPayment.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo12345', 10);
  const adminPasswordHash = await bcrypt.hash('admin12345', 10);

  // 1. Create Alex Mercer (Standard / Pro User)
  const alex = await prisma.user.create({
    data: {
      name: 'Alex Mercer',
      email: 'alex.fintech@aifinance.io',
      passwordHash,
      role: 'USER',
      currency: 'INR',
      monthlyIncome: 125000,
      riskProfile: 'MODERATE',
      tier: 'PRO'
    }
  });

  // 2. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Chief Financial Admin',
      email: 'admin@aifinance.io',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      currency: 'INR',
      monthlyIncome: 250000,
      riskProfile: 'AGGRESSIVE',
      tier: 'ENTERPRISE'
    }
  });

  console.log(`Created users: ${alex.email} and ${admin.email}`);

  // 3. Budgets for Alex
  const budgets = [
    { category: 'Housing & Rent', limitAmount: 30000, alertThreshold: 90 },
    { category: 'Food & Dining', limitAmount: 18000, alertThreshold: 80 },
    { category: 'Groceries', limitAmount: 12000, alertThreshold: 85 },
    { category: 'Shopping', limitAmount: 15000, alertThreshold: 75 },
    { category: 'Utilities', limitAmount: 7000, alertThreshold: 85 },
    { category: 'Transportation', limitAmount: 8000, alertThreshold: 80 },
    { category: 'Entertainment', limitAmount: 6000, alertThreshold: 80 },
    { category: 'Investment', limitAmount: 40000, alertThreshold: 100 }
  ];

  for (const b of budgets) {
    await prisma.budget.create({
      data: {
        userId: alex.id,
        ...b
      }
    });
  }

  // 4. Recurring Subscriptions
  const recurring = [
    { name: 'House Rent to Landlord', amount: 28000, billingCycle: 'MONTHLY', category: 'Housing & Rent', nextDueDate: new Date(Date.now() + 5 * 86400000), autoPay: true, merchant: 'Property Management' },
    { name: 'Nifty 50 Index Fund SIP', amount: 20000, billingCycle: 'MONTHLY', category: 'Investment', nextDueDate: new Date(Date.now() + 10 * 86400000), autoPay: true, merchant: 'Zerodha Coin' },
    { name: 'Cult.fit Gym & Wellness', amount: 1499, billingCycle: 'MONTHLY', category: 'Healthcare', nextDueDate: new Date(Date.now() + 12 * 86400000), autoPay: true, merchant: 'Cult.fit' },
    { name: 'Netflix Premium 4K UHD', amount: 649, billingCycle: 'MONTHLY', category: 'Entertainment', nextDueDate: new Date(Date.now() + 8 * 86400000), autoPay: true, merchant: 'Netflix India' },
    { name: 'JioFiber 300 Mbps Wifi', amount: 1179, billingCycle: 'MONTHLY', category: 'Utilities', nextDueDate: new Date(Date.now() + 15 * 86400000), autoPay: true, merchant: 'Reliance Jio' },
    { name: 'Spotify Premium Duo', amount: 149, billingCycle: 'MONTHLY', category: 'Entertainment', nextDueDate: new Date(Date.now() + 18 * 86400000), autoPay: true, merchant: 'Spotify' },
    { name: 'AWS Cloud Infrastructure', amount: 2650, billingCycle: 'MONTHLY', category: 'Utilities', nextDueDate: new Date(Date.now() + 22 * 86400000), autoPay: true, merchant: 'Amazon Web Services' }
  ];

  for (const r of recurring) {
    await prisma.recurringPayment.create({
      data: {
        userId: alex.id,
        ...r
      }
    });
  }

  // 5. Savings Goals
  const goals = [
    { name: 'Emergency Reserve (6 Months)', targetAmount: 300000, currentAmount: 215000, category: 'EMERGENCY', colorHex: '#10B981', deadline: new Date(Date.now() + 180 * 86400000) },
    { name: 'Japan Autumn Expedition 2026', targetAmount: 180000, currentAmount: 125000, category: 'TRAVEL', colorHex: '#6366F1', deadline: new Date(Date.now() + 120 * 86400000) },
    { name: 'Apple MacBook Pro M4 Max', targetAmount: 199900, currentAmount: 178000, category: 'GADGETS', colorHex: '#06B6D4', deadline: new Date(Date.now() + 45 * 86400000) },
    { name: 'EV Down Payment Fund', targetAmount: 450000, currentAmount: 140000, category: 'WEALTH', colorHex: '#8B5CF6', deadline: new Date(Date.now() + 365 * 86400000) }
  ];

  for (const g of goals) {
    await prisma.goal.create({
      data: {
        userId: alex.id,
        ...g
      }
    });
  }

  // 6. Generate Multi-Month Realistic Transactions for Alex
  const now = new Date();
  const rawTx = [];

  // Month -2, Month -1, and Current Month
  for (let m = 2; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

    // Salary credit on 1st
    rawTx.push({
      amount: 125000,
      type: 'INCOME',
      category: 'Salary',
      subCategory: 'Tech Corp Payroll',
      description: 'Monthly Senior Engineer Salary Credit',
      merchant: 'Apex Technologies India Pvt Ltd',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 9, 30),
      paymentMethod: 'NETBANKING',
      aiCategoryConfidence: 0.99,
      aiNote: 'Verified regular direct employer deposit'
    });

    // Freelance consulting
    rawTx.push({
      amount: 35000,
      type: 'INCOME',
      category: 'Freelance',
      subCategory: 'UX & AI Consulting',
      description: 'Fintech UI & Architecture Retainer',
      merchant: 'HyperScale Labs Client',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15, 14, 0),
      paymentMethod: 'UPI',
      aiCategoryConfidence: 0.96,
      aiNote: 'Client invoice payment'
    });

    // Fixed Rent
    rawTx.push({
      amount: 28000,
      type: 'EXPENSE',
      category: 'Housing & Rent',
      subCategory: 'Apartment Lease',
      description: 'Monthly 2BHK Apartment Rent',
      merchant: 'Greenfield Residency RWA',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 3, 10, 0),
      paymentMethod: 'NETBANKING',
      isRecurring: true,
      aiCategoryConfidence: 0.99
    });

    // Investments (SIP + Equity)
    rawTx.push({
      amount: 20000,
      type: 'INVESTMENT',
      category: 'Investment',
      subCategory: 'Mutual Funds',
      description: 'Auto-debit: Nifty 50 & Midcap SIP',
      merchant: 'Zerodha Broking',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5, 8, 15),
      paymentMethod: 'NETBANKING',
      isRecurring: true,
      aiCategoryConfidence: 0.99
    });

    // Utilities
    rawTx.push({
      amount: 3240,
      type: 'EXPENSE',
      category: 'Utilities',
      subCategory: 'Electricity',
      description: 'Tata Power Monthly Energy Bill',
      merchant: 'Tata Power BillDesk',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 7, 16, 20),
      paymentMethod: 'UPI',
      aiCategoryConfidence: 0.98
    });

    rawTx.push({
      amount: 1179,
      type: 'EXPENSE',
      category: 'Utilities',
      subCategory: 'Broadband',
      description: 'JioFiber 300 Mbps Plan with OTT',
      merchant: 'Reliance Jio Infocomm',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 11, 11, 45),
      paymentMethod: 'UPI',
      isRecurring: true,
      aiCategoryConfidence: 0.98
    });

    // Subscriptions
    rawTx.push({
      amount: 649,
      type: 'EXPENSE',
      category: 'Entertainment',
      subCategory: 'Streaming',
      description: 'Netflix 4K Monthly Subscription',
      merchant: 'Netflix India',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 8, 12, 0),
      paymentMethod: 'CARD',
      isRecurring: true,
      aiCategoryConfidence: 0.99
    });

    rawTx.push({
      amount: 149,
      type: 'EXPENSE',
      category: 'Entertainment',
      subCategory: 'Music',
      description: 'Spotify Premium Duo Subscription',
      merchant: 'Spotify India',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 14, 18, 0),
      paymentMethod: 'UPI',
      isRecurring: true,
      aiCategoryConfidence: 0.97
    });

    rawTx.push({
      amount: 1499,
      type: 'EXPENSE',
      category: 'Healthcare',
      subCategory: 'Fitness',
      description: 'Cult.fit Gym & Swimming Pass',
      merchant: 'Cult.fit Centers',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 12, 7, 30),
      paymentMethod: 'UPI',
      isRecurring: true,
      aiCategoryConfidence: 0.96
    });

    // Groceries (Multiple)
    rawTx.push({
      amount: 4250,
      type: 'EXPENSE',
      category: 'Groceries',
      subCategory: 'Supermarket',
      description: 'Monthly Bulk Grocery & Staples',
      merchant: 'D-Mart Supercenter',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 4, 17, 30),
      paymentMethod: 'CARD',
      aiCategoryConfidence: 0.96
    });

    rawTx.push({
      amount: 1140,
      type: 'EXPENSE',
      category: 'Groceries',
      subCategory: 'Quick Commerce',
      description: 'Fresh Dairy, Fruits & Vegetables',
      merchant: 'Blinkit Instant Delivery',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 13, 20, 10),
      paymentMethod: 'UPI',
      aiCategoryConfidence: 0.95
    });

    rawTx.push({
      amount: 890,
      type: 'EXPENSE',
      category: 'Groceries',
      subCategory: 'Quick Commerce',
      description: 'Snacks, Coffee beans & almond milk',
      merchant: 'Zepto Quick Store',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 21, 15, 40),
      paymentMethod: 'UPI',
      aiCategoryConfidence: 0.95
    });

    // Food & Dining (Swiggy, Zomato, Dining out)
    rawTx.push({
      amount: 1850,
      type: 'EXPENSE',
      category: 'Food & Dining',
      subCategory: 'Dinner with Team',
      description: 'Weekend Dining & Artisanal Cocktails',
      merchant: 'Smoke House Deli',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 6, 21, 0),
      paymentMethod: 'CARD',
      aiCategoryConfidence: 0.98
    });

    rawTx.push({
      amount: 680,
      type: 'EXPENSE',
      category: 'Food & Dining',
      subCategory: 'Food Delivery',
      description: 'Biryani & Kebabs Gourmet Meal',
      merchant: 'Swiggy Gourmet Delivery',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10, 13, 15),
      paymentMethod: 'UPI',
      aiCategoryConfidence: 0.98
    });

    rawTx.push({
      amount: 540,
      type: 'EXPENSE',
      category: 'Food & Dining',
      subCategory: 'Food Delivery',
      description: 'Italian Woodfired Pizza',
      merchant: 'Zomato Express',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 16, 20, 45),
      paymentMethod: 'UPI',
      aiCategoryConfidence: 0.97
    });

    rawTx.push({
      amount: 380,
      type: 'EXPENSE',
      category: 'Food & Dining',
      subCategory: 'Cafe',
      description: 'Iced Americano & Croissant',
      merchant: 'Third Wave Coffee Roasters',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 19, 10, 30),
      paymentMethod: 'UPI',
      aiCategoryConfidence: 0.98
    });

    // Transportation & Fuel
    rawTx.push({
      amount: 2800,
      type: 'EXPENSE',
      category: 'Transportation',
      subCategory: 'Fuel',
      description: 'V-Power Petrol Full Tank Refill',
      merchant: 'Shell Auto Fuel Station',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 9, 14, 20),
      paymentMethod: 'CARD',
      aiCategoryConfidence: 0.96
    });

    rawTx.push({
      amount: 450,
      type: 'EXPENSE',
      category: 'Transportation',
      subCategory: 'Ride Hailing',
      description: 'Airport Tech Park Ride',
      merchant: 'Uber Premier',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 18, 8, 45),
      paymentMethod: 'UPI',
      aiCategoryConfidence: 0.96
    });

    // Shopping
    rawTx.push({
      amount: 3499,
      type: 'EXPENSE',
      category: 'Shopping',
      subCategory: 'Electronics & Gadgets',
      description: 'Ergonomic Mechanical Keyboard & Desk Mat',
      merchant: 'Amazon India Retail',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 17, 19, 0),
      paymentMethod: 'CARD',
      aiCategoryConfidence: 0.95
    });

    rawTx.push({
      amount: 2299,
      type: 'EXPENSE',
      category: 'Shopping',
      subCategory: 'Apparel',
      description: 'Smart Casual Linen Shirts',
      merchant: 'Uniqlo India',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 23, 16, 20),
      paymentMethod: 'CARD',
      aiCategoryConfidence: 0.95
    });
  }

  // Add specific intentional anomalies in current month for AI demo
  rawTx.push({
    amount: 38500,
    type: 'EXPENSE',
    category: 'Shopping',
    subCategory: 'Luxury Gadgets',
    description: 'Bose Noise Cancelling Ultra + Smartwatch',
    merchant: 'Amazon Premium Store',
    date: new Date(now.getFullYear(), now.getMonth(), 14, 18, 45),
    paymentMethod: 'CARD',
    aiCategoryConfidence: 0.94,
    isAnomaly: true,
    anomalyReason: 'Unusual spike: ₹38,500 is 3.1x standard deviation above your normal shopping outlay.'
  });

  // Potential duplicate charge in current month
  rawTx.push({
    amount: 1850,
    type: 'EXPENSE',
    category: 'Food & Dining',
    subCategory: 'Restaurant',
    description: 'Double Bill at BBQ Nation Buffet',
    merchant: 'Barbeque Nation Dining',
    date: new Date(now.getFullYear(), now.getMonth(), 22, 20, 30),
    paymentMethod: 'CARD',
    aiCategoryConfidence: 0.98,
    isAnomaly: true,
    anomalyReason: 'Potential duplicate charge: identical charge of ₹1,850 detected at BBQ Nation within 24 hours.'
  });

  for (const t of rawTx) {
    await prisma.transaction.create({
      data: {
        userId: alex.id,
        ...t
      }
    });
  }

  console.log(`Created ${rawTx.length} realistic transactions for Alex`);

  // 7. Payment Records (Razorpay Test Mode)
  await prisma.paymentRecord.create({
    data: {
      userId: alex.id,
      razorpayOrderId: 'order_test_9981273921',
      razorpayPaymentId: 'pay_test_8819283741',
      razorpaySignature: 'test_sig_mock_verified_signature_998',
      amount: 999,
      currency: 'INR',
      planTier: 'PRO',
      status: 'SUCCESS',
      paymentMethod: 'Razorpay UPI (Test Mode)'
    }
  });

  await prisma.paymentRecord.create({
    data: {
      userId: admin.id,
      razorpayOrderId: 'order_test_1102938475',
      razorpayPaymentId: 'pay_test_3394857201',
      razorpaySignature: 'test_sig_mock_verified_signature_110',
      amount: 3999,
      currency: 'INR',
      planTier: 'ENTERPRISE',
      status: 'SUCCESS',
      paymentMethod: 'Razorpay NetBanking (Test Mode)'
    }
  });

  // 8. In-App Notifications
  const notifications = [
    {
      userId: alex.id,
      title: 'Monthly Cash Flow Optimized',
      message: 'Your Financial Health Score reached 82/100 (Excellent) this month. High savings discipline observed.',
      type: 'INSIGHT'
    },
    {
      userId: alex.id,
      title: 'Unusual Outflow Flagged',
      message: '₹38,500 luxury electronics charge on Amazon India was tagged by AI anomaly detection.',
      type: 'ALERT'
    },
    {
      userId: alex.id,
      title: 'Upcoming SIP Due in 4 Days',
      message: '₹20,000 Nifty 50 Index Fund SIP scheduled for auto-debit on 10th.',
      type: 'REMINDER'
    },
    {
      userId: alex.id,
      title: 'Pro Tier Active',
      message: 'Your AI Finance Controller Pro subscription is active. All predictive models unlocked.',
      type: 'SUCCESS'
    }
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  console.log('✅ Database successfully seeded with rich fintech data!');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
