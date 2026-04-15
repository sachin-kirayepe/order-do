import Dexie, { type EntityTable } from 'dexie';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ShopProfile {
  id: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  phone?: string;
  address?: string;
  shopType: string;
  createdAt: number;
  hasMultiQR?: boolean;
  qrType?: 'counter' | 'table';
  qrCount?: number;
  masterQrCode?: string;
  extraQRs?: { type: 'counter' | 'table'; no: string; code: string }[];
  hasMenu?: boolean;
  upiId?: string;
}

export interface QrHistory {
  code: string;
  shopId: string;
  type: 'master' | 'counter' | 'table';
  no?: string;
  createdAt: number;
}

export interface MenuItem {
  id?: number;
  shopId: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  available: boolean;
}

// ─── Order Interfaces ────────────────────────────────────────────────────────

export interface OrderItem {
  id?: number | string; // Reference to MenuItem id
  shopId?: string;
  name: string;
  quantity: string;
  price?: number; // shopkeeper fills this
}

export interface PendingOrder {
  id: string;
  shopId: string;
  customerName: string;
  customerAddress: string; // NEW: Compulsory address
  photoDataUrl: string;
  items: OrderItem[];
  createdAt: number;
  status: 'pending' | 'accepted' | 'rejected' | 'ready';
  type?: 'counter' | 'table';
  no?: string;
  paymentStatus?: 'pending' | 'cod' | 'upi';
  paymentReceived?: boolean;
  customerPhone?: string;
  short_id?: string; // NEW: Human readable short ID
}

export interface OrderHistory {
  id: string;
  shopId: string;
  customerName: string; // Will be deleted after proof creation
  customerAddress: string; // Will be deleted after proof creation
  photoDataUrl: string; // Will be deleted after proof creation
  proofBlurredPhoto?: string; // NEW: Blur version for shopkeeper proof
  proofHashedName?: string; // NEW: SHA-256 hash for verify
  orderToken?: string; // NEW: Token for auditing
  short_id?: string; // NEW: Human readable short ID
  items: OrderItem[];
  total: number;
  status: 'completed' | 'rejected';
  createdAt: number;
  completedAt: number;
  type?: 'counter' | 'table';
  no?: string;
  paymentStatus?: 'pending' | 'cod' | 'upi';
  paymentReceived?: boolean;
  customerPhone?: string;
}

// Legacy — kept for backward compatibility, will be migrated
export interface TempOrder {
  id: string;
  shopId: string;
  customerName: string;
  photoDataUrl: string;
  items: OrderItem[];
  createdAt: number;
  status: 'draft' | 'submitted';
  paymentStatus?: 'pending' | 'cod' | 'upi';
}

// ─── Database ────────────────────────────────────────────────────────────────

const db = new Dexie('OrderDoDatabase') as Dexie & {
  shopProfile: EntityTable<ShopProfile, 'id'>;
  pendingOrders: EntityTable<PendingOrder, 'id'>;
  orderHistory: EntityTable<OrderHistory, 'id'>;
  tempOrders: EntityTable<TempOrder, 'id'>;
  menuItems: EntityTable<MenuItem, 'id'>;
  qrHistory: EntityTable<QrHistory, 'code'>;
};

db.version(11).stores({
  shopProfile: 'id, shopId, phone',
  pendingOrders: 'id, shopId, status, createdAt, paymentStatus, customerName, customerPhone, short_id',
  orderHistory: 'id, shopId, status, createdAt, completedAt, paymentStatus, customerName, customerPhone, short_id',
  tempOrders: 'id, shopId, status, createdAt',
  menuItems: '++id, shopId, category, available',
  qrHistory: 'code, shopId, type',
});

export default db;
