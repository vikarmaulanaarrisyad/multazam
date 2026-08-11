'use client';

import React from 'react';
import { Package, Tags, ShoppingCart, DollarSign, WalletCards, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { ExportReports } from './ExportReports';

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
    yearRevenue: number;
    totalProducts: number;
    totalCategories: number;
    newTransactions: number;
    recentActivities: Activity[];
    chartData: { name: string; total: number }[];
  };
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export function DashboardClient({ data, role }: DashboardClientProps) {
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

  const getTimeAgo = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff} dtk lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hr lalu`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
          <p className="text-slate-500 font-medium text-xs mb-1">{label}</p>
          <p className="font-bold text-blue-700">Rp {payload[0].value.toLocaleString('id-ID')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Beranda {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
          </h1>
          <p className="text-sm text-slate-500">Ringkasan analitik dan aktivitas terkini toko Anda.</p>
        </div>
        <ExportReports />
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Omset Hari Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(data.todayRevenue)}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            <TrendingUp className="w-3.5 h-3.5" /> Berjalan Hari Ini
          </div>
        </div>

        {/* Month's Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Omset Bulan Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(data.monthRevenue)}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <WalletCards className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-md">
            Akumulasi Bulanan
          </div>
        </div>

        {/* Total Transactions (Month) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Transaksi Bulan Ini</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{data.newTransactions}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            Transaksi Aktif
          </div>
        </div>

        {/* Catalog Stats */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-24 h-24 bg-violet-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Produk</p>
              <h3 className="text-lg font-bold text-slate-900">{data.totalProducts}</h3>
            </div>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><Package className="w-4 h-4" /></div>
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

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Statistik Omset Tahunan</h3>
              <p className="text-xs text-slate-500 mt-1">Total Omset Tahun Ini: <strong className="text-slate-900">{formatRupiah(data.yearRevenue)}</strong></p>
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
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
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
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {getTimeAgo(act.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-slate-500">
                        Oleh: <span className="font-medium text-slate-700">{act.user.name || 'Sales'}</span>
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
    </div>
  );
}
