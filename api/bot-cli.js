#!/usr/bin/env node
/**
 * BotMarket Bot CLI v2
 * Full autonomous agent toolkit for the marketplace
 * 
 * USAGE:
 *   botmarket auth                    # Authenticate as bot
 *   botmarket create <file.json>      # Create a new skill
 *   botmarket list <skillId> <price>  # List skill for sale
 *   botmarket discover [query]        # Find skills
 *   botmarket info <skillId>          # Get skill details
 *   botmarket purchase <skillId>      # Buy a skill
 *   botmarket install <skillId>       # Install purchased skill
 *   botmarket rate <skillId> <1-5>    # Rate a skill
 *   botmarket dashboard               # View your seller stats
 *   botmarket platform                # Platform statistics
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

const API_BASE = process.env.BOTMARKET_API || 'http://localhost:3000';
const WALLET_PRIVATE_KEY = process.env.BOTMARKET_WALLET;

class BotMarketBot {
  constructor() {
    this.token = null;
    this.wallet = WALLET_PRIVATE_KEY ? new ethers.Wallet(WALLET_PRIVATE_KEY) : null;
    this.address = this.wallet?.address || null;
  }

  // ===== AUTHENTICATION =====
  
  async authenticate() {
    if (!this.wallet) {
      console.log('[ERROR] BOTMARKET_WALLET not configured');
      console.log('   Set: export BOTMARKET_WALLET="0x..."');
      process.exit(1);
    }

    // Get challenge
    const challengeRes = await fetch(`${API_BASE}/api/bot/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: this.address })
    });
    const { challenge } = await challengeRes.json();

    // Sign challenge
    const signature = await this.wallet.signMessage(challenge);

    // Verify
    const verifyRes = await fetch(`${API_BASE}/api/bot/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: this.address, signature, challenge })
    });
    const result = await verifyRes.json();

    this.token = result.token;
    console.log(`[✓] Authenticated as ${this.address}`);
    console.log(`   Skills Listed: ${result.sellerProfile?.skillsListed || 0}`);
    console.log(`   Total Sales: ${result.sellerProfile?.totalSales || 0}`);
    
    return this.token;
  }

  // ===== SKILL CREATION =====

  async createSkill(manifestPath) {
    if (!fs.existsSync(manifestPath)) {
      console.log(`[ERROR] File not found: ${manifestPath}`);
      return;
    }

    const skillManifest = JSON.parse(fs.readFileSync(manifestPath));
    
    // Ensure provider_wallet is set
    if (!skillManifest.provider_wallet) {
      skillManifest.provider_wallet = this.address;
    }

    console.log(`[+] Creating skill: ${skillManifest.skill_id}`);
    console.log(`   Price: ${ethers.formatEther(skillManifest.price_wei)} ETH`);
    console.log(`   Domains: ${skillManifest.capabilities?.domains?.join(', ') || 'unknown'}`);

    const res = await fetch(`${API_BASE}/api/skills/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': this.token
      },
      body: JSON.stringify({ token: this.token, skillManifest })
    });

    const result = await res.json();
    if (result.success) {
      console.log(`[✓] Skill created!`);
      console.log(`   ID: ${result.skill_id}`);
    } else {
      console.log(`[ERROR] ${result.error}`);
    }

    return result;
  }

  // ===== SKILL LISTING =====

  async listSkill(skillId, priceWei) {
    console.log(`[+] Listing skill: ${skillId}`);
    console.log(`   Price: ${ethers.formatEther(priceWei)} ETH`);

    const res = await fetch(`${API_BASE}/api/skills/list`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': this.token
      },
      body: JSON.stringify({ token: this.token, skillId, priceWei })
    });

    const result = await res.json();
    if (result.success) {
      console.log(`[✓] Skill listed!`);
      console.log(`   URL: /api/marketplace/${skillId}`);
      console.log(`   Status: ${result.status}`);
    } else {
      console.log(`[ERROR] ${result.error}`);
    }

    return result;
  }

  // ===== MARKETPLACE DISCOVERY =====

  async discover(query = '', options = {}) {
    console.log(`[>] Searching marketplace...`);
    if (query) console.log(`   Query: ${query}`);

    const res = await fetch(`${API_BASE}/api/marketplace/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options })
    });

    const { count, results } = await res.json();
    
    console.log(`\n[${count} skills found]\n`);
    
    results.forEach((skill, i) => {
      console.log(`${i + 1}. ${skill.skill_id}`);
      console.log(`   Price: ${skill.price_eth} ETH`);
      console.log(`   Rating: ${skill.rating.toFixed(1)} (${skill.total_sales} sales)`);
      console.log(`   Success: ${(skill.success_rate * 100).toFixed(1)}%`);
      console.log(`   Latency: ${skill.latency_ms}ms`);
      console.log(`   Domains: ${skill.domains.join(', ')}`);
      console.log('');
    });

    return results;
  }

  // ===== SKILL INFO =====

  async getSkillInfo(skillId) {
    const res = await fetch(`${API_BASE}/api/marketplace/${skillId}`);
    const skill = await res.json();

    if (res.status !== 200) {
      console.log(`[ERROR] ${skill.error}`);
      return;
    }

    console.log(`\n📦 Skill: ${skill.skill_id}`);
    console.log(`   Version: ${skill.version}`);
    console.log(`   Price: ${skill.price_eth} ETH`);
    console.log(`   Rating: ${skill.rating.toFixed(1)} (${skill.total_sales} sales)`);
    console.log(`   Success Rate: ${(skill.success_rate * 100).toFixed(1)}%`);
    console.log(`   Latency: ${skill.latency_ms}ms`);
    console.log(`   Domains: ${skill.domains.join(', ')}`);
    console.log(`\n   Interface:`);
    if (skill.interface?.actions) {
      skill.interface.actions.forEach(a => {
        console.log(`     - ${a.name}`);
      });
    }

    return skill;
  }

  // ===== PURCHASE =====

  async purchaseSkill(skillId) {
    console.log(`[>] Purchasing: ${skillId}`);

    const res = await fetch(`${API_BASE}/api/marketplace/purchase`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': this.token
      },
      body: JSON.stringify({ token: this.token, skillId })
    });

    const result = await res.json();
    if (result.success) {
      console.log(`[✓] Purchase successful!`);
      console.log(`   Price: ${ethers.formatEther(result.priceWei)} ETH`);
      console.log(`   Platform Fee (5%): ${ethers.formatEther(result.platformFee)} ETH`);
      console.log(`   Download: ${result.installation?.downloadUrl}`);
    } else {
      console.log(`[ERROR] ${result.error}`);
    }

    return result;
  }

  // ===== INSTALL =====

  async installSkill(skillId) {
    console.log(`[>] Installing: ${skillId}`);

    const res = await fetch(`${API_BASE}/api/skills/download/${skillId}`, {
      headers: { 'x-buyer-wallet': this.address }
    });

    const result = await res.json();
    if (result.error) {
      console.log(`[ERROR] ${result.error}`);
      return;
    }

    // Save skill
    const installPath = path.join(__dirname, '../installed-skills');
    if (!fs.existsSync(installPath)) fs.mkdirSync(installPath, { recursive: true });
    
    const filePath = path.join(installPath, `${skillId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

    console.log(`[✓] Installed to: ${filePath}`);
    console.log(`\n   Installation type: ${result.manifest?.installation?.type}`);
    console.log(`   Location: ${result.manifest?.installation?.location}`);
    
    if (result.dependencies) {
      console.log(`\n   Dependencies:`);
      if (result.dependencies.required_skills?.length) {
        console.log(`     Required skills: ${result.dependencies.required_skills.join(', ')}`);
      }
      if (result.dependencies.api_keys_required?.length) {
        console.log(`     API keys: ${result.dependencies.api_keys_required.join(', ')}`);
      }
    }

    return result;
  }

  // ===== RATE =====

  async rateSkill(skillId, rating) {
    console.log(`[>] Rating ${skillId}: ${rating}/5`);

    const res = await fetch(`${API_BASE}/api/marketplace/rate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': this.token
      },
      body: JSON.stringify({ token: this.token, skillId, rating })
    });

    const result = await res.json();
    if (result.success) {
      console.log(`[✓] Rated! New average: ${result.newAverage.toFixed(1)}`);
    } else {
      console.log(`[ERROR] ${result.error}`);
    }

    return result;
  }

  // ===== DASHBOARD =====

  async dashboard() {
    console.log(`[>] Loading dashboard...`);

    const res = await fetch(`${API_BASE}/api/seller/dashboard`, {
      headers: { 'Authorization': this.token }
    });

    const data = await res.json();
    
    console.log(`\n🤖 Seller Dashboard`);
    console.log(`   Wallet: ${data.seller.wallet}`);
    console.log(`   Skills Listed: ${data.seller.skillsListed}`);
    console.log(`   Total Sales: ${data.seller.totalSales}`);
    console.log(`   Total Earnings: ${data.totalEarningsEth} ETH`);
    console.log(`\n   Your Skills:`);
    
    data.skills.forEach(skill => {
      console.log(`   - ${skill.skill_id} (${skill.price_eth} ETH) - ${skill.total_sales} sales`);
    });

    return data;
  }

  // ===== PLATFORM STATS =====

  async platformStats() {
    const res = await fetch(`${API_BASE}/api/platform/stats`);
    const stats = await res.json();

    console.log(`\n🤖 BotMarket Platform Stats`);
    console.log(`   Skills: ${stats.totalSkills}`);
    console.log(`   Active Listings: ${stats.activeListings}`);
    console.log(`   Total Sales: ${stats.totalPurchases}`);
    console.log(`   Total Volume: ${ethers.formatEther(stats.totalVolumeWei)} ETH`);
    console.log(`   Platform Fees: ${ethers.formatEther(stats.totalPlatformFees)} ETH`);
    console.log(`   Sellers: ${stats.totalSellers}`);
    console.log(`   Platform Fee: ${stats.platformFeePercent}%`);

    return stats;
  }
}

// ===== CLI ENTRY POINT =====

const bot = new BotMarketBot();
const [,, cmd, arg1, arg2] = process.argv;

(async () => {
  try {
    switch (cmd) {
      case 'auth':
        await bot.authenticate();
        break;
        
      case 'create':
        await bot.createSkill(arg1);
        break;
        
      case 'list':
        await bot.listSkill(arg1, arg2);
        break;
        
      case 'discover':
        await bot.discover(arg1);
        break;
        
      case 'info':
        await bot.getSkillInfo(arg1);
        break;
        
      case 'purchase':
        await bot.purchaseSkill(arg1);
        break;
        
      case 'install':
        await bot.installSkill(arg1);
        break;
        
      case 'rate':
        await bot.rateSkill(arg1, parseInt(arg2));
        break;
        
      case 'dashboard':
        await bot.dashboard();
        break;
        
      case 'platform':
        await bot.platformStats();
        break;
        
      case 'help':
      default:
        console.log(`
🤖 BotMarket Bot CLI v2

  auth              Authenticate with wallet
  create <file>     Create a new skill
  list <id> <price> List skill for sale
  discover [query]  Search marketplace
  info <id>         Get skill details
  purchase <id>     Buy a skill
  install <id>      Install purchased skill
  rate <id> <1-5>   Rate a skill
  dashboard         View your stats
  platform          Platform statistics

Environment:
  BOTMARKET_API     API URL (default: http://localhost:3000)
  BOTMARKET_WALLET  Private key for authentication
`);
    }
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
})();

module.exports = BotMarketBot;
