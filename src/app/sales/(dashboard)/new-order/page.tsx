import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NewOrderStoreClient } from './_components/new-order-store-client';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Pilih Toko - DIA MAKMUR ABADI',
  description: 'Pilih pelanggan/toko untuk pesanan baru',
};

export default async function NewOrderPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Fetch unique stores associated with this user's past transactions
  const stores = await prisma.store.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      ownerName: true,
      phone: true,
      address: true,
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <NewOrderStoreClient stores={stores} />
    </div>
  );
}
