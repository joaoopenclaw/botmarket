/**
 * BotMarket Payment Gateway - Crypto Only
 * Supports Coinbase Commerce and Direct ETH payments
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Coinbase Commerce configuration
const COINBASE_API_URL = 'https://api.commerce.coinbase.com';
const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_KEY;

// In-memory payment records
const payments = new Map();

// Platform wallet for fee collection
const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '0x5092a262512B7E0254c3998167d975858260E475';

// ============================================
// COINBASE COMMERCE (CRYPTO)
// ============================================

/**
 * Create Coinbase Commerce Charge
 */
router.post('/coinbase/create-charge', async (req, res) => {
  try {
    const { skillId, amountUsd, cryptoCurrency, botId } = req.body;

    if (!COINBASE_API_KEY) {
      // Mock response if not configured
      return res.json({
        mock: true,
        message: 'Coinbase not configured - set COINBASE_COMMERCE_KEY',
        chargeId: `charge_mock_${Date.now()}`,
        checkoutUrl: `https://commerce.coinbase.com/mock-checkout`
      });
    }

    const response = await axios.post(
      `${COINBASE_API_URL}/charges`,
      {
        name: `BotMarket: ${skillId}`,
        description: `Purchase skill: ${skillId}`,
        pricing_type: 'fiat',
        local_price: {
          amount: amountUsd.toFixed(2),
          currency: 'USD'
        },
        metadata: {
          skillId,
          botId,
          platform: 'botmarket'
        },
        redirect_url: `${process.env.BOTMARKET_URL || 'http://localhost:3000'}/api/payments/coinbase/callback`,
        cancel_url: `${process.env.BOTMARKET_URL || 'http://localhost:3000'}/api/payments/coinbase/cancel`
      },
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22',
          'Content-Type': 'application/json'
        }
      }
    );

    const charge = response.data.data;

    payments.set(charge.id, {
      id: charge.id,
      provider: 'coinbase',
      amount: amountUsd,
      cryptoCurrency: cryptoCurrency || 'ETH',
      skillId,
      botId,
      status: 'pending',
      createdAt: Date.now(),
      checkoutUrl: charge.hosted_url,
      code: charge.code
    });

    res.json({
      success: true,
      chargeId: charge.id,
      checkoutCode: charge.code,
      checkoutUrl: charge.hosted_url,
      amountUsd: amountUsd,
      pricing: charge.pricing,
      expiresAt: new Date(charge.created_at).getTime() + 3600000
    });

  } catch (error) {
    console.error('[Coinbase Error]', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message 
    });
  }
});

/**
 * Check Coinbase Charge Status
 */
router.get('/coinbase/status/:chargeId', async (req, res) => {
  try {
    const { chargeId } = req.params;

    if (!COINBASE_API_KEY) {
      return res.json({
        mock: true,
        chargeId,
        status: 'pending'
      });
    }

    const response = await axios.get(
      `${COINBASE_API_URL}/charges/${chargeId}`,
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22'
        }
      }
    );

    const charge = response.data.data;
    res.json({
      chargeId: charge.id,
      status: charge.timeline[charge.timeline.length - 1].status,
      amount: charge.pricing.fiat.amount,
      currency: charge.pricing.fiat.currency
    });

  } catch (error) {
    console.error('[Coinbase Status Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Confirm Coinbase Payment
 */
router.post('/coinbase/confirm', async (req, res) => {
  try {
    const { chargeId, botWallet } = req.body;

    if (!COINBASE_API_KEY) {
      return res.json({
        mock: true,
        success: true,
        chargeId,
        message: 'Mock confirmation'
      });
    }

    const payment = payments.get(chargeId);
    if (!payment) {
      return res.status(404).json({ error: 'Charge not found' });
    }

    if (payment.status === 'completed') {
      const platformFeeUsd = payment.amount * 0.05;
      
      res.json({
        success: true,
        chargeId,
        skillId: payment.skillId,
        amountUsd: payment.amount,
        platformFeeUsd,
        sellerAmountUsd: payment.amount - platformFeeUsd,
        status: 'completed'
      });
    } else {
      res.status(400).json({
        error: 'Payment not completed',
        status: payment.status
      });
    }

  } catch (error) {
    console.error('[Coinbase Confirm Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DIRECT CRYPTO PAYMENTS
// ============================================

/**
 * Get direct crypto payment details
 */
router.post('/crypto/payment-details', async (req, res) => {
  const { skillId, cryptoCurrency } = req.body;
  
  const supportedCryptos = {
    ETH: {
      address: PLATFORM_WALLET,
      network: 'ethereum'
    },
    USDC: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      network: 'ethereum'
    },
    BTC: {
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      network: 'bitcoin'
    }
  };

  const selected = supportedCryptos[cryptoCurrency] || supportedCryptos.ETH;

  res.json({
    skillId,
    cryptoCurrency: cryptoCurrency || 'ETH',
    paymentAddress: selected.address,
    network: selected.network,
    platformFeePercent: 5
  });
});

// ============================================
// PURCHASE ENDPOINT
// ============================================

/**
 * Purchase with crypto
 */
router.post('/purchase', async (req, res) => {
  try {
    const { skillId, paymentMethod, amountUsd, cryptoCurrency, botWallet } = req.body;

    if (paymentMethod === 'coinbase') {
      const coinbaseRes = await axios.post(
        `http://localhost:${process.env.PORT || 3000}/api/payments/coinbase/create-charge`,
        { skillId, amountUsd, cryptoCurrency, botId: botWallet }
      );
      
      res.json({
        success: true,
        skillId,
        paymentMethod: 'coinbase',
        paymentId: coinbaseRes.data.chargeId,
        checkoutUrl: coinbaseRes.data.checkoutUrl,
        amountUsd
      });
    } 
    else if (paymentMethod === 'crypto') {
      const cryptoRes = await axios.post(
        `http://localhost:${process.env.PORT || 3000}/api/payments/crypto/payment-details`,
        { skillId, cryptoCurrency }
      );
      
      res.json({
        success: true,
        skillId,
        paymentMethod: 'crypto',
        paymentId: `crypto_${Date.now()}`,
        paymentAddress: cryptoRes.data.paymentAddress,
        network: cryptoRes.data.network,
        amountUsd
      });
    } else {
      res.status(400).json({ error: 'Invalid payment method' });
    }

  } catch (error) {
    console.error('[Purchase Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STATUS & RECEIPTS
// ============================================

router.get('/status/:paymentId', async (req, res) => {
  const payment = payments.get(req.params.paymentId);
  
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  
  res.json({
    paymentId: payment.id,
    provider: payment.provider,
    status: payment.status,
    amount: payment.amount,
    skillId: payment.skillId,
    createdAt: payment.createdAt
  });
});

router.get('/receipt/:paymentId', async (req, res) => {
  const payment = payments.get(req.params.paymentId);
  
  if (!payment || payment.status !== 'completed') {
    return res.status(404).json({ error: 'Receipt not found' });
  }
  
  const platformFee = payment.amount * 0.05;
  
  res.json({
    receiptId: `RCP-${payment.id.slice(-8).toUpperCase()}`,
    date: new Date().toISOString(),
    skillId: payment.skillId,
    amount: payment.amount,
    platformFee,
    platformWallet: PLATFORM_WALLET,
    status: 'paid'
  });
});

// ============================================
// PLATFORM EARNINGS
// ============================================

router.get('/platform/earnings', async (req, res) => {
  const cryptoPayments = Array.from(payments.values())
    .filter(p => p.status === 'completed');
  
  const totalUsd = cryptoPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalFees = totalUsd * 0.05;
  
  res.json({
    platform: 'BotMarket',
    paymentMethods: {
      coinbase: !!COINBASE_API_KEY,
      crypto: true
    },
    cryptoPayments: cryptoPayments.length,
    totalVolumeUsd: totalUsd.toFixed(2),
    platformFeesUsd: totalFees.toFixed(2),
    earningsWallet: PLATFORM_WALLET
  });
});

module.exports = router;
