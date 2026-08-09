import prisma from '@/lib/prisma';
import { PreOrderData, UpdateTransactionStatusDTO, CancelTransactionDTO, AddPaymentDTO } from '../types/transaction.type';

export class TransactionRepository {
  
  static async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: { items: true }
    });
  }

  static async findByIdWithSelect(id: string, selectFields: any) {
    return prisma.transaction.findUnique({
      where: { id },
      select: selectFields
    });
  }

  static async updateStatus(id: string, status: string, notes?: string) {
    return prisma.transaction.update({
      where: { id },
      data: {
        status,
        ...(notes ? { adminNotes: notes } : {})
      }
    });
  }

  static async createPreOrder(data: PreOrderData, userId: string) {
    // Generate unique Invoice Number using atomic upsert on InvoiceCounter
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counter = await prisma.$transaction(async (tx) => {
      return await tx.invoiceCounter.upsert({
        where: { date: dateStr },
        update: { counter: { increment: 1 } },
        create: { date: dateStr, counter: 1 },
      });
    });
    const invoiceNumber = `PO-${dateStr}-${counter.counter.toString().padStart(4, '0')}`;

    const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (data.shippingCost || 0);
    const totalOriginalAmount = data.items.reduce((sum, item) => sum + ((item.originalPrice ?? item.price) * item.quantity), 0) + (data.shippingCost || 0);
    
    const isPriceProposal = totalAmount < totalOriginalAmount;
    const dpAmount = Number(data.dpAmount ?? 0);

    return prisma.$transaction(async (tx) => {
      // 0. Auto-save new store if it doesn't exist
      if (data.customerName) {
        const existingStore = await tx.store.findFirst({
          where: { userId: userId, name: data.customerName }
        });

        if (!existingStore) {
          await tx.store.create({
            data: {
              userId: userId,
              name: data.customerName,
              ownerName: data.ownerName || data.customerName,
              phone: data.customerPhone || null,
              address: data.shippingAddress || '',
              latitude: data.latitude,
              longitude: data.longitude
            }
          });
        }
      }

      // 1. Create the Transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          userId: userId,
          totalAmount,
          status: isPriceProposal ? 'PENDING_APPROVAL' : 'PENDING',
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress || null,
          shippingCost: data.shippingCost || null,
          dueDate: data.dueDate,
          notes: data.notes,
          latitude: data.latitude,
          longitude: data.longitude,
          paidAmount: dpAmount,
          paymentStatus: (dpAmount && dpAmount >= Number(totalAmount)) ? 'PAID' : (dpAmount && dpAmount > 0) ? 'PARTIAL' : 'UNPAID',
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              originalPrice: item.originalPrice || item.price
            }))
          }
        }
      });

      // 1.2 If this is a clone, mark the old transaction as reordered
      if (data.clonedFromId) {
        await tx.transaction.update({
          where: { id: data.clonedFromId },
          data: { hasBeenReordered: true }
        });
      }

      // 1.5 Record DP in PaymentHistory if there's any
      if (dpAmount > 0) {
        await tx.paymentHistory.create({
          data: {
            transactionId: newTransaction.id,
            amount: dpAmount,
            paymentMethod: 'CASH', // default for DP via Sales App
            notes: 'Uang Muka (DP) saat pembuatan pesanan',
            userId: userId
          }
        });
      }

      // 2. Deduct stock for each item and record StockMovement
      for (const item of data.items) {
        if (!item.productId) throw new Error('ID Produk tidak valid pada salah satu pesanan.');

        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        });
        if (updated.count === 0) throw new Error(`Stok produk ${product.name} tidak mencukupi.`);

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            balanceBefore: product.stock,
            balanceAfter: product.stock - item.quantity,
            reference: invoiceNumber,
            notes: isPriceProposal ? 'Booking (Menunggu Persetujuan)' : 'Penjualan / Pre-Order',
            userId: userId
          }
        });
      }

      return newTransaction;
    }, {
      maxWait: 10000,
      timeout: 20000
    });
  }

  static async cancelTransaction(transactionId: string, adminNotes: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true }
      });

      if (!transaction) throw new Error('Pesanan tidak ditemukan');

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'CANCELLED',
          adminNotes: adminNotes,
        }
      });

      for (const item of transaction.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            balanceBefore: product.stock,
            balanceAfter: product.stock + item.quantity,
            reference: transaction.invoiceNumber,
            notes: `Pengembalian stok dari pesanan dibatalkan: ${adminNotes}`,
            userId: userId
          }
        });
      }
    }, { maxWait: 10000, timeout: 20000 });
  }

  static async addPayment(transactionId: string, amount: number, newPaidAmount: number, paymentStatus: string, paymentMethod: string, notes: string | undefined, userId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.paymentHistory.create({
        data: {
          transactionId: transactionId,
          amount: amount,
          paymentMethod: paymentMethod,
          notes: notes,
          userId: userId
        }
      });

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: paymentStatus
        }
      });
    });
  }

  static async approvePriceRequest(transactionId: string, adminNotes: string | undefined, items: { id: string; approvedPrice: number }[]) {
    return prisma.$transaction(async (tx) => {
      let newTotalAmount = 0;
      for (const item of items) {
        const updatedItem = await tx.transactionItem.update({
          where: { id: item.id },
          data: { price: item.approvedPrice }
        });
        newTotalAmount += (Number(updatedItem.price) * updatedItem.quantity);
      }

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'APPROVED',
          adminNotes: adminNotes || null,
          totalAmount: newTotalAmount,
        }
      });
    });
  }

  static async rejectPriceRequest(transactionId: string, adminNotes: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true }
      });

      if (!transaction) throw new Error('Transaction not found');

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'REJECTED',
          adminNotes: adminNotes,
        }
      });

      for (const item of transaction.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) continue;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            balanceBefore: product.stock,
            balanceAfter: product.stock + item.quantity,
            reference: transaction.invoiceNumber,
            notes: 'Pengembalian Stok (Pengajuan Ditolak)',
            userId: transaction.userId
          }
        });
      }
    });
  }

  static async createPriceRequest(data: any, userId: string) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counter = await prisma.$transaction(async (tx) => {
      return await tx.invoiceCounter.upsert({
        where: { date: dateStr },
        update: { counter: { increment: 1 } },
        create: { date: dateStr, counter: 1 },
      });
    });
    const invoiceNumber = `REQ-${dateStr}-${counter.counter.toString().padStart(4, '0')}`;

    const totalAmount = data.items.reduce((sum: number, item: any) => sum + (item.requestedPrice * item.quantity), 0);

    return prisma.transaction.create({
      data: {
        invoiceNumber,
        userId: userId,
        totalAmount,
        status: 'PENDING_APPROVAL',
        customerName: data.storeName,
        customerPhone: data.storeLocation,
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.requestedPrice,
            originalPrice: item.originalPrice
          }))
        }
      }
    });
  }
}
