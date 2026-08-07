import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import RequestsClient from './_components/requests-client';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  // Fetch transactions for the current sales user
  // Exclude completed or cancelled ones if needed, 
  // but let's fetch all except CANCELLED/COMPLETED for the requests dashboard
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      status: {
        in: ['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Convert Decimal to number for Client Component
  const serializedRequests = transactions.map(t => ({
    id: t.id,
    invoiceNumber: t.invoiceNumber,
    customerName: t.customerName,
    dueDate: t.dueDate,
    totalAmount: Number(t.totalAmount),
    status: t.status
  }));

  return <RequestsClient requests={serializedRequests} />;
}
