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
    
    // Trust Score Configuration (as per requirements)
    uint256 public constant INITIAL_TRUST_SCORE = 100;
    uint256 public constant TRUST_SCORE_INCREMENT = 1; // +1 for valid transaction
    uint256 public constant TRUST_SCORE_DECREMENT = 10; // -10 for tampered/replayed/too quick
    uint256 public constant MIN_TRUST_SCORE_THRESHOLD = 50; // Minimum score to transact
    uint256 public constant REVOCATION_THRESHOLD = 0; // Trust score for revocation
    
    // DoS Protection: 10-second cooldown per vehicle
    mapping(string => uint256) public lastTransactionTime; // publicKeyHex => lastTxTimestamp
    uint256 public constant TX_COOLDOWN_PERIOD = 10 seconds; // 10-second cooldown between transactions
    
    // Additional rate limiting for spam protection
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
    
    // Address of SecureLedger contract (can call reward/penalize functions)
    address public secureLedgerAddress;
    
    modifier onlySecureLedger() {
        require(msg.sender == secureLedgerAddress, "Only SecureLedger can call this");
        _;
    }

    modifier onlyValidator() {
        // In production, check against ValidatorRegistry
        _;
    }

    /**
     * @dev Set SecureLedger address (can only be set once by owner)
     * This allows SecureLedger to call rewardVehicle and penalizeVehicle
     */
    function setSecureLedgerAddress(address _secureLedgerAddress) external onlyOwner {
        require(secureLedgerAddress == address(0), "SecureLedger address already set");
        require(_secureLedgerAddress != address(0), "Invalid address");
        secureLedgerAddress = _secureLedgerAddress;
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
     * @dev Increase trust score for successful/valid transaction
     * Rule: If transaction is valid ➝ trustScore += 1
     * Called by SecureLedger after successful transaction validation
     */
    function rewardVehicle(string memory publicKeyHex) external onlySecureLedger {
        require(vehicles[publicKeyHex].registrationTime != 0, "Vehicle not registered");
        require(!vehicles[publicKeyHex].isRevoked, "Vehicle is revoked");
        
        vehicles[publicKeyHex].trustScore += TRUST_SCORE_INCREMENT;
        vehicles[publicKeyHex].successfulTransactions++;
        vehicles[publicKeyHex].lastActivityTime = block.timestamp;
        
        // Update last transaction time for cooldown
        lastTransactionTime[publicKeyHex] = block.timestamp;
        
        emit TrustScoreUpdated(publicKeyHex, vehicles[publicKeyHex].trustScore, "Valid transaction");
    }

    /**
     * @dev Decrease trust score for suspicious behavior
     * Rule: If transaction is tampered, replayed, or submitted too quickly ➝ trustScore -= 10
     * Called by SecureLedger when detecting malicious behavior
     * @param reason Reason for trust score decrease (e.g., "Replay attack", "Tampered data", "Rate limit exceeded")
     */
    function penalizeVehicle(string memory publicKeyHex, string memory reason) external onlySecureLedger {
        require(vehicles[publicKeyHex].registrationTime != 0, "Vehicle not registered");
        
        vehicles[publicKeyHex].suspiciousActivities++;
        vehicles[publicKeyHex].failedTransactions++;
        
        // Apply penalty: -10 trust score
        if (vehicles[publicKeyHex].trustScore >= TRUST_SCORE_DECREMENT) {
            vehicles[publicKeyHex].trustScore -= TRUST_SCORE_DECREMENT;
        } else {
            vehicles[publicKeyHex].trustScore = 0;
        }
        
        // Auto-revoke if trust score drops below minimum threshold
        if (vehicles[publicKeyHex].trustScore < MIN_TRUST_SCORE_THRESHOLD && !vehicles[publicKeyHex].isRevoked) {
            revokeVehicle(publicKeyHex, "Trust score below minimum threshold");
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
     * @dev Check if vehicle is registered
     * @param publicKeyHex ECC public key of the vehicle
     * @return bool True if vehicle is registered
     */
    function isVehicleRegistered(string memory publicKeyHex) external view returns (bool) {
        return vehicles[publicKeyHex].registrationTime != 0;
    }

    /**
     * @dev Check if vehicle is trustworthy (above threshold)
     * Requirements: Registered, not revoked, trust score >= 50
     * @param publicKeyHex ECC public key of the vehicle
     * @return bool True if vehicle meets all requirements
     */
    function isTrustworthy(string memory publicKeyHex) external view returns (bool) {
        Vehicle memory v = vehicles[publicKeyHex];
        
        if (v.registrationTime == 0) return false; // Not registered
        if (v.isRevoked) return false; // Revoked
        if (v.trustScore < MIN_TRUST_SCORE_THRESHOLD) return false; // Below minimum threshold (50)
        
        return true;
    }

    /**
     * @dev Get trust score of a vehicle
     * @param publicKeyHex ECC public key of the vehicle
     * @return uint256 Trust score (0 if not registered)
     */
    function getTrustScore(string memory publicKeyHex) external view returns (uint256) {
        return vehicles[publicKeyHex].trustScore;
    }

    /**
     * @dev Check if vehicle can submit transaction (DoS protection)
     * Enforces 10-second cooldown between transactions per vehicle
     * @param publicKeyHex ECC public key of the vehicle
     * @return bool True if vehicle can submit transaction (cooldown passed)
     */
    function canSubmitTransaction(string memory publicKeyHex) external view returns (bool) {
        uint256 lastTxTime = lastTransactionTime[publicKeyHex];
        
        // First transaction or cooldown period has passed
        if (lastTxTime == 0 || block.timestamp >= lastTxTime + TX_COOLDOWN_PERIOD) {
            return true;
        }
        
        return false;
    }

    /**
     * @dev Check rate limit for additional spam protection (10 tx per minute)
     * @param publicKeyHex ECC public key of the vehicle
     * @return bool True if under rate limit
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
     * @dev Record transaction for rate limiting (called by SecureLedger)
     * Updates both cooldown timestamp and rate limit counter
     */
    function recordTransaction(string memory publicKeyHex) external onlySecureLedger {
        uint256 lastTxTime = lastTransactionTime[publicKeyHex];
        
        // Update rate limit counter (reset if window expired)
        if (block.timestamp > lastTxTime + RATE_LIMIT_WINDOW) {
            transactionCount[publicKeyHex] = 1;
        } else {
            transactionCount[publicKeyHex]++;
        }
        
        // Update last transaction time (for 10-second cooldown)
        lastTransactionTime[publicKeyHex] = block.timestamp;
        vehicles[publicKeyHex].lastActivityTime = block.timestamp;
    }

    /**
     * @dev Get remaining cooldown time for a vehicle
     * @param publicKeyHex ECC public key of the vehicle
     * @return uint256 Remaining cooldown time in seconds (0 if cooldown passed)
     */
    function getRemainingCooldown(string memory publicKeyHex) external view returns (uint256) {
        uint256 lastTxTime = lastTransactionTime[publicKeyHex];
        
        if (lastTxTime == 0) {
            return 0; // No previous transaction
        }
        
        uint256 elapsed = block.timestamp - lastTxTime;
        if (elapsed >= TX_COOLDOWN_PERIOD) {
            return 0; // Cooldown passed
        }
        
        return TX_COOLDOWN_PERIOD - elapsed;
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