/**
 * Proof of Trust (PoT) Module
 * 
 * Lightweight trust scoring system for validators
 * Tracks validator behavior and adjusts trust scores accordingly
 */

const { ethers } = require('ethers');

class ProofOfTrust {
    constructor(validatorRegistryContract, secureLedgerContract) {
        this.validatorRegistry = validatorRegistryContract;
        this.secureLedger = secureLedgerContract;
    }

    /**
     * Increase trust score for valid block proposal
     * @param {string} validatorAddress - Validator address
     * @returns {Promise<boolean>} True if successful
     */
    async rewardValidator(validatorAddress) {
        try {
            const tx = await this.validatorRegistry.increaseTrustScore(validatorAddress);
            await tx.wait();
            console.log(`✅ Trust score increased for validator: ${validatorAddress}`);
            return true;
        } catch (error) {
            console.error('Error increasing trust score:', error.message);
            return false;
        }
    }

    /**
     * Decrease trust score for invalid behavior
     * @param {string} validatorAddress - Validator address
     * @param {string} reason - Reason for penalty
     * @returns {Promise<boolean>} True if successful
     */
    async penalizeValidator(validatorAddress, reason) {
        try {
            const tx = await this.validatorRegistry.decreaseTrustScore(
                validatorAddress,
                reason
            );
            await tx.wait();
            console.log(`⚠️ Trust score decreased for validator: ${validatorAddress}`);
            console.log(`   Reason: ${reason}`);
            return true;
        } catch (error) {
            console.error('Error decreasing trust score:', error.message);
            return false;
        }
    }

    /**
     * Get trust score for a validator
     * @param {string} validatorAddress - Validator address
     * @returns {Promise<number>} Trust score
     */
    async getTrustScore(validatorAddress) {
        try {
            const validator = await this.validatorRegistry.getValidator(validatorAddress);
            return Number(validator.trustScore);
        } catch (error) {
            console.error('Error getting trust score:', error.message);
            return 0;
        }
    }

    /**
     * Get all validators with their trust scores
     * @returns {Promise<Array>} Array of validator objects with trust scores
     */
    async getAllTrustScores() {
        try {
            const validators = await this.validatorRegistry.getActiveValidators();
            const trustScores = [];

            for (const validatorAddress of validators) {
                const validator = await this.validatorRegistry.getValidator(validatorAddress);
                trustScores.push({
                    address: validator.validatorAddr,
                    publicKey: validator.publicKey,
                    trustScore: Number(validator.trustScore),
                    isActive: validator.isActive
                });
            }

            // Sort by trust score (descending)
            trustScores.sort((a, b) => b.trustScore - a.trustScore);

            return trustScores;
        } catch (error) {
            console.error('Error getting all trust scores:', error.message);
            return [];
        }
    }

    /**
     * Check if validator should be penalized based on behavior
     * @param {string} validatorAddress - Validator address
     * @param {Object} behavior - Behavior object with type and details
     * @returns {Promise<boolean>} True if should be penalized
     */
    async evaluateBehavior(validatorAddress, behavior) {
        const penaltyReasons = {
            'invalid_signature': 'Invalid transaction signature',
            'replay_attempt': 'Transaction replay attack detected',
            'double_signing': 'Double signing detected',
            'tampered_transaction': 'Transaction tampering detected',
            'invalid_nonce': 'Invalid nonce sequence',
            'timestamp_manipulation': 'Timestamp manipulation detected'
        };

        const reason = penaltyReasons[behavior.type] || behavior.reason || 'Invalid behavior';

        return await this.penalizeValidator(validatorAddress, reason);
    }

    /**
     * Get validator ranking by trust score
     * @returns {Promise<Array>} Sorted array of validators
     */
    async getValidatorRanking() {
        const trustScores = await this.getAllTrustScores();
        return trustScores.map((v, index) => ({
            rank: index + 1,
            ...v
        }));
    }

    /**
     * Check if validator is trustworthy (above minimum threshold)
     * @param {string} validatorAddress - Validator address
     * @param {number} minTrustScore - Minimum trust score threshold (default: 50)
     * @returns {Promise<boolean>} True if trustworthy
     */
    async isTrustworthy(validatorAddress, minTrustScore = 50) {
        const trustScore = await this.getTrustScore(validatorAddress);
        return trustScore >= minTrustScore;
    }
}

module.exports = ProofOfTrust;

