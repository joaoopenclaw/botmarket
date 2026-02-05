#!/usr/bin/env node
/**
 * BotMarket Simulation - Demonstrates Unlimited Stock Revenue Model
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 BotMarket Unlimited Stock Simulation\n');
console.log('='.repeat(60));
console.log('This simulation shows how revenue grows with unlimited copies.');
console.log('Each skill can be sold infinitely to different bots.\n');
console.log('='.repeat(60));

// Platform configuration
const PLATFORM_FEE_PERCENT = 5;
const PLATFORM_WALLET = '0x5092a262512B7E0254c3998167d975858260E475';

// Skills with prices
const skills = [
  { name: 'Vision Enhance Pro', price: 0.05 },
  { name: 'Text Analysis Pro', price: 0.01 },
  { name: 'Memory Vector Store', price: 0.025 },
  { name: 'Web Search Pro', price: 0.03 },
  { name: 'Code Execution Pro', price: 0.08 },
  { name: 'Document Processor Pro', price: 0.04 },
  { name: 'Email Automation Pro', price: 0.035 },
  { name: 'Calendar Scheduler Pro', price: 0.03 },
  { name: 'API Integration Pro', price: 0.045 }
];

// Scenario 1: Small adoption
function simulateSmallAdoption() {
  console.log('\n📊 SCENARIO 1: Small Adoption');
  console.log('-'.repeat(40));
  
  let totalSales = 0;
  let totalVolume = 0;
  let platformFees = 0;
  
  // Each skill sold 10 times
  skills.forEach(skill => {
    const sales = 10;
    const volume = sales * skill.price;
    const fees = volume * (PLATFORM_FEE_PERCENT / 100);
    
    totalSales += sales;
    totalVolume += volume;
    platformFees += fees;
  });
  
  console.log(`Bots active: ${skills.length * 10}`);
  console.log(`Purchases per skill: 10`);
  console.log(`Total Sales: ${totalSales}`);
  console.log(`Total Volume: ${totalVolume.toFixed(3)} ETH`);
  console.log(`Your Earnings (5%): ${platformFees.toFixed(4)} ETH`);
  
  return { totalSales, totalVolume, platformFees };
}

// Scenario 2: Medium adoption
function simulateMediumAdoption() {
  console.log('\n📊 SCENARIO 2: Medium Adoption');
  console.log('-'.repeat(40));
  
  let totalSales = 0;
  let totalVolume = 0;
  let platformFees = 0;
  
  // Each skill sold 100 times
  skills.forEach(skill => {
    const sales = 100;
    const volume = sales * skill.price;
    const fees = volume * (PLATFORM_FEE_PERCENT / 100);
    
    totalSales += sales;
    totalVolume += volume;
    platformFees += fees;
  });
  
  console.log(`Bots active: ${skills.length * 100}`);
  console.log(`Purchases per skill: 100`);
  console.log(`Total Sales: ${totalSales}`);
  console.log(`Total Volume: ${totalVolume.toFixed(3)} ETH`);
  console.log(`Your Earnings (5%): ${platformFees.toFixed(4)} ETH`);
  
  return { totalSales, totalVolume, platformFees };
}

// Scenario 3: Large adoption
function simulateLargeAdoption() {
  console.log('\n📊 SCENARIO 3: Large Adoption');
  console.log('-'.repeat(40));
  
  let totalSales = 0;
  let totalVolume = 0;
  let platformFees = 0;
  
  // Each skill sold 1,000 times
  skills.forEach(skill => {
    const sales = 1000;
    const volume = sales * skill.price;
    const fees = volume * (PLATFORM_FEE_PERCENT / 100);
    
    totalSales += sales;
    totalVolume += volume;
    platformFees += fees;
  });
  
  console.log(`Bots active: ${skills.length * 1000}`);
  console.log(`Purchases per skill: 1,000`);
  console.log(`Total Sales: ${totalSales.toLocaleString()}`);
  console.log(`Total Volume: ${totalVolume.toFixed(2)} ETH`);
  console.log(`Your Earnings (5%): ${platformFees.toFixed(2)} ETH`);
  
  return { totalSales, totalVolume, platformFees };
}

// Scenario 4: Viral adoption
function simulateViralAdoption() {
  console.log('\n📊 SCENARIO 4: Viral Adoption');
  console.log('-'.repeat(40));
  
  let totalSales = 0;
  let totalVolume = 0;
  let platformFees = 0;
  
  // Each skill sold 10,000 times
  skills.forEach(skill => {
    const sales = 10000;
    const volume = sales * skill.price;
    const fees = volume * (PLATFORM_FEE_PERCENT / 100);
    
    totalSales += sales;
    totalVolume += volume;
    platformFees += fees;
  });
  
  console.log(`Bots active: ${skills.length * 10000}`);
  console.log(`Purchases per skill: 10,000`);
  console.log(`Total Sales: ${totalSales.toLocaleString()}`);
  console.log(`Total Volume: ${totalVolume.toFixed(2)} ETH`);
  console.log(`Your Earnings (5%): ${platformFees.toFixed(2)} ETH`);
  
  return { totalSales, totalVolume, platformFees };
}

// Growth projection
function showGrowthProjection() {
  console.log('\n📈 GROWTH PROJECTION');
  console.log('-'.repeat(40));
  console.log('Assuming viral adoption (10,000 sales/skill):\n');
  
  const yearlyGrowth = [1, 3, 6, 12]; // months
  
  const baseVolume = skills.reduce((sum, s) => sum + (s.price * 10000), 0);
  const baseFees = baseVolume * 0.05;
  
  console.log('Month    Volume (ETH)    Your Fees (ETH)');
  console.log('-'.repeat(45));
  
  yearlyGrowth.forEach((months, i) => {
    const multiplier = months;
    const volume = baseVolume * multiplier;
    const fees = baseFees * multiplier;
    console.log(`${months.toString().padEnd(7)} ${volume.toFixed(2).padEnd(14)} ${fees.toFixed(2)}`);
  });
}

// Summary
function showSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('💰 UNLIMITED STOCK = UNLIMITED REVENUE POTENTIAL');
  console.log('='.repeat(60));
  console.log('\nWith unlimited copies, each bot that discovers BotMarket');
  console.log('can purchase any skill. The more bots that join, the more');
  console.log('revenue you generate - with zero inventory costs!\n');
  console.log(`Your Platform Wallet: ${PLATFORM_WALLET}`);
  console.log(`Platform Fee: ${PLATFORM_FEE_PERCENT}%\n`);
}

// Run all simulations
const small = simulateSmallAdoption();
const medium = simulateMediumAdoption();
const large = simulateLargeAdoption();
const viral = simulateViralAdoption();

showGrowthProjection();
showSummary();

// Save results
const results = {
  platformWallet: PLATFORM_WALLET,
  platformFeePercent: PLATFORM_FEE_PERCENT,
  scenarios: {
    small: small,
    medium: medium,
    large: large,
    viral: viral
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, '../simulation-results.json'),
  JSON.stringify(results, null, 2)
);

console.log('\n📁 Results saved to simulation-results.json');
