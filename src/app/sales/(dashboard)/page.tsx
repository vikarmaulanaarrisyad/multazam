import React from 'react';
import { CalendarCheck, TrendingUp, Clock, AlertCircle, MapPin, ShoppingCart, PackageSearch, Receipt, RefreshCcw } from 'lucide-react';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import Link from 'next/link';

export default async function SalesDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Jalankan semua kueri secara paralel untuk performa yang lebih baik (Mencegah N+1 Sequential)
  const [
    salesTarget,
    monthlySalesResult,
    dailySalesResult,
    yearlySalesResult,
    accumulatedSalesResult,
    totalOrders,
    pendingApprovals,
    recentTransactions,
    todaysVisits
  ] = await Promise.all([
    // 1. Target Penjualan Bulan Ini
    prisma.salesTarget.findFirst({
      where: {
        userId: session.user.id,
        periodType: 'MONTHLY',
        startDate: { gte: startOfMonth },
      },
      orderBy: { createdAt: 'desc' }
    }),
    
    // 2. Monthly Sales Result
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: { not: 'CANCELLED' }, // Sesuai kesepakatan: total nilai pesanan (Invoice)
        createdAt: { gte: startOfMonth }
      },
      _sum: { totalAmount: true, shippingCost: true }
    }),

    // 2.1 Daily Sales Result
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: { not: 'CANCELLED' },
        createdAt: { gte: startOfToday, lte: endOfToday }
      },
      _sum: { totalAmount: true, shippingCost: true }
    }),

    // 2.2 Yearly Sales Result
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: { not: 'CANCELLED' },
        createdAt: { gte: startOfYear }
      },
      _sum: { totalAmount: true, shippingCost: true }
    }),

    // 2.3 Accumulated Sales Result
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        status: { not: 'CANCELLED' }
      },
      _sum: { totalAmount: true, shippingCost: true }
    }),

    // 3. Jumlah Pesanan Bulan Ini
    prisma.transaction.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: startOfMonth }
      }
    }),

    // 4. Menunggu Persetujuan
    prisma.transaction.count({
      where: {
        userId: session.user.id,
        status: 'PENDING_APPROVAL'
      }
    }),

    // 5. Pesanan Terbaru (5 Transaksi Terakhir)
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    // 6. Kunjungan Hari Ini
    prisma.visit.findMany({
      where: {
        userId: session.user.id,
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        }
      },
      include: {
        store: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })
  ]);

  const targetSales = salesTarget ? Number(salesTarget.targetAmount) : 0;
  
  const dailySales = Number(dailySalesResult._sum.totalAmount || 0) + Number(dailySalesResult._sum.shippingCost || 0);
  const monthlySales = Number(monthlySalesResult._sum.totalAmount || 0) + Number(monthlySalesResult._sum.shippingCost || 0);
  const yearlySales = Number(yearlySalesResult._sum.totalAmount || 0) + Number(yearlySalesResult._sum.shippingCost || 0);
  const accumulatedSales = Number(accumulatedSalesResult._sum.totalAmount || 0) + Number(accumulatedSalesResult._sum.shippingCost || 0);
  
  const totalSales = monthlySales; // Keep totalSales for progress target computation
  const progressPercent = targetSales > 0 ? Math.min(Math.round((totalSales / targetSales) * 100), 100) : 0;

  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-24 h-full">
      {/* Target Progress Card */}
      <section className="bg-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Target Penjualan Bulanan</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              Rp {(totalSales / 1000000).toFixed(1)}Jt 
              {targetSales > 0 ? (
                <span className="text-sm font-normal text-slate-500"> / Rp {(targetSales / 1000000).toFixed(1)}Jt</span>
              ) : (
                <span className="text-sm font-normal text-slate-500"> / (Belum diatur)</span>
              )}
            </div>
          </div>
          <div className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-md shadow-sm">
            {progressPercent}%
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
            <div className="bg-primary h-full rounded-full relative transition-all duration-1000" style={{ width: `${progressPercent}%` }}>
              {progressPercent > 0 && (
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-full animate-[shimmer_2s_infinite]"></div>
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-primary">Tercapai: Rp {(totalSales / 1000000).toFixed(1)}Jt</span>
            <span className="text-slate-500">
              Sisa: {targetSales > 0 ? `Rp ${Math.max((targetSales - totalSales) / 1000000, 0).toFixed(1)}Jt` : '-'}
            </span>
          </div>
        </div>
      </section>

      {/* Ringkasan Pendapatan Grid */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Ringkasan Pendapatan</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Harian</span>
            <span className="text-sm font-bold text-slate-900">Rp {(dailySales / 1000000).toFixed(1)}Jt</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bulanan</span>
            <span className="text-sm font-bold text-slate-900">Rp {(monthlySales / 1000000).toFixed(1)}Jt</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tahunan</span>
            <span className="text-sm font-bold text-slate-900">Rp {(yearlySales / 1000000).toFixed(1)}Jt</span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col gap-1 bg-primary/5 border-primary/20">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Total Keseluruhan</span>
            <span className="text-sm font-bold text-primary">Rp {(accumulatedSales / 1000000).toFixed(1)}Jt</span>
          </div>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 gap-4">
        {/* Total Orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ShoppingCart className="text-emerald-700 w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <TrendingUp className="w-3 h-3 font-bold" />
              <span className="text-[11px] font-bold">Aktif</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Pesanan</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {totalOrders} <span className="text-sm font-normal text-slate-500">Bulan ini</span>
            </div>
          </div>
        </div>

        {/* Approvals KPI */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Clock className="text-red-600 w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <AlertCircle className="w-3 h-3 font-bold" />
              <span className="text-[11px] font-bold">{pendingApprovals}</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">Menunggu Persetujuan</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {pendingApprovals} <span className="text-sm font-normal text-slate-500">Pesanan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Aksi Cepat</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x no-scrollbar">
          <Link href="/sales/new-order" className="snap-start flex-none w-28 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm group">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <ShoppingCart className="text-emerald-700 w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-900 text-center leading-tight">Buat<br/>Pesanan</span>
          </Link>
          
          <Link href="/sales/requests" className="snap-start flex-none w-28 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm group">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Receipt className="text-blue-700 w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-900 text-center leading-tight">Riwayat<br/>Pesanan</span>
          </Link>

          <Link href="/sales/products" className="snap-start flex-none w-28 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm group">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <PackageSearch className="text-amber-700 w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-900 text-center leading-tight">Katalog<br/>Produk</span>
          </Link>

          <Link href="/sales/returns" className="snap-start flex-none w-28 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm group">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
              <RefreshCcw className="text-rose-700 w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-900 text-center leading-tight">Ajukan<br/>Retur</span>
          </Link>
        </div>
      </section>

      {/* Today's Visits */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-slate-900">Kunjungan Hari Ini</h2>
          <Link href="/sales/visits" className="text-primary text-xs font-medium px-2 py-1 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors">Lihat Jadwal Lengkap</Link>
        </div>
        
        <div className="flex flex-col gap-2">
          {todaysVisits.length > 0 ? (
            todaysVisits.map((visit: any) => (
              <div key={visit.id} className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-4 border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <MapPin className="text-blue-600 w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{visit.store.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{visit.store.address}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-900">
                    {new Date(visit.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${visit.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : visit.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {visit.status === 'COMPLETED' ? 'Selesai' : visit.status === 'CANCELLED' ? 'Batal' : 'Terjadwal'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
              Tidak ada jadwal kunjungan hari ini.
            </div>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-slate-900">Pesanan Terbaru</h2>
          <Link href="/sales/requests" className="text-primary text-xs font-medium px-2 py-1 bg-primary/10 rounded-md hover:bg-primary/20 transition-colors">Lihat Semua</Link>
        </div>
        
        <div className="flex flex-col gap-2">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx: any) => (
              <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-slate-200 hover:border-primary/50 transition-colors cursor-pointer">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                  tx.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  tx.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {tx.customerName ? tx.customerName.substring(0, 2).toUpperCase() : 'NN'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{tx.customerName || 'Pelanggan Umum'}</h3>
                  <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                    <span className="text-xs truncate">{tx.invoiceNumber}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-900">
                    Rp {Number(tx.totalAmount).toLocaleString('id-ID')}
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                    tx.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    tx.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {tx.status === 'PENDING_APPROVAL' ? 'PENDING' : tx.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              Belum ada pesanan terbaru.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
