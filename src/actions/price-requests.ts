'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { TransactionService } from '@/services/transaction.service';

export interface PriceRequestData {
  storeName: string;
  storeLocation: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    requestedPrice: number;
    originalPrice: number;
  }[];
}

export async function createPriceRequest(data: PriceRequestData) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const transaction = await TransactionService.createPriceRequest(data, session.user.id);

    revalidatePath('/sales');
    revalidatePath('/sales/requests');
    
    return { success: true, data: transaction };
  } catch (error: any) {
    console.error('Failed to create price request:', error);
    return { success: false, error: error.message || 'Failed to submit price request' };
  }
}
