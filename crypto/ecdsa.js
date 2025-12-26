/**
 * ECDSA (Elliptic Curve Digital Signature Algorithm) Module
 * 
 * Provides signing and verification using secp256k1 curve
 * All transactions must be signed before being accepted
 */

const EC = require('elliptic').ec;
const crypto = require('crypto');
const { ec } = require('./ecc');

/**
 * Hash data using SHA-256
 * @param {string|Buffer} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
function hash(data) {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    return crypto.createHash('sha256').update(dataBuffer).digest('hex');
}

/**
 * Sign data using ECDSA
 * @param {string|Buffer} privateKey - Private key in hex or Buffer
 * @param {string|Buffer} data - Data to sign
 * @returns {Object} { signature: string, r: string, s: string }
 */
function sign(privateKey, data) {
    const privateKeyHex = Buffer.isBuffer(privateKey) ? privateKey.toString('hex') : privateKey;
    const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
    
    // Hash the data first
    const dataHash = hash(data);
    const msgHash = Buffer.from(dataHash, 'hex');
    
    // Sign the hash
    const signature = keyPair.sign(msgHash);
    
    // Return signature in DER format (hex)
    return {
        signature: signature.toDER('hex'),
        r: signature.r.toString('hex'),
        s: signature.s.toString('hex'),
        recoveryParam: signature.recoveryParam
    };
}

/**
 * Verify ECDSA signature
 * @param {string} publicKeyHex - Public key in hex format
 * @param {string|Buffer} data - Original data that was signed
 * @param {string} signatureHex - Signature in DER hex format
 * @returns {boolean} True if signature is valid
 */
function verify(publicKeyHex, data, signatureHex) {
    try {
        const publicKey = ec.keyFromPublic(publicKeyHex, 'hex');
        
        // Hash the data
        const dataHash = hash(data);
        const msgHash = Buffer.from(dataHash, 'hex');
        
        // Verify signature
        return publicKey.verify(msgHash, signatureHex);
    } catch (error) {
        console.error('ECDSA verification error:', error.message);
        return false;
    }
}

/**
 * Recover public key from signature and message
 * @param {string|Buffer} data - Original data
 * @param {string} signatureHex - Signature in DER hex format
 * @param {number} recoveryParam - Recovery parameter (0-3)
 * @returns {string|null} Recovered public key or null if failed
 */
function recoverPublicKey(data, signatureHex, recoveryParam) {
    try {
        const dataHash = hash(data);
        const msgHash = Buffer.from(dataHash, 'hex');
        
        // Recover public key
        const publicKey = ec.recoverPubKey(
            msgHash,
            signatureHex,
            recoveryParam
        );
        
        return publicKey.encode('hex', true);
    } catch (error) {
        console.error('Public key recovery error:', error.message);
        return null;
    }
}

module.exports = {
    sign,
    verify,
    recoverPublicKey,
    hash
};

