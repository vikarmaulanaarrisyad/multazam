import React from 'react';
import Link from 'next/link';
import { Home, Package, ShoppingCart, Users, LogOut, Menu, MapPin } from 'lucide-react';
import { auth, signOut } from '@/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

export default async function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const session = await auth();

  const menuItems = [
    { name: 'Dashboard', href: `/${role.toLowerCase().replace('_', '-')}`, icon: Home },
    { name: 'Produk', href: `/${role.toLowerCase().replace('_', '-')}/products`, icon: Package },
    { name: 'Transaksi', href: `/${role.toLowerCase().replace('_', '-')}/transactions`, icon: ShoppingCart },
    { name: 'Kunjungan', href: `/${role.toLowerCase().replace('_', '-')}/visits`, icon: MapPin },
  ];

  if (role === 'SUPER_ADMIN') {
    menuItems.push({ name: 'Pengguna', href: '/super-admin/users', icon: Users });
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-primary">DIA MAKMUR ABADI</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
          <button className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm font-medium text-gray-700">
              {session?.user?.name || session?.user?.email}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
