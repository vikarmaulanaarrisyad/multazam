'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ApiResponse } from '../types/api-response';
import { PreOrderData } from '@/types/transaction.type';
import { TransactionService } from '@/services/transaction.service';

export async function createPreOrder(data: PreOrderData): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    const transaction = await TransactionService.createPreOrder(data, session.user.id);

    revalidatePath('/sales');
    revalidatePath('/sales/requests');
    
    return { success: true, data: { id: transaction.id } };
  } catch (error: any) {
    console.error('Failed to create pre-order:', error);
    return { success: false, error: error.message || 'Failed to submit pre-order' };
  }
}
