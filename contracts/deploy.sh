#!/bin/bash
# BotMarket Deployment Script
# Deploys smart contract to blockchain

echo "🚀 BotMarket Deployment"
echo "======================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from example...${NC}"
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}📝 Please edit .env with your PRIVATE_KEY and RPC URL${NC}"
    echo "   Then run this script again."
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo "📋 Configuration:"
echo "   Platform Wallet: $PLATFORM_WALLET"
echo "   Private Key: ${PRIVATE_KEY:0:10}...${PRIVATE_KEY: -6}"
echo ""

# Deploy to Sepolia (Testnet)
echo "🔧 Deploying to Sepolia Testnet..."
npx hardhat run scripts/deploy.js --network sepolia

echo ""
echo "✅ Deployed! Next steps:"
echo "   1. Copy CONTRACT_ADDRESS from output"
echo "   2. Update API .env: CONTRACT_ADDRESS=0x..."
echo "   3. Test on Sepolia"
echo "   4. Deploy to mainnet: npx hardhat run scripts/deploy.js --network mainnet"
