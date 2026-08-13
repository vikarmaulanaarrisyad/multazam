'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Boxes,
  Users,
  BarChart3,
  LogOut,
  DatabaseZap,
  Settings,
  Ruler,
  ArrowRightLeft,
  Truck,
  ClipboardCheck,
  Store,
  MapPin,
  ShieldAlert,
  FileSpreadsheet,
  Database,
  Target
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'SUPER_ADMIN';
  className?: string;
  onNavigate?: () => void; // Used to close sheet on mobile
  logoUrl?: string | null;
}

export function AdminSidebar({ role, className, onNavigate, logoUrl }: SidebarProps) {
  const pathname = usePathname();
  const basePath = role === 'SUPER_ADMIN' ? '/super-admin' : '/admin';

  const menuItems = [
    {
      title: 'Dashboard',
      href: basePath,
      icon: LayoutDashboard,
      visible: true,
    },
    {
      title: 'Produk',
      href: `${basePath}/products`,
      icon: Package,
      visible: true,
    },

    {
      title: 'Kategori',
      href: `${basePath}/categories`,
      icon: Tags,
      visible: true,
    },
    {
      title: 'Satuan',
      href: `${basePath}/units`,
      icon: Ruler,
      visible: true,
    },
    {
      title: 'Daftar Pesanan',
      href: `${basePath}/transactions`,
      icon: ShoppingCart,
      visible: true,
    },
    {
      title: 'Persetujuan Retur',
      href: `${basePath}/returns`,
      icon: ClipboardCheck,
      visible: true,
    },
    {
      title: 'Pembelian (Restock)',
      href: `${basePath}/purchases`,
      icon: ShoppingCart,
      visible: true,
    },
    {
      title: 'Data Supplier',
      href: `${basePath}/suppliers`,
      icon: Truck,
      visible: true,
    },
    {
      title: 'Riwayat Stok',
      href: `${basePath}/stock-movements`,
      icon: ArrowRightLeft,
      visible: true,
    },
    {
      title: 'Karyawan',
      href: `${basePath}/users`,
      icon: Users,
      visible: role === 'SUPER_ADMIN',
    },
    {
      title: 'Target Penjualan',
      href: `${basePath}/targets`,
      icon: Target,
      visible: true,
    },
    {
      title: 'Sinkronisasi',
      href: `${basePath}/sync`,
      icon: DatabaseZap,
      visible: role === 'SUPER_ADMIN',
    },
    {
      title: 'Analisis & Laba Rugi',
      href: `${basePath}/analytics`,
      icon: BarChart3,
      visible: role === 'SUPER_ADMIN',
    },
    {
      title: 'Pusat Laporan',
      href: `${basePath}/reports`,
      icon: FileSpreadsheet,
      visible: true,
    },
    {
      title: 'Tugaskan Kunjungan',
      href: `${basePath}/visits`,
      icon: MapPin,
      visible: true,
    },
    {
      title: 'Data Toko',
      href: `${basePath}/stores`,
      icon: Store,
      visible: true,
    },
    {
      title: 'Persetujuan Harga',
      href: `${basePath}/approvals`,
      icon: ClipboardCheck,
      visible: true,
    },
    {
      title: 'Pengaturan',
      href: `${basePath}/settings`,
      icon: Settings,
      visible: true,
    },
    {
      title: 'Backup Data',
      href: `${basePath}/settings/backup`,
      icon: Database,
      visible: role === 'SUPER_ADMIN',
    },
    {
      title: 'Log Aktivitas',
      href: `${basePath}/audit-logs`,
      icon: ShieldAlert,
      visible: true,
    },
  ];

  return (
    <div className={cn("flex h-full flex-col bg-slate-900 text-slate-100", className)}>
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo" width={32} height={32} className="h-8 w-auto rounded object-contain bg-white p-1" priority />
          ) : (
            <span className="bg-primary text-primary-foreground p-1 rounded-md">M</span>
          )}
          <span className="truncate">DIA MAKMUR ABADI</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
          {role.replace('_', ' ')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.filter(item => item.visible).map((item) => {
            const isActive = item.href === basePath 
              ? pathname === basePath
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-1"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", !isActive && "group-hover:scale-110")} />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Keluar
        </button>
        <div className="rounded-lg bg-slate-800 p-4">
          <p className="text-sm font-medium text-white">Butuh bantuan?</p>
          <p className="mt-1 text-xs text-slate-400">
            Hubungi dukungan teknis DIA MAKMUR ABADI.
          </p>
        </div>
      </div>
    </div>
  );
}
