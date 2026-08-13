'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export type DeliveryRecapItem = {
  productId: string;
  code: string;
  name: string;
  contents: string | null;
  totalQuantity: number;
  currentStock: number;
};

export async function getDeliveryRecapAction(dateString: string): Promise<{ success: boolean; data?: DeliveryRecapItem[]; error?: string }> {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    // Tentukan rentang waktu (00:00:00 hingga 23:59:59 pada zona UTC agar aman menutupi tanggal tersebut)
    const targetDate = new Date(dateString);
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // Ambil transaksi yang pengirimannya dijadwalkan pada hari tersebut dan status valid
    const transactions = await prisma.transaction.findMany({
      where: {
        deliveryDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'COMPLETED', 'APPROVED'], 
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (transactions.length === 0) {
      return { success: true, data: [] };
    }

    // Map untuk agregasi kuantitas
    const recapMap = new Map<string, DeliveryRecapItem>();

    for (const tx of transactions) {
      for (const item of tx.items) {
        const prod = item.product;
        if (recapMap.has(prod.id)) {
          const existing = recapMap.get(prod.id)!;
          existing.totalQuantity += item.quantity;
        } else {
          recapMap.set(prod.id, {
            productId: prod.id,
            code: prod.code,
            name: prod.name,
            contents: prod.contents,
            totalQuantity: item.quantity,
            currentStock: prod.stock
          });
        }
      }
    }

    // Ubah map menjadi array dan urutkan berdasarkan nama barang
    const recapArray = Array.from(recapMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, data: recapArray };

  } catch (error: any) {
    console.error('Error fetching delivery recap:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat memuat rekap.' };
  }
}
