import { purchaseRepository, PurchaseWithRelations } from '@/repositories/purchase.repository';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { createNotification } from '@/lib/createNotification';

async function generateInvoiceNumber(): Promise<string> {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const prefix = `PO-${dateStr}-`;
  
  const latestInvoice = await purchaseRepository.getLatestInvoiceNumber();
  
  if (latestInvoice && latestInvoice.startsWith(prefix)) {
    const sequence = parseInt(latestInvoice.replace(prefix, ''), 10);
    return `${prefix}${(sequence + 1).toString().padStart(4, '0')}`;
  }
  
  return `${prefix}0001`;
}

export const purchaseService = {
  async getPaginatedPurchases(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ success: boolean; data?: PurchaseWithRelations[]; metadata?: { total: number; pageCount: number }; message?: string }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await purchaseRepository.findPaginated(skip, limit, search);
      
      const pageCount = Math.ceil(total / limit);
      return { success: true, data, metadata: { total, pageCount } };
    } catch (error) {
      console.error('Failed to get paginated purchases:', error);
      return { success: false, message: 'Gagal memuat daftar pembelian.' };
    }
  },

  async createPurchase(dataInput: {
    supplierId: string;
    userId: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
  }): Promise<{ success: boolean; message: string; purchaseId?: string }> {
    try {
      if (!dataInput.items || dataInput.items.length === 0) {
        return { success: false, message: 'Minimal 1 produk harus ditambahkan.' };
      }

      const totalAmount = dataInput.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      const invoiceNumber = await generateInvoiceNumber();

      const purchase = await purchaseRepository.create({
        invoiceNumber,
        status: 'PENDING',
        notes: dataInput.notes,
        totalAmount: totalAmount,
        supplier: { connect: { id: dataInput.supplierId } },
        user: { connect: { id: dataInput.userId } },
        items: {
          create: dataInput.items.map(item => ({
            quantity: item.quantity,
            price: item.price,
            product: { connect: { id: item.productId } }
          }))
        }
      });

      // 🔔 Notifikasi ke ADMIN bahwa ada permintaan baru
      await createNotification(
        "Permintaan Barang Baru",
        `Pesanan #${invoiceNumber} menunggu persetujuan.`,
        "ADMIN"
      );
      
      // 🔔 Notifikasi ke SUPER_ADMIN juga
      await createNotification(
        "Permintaan Barang Baru",
        `Pesanan #${invoiceNumber} menunggu persetujuan.`,
        "SUPER_ADMIN"
      );

      return { success: true, message: 'Pesanan pembelian berhasil dibuat (Status: PENDING).', purchaseId: purchase.id };
    } catch (error) {
      console.error('Create purchase error:', error);
      return { success: false, message: 'Terjadi kesalahan sistem saat membuat pesanan pembelian.' };
    }
  },

  async completePurchase(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const purchase = await purchaseRepository.findById(id);
      
      if (!purchase) {
        return { success: false, message: 'Transaksi tidak ditemukan.' };
      }
      
      if (purchase.status === 'COMPLETED') {
        return { success: false, message: 'Transaksi ini sudah selesai.' };
      }
      if (purchase.status === 'CANCELLED') {
        return { success: false, message: 'Transaksi ini sudah dibatalkan.' };
      }

      // We need to use a transaction to ensure all stocks are updated safely
      await prisma.$transaction(async (tx) => {
        // 1. Update purchase status
        await tx.purchase.update({
          where: { id },
          data: { status: 'COMPLETED' }
        });

        // 2. Update stock and create stock movements
        for (const item of purchase.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          
          if (!product) continue;
          
          const newStock = product.stock + item.quantity;

          // Update stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock }
          });

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'IN',
              quantity: item.quantity,
              balanceBefore: product.stock,
              balanceAfter: newStock,
              reference: purchase.invoiceNumber,
              notes: `Restock dari supplier: ${purchase.supplier.name}`
            }
          });
        }
      });

      // 🔔 Notifikasi ke SALES bahwa permintaannya disetujui (COMPLETED)
      await createNotification(
        "Permintaan Disetujui ✅",
        `Pesanan #${purchase.invoiceNumber} telah disetujui dan stok ditambahkan.`,
        "SALES"
      );

      // 🔔 Notifikasi ke ADMIN dan SUPER_ADMIN sebagai arsip persetujuan
      await createNotification(
        "Permintaan Disetujui ✅",
        `Pesanan #${purchase.invoiceNumber} telah selesai diproses.`,
        "ADMIN"
      );
      await createNotification(
        "Permintaan Disetujui ✅",
        `Pesanan #${purchase.invoiceNumber} telah selesai diproses.`,
        "SUPER_ADMIN"
      );

      return { success: true, message: 'Pembelian selesai. Stok telah diperbarui.' };
    } catch (error) {
      console.error('Complete purchase error:', error);
      return { success: false, message: 'Gagal menyelesaikan pembelian dan menambah stok.' };
    }
  },

  async cancelPurchase(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const purchase = await purchaseRepository.findById(id);
      
      if (!purchase) {
        return { success: false, message: 'Transaksi tidak ditemukan.' };
      }
      
      if (purchase.status === 'COMPLETED') {
        return { success: false, message: 'Transaksi sudah selesai tidak bisa dibatalkan.' };
      }

      await purchaseRepository.updateStatus(id, 'CANCELLED');
      return { success: true, message: 'Pembelian berhasil dibatalkan.' };
    } catch (error) {
      console.error('Cancel purchase error:', error);
      return { success: false, message: 'Gagal membatalkan pembelian.' };
    }
  }
};
