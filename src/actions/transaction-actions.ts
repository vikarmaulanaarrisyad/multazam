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
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isSales = session.user.role === 'SALES';
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    if (!isAdmin && !isSales) {
      return { success: false, error: 'Unauthorized' };
    }

    if (isSales && data.status !== 'COMPLETED') {
      return { success: false, error: 'Sales hanya diizinkan mengubah status menjadi selesai' };
    }

    if (isSales) {
      const tx = await prisma.transaction.findUnique({
        where: { id: data.transactionId },
        select: { userId: true }
      });
      if (!tx || tx.userId !== session.user.id) {
        return { success: false, error: 'Anda tidak memiliki akses ke pesanan ini' };
      }
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
    if (!session?.user?.id) {
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

      // If user is SALES, ensure it's their transaction
      if (session.user.role === 'SALES' && transaction.userId !== session.user.id) {
        throw new Error('Unauthorized');
      }

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
    }, { maxWait: 10000, timeout: 20000 });

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

export async function addPayment(data: {
  transactionId: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tx = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      select: { totalAmount: true, paidAmount: true }
    });

    if (!tx) {
      return { success: false, error: 'Pesanan tidak ditemukan' };
    }

    const newPaidAmount = Number(tx.paidAmount) + data.amount;
    let paymentStatus = 'PARTIAL';
    if (newPaidAmount >= Number(tx.totalAmount)) {
      paymentStatus = 'PAID';
    } else if (newPaidAmount <= 0) {
      paymentStatus = 'UNPAID';
    }

    await prisma.$transaction(async (prismaTx) => {
      await prismaTx.paymentHistory.create({
        data: {
          transactionId: data.transactionId,
          amount: data.amount,
          paymentMethod: data.paymentMethod || 'CASH',
          notes: data.notes,
          userId: session.user.id
        }
      });

      await prismaTx.transaction.update({
        where: { id: data.transactionId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: paymentStatus
        }
      });
    });

    revalidatePath('/admin/transactions');
    revalidatePath('/super-admin/transactions');
    revalidatePath('/sales/requests');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to add payment:', error);
    return { success: false, error: error.message || 'Gagal menambahkan pembayaran' };
  }
}
