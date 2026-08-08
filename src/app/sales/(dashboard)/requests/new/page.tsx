import React from 'react';
import { Metadata } from 'next';
import { PreOrderClient } from './_components/pre-order-client';
import { StoreRegistrationClient } from './_components/store-registration-client';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'New Pre-Order Request',
};

export default async function NewPreOrderPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const stores = await prisma.store.findMany({
    where: { userId: session?.user?.id },
    orderBy: { name: 'asc' }
  });

  // Jika belum punya toko sama sekali, paksa daftar
  if (stores.length === 0) {
    return (
      <div className="flex flex-col w-full h-full">
        <StoreRegistrationClient />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <PreOrderClient stores={stores} />
    </div>
  );
}
