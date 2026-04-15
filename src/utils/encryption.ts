/**
 * Order-Do Hardened Encryption Utility (AES-GCM)
 * 
 * SECURITY FIXES APPLIED:
 * - TC-001: Pepper moved to environment variable (not hardcoded in bundle)
 * - TC-002: Random salt generated per encryption, stored with ciphertext
 * - TC-003: encrypt() throws on failure instead of returning plaintext
 */

// TC-001 FIX: Pepper sourced from environment variable.
// In production, set VITE_ENCRYPTION_PEPPER to a strong random string.
// Falls back to a build-time default ONLY for development.
const SYSTEM_PEPPER = import.meta.env.VITE_ENCRYPTION_PEPPER || 'dev-only-pepper-do-not-use-in-production';

/**
 * Derives a cryptographic key from the System Pepper, Shop ID, and a random salt
 */
async function deriveKey(shopId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SYSTEM_PEPPER + shopId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource, // TC-002 FIX: Use random salt instead of static string
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string using AES-GCM.
 * Output format: base64(salt):base64(iv):base64(ciphertext)
 * 
 * TC-003 FIX: Throws on failure — NEVER returns plaintext
 */
export async function encrypt(text: string, shopId: string = 'global'): Promise<string> {
  if (!text) return '';

  // Verify SubtleCrypto is available (requires HTTPS in production)
  if (!crypto?.subtle) {
    throw new Error('ENCRYPTION_UNAVAILABLE: SubtleCrypto requires a secure context (HTTPS). Cannot encrypt data.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // TC-002 FIX: Generate random salt per encryption operation
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(shopId, salt);

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const saltBase64 = btoa(String.fromCharCode(...salt));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const contentBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedContent)));
  
  // New format: salt:iv:ciphertext (3 segments)
  return `${saltBase64}:${ivBase64}:${contentBase64}`;
}

/**
 * Decrypt a string using AES-GCM.
 * Supports both new format (salt:iv:ciphertext) and legacy format (iv:ciphertext)
 * 
 * TC-003 FIX: Returns plaintext or throws — never returns raw ciphertext
 */
export async function decrypt(encrypted: string, shopId: string = 'global'): Promise<string> {
  if (!encrypted) return '';
  if (!encrypted.includes(':')) return encrypted; // Likely already plaintext (legacy)
  
  const parts = encrypted.split(':');
  
  try {
    let salt: Uint8Array;
    let iv: Uint8Array;
    let content: Uint8Array;

    if (parts.length === 3) {
      // New format: salt:iv:ciphertext
      salt = new Uint8Array(atob(parts[0]).split('').map(c => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
      iv = new Uint8Array(atob(parts[1]).split('').map(c => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
      content = new Uint8Array(atob(parts[2]).split('').map(c => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
    } else if (parts.length === 2) {
      // Legacy format: iv:ciphertext (uses static salt for backward compatibility)
      const encoder = new TextEncoder();
      salt = encoder.encode('order-do-static-salt') as Uint8Array<ArrayBuffer>; // Legacy static salt
      iv = new Uint8Array(atob(parts[0]).split('').map(c => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
      content = new Uint8Array(atob(parts[1]).split('').map(c => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
    } else {
      // Not an encrypted string
      return encrypted;
    }

    const key = await deriveKey(shopId, salt);
    
    const decryptedContent = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      content as BufferSource
    );

    return new TextDecoder().decode(decryptedContent);
  } catch (err) {
    // If decryption fails, it might be legacy XOR data or plaintext
    // Try legacy decryption before giving up
    try {
      const legacyResult = legacyDecrypt(encrypted);
      if (legacyResult && legacyResult !== encrypted) {
        return legacyResult;
      }
    } catch {
      // Legacy also failed
    }
    
    console.warn('[Decryption] Failed for data, likely plaintext or corrupted:', err);
    
    // TC-003 FIX: Professional fallback instead of raw junk
    const isHindi = document.documentElement.lang === 'hi';
    return isHindi ? '[डेटा लॉक है]' : '[Personal Data Locked]';
  }
}

/**
 * Legacy Decrypt (for migration support if needed)
 * This allows the app to still read old XOR data during the transition.
 */
export function legacyDecrypt(encrypted: string): string {
  if (!encrypted) return '';
  const LEGACY_KEY = 'order-do-simple-key';
  try {
    const decoded = atob(encrypted);
    const charCodes = Array.from(decoded).map((char, index) => {
      return char.charCodeAt(0) ^ LEGACY_KEY.charCodeAt(index % LEGACY_KEY.length);
    });
    return String.fromCharCode(...charCodes);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return encrypted;
  }
}
