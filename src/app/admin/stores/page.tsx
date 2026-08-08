import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { StoresClient } from './_components/StoresClient';

export const metadata: Metadata = {
  title: 'Data Toko - Admin Dashboard',
};

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Toko</h1>
        <p className="text-slate-500 mt-1 text-sm">Kelola dan pantau data toko atau pelanggan yang didaftarkan oleh tim Sales.</p>
      </div>

      <StoresClient stores={stores} />
    </div>
  );
}
