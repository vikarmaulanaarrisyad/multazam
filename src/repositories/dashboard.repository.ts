import prisma from '@/lib/prisma';

export class DashboardRepository {
  static async getDashboardData(startOfToday: Date, startOfMonth: Date, startOfYear: Date, validStatus: string[]) {
    return Promise.all([
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
      }),
      // Pending Actions
      prisma.transaction.count({ where: { status: 'PENDING' } }), // Menunggu Pengiriman
      prisma.transaction.count({ where: { status: 'PENDING_APPROVAL' } }), // Menunggu Persetujuan Harga
      prisma.returnTransaction.count({ where: { status: 'PENDING' } }), // Pengajuan Retur
      // Low Stock Products
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        take: 5,
        orderBy: { stock: 'asc' },
        select: { id: true, name: true, code: true, stock: true }
      })
    ]);
  }
}
