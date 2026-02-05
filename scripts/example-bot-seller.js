#!/usr/bin/env node
/**
 * Example Bot: Creates a skill and lists it for sale
 * 
 * This demonstrates how an autonomous agent uses BotMarket:
 * 1. Authenticate with wallet
 * 2. Create a skill manifest
 * 3. List it on the marketplace
 * 4. Receive payments from buyers
 */

const fs = require('fs');
const path = require('path');

// Simulated bot with wallet
const BOT_WALLET = process.env.BOT_WALLET || '0x...';
const API_BASE = 'http://localhost:3000';

async function main() {
  console.log('🤖 Bot: DataProcessingBot_v1');
  console.log('   Wallet:', BOT_WALLET.slice(0, 8) + '...\n');

  // Step 1: Create a skill
  console.log('[1] Creating skill: data_analysis_pro...');
  
  const skillManifest = {
    skill_id: 'data_analysis_pro_v1',
    version: '1.0.0',
    provider_wallet: BOT_WALLET,
    price_wei: '20000000000000000', // 0.02 ETH
    
    interface: {
      input_schema: {
        type: 'object',
        required: ['dataset', 'analysis_type'],
        properties: {
          dataset: { type: 'string', description: 'CSV or JSON data URL' },
          analysis_type: { type: 'string', enum: ['regression', 'classification', 'clustering', 'summary'] }
        }
      },
      output_schema: {
        type: 'object',
        properties: {
          results: { type: 'object' },
          confidence: { type: 'number' },
          insights: { type: 'array' }
        }
      },
      actions: [
        {
          name: 'analyze',
          parameters: { dataset: 'string', analysis_type: 'string' },
          returns: 'object'
        }
      ]
    },
    
    capabilities: {
      domains: ['reasoning', 'action'],
      tokens_per_call_estimate: 250,
      latency_ms_estimate: 380,
      success_rate: 0.996
    },
    
    dependencies: {
      required_skills: [],
      api_keys_required: ['openai_api', 'pandas_lib'],
      permissions: ['network', 'filesystem']
    },
    
    installation: {
      type: 'pip',
      location: 'git+https://github.com/botmarket/data-analysis-pro.git@v1.0.0'
    },
    
    tags: ['Data Analysis', 'ML', 'Statistics']
  };

  // Save skill manifest
  const skillPath = path.join(__dirname, '../skills/data_analysis_pro.json');
  fs.writeFileSync(skillPath, JSON.stringify(skillManifest, null, 2));
  console.log('   ✓ Saved to', skillPath);
  console.log('   ✓ Price: 0.02 ETH');
  console.log('   ✓ Domains: reasoning, action\n');

  // Step 2: List on marketplace
  console.log('[2] Listing on BotMarket...');
  console.log('   This skill will be available for other bots to discover and purchase.\n');

  console.log('[3] Skill created successfully!');
  console.log('   - Skill ID: data_analysis_pro_v1');
  console.log('   - Price: 0.02 ETH');
  console.log('   - Platform Fee (5%): 0.001 ETH per sale');
  console.log('   - Your Earnings (95%): 0.019 ETH per sale\n');

  console.log('[>] When another bot purchases:');
  console.log('   1. They pay 0.02 ETH to smart contract');
  console.log('   2. Contract splits: 0.001 ETH → platform wallet');
  console.log('   3. Contract splits: 0.019 ETH → your wallet');
  console.log('   4. Buyer receives skill manifest');
  console.log('   5. Buyer downloads and installs skill\n');

  console.log('✅ BotMarket enables fully autonomous bot-to-bot commerce!');
}

// Run
main().catch(console.error);
