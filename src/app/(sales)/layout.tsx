import React from 'react';
import Link from 'next/link';
import { Home, ShoppingCart, User, PlusCircle } from 'lucide-react';
import { auth } from '@/auth';

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header Mobile */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-bold text-primary">Multazam Sales</h1>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {session?.user?.name?.charAt(0).toUpperCase() || 'S'}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-md mx-auto bg-white shadow-sm h-full">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around items-center h-16 md:hidden z-20 pb-safe">
        <Link href="/sales" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary">
          <Home size={24} />
          <span className="text-[10px] mt-1 font-medium">Beranda</span>
        </Link>
        <Link href="/sales/transactions/new" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary">
          <div className="bg-primary text-white p-3 rounded-full -mt-6 shadow-lg">
            <PlusCircle size={24} />
          </div>
          <span className="text-[10px] mt-1 font-medium">Buat Transaksi</span>
        </Link>
        <Link href="/sales/profile" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary">
          <User size={24} />
          <span className="text-[10px] mt-1 font-medium">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
