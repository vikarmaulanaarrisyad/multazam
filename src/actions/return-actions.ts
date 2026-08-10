'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ReturnCondition, ReturnType, ReturnStatus, MovementType } from '@/generated/prisma/client';

export async function createReturn(data: {
  transactionId?: string;
  customerName: string;
  userId: string;
  type: ReturnType;
  notes?: string;
  items: { productId: string; quantity: number; condition: ReturnCondition; price: number }[];
}) {
  try {
    // Generate return number
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    
    // Counter logic based on local day
    const startOfDay = new Date(yyyy, today.getMonth(), today.getDate());
    const count = await prisma.returnTransaction.count({
      where: {
        createdAt: {
          gte: startOfDay,
        }
      }
    });
    const returnNumber = `RET-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    const newReturn = await prisma.returnTransaction.create({
      data: {
        returnNumber,
        transactionId: data.transactionId || null,
        customerName: data.customerName,
        userId: data.userId,
        type: data.type,
        notes: data.notes,
        status: 'PENDING',
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            condition: item.condition,
            price: item.price,
          }))
        }
      }
    });

    revalidatePath('/sales/returns');
    revalidatePath('/admin/returns');
    return { success: true, data: newReturn };
  } catch (error: any) {
    console.error('Error creating return:', error);
    return { success: false, error: error.message || 'Gagal membuat retur' };
  }
}

export async function approveReturn(returnId: string, adminNotes?: string) {
  try {
    const ret = await prisma.returnTransaction.findUnique({
      where: { id: returnId },
      include: { items: true }
    });

    if (!ret) throw new Error('Data retur tidak ditemukan');
    if (ret.status !== 'PENDING') throw new Error('Retur sudah diproses sebelumnya');

    // Process inventory
    for (const item of ret.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      if (ret.type === 'EXCHANGE') {
        // Exchange means we take the returned item and give a new one from good stock.
        // If condition is BAD, we add to badStock and deduct from good stock.
        // If condition is GOOD (rare for exchange but possible), net stock is 0.
        if (item.condition === 'BAD') {
          if (product.stock < item.quantity) {
            throw new Error(`Stok bagus untuk produk ${product.name} tidak cukup untuk Tukar Guling`);
          }
          await prisma.product.update({
            where: { id: product.id },
            data: {
              stock: { decrement: item.quantity },
              badStock: { increment: item.quantity }
            }
          });
          
          // Log movement for the new item given to customer
          await prisma.stockMovement.create({
            data: {
              productId: product.id,
              type: 'RETURN', // We use RETURN to indicate it's part of a return process, or OUT. 
              // Actually, since we added RETURN to MovementType, let's use it.
              quantity: item.quantity,
              balanceBefore: product.stock,
              balanceAfter: product.stock - item.quantity,
              reference: `Tukar Guling: ${ret.returnNumber}`,
              notes: 'Pemberian barang pengganti (Good Stock)'
            }
          });
        }
      } else if (ret.type === 'REFUND') {
        // Refund means customer just gives back the item.
        if (item.condition === 'BAD') {
          await prisma.product.update({
            where: { id: product.id },
            data: { badStock: { increment: item.quantity } }
          });
        } else {
          await prisma.product.update({
            where: { id: product.id },
            data: { stock: { increment: item.quantity } }
          });
          // Log movement for stock in
          await prisma.stockMovement.create({
            data: {
              productId: product.id,
              type: 'RETURN',
              quantity: item.quantity,
              balanceBefore: product.stock,
              balanceAfter: product.stock + item.quantity,
              reference: `Refund: ${ret.returnNumber}`,
              notes: 'Pengembalian barang kondisi bagus'
            }
          });
        }
      }
    }

    await prisma.returnTransaction.update({
      where: { id: returnId },
      data: {
        status: 'APPROVED',
        adminNotes: adminNotes
      }
    });

    revalidatePath('/admin/returns');
    revalidatePath('/sales/returns');
    return { success: true };
  } catch (error: any) {
    console.error('Error approving return:', error);
    return { success: false, error: error.message || 'Gagal menyetujui retur' };
  }
}

export async function rejectReturn(returnId: string, adminNotes?: string) {
  try {
    await prisma.returnTransaction.update({
      where: { id: returnId },
      data: {
        status: 'REJECTED',
        adminNotes: adminNotes
      }
    });
    revalidatePath('/admin/returns');
    revalidatePath('/sales/returns');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menolak retur' };
  }
}

export async function getReturns(role: 'ADMIN' | 'SALES', userId?: string) {
  try {
    const where = role === 'SALES' && userId ? { userId } : {};
    const returns = await prisma.returnTransaction.findMany({
      where,
      include: {
        items: {
          include: { product: true }
        },
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: returns };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data retur' };
  }
}

export async function getReturnById(id: string) {
  try {
    const ret = await prisma.returnTransaction.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
        user: { select: { name: true } },
        transaction: true
      }
    });
    if (!ret) throw new Error('Retur tidak ditemukan');
    return { success: true, data: ret };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data retur' };
  }
}
