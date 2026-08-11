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
  items: { productId: string; quantity: number; condition: ReturnCondition; price: number; unitNote?: string }[];
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
            create: await Promise.all(data.items.map(async item => {
              const product = await tx.product.findUnique({ 
                where: { id: item.productId },
                include: { unitConversions: true }
              });
              const baseQty = product ? calculateBaseQuantity(item.quantity, item.unitNote || product.purchaseUnit, product) : item.quantity;
              
              return {
                productId: item.productId,
                quantity: baseQty,
                condition: item.condition,
                price: item.price,
                unitNote: item.unitNote || (product as any).purchaseUnit || 'PCS',
                totalPrice: Number(item.quantity) * Number(item.price)
              };
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
    // Check moved inside transaction for atomicity

    // Process inventory inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Atomic check and update to prevent Double Approve
      const updateResult = await tx.returnTransaction.updateMany({
        where: { id: returnId, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          adminNotes: adminNotes
        }
      });
      
      if (updateResult.count === 0) {
        throw new Error('Retur sudah diproses sebelumnya (Mungkin disetujui/ditolak oleh admin lain)');
      }

      let totalRefundValue = 0;
      
      for (const item of ret.items) {
        const product = await tx.product.findUnique({ 
          where: { id: item.productId }
        });
        if (!product) continue;
        
        const baseQty = item.quantity; // Already converted to baseQty during createReturn

        if (ret.type === 'EXCHANGE') {
          if (item.condition === 'BAD') {
            const updatedProducts = await tx.product.updateMany({
              where: { id: product.id, stock: { gte: baseQty } },
              data: {
                stock: { decrement: baseQty },
                badStock: { increment: baseQty }
              }
            });
            
            if (updatedProducts.count === 0) {
              throw new Error(`Stok bagus untuk produk ${product.name} tidak cukup untuk Tukar Guling`);
            }
            
            const updatedProduct = await tx.product.findUnique({ where: { id: product.id }});
            if (!updatedProduct) continue;
            
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
          
          totalRefundValue += Number((item as any).totalPrice || 0);
        }
      }

      if (ret.type === 'REFUND' && ret.transactionId && totalRefundValue > 0) {
        const transaction = await tx.transaction.findUnique({ where: { id: ret.transactionId }});
        if (transaction) {
          const newTotalAmount = Math.max(0, Number(transaction.totalAmount) - totalRefundValue);
          const paymentStatus = Number(transaction.paidAmount) >= newTotalAmount ? 'PAID' : (Number(transaction.paidAmount) > 0 ? 'PARTIAL' : 'UNPAID');
          
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              totalAmount: newTotalAmount,
              paymentStatus: paymentStatus
            }
          });
        }
      }

      // Status update is already done atomically at the beginning of the transaction
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

    const updateResult = await prisma.returnTransaction.updateMany({
      where: { id: returnId, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        adminNotes: adminNotes
      }
    });

    if (updateResult.count === 0) {
      return { success: false, error: 'Retur sudah diproses (Tidak bisa ditolak lagi)' };
    }

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
