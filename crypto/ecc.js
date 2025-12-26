/**
 * ECC (Elliptic Curve Cryptography) Module
 * 
 * Provides secp256k1 curve operations for key pair generation
 * Uses elliptic library for curve operations
 */

const EC = require('elliptic').ec;
const crypto = require('crypto');

// Initialize secp256k1 curve
const ec = new EC('secp256k1');

/**
 * Generate a new ECC key pair
 * @returns {Object} { privateKey: Buffer, publicKey: Buffer, publicKeyHex: string }
 */
function generateKeyPair() {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic();
    
    // Compress public key (33 bytes: 0x02/0x03 + 32 bytes x-coordinate)
    const publicKeyCompressed = publicKey.encode('hex', true);
    
    return {
        privateKey: Buffer.from(privateKey, 'hex'),
        privateKeyHex: privateKey,
        publicKey: publicKey,
        publicKeyHex: publicKeyCompressed,
        publicKeyUncompressed: publicKey.encode('hex', false)
    };
}

/**
 * Get public key from private key
 * @param {string|Buffer} privateKey - Private key in hex or Buffer format
 * @returns {Object} Public key object
 */
function getPublicKeyFromPrivate(privateKey) {
    const privateKeyHex = Buffer.isBuffer(privateKey) ? privateKey.toString('hex') : privateKey;
    const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
    const publicKey = keyPair.getPublic();
    
    return {
        publicKey: publicKey,
        publicKeyHex: publicKey.encode('hex', true),
        publicKeyUncompressed: publicKey.encode('hex', false)
    };
}

/**
 * Validate if a public key is valid on secp256k1 curve
 * @param {string} publicKeyHex - Public key in hex format
 * @returns {boolean} True if valid
 */
function validatePublicKey(publicKeyHex) {
    try {
        const publicKey = ec.keyFromPublic(publicKeyHex, 'hex');
        return publicKey.validate().result;
    } catch (error) {
        return false;
    }
}

/**
 * Generate a random nonce
 * @returns {string} Random 32-byte hex string
 */
function generateNonce() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = {
    generateKeyPair,
    getPublicKeyFromPrivate,
    validatePublicKey,
    generateNonce,
    ec // Export curve for other modules
};

