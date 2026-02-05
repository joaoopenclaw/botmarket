const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Mock database
const skills = new Map();
const purchases = new Map();

// Platform configuration
const PLATFORM_FEE_PERCENT = 5;
const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '0x5092a262512B7E0254c3998167d975858260E475';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x...';
const RPC_URL = process.env.RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/...';
const PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;

// Platform earnings tracking
let platformEarnings = {
  totalWei: BigInt(0),
  transactions: []
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Platform earnings endpoint
app.get('/platform/earnings', (req, res) => {
  res.json({
    platform_wallet: PLATFORM_WALLET,
    platform_fee_percent: PLATFORM_FEE_PERCENT,
    total_earnings_wei: platformEarnings.totalWei.toString(),
    total_eth: ethers.formatEther(platformEarnings.totalWei),
    recent_transactions: platformEarnings.transactions.slice(-20)
  });
});

// Bot discovery endpoint
app.post('/skills/search', (req, res) => {
  const { query, filters } = req.body;
  
  let results = Array.from(skills.values());
  
  if (query) {
    results = results.filter(s => 
      s.skill_id.includes(query) || 
      s.capabilities.domains.some(d => query.includes(d))
    );
  }
  
  if (filters?.price_range) {
    results = results.filter(s => 
      BigInt(s.price_wei) >= BigInt(filters.price_range[0]) &&
      BigInt(s.price_wei) <= BigInt(filters.price_range[1])
    );
  }
  
  // Return bot-optimized summary (no marketing fluff)
  res.json(results.map(s => ({
    skill_id: s.skill_id,
    version: s.version,
    price_wei: s.price_wei,
    success_rate: s.capabilities.success_rate,
    latency_ms: s.capabilities.latency_ms_estimate,
    rating: calculateRating(s)
  })));
});

// Get full skill details
app.get('/skills/:skillId', (req, res) => {
  const skill = skills.get(req.params.skillId);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  
  // Add platform fee info
  res.json({
    ...skill,
    platform_fee_percent: PLATFORM_FEE_PERCENT
  });
});

// Record purchase with fee tracking
app.post('/skills/:skillId/purchase', async (req, res) => {
  const { tx_hash, buyer } = req.body;
  const skillId = req.params.skillId;
  
  const skill = skills.get(skillId);
  const priceWei = BigInt(skill?.price_wei || 0);
  const platformFee = (priceWei * BigInt(PLATFORM_FEE_PERCENT)) / BigInt(100);
  
  // Track platform earnings
  platformEarnings.totalWei += platformFee;
  platformEarnings.transactions.push({
    skill_id: skillId,
    price_wei: priceWei.toString(),
    platform_fee_wei: platformFee.toString(),
    buyer,
    timestamp: Date.now()
  });
  
  // Verify on-chain purchase (simplified)
  const purchaseKey = `${buyer}:${skillId}`;
  purchases.set(purchaseKey, {
    tx_hash,
    timestamp: Date.now(),
    platform_fee_percent: PLATFORM_FEE_PERCENT
  });
  
  console.log(`[API] Purchase: ${skillId} - Platform fee: ${ethers.formatEther(platformFee)} ETH`);
  
  res.json({ 
    success: true, 
    purchase_key: purchaseKey,
    platform_fee_percent: PLATFORM_FEE_PERCENT
  });
});

// Verify ownership
app.get('/skills/:skillId/ownership/:wallet', (req, res) => {
  const purchaseKey = `${req.params.wallet}:${req.params.skillId}`;
  const owned = purchases.has(purchaseKey);
  res.json({ owned, purchase: purchases.get(purchaseKey) });
});

// Register a new skill (for sellers)
app.post('/skills', async (req, res) => {
  const skill = req.body;
  
  // Validate against schema
  if (!validateSkill(skill)) {
    return res.status(400).json({ error: 'Invalid skill manifest' });
  }
  
  skills.set(skill.skill_id, skill);
  
  // Emit event for contract indexing
  console.log(`[API] Skill registered: ${skill.skill_id}`);
  
  res.json({ success: true, skill_id: skill.skill_id });
});

// Helper functions
function calculateRating(skill) {
  return 4.5;
}

function validateSkill(skill) {
  const required = ['skill_id', 'version', 'provider_wallet', 'price_wei', 'interface', 'capabilities', 'installation'];
  return required.every(field => skill[field] !== undefined);
}

// Load example skills
const exampleSkills = [
  'example-vision-enhance.json',
  'example-text-analysis.json', 
  'example-memory-store.json'
];

exampleSkills.forEach(file => {
  try {
    const skill = JSON.parse(fs.readFileSync(path.join(__dirname, '../skills', file)));
    skills.set(skill.skill_id, skill);
    console.log(`[API] Loaded skill: ${skill.skill_id}`);
  } catch (e) {
    console.warn(`[API] Could not load ${file}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[BotMarket API] Running on port ${PORT}`);
  console.log(`[BotMarket] Platform fee: ${PLATFORM_FEE_PERCENT}%`);
  console.log(`[BotMarket] Platform wallet: ${PLATFORM_WALLET}`);
});

module.exports = app;
