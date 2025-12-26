// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ValidatorRegistry
 * @dev Manages validator registration and trust scores for PoA + PoT consensus
 */
contract ValidatorRegistry {
    struct Validator {
        address validatorAddress;
        string publicKeyHex; // ECC public key in hex format
        uint256 trustScore;
        bool isActive;
        uint256 registrationTime;
    }

    mapping(address => Validator) public validators;
    mapping(string => address) public publicKeyToAddress; // Map public key to address
    address[] public validatorList;
    
    address public owner;
    uint256 public constant INITIAL_TRUST_SCORE = 100;
    uint256 public constant TRUST_SCORE_INCREMENT = 10;
    uint256 public constant TRUST_SCORE_DECREMENT = 20;
    uint256 public constant MIN_TRUST_SCORE = 0;
    
    event ValidatorRegistered(address indexed validator, string publicKeyHex);
    event ValidatorRemoved(address indexed validator);
    event TrustScoreUpdated(address indexed validator, uint256 newScore, string reason);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyValidator() {
        require(validators[msg.sender].isActive, "Not an active validator");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Register a new validator
     * @param validatorAddress Address of the validator
     * @param publicKeyHex ECC public key in hex format
     */
    function registerValidator(address validatorAddress, string memory publicKeyHex) 
        external 
        onlyOwner 
    {
        require(!validators[validatorAddress].isActive, "Validator already registered");
        require(bytes(publicKeyHex).length > 0, "Public key cannot be empty");
        require(publicKeyToAddress[publicKeyHex] == address(0), "Public key already in use");
        
        validators[validatorAddress] = Validator({
            validatorAddress: validatorAddress,
            publicKeyHex: publicKeyHex,
            trustScore: INITIAL_TRUST_SCORE,
            isActive: true,
            registrationTime: block.timestamp
        });
        
        publicKeyToAddress[publicKeyHex] = validatorAddress;
        validatorList.push(validatorAddress);
        
        emit ValidatorRegistered(validatorAddress, publicKeyHex);
    }

    /**
     * @dev Remove a validator
     * @param validatorAddress Address of the validator to remove
     */
    function removeValidator(address validatorAddress) external onlyOwner {
        require(validators[validatorAddress].isActive, "Validator not found");
        
        validators[validatorAddress].isActive = false;
        publicKeyToAddress[validators[validatorAddress].publicKeyHex] = address(0);
        
        emit ValidatorRemoved(validatorAddress);
    }

    /**
     * @dev Increase validator trust score (for valid blocks)
     */
    function increaseTrustScore(address validatorAddress) external onlyOwner {
        require(validators[validatorAddress].isActive, "Validator not active");
        
        validators[validatorAddress].trustScore += TRUST_SCORE_INCREMENT;
        
        emit TrustScoreUpdated(validatorAddress, validators[validatorAddress].trustScore, "Valid block");
    }

    /**
     * @dev Decrease validator trust score (for invalid behavior)
     * @param reason Reason for trust score decrease
     */
    function decreaseTrustScore(address validatorAddress, string memory reason) external onlyOwner {
        require(validators[validatorAddress].isActive, "Validator not active");
        
        if (validators[validatorAddress].trustScore >= TRUST_SCORE_DECREMENT) {
            validators[validatorAddress].trustScore -= TRUST_SCORE_DECREMENT;
        } else {
            validators[validatorAddress].trustScore = MIN_TRUST_SCORE;
        }
        
        emit TrustScoreUpdated(validatorAddress, validators[validatorAddress].trustScore, reason);
    }

    /**
     * @dev Get validator by address
     */
    function getValidator(address validatorAddress) 
        external 
        view 
        returns (
            address validatorAddr,
            string memory publicKey,
            uint256 trustScore,
            bool isActive,
            uint256 registrationTime
        ) 
    {
        Validator memory v = validators[validatorAddress];
        return (v.validatorAddress, v.publicKeyHex, v.trustScore, v.isActive, v.registrationTime);
    }

    /**
     * @dev Get validator by public key
     */
    function getValidatorByPublicKey(string memory publicKeyHex) 
        external 
        view 
        returns (address) 
    {
        return publicKeyToAddress[publicKeyHex];
    }

    /**
     * @dev Get all active validators
     */
    function getActiveValidators() external view returns (address[] memory) {
        address[] memory active = new address[](validatorList.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                active[count] = validatorList[i];
                count++;
            }
        }
        
        // Resize array
        assembly {
            mstore(active, count)
        }
        
        return active;
    }

    /**
     * @dev Get validator with highest trust score
     */
    function getHighestTrustScoreValidator() external view returns (address) {
        require(validatorList.length > 0, "No validators registered");
        
        address highestValidator = address(0);
        uint256 highestScore = 0;
        
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                uint256 score = validators[validatorList[i]].trustScore;
                if (score > highestScore) {
                    highestScore = score;
                    highestValidator = validatorList[i];
                }
            }
        }
        
        return highestValidator;
    }

    /**
     * @dev Check if address is a validator
     */
    function isValidator(address validatorAddress) external view returns (bool) {
        return validators[validatorAddress].isActive;
    }
}

