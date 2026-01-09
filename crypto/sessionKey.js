/**
 * Session Key Management Module
 * 
 * Implements forward and backward secrecy for session keys
 * Based on DYNAMIC-TRUST framework
 * 
 * Features:
 * - Ephemeral session key generation
 * - Forward secrecy (compromised keys don't affect future sessions)
 * - Backward secrecy (compromised keys don't affect past sessions)
 * - Session key hash generation for tracking
 */

const crypto = require('crypto');
const { generateKeyPair } = require('./ecc');

/**
 * Generate an ephemeral session key
 * @returns {Object} { sessionKey: Buffer, sessionKeyHash: string }
 */
function generateSessionKey() {
    // Generate random 32-byte session key
    const sessionKey = crypto.randomBytes(32);
    const sessionKeyHash = crypto.createHash('sha256').update(sessionKey).digest('hex');
    
    return {
        sessionKey: sessionKey,
        sessionKeyHash: sessionKeyHash,
        sessionKeyHashBytes32: '0x' + sessionKeyHash.substring(0, 64) // For Solidity bytes32
    };
}

/**
 * Derive session key from ECDH shared secret
 * @param {string} sharedSecret - ECDH shared secret (hex)
 * @param {number} nonce - Transaction nonce
 * @returns {Object} { sessionKey: Buffer, sessionKeyHash: string }
 */
function deriveSessionKeyFromECDH(sharedSecret, nonce) {
    // Combine shared secret with nonce for uniqueness
    const combined = sharedSecret + nonce.toString(16).padStart(16, '0');
    const sessionKey = crypto.createHash('sha256').update(combined, 'hex').digest();
    const sessionKeyHash = crypto.createHash('sha256').update(sessionKey).digest('hex');
    
    return {
        sessionKey: sessionKey,
        sessionKeyHash: sessionKeyHash,
        sessionKeyHashBytes32: '0x' + sessionKeyHash.substring(0, 64)
    };
}

/**
 * Generate session key hash for tracking (without exposing key)
 * @param {Buffer|string} sessionKey - Session key
 * @returns {string} Session key hash (hex)
 */
function hashSessionKey(sessionKey) {
    const keyBuffer = Buffer.isBuffer(sessionKey) ? sessionKey : Buffer.from(sessionKey, 'hex');
    return crypto.createHash('sha256').update(keyBuffer).digest('hex');
}

/**
 * Verify session key hasn't been used
 * @param {string} sessionKeyHash - Hash of session key
 * @param {Array<string>} usedHashes - Array of used session key hashes
 * @returns {boolean} True if not used
 */
function isSessionKeyUnused(sessionKeyHash, usedHashes) {
    return !usedHashes.includes(sessionKeyHash);
}

module.exports = {
    generateSessionKey,
    deriveSessionKeyFromECDH,
    hashSessionKey,
    isSessionKeyUnused
};

