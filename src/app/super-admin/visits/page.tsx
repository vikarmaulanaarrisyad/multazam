import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSalesUsers, getAllVisits, getMapLocations } from '@/actions/admin-visit-actions';
import { VisitsAdminClient } from '@/components/admin/VisitsAdminClient';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Kunjungan Sales | DIA MAKMUR ABADI',
};

export default async function SuperAdminVisitsPage() {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  const [salesUsers, allVisits, mapLocations] = await Promise.all([
    getSalesUsers(),
    getAllVisits(),
    getMapLocations(),
  ]);

  // Pre-fetch stores grouped by sales for the dropdown
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, address: true, userId: true },
    orderBy: { name: 'asc' }
  });
  
  const initialStoresBySales: Record<string, any[]> = {};
  stores.forEach(s => {
    if (!initialStoresBySales[s.userId]) initialStoresBySales[s.userId] = [];
    initialStoresBySales[s.userId].push(s);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <VisitsAdminClient 
        salesUsers={salesUsers} 
        allVisits={allVisits} 
        mapLocations={mapLocations}
        initialStoresBySales={initialStoresBySales}
      />
    </div>
  );
}
