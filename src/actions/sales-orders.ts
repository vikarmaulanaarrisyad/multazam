'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { PreOrderSchema } from './preorder.schema.ts';
import { ApiResponse } from '../types/api-response';

export interface PreOrderData {
  customerName: string;
  customerPhone: string;
  shippingAddress?: string;
  shippingCost?: number;
  dpAmount?: number;
  dueDate: Date;
  notes?: string;
  latitude?: number;
  longitude?: number;
  ownerName?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    originalPrice?: number;
  }[];
  clonedFromId?: string;
}

export async function createPreOrder(data: PreOrderData): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    // Validate input data
    const parseResult = PreOrderSchema.safeParse(data);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error.message };
    }
    data = parseResult.data;

    // Generate unique Invoice Number using atomic upsert on InvoiceCounter
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counter = await prisma.$transaction(async (tx) => {
      return await tx.invoiceCounter.upsert({
        where: { date: dateStr },
        update: { counter: { increment: 1 } },
        create: { date: dateStr, counter: 1 },
      });
    });
    const invoiceNumber = `PO-${dateStr}-${counter.counter.toString().padStart(4, '0')}`;

    // Calculate total amount and original amount
    const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalOriginalAmount = data.items.reduce((sum, item) => sum + ((item.originalPrice ?? item.price) * item.quantity), 0);
    
    const isPriceProposal = totalAmount < totalOriginalAmount;

    // Ensure dpAmount is a number
    const dpAmount = Number(data.dpAmount ?? 0);

    // Create the transaction inside a Prisma transaction block to ensure data consistency
    const transaction = await prisma.$transaction(async (tx) => {
      // 0. Auto-save new store if it doesn't exist
      if (data.customerName) {
        const existingStore = await tx.store.findFirst({
          where: { userId: session.user.id, name: data.customerName }
        });

        if (!existingStore) {
          await tx.store.create({
            data: {
              userId: session.user.id,
              name: data.customerName,
              ownerName: data.ownerName || data.customerName,
              phone: data.customerPhone || null,
              address: data.shippingAddress || '',
              latitude: data.latitude,
              longitude: data.longitude
            }
          });
        }
      }

      // 1. Create the Transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          userId: session.user.id,
          totalAmount,
          status: isPriceProposal ? 'PENDING_APPROVAL' : 'PENDING',
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress || null,
          shippingCost: data.shippingCost || null,
          dueDate: data.dueDate,
          notes: data.notes,
          latitude: data.latitude,
          longitude: data.longitude,
          paidAmount: dpAmount,
          paymentStatus: (dpAmount && dpAmount >= Number(totalAmount)) ? 'PAID' : (dpAmount && dpAmount > 0) ? 'PARTIAL' : 'UNPAID',
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              originalPrice: item.originalPrice || item.price
            }))
          }
        }
      });

      // 1.2 If this is a clone, mark the old transaction as reordered
      if (data.clonedFromId) {
        await tx.transaction.update({
          where: { id: data.clonedFromId },
          data: { hasBeenReordered: true }
        });
      }


      // 1.5 Record DP in PaymentHistory if there's any
      if (data.dpAmount && data.dpAmount > 0) {
        await tx.paymentHistory.create({
          data: {
            transactionId: newTransaction.id,
            amount: data.dpAmount,
            paymentMethod: 'CASH', // default for DP via Sales App
            notes: 'Uang Muka (DP) saat pembuatan pesanan',
            userId: session.user.id
          }
        });
      }

      // 2. Deduct stock for each item and record StockMovement
      for (const item of data.items) {
        if (!item.productId) {
          throw new Error('ID Produk tidak valid pada salah satu pesanan.');
        }

        // Find product
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }
        
        // Decrement stock
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        });
        if (updated.count === 0) {
          throw new Error(`Stok produk ${product.name} tidak mencukupi.`);
        }

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            balanceBefore: product.stock,
            balanceAfter: product.stock - item.quantity,
            reference: invoiceNumber,
            notes: isPriceProposal ? 'Booking (Menunggu Persetujuan)' : 'Penjualan / Pre-Order',
            userId: session.user.id
          }
        });
      }

      return newTransaction;
    }, {
      maxWait: 10000, // 10 seconds max wait to connect to prisma
      timeout: 20000  // 20 seconds timeout for the entire transaction
    });

    revalidatePath('/sales');
    revalidatePath('/sales/requests');
    
    return { success: true, data: { id: transaction.id } };
  } catch (error: any) {
    console.error('Failed to create pre-order:', error);
    return { success: false, error: error.message || 'Failed to submit pre-order' };
  }
}
