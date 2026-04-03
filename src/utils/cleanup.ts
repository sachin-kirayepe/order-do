import db from '../db/dexie';

const THIRTY_MINUTES = 30 * 60 * 1000;

/**
 * Delete pending orders and temp orders older than 30 minutes.
 * Call this on app startup and periodically.
 */
export async function cleanupStaleOrders() {
  const cutoff = Date.now() - THIRTY_MINUTES;

  // Clean old temp orders
  try {
    const staleTmp = await db.tempOrders.where('createdAt').below(cutoff).toArray();
    if (staleTmp.length > 0) {
      await db.tempOrders.bulkDelete(staleTmp.map((o) => o.id));
      console.log(`[cleanup] Deleted ${staleTmp.length} stale temp orders`);
    }
  } catch {
    // tempOrders table may not exist in all versions
  }

  // Clean old pending orders that were never processed
  const stalePending = await db.pendingOrders.where('createdAt').below(cutoff).toArray();
  if (stalePending.length > 0) {
    await db.pendingOrders.bulkDelete(stalePending.map((o) => o.id));
    console.log(`[cleanup] Deleted ${stalePending.length} stale pending orders`);
  }
}
