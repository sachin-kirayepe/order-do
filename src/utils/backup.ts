import db from '../db/dexie';

/**
 * Export all Dexie data (shop profile + orders + history) as a JSON blob.
 */
export async function exportBackup(): Promise<string> {
  const shopProfile = await db.shopProfile.toArray();
  const pendingOrders = await db.pendingOrders.toArray();
  const orderHistory = await db.orderHistory.toArray();

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'Order-Do',
    data: { shopProfile, pendingOrders, orderHistory },
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Trigger a JSON file download in the browser.
 */
export function downloadJSON(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import a backup JSON file and restore into Dexie.
 * TC-017 FIX: Validates schema before importing to prevent corruption.
 * Returns count of items restored.
 */
export async function importBackup(file: File): Promise<number> {
  const text = await file.text();
  
  let backup: any;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (!backup?.data || typeof backup.data !== 'object') {
    throw new Error('Invalid backup file: missing data field');
  }

  // TC-017: Validate structure — reject prototype pollution attempts
  const sanitize = (arr: any[], requiredKeys: string[]): any[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => {
      // Block prototype pollution
      if ('__proto__' in item || 'constructor' in item || 'prototype' in item) {
        console.warn('[Backup] Blocked suspicious prototype key in import data');
        return false;
      }
      // Validate required keys exist
      return requiredKeys.every(key => key in item);
    });
  };

  let count = 0;

  const validProfiles = sanitize(backup.data.shopProfile || [], ['id', 'shopId', 'shopName']);
  if (validProfiles.length) {
    await db.shopProfile.bulkPut(validProfiles);
    count += validProfiles.length;
  }

  const validPending = sanitize(backup.data.pendingOrders || [], ['id', 'shopId', 'items']);
  if (validPending.length) {
    await db.pendingOrders.bulkPut(validPending);
    count += validPending.length;
  }

  const validHistory = sanitize(backup.data.orderHistory || [], ['id', 'shopId', 'items', 'total']);
  if (validHistory.length) {
    await db.orderHistory.bulkPut(validHistory);
    count += validHistory.length;
  }

  return count;
}
