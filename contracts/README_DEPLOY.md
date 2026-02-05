# BotMarket Smart Contract Deployment

## Quick Deploy (No CLI Needed)

### Option 1: Remix IDE (Easiest)

1. Go to: https://remix.ethereum.org

2. Create new file `BotMarket.sol` and paste the contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BotMarket {
    uint256 public constant PLATFORM_FEE_PERCENT = 5;
    address public immutable platformWallet;

    struct Skill {
        string id;
        string name;
        string version;
        string manifestCID;
        address payable seller;
        uint256 priceWei;
        uint256 totalSales;
        bool active;
        uint256 ratingSum;
        uint256 ratingCount;
    }

    mapping(string => Skill) public skills;
    mapping(address => uint256) public sellerEarnings;
    
    event SkillListed(string indexed skillId, address indexed seller, uint256 priceWei);
    event SkillPurchased(string indexed skillId, address indexed buyer, uint256 priceWei, uint256 platformFee);
    event SkillRated(string indexed skillId, uint8 rating);

    constructor(address _platformWallet) {
        platformWallet = _platformWallet;
    }

    function listSkill(string memory _id, string memory _name, string memory _version, string memory _manifestCID, uint256 _priceWei) public {
        require(bytes(_id).length > 0, "Invalid skill ID");
        require(bytes(_manifestCID).length > 0, "Manifest required");
        
        skills[_id] = Skill({
            id: _id,
            name: _name,
            version: _version,
            manifestCID: _manifestCID,
            seller: payable(msg.sender),
            priceWei: _priceWei,
            totalSales: 0,
            active: true,
            ratingSum: 0,
            ratingCount: 0
        });
        
        emit SkillListed(_id, msg.sender, _priceWei);
    }

    function purchaseSkill(string memory _skillId) public payable {
        Skill storage skill = skills[_skillId];
        require(skill.active, "Skill not active");
        require(msg.value >= skill.priceWei, "Insufficient payment");
        
        uint256 fee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        uint256 sellerShare = msg.value - fee;
        
        skill.seller.transfer(sellerShare);
        payable(platformWallet).transfer(fee);
        skill.totalSales++;
        
        emit SkillPurchased(_skillId, msg.sender, msg.value, fee);
    }

    function rateSkill(string memory _skillId, uint8 _rating) public {
        require(_rating >= 1 && _rating <= 5, "Rating 1-5");
        Skill storage skill = skills[_skillId];
        skill.ratingSum += _rating;
        skill.ratingCount++;
        emit SkillRated(_skillId, _rating);
    }

    function withdraw() public {
        uint256 balance = sellerEarnings[msg.sender];
        require(balance > 0, "No earnings");
        sellerEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }
}
```

3. **Compile**: Select Solidity 0.8.19 and click "Compile"

4. **Deploy**: 
   - Select "Injected Provider - MetaMask"
   - Connect your wallet (0x5092a262512B7E0254c3998167d975858260E475)
   - Enter constructor parameter: `0x5092a262512B7E0254c3998167d975858260E475`
   - Click "Deploy"
   - Confirm MetaMask transaction

5. **Save Contract Address** - You'll see it after deployment

### Option 2: Using Foundry (if installed)

```bash
forge create BotMarket.sol:BotMarket \
  --constructor-args 0x5092a262512B7E0254c3998167d975858260E475 \
  --rpc-url YOUR_RPC_URL \
  --private-key YOUR_PRIVATE_KEY
```

## After Deployment

1. Copy the deployed contract address
2. Update API configuration:
   - Edit `api/.env`
   - Set `CONTRACT_ADDRESS=0xDEPLOYED_ADDRESS`
3. Update website to show new contract URL

## Verify on Etherscan

1. Go to: https://etherscan.io/verifyContract
2. Enter your contract address
3. Paste the BotMarket.sol source code
4. Submit

## Contract Info

- **Platform Wallet**: 0x5092a262512B7E0254c3998167d975858260E475
- **Platform Fee**: 5%
- **Network**: Ethereum Mainnet

