'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { TransactionService } from '@/services/transaction.service';
import { logAudit } from '@/actions/audit-actions';

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
    await logAudit('UPDATE', 'TRANSACTION', data.transactionId, `Mengubah status menjadi: ${data.status}`);

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
    await logAudit('UPDATE', 'TRANSACTION', data.transactionId, `Membatalkan pesanan. Alasan: ${data.adminNotes}`);

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
    await logAudit('DELETE', 'TRANSACTION_ITEM', data.transactionId, `Menghapus item ${data.itemId} dari pesanan`);

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
    await logAudit('CREATE', 'PAYMENT', data.transactionId, `Menambahkan pembayaran sebesar Rp${data.amount}`);

    revalidatePath('/admin/transactions');
    revalidatePath('/super-admin/transactions');
    revalidatePath('/sales/requests');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to add payment:', error);
    return { success: false, error: error.message || 'Gagal menambahkan pembayaran' };
  }
}

export async function updateTransactionDeliveryDate(data: {
  transactionId: string;
  deliveryDate: Date | null;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return { success: false, error: 'Hanya Admin yang dapat mengubah tanggal pengiriman.' };
    }

    await TransactionService.updateDeliveryDate(data.transactionId, data.deliveryDate);
    
    const formattedDate = data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString('id-ID') : 'Belum ditentukan';
    await logAudit('UPDATE', 'TRANSACTION', data.transactionId, `Mengubah tanggal pengiriman menjadi: ${formattedDate}`);

    revalidatePath('/admin/transactions');
    revalidatePath('/super-admin/transactions');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update delivery date:', error);
    return { success: false, error: error.message || 'Gagal mengubah tanggal pengiriman' };
  }
}
