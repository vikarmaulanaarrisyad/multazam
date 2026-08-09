import React from 'react';
import { auth, signOut } from '@/auth';
import { User, Mail, Shield, LogOut } from 'lucide-react';

export const metadata = {
  title: 'Profil Saya - DIA MAKMUR ABADI',
};

export default async function SalesProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-slate-500">Sesi telah berakhir. Silakan login kembali.</p>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-primary text-primary-foreground p-6 pb-12 rounded-b-3xl shadow-sm">
        <h1 className="text-2xl font-bold">Profil Saya</h1>
        <p className="opacity-80 text-sm mt-1">Kelola akun dan sesi Anda</p>
      </div>

      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
            <span className="text-3xl font-bold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold mt-2 uppercase tracking-wider">
            {user.role?.replace('_', ' ') || 'SALES'}
          </span>
        </div>
      </div>

      <div className="p-4 mt-2 flex-1">
        <div className="bg-white rounded-2xl shadow-sm border divide-y divide-slate-100">
          <div className="flex items-center p-4 gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium">Nama Lengkap</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <Mail size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium">Alamat Email</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center p-4 gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <Shield size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium">Hak Akses</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{user.role?.replace('_', ' ') || 'SALES'}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors active:scale-[0.98]"
            >
              <LogOut size={20} />
              <span>Keluar dari Aplikasi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
