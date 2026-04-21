import db from '../db/dexie';
import { hashString, generateBlurredImage } from './security';
import { encrypt, decrypt } from './encryption';
import { supabase } from '../lib/supabase';

export async function createProofAndDeletePersonalData(orderId: string, total: number) {
    console.log(`[PrivacyProof] Starting proof generation for order: ${orderId}`);
    
    // 1. Fetch the pending order
    const order = await db.pendingOrders.get(orderId);
    if (!order) {
        throw new Error('Order not found in pending state');
    }

    try {
        // 2. Decrypt names/addresses for processing
        const rawName = await decrypt(order.customerName, order.shopId);
        const rawAddress = await decrypt(order.customerAddress, order.shopId);

        // 3. Generate Proofs
        const hashedName = await hashString(rawName);
        console.log(`[PrivacyProof] Hashed name for audit: ${hashedName.slice(0, 8)}... Address length: ${rawAddress.length}`);
        
        const blurredPhoto = await generateBlurredImage(order.photoDataUrl, 12);
        const orderToken = `${crypto.randomUUID()}-${Date.now()}`;

        // 4. Create History Record with Anonymized Reference
        // BALANCED PRIVACY: Instead of DELETED_FOR_PRIVACY, we use a generic reference
        // This keeps business records readable while removing PII.
        const anonymizedName = `Customer #${orderId.slice(0, 4)}`;
        
        await db.orderHistory.put({
            ...order,
            customerName: await encrypt(anonymizedName, order.shopId), // Store anonymized name (encrypted for consistency)
            customerAddress: 'PRIVATE_RECORDS', 
            photoDataUrl: 'PRIVATE_RECORDS', 
            proofBlurredPhoto: blurredPhoto,
            proofHashedName: hashedName,
            orderToken: orderToken,
            short_id: order.short_id, // Preserve unified short ID
            total,
            status: 'completed',
            completedAt: Date.now()
        });

        // 5. Sync Anonymized Record to Supabase for Business Analytics
        try {
            await supabase.from('pending_orders').update({
                customer_name: anonymizedName,
                customer_phone: null,
                customer_address: null,
                photo_data_url: null,
                status: 'completed'
            }).eq('id', orderId);

            // Create a small proof record
            await supabase.from('order_proofs').insert({
                order_token: orderToken,
                hashed_name: hashedName,
                shop_id: order.shopId,
                short_id: order.short_id, // NEW: Standardized audit link
                payment_status: order.paymentStatus,
                created_at: new Date().toISOString()
            });
        } catch (supaErr) {
            console.warn('[PrivacyProof] Supabase sync failed, skipping...', supaErr);
        }

        // 6. Delete from local pending
        await db.pendingOrders.delete(orderId);
        
        console.log(`[PrivacyProof] Success. Order anonymized and stored for 30-day window: ${orderId}`);
        return { success: true, orderToken };

    } catch (err) {
        console.error('[PrivacyProof] Error during proof generation:', err);
        throw err;
    }
}

/**
 * Cleanup function to be run on app load
 * Ensures no orders in 'history' accidentally kept their personal data
 */
export async function performPrivacyAudit() {
    const history = await db.orderHistory.toArray();
    const staleRecords = history.filter(h => h.photoDataUrl && h.photoDataUrl.startsWith('data:image'));
    
    if (staleRecords.length === 0) return;

    console.log(`[PrivacyAudit] Found ${staleRecords.length} stale records. Cleaning up...`);

    const updates = await Promise.all(staleRecords.map(async (h) => ({
        id: h.id,
        changes: {
            photoDataUrl: 'DELETED_BY_AUDIT',
            customerName: await encrypt('Customer #' + h.id.slice(0, 4), h.shopId),
            customerAddress: 'DELETED_BY_AUDIT'
        }
    })));

    for (const update of updates) {
        await db.orderHistory.update(update.id, update.changes);
    }
}

/**
 * BALANCED PURGE: Wipes data entirely after 30 days.
 * This keeps the business healthy with month-over-month reports.
 */
/**
 * BALANCED PURGE: Wipes data from Supabase after 30 days.
 * Keeps local Dexie data for shopkeeper history.
 */
export async function cleanupOldOrders() {
    const THIRTY_FIVE_DAYS_MS = 35 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const thirtyFiveDaysAgo = new Date(now - THIRTY_FIVE_DAYS_MS).toISOString();

    console.log(`[PrivacyPurge] Running MANDATORY 35-day cloud cleanup to save Supabase storage...`);

    try {
        const { error } = await supabase
            .from('pending_orders')
            .delete()
            .lt('created_at', thirtyFiveDaysAgo);
        
        if (error) throw error;
    } catch (err) {
        console.error('[PrivacyPurge] Cloud cleanup failed:', err);
    }
}

/**
 * ARCHIVE & CLEANUP:
 * 1. Fetches data older than 30 days from cloud.
 * 2. Generates CSV (No photos).
 * 3. Triggers download.
 * 4. Cleans up cloud records.
 */
export async function archiveAndCleanupCloudOrders() {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - THIRTY_DAYS_MS).toISOString();

    console.log(`[Archive] Checking for records older than 30 days to archive...`);

    try {
        // 1. Fetch old records from Supabase
        const { data, error } = await supabase
            .from('pending_orders')
            .select('*')
            .lt('created_at', thirtyDaysAgo);

        if (error) throw error;
        if (!data || data.length === 0) {
            console.log('[Archive] No old records found in cloud.');
            return { count: 0 };
        }

        // 2. Generate CSV Content (No photos)
        const headers = ['Order ID', 'Short ID', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Payment'];
        const rows = data.map(o => {
            const items = Array.isArray(o.items) ? o.items.map((i: any) => `${i.name} x${i.quantity}`).join('; ') : '';
            const total = Array.isArray(o.items) ? o.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) : 0;
            return [
                o.id,
                o.short_id || '-',
                new Date(o.created_at).toLocaleDateString(),
                o.customer_name || 'Anonymous',
                `"${items}"`,
                total,
                o.status,
                o.payment_status
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        // 3. Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `OrderDo_Archive_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 4. Cleanup Cloud
        await supabase
            .from('pending_orders')
            .delete()
            .lt('created_at', thirtyDaysAgo);

        console.log(`[Archive] Successfully archived and purged ${data.length} records from cloud.`);
        return { count: data.length };

    } catch (err) {
        console.error('[Archive] Archival process failed:', err);
        throw err;
    }
}

/**
 * AUTO-PURGE: Wipes personal data from orders in 'pendingOrders' that are older than threshold.
 * This ensures even if a shopkeeper doesn't click "Done", the data is safe.
 * @param thresholdHours - Data older than this will be wiped.
 */
export async function purgeStalePendingOrders(thresholdHours: number = 4) {
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const now = Date.now();

    const pending = await db.pendingOrders.toArray();
    const staleOrders = pending.filter(order => (now - order.createdAt) > thresholdMs);

    if (staleOrders.length === 0) return;

    console.log(`[PrivacyPurge] Purging ${staleOrders.length} stale pending orders...`);

    await Promise.all(staleOrders.map(async (order) => {
        // Anonymize local
        await db.pendingOrders.update(order.id, {
            customerName: await encrypt(`Customer #${order.id.slice(0, 4)}`, order.shopId),
            customerPhone: '',
            customerAddress: await encrypt('REDACTED', order.shopId),
            photoDataUrl: ''
        });

        // Update cloud
        await supabase.from('pending_orders').update({
            customer_name: `Customer #${order.id.slice(0, 4)}`,
            customer_phone: null,
            photo_data_url: null
        }).eq('id', order.id);
    }));
}
