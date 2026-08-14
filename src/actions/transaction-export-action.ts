'use server';

import prisma from '@/lib/prisma';
import { TransactionDetail } from '@/components/admin/TransactionsClient';

export async function getTransactionsForExport(filters: {
  search?: string;
  tab?: string;
  startDate?: string;
  endDate?: string;
}) {
  const search = filters.search || '';
  const tab = filters.tab || 'PENDING_APPROVAL';
  const startDate = filters.startDate || '';
  const endDate = filters.endDate || '';

  let tabStatuses: string[] = [];
  switch (tab) {
    case 'PENDING_APPROVAL': tabStatuses = ['PENDING_APPROVAL']; break;
    case 'PENDING': tabStatuses = ['PENDING', 'APPROVED']; break;
    case 'SHIPPED': tabStatuses = ['SHIPPED']; break;
    case 'COMPLETED': tabStatuses = ['COMPLETED']; break;
    case 'CANCELLED': tabStatuses = ['CANCELLED', 'REJECTED']; break;
    default: tabStatuses = ['PENDING_APPROVAL', 'PENDING', 'APPROVED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED']; break;
  }

  const whereClause: any = {
    status: { in: tabStatuses }
  };

  if (search) {
    const searchFilter = {
      OR: [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
        { user: { name: { contains: search } } },
      ]
    };
    whereClause.OR = searchFilter.OR;
  }

  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    whereClause.createdAt = dateFilter;
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, contents: true, retailPriceNote: true } }
        }
      },
      paymentHistories: { orderBy: { createdAt: 'asc' } }
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

  return { success: true, data: serializedTransactions };
}
