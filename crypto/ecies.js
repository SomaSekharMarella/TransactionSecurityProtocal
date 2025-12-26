/**
 * ECIES (Elliptic Curve Integrated Encryption Scheme) Module
 * 
 * Encrypts transaction payloads using ECDH-derived keys
 * Only the intended receiver can decrypt using their private key
 */

const crypto = require('crypto');
const { deriveSharedSecret, deriveEncryptionKey } = require('./ecdh');
const { hash } = require('./ecdsa');

/**
 * Encrypt data using ECIES
 * 
 * Encryption process:
 * 1. Derive shared secret using ECDH (sender private + receiver public)
 * 2. Derive encryption key from shared secret
 * 3. Generate random IV
 * 4. Encrypt data using AES-256-CBC
 * 5. Return IV + encrypted data
 * 
 * @param {string|Buffer} senderPrivateKey - Sender's private key
 * @param {string} receiverPublicKeyHex - Receiver's public key in hex
 * @param {string|Buffer} plaintext - Data to encrypt
 * @returns {Object} { encrypted: string, iv: string, tag: string }
 */
function encrypt(senderPrivateKey, receiverPublicKeyHex, plaintext) {
    try {
        // Derive shared secret
        const sharedSecret = deriveSharedSecret(senderPrivateKey, receiverPublicKeyHex);
        if (!sharedSecret) {
            throw new Error('Failed to derive shared secret');
        }
        
        // Derive encryption key (32 bytes for AES-256)
        const encryptionKey = deriveEncryptionKey(sharedSecret, 'ecies-salt', 32);
        
        // Generate random IV (16 bytes for AES)
        const iv = crypto.randomBytes(16);
        
        // Convert plaintext to buffer
        const plaintextBuffer = Buffer.isBuffer(plaintext) 
            ? plaintext 
            : Buffer.from(plaintext, 'utf8');
        
        // Encrypt using AES-256-CBC
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
        let encrypted = cipher.update(plaintextBuffer);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // Create authentication tag (HMAC-SHA256)
        const hmac = crypto.createHmac('sha256', encryptionKey);
        hmac.update(iv);
        hmac.update(encrypted);
        const tag = hmac.digest('hex');
        
        return {
            encrypted: encrypted.toString('hex'),
            iv: iv.toString('hex'),
            tag: tag
        };
    } catch (error) {
        console.error('ECIES encryption error:', error.message);
        throw error;
    }
}

/**
 * Decrypt data using ECIES
 * 
 * Decryption process:
 * 1. Derive shared secret using ECDH (receiver private + sender public)
 * 2. Derive encryption key from shared secret
 * 3. Verify authentication tag
 * 4. Decrypt data using AES-256-CBC
 * 
 * @param {string|Buffer} receiverPrivateKey - Receiver's private key
 * @param {string} senderPublicKeyHex - Sender's public key in hex
 * @param {string} encryptedHex - Encrypted data in hex
 * @param {string} ivHex - Initialization vector in hex
 * @param {string} tagHex - Authentication tag in hex
 * @returns {Buffer|null} Decrypted plaintext or null if failed
 */
function decrypt(receiverPrivateKey, senderPublicKeyHex, encryptedHex, ivHex, tagHex) {
    try {
        // Derive shared secret
        const sharedSecret = deriveSharedSecret(receiverPrivateKey, senderPublicKeyHex);
        if (!sharedSecret) {
            throw new Error('Failed to derive shared secret');
        }
        
        // Derive encryption key
        const encryptionKey = deriveEncryptionKey(sharedSecret, 'ecies-salt', 32);
        
        // Convert hex strings to buffers
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        
        // Verify authentication tag
        const hmac = crypto.createHmac('sha256', encryptionKey);
        hmac.update(iv);
        hmac.update(encrypted);
        const computedTag = hmac.digest('hex');
        
        if (computedTag !== tagHex) {
            throw new Error('Authentication tag mismatch - data may be tampered');
        }
        
        // Decrypt using AES-256-CBC
        const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted;
    } catch (error) {
        console.error('ECIES decryption error:', error.message);
        return null;
    }
}

/**
 * Encrypt transaction payload (wrapper for transaction structure)
 * 
 * @param {string|Buffer} senderPrivateKey - Sender's private key
 * @param {string} receiverPublicKeyHex - Receiver's public key
 * @param {Object} payload - Transaction payload object
 * @returns {Object} Encrypted payload with IV and tag
 */
function encryptTransactionPayload(senderPrivateKey, receiverPublicKeyHex, payload) {
    const payloadString = JSON.stringify(payload);
    return encrypt(senderPrivateKey, receiverPublicKeyHex, payloadString);
}

/**
 * Decrypt transaction payload
 * 
 * @param {string|Buffer} receiverPrivateKey - Receiver's private key
 * @param {string} senderPublicKeyHex - Sender's public key
 * @param {Object} encryptedPayload - { encrypted, iv, tag }
 * @returns {Object|null} Decrypted payload object or null if failed
 */
function decryptTransactionPayload(receiverPrivateKey, senderPublicKeyHex, encryptedPayload) {
    const decrypted = decrypt(
        receiverPrivateKey,
        senderPublicKeyHex,
        encryptedPayload.encrypted,
        encryptedPayload.iv,
        encryptedPayload.tag
    );
    
    if (!decrypted) {
        return null;
    }
    
    try {
        return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
        console.error('Failed to parse decrypted payload:', error.message);
        return null;
    }
}

module.exports = {
    encrypt,
    decrypt,
    encryptTransactionPayload,
    decryptTransactionPayload
};

