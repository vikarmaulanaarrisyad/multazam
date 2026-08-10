import { TransactionRepository } from '../repositories/transaction.repository';
import { PreOrderSchema, PreOrderData, UpdateTransactionStatusDTO, CancelTransactionDTO, AddPaymentDTO } from '../types/transaction.type';

export class TransactionService {
  static async updateStatus(data: UpdateTransactionStatusDTO, userId: string, role: string) {
    const isSales = role === 'SALES';
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isAdmin && !isSales) {
      throw new Error('Unauthorized');
    }

    if (isSales && data.status !== 'COMPLETED') {
      throw new Error('Sales hanya diizinkan mengubah status menjadi selesai');
    }

    if (isSales) {
      const tx = await TransactionRepository.findById(data.transactionId);
      if (!tx || tx.userId !== userId) {
        throw new Error('Anda tidak memiliki akses ke pesanan ini');
      }
    }

    return TransactionRepository.updateStatus(data.transactionId, data.status, data.notes);
  }

  static async cancelTransaction(data: CancelTransactionDTO, userId: string, role: string) {
    if (!data.adminNotes || data.adminNotes.trim() === '') {
      throw new Error('Alasan pembatalan harus diisi.');
    }

    const transaction = await TransactionRepository.findById(data.transactionId);
    if (!transaction) {
      throw new Error('Pesanan tidak ditemukan');
    }

    if (role === 'SALES' && transaction.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return TransactionRepository.cancelTransaction(data.transactionId, data.adminNotes, userId);
  }

  static async removeItem(transactionId: string, itemId: string, userId: string, role: string) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized');
    }
    return TransactionRepository.removeItem(transactionId, itemId, userId);
  }

  static async addPayment(data: AddPaymentDTO, userId: string, role?: string) {
    const tx = await TransactionRepository.findById(data.transactionId);
    
    if (!tx) {
      throw new Error('Pesanan tidak ditemukan');
    }

    if (role === 'SALES' && tx.userId !== userId) {
      throw new Error('Unauthorized: Anda hanya bisa mengelola pembayaran untuk pesanan Anda sendiri.');
    }

    if (data.amount <= 0) {
      throw new Error('Jumlah pembayaran harus lebih dari 0.');
    }

    const remainingBill = Number(tx.totalAmount) - Number(tx.paidAmount);
    if (data.amount > remainingBill) {
      throw new Error(`Jumlah pembayaran melebihi sisa tagihan.`);
    }

    const newPaidAmount = Number(tx.paidAmount) + data.amount;
    let paymentStatus = 'PARTIAL';
    if (newPaidAmount >= Number(tx.totalAmount)) {
      paymentStatus = 'PAID';
    } else if (newPaidAmount <= 0) {
      paymentStatus = 'UNPAID';
    }

    return TransactionRepository.addPayment(
      data.transactionId, 
      data.amount, 
      newPaidAmount, 
      paymentStatus, 
      data.paymentMethod || 'CASH', 
      data.notes, 
      userId
    );
  }

  static async createPreOrder(data: PreOrderData, userId: string) {
    const parseResult = PreOrderSchema.safeParse(data);
    if (!parseResult.success) {
      throw new Error(parseResult.error.message);
    }
    return TransactionRepository.createPreOrder(parseResult.data, userId);
  }

  static async approvePriceRequest(data: { transactionId: string; adminNotes?: string; items: { id: string; approvedPrice: number }[] }, userId: string, role: string) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized');
    }
    return TransactionRepository.approvePriceRequest(data.transactionId, data.adminNotes, data.items);
  }

  static async rejectPriceRequest(data: { transactionId: string; adminNotes: string }, userId: string, role: string) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized');
    }
    if (!data.adminNotes || data.adminNotes.trim() === '') {
      throw new Error('Alasan penolakan harus diisi.');
    }
    return TransactionRepository.rejectPriceRequest(data.transactionId, data.adminNotes);
  }

  static async createPriceRequest(data: any, userId: string) {
    return TransactionRepository.createPriceRequest(data, userId);
  }
}
