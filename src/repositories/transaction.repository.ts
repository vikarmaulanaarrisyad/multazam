import prisma from '@/lib/prisma';
import { PreOrderData, UpdateTransactionStatusDTO, CancelTransactionDTO, AddPaymentDTO } from '../types/transaction.type';
import { calculateBaseQuantity } from '../utils/inventory';

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

    const dpAmount = Number(data.dpAmount ?? 0);

    return prisma.$transaction(async (tx) => {
      let totalAmount = data.shippingCost || 0;
      let totalOriginalAmount = data.shippingCost || 0;

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        
        const realOriginalPrice = Number(product.price);
        item.originalPrice = realOriginalPrice;
        
        totalAmount += (item.price * item.quantity);
        totalOriginalAmount += (realOriginalPrice * item.quantity);
      }

      const isPriceProposal = totalAmount < totalOriginalAmount;
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
          notes: data.paymentMethod ? `[Metode: ${data.paymentMethod}]\n${data.notes || ''}`.trim() : data.notes,
          latitude: data.latitude,
          longitude: data.longitude,
          paidAmount: dpAmount,
          paymentStatus: (dpAmount && dpAmount >= Number(totalAmount)) ? 'PAID' : (dpAmount && dpAmount > 0) ? 'PARTIAL' : 'UNPAID',
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              originalPrice: item.originalPrice || item.price,
              unitNote: item.unitNote || null
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
            paymentMethod: data.paymentMethod || 'CASH', // Use selected method or default
            notes: 'Uang Muka (DP) saat pembuatan pesanan',
            userId: userId
          }
        });
      }

      // 2. Deduct stock for each item and record StockMovement
      for (const item of data.items) {
        if (!item.productId) throw new Error('ID Produk tidak valid pada salah satu pesanan.');

        const product = await tx.product.findUnique({ 
          where: { id: item.productId },
          include: { unitConversions: true } 
        });
        if (!product) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        
        if ((product as any).salesMode === 'REVIEW') {
          throw new Error(`Produk ${product.name} belum bisa ditransaksikan (Status: REVIEW).`);
        }
        
        if ((product as any).salesMode === 'WHOLESALE_ONLY') {
          const expectedUnit = (product as any).purchaseUnit || 'DUS';
          const orderUnit = item.unitNote || expectedUnit;
          if (orderUnit.toUpperCase() !== expectedUnit.toUpperCase()) {
            throw new Error(`Produk ${product.name} hanya bisa dijual Grosir (${expectedUnit}).`);
          }
        }
        
        const baseQtyToDeduct = calculateBaseQuantity(item.quantity, item.unitNote || (product as any).purchaseUnit, product);

        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: baseQtyToDeduct } },
          data: { stock: { decrement: baseQtyToDeduct } }
        });
        if (updated.count === 0) throw new Error(`Stok produk ${product.name} tidak mencukupi.`);

        const updatedProduct = await tx.product.findUnique({ where: { id: item.productId } });
        if (!updatedProduct) throw new Error(`Produk dengan ID ${item.productId} hilang setelah update.`);

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: baseQtyToDeduct,
            balanceBefore: updatedProduct.stock + baseQtyToDeduct,
            balanceAfter: updatedProduct.stock,
            reference: invoiceNumber,
            notes: isPriceProposal ? `Booking (Menunggu Persetujuan) - Order: ${item.quantity} ${item.unitNote || 'PCS'}` : `Penjualan / Pre-Order - Order: ${item.quantity} ${item.unitNote || 'PCS'}`,
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
      // 1. Atomic check and update to prevent Double Cancel
      const updateResult = await tx.transaction.updateMany({
        where: { id: transactionId, status: { not: 'CANCELLED' } },
        data: {
          status: 'CANCELLED',
          adminNotes: adminNotes,
        }
      });

      if (updateResult.count === 0) {
        throw new Error('Pesanan sudah dibatalkan atau tidak ditemukan (Proses ganda dicegah).');
      }

      // 2. Fetch transaction items to return stock
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true }
      });

      if (!transaction) throw new Error('Pesanan tidak ditemukan');

      for (const item of transaction.items) {
        const product = await tx.product.findUnique({ 
          where: { id: item.productId },
          include: { unitConversions: true } 
        });
        if (!product) continue;

        const baseQtyToReturn = calculateBaseQuantity(item.quantity, item.unitNote, product);

        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: baseQtyToReturn } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: baseQtyToReturn,
            balanceBefore: updatedProduct.stock - baseQtyToReturn,
            balanceAfter: updatedProduct.stock,
            reference: transaction.invoiceNumber,
            notes: `Pengembalian stok pesanan batal: ${adminNotes} - Order: ${item.quantity} ${item.unitNote || 'PCS'}`,
            userId: userId
          }
        });
      }
    }, { maxWait: 10000, timeout: 20000 });
  }

  static async removeItem(transactionId: string, itemId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true }
      });
      if (!transaction) throw new Error('Pesanan tidak ditemukan');

      const itemToRemove = transaction.items.find(item => item.id === itemId);
      if (!itemToRemove) throw new Error('Item tidak ditemukan di pesanan ini');

      if (transaction.items.length <= 1) {
        throw new Error('Tidak bisa menghapus item terakhir. Batalkan pesanan saja.');
      }

      const product = await tx.product.findUnique({ 
        where: { id: itemToRemove.productId },
        include: { unitConversions: true }
      });

      // Atomic delete to prevent double remove
      const deleteResult = await tx.transactionItem.deleteMany({
        where: { id: itemId }
      });

      if (deleteResult.count === 0) {
        throw new Error('Item sudah terhapus oleh proses lain.');
      }

      if (product) {
        const baseQtyToReturn = calculateBaseQuantity(itemToRemove.quantity, itemToRemove.unitNote, product);

        const updatedProduct = await tx.product.update({
          where: { id: itemToRemove.productId },
          data: { stock: { increment: baseQtyToReturn } }
        });
        await tx.stockMovement.create({
          data: {
            productId: itemToRemove.productId,
            type: 'IN',
            quantity: baseQtyToReturn,
            balanceBefore: updatedProduct.stock - baseQtyToReturn,
            balanceAfter: updatedProduct.stock,
            reference: transaction.invoiceNumber,
            notes: `Pengembalian stok pesanan (Item dihapus) - Order: ${itemToRemove.quantity} ${itemToRemove.unitNote || 'PCS'}`,
            userId: userId
          }
        });
      }

      const newTotalAmount = Number(transaction.totalAmount) - (Number(itemToRemove.price) * itemToRemove.quantity);
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          totalAmount: newTotalAmount
        }
      });
      return true;
    }, { maxWait: 10000, timeout: 20000 });
  }

  static async addPayment(transactionId: string, amount: number, paymentMethod: string, notes: string | undefined, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Atomic check to prevent race condition
      const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!transaction) throw new Error('Transaksi tidak ditemukan.');
      
      const remainingBill = Number(transaction.totalAmount) - Number(transaction.paidAmount);
      if (amount > remainingBill) {
        throw new Error(`Jumlah pembayaran (${amount}) melebihi sisa tagihan (${remainingBill}).`);
      }

      const newPaidAmount = Number(transaction.paidAmount) + amount;
      let paymentStatus = 'PARTIAL';
      if (newPaidAmount >= Number(transaction.totalAmount)) {
        paymentStatus = 'PAID';
      } else if (newPaidAmount <= 0) {
        paymentStatus = 'UNPAID';
      }

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
          where: { id: item.productId },
          include: { unitConversions: true }
        });

        if (!product) continue;

        const baseQtyToReturn = calculateBaseQuantity(item.quantity, item.unitNote, product);

        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: baseQtyToReturn } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: baseQtyToReturn,
            balanceBefore: updatedProduct.stock - baseQtyToReturn,
            balanceAfter: updatedProduct.stock,
            reference: transaction.invoiceNumber,
            notes: `Pengembalian Stok (Pengajuan Ditolak) - Order: ${item.quantity} ${item.unitNote || 'PCS'}`,
            userId: transaction.userId
          }
        });
      }
    });
  }

}
