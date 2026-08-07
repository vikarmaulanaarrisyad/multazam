'use client';

import Link from 'next/link';
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
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'SUPER_ADMIN';
  className?: string;
  onNavigate?: () => void; // Used to close sheet on mobile
}

export function AdminSidebar({ role, className, onNavigate }: SidebarProps) {
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
      title: 'Persetujuan Harga',
      href: `${basePath}/approvals`,
      icon: ClipboardCheck,
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
      title: 'Daftar Pre-Order',
      href: `${basePath}/transactions`,
      icon: ShoppingCart,
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
      title: 'Sinkronisasi',
      href: `${basePath}/sync`,
      icon: DatabaseZap,
      visible: role === 'SUPER_ADMIN',
    },
    {
      title: 'Pengaturan',
      href: `${basePath}/settings`,
      icon: Settings,
      visible: true,
    },
  ];

  return (
    <div className={cn("flex h-full flex-col bg-slate-900 text-slate-100", className)}>
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="bg-primary text-primary-foreground p-1 rounded-md">M</span>
          MULTAZAM
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
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
            Hubungi dukungan teknis Multazam.
          </p>
        </div>
      </div>
    </div>
  );
}
