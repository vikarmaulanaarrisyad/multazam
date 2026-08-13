import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    // Gunakan any cast untuk menghindari type error jika session.user.role tidak terdeklarasi di NextAuth type default
    const userRole = (session?.user as any)?.role;
    
    if (!session || userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized, hanya SUPER_ADMIN yang diizinkan' }, { status: 401 });
    }

    // Export semua tabel secara komprehensif
    const data = {
      users: await prisma.user.findMany(),
      categories: await prisma.category.findMany(),
      units: await prisma.unit.findMany(),
      products: await prisma.product.findMany(),
      unitConversions: await prisma.unitConversion.findMany(),
      stores: await prisma.store.findMany(),
      visits: await prisma.visit.findMany(),
      suppliers: await prisma.supplier.findMany(),
      purchases: await prisma.purchase.findMany(),
      purchaseItems: await prisma.purchaseItem.findMany(),
      transactions: await prisma.transaction.findMany(),
      transactionItems: await prisma.transactionItem.findMany(),
      paymentHistories: await prisma.paymentHistory.findMany(),
      returnTransactions: await prisma.returnTransaction.findMany(),
      returnItems: await prisma.returnItem.findMany(),
      stockMovements: await prisma.stockMovement.findMany(),
      invoiceCounters: await prisma.invoiceCounter.findMany(),
      notifications: await prisma.notification.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      settings: await prisma.setting.findMany(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Backup Error:', error);
    return NextResponse.json({ error: 'Gagal membuat backup' }, { status: 500 });
  }
}
