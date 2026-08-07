'use server';

import { purchaseService } from '@/services/purchase.service';
import { revalidatePath } from 'next/cache';

export async function getPurchasesPaginated(page: number = 1, limit: number = 10, search?: string) {
  const result = await purchaseService.getPaginatedPurchases(page, limit, search);
  if (result.success && result.data) {
    const serializedData = result.data.map((p: any) => ({
      ...p,
      totalAmount: p.totalAmount ? p.totalAmount.toString() : '0',
      items: p.items ? p.items.map((i: any) => ({
        ...i,
        price: i.price ? i.price.toString() : '0',
        product: i.product ? {
          ...i.product,
          price: i.product.price ? i.product.price.toString() : '0'
        } : i.product
      })) : []
    }));
    return { ...result, data: serializedData };
  }
  return result;
}

export async function createPurchaseAction(data: {
  supplierId: string;
  userId: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
}) {
  const result = await purchaseService.createPurchase(data);
  if (result.success) {
    revalidatePath('/admin/purchases');
  }
  return result;
}

export async function completePurchaseAction(id: string) {
  const result = await purchaseService.completePurchase(id);
  if (result.success) {
    revalidatePath('/admin/purchases');
    revalidatePath('/admin/products');
    revalidatePath('/admin/stock-movements');
  }
  return result;
}

export async function cancelPurchaseAction(id: string) {
  const result = await purchaseService.cancelPurchase(id);
  if (result.success) {
    revalidatePath('/admin/purchases');
  }
  return result;
}
