'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { TransactionService } from '@/services/transaction.service';

export async function approvePriceRequest(data: {
  transactionId: string;
  adminNotes?: string;
  items: { id: string; approvedPrice: number }[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }

    await TransactionService.approvePriceRequest(data, session.user.id, session.user.role);

    revalidatePath('/admin/approvals');
    revalidatePath('/super-admin/approvals');
    revalidatePath('/sales/requests');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to approve price request:', error);
    return { success: false, error: error.message || 'Failed to approve request' };
  }
}

export async function rejectPriceRequest(data: {
  transactionId: string;
  adminNotes: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }

    await TransactionService.rejectPriceRequest(data, session.user.id, session.user.role);

    revalidatePath('/admin/approvals');
    revalidatePath('/super-admin/approvals');
    revalidatePath('/sales/requests');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reject price request:', error);
    return { success: false, error: error.message || 'Failed to reject request' };
  }
}
