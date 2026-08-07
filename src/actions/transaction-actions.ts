'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function updateTransactionStatus(data: {
  transactionId: string;
  status: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        status: data.status,
        ...(data.notes ? { adminNotes: data.notes } : {})
      }
    });

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
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.adminNotes || data.adminNotes.trim() === '') {
      return { success: false, error: 'Alasan pembatalan harus diisi.' };
    }

    await prisma.$transaction(async (tx) => {
      // Find transaction with its items to restore stock
      const transaction = await tx.transaction.findUnique({
        where: { id: data.transactionId },
        include: { items: true }
      });

      if (!transaction) throw new Error('Pesanan tidak ditemukan');

      // Reject/Cancel transaction
      await tx.transaction.update({
        where: { id: data.transactionId },
        data: {
          status: 'CANCELLED',
          adminNotes: data.adminNotes,
        }
      });

      // Restore stock for each item
      for (const item of transaction.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) continue;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        // Record stock movement back IN
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            balanceBefore: product.stock,
            balanceAfter: product.stock + item.quantity,
            reference: transaction.invoiceNumber,
            notes: `Pengembalian stok dari pesanan dibatalkan: ${data.adminNotes}`,
            userId: session.user.id
          }
        });
      }
    });

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
