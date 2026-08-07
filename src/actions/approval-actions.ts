'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function approvePriceRequest(data: {
  transactionId: string;
  adminNotes?: string;
  items: { id: string; approvedPrice: number }[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update each item's price
    let newTotalAmount = 0;
    
    // Using transaction to ensure all updates succeed or fail together
    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const updatedItem = await tx.transactionItem.update({
          where: { id: item.id },
          data: { price: item.approvedPrice }
        });
        newTotalAmount += (Number(updatedItem.price) * updatedItem.quantity);
      }

      // Update the main transaction
      await tx.transaction.update({
        where: { id: data.transactionId },
        data: {
          status: 'APPROVED',
          adminNotes: data.adminNotes || null,
          totalAmount: newTotalAmount,
        }
      });
    });

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
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.adminNotes || data.adminNotes.trim() === '') {
      return { success: false, error: 'Alasan penolakan harus diisi.' };
    }

    await prisma.$transaction(async (tx) => {
      // Find transaction with its items to restore stock
      const transaction = await tx.transaction.findUnique({
        where: { id: data.transactionId },
        include: { items: true }
      });

      if (!transaction) throw new Error('Transaction not found');

      // Reject transaction
      await tx.transaction.update({
        where: { id: data.transactionId },
        data: {
          status: 'REJECTED',
          adminNotes: data.adminNotes,
        }
      });

      // Restore stock for each item
      for (const item of transaction.items) {
        // Need to fetch current product stock to set balanceBefore and balanceAfter
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
            notes: 'Pengembalian Stok (Pengajuan Ditolak)'
          }
        });
      }
    });

    revalidatePath('/admin/approvals');
    revalidatePath('/super-admin/approvals');
    revalidatePath('/sales/requests');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reject price request:', error);
    return { success: false, error: error.message || 'Failed to reject request' };
  }
}
