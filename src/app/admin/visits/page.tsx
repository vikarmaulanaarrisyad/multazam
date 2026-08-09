import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSalesUsers, getAllVisits, getMapLocations } from '@/actions/admin-visit-actions';
import { VisitsAdminClient } from '@/components/admin/VisitsAdminClient';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Kunjungan Sales | DIA MAKMUR ABADI',
};

export default async function AdminVisitsPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const [salesUsers, allVisits, mapLocations, setting] = await Promise.all([
    getSalesUsers(),
    getAllVisits(),
    getMapLocations(),
    prisma.setting.findUnique({ where: { id: "1" } })
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

  const officeLocation = setting?.officeLat && setting?.officeLng 
    ? { lat: setting.officeLat, lng: setting.officeLng } 
    : undefined;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <VisitsAdminClient 
        salesUsers={salesUsers} 
        allVisits={allVisits} 
        mapLocations={mapLocations}
        initialStoresBySales={initialStoresBySales}
        officeLocation={officeLocation}
      />
    </div>
  );
}
