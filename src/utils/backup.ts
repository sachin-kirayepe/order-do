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
 * Returns count of items restored.
 */
export async function importBackup(file: File): Promise<number> {
  const text = await file.text();
  const backup = JSON.parse(text);

  if (!backup?.data) throw new Error('Invalid backup file');

  let count = 0;

  if (backup.data.shopProfile?.length) {
    await db.shopProfile.bulkPut(backup.data.shopProfile);
    count += backup.data.shopProfile.length;
  }
  if (backup.data.pendingOrders?.length) {
    await db.pendingOrders.bulkPut(backup.data.pendingOrders);
    count += backup.data.pendingOrders.length;
  }
  if (backup.data.orderHistory?.length) {
    await db.orderHistory.bulkPut(backup.data.orderHistory);
    count += backup.data.orderHistory.length;
  }

  return count;
}
