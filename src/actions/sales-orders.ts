'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ApiResponse } from '../types/api-response';
import { PreOrderData } from '@/types/transaction.type';
import { TransactionService } from '@/services/transaction.service';
import { logAudit } from '@/actions/audit-actions';

import prisma from '@/lib/prisma';

export async function createPreOrder(data: PreOrderData): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    const transaction = await TransactionService.createPreOrder(data, session.user.id);
    
    // Log creation
    await logAudit('CREATE', 'TRANSACTION', transaction.id, `Pesanan baru dibuat: ${transaction.invoiceNumber}`);

    revalidatePath('/sales');
    revalidatePath('/sales/requests');
    
    return { success: true, data: { id: transaction.id } };
  } catch (error: any) {
    console.error('Failed to create pre-order:', error);
    return { success: false, error: error.message || 'Failed to submit pre-order' };
  }
}

export async function getLastPurchasedPrices(customerName: string): Promise<ApiResponse<Record<string, { price: number; date: string; unitNote?: string }>>> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    if (!customerName || !customerName.trim()) {
      return { success: true, data: {} };
    }

    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          customerName: { equals: customerName.trim(), mode: 'insensitive' },
          status: { in: ['COMPLETED', 'SHIPPED', 'APPROVED', 'PENDING'] }
        }
      },
      orderBy: {
        transaction: {
          createdAt: 'desc'
        }
      },
      select: {
        productId: true,
        price: true,
        unitNote: true,
        transaction: {
          select: {
            createdAt: true
          }
        }
      },
      take: 100
    });

    const result: Record<string, { price: number; date: string; unitNote?: string }> = {};
    
    for (const item of items) {
      if (!result[item.productId]) {
        result[item.productId] = {
          price: Number(item.price),
          date: item.transaction.createdAt.toISOString(),
          unitNote: item.unitNote || undefined
        };
      }
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to fetch last purchased prices:', error);
    return { success: false, error: error.message || 'Failed to fetch last purchased prices' };
  }
}
