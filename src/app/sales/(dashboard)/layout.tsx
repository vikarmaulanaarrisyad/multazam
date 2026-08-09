import React from 'react';
import { User } from 'lucide-react';
import { auth } from '@/auth';
import { LogoutButton } from './_components/logout-button';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { BottomNav } from './_components/bottom-nav';

export default async function SalesDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex flex-col w-full h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Header / Greeting */}
      <header className="px-4 py-3 pt-safe bg-white flex flex-col shadow-sm z-10 relative border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm relative overflow-hidden text-primary">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">Halo, {session?.user?.name?.split(' ')[0] || 'Sales'}!</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell role="SALES" />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}
