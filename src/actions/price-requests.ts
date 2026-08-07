'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export interface PriceRequestData {
  storeName: string;
  storeLocation: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    requestedPrice: number;
    originalPrice: number;
  }[];
}

export async function createPriceRequest(data: PriceRequestData) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate Request Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.transaction.count({
      where: {
        invoiceNumber: {
          startsWith: `REQ-${dateStr}`
        }
      }
    });
    const invoiceNumber = `REQ-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    // Calculate total requested amount
    const totalAmount = data.items.reduce((sum, item) => sum + (item.requestedPrice * item.quantity), 0);

    // Combine storeName and storeLocation into customer fields, and put justification into notes
    const transaction = await prisma.transaction.create({
      data: {
        invoiceNumber,
        userId: session.user.id,
        totalAmount,
        status: 'PENDING_APPROVAL',
        customerName: data.storeName,
        customerPhone: data.storeLocation,
        notes: data.notes,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.requestedPrice,
            originalPrice: item.originalPrice
          }))
        }
      }
    });

    revalidatePath('/sales');
    revalidatePath('/sales/requests');
    
    return { success: true, data: transaction };
  } catch (error: any) {
    console.error('Failed to create price request:', error);
    return { success: false, error: error.message || 'Failed to submit price request' };
  }
}
