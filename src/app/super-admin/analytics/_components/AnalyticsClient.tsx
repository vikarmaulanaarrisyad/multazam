'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

interface AnalyticsData {
  currentRevenue: number;
  currentCogs: number;
  currentGrossProfit: number;
  trendData: { month: string; revenue: number; profit: number; cogs: number }[];
  topProducts: { name: string; soldQuantity: number }[];
  deadStock: any[];
  topCustomers: { name: string; totalSpent: number }[];
}

export default function AnalyticsClient({ initialData }: { initialData: AnalyticsData | null }) {
  const [data] = useState<AnalyticsData | null>(initialData);

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow">
        <p className="text-slate-500">Tidak ada data atau gagal memuat analitik.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Penjualan (Bulan Ini)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(data.currentRevenue)}</div>
            <p className="text-xs text-blue-600 mt-1">Estimasi total nilai invoice</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total HPP / Modal</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(data.currentCogs)}</div>
            <p className="text-xs text-red-600 mt-1">Estimasi Harga Pokok Penjualan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Laba Kotor (Gross Profit)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(data.currentGrossProfit)}</div>
            <p className="text-xs text-green-600 mt-1">Keuntungan sebelum operasional</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Penjualan & Laba (6 Bulan Terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`} />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Penjualan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Laba Kotor" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-500" />
              Top 5 Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-slate-800">{p.name}</span>
                  </div>
                  <span className="text-slate-600 font-semibold">{p.soldQuantity} Terjual</span>
                </div>
              ))}
              {data.topProducts.length === 0 && (
                <p className="text-slate-500 text-center py-4">Belum ada data penjualan.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-500" />
              Top 5 Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCustomers.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-slate-800">{c.name}</span>
                  </div>
                  <span className="text-teal-700 font-bold">{formatCurrency(c.totalSpent)}</span>
                </div>
              ))}
              {data.topCustomers.length === 0 && (
                <p className="text-slate-500 text-center py-4">Belum ada data pelanggan.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Dead Stock */}
      <Card className="border-orange-200">
        <CardHeader className="bg-orange-50/50 border-b border-orange-100">
          <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
            Perhatian: Stok Menganggur (Dead Stock)
          </CardTitle>
          <p className="text-sm text-orange-600">
            Produk dengan stok &gt; 0 tetapi belum ada penjualan selama 30 hari terakhir.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {data.deadStock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3">Stok Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deadStock.map((ds, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{ds.code}</td>
                      <td className="px-4 py-3">{ds.name}</td>
                      <td className="px-4 py-3 font-bold text-orange-600">{ds.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Hebat! Tidak ada stok menganggur saat ini.
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
