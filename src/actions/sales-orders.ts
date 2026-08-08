'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

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
}

export async function createPreOrder(data: PreOrderData) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate Invoice Number (e.g. PO-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.transaction.count({
      where: {
        invoiceNumber: {
          startsWith: `PO-${dateStr}`
        }
      }
    });
    const invoiceNumber = `PO-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    // Calculate total amount and original amount
    const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalOriginalAmount = data.items.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
    
    const isPriceProposal = totalAmount < totalOriginalAmount;

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
          paidAmount: data.dpAmount || 0,
          paymentStatus: (data.dpAmount && data.dpAmount >= totalAmount) ? 'PAID' : (data.dpAmount && data.dpAmount > 0) ? 'PARTIAL' : 'UNPAID',
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

        // Find product to ensure enough stock
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stok produk ${product?.name || 'tidak diketahui'} tidak mencukupi.`);
        }

        // Decrement stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });

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
