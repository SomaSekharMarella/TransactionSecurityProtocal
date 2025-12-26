/**
 * ECDH (Elliptic Curve Diffie-Hellman) Module
 * 
 * Derives shared secret between two parties without exchanging private keys
 * Used for secure key exchange in transaction encryption
 */

const EC = require('elliptic').ec;
const crypto = require('crypto');
const { ec } = require('./ecc');

/**
 * Derive shared secret using ECDH
 * 
 * @param {string|Buffer} privateKey - Our private key
 * @param {string} peerPublicKeyHex - Peer's public key in hex format
 * @returns {Buffer|null} Shared secret as Buffer, or null if failed
 */
function deriveSharedSecret(privateKey, peerPublicKeyHex) {
    try {
        const privateKeyHex = Buffer.isBuffer(privateKey) ? privateKey.toString('hex') : privateKey;
        const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
        const peerPublicKey = ec.keyFromPublic(peerPublicKeyHex, 'hex');
        
        // Derive shared point
        const sharedPoint = keyPair.derive(peerPublicKey.getPublic());
        
        // Convert to buffer (shared secret)
        const sharedSecret = Buffer.from(sharedPoint.toString('hex', 32), 'hex');
        
        return sharedSecret;
    } catch (error) {
        console.error('ECDH derivation error:', error.message);
        return null;
    }
}

/**
 * Derive encryption key from shared secret using HKDF
 * Uses SHA-256 for key derivation
 * 
 * @param {Buffer} sharedSecret - Shared secret from ECDH
 * @param {string} salt - Optional salt (default: empty)
 * @param {number} keyLength - Desired key length in bytes (default: 32)
 * @returns {Buffer} Derived encryption key
 */
function deriveEncryptionKey(sharedSecret, salt = '', keyLength = 32) {
    // Simple HKDF-like derivation using SHA-256
    // In production, use proper HKDF implementation
    const hmac = crypto.createHmac('sha256', salt || '');
    hmac.update(sharedSecret);
    const key = hmac.digest();
    
    // If key length is longer than hash output, extend it
    if (keyLength > key.length) {
        const extended = Buffer.alloc(keyLength);
        key.copy(extended);
        // Extend by hashing again
        const hmac2 = crypto.createHmac('sha256', key);
        hmac2.update(salt || '');
        hmac2.digest().copy(extended, key.length);
        return extended.slice(0, keyLength);
    }
    
    return key.slice(0, keyLength);
}

/**
 * Validate that two parties can derive the same shared secret
 * (For testing purposes)
 * 
 * @param {string} privateKey1 - First party's private key
 * @param {string} publicKey1 - First party's public key
 * @param {string} privateKey2 - Second party's private key
 * @param {string} publicKey2 - Second party's public key
 * @returns {boolean} True if secrets match
 */
function validateSharedSecretDerivation(privateKey1, publicKey1, privateKey2, publicKey2) {
    const secret1 = deriveSharedSecret(privateKey1, publicKey2);
    const secret2 = deriveSharedSecret(privateKey2, publicKey1);
    
    if (!secret1 || !secret2) {
        return false;
    }
    
    return secret1.equals(secret2);
}

module.exports = {
    deriveSharedSecret,
    deriveEncryptionKey,
    validateSharedSecretDerivation
};

