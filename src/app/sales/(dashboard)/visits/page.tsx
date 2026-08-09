import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import VisitsClient from './_components/visits-client';
import { Visit } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

export default async function VisitsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  // Fetch visits for stores belonging to the current sales user
  const visits: Visit[] = await prisma.visit.findMany({
    where: {
      store: { userId: session.user.id },
    },
    select: {
      id: true,
      scheduledAt: true,
      address: true,
      status: true,
      notes: true,
      storeId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });

  // Serialize dates for client component
  const serializedVisits = visits.map(v => ({
    ...v,
    scheduledAt: v.scheduledAt.toISOString(),
  }));
  return <VisitsClient visits={serializedVisits} />;
}
