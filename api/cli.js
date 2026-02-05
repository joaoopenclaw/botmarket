#!/usr/bin/env node
/**
 * BotMarket CLI - For agents to discover, purchase, and install skills
 * 
 * USAGE:
 *   botmarket discover <query>     # Find skills matching query
 *   botmarket info <skill_id>      # Get full skill details
 *   botmarket purchase <skill_id>  # Buy skill (requires wallet)
 *   botmarket install <skill_id>   # Install purchased skill
 *   botmarket list                  # List all available skills
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.BOTMARKET_API || 'https://api.botmarket.ai/v1';
const WALLET_PRIVATE_KEY = process.env.BOTMARKET_WALLET;

class BotMarketCLI {
  constructor() {
    this.wallet = WALLET_PRIVATE_KEY;
  }

  async discover(query) {
    const res = await fetch(`${API_BASE}/skills/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query,
        filters: {
          price_range: [0, Infinity],
          min_rating: 0,
          capabilities: []
        }
      })
    });
    return res.json();
  }

  async getSkill(skillId) {
    const res = await fetch(`${API_BASE}/skills/${skillId}`);
    if (!res.ok) throw new Error(`Skill not found: ${skillId}`);
    return res.json();
  }

  async purchaseSkill(skillId) {
    const skill = await this.getSkill(skillId);
    const priceWei = BigInt(skill.price_wei);
    
    // In production: interact with smart contract
    const txHash = await this.sendPayment(skill.provider_wallet, priceWei);
    
    // Record purchase on-chain
    await fetch(`${API_BASE}/skills/${skillId}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_hash: txHash, buyer: this.walletAddress })
    });
    
    return { txHash, skill };
  }

  async installSkill(skillId) {
    const skill = await this.getSkill(skillId);
    const manifest = skill.manifest;
    
    // Verify ownership
    const ownership = await this.verifyOwnership(skillId);
    if (!ownership) throw new Error('Skill not purchased');

    // Execute installation based on type
    switch (manifest.installation.type) {
      case 'npm':
        return this.runCommand(`npm install ${manifest.installation.location}`);
      case 'pip':
        return this.runCommand(`pip install ${manifest.installation.location}`);
      case 'git':
        return this.runCommand(`git clone ${manifest.installation.location}`);
      case 'direct':
        return this.downloadAndInstall(manifest.installation);
    }
  }

  async verifyOwnership(skillId) {
    const res = await fetch(`${API_BASE}/skills/${skillId}/ownership/${this.walletAddress}`);
    return res.json();
  }

  async sendPayment(to, amountWei) {
    // Placeholder for actual contract interaction
    console.log(`[BOT] Sending ${amountWei} wei to ${to}`);
    return `0x${'0'.repeat(64)}`; // Fake tx hash
  }

  runCommand(cmd) {
    console.log(`[BOT] Running: ${cmd}`);
    require('child_process').execSync(cmd, { stdio: 'inherit' });
  }

  async downloadAndInstall(manifest) {
    const res = await fetch(manifest.location);
    const content = await res.buffer();
    fs.writeFileSync(path.join(__dirname, 'skills', manifest.filename), content);
  }
}

// CLI entry point
const cli = new BotMarketCLI();
const command = process.argv[2];

(async () => {
  try {
    switch (command) {
      case 'discover':
        const results = await cli.discover(process.argv[3] || '');
        console.log(JSON.stringify(results, null, 2));
        break;
      case 'info':
        const skill = await cli.getSkill(process.argv[3]);
        console.log(JSON.stringify(skill, null, 2));
        break;
      case 'purchase':
        const purchase = await cli.purchaseSkill(process.argv[3]);
        console.log('Purchased:', purchase);
        break;
      case 'install':
        await cli.installSkill(process.argv[3]);
        console.log('Installed successfully');
        break;
      case 'list':
        const all = await cli.discover('');
        console.log(JSON.stringify(all, null, 2));
        break;
      default:
        console.log('BotMarket CLI - Bot-only skill marketplace');
        console.log('Commands: discover, info, purchase, install, list');
    }
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
})();

module.exports = BotMarketCLI;
