import React from 'react';
import type { Metadata } from 'next';
import { auth, signOut } from '@/auth';
import prisma from '@/lib/prisma';
import { LogOut, Activity, Wallet, TrendingUp, Shield, Smartphone, HelpCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Profil Saya',
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

  // 1. Tanggal hari ini untuk filter visits
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 2. Ambil data kunjungan hari ini
  const totalVisitsToday = await prisma.visit.count({
    where: {
      store: { userId: user.id },
      scheduledAt: { gte: today, lt: tomorrow }
    }
  });

  const completedVisitsToday = await prisma.visit.count({
    where: {
      store: { userId: user.id },
      scheduledAt: { gte: today, lt: tomorrow },
      status: 'COMPLETED'
    }
  });

  // 3. Ambil data total penjualan sales ini
  const salesResult = await prisma.transaction.aggregate({
    _sum: { totalAmount: true },
    where: {
      userId: user.id,
      status: 'COMPLETED'
    }
  });
  
  const totalSales = Number(salesResult._sum.totalAmount || 0);
  const formattedSales = totalSales >= 1000000 
    ? `${(totalSales / 1000000).toFixed(1)}M` 
    : totalSales >= 1000 
      ? `${(totalSales / 1000).toFixed(1)}K` 
      : totalSales.toString();

  // 4. Kalkulasi Performa
  const performance = totalVisitsToday > 0 
    ? Math.round((completedVisitsToday / totalVisitsToday) * 100) 
    : 100; // default 100% jika belum ada jadwal

  const setting = await prisma.setting.findFirst();

  return (
    <div className="flex flex-col w-full pb-20 font-sans">
      <div className="relative w-full pb-8 bg-blue-50/50">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent"></div>
        <div className="relative flex flex-col items-center pt-8 px-4">
          <div className="w-24 h-24 rounded-full shadow-md overflow-hidden mb-4 ring-4 ring-white bg-white flex items-center justify-center text-primary">
            <span className="text-4xl font-bold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h2>
          <p className="text-sm text-slate-500 mb-4 uppercase tracking-wide font-medium">{user.role?.replace('_', ' ') || 'SALES REPRESENTATIVE'}</p>
          <Link href="/sales/profile/edit" className="bg-primary text-white font-semibold text-sm px-6 py-2 rounded-full shadow-sm hover:bg-primary/90 transition-colors">
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
            <Activity className="text-primary mb-1 w-5 h-5" />
            <span className="text-lg font-bold text-slate-900">{completedVisitsToday}/{totalVisitsToday}</span>
            <span className="text-[11px] font-semibold text-slate-500 mt-1">Visits Today</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
            <Wallet className="text-green-600 mb-1 w-5 h-5" />
            <span className="text-lg font-bold text-slate-900">{formattedSales}</span>
            <span className="text-[11px] font-semibold text-slate-500 mt-1">Total Sales</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
            <TrendingUp className="text-primary mb-1 w-5 h-5" />
            <span className="text-lg font-bold text-slate-900">{performance}%</span>
            <span className="text-[11px] font-semibold text-slate-500 mt-1">Performance</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-8">
        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Akun & Pengaturan</h3>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <button className="flex items-center w-full p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center mr-4">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-900">Keamanan Akun</div>
              <div className="text-xs text-slate-500 font-medium">Kata Sandi, PIN, 2FA</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          <button className="flex items-center w-full p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center mr-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-900">Pengaturan Perangkat</div>
              <div className="text-xs text-slate-500 font-medium">Biometrik, Notifikasi</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
          <Link href="/sales/profile/support" className="flex items-center w-full p-4 hover:bg-slate-50 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center mr-4">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-900">Bantuan & Dukungan</div>
              <div className="text-xs text-slate-500 font-medium">FAQ, Hubungi kami</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
        </div>
      </div>

      <div className="px-4 mt-6">
        <form
          action={async () => {
            'use server';
            await signOut();
          }}
        >
          <button
            type="submit"
            className="flex items-center w-full p-4 bg-red-50 text-red-600 rounded-xl shadow-sm hover:bg-red-100 transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-bold flex-1 text-left">Keluar Akun</span>
          </button>
        </form>
      </div>

      <div className="mt-8 pb-8 flex justify-center">
        <span className="text-[11px] font-medium text-slate-400">v1.0.0 (Build 001) - {setting?.companyName || 'DIA MAKMUR ABADI'}</span>
      </div>
    </div>
  );
}
