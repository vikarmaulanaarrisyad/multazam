'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function getDashboardStats() {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
      throw new Error('Akses ditolak');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Filter valid transactions (not cancelled or rejected)
    const validStatus = ['COMPLETED', 'SHIPPED', 'APPROVED', 'PENDING', 'PENDING_APPROVAL'];

    // Fetch transactions
    const [
      todayTx,
      monthTx,
      yearTx,
      totalProducts,
      totalCategories,
      recentActivities
    ] = await Promise.all([
      // Today's revenue
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: { in: validStatus }
        },
        _sum: { totalAmount: true }
      }),
      // Month's revenue and count
      prisma.transaction.findMany({
        where: {
          createdAt: { gte: startOfMonth },
          status: { in: validStatus }
        },
        select: { totalAmount: true, createdAt: true }
      }),
      // Year's revenue and chart data
      prisma.transaction.findMany({
        where: {
          createdAt: { gte: startOfYear },
          status: { in: validStatus }
        },
        select: { totalAmount: true, createdAt: true }
      }),
      // Counts
      prisma.product.count(),
      prisma.category.count(),
      // Recent Activities
      prisma.transaction.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      })
    ]);

    const todayRevenue = Number(todayTx._sum.totalAmount || 0);
    const monthRevenue = monthTx.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    const yearRevenue = yearTx.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    const newTransactions = monthTx.length;

    // Process Chart Data (Jan - Dec)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const chartData = monthNames.map((name, index) => {
      // Find transactions in this month
      const monthSum = yearTx
        .filter(tx => tx.createdAt.getMonth() === index)
        .reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
      
      return {
        name,
        total: monthSum
      };
    });

    const serializedActivities = recentActivities.map(act => ({
      ...act,
      totalAmount: Number(act.totalAmount),
      shippingCost: act.shippingCost ? Number(act.shippingCost) : null,
      paidAmount: Number(act.paidAmount)
    }));

    return {
      success: true,
      data: {
        todayRevenue,
        monthRevenue,
        yearRevenue,
        totalProducts,
        totalCategories,
        newTransactions,
        recentActivities: serializedActivities,
        chartData
      }
    };
  } catch (error: any) {
    console.error('Failed to fetch dashboard stats:', error);
    return { success: false, error: 'Gagal memuat data dashboard' };
  }
}
