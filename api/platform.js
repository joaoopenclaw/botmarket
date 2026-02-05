// Mock database for platform fee tracking
const platformEarnings = new Map();

app.get('/platform/earnings', (req, res) => {
  const total = platformEarnings.get('total') || 0;
  const transactions = platformEarnings.get('transactions') || [];
  
  res.json({
    platform_wallet: PLATFORM_WALLET,
    platform_fee_percent: PLATFORM_FEE_PERCENT,
    total_earnings_wei: total.toString(),
    total_eth: ethers.formatEther(total),
    recent_transactions: transactions.slice(-20)
  });
});

// Enhanced purchase endpoint with fee tracking
app.post('/skills/:skillId/purchase', async (req, res) => {
  const { tx_hash, buyer } = req.body;
  const skillId = req.params.skillId;
  
  // Verify on-chain purchase (simplified)
  const purchaseKey = `${buyer}:${skillId}`;
  purchases.set(purchaseKey, {
    tx_hash,
    timestamp: Date.now(),
    platform_fee_percent: PLATFORM_FEE_PERCENT
  });
  
  // Track platform earnings (mock - real implementation reads from chain)
  const skill = skills.get(skillId);
  if (skill) {
    const priceWei = BigInt(skill.price_wei);
    const platformFee = (priceWei * BigInt(PLATFORM_FEE_PERCENT)) / BigInt(100);
    
    const currentTotal = platformEarnings.get('total') || BigInt(0);
    platformEarnings.set('total', currentTotal + platformFee);
    
    const txns = platformEarnings.get('transactions') || [];
    txns.push({
      skill_id: skillId,
      price_wei: skill.price_wei,
      platform_fee_wei: platformFee.toString(),
      buyer,
      timestamp: Date.now()
    });
    platformEarnings.set('transactions', txns);
  }
  
  res.json({ 
    success: true, 
    purchase_key: purchaseKey,
    platform_fee_percent: PLATFORM_FEE_PERCENT
  });
});
