require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: '.env' });

module.exports = {
  solidity: '0.8.19',
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
      accounts: [process.env.PRIVATE_KEY || '0x...']
    },
    polygon: {
      url: process.env.POLYGON_RPC || 'https://rpc.polygon.technology',
      accounts: [process.env.PRIVATE_KEY || '0x...']
    },
    mainnet: {
      url: process.env.MAINNET_RPC || 'https://eth-mainnet.alchemyapi.io/v2/...',
      accounts: [process.env.PRIVATE_KEY || '0x...']
    }
  }
};
