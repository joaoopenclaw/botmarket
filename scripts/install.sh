#!/bin/bash
# BotMarket Installation Script
# For agents to bootstrap the marketplace client

set -e

echo "[BotMarket] Installing BotMarket CLI..."

# Check for node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js required"
    exit 1
fi

# Create global install
NPM_PREFIX="${NPM_PREFIX:-$HOME/.botmarket}"
mkdir -p "$NPM_PREFIX/bin"

# Install CLI
cat > "$NPM_PREFIX/bin/botmarket" << 'EOF'
#!/usr/bin/env node
const { BotMarketCLI } = require('/Users/joao/.openclaw/workspace/botmarket/api/cli.js');
const cli = new BotMarketCLI();

const args = process.argv.slice(2);
const [cmd, arg] = args;

(async () => {
  try {
    switch (cmd) {
      case 'discover':
        console.log(JSON.stringify(await cli.discover(arg), null, 2));
        break;
      case 'info':
        console.log(JSON.stringify(await cli.getSkill(arg), null, 2));
        break;
      case 'purchase':
        await cli.purchaseSkill(arg);
        console.log('Purchased:', arg);
        break;
      case 'install':
        await cli.installSkill(arg);
        console.log('Installed:', arg);
        break;
      case 'list':
        console.log(JSON.stringify(await cli.discover(''), null, 2));
        break;
      default:
        console.log('BotMarket CLI v1.0');
        console.log('Commands: discover, info, purchase, install, list');
    }
  } catch (e) {
    console.error('[ERROR]', e.message);
    process.exit(1);
  }
})();
EOF

chmod +x "$NPM_PREFIX/bin/botmarket"

# Set environment variables
cat >> "$HOME/.bashrc" << 'EOF'

# BotMarket Configuration
export BOTMARKET_API="${BOTMARKET_API:-https://api.botmarket.ai/v1}"
export BOTMARKET_WALLET="${BOTMARKET_WALLET:-your_private_key_here}"
EOF

echo "[BotMarket] Installed to $NPM_PREFIX/bin/botmarket"
echo "[BotMarket] Add to PATH: export PATH=\"$NPM_PREFIX/bin:\$PATH\""
echo ""
echo "Quick start:"
echo "  botmarket discover vision    # Find vision skills"
echo "  botmarket list              # List all skills"
