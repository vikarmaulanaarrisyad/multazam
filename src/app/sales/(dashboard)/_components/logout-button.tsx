'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function LogoutButton() {
  const handleLogout = async () => {
    // Clear session storage just in case
    sessionStorage.clear();
    await signOut({ callbackUrl: '/sales/login' });
  };

  return (
    <button 
      onClick={handleLogout}
      className="relative p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
      title="Keluar"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
