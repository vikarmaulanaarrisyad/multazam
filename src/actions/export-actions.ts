'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function getSalesExportData(month: number, year: number) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized / Akses Ditolak' };
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['COMPLETED', 'SHIPPED', 'APPROVED', 'PENDING', 'PENDING_APPROVAL']
        }
      },
      include: {
        items: {
          include: {
            product: { select: { code: true, name: true, purchaseUnit: true } }
          }
        },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, data: transactions };
  } catch (error: any) {
    console.error('Error fetching sales export data:', error);
    return { success: false, error: 'Gagal mengambil data penjualan.' };
  }
}

export async function getDeadStockExportData(days: number = 30) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized / Akses Ditolak' };
    }

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    // Get active products in the last 'days'
    const activeProductIdsRaw = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          createdAt: { gte: pastDate },
          status: { in: ['COMPLETED', 'SHIPPED', 'APPROVED'] }
        }
      },
      select: { productId: true },
      distinct: ['productId']
    });
    
    const activeIds = activeProductIdsRaw.map(a => a.productId);

    // Find products with stock > 0 but NOT in activeIds
    const deadStocks = await prisma.product.findMany({
      where: {
        id: { notIn: activeIds },
        stock: { gt: 0 }
      },
      include: {
        category: { select: { name: true } },
        unit: { select: { name: true } }
      },
      orderBy: { stock: 'desc' }
    });

    return { success: true, data: deadStocks };
  } catch (error: any) {
    console.error('Error fetching dead stock data:', error);
    return { success: false, error: 'Gagal mengambil data stok mematung.' };
  }
}
