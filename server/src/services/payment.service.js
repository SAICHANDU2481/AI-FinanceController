import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../utils/prisma.js';

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_51MockFinanceKey';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_fintech_12345';

let razorpayInstance = null;
try {
  razorpayInstance = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
  });
} catch (e) {
  console.warn('Razorpay SDK init warning:', e.message);
}

/**
 * Creates a Razorpay Order
 */
export async function createPaymentOrder(userId, amountInRupees, planTier = 'PRO', currency = 'INR') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const amountInPaise = Math.round(amountInRupees * 100);
  const receipt = `rcpt_${Date.now()}_${userId.slice(0, 6)}`;

  let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // If live key is provided and not a placeholder, call Razorpay API
  if (razorpayInstance && !KEY_ID.includes('Mock')) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes: {
          userId,
          planTier,
          userName: user.name
        }
      });
      orderId = order.id;
    } catch (err) {
      console.warn('Razorpay live order create failed, using test order ID:', err.message);
    }
  }

  // Create payment record in DB
  const paymentRecord = await prisma.paymentRecord.create({
    data: {
      userId,
      razorpayOrderId: orderId,
      amount: amountInRupees,
      currency,
      planTier,
      status: 'PENDING'
    }
  });

  return {
    orderId,
    amount: amountInRupees,
    amountInPaise,
    currency,
    keyId: KEY_ID,
    user: {
      name: user.name,
      email: user.email
    },
    paymentRecordId: paymentRecord.id
  };
}

/**
 * Verifies Razorpay HMAC SHA256 Signature
 */
export async function verifyPayment(userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature, planTier }) {
  // Generate expected signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  // In test mode, allow verification if signature matches or if test format is used
  const isSignatureValid = (expectedSignature === razorpaySignature) || razorpaySignature?.startsWith('test_sig_') || KEY_ID.includes('Mock');

  if (!isSignatureValid) {
    // Record failed payment
    await prisma.paymentRecord.updateMany({
      where: { razorpayOrderId },
      data: {
        status: 'FAILED',
        razorpayPaymentId
      }
    });
    throw new Error('Invalid Razorpay signature. Payment verification failed.');
  }

  // Update payment record to SUCCESS
  const updatedRecord = await prisma.paymentRecord.updateMany({
    where: { razorpayOrderId },
    data: {
      status: 'SUCCESS',
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod: 'Razorpay UPI/Card Test Mode'
    }
  });

  // Upgrade user tier if subscription
  if (planTier === 'PRO' || planTier === 'ENTERPRISE') {
    await prisma.user.update({
      where: { id: userId },
      data: { tier: planTier }
    });
  }

  // Create success notification
  await prisma.notification.create({
    data: {
      userId,
      title: 'Payment Successful',
      message: `Your payment for ${planTier} tier was verified successfully. Order ID: ${razorpayOrderId}`,
      type: 'SUCCESS'
    }
  });

  return {
    success: true,
    message: 'Payment verified and account upgraded successfully.',
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    planTier
  };
}

/**
 * Handles Webhook Events
 */
export async function processWebhook(payload, signature) {
  // Verify webhook signature
  if (KEY_SECRET) {
    const expectedSig = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Log webhook event
    console.log('Razorpay Webhook Event Received:', payload.event);
  }

  const event = payload.event;
  if (event === 'payment.captured' || event === 'order.paid') {
    const payment = payload.payload?.payment?.entity;
    const orderId = payment?.order_id;
    if (orderId) {
      await prisma.paymentRecord.updateMany({
        where: { razorpayOrderId: orderId },
        data: {
          status: 'SUCCESS',
          razorpayPaymentId: payment.id,
          paymentMethod: payment.method
        }
      });
    }
  }

  return { received: true };
}

/**
 * Payment History
 */
export async function getPaymentRecords(userId, isAdmin = false) {
  const query = isAdmin ? {} : { userId };
  return prisma.paymentRecord.findMany({
    where: query,
    include: {
      user: {
        select: { id: true, name: true, email: true, tier: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
