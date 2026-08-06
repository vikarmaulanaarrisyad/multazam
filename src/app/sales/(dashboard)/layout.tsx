import React from 'react';
import Link from 'next/link';
import { Home, Package, ClipboardList, User, Bell } from 'lucide-react';
import { auth } from '@/auth';

export default async function SalesDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex flex-col w-full h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Header / Greeting */}
      <header className="px-4 py-4 pt-safe bg-white flex flex-col gap-2 shadow-sm z-10 relative border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-sm relative overflow-hidden text-primary">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Selamat pagi, {session?.user?.name || 'Sales'}</h1>
              <p className="text-sm text-slate-500">Sales Representative • Jakarta</p>
            </div>
          </div>
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {children}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-18 pb-safe z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Link href="/sales" className="flex flex-col items-center gap-1 p-2 text-primary w-20 group">
          <div className="w-12 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Home className="w-5 h-5 font-bold" />
          </div>
          <span className="text-[11px] font-bold">Home</span>
        </Link>
        <Link href="/sales/orders" className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-slate-900 transition-colors w-20 group">
          <div className="w-12 h-8 rounded-full flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium">Orders</span>
        </Link>
        <Link href="/sales/requests" className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-slate-900 transition-colors w-20 group">
          <div className="w-12 h-8 rounded-full flex items-center justify-center relative group-hover:bg-slate-100 transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </div>
          <span className="text-[11px] font-medium">Requests</span>
        </Link>
        <Link href="/sales/profile" className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-slate-900 transition-colors w-20 group">
          <div className="w-12 h-8 rounded-full flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
