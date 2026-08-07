import React from 'react';
import prisma from '@/lib/prisma';
import { ApprovalsClient, ApprovalTransaction } from '@/components/admin/ApprovalsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Persetujuan Harga - Admin Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function AdminApprovalsPage() {
  const transactions = await prisma.transaction.findMany({
    where: {
      status: {
        in: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED']
      }
    },
    include: {
      user: {
        select: {
          name: true,
        }
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  const serializedTransactions: ApprovalTransaction[] = transactions.map(tx => ({
    id: tx.id,
    invoiceNumber: tx.invoiceNumber,
    customerName: tx.customerName,
    dueDate: tx.dueDate,
    shippingAddress: tx.shippingAddress,
    shippingCost: tx.shippingCost ? Number(tx.shippingCost) : null,
    notes: tx.notes,
    adminNotes: tx.adminNotes,
    status: tx.status,
    createdAt: tx.createdAt,
    user: {
      name: tx.user?.name || null
    },
    items: tx.items.map(item => ({
      id: item.id,
      transactionId: item.transactionId,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      originalPrice: item.originalPrice ? Number(item.originalPrice) : Number(item.price),
      requestedPrice: Number(item.price),
    }))
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <ApprovalsClient transactions={serializedTransactions} />
    </div>
  );
}
