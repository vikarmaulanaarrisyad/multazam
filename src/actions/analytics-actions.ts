'use server';

import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { auth } from '@/auth';

export async function getDashboardAnalytics(months = 6) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized / Akses Ditolak' };
    }
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    // Optimized: Use DB aggregation instead of loading all transactions into RAM
    const monthPromises = Array.from({ length: months }, (_, i) => {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(subMonths(today, i));
      
      return (async () => {
        // 1. Get Revenue via Prisma Aggregate
        const revAgg = await prisma.transaction.aggregate({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: { in: ['COMPLETED', 'SHIPPED', 'APPROVED'] }
          },
          _sum: { totalAmount: true }
        });
        const rev = Number(revAgg._sum.totalAmount || 0);

        // 2. Get COGS via Raw SQL (Since Prisma aggregate doesn't support column multiplication)
        const cogsResult: any[] = await prisma.$queryRaw`
          SELECT SUM(ti.quantity * COALESCE(ti."purchasePrice", 0)) as "totalCogs"
          FROM "TransactionItem" ti
          JOIN "Transaction" t ON t.id = ti."transactionId"
          WHERE t."createdAt" >= ${monthStart} 
            AND t."createdAt" <= ${monthEnd}
            AND t.status IN ('COMPLETED', 'SHIPPED', 'APPROVED')
        `;
        const cogs = Number(cogsResult[0]?.totalCogs || 0);

        return {
          month: format(monthStart, 'MMM yyyy', { locale: id }),
          revenue: rev,
          profit: rev - cogs,
          cogs: cogs,
          index: i
        };
      })();
    });

    const resolvedTrendData = await Promise.all(monthPromises);
    resolvedTrendData.sort((a, b) => b.index - a.index); // Oldest first

    const currentMonthData = resolvedTrendData.find(d => d.index === 0);
    const currentRevenue = currentMonthData?.revenue || 0;
    const currentCogs = currentMonthData?.cogs || 0;
    const currentGrossProfit = currentMonthData?.profit || 0;

    const trendData = resolvedTrendData.map(d => ({
      month: d.month,
      revenue: d.revenue,
      profit: d.profit,
      cogs: d.cogs
    }));

    // 3. Top 5 Products
    const topProductsRaw = await prisma.transactionItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5,
    });

    const productIds = topProductsRaw.map(p => p.productId);
    const productsData = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const topProducts = topProductsRaw.map(p => {
      const product = productsData.find(prod => prod.id === p.productId);
      return {
        name: product?.name || 'Unknown',
        soldQuantity: p._sum.quantity || 0,
      };
    });

    // 4. Dead Stock (Stock > 0 but 0 sales in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeProductIds = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          createdAt: {
            gte: thirtyDaysAgo
          },
          status: {
            in: ['COMPLETED', 'SHIPPED', 'APPROVED']
          }
        }
      },
      select: { productId: true },
      distinct: ['productId']
    });

    const activeIds = activeProductIds.map(a => a.productId);

    const deadStock = await prisma.product.findMany({
      where: {
        id: { notIn: activeIds },
        stock: { gt: 0 }
      },
      orderBy: { stock: 'desc' },
      take: 10,
    });

    const serializedDeadStock = deadStock.map(p => ({
      ...p,
      price: p.price ? Number(p.price) : 0,
      minPrice: p.minPrice ? Number(p.minPrice) : null,
      purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : null,
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
      retailEndDate: p.retailEndDate ? p.retailEndDate.toISOString() : null,
    }));

    // 5. Top 5 Customers
    const topCustomersRaw = await prisma.transaction.groupBy({
      by: ['customerName'],
      _sum: {
        totalAmount: true
      },
      where: {
        status: { in: ['COMPLETED', 'SHIPPED', 'APPROVED'] },
        customerName: { not: null }
      },
      orderBy: {
        _sum: { totalAmount: 'desc' }
      },
      take: 5
    });

    const topCustomers = topCustomersRaw.map(c => ({
      name: c.customerName || 'Anonim',
      totalSpent: Number(c._sum.totalAmount || 0)
    }));

    return {
      success: true,
      data: {
        currentRevenue,
        currentCogs,
        currentGrossProfit,
        trendData,
        topProducts,
        deadStock: serializedDeadStock,
        topCustomers
      }
    };

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return { success: false, error: 'Gagal mengambil data analitik' };
  }
}
