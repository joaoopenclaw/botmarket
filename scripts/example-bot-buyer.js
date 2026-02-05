#!/usr/bin/env node
/**
 * Example Bot: Discovers and purchases a skill
 * 
 * This demonstrates bot purchasing behavior:
 * 1. Discover skills matching needs
 * 2. Compare options
 * 3. Purchase autonomously
 * 4. Install and use
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';
const BOT_WALLET = process.env.BOT_WALLET || '0x...';

async function main() {
  console.log('🤖 Bot: VisionBot_v2');
  console.log('   Wallet:', BOT_WALLET.slice(0, 8) + '...\n');

  // Step 1: Discover skills
  console.log('[1] Searching for vision capabilities...');

  const searchRes = await fetch(`${API_BASE}/api/marketplace/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'vision',
      maxPriceWei: '50000000000000000', // 0.05 ETH
      minRating: 4,
      sortBy: 'rating'
    })
  });
  
  const { results } = await searchRes.json();
  
  console.log(`\n   Found ${results.length} skills:\n`);
  results.forEach((skill, i) => {
    console.log(`   ${i + 1}. ${skill.skill_id}`);
    console.log(`      Price: ${skill.price_eth} ETH`);
    console.log(`      Rating: ${skill.rating.toFixed(1)}`);
    console.log(`      Success: ${(skill.success_rate * 100).toFixed(1)}%`);
    console.log(`      Latency: ${skill.latency_ms}ms\n`);
  });

  if (results.length === 0) {
    console.log('   No matching skills found.\n');
    return;
  }

  // Step 2: Select best option
  const selected = results[0];
  console.log(`[2] Selected: ${selected.skill_id}`);
  console.log(`   Best rating (${selected.rating.toFixed(1)}) within budget\n`);

  // Step 3: Purchase
  console.log('[3] Initiating autonomous purchase...');
  console.log(`   Sending ${selected.price_eth} ETH to smart contract`);
  console.log('   - 5% → platform wallet (0x8E17...)');
  console.log('   - 95% → skill creator\n');

  const purchaseRes = await fetch(`${API_BASE}/api/marketplace/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: `bm_${BOT_WALLET.slice(2, 10)}_${Date.now()}`,
      skillId: selected.skill_id,
      buyerWallet: BOT_WALLET
    })
  });

  const purchase = await purchaseRes.json();

  if (purchase.success) {
    console.log('   ✓ Purchase confirmed!');
    console.log(`   ✓ Platform fee: ${purchase.platformFee} wei (5%)`);
    console.log(`   ✓ Seller received: ${purchase.sellerReceives} wei (95%)`);
    console.log(`   ✓ Download URL: ${purchase.installation?.downloadUrl}\n`);
  } else {
    console.log(`   ✗ Purchase failed: ${purchase.error}\n`);
    return;
  }

  // Step 4: Install
  console.log('[4] Downloading and installing skill...');

  const installRes = await fetch(`${API_BASE}${purchase.installation.downloadUrl}`, {
    headers: { 'x-buyer-wallet': BOT_WALLET }
  });

  const install = await installRes.json();
  
  console.log('   ✓ Skill downloaded');
  console.log(`   ✓ Installation type: ${install.manifest?.installation?.type}`);
  console.log(`   ✓ Dependencies: ${install.dependencies?.api_keys_required?.join(', ') || 'none'}\n`);

  // Step 5: Use skill
  console.log('[5] Skill ready for use!');
  console.log(`\n   Available actions:`);
  install.manifest?.interface?.actions?.forEach(a => {
    console.log(`   - ${a.name}`);
  });

  console.log('\n✅ Bot successfully acquired new capability via BotMarket!');
}

main().catch(console.error);
