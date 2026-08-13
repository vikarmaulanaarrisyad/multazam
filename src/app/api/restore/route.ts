import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    
    if (!session || userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Validasi data
    if (!data || !data.users || !data.products) {
      return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 });
    }

    const currentUserId = session.user.id;

    // Lakukan Restore di dalam transaksi agar bisa di-rollback jika gagal
    await prisma.$transaction(async (tx) => {
      // 1. HAPUS SEMUA DATA (Mulai dari child / relasi terbawah)
      await tx.auditLog.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.invoiceCounter.deleteMany({});
      await tx.stockMovement.deleteMany({});
      await tx.returnItem.deleteMany({});
      await tx.returnTransaction.deleteMany({});
      await tx.paymentHistory.deleteMany({});
      await tx.transactionItem.deleteMany({});
      await tx.transaction.deleteMany({});
      await tx.purchaseItem.deleteMany({});
      await tx.purchase.deleteMany({});
      await tx.visit.deleteMany({});
      await tx.store.deleteMany({});
      await tx.unitConversion.deleteMany({});
      await tx.product.deleteMany({});
      await tx.category.deleteMany({});
      await tx.unit.deleteMany({});
      await tx.supplier.deleteMany({});
      await tx.setting.deleteMany({});
      
      // Hapus semua user kecuali user yang sedang melakukan restore
      await tx.user.deleteMany({
        where: { id: { not: currentUserId } }
      });

      // 2. MASUKKAN DATA (Mulai dari parent / tabel utama)
      
      // Filter users untuk menghindari duplicate ID admin yang sedang login
      const usersToInsert = data.users.filter((u: any) => u.id !== currentUserId);
      if (usersToInsert.length > 0) await tx.user.createMany({ data: usersToInsert, skipDuplicates: true });
      
      if (data.categories?.length > 0) await tx.category.createMany({ data: data.categories });
      if (data.units?.length > 0) await tx.unit.createMany({ data: data.units });
      if (data.suppliers?.length > 0) await tx.supplier.createMany({ data: data.suppliers });
      if (data.settings?.length > 0) await tx.setting.createMany({ data: data.settings });
      if (data.invoiceCounters?.length > 0) await tx.invoiceCounter.createMany({ data: data.invoiceCounters });
      if (data.notifications?.length > 0) await tx.notification.createMany({ data: data.notifications });
      
      if (data.stores?.length > 0) await tx.store.createMany({ data: data.stores });
      if (data.products?.length > 0) await tx.product.createMany({ data: data.products });
      if (data.unitConversions?.length > 0) await tx.unitConversion.createMany({ data: data.unitConversions });
      
      if (data.visits?.length > 0) await tx.visit.createMany({ data: data.visits });
      if (data.purchases?.length > 0) await tx.purchase.createMany({ data: data.purchases });
      if (data.purchaseItems?.length > 0) await tx.purchaseItem.createMany({ data: data.purchaseItems });
      
      if (data.transactions?.length > 0) await tx.transaction.createMany({ data: data.transactions });
      if (data.transactionItems?.length > 0) await tx.transactionItem.createMany({ data: data.transactionItems });
      if (data.paymentHistories?.length > 0) await tx.paymentHistory.createMany({ data: data.paymentHistories });
      
      if (data.returnTransactions?.length > 0) await tx.returnTransaction.createMany({ data: data.returnTransactions });
      if (data.returnItems?.length > 0) await tx.returnItem.createMany({ data: data.returnItems });
      if (data.stockMovements?.length > 0) await tx.stockMovement.createMany({ data: data.stockMovements });
      if (data.auditLogs?.length > 0) await tx.auditLog.createMany({ data: data.auditLogs });
    }, {
      maxWait: 10000, // 10 seconds max wait for connection
      timeout: 60000, // 60 seconds max transaction time
    });

    return NextResponse.json({ success: true, message: 'Restore berhasil dilakukan.' });
  } catch (error: any) {
    console.error('Restore Error:', error);
    return NextResponse.json({ error: 'Gagal melakukan restore. Database tidak berubah. Detail: ' + error.message }, { status: 500 });
  }
}
