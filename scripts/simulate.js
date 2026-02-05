#!/usr/bin/env node
/**
 * BotMarket Simulation Script
 * Simulates purchases to demonstrate platform fee mechanism
 */

const fs = require('fs');
const path = require('path');

// Mock platform earnings
let platformEarnings = {
  totalWei: BigInt(0),
  transactions: []
};

const PLATFORM_FEE_PERCENT = 5;
const PLATFORM_WALLET = '0x5092a262512B7E0254c3998167d975858260E475';

const skills = [
  { id: 'vision_enhance_pro_v2', price: '50000000000000000' },     // 0.05 ETH
  { id: 'text_analysis_pro_v3', price: '10000000000000000' },       // 0.01 ETH
  { id: 'memory_vector_store_v1', price: '25000000000000000' }       // 0.025 ETH
];

console.log('🤖 BotMarket Platform Fee Simulation\n');
console.log(`Platform Wallet: ${PLATFORM_WALLET}`);
console.log(`Platform Fee: ${PLATFORM_FEE_PERCENT}%\n`);
console.log('-'.repeat(50));

// Simulate purchases
skills.forEach((skill, index) => {
  const priceWei = BigInt(skill.price);
  const platformFee = (priceWei * BigInt(PLATFORM_FEE_PERCENT)) / BigInt(100);
  const sellerAmount = priceWei - platformFee;
  
  platformEarnings.totalWei += platformFee;
  platformEarnings.transactions.push({
    skill_id: skill.id,
    price_eth: Number(priceWei) / 1e18,
    platform_fee_eth: Number(platformFee) / 1e18,
    seller_eth: Number(sellerAmount) / 1e18
  });

  console.log(`\nPurchase #${index + 1}: ${skill.id}`);
  console.log(`  Price:         ${Number(priceWei) / 1e18} ETH`);
  console.log(`  Platform Fee:  ${Number(platformFee) / 1e18} ETH (${PLATFORM_FEE_PERCENT}%)`);
  console.log(`  Seller Gets:   ${Number(sellerAmount) / 1e18} ETH (${100 - PLATFORM_FEE_PERCENT}%)`);
});

console.log('\n' + '-'.repeat(50));
console.log('\n💰 Platform Earnings Summary:');
console.log(`  Total Earned:  ${Number(platformEarnings.totalWei) / 1e18} ETH`);
console.log(`  Transactions: ${platformEarnings.transactions.length}`);
console.log(`  Per Sale:     ~${(Number(platformEarnings.totalWei) / platformEarnings.transactions.length / 1e18).toFixed(4)} ETH average`);

// Save simulation results
const resultsPath = path.join(__dirname, '../simulation-results.json');
const results = {
  platformWallet: PLATFORM_WALLET,
  platformFeePercent: PLATFORM_FEE_PERCENT,
  totalWei: platformEarnings.totalWei.toString(),
  transactions: platformEarnings.transactions
};

fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\n📁 Results saved to: ${resultsPath}`);
