/**
 * Generates a globally unique QR code string using Shop ID, timestamp, and a random UUID.
 * Format: SHOPID-TIMESTAMP-UUID
 * 
 * @param shopId The unique ID of the shop
 * @returns A strictly unique string for QR code identification
 */
export const generateUniqueQrCode = (shopId: string): string => {
  const timestamp = Date.now();
  // Using the modern crypto.randomUUID() API (supported in most modern browsers)
  // If not available, we fall back to a simple random string generator
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID().replace(/-/g, '') 
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  return `${shopId}-${timestamp}-${uuid}`;
};
