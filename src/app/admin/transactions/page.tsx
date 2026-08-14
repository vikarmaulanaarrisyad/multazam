import React from 'react';
import prisma from '@/lib/prisma';
import { TransactionsClient, TransactionDetail } from '@/components/admin/TransactionsClient';
import { AutoRefreshTimer } from '@/components/layout/AutoRefreshTimer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Pesanan - Admin Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
  const tab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'PENDING_APPROVAL';
  const startDate = typeof resolvedSearchParams.startDate === 'string' ? resolvedSearchParams.startDate : '';
  const endDate = typeof resolvedSearchParams.endDate === 'string' ? resolvedSearchParams.endDate : '';
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const pageSize = typeof resolvedSearchParams.pageSize === 'string' ? parseInt(resolvedSearchParams.pageSize, 10) : 10;

  const activePage = isNaN(page) || page < 1 ? 1 : page;
  const activePageSize = isNaN(pageSize) || pageSize < 1 ? 10 : pageSize;

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

  const globalWhereClause: any = {
    status: { in: ['PENDING_APPROVAL', 'PENDING', 'APPROVED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED'] }
  };

  if (search) {
    const searchFilter = {
      OR: [
        { invoiceNumber: { contains: search } }, // MySQL default is case-insensitive usually, but Prisma contains is insensitive for MySQL anyway unless defined differently. Let's just use contains.
        { customerName: { contains: search } },
        { user: { name: { contains: search } } },
      ]
    };
    whereClause.OR = searchFilter.OR;
    globalWhereClause.OR = searchFilter.OR;
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
    globalWhereClause.createdAt = dateFilter;
  }

  const [transactions, totalCount, groupByStatus] = await Promise.all([
    prisma.transaction.findMany({
      take: activePageSize,
      skip: (activePage - 1) * activePageSize,
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
    }),
    prisma.transaction.count({ where: whereClause }),
    prisma.transaction.groupBy({
      by: ['status'],
      _count: { status: true },
      where: globalWhereClause
    })
  ]);

  const statusCounts = {
    PENDING_APPROVAL: 0,
    PENDING: 0,
    SHIPPED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  groupByStatus.forEach(g => {
    if (g.status === 'PENDING_APPROVAL') statusCounts.PENDING_APPROVAL += g._count.status;
    else if (['PENDING', 'APPROVED'].includes(g.status)) statusCounts.PENDING += g._count.status;
    else if (g.status === 'SHIPPED') statusCounts.SHIPPED += g._count.status;
    else if (g.status === 'COMPLETED') statusCounts.COMPLETED += g._count.status;
    else if (['CANCELLED', 'REJECTED'].includes(g.status)) statusCounts.CANCELLED += g._count.status;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Pre-Order & Penjualan</h1>
            <AutoRefreshTimer intervalMinutes={5} />
          </div>
          <p className="text-slate-500 mt-1 text-sm">Kelola status pesanan dari Sales, mulai dari pengiriman hingga selesai.</p>
        </div>
      </div>

      <TransactionsClient 
        transactions={serializedTransactions} 
        totalCount={totalCount}
        statusCounts={statusCounts}
        initialPageSize={activePageSize}
      />
    </div>
  );
}
