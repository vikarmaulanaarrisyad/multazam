'use client';

import React, { useState } from 'react';
import { Package, Tags, ShoppingCart, DollarSign, WalletCards, TrendingUp, TrendingDown, Clock, AlertTriangle, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { DeliveryRecapModal } from './DeliveryRecapModal';
import { DeliveryManifestModal } from './DeliveryManifestModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { ExportReports } from './ExportReports';
import { AutoRefreshTimer } from '@/components/layout/AutoRefreshTimer';
import { Truck } from 'lucide-react';

interface Activity {
  id: string;
  invoiceNumber: string;
  user: { name: string | null };
  createdAt: Date;
  status: string;
  totalAmount: any;
}

interface DashboardClientProps {
  data: {
    todayRevenue: number;
    monthRevenue: number;
    monthProfit: number;
    yearRevenue: number;
    totalProducts: number;
    totalCategories: number;
    newTransactions: number;
    recentActivities: Activity[];
    chartData: { name: string; total: number; profit?: number }[];
    pendingActions?: {
      shipment: number;
      approval: number;
      returns: number;
    };
    lowStockProducts?: { id: string; name: string; code: string; stock: number }[];
    pendingDeliveries?: {
      id: string;
      invoiceNumber: string;
      customerName: string | null;
      totalAmount: number;
      deliveryDate: Date | null;
      createdAt: Date;
      user: { name: string | null };
    }[];
  };
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export function DashboardClient({ data, role }: DashboardClientProps) {
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);

  const formatRupiah = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}M`; // Milyar
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}Jt`; // Juta
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700 text-[10px] font-bold">Menunggu</span>;
      case 'PENDING_APPROVAL': return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">Butuh Persetujuan</span>;
      case 'APPROVED': return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">Disetujui</span>;
      case 'SHIPPED': return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">Dikirim</span>;
      case 'COMPLETED': return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">Selesai</span>;
      case 'CANCELLED': return <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">Batal</span>;
      case 'REJECTED': return <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">Ditolak</span>;
      default: return null;
    }
  };

  const getTimeAgo = (date: Date | string) => {
    if (!date) return '-';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';
    const diff = Math.floor((new Date().getTime() - parsed.getTime()) / 1000);
    if (diff < 0) return 'baru saja';
    if (diff < 60) return `${diff} dtk lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hr lalu`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl min-w-50">
          <p className="text-slate-500 font-bold text-xs mb-3 border-b border-slate-100 pb-2">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs text-slate-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Omset (Kotor)</span>
              <span className="font-bold text-blue-700 text-sm">Rp {payload[0]?.value?.toLocaleString('id-ID')}</span>
            </div>
            {payload[1] && (
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-slate-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Laba Bersih</span>
                <span className="font-bold text-emerald-700 text-sm">Rp {payload[1].value?.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Beranda {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            </h1>
            <AutoRefreshTimer intervalMinutes={5} />
          </div>
          <p className="text-sm text-slate-500 mt-1">Ringkasan analitik dan aktivitas terkini toko Anda.</p>
        </div>
        <ExportReports />
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Month's Revenue */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-linear-to-bl from-blue-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Omset Bulan Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(data.monthRevenue)}</h3>
            </div>
            <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-md">
            Pendapatan Kotor
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-linear-to-bl from-emerald-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Laba Bersih Bulan Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(data.monthProfit || 0)}</h3>
            </div>
            <div className="p-3 bg-linear-to-br from-emerald-400 to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            Estimasi Profit
          </div>
        </div>

        {/* Total Transactions (Month) */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-linear-to-bl from-indigo-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Transaksi Bulan Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{data.newTransactions}</h3>
            </div>
            <div className="p-3 bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-md">
            Transaksi Aktif
          </div>
        </div>

        {/* Catalog Stats */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-24 h-24 bg-linear-to-bl from-violet-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Produk</p>
              <h3 className="text-lg font-bold text-slate-900">{data.totalProducts}</h3>
            </div>
            <div className="p-2 bg-linear-to-br from-violet-500 to-fuchsia-600 text-white rounded-lg shadow-md shadow-violet-500/30"><Package className="w-4 h-4" /></div>
          </div>
          <div className="flex justify-between items-center pt-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Kategori</p>
              <h3 className="text-lg font-bold text-slate-900">{data.totalCategories}</h3>
            </div>
            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Tags className="w-4 h-4" /></div>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {data.pendingActions && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Tugas Tertunda
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Shipment */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold shrink-0">
                {data.pendingActions.shipment}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Menunggu Pengiriman</p>
                <p className="text-xs text-slate-500 mt-0.5">Pesanan baru masuk</p>
              </div>
            </div>
            {/* Approval */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-100 text-amber-600 font-bold shrink-0">
                {data.pendingActions.approval}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Butuh Persetujuan</p>
                <p className="text-xs text-slate-500 mt-0.5">Nego Harga dari Sales</p>
              </div>
            </div>
            {/* Returns */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-100 text-orange-600 font-bold shrink-0">
                {data.pendingActions.returns}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Pengajuan Retur</p>
                <p className="text-xs text-slate-500 mt-0.5">Barang rusak / tukar guling</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Queue Widget */}
      {data.pendingDeliveries && data.pendingDeliveries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" /> Antrean Pengiriman
              </h3>
              <p className="text-sm text-slate-500 mt-1">Daftar pesanan yang menunggu untuk dikirim, diurutkan berdasarkan tanggal pengiriman terdekat.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsManifestModalOpen(true)}
                className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Truck className="w-4 h-4" /> Surat Jalan & Manifest Driver
              </button>
              <button 
                onClick={() => setIsRecapModalOpen(true)}
                className="text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm border border-slate-200"
              >
                <FileSpreadsheet className="w-4 h-4" /> Rekap Gudang
              </button>
              <a href={`/${role === 'SUPER_ADMIN' ? 'super-admin' : 'admin'}/transactions`} className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Tgl Kirim</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">No. Invoice</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Toko / Pelanggan</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Sales</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right pr-2">Total Estimasi</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingDeliveries.map((delivery) => {
                  const isTodayOrPast = delivery.deliveryDate && new Date(delivery.deliveryDate).getTime() <= new Date().getTime();
                  return (
                    <tr key={delivery.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3 pl-2">
                        {delivery.deliveryDate ? (
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold",
                            isTodayOrPast ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                          )}>
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(delivery.deliveryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">Tidak ditentukan</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-sm font-bold text-slate-900">{delivery.invoiceNumber}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm font-medium text-slate-700">{delivery.customerName || '-'}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{delivery.user?.name || '-'}</span>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <span className="text-sm font-bold text-blue-700">{formatRupiah(delivery.totalAmount)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Statistik Omset & Laba Tahunan</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                <span>Total Omset: <strong className="text-slate-900">{formatRupiah(data.yearRevenue)}</strong></span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>Total Laba: <strong className="text-emerald-600">{formatRupiah(data.chartData.reduce((s, c) => s + (c.profit || 0), 0))}</strong></span>
              </p>
            </div>
          </div>
          <div className="flex-1 w-full h-75">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `Rp ${value / 1000000}Jt`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Omset"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  name="Laba Bersih"
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 mb-6">Aktivitas Transaksi Terbaru</h3>
          <div className="space-y-5">
            {data.recentActivities.length > 0 ? (
              data.recentActivities.map((act, i) => (
                <div key={act.id} className="flex gap-4 relative">
                  {/* Timeline line */}
                  {i !== data.recentActivities.length - 1 && (
                    <div className="absolute left-5 top-10 w-0.5 h-full bg-slate-100"></div>
                  )}
                  
                  <div className="w-10 h-10 rounded-full bg-blue-50 border-4 border-white flex items-center justify-center text-blue-600 font-bold shrink-0 z-10">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 pb-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-900">
                        {act.invoiceNumber}
                      </p>
                      <span suppressHydrationWarning className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {getTimeAgo(act.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-slate-500">
                        Oleh: <span className="font-medium text-slate-700">{act.user?.name || 'Sales'}</span>
                      </div>
                      {getStatusBadge(act.status)}
                    </div>
                    <div className="text-xs font-bold text-blue-700 mt-2 bg-slate-50 p-2 rounded-lg inline-block">
                      Rp {Number(act.totalAmount).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                Belum ada aktivitas transaksi
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Additional Alerts Row */}
      {data.lowStockProducts && data.lowStockProducts.length > 0 && (
        <div className="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-5 mt-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-bl-full -mr-4 -mt-4"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" /> Peringatan Stok Menipis
              </h3>
              <p className="text-sm text-red-700/80 mt-1">Produk berikut memiliki stok kurang dari 10 dan perlu segera di-restock.</p>
            </div>
            <a href={`/${role === 'SUPER_ADMIN' ? 'super-admin' : 'admin'}/purchases`} className="hidden sm:flex items-center gap-2 text-sm font-bold text-red-700 bg-white px-4 py-2 rounded-xl shadow-sm hover:bg-red-100 transition-colors">
              Pesan Restock <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 relative z-10">
            {data.lowStockProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-red-100/50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 mb-1 block">{product.code}</span>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{product.name}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Sisa Stok:</span>
                  <span className="text-lg font-black text-red-600">{product.stock}</span>
                </div>
              </div>
            ))}
          </div>

          <a href={`/${role === 'SUPER_ADMIN' ? 'super-admin' : 'admin'}/purchases`} className="sm:hidden mt-4 flex justify-center items-center gap-2 text-sm font-bold text-red-700 bg-white px-4 py-3 rounded-xl shadow-sm w-full relative z-10">
            Pesan Restock Sekarang
          </a>
        </div>
      )}

      <DeliveryRecapModal 
        isOpen={isRecapModalOpen} 
        onClose={() => setIsRecapModalOpen(false)} 
      />

      <DeliveryManifestModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
      />
    </div>
  );
}
