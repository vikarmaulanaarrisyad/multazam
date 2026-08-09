import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import VisitsClient from './_components/visits-client';

export const dynamic = 'force-dynamic';

export default async function VisitsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const visits = await prisma.visit.findMany({
    where: {
      store: { userId: session.user.id },
    },
    select: {
      id: true,
      scheduledAt: true,
      address: true,
      status: true,
      notes: true,
      store: {
        select: { name: true }
      }
    },
    orderBy: { scheduledAt: 'desc' },
  });

  // Serialize dates for client component
  const serializedVisits = visits.map(v => ({
    id: v.id,
    storeName: v.store.name,
    scheduledAt: v.scheduledAt.toISOString(),
    address: v.address,
    status: v.status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
    notes: v.notes,
  }));
  return <VisitsClient visits={serializedVisits} />;
}
