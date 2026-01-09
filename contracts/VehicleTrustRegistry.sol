// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VehicleTrustRegistry
 * @dev Manages vehicle trust scores, revocation, and behavior monitoring
 * Based on DYNAMIC-TRUST framework for ITS security
 * 
 * Features:
 * - Trust score management per vehicle (ECC public key)
 * - Decentralized vehicle revocation
 * - Behavior monitoring and anomaly detection
 * - Sybil attack prevention
 * - Trust threshold enforcement
 */
contract VehicleTrustRegistry {
    struct Vehicle {
        string publicKeyHex; // ECC public key (66 hex chars)
        address ethereumAddress; // Ethereum address (if linked)
        uint256 trustScore;
        bool isRevoked;
        uint256 registrationTime;
        uint256 lastActivityTime;
        uint256 successfulTransactions;
        uint256 failedTransactions;
        uint256 suspiciousActivities;
    }

    mapping(string => Vehicle) public vehicles; // publicKeyHex => Vehicle
    mapping(address => string) public addressToPublicKey; // Ethereum address => publicKeyHex
    mapping(string => bool) public revokedVehicles; // publicKeyHex => isRevoked
    string[] public vehicleList;
    
    address public owner;
    uint256 public constant INITIAL_TRUST_SCORE = 100;
    uint256 public constant TRUST_SCORE_INCREMENT = 5; // Reward for good behavior
    uint256 public constant TRUST_SCORE_DECREMENT = 20; // Penalty for bad behavior
    uint256 public constant MIN_TRUST_SCORE_THRESHOLD = 50; // Minimum for authentication
    uint256 public constant REVOCATION_THRESHOLD = 0; // Trust score for revocation
    
    // Rate limiting for DoS protection
    mapping(string => uint256) public lastTransactionTime; // publicKeyHex => timestamp
    mapping(string => uint256) public transactionCount; // publicKeyHex => count in window
    uint256 public constant RATE_LIMIT_WINDOW = 60 seconds; // 1 minute window
    uint256 public constant MAX_TRANSACTIONS_PER_WINDOW = 10; // Max 10 tx per minute
    
    event VehicleRegistered(string indexed publicKeyHex, address indexed ethereumAddress);
    event VehicleRevoked(string indexed publicKeyHex, string reason);
    event TrustScoreUpdated(string indexed publicKeyHex, uint256 newScore, string reason);
    event SuspiciousActivity(string indexed publicKeyHex, string activityType);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyValidator() {
        // In production, check against ValidatorRegistry
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Register a new vehicle (owner only)
     * @param publicKeyHex ECC public key in hex format (66 chars)
     * @param ethereumAddress Optional Ethereum address linkage
     */
    function registerVehicle(string memory publicKeyHex, address ethereumAddress) 
        external 
        onlyOwner 
    {
        _registerVehicle(publicKeyHex, ethereumAddress);
    }

    /**
     * @dev Self-register a new vehicle (public function)
     * @param publicKeyHex ECC public key in hex format (66 chars)
     * Allows users to register themselves with their protocol public key
     */
    function selfRegisterVehicle(string memory publicKeyHex) 
        external 
    {
        // Users can only register with their own Ethereum address
        _registerVehicle(publicKeyHex, msg.sender);
    }

    /**
     * @dev Internal function to register a vehicle
     * @param publicKeyHex ECC public key in hex format (66 chars)
     * @param ethereumAddress Ethereum address linkage
     */
    function _registerVehicle(string memory publicKeyHex, address ethereumAddress) 
        internal 
    {
        require(bytes(publicKeyHex).length == 66, "Invalid public key length");
        require(vehicles[publicKeyHex].registrationTime == 0, "Vehicle already registered");
        require(!revokedVehicles[publicKeyHex], "Vehicle is revoked");
        
        // Check for Sybil attack: same Ethereum address with different public keys
        if (ethereumAddress != address(0)) {
            string memory existingKey = addressToPublicKey[ethereumAddress];
            require(
                bytes(existingKey).length == 0 || keccak256(bytes(existingKey)) == keccak256(bytes(publicKeyHex)),
                "Sybil attack detected: Same address with different public key"
            );
        }
        
        vehicles[publicKeyHex] = Vehicle({
            publicKeyHex: publicKeyHex,
            ethereumAddress: ethereumAddress,
            trustScore: INITIAL_TRUST_SCORE,
            isRevoked: false,
            registrationTime: block.timestamp,
            lastActivityTime: block.timestamp,
            successfulTransactions: 0,
            failedTransactions: 0,
            suspiciousActivities: 0
        });
        
        if (ethereumAddress != address(0)) {
            addressToPublicKey[ethereumAddress] = publicKeyHex;
        }
        
        vehicleList.push(publicKeyHex);
        
        emit VehicleRegistered(publicKeyHex, ethereumAddress);
    }

    /**
     * @dev Increase trust score for successful transaction
     */
    function rewardVehicle(string memory publicKeyHex) external onlyOwner {
        require(vehicles[publicKeyHex].registrationTime != 0, "Vehicle not registered");
        require(!vehicles[publicKeyHex].isRevoked, "Vehicle is revoked");
        
        vehicles[publicKeyHex].trustScore += TRUST_SCORE_INCREMENT;
        vehicles[publicKeyHex].successfulTransactions++;
        vehicles[publicKeyHex].lastActivityTime = block.timestamp;
        
        emit TrustScoreUpdated(publicKeyHex, vehicles[publicKeyHex].trustScore, "Successful transaction");
    }

    /**
     * @dev Decrease trust score for suspicious behavior
     * @param reason Reason for trust score decrease
     */
    function penalizeVehicle(string memory publicKeyHex, string memory reason) external onlyOwner {
        require(vehicles[publicKeyHex].registrationTime != 0, "Vehicle not registered");
        
        vehicles[publicKeyHex].suspiciousActivities++;
        vehicles[publicKeyHex].failedTransactions++;
        
        if (vehicles[publicKeyHex].trustScore >= TRUST_SCORE_DECREMENT) {
            vehicles[publicKeyHex].trustScore -= TRUST_SCORE_DECREMENT;
        } else {
            vehicles[publicKeyHex].trustScore = 0;
        }
        
        // Auto-revoke if trust score drops to revocation threshold
        if (vehicles[publicKeyHex].trustScore <= REVOCATION_THRESHOLD && !vehicles[publicKeyHex].isRevoked) {
            revokeVehicle(publicKeyHex, "Trust score below threshold");
        }
        
        emit TrustScoreUpdated(publicKeyHex, vehicles[publicKeyHex].trustScore, reason);
        emit SuspiciousActivity(publicKeyHex, reason);
    }

    /**
     * @dev Revoke a vehicle (decentralized revocation)
     * @param reason Reason for revocation
     */
    function revokeVehicle(string memory publicKeyHex, string memory reason) public onlyOwner {
        require(vehicles[publicKeyHex].registrationTime != 0, "Vehicle not registered");
        require(!vehicles[publicKeyHex].isRevoked, "Vehicle already revoked");
        
        vehicles[publicKeyHex].isRevoked = true;
        revokedVehicles[publicKeyHex] = true;
        vehicles[publicKeyHex].trustScore = 0;
        
        emit VehicleRevoked(publicKeyHex, reason);
    }

    /**
     * @dev Check if vehicle is trustworthy (above threshold)
     */
    function isTrustworthy(string memory publicKeyHex) external view returns (bool) {
        Vehicle memory v = vehicles[publicKeyHex];
        
        if (v.registrationTime == 0) return false; // Not registered
        if (v.isRevoked) return false; // Revoked
        if (v.trustScore < MIN_TRUST_SCORE_THRESHOLD) return false; // Below threshold
        
        return true;
    }

    /**
     * @dev Check rate limit for DoS protection
     */
    function checkRateLimit(string memory publicKeyHex) external view returns (bool) {
        uint256 lastTxTime = lastTransactionTime[publicKeyHex];
        uint256 txCount = transactionCount[publicKeyHex];
        
        // Reset count if window expired
        if (block.timestamp > lastTxTime + RATE_LIMIT_WINDOW) {
            return true; // Window expired, allow
        }
        
        // Check if under limit
        return txCount < MAX_TRANSACTIONS_PER_WINDOW;
    }

    /**
     * @dev Record transaction for rate limiting
     */
    function recordTransaction(string memory publicKeyHex) external onlyOwner {
        uint256 lastTxTime = lastTransactionTime[publicKeyHex];
        
        // Reset if window expired
        if (block.timestamp > lastTxTime + RATE_LIMIT_WINDOW) {
            transactionCount[publicKeyHex] = 1;
        } else {
            transactionCount[publicKeyHex]++;
        }
        
        lastTransactionTime[publicKeyHex] = block.timestamp;
    }

    /**
     * @dev Get vehicle information
     */
    function getVehicle(string memory publicKeyHex) 
        external 
        view 
        returns (
            string memory publicKey,
            address ethereumAddress,
            uint256 trustScore,
            bool revoked,
            uint256 registrationTime,
            uint256 successfulTransactions,
            uint256 failedTransactions,
            uint256 suspiciousActivities
        ) 
    {
        Vehicle memory v = vehicles[publicKeyHex];
        return (
            v.publicKeyHex,
            v.ethereumAddress,
            v.trustScore,
            v.isRevoked,
            v.registrationTime,
            v.successfulTransactions,
            v.failedTransactions,
            v.suspiciousActivities
        );
    }

    /**
     * @dev Get vehicle by Ethereum address
     */
    function getVehicleByAddress(address ethereumAddress) 
        external 
        view 
        returns (string memory) 
    {
        return addressToPublicKey[ethereumAddress];
    }

    /**
     * @dev Check if vehicle is revoked
     */
    function isRevoked(string memory publicKeyHex) external view returns (bool) {
        return revokedVehicles[publicKeyHex] || vehicles[publicKeyHex].isRevoked;
    }
}

