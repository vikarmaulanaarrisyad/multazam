import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Users, DatabaseZap, DollarSign, Activity } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beranda Super Admin</h1>
          <p className="text-sm text-slate-500">Kendali penuh atas sistem dan aktivitas Multazam.</p>
        </div>
        <Link href="/super-admin/sync" className={buttonVariants({ className: "flex items-center gap-2" })}>
          <DatabaseZap className="h-4 w-4" />
          Jalankan Sinkronisasi
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users/Staff */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-slate-500">2 Admin, 10 Sales</p>
          </CardContent>
        </Card>

        {/* Database Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Database</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Sehat</div>
            <p className="text-xs text-slate-500">Sinkronisasi terakhir: 2 jam lalu</p>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,231</div>
            <p className="text-xs text-slate-500">+12% dari bulan lalu</p>
          </CardContent>
        </Card>

        {/* Active Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-slate-500">Dalam 15 Kategori</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Performa Cabang / Sales</CardTitle>
            <CardDescription>Pendapatan yang dihasilkan oleh tim sales bulan ini.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-64 w-full bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-sm">
              Grafik Bar Kinerja Sales
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Log Sistem</CardTitle>
            <CardDescription>Catatan aktivitas penting dalam sistem.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DatabaseZap className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Sinkronisasi Database</p>
                  <p className="text-xs text-slate-500">Selesai dalam 4.2 detik.</p>
                </div>
                <div className="ml-auto font-medium text-xs text-slate-500">2j</div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Login Super Admin</p>
                  <p className="text-xs text-slate-500">Dari IP 192.168.1.1</p>
                </div>
                <div className="ml-auto font-medium text-xs text-slate-500">5j</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-orange-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Stok Produk Menipis</p>
                  <p className="text-xs text-slate-500">Produk "Parfum Oud" sisa 3</p>
                </div>
                <div className="ml-auto font-medium text-xs text-slate-500">1h</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
