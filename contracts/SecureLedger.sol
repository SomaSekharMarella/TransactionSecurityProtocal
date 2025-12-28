// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ValidatorRegistry.sol";

/**
 * @title SecureLedger
 * @dev Secure blockchain transaction protocol with ECC-based cryptography
 * 
 * Transaction Structure:
 * - txId: Unique transaction identifier
 * - senderPublicKey: ECC public key of sender
 * - receiverPublicKey: ECC public key of receiver
 * - encryptedPayload: ECIES-encrypted transaction data
 * - signature: ECDSA signature of transaction
 * - nonce: Anti-replay protection
 * - timestamp: Transaction timestamp
 */
contract SecureLedger {
    ValidatorRegistry public validatorRegistry;
    
    struct Transaction {
        bytes32 txId;
        string senderPublicKey;
        string receiverPublicKey;
        string encryptedPayload; // JSON string with {encrypted, iv, tag}
        string signature;
        uint256 nonce;
        uint256 timestamp;
        bool isValidated;
    }
    
    struct Block {
        uint256 blockNumber;
        bytes32 blockHash;
        bytes32 previousHash;
        Transaction[] transactions;
        address proposer;
        string proposerSignature;
        uint256 timestamp;
    }
    
    mapping(bytes32 => Transaction) public transactions;
    mapping(string => uint256) public nonceRegistry; // senderPublicKey => lastNonce (ECC-based)
    mapping(address => uint256) public addressNonceRegistry; // senderAddress => lastNonce (Ethereum address-based)
    mapping(uint256 => Block) public blocks;
    mapping(bytes32 => bool) public processedTxIds; // Prevent duplicate processing
    
    uint256 public blockNumber;
    uint256 public constant BLOCK_TIME = 10 seconds;
    uint256 public constant MAX_TRANSACTIONS_PER_BLOCK = 100;
    uint256 public constant TIMESTAMP_TOLERANCE = 300 seconds; // 5 minutes
    
    address public currentProposer;
    uint256 public lastBlockTime;
    
    event TransactionSubmitted(
        bytes32 indexed txId,
        string senderPublicKey,
        string receiverPublicKey,
        uint256 nonce,
        uint256 timestamp
    );
    
    event TransactionValidated(
        bytes32 indexed txId,
        bool isValid,
        string reason
    );
    
    event BlockProposed(
        uint256 indexed blockNumber,
        address indexed proposer,
        uint256 transactionCount
    );
    
    event BlockFinalized(
        uint256 indexed blockNumber,
        bytes32 blockHash,
        address indexed proposer
    );
    
    modifier onlyValidator() {
        require(
            validatorRegistry.isValidator(msg.sender),
            "Only validators can perform this action"
        );
        _;
    }

    constructor(address _validatorRegistryAddress) {
        validatorRegistry = ValidatorRegistry(_validatorRegistryAddress);
        blockNumber = 0;
        lastBlockTime = block.timestamp;
    }

    /**
     * @dev Submit a transaction to the ledger
     * Note: Signature verification happens off-chain by validators
     * This function only stores the transaction for validation
     */
    function submitTransaction(
        bytes32 _txId,
        string memory _senderPublicKey,
        string memory _receiverPublicKey,
        string memory _encryptedPayload,
        string memory _signature,
        uint256 _nonce,
        uint256 _timestamp
    ) external {
        require(!processedTxIds[_txId], "Transaction already processed");
        
        // Check nonce for both ECC public key AND Ethereum address (dual protection)
        require(_nonce > nonceRegistry[_senderPublicKey], "Invalid nonce - ECC public key nonce must be greater");
        require(_nonce > addressNonceRegistry[msg.sender], "Invalid nonce - Ethereum address nonce must be greater");
        
        require(
            _timestamp >= block.timestamp - TIMESTAMP_TOLERANCE &&
            _timestamp <= block.timestamp + TIMESTAMP_TOLERANCE,
            "Timestamp out of tolerance"
        );
        
        transactions[_txId] = Transaction({
            txId: _txId,
            senderPublicKey: _senderPublicKey,
            receiverPublicKey: _receiverPublicKey,
            encryptedPayload: _encryptedPayload,
            signature: _signature,
            nonce: _nonce,
            timestamp: _timestamp,
            isValidated: false
        });
        
        processedTxIds[_txId] = true;
        
        emit TransactionSubmitted(
            _txId,
            _senderPublicKey,
            _receiverPublicKey,
            _nonce,
            _timestamp
        );
    }

    /**
     * @dev Mark transaction as validated (called by validators after off-chain verification)
     */
    function validateTransaction(bytes32 _txId, bool _isValid, string memory _reason) 
        external 
        onlyValidator 
    {
        require(transactions[_txId].txId != bytes32(0), "Transaction not found");
        
        transactions[_txId].isValidated = _isValid;
        
        if (!_isValid) {
            // Decrease trust score of validator who submitted invalid transaction
            address senderAddress = validatorRegistry.getValidatorByPublicKey(
                transactions[_txId].senderPublicKey
            );
            if (senderAddress != address(0)) {
                validatorRegistry.decreaseTrustScore(senderAddress, _reason);
            }
        }
        
        emit TransactionValidated(_txId, _isValid, _reason);
    }

    /**
     * @dev Update nonce after successful transaction validation
     * Updates both ECC public key nonce and Ethereum address nonce
     */
    function updateNonce(string memory _senderPublicKey, address _senderAddress, uint256 _nonce) 
        external 
        onlyValidator 
    {
        require(_nonce > nonceRegistry[_senderPublicKey], "Nonce must be greater for ECC key");
        require(_nonce > addressNonceRegistry[_senderAddress], "Nonce must be greater for address");
        nonceRegistry[_senderPublicKey] = _nonce;
        addressNonceRegistry[_senderAddress] = _nonce;
    }
    
    /**
     * @dev Get last nonce for Ethereum address
     */
    function getLastAddressNonce(address _senderAddress) external view returns (uint256) {
        return addressNonceRegistry[_senderAddress];
    }

    /**
     * @dev Propose a new block (only validators)
     */
    function proposeBlock(
        bytes32[] memory _txIds,
        bytes32 _previousHash,
        string memory _proposerSignature
    ) external onlyValidator {
        require(
            block.timestamp >= lastBlockTime + BLOCK_TIME,
            "Block time not elapsed"
        );
        require(
            _txIds.length <= MAX_TRANSACTIONS_PER_BLOCK,
            "Too many transactions"
        );
        
        // Select proposer based on trust score (simplified - in production, use proper selection)
        address highestTrust = validatorRegistry.getHighestTrustScoreValidator();
        if (highestTrust != address(0)) {
            currentProposer = highestTrust;
        } else {
            // Round-robin fallback
            currentProposer = msg.sender;
        }
        
        require(msg.sender == currentProposer, "Not your turn to propose");
        
        blockNumber++;
        
        Block storage newBlock = blocks[blockNumber];
        newBlock.blockNumber = blockNumber;
        newBlock.previousHash = _previousHash;
        newBlock.proposer = msg.sender;
        newBlock.proposerSignature = _proposerSignature;
        newBlock.timestamp = block.timestamp;
        
        // Add validated transactions
        for (uint256 i = 0; i < _txIds.length; i++) {
            require(
                transactions[_txIds[i]].isValidated,
                "Transaction not validated"
            );
            newBlock.transactions.push(transactions[_txIds[i]]);
        }
        
        // Calculate block hash
        newBlock.blockHash = calculateBlockHash(newBlock);
        
        lastBlockTime = block.timestamp;
        
        // Increase proposer trust score
        validatorRegistry.increaseTrustScore(msg.sender);
        
        emit BlockProposed(blockNumber, msg.sender, _txIds.length);
        emit BlockFinalized(blockNumber, newBlock.blockHash, msg.sender);
    }

    /**
     * @dev Calculate block hash
     */
    function calculateBlockHash(Block memory _block) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                _block.blockNumber,
                _block.previousHash,
                _block.proposer,
                _block.timestamp
            )
        );
    }

    /**
     * @dev Get transaction by ID
     */
    function getTransaction(bytes32 _txId) 
        external 
        view 
        returns (
            bytes32 txId,
            string memory senderPublicKey,
            string memory receiverPublicKey,
            string memory encryptedPayload,
            string memory signature,
            uint256 nonce,
            uint256 timestamp,
            bool isValidated
        ) 
    {
        Transaction memory transaction = transactions[_txId];
        return (
            transaction.txId,
            transaction.senderPublicKey,
            transaction.receiverPublicKey,
            transaction.encryptedPayload,
            transaction.signature,
            transaction.nonce,
            transaction.timestamp,
            transaction.isValidated
        );
    }

    /**
     * @dev Get block by number
     */
    function getBlock(uint256 _blockNumber) 
        external 
        view 
        returns (
            uint256 blockNum,
            bytes32 blockHash,
            bytes32 previousHash,
            address proposer,
            uint256 timestamp,
            uint256 transactionCount
        ) 
    {
        Block memory b = blocks[_blockNumber];
        return (
            b.blockNumber,
            b.blockHash,
            b.previousHash,
            b.proposer,
            b.timestamp,
            b.transactions.length
        );
    }

    /**
     * @dev Get last nonce for a sender
     */
    function getLastNonce(string memory _senderPublicKey) 
        external 
        view 
        returns (uint256) 
    {
        return nonceRegistry[_senderPublicKey];
    }
}

