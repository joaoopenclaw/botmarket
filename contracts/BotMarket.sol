// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BotMarket {
    // Platform fee: 5% of every sale goes to owner
    uint256 public constant PLATFORM_FEE_PERCENT = 5;
    address public immutable platformWallet;

    struct Skill {
        string id;
        string name;
        string version;
        string manifestCID; // IPFS Content ID for bot-readable manifest
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

    function listSkill(
        string memory _id,
        string memory _name,
        string memory _version,
        string memory _manifestCID,
        uint256 _priceWei
    ) public {
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

        // Calculate platform fee (5%) and seller amount (95%)
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        uint256 sellerAmount = msg.value - platformFee;

        // Transfer to seller and platform owner
        skill.seller.transfer(sellerAmount);
        payable(platformWallet).transfer(platformFee);
        sellerEarnings[skill.seller] += sellerAmount;
        
        skill.totalSales++;

        emit SkillPurchased(_skillId, msg.sender, msg.value, platformFee);
    }

    function rateSkill(string memory _skillId, uint8 _rating) public {
        require(_rating >= 1 && _rating <= 5, "Rating 1-5");
        Skill storage skill = skills[_skillId];
        require(skill.active, "Skill not active");
        
        skill.ratingSum += _rating;
        skill.ratingCount++;
        
        emit SkillRated(_skillId, _rating);
    }

    function getSkill(string memory _skillId) public view returns (
        string memory id,
        string memory name,
        string memory version,
        string memory manifestCID,
        address seller,
        uint256 priceWei,
        uint256 sales,
        uint256 avgRating
    ) {
        Skill storage s = skills[_skillId];
        return (
            s.id,
            s.name,
            s.version,
            s.manifestCID,
            s.seller,
            s.priceWei,
            s.totalSales,
            s.ratingCount > 0 ? s.ratingSum / s.ratingCount : 0
        );
    }

    function getAllSkills() public view returns (string[] memory) {
        // Simplified - in production, maintain a dynamic array
        return new string[](0);
    }
}
