'use server';

import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { id } from 'date-fns/locale';

export async function getDashboardAnalytics(months = 6) {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    // 1. Get total revenue and cogs for current month
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
        status: {
          in: ['COMPLETED', 'SHIPPED', 'APPROVED'] // Only consider successful transactions
        }
      },
      include: {
        items: true,
      }
    });

    let currentRevenue = 0;
    let currentCogs = 0;

    currentMonthTransactions.forEach(tx => {
      currentRevenue += Number(tx.totalAmount);
      tx.items.forEach(item => {
        // Fallback to 0 if purchasePrice is not available
        const itemCogs = Number(item.purchasePrice || 0) * item.quantity;
        currentCogs += itemCogs;
      });
    });

    const currentGrossProfit = currentRevenue - currentCogs;

    // 2. Monthly Trend Data (last N months)
    const trendData = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(subMonths(today, i));
      
      const txs = await prisma.transaction.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['COMPLETED', 'SHIPPED', 'APPROVED'] }
        },
        include: { items: true }
      });

      let rev = 0;
      let cogs = 0;
      txs.forEach(tx => {
        rev += Number(tx.totalAmount);
        tx.items.forEach(item => {
          cogs += Number(item.purchasePrice || 0) * item.quantity;
        });
      });

      trendData.push({
        month: format(monthStart, 'MMM yyyy', { locale: id }),
        revenue: rev,
        profit: rev - cogs,
        cogs: cogs
      });
    }

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
        deadStock,
        topCustomers
      }
    };

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return { success: false, error: 'Gagal mengambil data analitik' };
  }
}
