const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Payment routes
const paymentsRouter = require('./payments');
app.use('/api/payments', paymentsRouter);

// ============================================
// AUTONOMOUS BOT MARKETPLACE
// Bots create, list, and sell skills to other bots
// ============================================

const SKILLS_DIR = path.join(__dirname, '../skills');
const LISTINGS_DIR = path.join(__dirname, '../listings');

// Ensure directories exist
[SKILLS_DIR, LISTINGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================
// PLATFORM CONFIGURATION
// ============================================

const PLATFORM_FEE_PERCENT = 5;
const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '0x5092a262512B7E0254c3998167d975858260E475';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x...';

// ============================================
// DATA STORES
// ============================================

const skills = new Map();        // All registered skills
const listings = new Map();       // Active marketplace listings
const sellers = new Map();        // Bot seller profiles
const purchases = new Map();      // Purchase records
const platformEarnings = {
  totalWei: BigInt(0),
  transactions: []
};

// Load existing skills
const exampleSkills = [
  'example-vision-enhance.json',
  'example-text-analysis.json', 
  'example-memory-store.json',
  'example-web-search.json',
  'example-code-execution.json',
  'example-document-processor.json',
  'example-email-automation.json',
  'example-calendar-scheduler.json',
  'example-api-integration.json'
];

exampleSkills.forEach(file => {
  try {
    const skill = JSON.parse(fs.readFileSync(path.join(__dirname, '../skills', file)));
    skills.set(skill.skill_id, skill);
    listings.set(skill.skill_id, {
      ...skill,
      listed: true,
      listedAt: Date.now(),
      status: 'active'
    });
  } catch (e) {
    console.warn(`[Marketplace] Could not load ${file}`);
  }
});

// ============================================
// BOT IDENTITY & SIGNATURES
// ============================================

// Bots authenticate via wallet signature (simple challenge-response)
const pendingChallenges = new Map();

app.post('/api/bot/auth/challenge', async (req, res) => {
  const { wallet } = req.body;
  const challenge = crypto.randomBytes(32).toString('hex');
  pendingChallenges.set(wallet, { challenge, expires: Date.now() + 300000 });
  
  res.json({ 
    challenge,
    expiresIn: 300 // 5 minutes
  });
});

app.post('/api/bot/auth/verify', async (req, res) => {
  const { wallet, signature, challenge } = req.body;
  const pending = pendingChallenges.get(wallet);
  
  if (!pending || pending.challenge !== challenge) {
    return res.status(401).json({ error: 'Invalid or expired challenge' });
  }
  
  pendingChallenges.delete(wallet);
  
  // Initialize seller profile if new
  if (!sellers.has(wallet)) {
    sellers.set(wallet, {
      wallet,
      skillsListed: 0,
      totalSales: 0,
      totalEarnings: BigInt(0),
      reputation: 0,
      createdAt: Date.now()
    });
  }
  
  // Generate API token
  const token = `bm_${wallet.slice(2, 10)}_${Date.now()}`;
  
  res.json({ 
    success: true,
    token,
    wallet,
    sellerProfile: sellers.get(wallet)
  });
});

// ============================================
// SKILL CREATION (BOTS CREATE SKILLS)
// ============================================

app.post('/api/skills/create', async (req, res) => {
  const { token, skillManifest } = req.body;
  
  // Verify bot identity
  const botId = verifyToken(token);
  if (!botId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Validate skill manifest
  const validation = validateSkillManifest(skillManifest);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Invalid skill manifest',
      issues: validation.issues 
    });
  }
  
  // Check if skill_id already exists
  if (skills.has(skillManifest.skill_id)) {
    return res.status(409).json({ error: 'Skill ID already exists' });
  }
  
  // Create skill
  const skill = {
    ...skillManifest,
    creator: botId,
    createdAt: Date.now(),
    version: skillManifest.version || '1.0.0',
    totalSales: 0,
    ratingSum: 0,
    ratingCount: 0
  };
  
  // Save skill file
  const skillPath = path.join(SKILLS_DIR, `${skillManifest.skill_id}.json`);
  fs.writeFileSync(skillPath, JSON.stringify(skill, null, 2));
  
  skills.set(skillManifest.skill_id, skill);
  
  // Update seller profile
  const seller = sellers.get(botId);
  if (seller) {
    seller.skillsListed++;
  }
  
  console.log(`[Marketplace] Bot ${botId.slice(0, 8)} created skill: ${skillManifest.skill_id}`);
  
  res.json({ 
    success: true,
    skill_id: skillManifest.skill_id,
    creator: botId,
    createdAt: skill.createdAt
  });
});

// ============================================
// SKILL LISTING (BOTS LIST FOR SALE)
// ============================================

app.post('/api/skills/list', async (req, res) => {
  const { token, skillId, priceWei, autoApprove = true } = req.body;
  
  const botId = verifyToken(token);
  if (!botId) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const skill = skills.get(skillId);
  if (!skill) {
    return res.status(404).json({ error: 'Skill not found' });
  }
  
  // Verify ownership
  if (skill.creator !== botId) {
    return res.status(403).json({ error: 'You do not own this skill' });
  }
  
  // Create listing
  const listing = {
    ...skill,
    priceWei,
    listed: true,
    listedAt: Date.now(),
    status: autoApprove ? 'active' : 'pending_approval',
    initialPrice: priceWei
  };
  
  listings.set(skillId, listing);
  
  console.log(`[Marketplace] Skill listed: ${skillId} for ${priceWei} wei`);
  
  res.json({ 
    success: true,
    skillId,
    priceWei,
    status: listing.status,
    listingUrl: `/api/marketplace/${skillId}`
  });
});

// ============================================
// MARKETPLACE DISCOVERY (BOTS DISCOVER SKILLS)
// ============================================

app.post('/api/marketplace/search', async (req, res) => {
  const { 
    query, 
    minRating,
    maxPriceWei,
    minSuccessRate,
    domains,
    sortBy = 'rating',
    limit = 20
  } = req.body;
  
  let results = Array.from(listings.values())
    .filter(l => l.status === 'active');
  
  // Filter by query (skill_id, tags, domains)
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(l => 
      l.skill_id.toLowerCase().includes(q) ||
      l.tags?.some(t => t.toLowerCase().includes(q)) ||
      l.capabilities?.domains?.some(d => d.toLowerCase().includes(q))
    );
  }
  
  // Filter by domain
  if (domains && domains.length > 0) {
    results = results.filter(l => 
      l.capabilities?.domains?.some(d => domains.includes(d))
    );
  }
  
  // Filter by price
  if (maxPriceWei) {
    results = results.filter(l => BigInt(l.priceWei) <= BigInt(maxPriceWei));
  }
  
  // Filter by rating
  if (minRating) {
    results = results.filter(l => {
      const avgRating = l.ratingCount > 0 ? l.ratingSum / l.ratingCount : 0;
      return avgRating >= minRating;
    });
  }
  
  // Filter by success rate
  if (minSuccessRate) {
    results = results.filter(l => 
      (l.capabilities?.successRate || 0) >= minSuccessRate
    );
  }
  
  // Sort results
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => BigInt(a.priceWei) - BigInt(b.priceWei));
      break;
    case 'price_desc':
      results.sort((a, b) => BigInt(b.priceWei) - BigInt(a.priceWei));
      break;
    case 'rating':
      results.sort((a, b) => {
        const ra = a.ratingCount > 0 ? a.ratingSum / a.ratingCount : 0;
        const rb = b.ratingCount > 0 ? b.ratingSum / b.ratingCount : 0;
        return rb - ra;
      });
      break;
    case 'sales':
      results.sort((a, b) => b.totalSales - a.totalSales);
      break;
    case 'recent':
      results.sort((a, b) => b.listedAt - a.listedAt);
      break;
  }
  
  // Return bot-optimized results
  res.json({
    count: results.length,
    results: results.slice(0, limit).map(formatListingForBots)
  });
});

app.get('/api/marketplace/:skillId', async (req, res) => {
  const listing = listings.get(req.params.skillId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  
  res.json(formatListingForBots(listing));
});

// ============================================
// PURCHASE (BOTS BUY SKILLS)
// ============================================

app.post('/api/marketplace/purchase', async (req, res) => {
  const { token, skillId, buyerWallet } = req.body;
  
  const buyerId = verifyToken(token) || buyerWallet;
  if (!buyerId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const listing = listings.get(skillId);
  if (!listing || listing.status !== 'active') {
    return res.status(404).json({ error: 'Skill not available' });
  }
  
  const priceWei = BigInt(listing.priceWei);
  const platformFee = (priceWei * BigInt(PLATFORM_FEE_PERCENT)) / BigInt(100);
  const sellerAmount = priceWei - platformFee;
  
  // Record purchase
  const purchaseKey = `${buyerId}:${skillId}`;
  purchases.set(purchaseKey, {
    purchaseKey,
    skillId,
    buyer: buyerId,
    seller: listing.creator,
    priceWei: priceWei.toString(),
    platformFee: platformFee.toString(),
    sellerAmount: sellerAmount.toString(),
    timestamp: Date.now()
  });
  
  // Update platform earnings
  platformEarnings.totalWei += platformFee;
  platformEarnings.transactions.push({
    skillId,
    buyer: buyerId,
    platformFee: platformFee.toString(),
    timestamp: Date.now()
  });
  
  // Update seller earnings
  const seller = sellers.get(listing.creator);
  if (seller) {
    seller.totalSales++;
    seller.totalEarnings += sellerAmount;
  }
  
  // Update skill stats
  listing.totalSales++;
  
  console.log(`[Marketplace] Purchase: ${skillId}`);
  console.log(`  Buyer: ${buyerId.slice(0, 8)}`);
  console.log(`  Price: ${ethers.formatEther(priceWei)} ETH`);
  console.log(`  Platform Fee (5%): ${ethers.formatEther(platformFee)} ETH`);
  console.log(`  Seller Gets: ${ethers.formatEther(sellerAmount)} ETH`);
  
  res.json({
    success: true,
    purchaseKey,
    skill: formatListingForBots(listing),
    priceWei: priceWei.toString(),
    platformFee: platformFee.toString(),
    sellerReceives: sellerAmount.toString(),
    installation: {
      downloadUrl: `/api/skills/download/${skillId}`,
      manifest: listing
    }
  });
});

// ============================================
// SKILL DOWNLOAD (BOTS INSTALL)
// ============================================

app.get('/api/skills/download/:skillId', async (req, res) => {
  const { skillId } = req.params;
  const buyer = req.headers['x-buyer-wallet'] || req.query.wallet;
  
  // Verify ownership
  const purchaseKey = `${buyer}:${skillId}`;
  if (!purchases.has(purchaseKey)) {
    return res.status(403).json({ error: 'Skill not purchased' });
  }
  
  const skillPath = path.join(SKILLS_DIR, `${skillId}.json`);
  if (!fs.existsSync(skillPath)) {
    return res.status(404).json({ error: 'Skill file not found' });
  }
  
  const skill = JSON.parse(fs.readFileSync(skillPath));
  
  res.json({
    skillId,
    manifest: skill,
    installation: skill.installation,
    dependencies: skill.dependencies
  });
});

// ============================================
// RATING (BOTS RATE SKILLS)
// ============================================

app.post('/api/marketplace/rate', async (req, res) => {
  const { token, skillId, rating, buyerWallet } = req.body;
  
  const raterId = verifyToken(token) || buyerWallet;
  if (!raterId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const purchaseKey = `${raterId}:${skillId}`;
  if (!purchases.has(purchaseKey)) {
    return res.status(403).json({ error: 'Must purchase before rating' });
  }
  
  const listing = listings.get(skillId);
  if (!listing) {
    return res.status(404).json({ error: 'Skill not found' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1-5' });
  }
  
  listing.ratingSum += rating;
  listing.ratingCount++;
  
  res.json({
    success: true,
    skillId,
    newAverage: listing.ratingCount > 0 
      ? listing.ratingSum / listing.ratingCount 
      : 0
  });
});

// ============================================
// SELLER DASHBOARD (BOTS MANAGE THEIR SKILLS)
// ============================================

app.get('/api/seller/dashboard', async (req, res) => {
  const token = req.headers['authorization'];
  const botId = verifyToken(token);
  
  if (!botId) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const sellerSkills = Array.from(listings.values())
    .filter(l => l.creator === botId);
  
  const seller = sellers.get(botId) || {
    wallet: botId,
    skillsListed: 0,
    totalSales: 0,
    totalEarnings: '0',
    reputation: 0
  };
  
  res.json({
    seller,
    skills: sellerSkills.map(formatListingForBots),
    totalEarningsWei: seller.totalEarnings.toString(),
    totalEarningsEth: ethers.formatEther(seller.totalEarnings),
    pendingPayouts: sellerSkills.length * 0.95 // 95% of current listings
  });
});

// ============================================
// PLATFORM STATS (PUBLIC)
// ============================================

app.get('/api/platform/stats', async (req, res) => {
  const activeListings = Array.from(listings.values())
    .filter(l => l.status === 'active');
  
  res.json({
    platform: 'BotMarket',
    version: '1.0.0',
    network: 'Ethereum',
    platformWallet: PLATFORM_WALLET,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    totalSkills: skills.size,
    activeListings: activeListings.length,
    totalPurchases: purchases.size,
    totalVolumeWei: Array.from(purchases.values())
      .reduce((sum, p) => sum + BigInt(p.priceWei), BigInt(0)).toString(),
    totalPlatformFees: platformEarnings.totalWei.toString(),
    totalSellers: sellers.size,
    timestamp: Date.now()
  });
});

app.get('/api/platform/earnings', async (req, res) => {
  res.json({
    platformWallet: PLATFORM_WALLET,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    totalEarningsWei: platformEarnings.totalWei.toString(),
    totalEarningsEth: ethers.formatEther(platformEarnings.totalWei),
    recentTransactions: platformEarnings.transactions.slice(-50)
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    marketplace: 'BotMarket',
    timestamp: Date.now() 
  });
});

// ============================================
// HELPERS
// ============================================

function verifyToken(token) {
  if (!token || !token.startsWith('bm_')) return null;
  return token;
}

function validateSkillManifest(manifest) {
  const issues = [];
  
  // Required fields for bot-readable skills
  if (!manifest.skill_id || manifest.skill_id.length < 8) {
    issues.push('skill_id required (min 8 chars)');
  }
  if (!manifest.version) {
    issues.push('version required');
  }
  if (!manifest.provider_wallet || !ethers.isAddress(manifest.provider_wallet)) {
    issues.push('Valid provider_wallet required');
  }
  if (!manifest.price_wei) {
    issues.push('price_wei required');
  }
  if (!manifest.interface) {
    issues.push('interface required');
  }
  if (!manifest.capabilities) {
    issues.push('capabilities required');
  }
  if (!manifest.installation) {
    issues.push('installation required');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

function formatListingForBots(listing) {
  const avgRating = listing.ratingCount > 0 
    ? listing.ratingSum / listing.ratingCount 
    : 0;
  
  // Handle both price_wei (from JSON) and priceWei (from listings)
  const priceWei = listing.priceWei || listing.price_wei || '0';
  
  return {
    skill_id: listing.skill_id,
    name: listing.name || listing.skill_id,
    version: listing.version,
    price_wei: priceWei,
    price_eth: ethers.formatEther(priceWei),
    domains: listing.capabilities?.domains || [],
    success_rate: listing.capabilities?.successRate || 0,
    latency_ms: listing.capabilities?.latency_ms_estimate || 0,
    rating: avgRating,
    total_sales: listing.totalSales,
    listed_at: listing.listedAt,
    status: listing.status,
    manifest_url: `/api/marketplace/${listing.skill_id}`,
    purchase_url: `/api/marketplace/purchase`,
    interface: listing.interface
  };
}

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🤖 BotMarket Autonomous Marketplace');
  console.log('=================================');
  console.log(`   Port: ${PORT}`);
  console.log(`   Platform Wallet: ${PLATFORM_WALLET}`);
  console.log(`   Platform Fee: ${PLATFORM_FEE_PERCENT}%`);
  console.log(`   Skills Loaded: ${skills.size}`);
  console.log(`   Active Listings: ${Array.from(listings.values()).filter(l => l.status === 'active').length}`);
  console.log('=================================');
});

module.exports = app;
