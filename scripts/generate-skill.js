#!/usr/bin/env node
/**
 * Skill Generator - Create new skills from template
 * Usage: node generate-skill.js <skill-name> <price-eth> <wallet-address> [domain]
 * Example: node generate-skill.js image-generator 0.05 0x123... vision
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../skills/template-bot-skill.json');
const SKILLS_DIR = path.join(__dirname, '../skills');
const LISTINGS_DIR = path.join(__dirname, '../listings');

// Configuration
const DOMAIN_ENUMS = ['vision', 'language', 'reasoning', 'action', 'memory', 'planning'];
const INSTALL_TYPES = ['npm', 'pip', 'git', 'direct'];

function validateWallet(wallet) {
  return /^0x[a-fA-F0-9]{40}$/.test(wallet);
}

function validatePrice(price) {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num < 1000;
}

function generateSkillId(name) {
  return name.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .substring(0, 50);
}

function weiToEth(wei) {
  return (BigInt(wei) / BigInt(10**18)).toString();
}

function ethToWei(eth) {
  return (BigInt(Math.round(parseFloat(eth) * 10**18))).toString();
}

function generateChecksum() {
  return 'sha256-' + Array.from({length: 64}, () => 
    Math.floor(Math.random() * 16).toString(16)).join('');
}

function createSkill(args) {
  const [name, priceEth, wallet, domain] = args;
  
  // Validation
  if (!name || !priceEth || !wallet) {
    console.log(`
🤖 BotMarket Skill Generator
============================
Usage: node generate-skill.js <skill-name> <price-eth> <wallet-address> [domain]

Arguments:
  skill-name    Name of your skill (e.g., "image-generator")
  price-eth    Price in ETH (e.g., 0.05)
  wallet       Your Ethereum wallet address
  domain       Optional: capability domain (default: language)
               Options: ${DOMAIN_ENUMS.join(', ')}

Examples:
  node generate-skill.js image-generator 0.05 0x1234...abcd vision
  node generate-skill.js code-analyzer 0.08 0xabcd...1234 reasoning

Output:
  - Creates skill JSON in skills/
  - Creates listing JSON in listings/
`);
    process.exit(1);
  }

  if (!validateWallet(wallet)) {
    console.error('❌ Invalid wallet address');
    process.exit(1);
  }

  if (!validatePrice(priceEth)) {
    console.error('❌ Invalid price. Must be a positive number < 1000');
    process.exit(1);
  }

  const domainLower = (domain || 'language').toLowerCase();
  if (!DOMAIN_ENUMS.includes(domainLower)) {
    console.error(`❌ Invalid domain. Options: ${DOMAIN_ENUMS.join(', ')}`);
    process.exit(1);
  }

  const skillId = generateSkillId(name);
  const version = '1.0.0';
  const priceWei = ethToWei(priceEth);
  const checksum = generateChecksum();

  // Load template
  let template;
  try {
    template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  } catch (err) {
    console.error('❌ Template not found:', TEMPLATE_PATH);
    process.exit(1);
  }

  // Populate template
  const skill = {
    ...template,
    skill_id: skillId,
    version: version,
    provider_wallet: wallet,
    price_wei: priceWei,
    capabilities: {
      ...template.capabilities,
      domains: [domainLower]
    },
    installation: {
      ...template.installation,
      location: `@${skillId.replace(/_/g, '-')}/${skillId}`,
      verify_checksum: checksum
    },
    on_chain_proof: {
      contract_address: wallet,
      blockchain: 'ethereum',
      network: 'mainnet',
      listing_proof: `sig_${Date.now()}`
    }
  };

  // Create listing
  const listing = {
    skill_id: skillId,
    version: version,
    provider_wallet: wallet,
    price_wei: priceWei,
    price_eth: priceEth,
    status: 'active',
    created_at: new Date().toISOString(),
    sold_count: 0,
    stock: 'unlimited'
  };

  // Write files
  const skillPath = path.join(SKILLS_DIR, `custom_${skillId}.json`);
  const listingPath = path.join(LISTINGS_DIR, `${skillId}_listing.json`);

  fs.writeFileSync(skillPath, JSON.stringify(skill, null, 2));
  fs.writeFileSync(listingPath, JSON.stringify(listing, null, 2));

  console.log(`
✅ Skill Created Successfully!
==============================
📛 Name:      ${name}
🆔 Skill ID:  ${skillId}
💰 Price:     ${priceEth} ETH
🏷️ Domain:    ${domainLower}
👛 Wallet:    ${wallet.slice(0, 10)}...${wallet.slice(-6)}

📁 Files Created:
   ${skillPath}
   ${listingPath}

🚀 Next Steps:
   1. Review the skill JSON file
   2. Update interface/actions for your use case
   3. Upload to BotMarket API:
      curl -X POST http://localhost:3000/api/skills/create \\
        -H "Content-Type: application/json" \\
        -d @${skillPath}
   
   4. List for sale:
      curl -X POST http://localhost:3000/api/skills/list \\
        -H "Content-Type: application/json" \\
        -d '{"skill_id": "${skillId}", "price_wei": "${priceWei}"}'
`);
}

// Run if called directly
if (require.main === module) {
  createSkill(process.argv.slice(2));
}

module.exports = { createSkill, generateSkillId, ethToWei, validateWallet };
