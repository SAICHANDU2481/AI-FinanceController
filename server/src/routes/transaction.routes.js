import express from 'express';
import multer from 'multer';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { categorizeTransaction, parseReceiptMetadata } from '../services/ai.service.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Get Transactions with Filtering & Pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      type,
      category,
      search,
      startDate,
      endDate,
      isAnomaly,
      isRecurring,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    const where = {
      userId: req.user.id
    };

    if (type && type !== 'ALL') where.type = type;
    if (category && category !== 'ALL') where.category = category;
    if (isAnomaly === 'true') where.isAnomaly = true;
    if (isRecurring === 'true') where.isRecurring = true;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { merchant: { contains: search } },
        { category: { contains: search } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / take)
      }
    });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create Transaction with AI Categorization & Anomaly Tagging
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      amount,
      type = 'EXPENSE',
      category: inputCategory,
      subCategory: inputSubCategory,
      description,
      merchant,
      date,
      paymentMethod = 'UPI',
      isRecurring = false
    } = req.body;

    if (!amount || !description) {
      return res.status(400).json({ error: 'Amount and description are required' });
    }

    const parsedAmount = parseFloat(amount);

    // AI Categorization if category is not explicitly passed or auto-fill requested
    let finalCategory = inputCategory;
    let finalSubCategory = inputSubCategory;
    let aiConfidence = 0.95;
    let aiNote = null;

    if (!finalCategory || finalCategory === 'Auto' || finalCategory === 'Uncategorized') {
      const aiResult = categorizeTransaction(description, parsedAmount, merchant);
      finalCategory = aiResult.category;
      finalSubCategory = aiResult.subCategory;
      aiConfidence = aiResult.confidence;
      aiNote = aiResult.explanation;
    }

    // Anomaly Check: If expense is very high (> 25% of monthly income)
    let isAnomaly = false;
    let anomalyReason = null;
    if (type === 'EXPENSE' && parsedAmount > (req.user.monthlyIncome * 0.25)) {
      isAnomaly = true;
      anomalyReason = `High-value expense: ₹${parsedAmount.toLocaleString('en-IN')} exceeds 25% of monthly income benchmark.`;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        amount: parsedAmount,
        type,
        category: finalCategory || 'Other',
        subCategory: finalSubCategory,
        description,
        merchant: merchant || description.slice(0, 30),
        date: date ? new Date(date) : new Date(),
        paymentMethod,
        aiCategoryConfidence: aiConfidence,
        aiNote,
        isAnomaly,
        anomalyReason,
        isRecurring: Boolean(isRecurring)
      }
    });

    // If anomaly, create notification
    if (isAnomaly) {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          title: 'Unusual Outflow Detected',
          message: `₹${parsedAmount.toLocaleString('en-IN')} logged for ${finalCategory}. Review in Anomaly center.`,
          type: 'ALERT'
        }
      });
    }

    res.status(201).json({
      message: 'Transaction recorded successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update Transaction
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, subCategory, description, merchant, date, paymentMethod, isRecurring, isAnomaly } = req.body;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(category && { category }),
        ...(subCategory !== undefined && { subCategory }),
        ...(description && { description }),
        ...(merchant !== undefined && { merchant }),
        ...(date && { date: new Date(date) }),
        ...(paymentMethod && { paymentMethod }),
        ...(isRecurring !== undefined && { isRecurring: Boolean(isRecurring) }),
        ...(isAnomaly !== undefined && { isAnomaly: Boolean(isAnomaly) })
      }
    });

    res.json({ message: 'Transaction updated successfully', transaction: updated });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete Transaction
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// AI Categorize Preview
router.post('/ai-categorize', authenticate, (req, res) => {
  const { description = '', amount = 0, merchant = '' } = req.body;
  const result = categorizeTransaction(description, parseFloat(amount), merchant);
  res.json(result);
});

// Smart Receipt Parser Simulation
router.post('/upload-receipt', authenticate, upload.single('receipt'), async (req, res) => {
  try {
    const filename = req.file ? req.file.originalname : 'receipt.jpg';
    const textHint = req.body.textHint || '';
    const parsed = parseReceiptMetadata(filename, textHint);

    res.json({
      message: 'Receipt parsed by AI engine',
      parsedData: parsed
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to parse receipt' });
  }
});

// CSV Export
router.get('/export/csv', authenticate, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });

    let csv = 'ID,Date,Type,Category,SubCategory,Merchant,Description,Amount,PaymentMethod,IsAnomaly\n';
    transactions.forEach(t => {
      csv += `"${t.id}","${new Date(t.date).toISOString().split('T')[0]}","${t.type}","${t.category}","${t.subCategory || ''}","${t.merchant || ''}","${t.description.replace(/"/g, '""')}","${t.amount}","${t.paymentMethod}","${t.isAnomaly}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// Batch CSV Import
router.post('/import/json', authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    const created = [];
    for (const item of items) {
      const parsedAmount = parseFloat(item.amount);
      if (isNaN(parsedAmount)) continue;

      const aiCat = categorizeTransaction(item.description || item.merchant || 'General', parsedAmount, item.merchant);

      const tx = await prisma.transaction.create({
        data: {
          userId: req.user.id,
          amount: parsedAmount,
          type: item.type || 'EXPENSE',
          category: item.category || aiCat.category,
          subCategory: item.subCategory || aiCat.subCategory,
          description: item.description || item.merchant || 'Imported Transaction',
          merchant: item.merchant || item.description,
          date: item.date ? new Date(item.date) : new Date(),
          paymentMethod: item.paymentMethod || 'UPI',
          aiCategoryConfidence: aiCat.confidence
        }
      });
      created.push(tx);
    }

    res.json({ message: `Successfully imported ${created.length} transactions`, count: created.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import transactions' });
  }
});

export default router;
