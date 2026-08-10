'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ReturnCondition, ReturnType, ReturnStatus, MovementType } from '@/generated/prisma/client';
import { auth } from '@/auth';
import { calculateBaseQuantity } from '@/utils/inventory';

export async function createReturn(data: {
  transactionId?: string;
  customerName: string;
  userId: string;
  type: ReturnType;
  notes?: string;
  items: { productId: string; quantity: number; condition: ReturnCondition; price: number }[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate return number
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    
    // Counter logic based on local day inside transaction to minimize race conditions
    const startOfDay = new Date(yyyy, today.getMonth(), today.getDate());
    
    const newReturn = await prisma.$transaction(async (tx) => {
      const counterKey = `RET-${dateStr}`;
      const counter = await tx.invoiceCounter.upsert({
        where: { date: counterKey },
        update: { counter: { increment: 1 } },
        create: { date: counterKey, counter: 1 }
      });
      const returnNumber = `RET-${dateStr}-${counter.counter.toString().padStart(4, '0')}`;

      return tx.returnTransaction.create({
        data: {
          returnNumber,
          transactionId: data.transactionId || null,
          customerName: data.customerName,
          userId: session.user.id,
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
    }, {
      maxWait: 10000,
      timeout: 20000
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
    const session = await auth();
    if (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    const ret = await prisma.returnTransaction.findUnique({
      where: { id: returnId },
      include: { items: true }
    });

    if (!ret) throw new Error('Data retur tidak ditemukan');
    if (ret.status !== 'PENDING') throw new Error('Retur sudah diproses sebelumnya');

    // Process inventory inside a transaction
    await prisma.$transaction(async (tx) => {
      for (const item of ret.items) {
        const product = await tx.product.findUnique({ 
          where: { id: item.productId },
          include: { unitConversions: true } 
        });
        if (!product) continue;
        
        const baseQty = calculateBaseQuantity(item.quantity, product.purchaseUnit, product);

        if (ret.type === 'EXCHANGE') {
          if (item.condition === 'BAD') {
            if (product.stock < baseQty) {
              throw new Error(`Stok bagus untuk produk ${product.name} tidak cukup untuk Tukar Guling`);
            }
            const updatedProduct = await tx.product.update({
              where: { id: product.id },
              data: {
                stock: { decrement: baseQty },
                badStock: { increment: baseQty }
              }
            });
            
            await tx.stockMovement.create({
              data: {
                productId: product.id,
                type: 'RETURN',
                quantity: baseQty,
                balanceBefore: updatedProduct.stock + baseQty,
                balanceAfter: updatedProduct.stock,
                reference: `Tukar Guling: ${ret.returnNumber}`,
                notes: `Pemberian barang pengganti (Good Stock) - Order: ${item.quantity} ${product.purchaseUnit || 'PCS'}`,
                userId: ret.userId
              }
            });
          }
        } else if (ret.type === 'REFUND') {
          if (item.condition === 'BAD') {
            await tx.product.update({
              where: { id: product.id },
              data: { badStock: { increment: baseQty } }
            });
          } else {
            const updatedProduct = await tx.product.update({
              where: { id: product.id },
              data: { stock: { increment: baseQty } }
            });
            await tx.stockMovement.create({
              data: {
                productId: product.id,
                type: 'RETURN',
                quantity: baseQty,
                balanceBefore: updatedProduct.stock - baseQty,
                balanceAfter: updatedProduct.stock,
                reference: `Refund: ${ret.returnNumber}`,
                notes: `Pengembalian barang kondisi bagus - Order: ${item.quantity} ${product.purchaseUnit || 'PCS'}`,
                userId: ret.userId
              }
            });
          }
        }
      }

      await tx.returnTransaction.update({
        where: { id: returnId },
        data: {
          status: 'APPROVED',
          adminNotes: adminNotes
        }
      });
    }, {
      maxWait: 10000,
      timeout: 20000
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
    const session = await auth();
    if (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

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
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Override params with actual session data for security
    const actualRole = session.user.role;
    const actualUserId = session.user.id;
    
    const where = actualRole === 'SALES' ? { userId: actualUserId } : {};
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
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role) {
      return { success: false, error: 'Unauthorized' };
    }

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
    
    if (session.user.role === 'SALES' && ret.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return { success: true, data: ret };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil data retur' };
  }
}
