/**
 * Order-Do Simple Encryption Utility
 * Used for lightweight obfuscation of customer names in local storage.
 * Note: This is NOT banking-grade security, but prevents casual reading in DevTools.
 */

const SECRET_KEY = 'order-do-simple-key';

/**
 * Encrypt a string using a simple XOR cipher.
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const charCodes = Array.from(text).map((char, index) => {
    return char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(index % SECRET_KEY.length);
  });
  return btoa(String.fromCharCode(...charCodes));
}

/**
 * Decrypt a string using the same XOR cipher.
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return '';
  try {
    const decoded = atob(encrypted);
    const charCodes = Array.from(decoded).map((char, index) => {
      return char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(index % SECRET_KEY.length);
    });
    return String.fromCharCode(...charCodes);
  } catch (e) {
    console.warn('[decrypt] Failed to decrypt:', e);
    return encrypted; // Fallback to original if decryption fails
  }
}
