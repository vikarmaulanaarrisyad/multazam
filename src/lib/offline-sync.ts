import { PreOrderData } from '@/types/transaction.type';

export interface OfflineOrder {
  tempId: string;
  data: PreOrderData;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

const OFFLINE_ORDERS_KEY = 'multazam_offline_orders_queue';
const OFFLINE_PRODUCTS_KEY = 'multazam_offline_products_cache';

export const OFFLINE_EVENT_NAME = 'multazam-offline-orders-updated';

let isSyncInProgress = false;

/**
 * Save an order to offline queue
 */
export function saveOfflineOrder(data: PreOrderData): OfflineOrder {
  const existing = getOfflineOrders();
  const tempId = `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  
  const newOrder: OfflineOrder = {
    tempId,
    data,
    createdAt: new Date().toISOString(),
    retryCount: 0
  };

  const updated = [newOrder, ...existing];
  try {
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OFFLINE_EVENT_NAME, { detail: { count: updated.length } }));
    }
  } catch (e) {
    console.error('Failed to save offline order to localStorage', e);
  }

  return newOrder;
}

/**
 * Get all pending offline orders
 */
export function getOfflineOrders(): OfflineOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read offline orders', e);
    return [];
  }
}

/**
 * Remove an order from offline queue
 */
export function removeOfflineOrder(tempId: string): OfflineOrder[] {
  const current = getOfflineOrders();
  const filtered = current.filter(o => o.tempId !== tempId);
  try {
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OFFLINE_EVENT_NAME, { detail: { count: filtered.length } }));
    }
  } catch (e) {
    console.error('Failed to remove offline order', e);
  }
  return filtered;
}

/**
 * Sync all pending offline orders to server with lock to prevent race conditions
 */
export async function syncAllOfflineOrders(
  submitFn: (data: PreOrderData) => Promise<{ success: boolean; error?: string }>
): Promise<{ total: number; synced: number; failed: number; errors: string[] }> {
  if (isSyncInProgress) {
    return { total: 0, synced: 0, failed: 0, errors: ['Proses sinkronisasi sedang berjalan'] };
  }

  isSyncInProgress = true;
  try {
    const orders = getOfflineOrders();
    if (orders.length === 0) {
      return { total: 0, synced: 0, failed: 0, errors: [] };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        // Safe re-hydration of Date objects
        const rawDueDate = order.data.dueDate;
        const rawDeliveryDate = order.data.deliveryDate;

        const parsedDueDate = rawDueDate ? new Date(rawDueDate) : new Date();
        const finalDueDate = isNaN(parsedDueDate.getTime()) ? new Date() : parsedDueDate;

        let finalDeliveryDate: Date | undefined;
        if (rawDeliveryDate) {
          const parsedDelivery = new Date(rawDeliveryDate);
          if (!isNaN(parsedDelivery.getTime())) {
            finalDeliveryDate = parsedDelivery;
          }
        }

        const payload: PreOrderData = {
          ...order.data,
          dueDate: finalDueDate,
          deliveryDate: finalDeliveryDate
        };

        const result = await submitFn(payload);
        if (result.success) {
          removeOfflineOrder(order.tempId);
          synced++;
        } else {
          failed++;
          errors.push(result.error || `Gagal mengirim order ${order.tempId}`);
        }
      } catch (err: any) {
        failed++;
        errors.push(err.message || `Error pada ${order.tempId}`);
      }
    }

    return { total: orders.length, synced, failed, errors };
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Cache products list for offline browsing
 */
export function cacheProductsOffline(products: any[]) {
  if (typeof window === 'undefined' || !Array.isArray(products) || products.length === 0) return;
  try {
    localStorage.setItem(OFFLINE_PRODUCTS_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: products
    }));
  } catch (e) {
    console.error('Failed to cache products for offline mode', e);
  }
}

/**
 * Get cached products list for offline mode
 */
export function getCachedProductsOffline(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.data) ? parsed.data : [];
  } catch (e) {
    console.error('Failed to read cached products', e);
    return [];
  }
}
