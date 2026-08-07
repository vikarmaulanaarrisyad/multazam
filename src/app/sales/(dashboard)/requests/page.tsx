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
        in: ['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'SHIPPED', 'COMPLETED', 'REJECTED']
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      items: {
        include: {
          product: {
            select: { name: true }
          }
        }
      },
      paymentHistories: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  // Convert Decimal to number for Client Component
  const serializedRequests = transactions.map(t => ({
    id: t.id,
    invoiceNumber: t.invoiceNumber,
    customerName: t.customerName,
    dueDate: t.dueDate,
    totalAmount: Number(t.totalAmount),
    paidAmount: Number(t.paidAmount),
    paymentStatus: t.paymentStatus,
    shippingCost: t.shippingCost ? Number(t.shippingCost) : 0,
    status: t.status,
    adminNotes: t.adminNotes,
    createdAt: t.createdAt,
    items: t.items.map(item => ({
      id: item.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : Number(item.price),
    })),
    paymentHistories: t.paymentHistories.map(ph => ({
      id: ph.id,
      amount: Number(ph.amount),
      createdAt: ph.createdAt
    }))
  }));

  return <RequestsClient requests={serializedRequests as any} />;
}
