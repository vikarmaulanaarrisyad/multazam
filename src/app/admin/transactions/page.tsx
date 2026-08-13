import React from 'react';
import prisma from '@/lib/prisma';
import { TransactionsClient, TransactionDetail } from '@/components/admin/TransactionsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Pesanan - Admin Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    where: {
      status: {
        in: ['PENDING_APPROVAL', 'PENDING', 'APPROVED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED']
      }
    },
    orderBy: {
      createdAt: 'desc',
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
              contents: true,
              retailPriceNote: true,
            }
          }
        }
      },
      paymentHistories: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  const serializedTransactions: TransactionDetail[] = transactions.map(tx => ({
    id: tx.id,
    invoiceNumber: tx.invoiceNumber,
    customerName: tx.customerName,
    customerPhone: tx.customerPhone,
    dueDate: tx.dueDate,
    deliveryDate: tx.deliveryDate,
    shippingAddress: tx.shippingAddress,
    shippingCost: tx.shippingCost ? Number(tx.shippingCost) : null,
    notes: tx.notes,
    adminNotes: tx.adminNotes,
    status: tx.status,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    latitude: tx.latitude,
    longitude: tx.longitude,
    totalAmount: Number(tx.totalAmount),
    paidAmount: Number(tx.paidAmount),
    paymentStatus: tx.paymentStatus,
    user: {
      name: tx.user?.name || null
    },
    items: tx.items.map(item => ({
      id: item.id,
      productName: item.product.name,
      contents: item.product.contents,
      retailPriceNote: item.product.retailPriceNote,
      quantity: item.quantity,
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : Number(item.price),
      unitNote: item.unitNote,
    })),
    paymentHistories: tx.paymentHistories.map(ph => ({
      id: ph.id,
      amount: Number(ph.amount),
      createdAt: ph.createdAt
    }))
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Pre-Order & Penjualan</h1>
        <p className="text-slate-500 mt-1 text-sm">Kelola status pesanan dari Sales, mulai dari pengiriman hingga selesai.</p>
      </div>

      <TransactionsClient transactions={serializedTransactions} />
    </div>
  );
}
