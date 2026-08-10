'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { TransactionService } from '@/services/transaction.service';

export async function updateTransactionStatus(data: {
  transactionId: string;
  status: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }

    await TransactionService.updateStatus(data, session.user.id, session.user.role);

    revalidatePath('/admin/transactions');
    revalidatePath('/super-admin/transactions');
    revalidatePath('/sales/requests');
    revalidatePath('/sales/orders');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update transaction status:', error);
    return { success: false, error: error.message || 'Gagal mengubah status pesanan' };
  }
}

export async function cancelTransaction(data: {
  transactionId: string;
  adminNotes: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }

    await TransactionService.cancelTransaction(data, session.user.id, session.user.role);

    revalidatePath('/admin/transactions');
    revalidatePath('/super-admin/transactions');
    revalidatePath('/sales/requests');
    revalidatePath('/sales/orders');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to cancel transaction:', error);
    return { success: false, error: error.message || 'Gagal membatalkan pesanan' };
  }
}

export async function removeItemFromTransaction(data: {
  transactionId: string;
  itemId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }

    await TransactionService.removeItem(data.transactionId, data.itemId, session.user.id, session.user.role);

    revalidatePath('/admin/transactions');
    revalidatePath('/super-admin/transactions');
    revalidatePath('/sales/requests');
    revalidatePath('/sales/orders');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to remove item:', error);
    return { success: false, error: error.message || 'Gagal menghapus item dari pesanan' };
  }
}

export async function addPayment(data: {
  transactionId: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }

    await TransactionService.addPayment(data, session.user.id, session.user.role);

    revalidatePath('/admin/transactions');
    revalidatePath('/super-admin/transactions');
    revalidatePath('/sales/requests');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to add payment:', error);
    return { success: false, error: error.message || 'Gagal menambahkan pembayaran' };
  }
}
