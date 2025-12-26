/**
 * Proof of Authority (PoA) Consensus Module
 * 
 * Validators are pre-authorized and must sign blocks
 * Provides validator selection and block proposal logic
 */

const { ethers } = require('ethers');

class ProofOfAuthority {
    constructor(validatorRegistryContract, secureLedgerContract, provider) {
        this.validatorRegistry = validatorRegistryContract;
        this.secureLedger = secureLedgerContract;
        this.provider = provider;
        this.currentProposer = null;
        this.proposerIndex = 0;
    }

    /**
     * Get all active validators
     * @returns {Promise<Array>} Array of validator addresses
     */
    async getActiveValidators() {
        try {
            const validators = await this.validatorRegistry.getActiveValidators();
            return validators;
        } catch (error) {
            console.error('Error getting active validators:', error.message);
            return [];
        }
    }

    /**
     * Get validator with highest trust score
     * @returns {Promise<string|null>} Validator address or null
     */
    async getHighestTrustScoreValidator() {
        try {
            const validator = await this.validatorRegistry.getHighestTrustScoreValidator();
            return validator;
        } catch (error) {
            console.error('Error getting highest trust score validator:', error.message);
            return null;
        }
    }

    /**
     * Select block proposer using PoA + Trust Score
     * Priority: Highest trust score > Round-robin fallback
     * @returns {Promise<string|null>} Selected proposer address
     */
    async selectProposer() {
        try {
            // First, try to get validator with highest trust score
            const highestTrust = await this.getHighestTrustScoreValidator();
            if (highestTrust && highestTrust !== ethers.ZeroAddress) {
                this.currentProposer = highestTrust;
                return highestTrust;
            }

            // Fallback to round-robin
            const validators = await this.getActiveValidators();
            if (validators.length === 0) {
                return null;
            }

            // Round-robin selection
            const proposer = validators[this.proposerIndex % validators.length];
            this.proposerIndex = (this.proposerIndex + 1) % validators.length;
            this.currentProposer = proposer;

            return proposer;
        } catch (error) {
            console.error('Error selecting proposer:', error.message);
            return null;
        }
    }

    /**
     * Check if it's time to propose a new block
     * @returns {Promise<boolean>} True if block time has elapsed
     */
    async canProposeBlock() {
        try {
            const lastBlockTime = await this.secureLedger.lastBlockTime();
            const blockTime = 10; // 10 seconds in seconds
            const currentTime = Math.floor(Date.now() / 1000);
            
            return (currentTime - Number(lastBlockTime)) >= blockTime;
        } catch (error) {
            console.error('Error checking block proposal time:', error.message);
            return false;
        }
    }

    /**
     * Get current block number
     * @returns {Promise<number>} Current block number
     */
    async getCurrentBlockNumber() {
        try {
            const blockNumber = await this.secureLedger.blockNumber();
            return Number(blockNumber);
        } catch (error) {
            console.error('Error getting block number:', error.message);
            return 0;
        }
    }

    /**
     * Get previous block hash
     * @param {number} blockNumber - Block number to get hash from
     * @returns {Promise<string|null>} Previous block hash or null
     */
    async getPreviousBlockHash(blockNumber) {
        try {
            if (blockNumber === 0) {
                return ethers.ZeroHash; // Genesis block
            }

            const block = await this.secureLedger.getBlock(blockNumber);
            return block.blockHash;
        } catch (error) {
            console.error('Error getting previous block hash:', error.message);
            return null;
        }
    }

    /**
     * Check if address is a validator
     * @param {string} address - Address to check
     * @returns {Promise<boolean>} True if validator
     */
    async isValidator(address) {
        try {
            return await this.validatorRegistry.isValidator(address);
        } catch (error) {
            console.error('Error checking validator status:', error.message);
            return false;
        }
    }

    /**
     * Get validator information
     * @param {string} address - Validator address
     * @returns {Promise<Object|null>} Validator info or null
     */
    async getValidatorInfo(address) {
        try {
            const validator = await this.validatorRegistry.getValidator(address);
            return {
                address: validator.validatorAddr,
                publicKey: validator.publicKey,
                trustScore: Number(validator.trustScore),
                isActive: validator.isActive,
                registrationTime: Number(validator.registrationTime)
            };
        } catch (error) {
            console.error('Error getting validator info:', error.message);
            return null;
        }
    }
}

module.exports = ProofOfAuthority;

