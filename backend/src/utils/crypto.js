import crypto from 'crypto';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const DEFAULT_KEY_ID = process.env.CURRENT_KEY_ID || 'v1';

/**
 * Parses encryption key ring from ENCRYPTION_KEYS environment variable
 * @returns {Record<string, Buffer>}
 */
const getKeyRing = () => {
  try {
    const rawKeys = process.env.ENCRYPTION_KEYS ? JSON.parse(process.env.ENCRYPTION_KEYS) : {};
    const keyMap = {};
    for (const [keyId, hexKey] of Object.entries(rawKeys)) {
      if (hexKey && hexKey.length === 64) {
        keyMap[keyId] = Buffer.from(hexKey, 'hex');
      }
    }

    if (!keyMap[DEFAULT_KEY_ID]) {
      // Deterministic dev fallback key if not set
      keyMap[DEFAULT_KEY_ID] = crypto.createHash('sha256').update('job-assistant-dev-key').digest();
    }

    return keyMap;
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to parse ENCRYPTION_KEYS configuration');
    return {
      [DEFAULT_KEY_ID]: crypto.createHash('sha256').update('job-assistant-dev-key').digest()
    };
  }
};

/**
 * Encrypts a token or secret string using AES-256-GCM
 * @param {string} plainText - Text to encrypt
 * @param {string} [keyId] - Key identifier
 * @returns {string} - Formatted encrypted string: keyId:iv:authTag:ciphertext
 */
export const encryptToken = (plainText, keyId = DEFAULT_KEY_ID) => {
  if (!plainText) return '';
  const keyRing = getKeyRing();
  const key = keyRing[keyId];

  if (!key) {
    throw new Error(`Encryption key '${keyId}' not found in key ring`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${keyId}:${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a token encrypted with AES-256-GCM
 * @param {string | Object} encryptedData - String in format 'keyId:iv:authTag:ciphertext' or object
 * @returns {string} - Decrypted plaintext string
 */
export const decryptToken = (encryptedData) => {
  if (!encryptedData) return '';

  let keyId, ivHex, tagHex, ciphertextHex;

  if (typeof encryptedData === 'string') {
    // Check for JSON serialization
    if (encryptedData.startsWith('{')) {
      const parsed = JSON.parse(encryptedData);
      keyId = parsed.keyId || DEFAULT_KEY_ID;
      ivHex = parsed.iv;
      tagHex = parsed.authTag || parsed.tag;
      ciphertextHex = parsed.encrypted || parsed.ciphertext;
    } else {
      const parts = encryptedData.split(':');
      if (parts.length === 4) {
        [keyId, ivHex, tagHex, ciphertextHex] = parts;
      } else if (parts.length === 3) {
        keyId = DEFAULT_KEY_ID;
        [ivHex, tagHex, ciphertextHex] = parts;
      } else {
        throw new Error('Invalid encrypted payload format');
      }
    }
  } else if (typeof encryptedData === 'object') {
    keyId = encryptedData.keyId || DEFAULT_KEY_ID;
    ivHex = encryptedData.iv;
    tagHex = encryptedData.authTag || encryptedData.tag;
    ciphertextHex = encryptedData.encrypted || encryptedData.ciphertext;
  }

  const keyRing = getKeyRing();
  const key = keyRing[keyId];
  if (!key) {
    throw new Error(`Decryption key '${keyId}' not found in key ring`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

export default {
  encryptToken,
  decryptToken
};
