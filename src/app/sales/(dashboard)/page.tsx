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
  
  // 1. Total Penjualan Bulan Ini (Target = 150M)
  const monthlySalesResult = await prisma.transaction.aggregate({
    where: {
      userId: session.user.id,
      status: { in: ['COMPLETED', 'SHIPPED', 'APPROVED', 'PENDING', 'PENDING_APPROVAL'] },
      createdAt: { gte: startOfMonth }
    },
    _sum: { totalAmount: true }
  });
  const totalSales = Number(monthlySalesResult._sum.totalAmount || 0);
  const targetSales = 150000000;
  const progressPercent = Math.min(Math.round((totalSales / targetSales) * 100), 100);

  // 2. Jumlah Pesanan Bulan Ini
  const totalOrders = await prisma.transaction.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: startOfMonth }
    }
  });

  // 3. Menunggu Persetujuan
  const pendingApprovals = await prisma.transaction.count({
    where: {
      userId: session.user.id,
      status: 'PENDING_APPROVAL'
    }
  });

  // 4. Pesanan Terbaru (5 Transaksi Terakhir)
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // 5. Kunjungan Hari Ini
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const todaysVisits = await prisma.visit.findMany({
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
  });

  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-24 h-full">
      {/* Target Progress Card */}
      <section className="bg-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Target Penjualan Bulanan</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              Rp {(totalSales / 1000000).toFixed(1)}Jt <span className="text-sm font-normal text-slate-500">/ Rp 150Jt</span>
            </div>
          </div>
          <div className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-md shadow-sm">
            {progressPercent}%
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
            <div className="bg-primary h-full rounded-full relative transition-all duration-1000" style={{ width: `${progressPercent}%` }}>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-primary">Tercapai: Rp {(totalSales / 1000000).toFixed(1)}Jt</span>
            <span className="text-slate-500">Sisa: Rp {Math.max((targetSales - totalSales) / 1000000, 0).toFixed(1)}Jt</span>
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
            todaysVisits.map((visit) => (
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
            recentTransactions.map((tx) => (
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
